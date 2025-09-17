import { GoogleGenAI, Content } from "@google/genai";

export interface Env {
  GOOGLE_API_KEY: string;
  R2_BUCKET: R2Bucket;
  PAYLOAD_STORE: DurableObjectNamespace;
}

// Helper function for retry logic with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function fileToBase64Data(file: File): Promise<{ data: string; mimeType: string }> {
  const arrayBuffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return {
    data: btoa(binary),
    mimeType: file.type || "image/png",
  };
}

export class PayloadStore {
  private readonly state: DurableObjectState;
  private readonly schemaReady: Promise<void>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.schemaReady = this.initializeSchema();
  }

  private async initializeSchema(): Promise<void> {
    this.state.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS payloads (id TEXT PRIMARY KEY, data TEXT NOT NULL)'
    );
  }

  async fetch(request: Request): Promise<Response> {
    await this.schemaReady;
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);

    if (segments[0] !== 'data') {
      return new Response('Not Found', { status: 404 });
    }

    const recordId = segments[1];
    if (!recordId) {
      return Response.json({ error: 'Record id is required' }, { status: 400 });
    }

    if (request.method === 'PUT') {
      const contentType = request.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return Response.json({ error: 'Content-Type must be application/json' }, { status: 400 });
      }

      let payload: unknown;
      try {
        payload = await request.json();
      } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
      }

      let serialized: string;
      try {
        serialized = JSON.stringify(payload);
      } catch {
        return Response.json(
          { error: 'Payload must be JSON serializable' },
          { status: 400 },
        );
      }

      try {
        this.state.storage.sql.exec(
          'INSERT INTO payloads (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',
          recordId,
          serialized,
        );
        return Response.json({ success: true });
      } catch (error) {
        console.error('Failed to store payload in Durable Object:', error);
        return Response.json(
          { error: 'Failed to store payload' },
          { status: 500 },
        );
      }
    }

    if (request.method === 'GET') {
      try {
        const rows = this.state.storage.sql
          .exec<{ data: string | null }>('SELECT data FROM payloads WHERE id = ?', recordId)
          .toArray();

        if (rows.length === 0 || rows[0].data == null) {
          return Response.json({ error: 'Not found' }, { status: 404 });
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(rows[0].data);
        } catch (error) {
          console.error('Failed to parse stored payload:', error);
          return Response.json(
            { error: 'Stored payload is corrupted' },
            { status: 500 },
          );
        }

        return Response.json(parsed);
      } catch (error) {
        console.error('Failed to retrieve payload from Durable Object:', error);
        return Response.json(
          { error: 'Failed to retrieve payload' },
          { status: 500 },
        );
      }
    }

    return new Response('Not Found', { status: 404 });
  }
}

// Import built static files
import staticFiles from './static-files';

// CORS helpers
function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function withCors(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  const cors = getCorsHeaders(request);
  Object.entries(cors).forEach(([k, v]) => headers.set(k, v));
  return new Response(response.body, { status: response.status, headers });
}

