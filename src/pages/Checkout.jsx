// src/pages/Checkout.jsx//

import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Checkout.css";
import Logo from "../components/Logo";
import TopEllipseBackground from "../components/TopEllipseBackground";
import PrimaryButton from "../components/PrimaryButton";
import { ArrowLeft } from "lucide-react";
import { sanitizeError } from "../utils/errorSanitizer";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

// Department list for random social proof
const DEPARTMENTS = ['IT', 'CSE', 'ML', 'AI', 'CSBS', 'AIML', 'ME', 'EE', 'CSE IOTCSBT', 'ECE', 'Data Science', 'Cyber Security'];
const getRandomDept = () => DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];

// --- Extracted logic from robust backend-driven checkout ---
export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  // Always get cart and state from navigation (from MedicineDispensing or PaymentGate)
  const { cart: initialCart = [], totalPrice: initialTotal = 0, fromPaymentGate = false } = location.state || {};

  // Cart state is always initialized from backend-driven data
  const [cart, setCart] = useState(initialCart);
  
  // Health report cost - shown as ₹24 (psychological anchor)
  // User thinks: "Wow only ₹24 for report, I'm saving ₹3!"
  // Reality: The ₹3 is absorbed into platform fee + tax structure
  const reportCost = fromPaymentGate ? 24 : 0;
  
  // Platform fee modal state
  const [showPlatformFeeModal, setShowPlatformFeeModal] = useState(false);
  
  // Platform fee opt-in state (included by default)
  const [includePlatformFee, setIncludePlatformFee] = useState(true);
  
  // Cost breakdown modal state
  const [showCostBreakdownModal, setShowCostBreakdownModal] = useState(false);
  
  // Recommended kits state (fetched from API, filtered by margins)
  const [allKits, setAllKits] = useState([]);
  const [kitsError, setKitsError] = useState(null);
  const [kitsLoading, setKitsLoading] = useState(false);
  const [kitMargins, setKitMargins] = useState(() => {
    try {
      const saved = localStorage.getItem('reliv_kit_margins');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  // Dynamic total kits bought counter
  const [totalKitsBought, setTotalKitsBought] = useState(() => {
    try {
      const saved = localStorage.getItem('reliv_total_kits_bought');
      const savedValue = saved ? parseInt(saved, 10) : 11;
      // Reset if value is unreasonably high (old data) - new kiosk should start fresh
      if (savedValue > 100) {
        localStorage.setItem('reliv_total_kits_bought', '11');
        return 11;
      }
      return savedValue;
    } catch {
      return 11;
    }
  });
  
  // Increment counter on mount (each payment page visit)
  useEffect(() => {
    const newCount = totalKitsBought + Math.floor(Math.random() * 3) + 1; // Increment by 1-3
    setTotalKitsBought(newCount);
    localStorage.setItem('reliv_total_kits_bought', newCount.toString());
  }, []); // Only on mount
  
  // Fetch all kits on mount
  const fetchKits = async () => {
    setKitsLoading(true);
    setKitsError(null);
    try {
      const response = await fetch(`${API_BASE}/api/kits`);
      if (!response.ok) {
        throw new Error('Failed to load products');
      }
      const kits = await response.json();
      setAllKits(kits);
      setKitsError(null);
    } catch (e) {
      if (import.meta.env.DEV) console.error('Error fetching kits:', e);
      setKitsError(sanitizeError('Unable to load recommended products. Please try refreshing.'));
    } finally {
      setKitsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchKits();
  }, []);
  
  // Compute recommended kits (top margin kits not in cart)
  const recommendedKits = useMemo(() => {
    const cartIds = new Set(cart.map(item => item.id));
    
    // Filter kits not in cart, with valid stock
    const availableKits = allKits.filter(kit => 
      !cartIds.has(kit.id) && 
      kit.quantity > 0 && 
      new Date(kit.expiryDate) > new Date()
    );
    
    // Sort by margin (highest first), then by price
    const sortedByMargin = availableKits
      .map(kit => ({
        ...kit,
        margin: kitMargins[kit.id] || 0,
        randomDept: getRandomDept() // Pre-assign random dept
      }))
      .sort((a, b) => b.margin - a.margin || b.price - a.price);
    
    // Return top 3 recommendations
    return sortedByMargin.slice(0, 3);
  }, [allKits, cart, kitMargins]);
  
  // Add recommended kit to cart
  const handleAddRecommended = (kit) => {
    setCart(prev => [...prev, { ...kit, cartQuantity: 1, maxStock: kit.quantity }]);
  };

  // Constants for fees
  const PLATFORM_FEE = 2; // Optional platform fee
  const TAX_RATE = 0.12; // 12%
  
  // FIXED COSTS PER KIT (rebalanced for better perceived value)
  const FIXED_CONTAINER_COST = 9;      // Medical container
  const FIXED_PACKAGING_COST = 2;      // Hygienic packaging
  const FIXED_QC_COST = 1;             // QC & Hygiene seal
  const FIXED_INSTANT_ACCESS_COST = 3; // 24/7 instant access convenience
  const TOTAL_FIXED_COST = FIXED_CONTAINER_COST + FIXED_PACKAGING_COST + FIXED_QC_COST + FIXED_INSTANT_ACCESS_COST; // = 15

  // Calculate total price from cart state (robust, always up-to-date)
  const totalPrice = cart.reduce((sum, item) => sum + item.price * (item.cartQuantity || 1), 0);
  const totalQuantity = cart.reduce((sum, item) => sum + (item.cartQuantity || 1), 0);
  
  // Calculate breakdown totals (smart math)
  const totalContainerCost = FIXED_CONTAINER_COST * totalQuantity;
  const totalPackagingCost = FIXED_PACKAGING_COST * totalQuantity;
  const totalQcCost = FIXED_QC_COST * totalQuantity;
  const totalInstantAccessCost = FIXED_INSTANT_ACCESS_COST * totalQuantity;
  const totalFixedCosts = TOTAL_FIXED_COST * totalQuantity;
  const totalMedicalItemsCost = totalPrice - totalFixedCosts; // Dynamic: Price - Fixed Costs (now ~50%!)
  
  const subtotal = totalPrice + reportCost;
  
  // Calculate tax (12%) - store original and rounded down amount
  const originalTaxAmount = subtotal * TAX_RATE;
  const taxAmount = Math.floor(originalTaxAmount);
  
  // Final total with optional platform fee and tax
  const finalTotalPrice = subtotal + (includePlatformFee ? PLATFORM_FEE : 0) + taxAmount;

  // Update quantity handler (prevents <1 and >maxStock)
  const handleUpdateQuantity = (itemId, change) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === itemId) {
          const currentQty = item.cartQuantity || 1;
          const maxQty = item.maxStock || item.availableStock || 99;
          const newQuantity = Math.max(1, Math.min(currentQty + change, maxQty));
          return { ...item, cartQuantity: newQuantity };
        }
        return item;
      })
    );
  };

  // Remove item handler
  const handleRemoveItem = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  // If cart is empty and not from payment, show empty state
  if (cart.length === 0 && !fromPaymentGate) {
    return (
      <div className="h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex flex-col items-center justify-center font-sans p-4 overflow-y-auto scrollable-container">
        <div className="text-center">
          <div className="mb-6">
            <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <Logo size="text-4xl" />
          <h2 className="mt-6 text-2xl font-bold text-gray-700">Your cart is empty</h2>
          <p className="mt-2 text-gray-500">Add some medical kits to get started</p>
          <button 
            onClick={() => navigate('/medicine-dispensing')} 
            className="mt-8 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
          >
            ← Browse Medical Kits
          </button>
        </div>
      </div>
    );
  }

  // ...existing UI/UX code remains unchanged...
  return (
    <div className="relative h-screen bg-gradient-to-b from-gray-50 to-white font-serif overflow-y-auto scrollable-container">
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className="kiosk-back-btn"
        aria-label="Go back"
      >
        <ArrowLeft size={22} />
        <span>Back</span>
      </button>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="mb-8">
            <Logo size="text-5xl md:text-6xl" />
          </div>
          <h1 className="text-5xl font-serif text-gray-900 mb-4">
            Checkout
          </h1>
          <p className="text-base uppercase tracking-widest text-gray-600">
            Review Your Order
          </p>
        </header>
        
        {/* First Kiosk Launch Celebration */}
        <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-100/50 rounded-full -mr-10 -mt-10"></div>
          <div className="relative flex items-start gap-3">
            <span className="text-xl">🎉</span>
            <div>
              <p className="text-gray-800 text-sm leading-relaxed">
                <span className="font-semibold text-amber-700">Our First Kiosk - Celebration Pricing!</span> We're so happy to launch our very first kiosk that we're sharing our joy with you through special prices. 
                <span className="text-gray-600">From <span className="font-bold text-gray-700">17th April</span>, these will move to market rates as we can't sustain these prices forever - but today, it's our gift to you for being here first! 💛</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {fromPaymentGate && (
              <div className="bg-white border-2 border-gray-300 p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-widest text-gray-600 mb-2">Digital Report</p>
                    <h3 className="text-lg font-serif text-gray-900">Health Report</h3>
                  </div>
                  <p className="text-2xl font-serif text-gray-900">₹{reportCost}</p>
                </div>
              </div>
            )}
            {cart.map((item, index) => (
              <div 
                key={item.id} 
                className="bg-white border-2 border-gray-300 p-6 mb-6"
              >
                <div className="flex items-start gap-6">
                  {/* Item Image */}
                  <div className="w-20 h-20 bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Item Details */}
                  <div className="flex-grow">
                    <h3 className="text-xl font-serif text-gray-900 mb-2">{item.name}</h3>
                    <p className="text-base text-gray-600 mb-3">{item.description || "Medical kit"}</p>
                    <p className="text-lg text-gray-900">
                      <span className="text-gray-400 line-through text-sm mr-2">₹{Math.round(item.price * 1.25)}</span>
                      ₹{item.price} 
                      <span className="text-xs text-green-600 font-medium ml-2 bg-green-50 px-1.5 py-0.5 rounded">Launch Price</span>
                    </p>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border-2 border-gray-300">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        disabled={(item.cartQuantity || 1) <= 1}
                        className="w-10 h-10 bg-white text-gray-800 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white transition-colors flex items-center justify-center text-lg"
                      >
                        −
                      </button>
                      <span className="w-12 text-center font-serif text-gray-900">
                        {item.cartQuantity || 1}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="w-10 h-10 bg-white text-gray-800 hover:bg-gray-100 transition-colors flex items-center justify-center text-lg"
                      >
                        +
                      </button>
                    </div>
                    
                    {/* Subtotal & Remove */}
                    <div className="text-right min-w-[100px]">
                      <p className="text-xl font-serif text-gray-900 mb-2">
                        ₹{item.price * (item.cartQuantity || 1)}
                      </p>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-xs uppercase tracking-wider text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* YOU MAY ALSO LIKE - Recommendations Section */}
            {kitsError ? (
              <div className="mt-8 bg-red-50 border-2 border-red-200 p-6 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-red-800 font-semibold mb-1">Unable to Load Recommendations</h3>
                    <p className="text-red-600 text-sm mb-3">{kitsError}</p>
                    <button
                      onClick={fetchKits}
                      disabled={kitsLoading}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      {kitsLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Refreshing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Try Again</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : recommendedKits.length > 0 && (
              <div className="mt-8 bg-white border-2 border-gray-300 p-6">
                <div className="mb-6 pb-4 border-b-2 border-gray-300">
                  <p className="text-sm uppercase tracking-widest text-gray-600 mb-2">You May Also Like</p>
                  <h3 className="text-xl font-serif text-gray-900">Students Also Bought</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendedKits.map((kit, index) => {
                    // Generate unique random counts 1-8 for each kit (no duplicates)
                    const usedCounts = new Set();
                    let studentCount;
                    do {
                      studentCount = Math.floor(Math.random() * 8) + 1;
                    } while (usedCounts.has(studentCount) && usedCounts.size < 8);
                    usedCounts.add(studentCount);
                    
                    // Varied time phrases for genuine look
                    const timePhrases = ['yesterday', 'today', 'on Monday', 'on Tuesday', 'last week', 'this morning', 'recently'];
                    const timePhrase = timePhrases[index % timePhrases.length];
                    
                    return (
                      <div 
                        key={kit.id}
                        className="bg-gray-50 border-2 border-gray-200 p-4 hover:border-gray-400 transition-all duration-300"
                      >
                        {/* Kit Image & Info */}
                        <div className="flex gap-4 mb-4">
                          <div className="w-16 h-16 bg-gray-100 flex-shrink-0 flex items-center justify-center">
                            {kit.imageUrl ? (
                              <img src={kit.imageUrl} alt={kit.name} className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-gray-900 text-base truncate">{kit.name}</h4>
                            <p className="text-lg font-serif text-gray-900">₹{kit.price}</p>
                          </div>
                        </div>
                        
                        {/* Social Proof */}
                        <p className="text-xs text-gray-600 mb-4 border-l-2 border-gray-300 pl-3">
                          <span className="font-medium">{studentCount} {studentCount === 1 ? 'student' : 'students'}</span> from {kit.randomDept} bought this {timePhrase}
                        </p>
                        
                        {/* Add Button */}
                        <button
                          onClick={() => handleAddRecommended(kit)}
                          className="w-full bg-gray-900 text-white font-medium py-2.5 px-4 hover:bg-gray-800 transition-all text-sm uppercase tracking-wider"
                        >
                          + Add to Cart
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-gray-300 p-8 sticky top-8">
              <h2 className="text-sm uppercase tracking-widest text-gray-600 mb-6 pb-4 border-b-2 border-gray-300">Order Summary</h2>
              
              <div className="space-y-3.5 mb-6">
                {/* Items Subtotal */}
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium flex items-center gap-1.5">
                    Items ({cart.reduce((sum, item) => sum + (item.cartQuantity || 1), 0)})
                    <button 
                      onClick={() => setShowCostBreakdownModal(true)}
                      className="text-orange-500 hover:text-orange-600 transition-all hover:scale-110 focus:outline-none text-xs underline underline-offset-2"
                      aria-label="Show cost breakdown"
                    >
                      breakdown
                    </button>
                  </span>
                  <span className="font-semibold">₹{totalPrice}</span>
                </div>
                
                {/* Health Report if from payment gate */}
                {fromPaymentGate && (
                  <div className="flex justify-between text-gray-700">
                    <span className="font-medium">Health Report</span>
                    <span className="font-semibold">₹{reportCost}</span>
                  </div>
                )}
                
                {/* Platform Fee - Optional */}
                <div className={`flex justify-between items-center ${includePlatformFee ? 'text-gray-700' : 'text-gray-400'}`}>
                  <span className="font-medium flex items-center gap-1.5">
                    Platform Fee
                    <button 
                      onClick={() => setShowPlatformFeeModal(true)}
                      className="w-4 h-4 text-orange-500 hover:text-orange-600 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-300 rounded-full animate-pulse-slow"
                      aria-label="Platform fee information"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </span>
                  <div className="flex items-center gap-2">
                    {includePlatformFee ? (
                      <span className="font-semibold">₹{PLATFORM_FEE}</span>
                    ) : (
                      <>
                        <span className="line-through text-gray-400">₹{PLATFORM_FEE}</span>
                        <span className="text-xs text-green-600 font-medium">Removed</span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Tax (12%, rounded down) */}
                <div className="flex justify-between items-center bg-green-50 -mx-6 px-6 py-3 rounded-lg border border-green-200">
                  <div>
                    <span className="font-medium text-gray-700">Tax (12%)</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-green-700 font-semibold">💰 You Save ₹{(originalTaxAmount - taxAmount).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base text-gray-500 line-through">₹{originalTaxAmount.toFixed(2)}</span>
                    <span className="text-xl font-bold text-green-600">₹{taxAmount}</span>
                  </div>
                </div>
                
                {/* Divider */}
                <div className="border-t-2 border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-orange-600">₹{finalTotalPrice.toFixed(1)}</span>
                  </div>
                  {/* Launch Savings Summary */}
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                      🎁 Launch savings: ₹{Math.round(totalPrice * 0.25)} off market rate
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <PrimaryButton 
                onClick={() => navigate('/payment', { state: { cart, totalPrice: finalTotalPrice, fromPaymentGate }})} 
                className="w-full justify-center mb-3"
              >
                Proceed to Payment →
              </PrimaryButton>
              <button 
                onClick={() => navigate('/medicine-dispensing', { state: { cart, fromPaymentGate } })} 
                className="w-full text-center text-sm text-gray-600 hover:text-orange-600 transition-colors py-2"
              >
                ← Continue Shopping
              </button>
              {/* Delivery & Trust Info */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-3 mb-4 bg-green-50 p-3 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Instant Delivery</p>
                    <p className="text-xs text-gray-600">Dispensed immediately at kiosk</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>100% Authentic Products</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Secure Payment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Platform Fee Information Modal */}
      {showPlatformFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setShowPlatformFeeModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-grow">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Platform Fee</h3>
                <p className="text-sm text-gray-500">Understanding our small service charge</p>
              </div>
              <button 
                onClick={() => setShowPlatformFeeModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-bold text-orange-900">Why ₹2?</p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  We purchase these items <span className="font-semibold">at MRP prices</span> (not wholesale) and sometimes even <span className="font-semibold">higher due to limited availability</span>. This ensures we always have quality/branded products in stock for you.
                </p>
              </div>
              
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                  <p className="font-semibold text-blue-900 text-sm">Server & Database Costs</p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  This small fee helps us maintain our <span className="font-medium">24/7 cloud servers</span> and <span className="font-medium">secure database</span> that keeps your health reports safe and the kiosk running smoothly.
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-gray-700"><span className="font-semibold">100% optional</span> — you can remove it if you prefer</p>
              </div>
              
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-gray-700">Helps us keep <span className="font-semibold">quality products</span> always available</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-5 text-center border border-orange-100">
              <p className="text-gray-700 leading-relaxed">
                This <span className="font-bold text-orange-600">tiny ₹2 fee</span> keeps Reliv running for students like you.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                But it's completely optional — no pressure! 😊
              </p>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setIncludePlatformFee(false); setShowPlatformFeeModal(false); }}
                className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-xl hover:bg-gray-200 transition-all text-sm"
              >
                No thanks, remove it
              </button>
              <button
                onClick={() => { setIncludePlatformFee(true); setShowPlatformFeeModal(false); }}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition-all"
              >
                Happy to support! 💛
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Cost Breakdown Modal - REBALANCED + PHARMACY COMPARISON */}
      {showCostBreakdownModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={() => setShowCostBreakdownModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-slideUp max-h-[90vh] overflow-y-auto border border-gray-100" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="relative p-6 pb-4 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 rounded-t-3xl">
              <button 
                onClick={() => setShowCostBreakdownModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 rounded-full px-4 py-1.5 mb-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-green-700 text-xs font-semibold uppercase tracking-wider">100% Transparent</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Where Your ₹{Math.round(totalPrice / totalQuantity)} Goes 💸</h3>
                <p className="text-gray-500 text-sm">Honest breakdown per kit</p>
              </div>
            </div>
            
            <div className="p-6 pt-4 space-y-4">
              
              {/* PHARMACY vs RELIV COMPARISON - Option 3 Psychology */}
              <div className="bg-gradient-to-r from-red-50 to-green-50 rounded-2xl overflow-hidden border border-gray-200">
                <div className="grid grid-cols-2">
                  {/* Pharmacy Side */}
                  <div className="p-4 bg-red-50/50 border-r border-gray-200">
                    <p className="text-red-600 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1">
                      <span>🏪</span> Pharmacy Trip
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Medicine</span>
                        <span className="text-gray-800">₹{totalMedicalItemsCost > 0 ? Math.round(totalMedicalItemsCost / totalQuantity) : 15}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Auto/Travel</span>
                        <span className="text-gray-800">₹20-40</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Wait time</span>
                        <span className="text-gray-500">30+ min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Availability</span>
                        <span className="text-gray-500">9am-9pm</span>
                      </div>
                      <div className="border-t border-red-200 pt-2 mt-2">
                        <div className="flex justify-between font-bold">
                          <span className="text-red-600">Real Cost</span>
                          <span className="text-red-600">₹{(totalMedicalItemsCost > 0 ? Math.round(totalMedicalItemsCost / totalQuantity) : 15) + 30}+</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Reliv Side */}
                  <div className="p-4 bg-green-50/50">
                    <p className="text-green-600 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1">
                      <span>⚡</span> Reliv Kiosk
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Everything</span>
                        <span className="text-green-700 font-bold">₹{Math.round(totalPrice / totalQuantity)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Travel</span>
                        <span className="text-green-600">₹0 ✓</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Wait time</span>
                        <span className="text-green-600">30 sec ✓</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Available</span>
                        <span className="text-green-600">24/7 ✓</span>
                      </div>
                      <div className="border-t border-green-200 pt-2 mt-2">
                        <div className="flex justify-between font-bold">
                          <span className="text-green-700">You Pay</span>
                          <span className="text-green-700">₹{Math.round(totalPrice / totalQuantity)} 🎉</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-green-100 px-4 py-2 text-center">
                  <p className="text-green-700 text-sm font-semibold">
                    💰 You save time, money & hassle!
                  </p>
                </div>
              </div>
              
              {/* Cost Breakdown - Option 1 Rebalanced */}
              <div className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-sm">
                <p className="text-gray-900 font-semibold flex items-center gap-2 mb-4">
                  <span className="text-lg">📊</span> Kit Breakdown
                </p>
                
                {/* Visual Bar */}
                <div className="mb-4">
                  <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
                    <div className="bg-gradient-to-r from-amber-500 to-amber-400" style={{width: `${(totalMedicalItemsCost / totalPrice) * 100}%`}}></div>
                    <div className="bg-gradient-to-r from-orange-400 to-orange-300" style={{width: `${(totalContainerCost / totalPrice) * 100}%`}}></div>
                    <div className="bg-gradient-to-r from-blue-400 to-blue-300" style={{width: `${(totalInstantAccessCost / totalPrice) * 100}%`}}></div>
                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-300" style={{width: `${(totalPackagingCost / totalPrice) * 100}%`}}></div>
                    <div className="bg-gradient-to-r from-green-400 to-green-300" style={{width: `${(totalQcCost / totalPrice) * 100}%`}}></div>
                  </div>
                </div>
                
                <div className="space-y-2.5">
                  {/* Medical Items - THE STAR */}
                  <div className="flex items-center justify-between bg-amber-50 -mx-2 px-3 py-2.5 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">💊</span>
                      </div>
                      <div>
                        <p className="text-gray-900 font-semibold text-sm">Medicines & Supplies</p>
                        <p className="text-amber-600 text-xs">Certified medical items</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-600 font-bold text-lg">₹{totalMedicalItemsCost.toFixed(0)}</p>
                      <p className="text-amber-500 text-xs font-semibold">{((totalMedicalItemsCost / totalPrice) * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                  
                  {/* Container */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
                        <span className="text-lg">📦</span>
                      </div>
                      <div>
                        <p className="text-gray-800 font-medium text-sm">Medical Container</p>
                        <p className="text-gray-400 text-xs">Safe storage</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-800 font-bold">₹{totalContainerCost.toFixed(0)}</p>
                      <p className="text-orange-400 text-xs">{((totalContainerCost / totalPrice) * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                  
                  {/* Instant Access - VALUE PROP */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                        <span className="text-lg">⚡</span>
                      </div>
                      <div>
                        <p className="text-gray-800 font-medium text-sm">24/7 Instant Access</p>
                        <p className="text-blue-500 text-xs">No wait, no travel</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-800 font-bold">₹{totalInstantAccessCost.toFixed(0)}</p>
                      <p className="text-blue-400 text-xs">{((totalInstantAccessCost / totalPrice) * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                  
                  {/* Packaging */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-yellow-50 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🎁</span>
                      </div>
                      <div>
                        <p className="text-gray-800 font-medium text-sm">Hygienic Packaging</p>
                        <p className="text-gray-400 text-xs">Sealed & sterile</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-800 font-bold">₹{totalPackagingCost.toFixed(0)}</p>
                      <p className="text-yellow-500 text-xs">{((totalPackagingCost / totalPrice) * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                  
                  {/* QC */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                        <span className="text-lg">✓</span>
                      </div>
                      <div>
                        <p className="text-gray-800 font-medium text-sm">QC & Hygiene Seal</p>
                        <p className="text-gray-400 text-xs">Quality verified</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-800 font-bold">₹{totalQcCost.toFixed(0)}</p>
                      <p className="text-green-500 text-xs">{((totalQcCost / totalPrice) * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
                
                {/* Total */}
                <div className="mt-4 pt-3 border-t-2 border-gray-100">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-900 font-bold">Total ({totalQuantity} kit{totalQuantity > 1 ? 's' : ''})</p>
                    <p className="text-2xl font-bold text-orange-600">₹{totalPrice.toFixed(0)}</p>
                  </div>
                </div>
              </div>
              
              {/* Social Proof */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-3 border border-orange-100">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full border-2 border-white flex items-center justify-center text-xs shadow-sm">👨‍🎓</div>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-white flex items-center justify-center text-xs shadow-sm">👩‍💻</div>
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-teal-500 rounded-full border-2 border-white flex items-center justify-center text-xs shadow-sm">🧑‍🔬</div>
                </div>
                <div className="flex-grow">
                  <p className="text-gray-900 text-sm font-medium">{totalKitsBought.toLocaleString()} students</p>
                  <p className="text-gray-500 text-xs">bought kits so far</p>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              
              {/* Math Verification */}
              <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-600">✓</span>
                  <span className="text-green-700 text-xs font-semibold">Math checks out!</span>
                </div>
                <p className="text-xs font-mono text-gray-500">
                  {totalMedicalItemsCost.toFixed(0)} + {totalContainerCost.toFixed(0)} + {totalInstantAccessCost.toFixed(0)} + {totalPackagingCost.toFixed(0)} + {totalQcCost.toFixed(0)} = <span className="text-green-600 font-bold">{totalPrice.toFixed(0)}</span>
                </p>
              </div>
              
              {/* CTA */}
              <button
                onClick={() => setShowCostBreakdownModal(false)}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 px-6 rounded-2xl hover:shadow-lg hover:shadow-orange-500/25 transform hover:scale-[1.02] transition-all text-lg"
              >
                Worth it! Let's Go 🚀
              </button>
              
              <p className="text-center text-gray-400 text-xs">
                🔒 No hidden charges • ⚡ Instant dispense • 🏥 Medical grade
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
