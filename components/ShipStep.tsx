import React, { useState, useEffect } from 'react';
import { RenderedProduct, ProductType, GeneratedImage, PrintfulShippingRate } from '../types';
import { Truck, CheckCircle, CreditCard, ShoppingBag, MapPin, Package, AlertCircle, Loader2, Factory, Wifi, WifiOff, ShieldCheck } from 'lucide-react';
import { hostImage, createDraftOrder, checkPrintfulConnection, generatePrintfulMockups, confirmOrder, estimateShippingRates, estimateOrderCosts } from '../services/printfulService';

// Common countries — Printful ships to most, but these cover the vast majority of orders
const COUNTRIES = [
  { code: 'US', name: 'United States', hasStates: true },
  { code: 'CA', name: 'Canada', hasStates: true },
  { code: 'GB', name: 'United Kingdom', hasStates: false },
  { code: 'AU', name: 'Australia', hasStates: true },
  { code: 'DE', name: 'Germany', hasStates: false },
  { code: 'FR', name: 'France', hasStates: false },
  { code: 'ES', name: 'Spain', hasStates: false },
  { code: 'IT', name: 'Italy', hasStates: false },
  { code: 'NL', name: 'Netherlands', hasStates: false },
  { code: 'JP', name: 'Japan', hasStates: true },
  { code: 'SE', name: 'Sweden', hasStates: false },
  { code: 'NO', name: 'Norway', hasStates: false },
  { code: 'DK', name: 'Denmark', hasStates: false },
  { code: 'FI', name: 'Finland', hasStates: false },
  { code: 'IE', name: 'Ireland', hasStates: false },
  { code: 'NZ', name: 'New Zealand', hasStates: false },
  { code: 'AT', name: 'Austria', hasStates: false },
  { code: 'BE', name: 'Belgium', hasStates: false },
  { code: 'CH', name: 'Switzerland', hasStates: false },
  { code: 'PT', name: 'Portugal', hasStates: false },
  { code: 'PL', name: 'Poland', hasStates: false },
  { code: 'BR', name: 'Brazil', hasStates: true },
  { code: 'MX', name: 'Mexico', hasStates: true },
];

interface ShipStepProps {
  selectedProduct: RenderedProduct | null;
  sourceImage: GeneratedImage | null;
}