async function fetchImageFromUrl(imageUrl: string): Promise<File> {
  try {
    // Validate URL
    const url = new URL(imageUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are supported');
    }
    
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    // Check content type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      throw new Error(`URL does not point to an image. Content-Type: ${contentType}`);
    }
    
    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    
    // Extract filename from URL or use a default
    const pathname = url.pathname;
    const filename = pathname.split('/').pop() || 'image';
    
    // Create a File object
    const file = new File([imageBuffer], filename, {
      type: contentType,
      lastModified: Date.now()
    });
    
    return file;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch image from URL: ${error.message}`);
    }
    throw new Error('Failed to fetch image from URL: Unknown error');
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle API routes
    if (url.pathname.startsWith('/api/') || url.pathname === '/generate') {
      // Handle preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: getCorsHeaders(request) });
      }
      const apiResp = await handleApiRequest(request, env);
      return withCors(apiResp, request);
    }
    
    // Serve static files
    const staticResponse = await serveStaticFile(url.pathname);
    if (staticResponse) {
      return staticResponse;
    }
    
    // Fallback to index.html for client-side routing
    const indexResponse = await serveStaticFile('/index.html');
    return indexResponse || new Response('Not Found', { status: 404 });
  },
};

async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === '/api/payloads' && request.method === 'POST') {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return Response.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 },
      );
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return Response.json(
        { error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    const recordId = crypto.randomUUID();
    const durableId = env.PAYLOAD_STORE.idFromName('payload-db');
    const stub = env.PAYLOAD_STORE.get(durableId);
    const stubResponse = await stub.fetch(`https://payload-store.internal/data/${recordId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!stubResponse.ok) {
      const errorText = await stubResponse.text();
      return Response.json(
        {
          error: 'Failed to save payload',
          details: errorText || undefined,
        },
        { status: 500 },
      );
    }

    return Response.json(
      {
        id: recordId,
        payload,
      },
      { status: 201 },
    );
  }

  if (url.pathname.startsWith('/api/payloads/') && request.method === 'GET') {
    const id = url.pathname.slice('/api/payloads/'.length);
    if (!id) {
      return Response.json(
        { error: 'Payload id is required' },
        { status: 400 },
      );
    }

    const durableId = env.PAYLOAD_STORE.idFromName('payload-db');
    const stub = env.PAYLOAD_STORE.get(durableId);
    const stubResponse = await stub.fetch(`https://payload-store.internal/data/${id}`, {
      method: 'GET',
    });

    if (stubResponse.status === 404) {
      return Response.json(
        { error: 'Payload not found' },
        { status: 404 },
      );
    }

    if (!stubResponse.ok) {
      const errorText = await stubResponse.text();
      return Response.json(
        {
          error: 'Failed to retrieve payload',
          details: errorText || undefined,
        },
        { status: 500 },
      );
    }

    let payloadResponse: unknown;
    try {
      payloadResponse = await stubResponse.json();
    } catch {
      return Response.json(
        { error: 'Unexpected response from storage' },
        { status: 500 },
      );
    }

    return Response.json({ id, payload: payloadResponse });
  }

  // New: batch text-to-image generation endpoint
  if (url.pathname === '/api/generate-batch' && request.method === 'POST') {
    try {
      const contentType = request.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return Response.json(
          { error: 'Content-Type must be application/json' },
          { status: 400 }
        );
      }

      const body = await request.json() as {
        prompts?: string[];
        maxAttempts?: number;
      };

      if (!body.prompts || !Array.isArray(body.prompts) || body.prompts.length === 0) {
        return Response.json(
          { error: 'Body must include non-empty "prompts" array' },
          { status: 400 }
        );
      }

      const ai = new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });
      const maxAttempts = Math.max(1, Math.min(5, body.maxAttempts ?? 3)); // default 3, clamp 1..5

      // Run generations sequentially to avoid rate limiting; per-prompt retries
      const urls: (string | null)[] = new Array(body.prompts.length).fill(null);
      const errors: (string | null)[] = new Array(body.prompts.length).fill(null);

      for (let i = 0; i < body.prompts.length; i++) {
        const prompt = body.prompts[i];
        if (typeof prompt !== 'string' || !prompt.trim()) {
          errors[i] = `Invalid prompt at index ${i}`;
          continue;
        }

        let attempt = 0;
        while (attempt < maxAttempts && urls[i] === null) {
          attempt++;
          try {
            // Generate the image with retry/backoff for transient API errors
            const response = await retryWithBackoff(async () => {
              return await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: prompt,
              });
            });

            if (!response.candidates?.length) {
              throw new Error('No candidates returned');
            }

            const parts = response.candidates[0]?.content?.parts || [];
            let imageData: string | null = null;
            let mimeType: string = 'image/png';
            for (const part of parts) {
              if (part.inlineData?.data) {
                imageData = part.inlineData.data;
                if (part.inlineData.mimeType) mimeType = part.inlineData.mimeType;
                break;
              }
            }

            if (!imageData) {
              throw new Error('No image data in response');
            }

            // Upload to R2
            const arrayBuffer = base64ToArrayBuffer(imageData);
            const timestamp = Date.now();
            const rand = Math.random().toString(36).slice(2, 8);
            const ext = mimeType.includes('png') ? 'png' : (mimeType.includes('jpeg') || mimeType.includes('jpg')) ? 'jpg' : 'png';
            const key = `generated-${timestamp}-${i}-${rand}.${ext}`;

            await env.R2_BUCKET.put(key, arrayBuffer, {
              httpMetadata: {
                contentType: mimeType,
                cacheControl: 'public, max-age=31536000',
              },
            });

            const publicUrl = `https://images.iwasthere.today/${key}`;
            urls[i] = publicUrl;
            errors[i] = null;
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            errors[i] = `Attempt ${attempt}/${maxAttempts} failed: ${msg}`;
            if (attempt < maxAttempts) {
              // small linear delay to avoid hammering
              await new Promise(r => setTimeout(r, 500 * attempt));
            }
          }
        }
      }

      const successful = urls.filter(Boolean).length;
      if (successful !== body.prompts.length) {
        return Response.json(
          {
            success: false,
            message: `Generated ${successful}/${body.prompts.length} images after ${maxAttempts} attempts per prompt`,
            urls: urls.filter(Boolean),
            errors,
          },
          { status: 502 }
        );
      }

      return Response.json({ success: true, urls: urls as string[] });
    } catch (error) {
      console.error('Error in /api/generate-batch:', error);
      return Response.json(
        { error: error instanceof Error ? error.message : 'Batch generation failed' },
        { status: 500 }
      );
    }
  }

  if (url.pathname === '/api/combine-images' && request.method === 'POST') {
    try {
      const contentType = request.headers.get('content-type') || '';
      const files: File[] = [];
      let promptText: string | undefined;

      if (contentType.includes('application/json')) {
        const body = await request.json() as {
          imageUrls?: string[];
          prompt?: string;
        };

        const normalizedUrls = (body.imageUrls || [])
          .filter((value): value is string => typeof value === 'string')
          .map(url => url.trim())
          .filter(url => url.length > 0);

        if (normalizedUrls.length < 2) {
          return Response.json(
            { error: 'Request must include at least two imageUrls' },
            { status: 400 }
          );
        }

        const urlsToFetch = normalizedUrls.slice(0, 2);
        const fetchedFiles = await Promise.all(urlsToFetch.map(fetchImageFromUrl));
        files.push(...fetchedFiles);
        promptText = body.prompt;
      } else if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const tentativeFiles: File[] = [];
        const possibleFileFields = ['image1', 'image2', 'image', 'images'];

        for (const field of possibleFileFields) {
          const values = formData.getAll(field);
          for (const value of values) {
            if (value instanceof File && value.size > 0) {
              tentativeFiles.push(value);
            }
          }
        }

        const selectedUploads = tentativeFiles.slice(0, 2);
        files.push(...selectedUploads);

        if (files.length < 2) {
          const urlCandidates: string[] = [];
          const singleUrlFields = ['imageUrl', 'imageUrl1', 'imageUrl2'];
          for (const field of singleUrlFields) {
            const value = formData.get(field);
            if (typeof value === 'string' && value.trim()) {
              urlCandidates.push(value.trim());
            }
          }

          const listUrlValues = formData.getAll('imageUrls');
          for (const value of listUrlValues) {
            if (typeof value === 'string' && value.trim()) {
              urlCandidates.push(value.trim());
            }
          }

          if (urlCandidates.length > 0) {
            const remainingSlots = 2 - files.length;
            const urlsToFetch = urlCandidates.slice(0, remainingSlots);
            const fetchedFiles = await Promise.all(urlsToFetch.map(fetchImageFromUrl));
            files.push(...fetchedFiles);
          }
        }

        if (files.length < 2) {
          return Response.json(
            { error: 'Provide at least two images via files or URLs' },
            { status: 400 }
          );
        }

        const promptValue = formData.get('prompt');
        if (typeof promptValue === 'string' && promptValue.trim()) {
          promptText = promptValue.trim();
        }
      } else {
        return Response.json(
          { error: 'Content-Type must be application/json or multipart/form-data' },
          { status: 400 }
        );
      }

      const [firstFile, secondFile] = files;
      if (!firstFile || !secondFile) {
        return Response.json(
          { error: 'Two images are required to combine' },
          { status: 400 }
        );
      }

      const [firstImage, secondImage] = await Promise.all([
        fileToBase64Data(firstFile),
        fileToBase64Data(secondFile),
      ]);

      const prompt = (promptText && promptText.trim().length > 0)
        ? promptText.trim()
        : 'Combine these two inputs into a cohesive, professional composition.';

      const ai = new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });

      const contents: Content[] = [
        {
          inlineData: {
            mimeType: firstImage.mimeType,
            data: firstImage.data,
          },
        },
        {
          inlineData: {
            mimeType: secondImage.mimeType,
            data: secondImage.data,
          },
        },
        { text: prompt },
      ];

      const response = await retryWithBackoff(async () => {
        return await ai.models.generateContent({
          model: 'gemini-2.5-flash-image-preview',
          contents,
        });
      });

      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('No response generated from Gemini API');
      }

      const candidate = response.candidates[0];
      const parts = candidate?.content?.parts || [];

      let imageData: string | null = null;
      let mimeType = 'image/png';
      for (const part of parts) {
        if (part.inlineData?.data) {
          imageData = part.inlineData.data;
          if (part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          break;
        }
      }

      if (!imageData) {
        throw new Error('No inline image content generated in response');
      }

      const arrayBuffer = base64ToArrayBuffer(imageData);
      const timestamp = Date.now();
      const rand = Math.random().toString(36).slice(2, 8);
      const extension = mimeType.includes('png')
        ? 'png'
        : mimeType.includes('jpeg') || mimeType.includes('jpg')
          ? 'jpg'
          : 'png';
      const key = `combined-${timestamp}-${rand}.${extension}`;

      await env.R2_BUCKET.put(key, arrayBuffer, {
        httpMetadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=31536000',
        },
      });

      const publicUrl = `https://images.iwasthere.today/${key}`;

      return Response.json({
        success: true,
        imageData,
        mimeType,
        imageUrl: publicUrl,
        promptUsed: prompt,
      });
    } catch (error) {
      console.error('Error combining images:', error);
      return Response.json(
        { error: error instanceof Error ? error.message : 'Image combination failed' },
        { status: 502 }
      );
    }
  }
  
  // Handle generated image upload API for sharing
  if (url.pathname === '/api/upload-generated' && request.method === 'POST') {
    try {
      const formData = await request.formData();
      const imageFile = formData.get("image") as File | null;
      
      if (!imageFile) {
        return Response.json(
          { error: "No image file provided" },
          { status: 400 }
        );
      }
      
      // Validate file type
      if (!imageFile.type.startsWith('image/')) {
        return Response.json(
          { error: "File must be an image" },
          { status: 400 }
        );
      }
      
      // Generate unique filename for sharing
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const extension = imageFile.name.split('.').pop() || 'png';
      const filename = `my-ai-time-travel-newspaper-${timestamp}-${randomId}.${extension}`;
      
      // Upload to R2
      const imageBuffer = await imageFile.arrayBuffer();
      await env.R2_BUCKET.put(filename, imageBuffer, {
        httpMetadata: {
          contentType: imageFile.type,
          cacheControl: 'public, max-age=31536000', // Cache for 1 year
        }
      });
      
      // Return the public R2 URL
      const imageUrl = `https://images.iwasthere.today/${filename}`;
        
      return Response.json({
        success: true,
        imageUrl: imageUrl,
        filename: filename,
        message: "Image uploaded and ready for sharing"
      });
      
    } catch (error) {
      console.error("Error uploading generated image:", error);
      return Response.json(
        { error: error instanceof Error ? error.message : "Upload failed" },
        { status: 500 }
      );
    }
  }
  
  // Handle image upload API
  if (url.pathname === '/api/upload' && request.method === 'POST') {
    try {
      const formData = await request.formData();
      const imageFile = formData.get("image") as File | null;
      
      if (!imageFile) {
        return Response.json(
          { error: "No image file provided" },
          { status: 400 }
        );
      }
      
      // Validate file type
      if (!imageFile.type.startsWith('image/')) {
        return Response.json(
          { error: "File must be an image" },
          { status: 400 }
        );
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const extension = imageFile.name.split('.').pop() || 'jpg';
      const filename = `uploaded-${timestamp}.${extension}`;
      
      // Upload to R2
      const imageBuffer = await imageFile.arrayBuffer();
      await env.R2_BUCKET.put(filename, imageBuffer, {
        httpMetadata: {
          contentType: imageFile.type
        }
      });
      
      // Return the R2 URL
      // In production, this would be the public R2 URL
      // For development, we'll use a placeholder URL that the front-end can work with
      const imageUrl = `https://images.iwasthere.today/${filename}`;
        
      return Response.json({
        success: true,
        imageUrl: imageUrl,
        filename: filename
      });
      
    } catch (error) {
      console.error("Error uploading image:", error);
      return Response.json(
        { error: error instanceof Error ? error.message : "Upload failed" },
        { status: 500 }
      );
    }
  }
  
  // Handle image generation API
  if ((url.pathname === '/api/generate' || url.pathname === '/generate') && request.method === 'POST') {
    let language: string = 'en';
    let date: string | null = null;
    let prompt: string | null = null;
    
    try {
      const contentType = request.headers.get('content-type') || '';
      
      let imageFile: File | null = null;
      
      // Handle JSON input with image URL
      if (contentType.includes('application/json')) {
        const body = await request.json() as { 
          imageUrl?: string; 
          prompt?: string; 
          language?: string;
          date?: string;
        };
        
        if (!body.imageUrl) {
          return Response.json(
            { error: "Missing imageUrl in JSON body" },
            { status: 400 }
          );
        }
        
        // Fetch image from URL and convert to File
        imageFile = await fetchImageFromUrl(body.imageUrl);
        prompt = body.prompt || '';
        language = body.language || 'en';
        date = body.date || null;
      }
      // Handle multipart form data (existing behavior)
      else if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        imageFile = formData.get("image") as File | null;
        prompt = formData.get("prompt") as string | null || '';
        const langParam = formData.get("language") as string | null;
        language = (langParam && ['en', 'es'].includes(langParam)) ? langParam : 'en';
        date = formData.get("date") as string | null;
      }
      else {
        return Response.json(
          { error: "Content-Type must be application/json or multipart/form-data" },
          { status: 400 }
        );
      }
      
      if (!imageFile) {
        return Response.json(
          { error: "Missing image file" },
          { status: 400 }
        );
      }
      
      // Convert uploaded file to base64
      const imageBuffer = await imageFile.arrayBuffer();
      const base64Image = btoa(
        new Uint8Array(imageBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );
      
      // Initialize Gemini AI
      const ai = new GoogleGenAI({
        apiKey: env.GOOGLE_API_KEY,
      });
      
      console.log(`Generating newspaper in ${language} for request:`, {
        hasImage: !!imageFile,
        imageType: imageFile?.type,
        promptLength: prompt.length,
        date: date,
        language: language
      });
      
      // Prepare the prompt with image and text
      const promptData = [
        { text: prompt },
        {
          inlineData: {
            mimeType: imageFile.type,
            data: base64Image,
          },
        },
      ];
      
      // Generate content using Gemini with retry logic
      const response = await retryWithBackoff(async () => {
        return await ai.models.generateContent({
          model: "gemini-2.5-flash-image-preview",
          contents: promptData as Content[],
        });
      });
      
      console.log('Gemini response structure:', {
        hasCandidates: !!response.candidates,
        candidatesLength: response.candidates?.length || 0,
        firstCandidate: response.candidates?.[0] ? {
          hasContent: !!response.candidates[0].content,
          partsLength: response.candidates[0].content?.parts?.length || 0,
          finishReason: response.candidates[0].finishReason
        } : null
      });
      
      // Enhanced response validation and debugging
      if (!response.candidates || response.candidates.length === 0) {
        console.error('No candidates in Gemini response:', response);
        throw new Error("No response generated from Gemini API - no candidates returned");
      }
      
      const candidate = response.candidates[0];
      if (!candidate) {
        console.error('First candidate is null/undefined:', response);
        throw new Error("Invalid response structure from Gemini API - candidate is null");
      }
      
      if (!candidate.content) {
        console.error('Candidate has no content:', candidate);
        throw new Error("Invalid response structure from Gemini API - no content in candidate");
      }
      
      if (!candidate.content.parts || candidate.content.parts.length === 0) {
        console.error('Candidate content has no parts:', candidate.content);
        throw new Error("Invalid response structure from Gemini API - no parts in content");
      }
      
      // Look for text response (HTML newspaper)
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          
          return Response.json({
            success: true,
            imageData: part.inlineData.data,
            mimeType: part.inlineData.mimeType || "image/png",
          });
        }
      }
      
      // If no text found, log all parts for debugging
      console.error('No text content found in any part:', candidate.content.parts.map(part => ({
        hasText: !!part.text,
        hasInlineData: !!part.inlineData,
        textPreview: part.text
      })));
      
      throw new Error("No inline image content generated in response");
      
    } catch (error) {
      console.error("Error generating image:", error);
      
      // Provide more specific error messages based on error type
      let errorMessage = "Unknown error occurred";
      let statusCode = 500;
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific error types
        if (error.message.includes('No response generated')) {
          errorMessage = "The AI service did not generate any content. Please try again.";
          statusCode = 503; // Service Unavailable
        } else if (error.message.includes('Invalid response structure')) {
          errorMessage = "The AI service returned an unexpected response format. Please try again.";
          statusCode = 502; // Bad Gateway
        } else if (error.message.includes('No inline image content')) {
          errorMessage = "The AI service could not generate content. Please try with a different image or prompt.";
          statusCode = 422; // Unprocessable Entity
        } else if (error.message.includes('fetch')) {
          errorMessage = "Failed to fetch the uploaded image. Please check the image URL.";
          statusCode = 400; // Bad Request
        }
      }
      
      return Response.json(
        { 
          error: errorMessage,
          details: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
          requestInfo: {
            language: language || 'unknown',
            hasDate: !!date,
            hasPrompt: !!(prompt && prompt.length > 0)
          }
        },
        { status: statusCode }
      );
    }
  }
  
  return new Response("API endpoint not found", { status: 404 });
}

async function serveStaticFile(pathname: string): Promise<Response | null> {
  // Normalize pathname
  let filePath = pathname === '/' ? '/index.html' : pathname;
  
  // Try to get the file content
  const fileContent = staticFiles[filePath];
  if (!fileContent) {
    return null;
  }
  
  // Determine content type
  const contentType = getContentType(filePath);
  
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': filePath === '/index.html' ? 'no-cache' : 'public, max-age=31536000',
  };

  // Add relaxed CSP headers for HTML files to allow iframe and image loading
  if (contentType.includes('text/html')) {
    headers['Content-Security-Policy'] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: *; img-src 'self' data: blob: https: http: *; frame-src 'self' https: http: *; connect-src 'self' https: http: *;";
  }

  return new Response(fileContent, { headers });
}

function getContentType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
      return 'text/html; charset=utf-8';
    case 'js':
      return 'application/javascript';
    case 'css':
      return 'text/css';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'svg':
      return 'image/svg+xml';
    case 'ico':
      return 'image/x-icon';
    default:
      return 'application/octet-stream';
  }
}
