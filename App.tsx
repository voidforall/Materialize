import React, { useState, useEffect } from 'react';
import { CreateStep } from './components/CreateStep';
import { RenderStep } from './components/RenderStep';
import { ShipStep } from './components/ShipStep';
import { AppStep, GeneratedImage, RenderedProduct } from './types';
import { Palette, Box, ShoppingCart, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';

const LS_KEYS = {
  GENERATED_IMAGES: 'materialize_generated_images',
  RENDERED_PRODUCTS: 'materialize_rendered_products',
  SELECTED_IMAGE_ID: 'materialize_selected_image_id',
  SELECTED_PRODUCT_ID: 'materialize_selected_product_id',
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
  const [showOnboarding, setShowOnboarding] = useState(true);
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

  if (showOnboarding) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-slate-950 flex flex-col items-center justify-center px-6">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(147,51,234,0.3)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(99,102,241,0.25)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.1)_0%,_transparent_70%)]" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-400/40 rounded-full"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animation: `float ${3 + i * 0.7}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-lg" style={{ animation: 'fadeUp 0.8s ease-out' }}>
          {/* Logo */}
          <div className="mb-8 inline-flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-2xl shadow-purple-500/30 rotate-3">
              M
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-4">
            Materialize
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-purple-200/80 font-light tracking-wide mb-12">
            Imagine it. Own it.
          </p>

          {/* CTA */}
          <button
            onClick={() => setShowOnboarding(false)}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-full font-semibold text-lg shadow-2xl shadow-white/10 hover:shadow-white/20 hover:scale-105 transition-all duration-300"
          >
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Powered by */}
          <p className="mt-10 text-xs text-slate-500">
            Powered by <span className="text-slate-400 font-medium">Gemini</span> & <span className="text-slate-400 font-medium">Nano Banana</span>
          </p>

          {/* Sub-description */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              AI-Generated Art
            </span>
            <span className="w-1 h-1 bg-slate-600 rounded-full" />
            <span>Real Products</span>
            <span className="w-1 h-1 bg-slate-600 rounded-full" />
            <span>Delivered to You</span>
          </div>
        </div>

        {/* Keyframe styles */}
        <style>{`
          @keyframes float {
            from { transform: translateY(0px) scale(1); opacity: 0.4; }
            to { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            <span className="font-bold text-xl tracking-tight">Materialize</span>
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