# 🍌 Nano Banana Image Generator

A Cloudflare Worker-hosted, Google Nano Banana (Gemini 2.5 Flash Image) image generation app that edits input images according to your input text prompt.

## Features

- Uses Google Gemini 2.5 Flash Image Preview (aka nano banana)
- User uploads an image and adds a text prompt to edit the image w/ nano banana
- Automatically saves generated images to R2 object storage
- Hosted on Cloudflare Workers for global performance

## 🚀 Quick Start

📺 **Watch the Demo with a brief explanation on YouTube**: [![Video Thumbnail](https://img.youtube.com/vi/cw-YSb4vb1M/maxresdefault.jpg)](https://youtu.be/cw-YSb4vb1M)

1. **Clone the repo**
   ```bash
   git clone https://github.com/elizabethsiegle/nano-banana-image-gen-cf-worker.git
   cd nano-banana-image-gen-cf-worker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   - Create a Cloudflare R2 bucket: `npx wrangler r2 bucket create your-bucket-name`
   - Add your Google API key as a secret: `npx wrangler secret put GOOGLE_API_KEY`
   - Update `wrangler.jsonc` with your R2 bucket name

4. **Deploy**
   ```bash
   npm run deploy
   ```

## 🛠️ Development

- **Frontend**: `npm run dev:frontend`
- **Worker**: `npm run dev:worker`
- **Both**: `npm run dev`
- **Build**: `npm run build`

## 🏗️ Architecture

- **Frontend**: React + Vite
- **Backend**: Cloudflare Workers
- **Storage**: Cloudflare R2
- **AI**: Google Gemini API
