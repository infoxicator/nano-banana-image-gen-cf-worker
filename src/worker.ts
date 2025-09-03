import { GoogleGenAI, Content } from "@google/genai";

export interface Env {
  GOOGLE_API_KEY: string;
  R2_BUCKET: R2Bucket;
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
      const filename = `shared-newspaper-${timestamp}-${randomId}.${extension}`;
      
      // Upload to R2
      const imageBuffer = await imageFile.arrayBuffer();
      await env.R2_BUCKET.put(filename, imageBuffer, {
        httpMetadata: {
          contentType: imageFile.type,
          cacheControl: 'public, max-age=31536000', // Cache for 1 year
        }
      });
      
      // Return the public R2 URL
      const imageUrl = `https://pub-277037412cf1440abe75a6d3f69fbe90.r2.dev/${filename}`;
        
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
      const imageUrl = `https://pub-277037412cf1440abe75a6d3f69fbe90.r2.dev/${filename}`;
        
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
    try {
      const contentType = request.headers.get('content-type') || '';
      
      let imageFile: File | null = null;
      let prompt: string | null = null;
      
      // Handle JSON input with image URL
      if (contentType.includes('application/json')) {
        const body = await request.json() as { imageUrl?: string; prompt?: string };
        
        if (!body.imageUrl || !body.prompt) {
          return Response.json(
            { error: "Missing imageUrl or prompt in JSON body" },
            { status: 400 }
          );
        }
        
        // Fetch image from URL and convert to File
        imageFile = await fetchImageFromUrl(body.imageUrl);
        prompt = body.prompt;
      }
      // Handle multipart form data (existing behavior)
      else if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        imageFile = formData.get("image") as File | null;
        prompt = formData.get("prompt") as string | null;
      }
      else {
        return Response.json(
          { error: "Content-Type must be application/json or multipart/form-data" },
          { status: 400 }
        );
      }
      
      if (!imageFile || !prompt) {
        return Response.json(
          { error: "Missing image file or prompt" },
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
      
      // Generate content using Gemini
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: promptData as Content[],
      });
      
      // Process the response
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("No response generated from Gemini API");
      }
      
      const candidate = response.candidates[0];
      if (!candidate || !candidate.content || !candidate.content.parts) {
        throw new Error("Invalid response structure from Gemini API");
      }
      
      // Look for generated image in response
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          // Generate unique filename
          const timestamp = Date.now();
          const filename = `generated-${timestamp}.png`;
          
          // // Upload to R2
          // try {
          //   await env.R2_BUCKET.put(filename, part.inlineData.data, {
          //     httpMetadata: {
          //       contentType: part.inlineData.mimeType || "image/png"
          //     }
          //   });
            
          //   // Return success with R2 URL
          //   return Response.json({
          //     success: true,
          //     imageData: part.inlineData.data,
          //     mimeType: part.inlineData.mimeType || "image/png",
          //     r2Url: filename,
          //     message: "Image generated and saved to R2"
          //   });
          // } catch (r2Error) {
          //   console.error("R2 upload failed:", r2Error);
          //   // Still return the image data even if R2 upload fails
          //   return Response.json({
          //     success: true,
          //     imageData: part.inlineData.data,
          //     mimeType: part.inlineData.mimeType || "image/png",
          //     warning: "Image generated but R2 upload failed"
          //   });
          // }
          return Response.json({
            success: true,
            imageData: part.inlineData.data,
            mimeType: part.inlineData.mimeType || "image/png",
          });
        }
      }
      
      // If no image found, return text response if available
      for (const part of candidate.content.parts) {
        if (part.text) {
          return Response.json({
            error: "No image generated. Text response: " + part.text
          }, { status: 400 });
        }
      }
      
      throw new Error("No image or text generated in response");
      
    } catch (error) {
      console.error("Error generating image:", error);
      return Response.json(
        { 
          error: error instanceof Error ? error.message : "Unknown error occurred" 
        },
        { status: 500 }
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
