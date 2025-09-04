import { GoogleGenAI, Content } from "@google/genai";

export interface Env {
  GOOGLE_API_KEY: string;
  R2_BUCKET: R2Bucket;
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

// Import built static files
import staticFiles from './static-files';

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
      return handleApiRequest(request, env);
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
        } else if (error.message.includes('No HTML content generated')) {
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
