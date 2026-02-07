import React, { useState, useEffect } from 'react';
import { RenderedProduct, ProductType, GeneratedImage } from '../types';
import { Truck, CheckCircle, CreditCard, ShoppingBag, MapPin, Package, AlertCircle, Loader2, Factory, Wifi, WifiOff } from 'lucide-react';
import { isPrintfulConfigured, uploadPrintfulFile, createDraftOrder, checkPrintfulConnection } from '../services/printfulService';

interface ShipStepProps {
  selectedProduct: RenderedProduct | null;
  sourceImage: GeneratedImage | null;
}

export const ShipStep: React.FC<ShipStepProps> = ({ selectedProduct, sourceImage }) => {
  const [isOrdered, setIsOrdered] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [printfulFileId, setPrintfulFileId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: 'Jane Doe',
    address: '1904 Granville Lane',
    city: 'New Jersey',
    zip: '07001',
    state: 'NJ',
    country: 'US',
    email: 'jane@example.com'
  });

  // Initialize Printful integration on mount
  useEffect(() => {
    const initPrintful = async () => {
      if (!sourceImage || !selectedProduct) return;
      if (!isPrintfulConfigured()) return;

      setIsPreparing(true);
      setError(null);
      
      try {
        // 0. Check Connection
        const connected = await checkPrintfulConnection();
        setIsConnected(connected);

        if (connected) {
          // 1. Upload File
          console.log("Uploading to Printful...");
          const id = await uploadPrintfulFile(sourceImage.url);
          setPrintfulFileId(id);
        } else {
          setError("Connected to Printful failed. Please check the API Token.");
        }
      } catch (e: any) {
        console.error(e);
        setError("Could not connect to manufacturing. Running in simulation mode.");
      } finally {
        setIsPreparing(false);
      }
    };

    initPrintful();
  }, [sourceImage, selectedProduct]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      if (isConnected && printfulFileId && selectedProduct) {
        // Create Real Draft Order
        const recipient = {
          name: formData.name,
          address1: formData.address,
          city: formData.city,
          state_code: formData.state,
          country_code: formData.country,
          zip: formData.zip,
          email: formData.email
        };

        const result = await createDraftOrder(recipient, printfulFileId, selectedProduct.productType);
        setOrderDetails(result);
      } else {
        // Simulate
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      setIsOrdered(true);
    } catch (e: any) {
      console.error(e);
      setError("Failed to create order: " + (e.message || "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedProduct) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">No Product Selected</h3>
        <p className="text-slate-500 max-w-sm text-center mt-2">
          Please go back to the "Render" step to visualize your artwork on a product before shipping.
        </p>
      </div>
    );
  }

  if (isOrdered) {
    return (
      <div className="max-w-md mx-auto text-center space-y-8 py-12 animate-fade-in">
        <div className="relative">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 animate-bounce">
            <CheckCircle className="w-12 h-12" />
          </div>
        </div>
        
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Order Confirmed!</h2>
          <p className="text-slate-600">Your custom {selectedProduct.productType} is being manufactured.</p>
          <div className="inline-block bg-slate-100 px-4 py-1 rounded-full text-slate-500 text-sm font-mono mt-4">
            Order #{orderDetails ? orderDetails.id : `ART-${Date.now().toString().slice(-6)}`}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <div className="aspect-square w-48 h-48 mx-auto mb-6 bg-slate-50 rounded-xl overflow-hidden relative">
             <img src={selectedProduct.previewUrl} alt="Ordered" className="w-full h-full object-contain mix-blend-multiply" />
             {orderDetails && (
               <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                 PRINTFUL CONFIRMED
               </div>
             )}
           </div>
           
           <div className="space-y-2 text-sm">
             <div className="flex justify-between text-slate-500">
               <span>Status</span>
               <span className="font-semibold text-slate-900">{orderDetails ? 'Draft Created' : 'Processing'}</span>
             </div>
             <div className="flex justify-between text-slate-500">
               <span>Shipping to</span>
               <span className="font-semibold text-slate-900">{formData.city}</span>
             </div>
             {orderDetails && (
               <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-100 mt-2">
                  <span>Printful Cost</span>
                  <span className="font-semibold text-slate-900">{orderDetails.costs.total} {orderDetails.retail_costs?.currency}</span>
               </div>
             )}
           </div>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
        >
          Create Another Masterpiece
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 animate-fade-in">
      {/* Checkout Form */}
      <div className="space-y-6">
         <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <MapPin className="w-5 h-5 text-purple-600" />
                 Shipping Details
              </div>
              
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${isConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                 {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                 {isConnected ? 'API Connected' : 'Simulated'}
              </div>
            </h3>
            
            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  required
                  name="name"
                  type="text" 
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input 
                  required
                  name="address"
                  type="text" 
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Creative Blvd"
                  className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input 
                    required
                    name="city"
                    type="text" 
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="New York"
                    className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State Code</label>
                  <input 
                    required
                    name="state"
                    type="text" 
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="NY"
                    maxLength={2}
                    className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all uppercase"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code</label>
                  <input 
                    required
                    name="zip"
                    type="text" 
                    value={formData.zip}
                    onChange={handleInputChange}
                    placeholder="10001"
                    className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Country Code</label>
                  <input 
                    required
                    name="country"
                    type="text" 
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="US"
                    maxLength={2}
                    className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all uppercase"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-6">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-600">Secure Payment (Demo)</span>
                </div>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing || isPreparing}
                  className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <span className="animate-pulse">Placing Printful Order...</span>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      Place Order
                    </>
                  )}
                </button>
              </div>
            </form>
         </div>
      </div>

      {/* Order Summary */}
      <div className="space-y-6">
        <div className="bg-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-xl sticky top-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Factory className="w-5 h-5 text-purple-400" />
            Manufacturing Preview
          </h3>
          
          <div className="bg-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm relative overflow-hidden">
            {isPreparing && (
               <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10 flex-col gap-2">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  <span className="text-xs text-slate-300 font-medium">Connecting to Printful...</span>
               </div>
            )}
            
            <div className="aspect-square w-full bg-white/5 rounded-lg overflow-hidden flex items-center justify-center mb-4 border border-white/10">
               <img src={selectedProduct.previewUrl} alt="Product" className="w-full h-full object-contain" />
            </div>
            
            <div className="flex justify-between items-start">
               <div>
                 <h4 className="font-semibold text-lg">{selectedProduct.productType}</h4>
                 <div className="flex items-center gap-2 mt-1">
                   <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-500'}`} />
                   <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                     {isConnected ? 'Connected' : 'Offline Mode'}
                   </p>
                 </div>
               </div>
               <span className="font-bold text-xl">$29.99</span>
            </div>
            
            {!isConnected && !isPreparing && (
              <div className="mt-4 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-200">
                Note: Configure <code>PRINTFUL_API_KEY</code> to enable real manufacturing connection.
              </div>
            )}
          </div>

          <div className="space-y-3 text-sm text-slate-300 py-4 border-t border-white/10">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>$29.99</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>$4.99</span>
            </div>
            <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/10 mt-2">
              <span>Total</span>
              <span>$34.98</span>
            </div>
          </div>
          
          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 justify-center">
             <Truck className="w-4 h-4" />
             <span>Ships via USPS First Class</span>
          </div>
        </div>
      </div>
    </div>
  );
};