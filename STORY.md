## Inspiration

We noticed a gap between digital creativity and the physical world. People generate stunning AI artwork every day, but turning those images into real, tangible products — a t-shirt you can wear, a mug you can drink from, a canvas you can hang — still requires navigating multiple disconnected tools: image generators, mockup services, print-on-demand platforms, and shipping forms. We wanted to collapse that entire pipeline into a single, seamless experience where you go from a text prompt to a product on your doorstep.

## What it does

Materialize is an end-to-end "AI to Reality" pipeline built around three steps: **Create**, **Render**, and **Ship**.

1. **Create** — Users describe artwork in natural language. The **Nano Banana Pro** model generates the image (with an optional "Enhance" button powered by Gemini that rewrites simple prompts into detailed art-director-quality descriptions). Users can choose between standard generation or high-quality mode with up to 4K resolution. They can also upload their own images.

2. **Render** — Users pick a product type (T-Shirt, Coffee Mug, Canvas Print, or Tote Bag) and a context preset (studio shot, lifestyle scene, gallery wall, etc.) or write their own. **Nano Banana Pro's** image editing capabilities composite the artwork onto the chosen product in a photorealistic setting, giving users a realistic preview before they buy.

3. **Ship** — Users enter their shipping address, and Materialize connects to the Printful print-on-demand API to generate professional mockups, estimate real-time shipping costs, create a draft order, and — once confirmed — trigger manufacturing and fulfillment. The product ships directly to the customer.

## How we built it

- **Frontend**: React 19 + TypeScript, styled with Tailwind CSS, bundled with Vite.
- **AI backbone**: **Nano Banana Pro** for AI artwork generation (Create step) and photorealistic product rendering (Render step). Gemini 3 Flash handles prompt enhancement via the Google `@google/genai` SDK.
- **Manufacturing & fulfillment**: Printful API for mockup generation, shipping rate estimation, cost calculation, order creation, and order confirmation — all proxied through a Vite dev server middleware.
- **Persistence**: localStorage to preserve the user's gallery, rendered products, and selections across sessions.
- **Sharing**: Web Share API with a fallback to clipboard copy via a hosted image URL.

## Challenges we ran into

- **Image-to-product compositing** was the hardest creative problem. Getting Nano Banana Pro to realistically wrap artwork onto a 3D product surface (like a mug handle or a t-shirt fold) required careful prompt engineering with context presets for each product type and scene.
- **Async mockup generation** with Printful required implementing a polling loop that waits for the task to complete (up to 60 seconds) while keeping the UI responsive.
- **Bridging base64 and public URLs**: Nano Banana Pro returns images as base64 data, but Printful requires publicly accessible URLs. We had to build a server-side image hosting middleware to bridge the two.
- **Graceful degradation**: Not every user will have a Printful API key configured, so the entire Ship step needed to work in both "connected" and "simulated" modes without breaking the flow.

## Accomplishments that we're proud of

- A true end-to-end experience: you can go from typing "a sunset over mountains" to holding a physical t-shirt with that artwork, all within a single app.
- The AI-powered prompt enhancement feature turns vague ideas into vivid, art-director-quality prompts, making great results accessible to everyone.
- The Render step's context presets (street model, cozy cafe, art gallery, etc.) produce genuinely compelling product previews that feel like professional marketing photos.
- The two-phase order flow (draft then confirm) gives users full cost transparency before they commit to a purchase.
- Clean, responsive UI with smooth animations, a polished onboarding screen, and local persistence so users never lose their work.

## What we learned

- Nano Banana Pro's multimodal capabilities are remarkably flexible — the same model handles both artwork generation and image-to-image product compositing, which dramatically simplified our architecture.
- Print-on-demand APIs like Printful have deep functionality (mockup generation, cost estimation, async task queues) but require careful orchestration and error handling to deliver a smooth user experience.
- Prompt engineering for Nano Banana Pro's product rendering is as much art as science — small changes to context descriptions (e.g., "warm cafe lighting" vs. "studio lighting") produce dramatically different results.
- Persisting state to localStorage with lazy initialization keeps the app feeling instant even with a gallery of base64-encoded images.

## What's next for Materialize

- **More products**: Phone cases, posters, hoodies, stickers, and other print-on-demand items from Printful's full catalog.
- **Style transfer & editing**: Let users refine generated artwork with in-app editing tools — adjusting colors, cropping, or applying style transfer before rendering.
- **User accounts & order history**: Move beyond localStorage to a backend with authentication, so users can track orders and revisit past creations.
- **Storefront mode**: Let creators publish a personal shop of their AI-generated merchandise and share it with others.
- **Batch rendering**: Generate previews across all product types at once so users can compare before choosing.
- **Payment integration**: Direct Stripe or PayPal checkout so end customers can pay without needing their own Printful account.
