import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";

function MobileEntry() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('sessionId');

  const [form, setForm] = useState({
    name: "",
    age: "",
    email: "",
    phone: "",
    gender: "",
  });

  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  // Attempt to enter fullscreen / standalone mode to hide the browser URL bar
  const enterFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch((err) => {
        console.log('Fullscreen request failed:', err);
      });
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.mozRequestFullScreen) {
      el.mozRequestFullScreen();
    } else {
      // Fallback: scroll down 1px to hide the address bar on older mobile browsers
      window.scrollTo(0, 1);
    }
  }, []);

  const handleOverlayTap = useCallback(() => {
    enterFullscreen();
    setShowOverlay(false);
  }, [enterFullscreen]);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('reliv_customer_data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setForm(prev => ({
          ...prev,
          ...parsedData,
          // Don't auto-fill sensitive data unless rememberMe was true
          email: parsedData.email || "",
          phone: parsedData.phone || "",
        }));
        setRememberMe(parsedData.rememberMe !== false); // Default to true
        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }

    if (!sessionId) {
      // Invalid access
      navigate('/');
    }
  }, [sessionId, navigate]);

  // Auto-focus first input on mobile
  useEffect(() => {
    if (showOverlay) return;
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const firstInput = document.querySelector('input[name="name"]');
      if (firstInput && !dataLoaded) {
        firstInput.focus();
        // Scroll to top to ensure input is visible
        window.scrollTo(0, 0);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [dataLoaded, showOverlay]);

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }

    if (!form.age || form.age < 1 || form.age > 120) {
      newErrors.age = "Please enter a valid age (1-120)";
      isValid = false;
    }

    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    if (!form.gender) {
      newErrors.gender = "Please select gender";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (name === 'age') {
      const numValue = value.replace(/[^0-9]/g, '');
      const ageNum = parseInt(numValue, 10);
      if (numValue === '' || (ageNum >= 0 && ageNum <= 120)) {
        setForm(prev => ({ ...prev, age: numValue }));
      }
      return;
    }
    
    const sanitizedValue = type === "radio" ? value : value.trimStart();
    setForm((prev) => ({ ...prev, [name]: sanitizedValue }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Save to localStorage if rememberMe is checked
      if (rememberMe) {
        const dataToSave = {
          ...form,
          rememberMe: true,
          lastSaved: new Date().toISOString()
        };
        localStorage.setItem('reliv_customer_data', JSON.stringify(dataToSave));
      } else {
        // Clear saved data if rememberMe is unchecked
        localStorage.removeItem('reliv_customer_data');
      }

      const response = await fetch(`${API_BASE}/api/save-customer-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, customerData: form })
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        alert('Failed to save data. Please try again.');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Network error. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div
        className="flex flex-col items-center justify-center p-4 bg-gradient-to-b from-orange-50 to-white"
        style={{ minHeight: '100dvh', paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Details Saved!</h2>
          <p className="text-gray-600 mb-6">
            Your information has been sent to the kiosk. You can now return to the kiosk to continue.
          </p>
          <p className="text-sm text-gray-500">
            This page will close automatically in a few seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fullscreen tap-to-continue overlay */}
      {showOverlay && (
        <div
          onClick={handleOverlayTap}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'linear-gradient(160deg, #f97316 0%, #fb923c 40%, #fff7ed 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="36" cy="36" r="36" fill="white" fillOpacity="0.25" />
              <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontSize="36" fill="white">❤️</text>
            </svg>
          </div>
          <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Reliv Health
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', marginBottom: '3rem' }}>
            Your personal health kiosk
          </p>
          <div style={{
            background: 'white',
            color: '#f97316',
            borderRadius: '2rem',
            padding: '0.9rem 2.5rem',
            fontWeight: 700,
            fontSize: '1.05rem',
            boxShadow: '0 4px 24px rgba(249,115,22,0.25)',
            animation: 'pulse 1.8s ease-in-out infinite',
          }}>
            Tap anywhere to continue
          </div>
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.05); opacity: 0.85; }
            }
          `}</style>
        </div>
      )}

      <div
        className="bg-gradient-to-b from-orange-50 to-white"
        style={{ minHeight: '100dvh', paddingTop: 'max(0px, env(safe-area-inset-top))' }}
      >
        {/* Branded header */}
        <div
          className="bg-orange-500 text-white text-center px-4"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
        >
          <span className="font-bold text-lg tracking-tight">❤️ Reliv Health</span>
        </div>

        <div className="p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
              Enter Your Details
            </h1>
            
            {dataLoaded && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-green-800 text-sm">
                  📱 Your previous details have been auto-filled. Please review and update if needed.
                </p>
              </div>
            )}
          
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                className={`w-full border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400`}
                placeholder="Enter your name"
                required
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                min="1"
                max="120"
                autoComplete="bday"
                className={`w-full border ${errors.age ? "border-red-500" : "border-gray-300"} rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400`}
                placeholder="Enter your age"
                required
              />
              {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                className={`w-full border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400`}
                placeholder="your.email@example.com"
                required
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1">Phone (Optional)</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
                inputMode="tel"
                pattern="[0-9+\-\s\(\)]*"
                maxLength="15"
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:ring-2 focus:ring-orange-400 focus:outline-none touch-manipulation"
                placeholder="+91 98765 43210"
                style={{
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  fontSize: '16px', // Prevents zoom on iOS
                  lineHeight: '1.2'
                }}
              />
              <p className="text-xs text-gray-500 mt-1">Enter your mobile number for SMS updates</p>
            </div>

            {/* Gender */}
            <div>
              <p className="mb-2 font-medium text-sm">Gender</p>
              <div className="flex gap-4">
                {["male", "female", "others"].map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={form.gender === g}
                      onChange={handleChange}
                      className="w-4 h-4 accent-orange-500"
                      required
                    />
                    <span className="text-sm capitalize">{g}</span>
                  </label>
                ))}
              </div>
              {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-orange-500"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer">
                Remember my details for next time
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-orange-500 text-white rounded-lg py-3 font-medium hover:bg-orange-600 transition-colors"
            >
              Submit Details
            </button>
          </form>
        </div>
      </div>
        </div>
      </div>
    </>
  );
}

export default MobileEntry;