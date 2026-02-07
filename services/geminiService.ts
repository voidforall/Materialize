import { GoogleGenAI, Type } from "@google/genai";
import { ImageResolution } from "../types";

// Helper to get the AI instance. 
// We create a new instance each time to ensure we pick up any newly selected API keys.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Enhances a simple user prompt into a detailed artistic description.
 */
export const enhancePrompt = async (simplePrompt: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert art director. Rewrite the following simple image prompt into a detailed, high-quality generative AI prompt that specifies style, lighting, composition, and mood. Keep it under 60 words.
      
      Original prompt: "${simplePrompt}"`,
    });
    return response.text || simplePrompt;
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    return simplePrompt;
  }
};

/**
 * Generates an image using Gemini.
 * Uses gemini-3-pro-image-preview for high quality (requires BYO key),
 * or gemini-2.5-flash-image for standard speed.
 */
export const generateImage = async (
  prompt: string, 
  useHighQuality: boolean,
  resolution: ImageResolution = '1K'
): Promise<string> => {
  const ai = getAI();
  const model = useHighQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  // 3-Pro supports imageSize config
  const imageConfig: any = {
    aspectRatio: "1:1",
  };

  if (useHighQuality) {
    imageConfig.imageSize = resolution;
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: imageConfig
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

/**
 * Renders the artwork onto a product using Image Editing capabilities.
 * We treat this as an image-to-image task where we describe the desired outcome.
 */
export const renderProductPreview = async (
  artworkBase64: string,
  productName: string,
  contextDescription: string = "in a professional studio setting"
): Promise<string> => {
  const ai = getAI();
  // Using 2.5 flash image for editing/composition tasks as it's versatile and fast
  const model = 'gemini-2.5-flash-image'; 
  
  // Clean base64 string if it has prefix
  const cleanBase64 = artworkBase64.split(',')[1] || artworkBase64;

  const prompt = `A realistic high-quality photo of a ${productName} featuring the provided artwork design on it. The product is ${contextDescription}. Ensure the artwork is clearly visible and wraps naturally around the product surface.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/png',
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No rendered image found");
  } catch (error) {
    console.error("Error rendering product:", error);
    throw error;
  }
};

/**
 * Helper to handle the BYO Key flow for Pro models.
 */
export const checkAndRequestApiKey = async (): Promise<boolean> => {
  const aiStudio = (window as any).aistudio;
  if (aiStudio && aiStudio.hasSelectedApiKey) {
    const hasKey = await aiStudio.hasSelectedApiKey();
    if (!hasKey) {
       await aiStudio.openSelectKey();
       // Assume success if the dialog closes, or simply retry logic in UI
       return true;
    }
    return true;
  }
  return false; // Fallback or environment not supported
};
