import { ProductType, PrintfulShippingRate } from "../types";

const PRINTFUL_API = '/api/printful';

// Mapping internal product types to Printful Variant IDs
const PRODUCT_VARIANTS: Record<ProductType, { variantId: number; productId: number; placement: string }> = {
  [ProductType.TSHIRT]: { variantId: 4012, productId: 71, placement: 'front' },
  [ProductType.MUG]: { variantId: 1320, productId: 19, placement: 'default' },
  [ProductType.CANVAS]: { variantId: 5, productId: 3, placement: 'default' },
  [ProductType.TOTE]: { variantId: 10457, productId: 367, placement: 'front' },
};

const jsonHeaders = () => ({ 'Content-Type': 'application/json' });

/**
 * Verifies if the Printful API connection works via the Vite proxy.
 */
export const checkPrintfulConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${PRINTFUL_API}/products`, {
      method: 'GET',
      headers: jsonHeaders(),
    });
    return response.ok;
  } catch (e) {
    console.warn("Printful connection check failed:", e);
    return false;
  }
};

/**
 * Uploads a base64 image to a public host via the Vite server middleware,
 * returning a public URL that Printful can fetch.
 */
export const hostImage = async (base64Image: string): Promise<string> => {
  const response = await fetch('/api/host-image', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ base64: base64Image }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to host image');
  }

  const data = await response.json();
  return data.url;
};

/**
 * Generates mockups using Printful's Mockup Generator API with async polling.
 * Returns an array of mockup image URLs.
 */
export const generatePrintfulMockups = async (
  imageUrl: string,
  productType: ProductType
): Promise<string[]> => {
  const config = PRODUCT_VARIANTS[productType];

  // 1. Create mockup generation task
  const taskRes = await fetch(`${PRINTFUL_API}/mockup-generator/create-task/${config.productId}`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      variant_ids: [config.variantId],
      format: 'png',
      files: [{
        placement: config.placement,
        image_url: imageUrl,
      }],
    }),
  });

  if (!taskRes.ok) {
    const err = await taskRes.json();
    throw new Error(err.result || 'Failed to create mockup task');
  }

  const taskData = await taskRes.json();
  const taskKey = taskData.result.task_key;

  // 2. Poll for task completion (max 60s, every 2s)
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const pollRes = await fetch(`${PRINTFUL_API}/mockup-generator/task?task_key=${taskKey}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    if (!pollRes.ok) continue;

    const pollData = await pollRes.json();
    const status = pollData.result.status;

    if (status === 'completed') {
      const mockups = pollData.result.mockups || [];
      return mockups.map((m: any) => m.mockup_url);
    }

    if (status === 'failed') {
      throw new Error(pollData.result.error || 'Mockup generation failed');
    }
  }

  throw new Error('Mockup generation timed out');
};

/**
 * Creates a draft order on Printful using a public image URL.
 * The file URL is passed inline — no separate /files upload needed.
 */
export const createDraftOrder = async (
  recipient: any,
  imageUrl: string,
  productType: ProductType
) => {
  const config = PRODUCT_VARIANTS[productType];

  const response = await fetch(`${PRINTFUL_API}/orders`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      recipient,
      items: [{
        variant_id: config.variantId,
        quantity: 1,
        files: [{
          url: imageUrl,
        }],
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.result || 'Failed to create order');
  }

  const data = await response.json();
  return data.result;
};

/**
 * Confirms a draft order, triggering fulfillment and charging the account.
 */
export const confirmOrder = async (orderId: number) => {
  const response = await fetch(`${PRINTFUL_API}/orders/${orderId}/confirm`, {
    method: 'POST',
    headers: jsonHeaders(),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.result || 'Failed to confirm order');
  }

  const data = await response.json();
  return data.result;
};

/**
 * Estimates shipping rates for a given recipient and product type.
 */
export const estimateShippingRates = async (
  recipient: { address1: string; city: string; country_code: string; state_code: string; zip: string },
  productType: ProductType
): Promise<PrintfulShippingRate[]> => {
  const config = PRODUCT_VARIANTS[productType];

  const response = await fetch(`${PRINTFUL_API}/shipping/rates`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      recipient,
      items: [{
        variant_id: config.variantId,
        quantity: 1,
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.result || 'Failed to estimate shipping');
  }

  const data = await response.json();
  return (data.result || []).map((rate: any) => ({
    id: rate.id,
    name: rate.name,
    rate: rate.rate,
    currency: rate.currency,
    minDeliveryDays: rate.minDeliveryDays,
    maxDeliveryDays: rate.maxDeliveryDays,
  }));
};

/**
 * Estimates the cost of an order (subtotal, shipping, total) without creating it.
 */
export const estimateOrderCosts = async (
  recipient: any,
  imageUrl: string,
  productType: ProductType
) => {
  const config = PRODUCT_VARIANTS[productType];

  const response = await fetch(`${PRINTFUL_API}/orders/estimate-costs`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      recipient,
      items: [{
        variant_id: config.variantId,
        quantity: 1,
        files: [{
          url: imageUrl,
        }],
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.result || 'Failed to estimate costs');
  }

  const data = await response.json();
  return data.result.costs;
};
