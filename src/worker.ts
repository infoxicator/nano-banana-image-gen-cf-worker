import { GoogleGenAI, Content } from "@google/genai";

export interface Env {
  GOOGLE_API_KEY: string;
  R2_BUCKET: R2Bucket;
}

// Import built static files
import staticFiles from './static-files';

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
  
  // Handle image generation API
  if ((url.pathname === '/api/generate' || url.pathname === '/generate') && request.method === 'POST') {
    try {
      // Parse multipart form data
      const formData = await request.formData();
      const imageFile = formData.get("image");
      const prompt = formData.get("prompt");
      
      if (!imageFile || !prompt) {
        return Response.json(
          { error: "Missing image file or prompt" },
          { status: 400 }
        );
      }
      
      if (typeof imageFile === 'string' || !imageFile) {
        return Response.json(
          { error: "Image field must be a file" },
          { status: 400 }
        );
      }
      
      // Type assertion after null check
      const file = imageFile as File;
      
      // Convert uploaded file to base64
      const imageBuffer = await file.arrayBuffer();
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
            mimeType: file.type,
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
          
          // Upload to R2
          try {
            await env.R2_BUCKET.put(filename, part.inlineData.data, {
              httpMetadata: {
                contentType: part.inlineData.mimeType || "image/png"
              }
            });
            
            // Return success with R2 URL
            return Response.json({
              success: true,
              imageData: part.inlineData.data,
              mimeType: part.inlineData.mimeType || "image/png",
              r2Url: filename,
              message: "Image generated and saved to R2"
            });
          } catch (r2Error) {
            console.error("R2 upload failed:", r2Error);
            // Still return the image data even if R2 upload fails
            return Response.json({
              success: true,
              imageData: part.inlineData.data,
              mimeType: part.inlineData.mimeType || "image/png",
              warning: "Image generated but R2 upload failed"
            });
          }
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
  
  return new Response(fileContent, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': filePath === '/index.html' ? 'no-cache' : 'public, max-age=31536000',
    },
  });
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
