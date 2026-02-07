<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Materialize

**Imagine it. Own it.** — An AI-powered pipeline that turns your imagination into real, shippable products.

Prototyped in [Google AI Studio](https://aistudio.google.com/).

## Getting Started

Materialize walks you through three steps to go from idea to product:

### 1. Create — Generate AI Artwork

Describe what you want and the AI generates original artwork for you. Browse your gallery, pick your favorite, and move on.

<!-- TODO: screenshot of Create step -->

### 2. Render — Visualize on a Product

Choose a product type (t-shirt, mug, canvas, or tote bag), pick a scene preset or write your own, and the AI renders a realistic product preview.

<!-- TODO: screenshot of Render step -->

### 3. Ship — Order & Delivery

Enter your shipping details and place an order. Materialize handles fulfillment through Printful.

<!-- TODO: screenshot of Ship step -->

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
