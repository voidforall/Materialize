
export enum AppStep {
  CREATE = 'CREATE',
  RENDER = 'RENDER',
  SHIP = 'SHIP'
}

export enum ProductType {
  TSHIRT = 'T-Shirt',
  MUG = 'Coffee Mug',
  CANVAS = 'Canvas Print',
  TOTE = 'Tote Bag'
}

export interface GeneratedImage {
  id: string;
  url: string; // Base64 data URL
  prompt: string;
  createdAt: number;
}

export interface RenderedProduct {
  id: string;
  originalImageId: string;
  productType: ProductType;
  previewUrl: string; // Base64 data URL
  createdAt: number;
}

export type ImageResolution = '1K' | '2K' | '4K';

// Printful Types
export interface PrintfulMockup {
  placement: string;
  variant_id: number;
  mockup_url: string;
}

export interface PrintfulOrder {
  id: number;
  external_id: string;
  status: string;
  recipient: {
    name: string;
    address1: string;
    city: string;
    zip: string;
    country_code: string;
  };
  costs: {
    total: string;
    subtotal: string;
    shipping: string;
  };
}
