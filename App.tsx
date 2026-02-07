import React, { useState, useEffect } from 'react';
import { CreateStep } from './components/CreateStep';
import { RenderStep } from './components/RenderStep';
import { ShipStep } from './components/ShipStep';
import { AppStep, GeneratedImage, RenderedProduct } from './types';
import { Palette, Box, ShoppingCart, ChevronRight } from 'lucide-react';

const LS_KEYS = {
  GENERATED_IMAGES: 'artrealize_generated_images',
  RENDERED_PRODUCTS: 'artrealize_rendered_products',
  SELECTED_IMAGE_ID: 'artrealize_selected_image_id',
  SELECTED_PRODUCT_ID: 'artrealize_selected_product_id',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded — silently ignore
  }
}

const STEPS = [
  { id: AppStep.CREATE, label: 'Create', icon: Palette, description: 'Generate AI Artwork' },
  { id: AppStep.RENDER, label: 'Render', icon: Box, description: 'Visualize on Product' },
  { id: AppStep.SHIP, label: 'Ship', icon: ShoppingCart, description: 'Order & Delivery' },
];

export default function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.CREATE);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>(
    () => loadFromStorage<GeneratedImage[]>(LS_KEYS.GENERATED_IMAGES, [])
  );
  const [renderedProducts, setRenderedProducts] = useState<RenderedProduct[]>(
    () => loadFromStorage<RenderedProduct[]>(LS_KEYS.RENDERED_PRODUCTS, [])
  );
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(() => {
    const images = loadFromStorage<GeneratedImage[]>(LS_KEYS.GENERATED_IMAGES, []);
    const savedId = loadFromStorage<string | null>(LS_KEYS.SELECTED_IMAGE_ID, null);
    return images.find(img => img.id === savedId) ?? null;
  });
  const [selectedProduct, setSelectedProduct] = useState<RenderedProduct | null>(() => {
    const products = loadFromStorage<RenderedProduct[]>(LS_KEYS.RENDERED_PRODUCTS, []);
    const savedId = loadFromStorage<string | null>(LS_KEYS.SELECTED_PRODUCT_ID, null);
    return products.find(p => p.id === savedId) ?? null;
  });

  // Persist state to localStorage
  useEffect(() => { saveToStorage(LS_KEYS.GENERATED_IMAGES, generatedImages); }, [generatedImages]);
  useEffect(() => { saveToStorage(LS_KEYS.RENDERED_PRODUCTS, renderedProducts); }, [renderedProducts]);
  useEffect(() => { saveToStorage(LS_KEYS.SELECTED_IMAGE_ID, selectedImage?.id ?? null); }, [selectedImage]);
  useEffect(() => { saveToStorage(LS_KEYS.SELECTED_PRODUCT_ID, selectedProduct?.id ?? null); }, [selectedProduct]);

  const handleImageSelect = (image: GeneratedImage) => {
    setSelectedImage(image);
    // Optional: Auto advance or let user click next
  };

  const handleImageGenerated = (image: GeneratedImage) => {
    setGeneratedImages(prev => [image, ...prev]);
    setSelectedImage(image);
  };

  const handleProductRendered = (product: RenderedProduct) => {
    setRenderedProducts(prev => [product, ...prev]);
    setSelectedProduct(product);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case AppStep.CREATE:
        return (
          <CreateStep 
            onImageSelect={handleImageSelect} 
            selectedImageId={selectedImage?.id}
            generatedImages={generatedImages}
            onImageGenerated={handleImageGenerated}
          />
        );
      case AppStep.RENDER:
        return (
          <RenderStep 
            selectedImage={selectedImage}
            onProductRendered={handleProductRendered}
            selectedProduct={selectedProduct || undefined}
            renderedProducts={renderedProducts}
            onSelectProduct={setSelectedProduct}
          />
        );
      case AppStep.SHIP:
        // Find the source image associated with the selected product
        const sourceImage = selectedProduct 
          ? generatedImages.find(img => img.id === selectedProduct.originalImageId)
          : null;

        return (
          <ShipStep 
            selectedProduct={selectedProduct}
            sourceImage={sourceImage || null}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <span className="font-bold text-xl tracking-tight">ArtRealize</span>
          </div>
          <div className="text-sm text-slate-500 hidden md:block">
            AI to Reality Pipeline
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Progress Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-center">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = STEPS.findIndex(s => s.id === currentStep) > index;
              const isClickable = index === 0 || 
                (index === 1 && selectedImage) || 
                (index === 2 && selectedProduct);

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => isClickable && setCurrentStep(step.id)}
                    disabled={!isClickable}
                    className={`group flex flex-col items-center gap-2 relative z-10 ${
                      !isClickable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    }`}
                  >
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isActive 
                          ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200 scale-110' 
                          : isCompleted 
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'bg-white border-slate-200 text-slate-400 group-hover:border-purple-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-center absolute top-14 w-32">
                      <p className={`text-sm font-semibold transition-colors ${
                        isActive ? 'text-purple-600' : isCompleted ? 'text-green-600' : 'text-slate-500'
                      }`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-slate-400 hidden md:block">{step.description}</p>
                    </div>
                  </button>
                  
                  {index < STEPS.length - 1 && (
                    <div className={`w-16 md:w-32 h-0.5 mx-2 -mt-6 transition-colors duration-500 ${
                      isCompleted ? 'bg-green-500' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[500px]">
          {renderStepContent()}
        </div>

        {/* Navigation Footer (Mobile friendly) */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:hidden flex justify-between items-center z-40">
           <button 
             onClick={() => {
               const idx = STEPS.findIndex(s => s.id === currentStep);
               if (idx > 0) setCurrentStep(STEPS[idx-1].id);
             }}
             disabled={currentStep === AppStep.CREATE}
             className="px-4 py-2 text-slate-600 font-medium disabled:opacity-30"
           >
             Back
           </button>
           
           <button 
             onClick={() => {
               const idx = STEPS.findIndex(s => s.id === currentStep);
               if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx+1].id);
             }}
             disabled={
               (currentStep === AppStep.CREATE && !selectedImage) ||
               (currentStep === AppStep.RENDER && !selectedProduct) ||
               currentStep === AppStep.SHIP
             }
             className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:bg-slate-300 flex items-center gap-2"
           >
             Next <ChevronRight className="w-4 h-4" />
           </button>
        </div>
      </main>
    </div>
  );
}