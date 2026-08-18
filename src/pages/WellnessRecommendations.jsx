import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHealth } from '../context/HealthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import { sanitizeError } from "../utils/errorSanitizer";
import { usePageSpeech } from "../context/SpeechContext";
import { API_BASE } from "../config/api";

// Import kit images
import kit1 from '../assets/1.png';
import kit3 from '../assets/3.png';
import kit4 from '../assets/4.png';
import kit5 from '../assets/5.png';
import kit6 from '../assets/6.png';
import kit8 from '../assets/8.png';

// Map kit IDs to images
const kitImages = {
  1: kit1,
  3: kit3,
  4: kit4,
  5: kit5,
  6: kit6,
  8: kit8
};

const getAvailableQuantity = (kit) => {
  if (!kit) return 0;
  return Math.max(
    0,
    Number(
      kit.available_quantity ??
      (Number(kit.stock_quantity ?? kit.quantity ?? 0) -
        Number(kit.reserved_quantity ?? 0))
    )
  );
};

function WellnessRecommendations() {
  usePageSpeech("wellness-recommendations");
  const navigate = useNavigate();
  const { data } = useHealth();
  const { patient, vitals } = data;
  const [selectedItems, setSelectedItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [allKits, setAllKits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuestionnaire, setShowQuestionnaire] = useState(true);
  const [userNeeds, setUserNeeds] = useState({
    minorInjuries: false,
    gym: false,
    travel: false,
    dustAllergy: false,
    coughCold: false,
    lowBP: false,
    onPeriod: false
  });

  // Fetch kits from backend
  useEffect(() => {
    const fetchKits = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/kits`, { cache: 'no-store' });
        if (!response.ok) throw new Error("Failed to fetch kits");
        const kits = await response.json();
        setAllKits(kits.filter(kit => 
          getAvailableQuantity(kit) > 0 && 
          new Date(kit.expiryDate) > new Date()
        ));
      } catch (e) {
        if (import.meta.env.DEV) console.error("Error fetching kits:", sanitizeError(e));
        setAllKits([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchKits();
  }, []);

  // Check BP condition
  useEffect(() => {
    if (vitals?.systolic && vitals?.diastolic) {
      setUserNeeds(prev => ({
        ...prev,
        lowBP: vitals.systolic < 112 && vitals.diastolic < 69
      }));
    }
  }, [vitals]);

  const handleQuestionChange = (question, value) => {
    setUserNeeds(prev => ({ ...prev, [question]: value }));
  };

  const handleStartShopping = () => {
    setShowQuestionnaire(false);
  };

  const handleNoThanks = () => {
    navigate('/');
  };

  // Get priority for each kit based on user needs
  const getKitPriority = (kitName) => {
    const name = kitName.toLowerCase();
    let priority = 0;
    let badges = [];

    if (name.includes('first aid') && userNeeds.minorInjuries) {
      priority += 3;
      badges.push('Highest Priority');
    }
    if ((name.includes('immunity') || name.includes('vitamin')) && (userNeeds.gym || userNeeds.lowBP)) {
      priority += 3;
      badges.push('Recommended for You');
    }
    if (name.includes('travel') && (userNeeds.travel || userNeeds.dustAllergy)) {
      priority += 3;
      badges.push('Highest Priority');
    }
    if ((name.includes('cough') || name.includes('cold') || name.includes('fever')) && userNeeds.coughCold) {
      priority += 3;
      badges.push('Highest Priority');
    }
    if (name.includes('women') && patient?.gender?.toLowerCase() === 'female') {
      if (userNeeds.onPeriod) {
        priority += 5; // Highest priority if on period
        badges.push('Urgent - Period Care');
      } else {
        priority -= 2; // Lower priority if not on period
        badges.push('Exclusively for Women');
      }
    }

    if (badges.length === 0) badges.push('Available');

    return { priority, badge: badges[0] };
  };

  // Map kits with personalized recommendations and assign images
  const getRecommendations = () => {
    const recommendations = [];
    let imageIndex = 0;
    const availableImages = [kit1, kit3, kit4, kit5, kit6, kit8];

    // Low BP - Immunity Kit
    if (vitals?.systolic < 112 && vitals?.diastolic < 69) {
      const immunityKit = allKits.find(kit => 
        kit.name.toLowerCase().includes('immunity') || 
        kit.name.toLowerCase().includes('ors') ||
        kit.name.toLowerCase().includes('vitamin')
      );
      if (immunityKit) {
        recommendations.push({
          ...immunityKit,
          kitImage: availableImages[imageIndex++ % availableImages.length],
          message: `Hey ${patient?.name || 'there'}! 💪 Your blood pressure is ${vitals?.systolic || 'N/A'}/${vitals?.diastolic || 'N/A'} mmHg. While that's okay, a little immunity boost never hurts! Our ${immunityKit.name} will keep you hydrated, energized, and ready to take on the day. Trust us, your body will thank you! 🌟`,
          badge: 'Recommended for You'
        });
      }
    }

    // Female ONLY - Women's Kit (STRICT CHECK: Only if gender is explicitly 'female')
    if (patient?.gender?.toLowerCase() === 'female') {
      const womensKit = allKits.find(kit => 
        kit.name.toLowerCase().includes('women') || 
        kit.name.toLowerCase().includes('female') ||
        kit.name.toLowerCase().includes('ladies')
      );
      if (womensKit) {
        recommendations.push({
          ...womensKit,
          kitImage: availableImages[imageIndex++ % availableImages.length],
          message: `We see you, queen! 👑 Every woman deserves comfort and care during those challenging days. This ${womensKit.name} includes premium quality products for maximum comfort, soothing relief, and iron supplements to keep you energized. Because you deserve the absolute best! 💕`,
          badge: 'Exclusively for Women'
        });
      }
    }

    // Safety Kit - For everyone
    const safetyKit = allKits.find(kit => 
      kit.name.toLowerCase().includes('safety') || 
      kit.name.toLowerCase().includes('mask') ||
      kit.name.toLowerCase().includes('sanitizer')
    );
    if (safetyKit) {
      recommendations.push({
        ...safetyKit,
        kitImage: availableImages[imageIndex++ % availableImages.length],
        message: `Okay, let's be real - safety can be SUPER stylish! 😎 This ${safetyKit.name}? It's gonna look amazing on you! Premium quality masks that make a statement, hand sanitizer that keeps you fresh, and everything you need to stay protected without sacrificing style. Safety meets fashion, and you're gonna absolutely rock it! 🔥`,
        badge: 'Trending Now'
      });
    }

    // First Aid Kit
    const firstAidKit = allKits.find(kit => 
      kit.name.toLowerCase().includes('first aid') || 
      kit.name.toLowerCase().includes('bandage') ||
      kit.name.toLowerCase().includes('emergency')
    );
    if (firstAidKit) {
      recommendations.push({
        ...firstAidKit,
        kitImage: availableImages[imageIndex++ % availableImages.length],
        message: `Life happens! 🚑 Got a cut somewhere? Or maybe you just want to be prepared? This ${firstAidKit.name} is your instant rescue squad! From minor cuts to unexpected scrapes, from small burns to quick fixes - we've got you covered. It's compact, it's complete, and honestly? Better safe than sorry, right? Be the hero who's always prepared! 🦸`,
        badge: 'Must Have'
      });
    }

    // Add remaining kits with images
    allKits.forEach(kit => {
      if (!recommendations.find(r => r.id === kit.id)) {
        recommendations.push({
          ...kit,
          kitImage: availableImages[imageIndex++ % availableImages.length],
          message: `${kit.description} - Quality you can trust, results you can see! 🌟`,
          badge: 'Available Now'
        });
      }
    });

    return recommendations;
  };

  // Filter out women's kit if gender is not female
  const recommendedKits = getRecommendations().filter(kit => {
    const isWomensKit = kit.name.toLowerCase().includes('women') || 
                        kit.name.toLowerCase().includes('female') ||
                        kit.name.toLowerCase().includes('ladies');
    
    if (isWomensKit) {
      return patient?.gender?.toLowerCase() === 'female';
    }
    return true;
  });

  // Get kits with real prices from backend
  const displayKits = allKits
    .map(kit => ({
      ...kit,
      ...getKitPriority(kit.name),
      kitImage: getKitImage(kit.name),
      kitBgColor: getKitBackgroundColor(kit.name)
    }))
    .filter(kit => {
      const isWomensKit = kit.name.toLowerCase().includes('women') || 
                          kit.name.toLowerCase().includes('female') ||
                          kit.name.toLowerCase().includes('ladies');
      if (isWomensKit) {
        return patient?.gender?.toLowerCase() === 'female';
      }
      return true;
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6);

  // Helper to get kit image based on name
  function getKitImage(kitName) {
    const name = kitName.toLowerCase();
    if (name.includes('travel')) return kit1;
    if (name.includes('women') || name.includes('female') || name.includes('ladies')) return kit3;
    if (name.includes('immunity') || name.includes('vitamin') || name.includes('immune')) return kit4;
    if (name.includes('first aid') || name.includes('firstaid') || name.includes('emergency')) return kit5;
    if (name.includes('otc') || name.includes('medicine') || name.includes('tablet')) return kit6;
    if (name.includes('cough') || name.includes('cold') || name.includes('fever')) return kit8;
    if (name.includes('safety') || name.includes('mask') || name.includes('sanitizer')) return kit1;
    return kit1; // default
  }

  // Helper to get kit background color based on name
  function getKitBackgroundColor(kitName) {
    const name = kitName.toLowerCase();
    if (name.includes('first aid') || name.includes('firstaid') || name.includes('emergency')) {
      return '#6b0f14'; // Maroonish deep red
    }
    if (name.includes('immunity') || name.includes('vitamin') || name.includes('immune')) {
      return '#0a3622'; // Forest green
    }
    if (name.includes('otc') || name.includes('medicine') || name.includes('tablet')) {
      return '#8b5e2b'; // Golden ochre/brown
    }
    if (name.includes('cough') || name.includes('cold') || name.includes('fever')) {
      return '#0d424d'; // Dark teal/cyan
    }
    if (name.includes('travel')) {
      return '#0b1e3d'; // Deep navy blue
    }
    if (name.includes('women') || name.includes('female') || name.includes('ladies')) {
      return '#702963'; // Royal pinkish purple/plum
    }
    if (name.includes('safety') || name.includes('mask') || name.includes('sanitizer')) {
      return '#0b1e3d'; // Deep navy blue
    }
    return '#4A5568'; // default slate
  }

  // Check if kit is in stock
  const isInStock = (kit) => {
    return getAvailableQuantity(kit) > 0 && new Date(kit.expiryDate) > new Date();
  };

  const handleAddToCart = (kit) => {
    const available = getAvailableQuantity(kit);
    const existingItem = selectedItems.find(item => item.id === kit.id);
    if (existingItem) {
      if (existingItem.quantity >= available) return;
      setSelectedItems(selectedItems.map(item =>
        item.id === kit.id ? { ...item, quantity: item.quantity + 1, availableStock: available } : item
      ));
    } else {
      if (available <= 0) return;
      setSelectedItems([...selectedItems, { ...kit, quantity: 1, availableStock: available }]);
      setShowCart(true);
      setTimeout(() => setShowCart(false), 2000);
    }
  };

  const handleRemoveFromCart = (kit) => {
    const existingItem = selectedItems.find(item => item.id === kit.id);
    if (existingItem && existingItem.quantity > 1) {
      setSelectedItems(selectedItems.map(item =>
        item.id === kit.id ? { ...item, quantity: item.quantity - 1 } : item
      ));
    } else {
      setSelectedItems(selectedItems.filter(item => item.id !== kit.id));
    }
  };

  const isInCart = (kitId) => selectedItems.find(item => item.id === kitId);

  const getQuantityInCart = (kitId) => {
    const item = selectedItems.find(item => item.id === kitId);
    return item ? item.quantity : 0;
  };

  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    try {
      // Re-verify inventory before navigating to checkout
      const response = await fetch(`${API_BASE}/api/kits`, { cache: 'no-store' });
      if (response.ok) {
        const latestKits = await response.json();
        const validCart = selectedItems.filter(cartItem => {
          const kit = latestKits.find(k => k.id === cartItem.id || k.kit_id === cartItem.id);
          return kit && getAvailableQuantity(kit) >= (cartItem.quantity || 1);
        }).map(cartItem => {
          const kit = latestKits.find(k => k.id === cartItem.id || k.kit_id === cartItem.id);
          return {
            ...cartItem,
            cartQuantity: cartItem.quantity || 1,
            price: kit.price,
            availableStock: getAvailableQuantity(kit),
          };
        });

        if (validCart.length === 0 && selectedItems.length > 0) {
          alert("Items in your cart are no longer available in stock. Please select from available kits.");
          setSelectedItems([]);
          return;
        }

        if (validCart.length < selectedItems.length) {
          alert("Some items in your cart were updated or removed due to inventory changes.");
          setSelectedItems(validCart);
        }

        const validTotalPrice = validCart.reduce((sum, item) => sum + item.price * (item.cartQuantity || item.quantity || 1), 0);
        navigate('/checkout', { state: { cart: validCart, totalPrice: validTotalPrice } });
        return;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn("Failed to re-verify inventory before checkout:", err);
    }
    const cartForCheckout = selectedItems.map(item => ({ ...item, cartQuantity: item.quantity || 1 }));
    navigate('/checkout', { state: { cart: cartForCheckout, totalPrice: totalAmount } });
  };

  const handleExploreFull = () => {
    navigate('/medicine-dispensing');
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#F5F1E8] flex items-center justify-center overflow-y-auto scrollable-container">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600 text-base uppercase tracking-wider">Loading...</p>
        </div>
      </div>
    );
  }

  // Questionnaire Screen
  if (showQuestionnaire) {
    return (
      <div className="h-screen bg-[#F5F1E8] overflow-y-auto scrollable-container">
        {/* Header */}
        <div className="bg-[#F5F1E8] py-6 border-b border-gray-300">
          <div className="max-w-4xl mx-auto px-8 text-center">
            <Logo size="text-5xl" />
          </div>
        </div>

        {/* Questionnaire */}
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-serif text-gray-900 mb-4">
              Let's Find Your Perfect Kit
            </h1>
            <p className="text-base text-gray-600 tracking-wide">
              Answer a few quick questions to get personalized recommendations
            </p>
          </div>

          {/* Health Summary */}
          {vitals && (vitals.systolic || vitals.oxygen) && (
            <div className="bg-white/50 border-2 border-gray-300 p-6 mb-8">
              <p className="text-sm uppercase tracking-widest text-gray-600 mb-3">Your Health Report</p>
              <div className="space-y-2">
                {vitals.systolic && vitals.diastolic && (
                  <p className="text-base text-gray-800">
                    Blood Pressure: <span className="font-semibold text-lg">{vitals.systolic}/{vitals.diastolic} mmHg</span>
                    {vitals.systolic < 112 && vitals.diastolic < 69 && (
                      <span className="ml-3 text-sm text-[#8B4513]">(Low - Immunity boost recommended)</span>
                    )}
                  </p>
                )}
                {vitals.oxygen && (
                  <p className="text-base text-gray-800">
                    Oxygen Level: <span className="font-semibold text-lg">{vitals.oxygen}%</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Questions */}
          <div className="space-y-6">
            {/* Question 1 */}
            <div className="bg-white border-2 border-gray-300 p-6">
              <p className="text-base font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                Do you have any minor cuts or injuries?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleQuestionChange('minorInjuries', true)}
                  className={`flex-1 py-3 text-base uppercase tracking-wider border-2 transition-colors ${
                    userNeeds.minorInjuries
                      ? 'bg-[#2F5233] text-white border-[#2F5233]'
                      : 'bg-white text-gray-800 border-gray-400 hover:border-gray-600'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => handleQuestionChange('minorInjuries', false)}
                  className={`flex-1 py-3 text-base uppercase tracking-wider border-2 transition-colors ${
                    !userNeeds.minorInjuries
                      ? 'bg-[#2F5233] text-white border-[#2F5233]'
                      : 'bg-white text-gray-800 border-gray-400 hover:border-gray-600'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Question 2 */}
            <div className="bg-white border-2 border-gray-300 p-6">
              <p className="text-base font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                Do you go to the gym or maintain regular workouts?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleQuestionChange('gym', true)}
                  className={`flex-1 py-3 text-base uppercase tracking-wider border-2 transition-colors ${
                    userNeeds.gym
                      ? 'bg-[#2F5233] text-white border-[#2F5233]'
                      : 'bg-white text-gray-800 border-gray-400 hover:border-gray-600'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => handleQuestionChange('gym', false)}
                  className={`flex-1 py-3 text-base uppercase tracking-wider border-2 transition-colors ${
                    !userNeeds.gym
                      ? 'bg-[#2F5233] text-white border-[#2F5233]'
                      : 'bg-white text-gray-800 border-gray-400 hover:border-gray-600'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Question 3 */}
            <div className="bg-white border-2 border-gray-300 p-6">
              <p className="text-base font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                Do you travel frequently or have dust allergies?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleQuestionChange('travel', true)}
                  className={`flex-1 py-3 text-base uppercase tracking-wider border-2 transition-colors ${
                    userNeeds.travel
                      ? 'bg-[#2F5233] text-white border-[#2F5233]'
                      : 'bg-white text-gray-800 border-gray-400 hover:border-gray-600'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => handleQuestionChange('travel', false)}
                  className={`flex-1 py-3 text-base uppercase tracking-wider border-2 transition-colors ${
                    !userNeeds.travel
                      ? 'bg-[#2F5233] text-white border-[#2F5233]'
                      : 'bg-white text-gray-800 border-gray-400 hover:border-gray-600'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Question 4 */}
            <div className="bg-white border-2 border-gray-300 p-6">
              <p className="text-base font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                Do you have fever, running nose, or cough/cold symptoms?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleQuestionChange('coughCold', true)}
                  className={`flex-1 py-3 text-base uppercase tracking-wider border-2 transition-colors ${
                    userNeeds.coughCold
                      ? 'bg-[#2F5233] text-white border-[#2F5233]'
                      : 'bg-white text-gray-800 border-gray-400 hover:border-gray-600'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => handleQuestionChange('coughCold', false)}
                  className={`flex-1 py-3 text-base uppercase tracking-wider border-2 transition-colors ${
                    !userNeeds.coughCold
                      ? 'bg-[#2F5233] text-white border-[#2F5233]'
                      : 'bg-white text-gray-800 border-gray-400 hover:border-gray-600'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Question 5 - Only for Female */}
            {patient?.gender?.toLowerCase() === 'female' && (
              <div className="bg-pink-50 border-2 border-pink-300 p-6">
                <p className="text-base font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                  Are you currently on your period?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleQuestionChange('onPeriod', true)}
                    className={`flex-1 py-3 text-base uppercase tracking-wider border-2 transition-colors ${
                      userNeeds.onPeriod
                        ? 'bg-[#ba68c8] text-white border-[#ba68c8]'
                        : 'bg-white text-gray-800 border-gray-400 hover:border-gray-600'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleQuestionChange('onPeriod', false)}
                    className={`flex-1 py-3 text-base uppercase tracking-wider border-2 transition-colors ${
                      !userNeeds.onPeriod
                        ? 'bg-[#ba68c8] text-white border-[#ba68c8]'
                        : 'bg-white text-gray-800 border-gray-400 hover:border-gray-600'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-12">
            <button
              onClick={handleStartShopping}
              className="w-full bg-gray-800 text-white py-4 text-base uppercase tracking-widest hover:bg-gray-900 transition-colors"
            >
              Show My Kits →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Shopping Page
  return (
    <div className="h-screen bg-[#F5F1E8] overflow-y-auto scrollable-container">
      {/* Header */}
      <div className="bg-[#F5F1E8] py-6 border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-12 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-xl text-gray-800 hover:text-gray-600 transition-colors uppercase tracking-wider"
          >
            ← Back
          </button>
          <Logo size="text-5xl" />
          <button
            onClick={handleNoThanks}
            className="text-base text-gray-600 hover:text-gray-800 transition-colors uppercase tracking-wider"
          >
            Home
          </button>
        </div>
      </div>

      {/* Title Section */}
      <div className="max-w-7xl mx-auto px-12 py-12 text-center">
        <h1 className="text-5xl font-serif text-gray-900 tracking-wide mb-3">
          THE CURATED ESSENTIALS
        </h1>
        <p className="text-base uppercase tracking-widest text-gray-600 font-light">
          Your Personalized Health & Safety Collection
        </p>
      </div>

      {/* Kits Grid */}
      <div className="max-w-6xl mx-auto px-12 pb-48">
        <div className="grid grid-cols-3 gap-8">
          {displayKits.map((kit, index) => {
            const quantity = getQuantityInCart(kit.id);
            const inStock = isInStock(kit);
            return (
              <div key={kit.id} className="flex flex-col">
                <div className={`relative w-full aspect-square flex items-center justify-center border-2 border-gray-400 p-8 ${
                  !inStock ? 'opacity-50' : ''
                }`}
                style={{ backgroundColor: kit.kitBgColor }}
                >
                  <img 
                    src={kit.kitImage} 
                    alt={kit.name}
                    className="w-full h-full object-contain opacity-90"
                  />
                  {/* Stock Status or Priority Badge */}
                  {!inStock ? (
                    <div className="absolute top-4 right-4 bg-red-600 text-white text-xs uppercase tracking-wider px-4 py-2 font-medium">
                      Out of Stock
                    </div>
                  ) : (
                    <div className={`absolute top-4 right-4 ${
                      kit.badge === 'Highest Priority' ? 'bg-[#8B4513]' :
                      kit.badge === 'Recommended for You' ? 'bg-[#2F5233]' :
                      kit.badge === 'Exclusively for Women' ? 'bg-[#6B2E3E]' :
                      'bg-[#4A5568]'
                    } text-white text-xs uppercase tracking-wider px-4 py-2 font-medium`}>
                      {kit.badge}
                    </div>
                  )}
                  {/* Stock Count */}
                  {inStock && getAvailableQuantity(kit) <= 10 && (
                    <div className="absolute bottom-4 left-4 bg-orange-600 text-white text-xs px-3 py-1 font-medium">
                      Only {getAvailableQuantity(kit)} left
                    </div>
                  )}
                </div>
                
                {/* Kit Info */}
                <div className="mt-6">
                  <h3 className="text-xl uppercase tracking-wide text-gray-900 font-semibold text-center mb-2">
                    {kit.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-600 text-center mb-4 leading-relaxed min-h-[40px]">
                    {kit.description}
                  </p>

                  {/* Price */}
                  <p className="text-center text-3xl font-bold text-gray-900 mb-4">
                    ₹{kit.price}
                  </p>

                  {/* Quantity Controls or Add Button */}
                  {!inStock ? (
                    <button
                      disabled
                      className="w-full bg-gray-300 border-2 border-gray-400 text-gray-600 py-3 text-base uppercase tracking-wider cursor-not-allowed"
                    >
                      Out of Stock
                    </button>
                  ) : quantity > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => handleRemoveFromCart(kit)}
                          className="bg-white border-2 border-gray-400 text-gray-800 w-12 h-12 text-2xl hover:bg-gray-100 transition-colors"
                        >
                          −
                        </button>
                        <span className="text-2xl font-bold text-gray-900 w-12 text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => quantity < getAvailableQuantity(kit) && handleAddToCart(kit)}
                          className={`border-2 w-12 h-12 text-2xl transition-colors ${
                            quantity >= getAvailableQuantity(kit) 
                              ? 'bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed' 
                              : 'bg-[#2F5233] border-[#2F5233] text-white hover:bg-[#1F3523]'
                          }`}
                        >
                          +
                        </button>
                      </div>
                      {quantity >= getAvailableQuantity(kit) && (
                        <p className="text-xs text-orange-600 text-center">
                          Maximum quantity reached
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(kit)}
                      className="w-full bg-white border-2 border-gray-400 text-gray-800 py-3 text-base uppercase tracking-wider hover:bg-gray-100 transition-colors"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Cart Bar */}
      {selectedItems.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-[#2D3748] border-t-4 border-gray-800 z-50 shadow-2xl"
        >
          <div className="max-w-7xl mx-auto px-12 py-6 flex items-center justify-between">
            <div className="text-white">
              <p className="text-sm uppercase tracking-widest mb-1">
                {selectedItems.length} Kit{selectedItems.length > 1 ? 's' : ''} • {selectedItems.reduce((sum, item) => sum + item.quantity, 0)} Total Items
              </p>
              <p className="text-4xl font-serif">₹{totalAmount}</p>
            </div>
            <button
              onClick={handleCheckout}
              className="bg-white text-gray-900 uppercase text-base tracking-widest px-16 py-4 hover:bg-gray-100 transition-colors font-semibold"
            >
              Proceed to Checkout →
            </button>
          </div>
        </motion.div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-28 right-12 bg-[#2F5233] text-white px-8 py-4 z-50 border-2 border-gray-800 shadow-xl"
          >
            <p className="text-base uppercase tracking-wider">✓ Added to Cart</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WellnessRecommendations;
