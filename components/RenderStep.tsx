import React, { useState } from 'react';
import { GeneratedImage, ProductType, RenderedProduct } from '../types';
import { renderProductPreview } from '../services/geminiService';
import { hostImage } from '../services/printfulService';
import { Loader2, Shirt, Coffee, Box, Image as ImageIcon, Download, Check, Sparkles, Share2 } from 'lucide-react';

interface RenderStepProps {
  selectedImage: GeneratedImage | null;
  onProductRendered: (product: RenderedProduct) => void;
  selectedProduct?: RenderedProduct;
  renderedProducts: RenderedProduct[];
  onSelectProduct: (product: RenderedProduct) => void;
}

const PRODUCTS = [
  { id: ProductType.TSHIRT, label: 'T-Shirt', icon: Shirt, description: 'Premium cotton tee' },
  { id: ProductType.MUG, label: 'Mug', icon: Coffee, description: 'Ceramic 11oz mug' },
  { id: ProductType.CANVAS, label: 'Canvas', icon: ImageIcon, description: 'Stretched canvas print' },
  { id: ProductType.TOTE, label: 'Tote Bag', icon: Box, description: 'Eco-friendly canvas bag' },
];

const PRESETS: Record<ProductType, Array<{ label: string; prompt: string }>> = {
  [ProductType.TSHIRT]: [
    { label: 'Studio (Plain)', prompt: 'isolated on a clean white background, professional product photography' },
    { label: 'Street Model', prompt: 'worn by a fashion model walking on a city street, realistic lighting' },
    { label: 'Flat Lay', prompt: 'folded neatly on a rustic wooden table with minimal accessories' },
  ],
  [ProductType.MUG]: [
    { label: 'Studio (Plain)', prompt: 'isolated on a clean white background, professional product photography' },
    { label: 'Office Desk', prompt: 'sitting on a modern wooden office desk next to a laptop' },
    { label: 'Cozy Cafe', prompt: 'held by hands in a warm, cozy cafe setting with steam rising' },
  ],
  [ProductType.CANVAS]: [
    { label: 'Studio (Plain)', prompt: 'isolated on a clean white background, front view' },
    { label: 'Living Room', prompt: 'hanging on a wall in a modern, well-lit living room above a sofa' },
    { label: 'Art Gallery', prompt: 'displayed on a white wall in a spacious art gallery with spot lighting' },
  ],
  [ProductType.TOTE]: [
    { label: 'Studio (Plain)', prompt: 'isolated on a clean white background, hanging straight' },
    { label: 'Lifestyle', prompt: 'being carried on a shoulder by a person walking in a park' },
    { label: 'Table Top', prompt: 'sitting upright on a picnic table outdoors in sunlight' },
  ],
};

