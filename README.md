<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1oahDjKTR8Ru8xoytILX77-xJdQnXOyo_

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Configure API keys in [.env.local](.env.local):
   ```
   GEMINI_API_KEY=your_gemini_api_key
   PRINTFUL_API_KEY=your_printful_api_key
   ```
   - **GEMINI_API_KEY** — Required. Get one from [Google AI Studio](https://aistudio.google.com/apikey).
   - **PRINTFUL_API_KEY** — Required for the Ship step. Get one from [Printful API Settings](https://www.printful.com/dashboard/developer/api). Without it, the Ship step runs in simulation mode.
3. Run the app:
   `npm run dev`

The Vite dev server proxies Printful API requests (`/api/printful`) so the API key stays server-side and CORS is not an issue.
