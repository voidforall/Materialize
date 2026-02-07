import React, { useState, useCallback } from 'react';
import { Wand2, Loader2, ImagePlus, Sparkles, AlertCircle } from 'lucide-react';
import { enhancePrompt, generateImage, checkAndRequestApiKey } from '../services/geminiService';
import { GeneratedImage, ImageResolution } from '../types';

interface CreateStepProps {
  onImageSelect: (image: GeneratedImage) => void;
  selectedImageId?: string;
  generatedImages: GeneratedImage[];
  onImageGenerated: (image: GeneratedImage) => void;
}

export const CreateStep: React.FC<CreateStepProps> = ({ 
  onImageSelect, 
  selectedImageId, 
  generatedImages, 
  onImageGenerated 
}) => {
  const [prompt, setPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [useHighQuality, setUseHighQuality] = useState(false);
  const [resolution, setResolution] = useState<ImageResolution>('1K');
  const [error, setError] = useState<string | null>(null);

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(prompt);
      setPrompt(enhanced);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setError(null);
    setIsGenerating(true);

    try {
      if (useHighQuality) {
        await checkAndRequestApiKey();
      }

      const imageUrl = await generateImage(prompt, useHighQuality, resolution);
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        prompt: prompt,
        createdAt: Date.now(),
      };

      onImageGenerated(newImage);
      // onImageSelect handled by parent when onImageGenerated is called, 
      // but we can call it here if we want instant local feedback or if parent doesn't auto-select
    } catch (e: any) {
      setError(e.message || "Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
           const newImage: GeneratedImage = {
            id: Date.now().toString(),
            url: event.target.result as string,
            prompt: "User uploaded image",
            createdAt: Date.now(),
          };
          onImageGenerated(newImage);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-1 w-full space-y-4">
            <label className="block text-sm font-medium text-slate-700">Describe your artwork</label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic city with neon lights and flying cars, cyberpunk style..."
                className="w-full h-32 p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
              />
              <button
                onClick={handleEnhance}
                disabled={isEnhancing || !prompt.trim()}
                className="absolute bottom-3 right-3 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-200 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Enhance
              </button>
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="hq-mode" 
                      checked={useHighQuality} 
                      onChange={(e) => setUseHighQuality(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="hq-mode" className="text-sm text-slate-700 font-medium">High Quality (Pro)</label>
                 </div>
                 
                 {useHighQuality && (
                   <select 
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value as ImageResolution)}
                      className="text-sm border-slate-300 rounded-md shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                   >
                     <option value="1K">1K</option>
                     <option value="2K">2K</option>
                     <option value="4K">4K</option>
                   </select>
                 )}
              </div>

              <div className="flex gap-2">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium">
                  <ImagePlus className="w-4 h-4" />
                  Upload
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm font-bold shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  Generate
                </button>
              </div>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            
            {useHighQuality && (
              <p className="text-xs text-slate-500">
                Note: High Quality generation uses Gemini 3 Pro and requires you to select a paid API key project.
              </p>
            )}

          </div>
        </div>
      </div>

      {generatedImages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Your Gallery</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {generatedImages.map((img) => (
              <div 
                key={img.id}
                onClick={() => onImageSelect(img)}
                className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedImageId === img.id ? 'border-purple-600 ring-4 ring-purple-100' : 'border-transparent hover:border-purple-200'}`}
              >
                <img src={img.url} alt="Generated" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                {selectedImageId === img.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};