export const RenderStep: React.FC<RenderStepProps> = ({ 
  selectedImage, 
  onProductRendered, 
  selectedProduct,
  renderedProducts,
  onSelectProduct
}) => {
  const [activeProductType, setActiveProductType] = useState<ProductType>(ProductType.TSHIRT);
  const [isRendering, setIsRendering] = useState(false);
  const [contextPrompt, setContextPrompt] = useState(PRESETS[ProductType.TSHIRT][0].prompt);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleProductChange = (type: ProductType) => {
    setActiveProductType(type);
    // Reset to default "Plain" preset when switching products
    setContextPrompt(PRESETS[type][0].prompt);
  };

  const handleRender = async () => {
    if (!selectedImage) return;
    setIsRendering(true);
    try {
      const previewUrl = await renderProductPreview(
        selectedImage.url, 
        activeProductType, 
        contextPrompt
      );
      
      const newProduct: RenderedProduct = {
        id: Date.now().toString(),
        originalImageId: selectedImage.id,
        productType: activeProductType,
        previewUrl,
        createdAt: Date.now(),
      };
      
      onProductRendered(newProduct);
    } catch (error) {
      console.error(error);
      alert("Failed to render preview. Please try again.");
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownload = () => {
    if (!selectedProduct) return;
    const link = document.createElement('a');
    link.href = selectedProduct.previewUrl;
    link.download = `materialize-${selectedProduct.productType.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleShare = async () => {
    if (!selectedProduct) return;
    setIsSharing(true);
    try {
      // Convert base64 data URL to a Blob/File
      const res = await fetch(selectedProduct.previewUrl);
      const blob = await res.blob();
      const fileName = `materialize-${selectedProduct.productType.toLowerCase().replace(/\s+/g, '-')}.png`;
      const file = new File([blob], fileName, { type: blob.type });

      // Try Web Share API (mobile + some desktop browsers)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Materialize – ${selectedProduct.productType} Preview`,
          files: [file],
        });
      } else {
        // Fallback: upload and copy link
        const publicUrl = await hostImage(selectedProduct.previewUrl);
        await navigator.clipboard.writeText(publicUrl);
        showToast('Link copied!');
      }
    } catch (error: any) {
      // User cancelled share sheet — not an error
      if (error?.name !== 'AbortError') {
        console.error('Share failed:', error);
        showToast('Failed to share');
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (!selectedImage) {
    return (
      <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
        <p className="text-slate-500">Please create and select an artwork first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">1. Choose Product</h3>
            <div className="grid grid-cols-2 gap-3">
              {PRODUCTS.map((p) => {
                const Icon = p.icon;
                const isActive = activeProductType === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleProductChange(p.id)}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                      isActive 
                        ? 'border-purple-600 bg-purple-50 text-purple-700' 
                        : 'border-slate-100 hover:border-purple-100 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <span className="font-medium text-sm">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-3">2. Context & Style</h3>
            <p className="text-sm text-slate-500 mb-4">Choose a preset or describe the background manually.</p>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESETS[activeProductType].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setContextPrompt(preset.prompt)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all flex items-center gap-1 ${
                    contextPrompt === preset.prompt
                      ? 'bg-purple-600 border-purple-600 text-white font-medium shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                >
                  {preset.label === 'Studio (Plain)' && <Box className="w-3 h-3" />}
                  {preset.label}
                </button>
              ))}
            </div>

            <textarea
              value={contextPrompt}
              onChange={(e) => setContextPrompt(e.target.value)}
              placeholder="E.g., lying on a wooden table with coffee beans around, or worn by a model in a park..."
              className="w-full p-4 text-sm rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none h-32"
            />
            <button
              onClick={handleRender}
              disabled={isRendering}
              className="mt-4 w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:from-purple-700 hover:to-purple-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isRendering ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Rendering Preview...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Reality Preview
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center relative shadow-xl">
             {selectedProduct ? (
               <>
                  <img 
                    src={selectedProduct.previewUrl} 
                    alt="Product Preview" 
                    className="w-full h-full object-contain bg-slate-800"
                  />
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium border border-white/10">
                     {selectedProduct.productType} Preview
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare();
                      }}
                      disabled={isSharing}
                      className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-all border border-white/10 shadow-lg disabled:opacity-50"
                      title="Share"
                    >
                      {isSharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload();
                      }}
                      className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-all border border-white/10 shadow-lg"
                      title="Download Render"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
               </>
             ) : (
               <div className="text-center p-8">
                 <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                   <Shirt className="w-8 h-8 text-white/50" />
                 </div>
                 <p className="text-slate-400 text-sm max-w-xs mx-auto">
                   Select a product and click "Generate" to see your artwork come to life.
                 </p>
               </div>
             )}
             
             {isRendering && (
               <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto mb-4" />
                    <p className="text-white font-medium">Mixing realities...</p>
                  </div>
               </div>
             )}
          </div>
          
          <div className="bg-white p-4 rounded-xl border-2 border-blue-200 flex items-center gap-4 shadow-sm">
             <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 shadow-sm">
               <img src={selectedImage.url} alt="Source" className="w-full h-full object-cover" />
             </div>
             <div>
               <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Source Artwork</p>
               <p className="text-sm text-slate-700 font-medium truncate max-w-[200px]">{selectedImage.prompt}</p>
             </div>
          </div>
        </div>
      </div>

      {renderedProducts.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Render History</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {renderedProducts.map((prod) => (
              <div 
                key={prod.id}
                onClick={() => onSelectProduct(prod)}
                className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all bg-white ${selectedProduct?.id === prod.id ? 'border-purple-600 ring-4 ring-purple-100' : 'border-slate-200 hover:border-purple-200'}`}
              >
                <img src={prod.previewUrl} alt="Rendered Product" className="w-full h-full object-contain p-2" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-slate-700 truncate text-center shadow-sm">
                   {prod.productType}
                </div>
                {selectedProduct?.id === prod.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg shadow-lg animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
};