export const ShipStep: React.FC<ShipStepProps> = ({ selectedProduct, sourceImage }) => {
  const [isOrdered, setIsOrdered] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [publicImageUrl, setPublicImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [preparingStatus, setPreparingStatus] = useState('Connecting to Printful...');

  // Mockup state
  const [mockupUrls, setMockupUrls] = useState<string[]>([]);
  const [isGeneratingMockups, setIsGeneratingMockups] = useState(false);

  // Shipping & cost state
  const [shippingRates, setShippingRates] = useState<PrintfulShippingRate[]>([]);
  const [estimatedCosts, setEstimatedCosts] = useState<any>(null);

  // Form state — bare minimum for Printful
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    zip: '',
    state: '',
    country: 'US',
  });

  // Initialize Printful integration on mount
  useEffect(() => {
    const initPrintful = async () => {
      if (!sourceImage || !selectedProduct) return;

      setIsPreparing(true);
      setError(null);

      try {
        // 1. Check connection
        setPreparingStatus('Connecting to Printful...');
        const connected = await checkPrintfulConnection();
        setIsConnected(connected);

        if (!connected) {
          setError("Could not connect to Printful. Running in simulation mode.");
          return;
        }

        // 2. Upload image to public host
        setPreparingStatus('Uploading artwork...');
        console.log("Uploading artwork to public host...");
        const imageUrl = await hostImage(sourceImage.url);
        setPublicImageUrl(imageUrl);
        console.log("Public image URL:", imageUrl);

        // 3. Generate mockups (non-blocking, falls back to local preview)
        setIsGeneratingMockups(true);
        generatePrintfulMockups(imageUrl, selectedProduct.productType)
          .then(urls => setMockupUrls(urls))
          .catch(err => console.warn("Mockup generation failed, using local preview:", err))
          .finally(() => setIsGeneratingMockups(false));

        // 4. Estimate shipping rates
        setPreparingStatus('Estimating costs...');
        const recipient = {
          address1: formData.address,
          city: formData.city,
          country_code: formData.country,
          state_code: formData.state,
          zip: formData.zip,
        };

        try {
          const rates = await estimateShippingRates(recipient, selectedProduct.productType);
          setShippingRates(rates);
        } catch (err) {
          console.warn("Shipping rate estimation failed:", err);
        }

        // 5. Estimate order costs
        try {
          const costs = await estimateOrderCosts(
            { ...recipient, name: formData.name },
            imageUrl,
            selectedProduct.productType,
          );
          setEstimatedCosts(costs);
        } catch (err) {
          console.warn("Cost estimation failed:", err);
        }
      } catch (e: any) {
        console.error(e);
        setError("Could not connect to manufacturing: " + e.message);
      } finally {
        setIsPreparing(false);
      }
    };

    initPrintful();
  }, [sourceImage, selectedProduct]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const selectedCountry = COUNTRIES.find(c => c.code === formData.country);
  const needsState = selectedCountry?.hasStates ?? false;

  // Phase 1: Place Order (creates draft)
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      if (isConnected && publicImageUrl && selectedProduct) {
        const recipient: any = {
          name: formData.name,
          address1: formData.address,
          city: formData.city,
          country_code: formData.country,
          zip: formData.zip,
        };
        if (formData.state) recipient.state_code = formData.state;

        const result = await createDraftOrder(recipient, publicImageUrl, selectedProduct.productType);
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

  // Phase 2: Confirm & Ship (confirms draft order)
  const handleConfirmOrder = async () => {
    if (!orderDetails?.id) return;
    setIsConfirming(true);
    setError(null);

    try {
      const result = await confirmOrder(orderDetails.id);
      setOrderDetails(result);
      setIsConfirmed(true);
    } catch (e: any) {
      console.error(e);
      setError("Failed to confirm order: " + (e.message || "Unknown error"));
    } finally {
      setIsConfirming(false);
    }
  };

  const cheapestRate = shippingRates.length > 0 ? shippingRates[0] : null;
  const displayShipping = estimatedCosts ? `${estimatedCosts.currency} ${estimatedCosts.shipping}` : cheapestRate ? `$${cheapestRate.rate}` : '$4.99';
  const displaySubtotal = estimatedCosts ? `${estimatedCosts.currency} ${estimatedCosts.subtotal}` : '—';
  const displayTotal = estimatedCosts ? `${estimatedCosts.currency} ${estimatedCosts.total}` : '—';
  const displayShippingName = cheapestRate ? cheapestRate.name : 'Standard';

  // Use mockup if available, otherwise fall back to local preview
  const previewImage = mockupUrls.length > 0 ? mockupUrls[0] : selectedProduct?.previewUrl;

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

  // Order confirmation screen (after draft is created)
  if (isOrdered) {
    return (
      <div className="max-w-md mx-auto text-center space-y-8 py-12 animate-fade-in">
        <div className="relative">
          <div className={`w-24 h-24 ${isConfirmed ? 'bg-green-100' : 'bg-amber-100'} rounded-full flex items-center justify-center mx-auto ${isConfirmed ? 'text-green-600' : 'text-amber-600'}`}>
            {isConfirmed ? <CheckCircle className="w-12 h-12" /> : <ShieldCheck className="w-12 h-12" />}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            {isConfirmed ? 'Order Confirmed!' : 'Draft Order Created'}
          </h2>
          <p className="text-slate-600">
            {isConfirmed
              ? `Your custom ${selectedProduct.productType} is being manufactured.`
              : `Review the real costs below, then confirm to start manufacturing.`}
          </p>
          <div className="inline-block bg-slate-100 px-4 py-1 rounded-full text-slate-500 text-sm font-mono mt-4">
            Order #{orderDetails ? orderDetails.id : `ART-${Date.now().toString().slice(-6)}`}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <div className="aspect-square w-48 h-48 mx-auto mb-6 bg-slate-50 rounded-xl overflow-hidden relative">
             <img src={previewImage} alt="Ordered" className="w-full h-full object-contain mix-blend-multiply" />
             {isConfirmed && (
               <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                 CONFIRMED
               </div>
             )}
             {orderDetails && !isConfirmed && (
               <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                 DRAFT
               </div>
             )}
           </div>

           <div className="space-y-2 text-sm">
             <div className="flex justify-between text-slate-500">
               <span>Status</span>
               <span className="font-semibold text-slate-900">
                 {isConfirmed ? 'Confirmed — Manufacturing' : orderDetails ? 'Draft — Awaiting Confirmation' : 'Processing'}
               </span>
             </div>
             <div className="flex justify-between text-slate-500">
               <span>Shipping to</span>
               <span className="font-semibold text-slate-900">{formData.city}{formData.state ? `, ${formData.state}` : ''}, {formData.country}</span>
             </div>
             {orderDetails?.costs && (
               <div className="pt-2 border-t border-slate-100 mt-2 space-y-2">
                 <div className="flex justify-between text-slate-500">
                   <span>Subtotal</span>
                   <span className="font-semibold text-slate-900">{orderDetails.costs.currency} {orderDetails.costs.subtotal}</span>
                 </div>
                 <div className="flex justify-between text-slate-500">
                   <span>Shipping</span>
                   <span className="font-semibold text-slate-900">{orderDetails.costs.currency} {orderDetails.costs.shipping}</span>
                 </div>
                 <div className="flex justify-between text-slate-700 font-bold pt-2 border-t border-slate-100">
                   <span>Total</span>
                   <span>{orderDetails.costs.currency} {orderDetails.costs.total}</span>
                 </div>
               </div>
             )}
           </div>
        </div>

        {/* Dashboard link */}
        {orderDetails?.dashboard_url && (
          <a
            href={orderDetails.dashboard_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            View on Printful Dashboard
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        )}

        {/* Phase 2: Confirm & Ship button (only show for drafts) */}
        {orderDetails && !isConfirmed && (
          <div className="space-y-3">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <div className="p-3 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-200">
              Clicking below will charge your Printful wallet and start manufacturing. This cannot be undone.
            </div>
            <button
              onClick={handleConfirmOrder}
              disabled={isConfirming}
              className="w-full py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isConfirming ? (
                <span className="animate-pulse flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Confirming Order...
                </span>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Confirm & Ship ({orderDetails.costs?.currency} {orderDetails.costs?.total || '—'})
                </>
              )}
            </button>
          </div>
        )}

        {isConfirmed && (
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            Create Another Masterpiece
          </button>
        )}

        {!orderDetails && (
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            Create Another Masterpiece
          </button>
        )}
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
                 {isConnected ? 'Printful Connected' : 'Simulated'}
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
                  placeholder="Jane Doe"
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
                  placeholder="123 Main St"
                  className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                <select
                  required
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className={`grid ${needsState ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
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
                {needsState && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <input
                      required
                      name="state"
                      type="text"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="NY"
                      className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all uppercase"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ZIP / Postal</label>
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
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-6">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-600">Payment handled by Printful (charged to your Printful wallet)</span>
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
                    <span className="animate-pulse">Creating Draft Order...</span>
                  ) : isPreparing ? (
                    <span className="animate-pulse">{preparingStatus}</span>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      Place Order {estimatedCosts ? `(${estimatedCosts.currency} ${estimatedCosts.total})` : ''}
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
            {(isPreparing || isGeneratingMockups) && (
               <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10 flex-col gap-2">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  <span className="text-xs text-slate-300 font-medium">
                    {isGeneratingMockups ? 'Generating Printful Mockup...' : preparingStatus}
                  </span>
               </div>
            )}

            <div className="aspect-square w-full bg-white/5 rounded-lg overflow-hidden flex items-center justify-center mb-4 border border-white/10">
               <img src={previewImage} alt="Product" className="w-full h-full object-contain" />
            </div>

            <div className="flex justify-between items-start">
               <div>
                 <h4 className="font-semibold text-lg">{selectedProduct.productType}</h4>
                 <div className="flex items-center gap-2 mt-1">
                   <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-500'}`} />
                   <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                     {isConnected ? (mockupUrls.length > 0 ? 'Printful Mockup' : 'Connected') : 'Offline Mode'}
                   </p>
                 </div>
               </div>
            </div>

            {!isConnected && !isPreparing && (
              <div className="mt-4 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-200">
                Note: Could not connect to Printful. Check your API key and proxy config.
              </div>
            )}
          </div>

          <div className="space-y-3 text-sm text-slate-300 py-4 border-t border-white/10">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{displaySubtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{displayShipping}</span>
            </div>
            {estimatedCosts && (
              <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/10 mt-2">
                <span>Estimated Total</span>
                <span>{displayTotal}</span>
              </div>
            )}
            {cheapestRate && cheapestRate.minDeliveryDays && (
              <div className="flex justify-between text-xs text-slate-400">
                <span>Delivery estimate</span>
                <span>{cheapestRate.minDeliveryDays}–{cheapestRate.maxDeliveryDays} business days</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 justify-center">
             <Truck className="w-4 h-4" />
             <span>Ships via {displayShippingName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
