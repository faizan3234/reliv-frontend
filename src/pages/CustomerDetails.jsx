import React, { useEffect, useState, useCallback } from "react";
import Logo from "../components/Logo";
import PrimaryButton from "../components/PrimaryButton";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useHealth } from "../context/HealthContext";
import VirtualKeyboard from "../components/VirtualKeyboard";
import { ArrowLeft, Plus, Minus, QrCode, Smartphone } from "lucide-react";
import { API_BASE } from "../config/api";
import { QRCodeSVG } from "qrcode.react";
import { usePageSpeech } from "../context/SpeechContext";

function CustomerDetails() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { update, resetHealth } = useHealth();
  usePageSpeech("customer-details");

  const [slideUp, setSlideUp] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [activeInputName, setActiveInputName] = useState("");
  const [keyboardInputs, setKeyboardInputs] = useState({});

  const [form, setForm] = useState({
    name: "",
    age: "",
    email: "",
    phone: "", // OPTIONAL
    gender: "",
  });

  const [errors, setErrors] = useState({});

  // QR Code functionality
  const [entryMode, setEntryMode] = useState('qr'); // 'manual' or 'qr' - default to QR
  const [sessionId, setSessionId] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [qrRefreshTimer, setQrRefreshTimer] = useState(null);

  // Inactivity timeout is handled globally by KioskGuardian (120s)
  // No per-page timer needed here — avoids conflicting timeouts

  /* Slide-up animation */
  useEffect(() => {
    const timer = setTimeout(() => setSlideUp(true), 20);
    return () => clearTimeout(timer);
  }, []);

  /* Sync keyboard inputs with form */
  useEffect(() => {
    setKeyboardInputs({
      name: form.name,
      age: form.age,
      email: form.email,
      phone: form.phone,
    });
  }, [form.name, form.age, form.email, form.phone]);

  // Handle keyboard input changes
  const handleKeyboardChange = useCallback((inputName, value) => {
    // Validate age - only allow positive numbers 1-120
    if (inputName === 'age') {
      const numValue = value.replace(/[^0-9]/g, '');
      const ageNum = parseInt(numValue, 10);
      if (numValue === '' || (ageNum >= 0 && ageNum <= 120)) {
        setForm(prev => ({ ...prev, age: numValue }));
        setKeyboardInputs(prev => ({ ...prev, age: numValue }));
      }
      return;
    }
    setForm(prev => ({ ...prev, [inputName]: value }));
    setKeyboardInputs(prev => ({ ...prev, [inputName]: value }));
    setErrors(prev => ({ ...prev, [inputName]: "" }));
  }, []);

  // Open keyboard for a specific input
  const openKeyboard = (inputName) => {
    setActiveInputName(inputName);
    setKeyboardVisible(true);
  };

  // Close keyboard
  const closeKeyboard = () => {
    setKeyboardVisible(false);
    setActiveInputName("");
  };

  // Age increment/decrement handlers
  const handleAgeIncrement = () => {
    const currentAge = parseInt(form.age, 10) || 0;
    if (currentAge < 120) {
      const newAge = (currentAge + 1).toString();
      setForm(prev => ({ ...prev, age: newAge }));
      setKeyboardInputs(prev => ({ ...prev, age: newAge }));
      setErrors(prev => ({ ...prev, age: "" }));
    }
  };

  const handleAgeDecrement = () => {
    const currentAge = parseInt(form.age, 10) || 0;
    if (currentAge > 1) {
      const newAge = (currentAge - 1).toString();
      setForm(prev => ({ ...prev, age: newAge }));
      setKeyboardInputs(prev => ({ ...prev, age: newAge }));
      setErrors(prev => ({ ...prev, age: "" }));
    }
  };

  /* Validation */
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!form.name.trim()) {
      newErrors.name = t("nameRequired");
      isValid = false;
    }

    if (!form.age || form.age < 1 || form.age > 120) {
      newErrors.age = t("ageInvalid");
      isValid = false;
    }

    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = t("emailInvalid");
      isValid = false;
    }

    /* Phone is OPTIONAL — validate only if entered */
    if (form.phone) {
      const digits = form.phone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) {
        newErrors.phone = t("phoneInvalid");
        isValid = false;
      }
    }

    if (!form.gender) {
      newErrors.gender = t("genderRequired");
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Handle age validation - prevent negative and non-numeric
    if (name === 'age') {
      const numValue = value.replace(/[^0-9]/g, '');
      const ageNum = parseInt(numValue, 10);
      if (numValue === '' || (ageNum >= 0 && ageNum <= 120)) {
        setForm(prev => ({ ...prev, age: numValue }));
        setKeyboardInputs(prev => ({ ...prev, age: numValue }));
        setErrors(prev => ({ ...prev, age: "" }));
      }
      return;
    }
    
    const sanitizedValue = type === "radio" ? value : value.trimStart();
    setForm((prev) => ({ ...prev, [name]: sanitizedValue }));
    setKeyboardInputs(prev => ({ ...prev, [name]: sanitizedValue }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleProceed = () => {
    if (validateForm()) {
      update({ patient: form });
      navigate("/two-options");
    }
  };

  const handleClear = () => {
    resetHealth();
    setForm({
      name: "",
      age: "",
      email: "",
      phone: "",
      gender: "",
    });
    setErrors({});
  };

  // QR Code functions
  const generateSessionId = () => {
    return crypto.randomUUID();
  };

  const startQRMode = async () => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    setEntryMode('qr');
    setQrCodeData(null); // Show "Generating..." while fetching token

    try {
      const res = await fetch(`${API_BASE}/api/create-qr-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: newSessionId }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const { token } = await res.json();

      const qrBase = import.meta.env.VITE_QR_BASE_URL || "https://mail-request-m33c.vercel.app";
      const url = `${qrBase}/h?t=${token}`;
      setQrCodeData(url);

      // Start polling for customer data with the sessionId (not token)
      startPolling(newSessionId);

      // Auto-refresh QR before the 10-min backend TTL expires
      if (qrRefreshTimer) clearTimeout(qrRefreshTimer);
      const timer = setTimeout(() => startQRMode(), 9 * 60 * 1000); // 9 minutes
      setQrRefreshTimer(timer);
    } catch (error) {
      console.error('Failed to create QR session:', error);
      // Retry after 2 seconds
      setTimeout(() => startQRMode(), 2000);
    }
  };

  const startPolling = (sid) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/api/get-customer-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.customerData) {
            // Auto-fill form
            setForm(data.customerData);
            setEntryMode('manual');
            clearInterval(interval);
            setPollingInterval(null);
          }
        }
      } catch (error) {
        console.error('Error polling for data:', error);
      }
    }, 2000); // Poll every 2 seconds
    
    setPollingInterval(interval);
  };

  const switchToManual = () => {
    setEntryMode('manual');
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    if (qrRefreshTimer) {
      clearTimeout(qrRefreshTimer);
      setQrRefreshTimer(null);
    }
    setSessionId(null);
    setQrCodeData(null);
  };

  // Cleanup polling and QR refresh timer on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      if (qrRefreshTimer) {
        clearTimeout(qrRefreshTimer);
      }
    };
  }, [pollingInterval, qrRefreshTimer]);

  /* Start QR mode on mount since it's default */
  useEffect(() => {
    if (entryMode === 'qr') {
      startQRMode();
    }
  }, []); // Empty dependency array to run only on mount

  return (
    <div className={`h-screen bg-white flex flex-col overflow-y-auto scrollable-container ${keyboardVisible ? 'pb-80' : 'pb-20 md:pb-64'}`}> 
      {/* BIG PROMINENT BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className="kiosk-back-btn"
        aria-label={t("go_back")}
      >
        <ArrowLeft size={22} />
        <span>Back</span>
      </button>

      {/* Header */}
      <div className="bg-gradient-to-b from-orange-50 to-white pt-8 pb-4 flex flex-col items-center relative">
        <Logo size="text-3xl md:text-4xl" />
        <p className="mt-2 text-gray-600 text-center text-sm md:text-base">
          {t("introMessage")}
        </p>
      </div>

      {/* Sliding Card */}
      <div
        className={`mt-2 transform transition-transform duration-700 ease-out ${
          slideUp ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-white rounded-t-3xl shadow-2xl border border-gray-300 px-6 py-8 max-w-lg mx-auto md:max-w-2xl"> 
          <h2 className="text-lg md:text-xl font-semibold mb-6 text-center">
            {t("whoIsReliv")}
          </h2>

          {entryMode === 'qr' ? (
            /* QR Code Mode - Default and Prominent */
            <div className="mb-8">
              <div className="text-center mb-6">
                <p className="text-lg font-medium text-gray-700 mb-4">
                  Scan QR Code to Enter Details
                </p>
                <p className="text-sm text-gray-600 mb-6">
                  Use your phone to scan and fill details conveniently
                </p>
                {qrCodeData ? (
                  <div className="flex flex-col items-center">
                    <QRCodeSVG 
                      value={qrCodeData} 
                      size={256} 
                      level="M"
                      className="border-4 border-orange-200 rounded-xl shadow-lg" 
                    />
                    <p className="mt-4 text-sm text-gray-500 max-w-xs">
                      Waiting for details from your phone...
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-64 h-64 md:w-80 md:h-80 border-4 border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <QrCode size={48} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Generating QR code...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Manual Entry Button Below QR */}
              <div className="text-center">
                <button
                  onClick={switchToManual}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-medium shadow-md"
                >
                  <Smartphone size={20} />
                  Enter Details Manually Instead
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Switch to QR Mode Button */}
              <div className="text-center mb-6">
                <button
                  onClick={startQRMode}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-md"
                >
                  <QrCode size={20} />
                  Use QR Code Instead
                </button>
              </div>
              
              {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {t("enterName")}
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              readOnly
              onChange={handleChange}
              onFocus={() => openKeyboard("name")}
              onClick={() => openKeyboard("name")}
              className={`w-full border ${
                errors.name ? "border-red-500" : "border-gray-300"
              } rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-orange-400`}
              placeholder="Enter your name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Age - With Arrow Buttons */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {t("enterAge")}
            </label>
            <div className="flex items-center gap-2">
              {/* Decrement Button */}
              <button
                type="button"
                onClick={handleAgeDecrement}
                className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-300 active:from-orange-300 active:to-orange-400 text-orange-700 rounded-xl border-2 border-orange-300 shadow-md transition-all duration-150 touch-manipulation text-2xl font-bold"
                aria-label="Decrease age"
              >
                <Minus size={26} strokeWidth={3} />
              </button>
              
              {/* Age Input */}
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                name="age"
                value={form.age}
                readOnly
                onChange={handleChange}
                onFocus={() => openKeyboard("age")}
                onClick={() => openKeyboard("age")}
                className={`flex-1 border ${
                  errors.age ? "border-red-500" : "border-gray-300"
                } rounded-lg px-4 py-3 text-xl font-bold text-center focus:ring-2 focus:ring-orange-400`}
                placeholder="Age"
                maxLength={3}
              />
              
              {/* Increment Button */}
              <button
                type="button"
                onClick={handleAgeIncrement}
                className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 active:from-green-300 active:to-green-400 text-green-700 rounded-xl border-2 border-green-300 shadow-md transition-all duration-150 touch-manipulation text-2xl font-bold"
                aria-label="Increase age"
              >
                <Plus size={26} strokeWidth={3} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">Tap +/- or enter age (1-120)</p>
            {errors.age && (
              <p className="text-red-500 text-sm mt-1">{errors.age}</p>
            )}
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {t("enterEmail")}
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              readOnly
              onChange={handleChange}
              onFocus={() => openKeyboard("email")}
              onClick={() => openKeyboard("email")}
              className={`w-full border ${
                errors.email ? "border-red-500" : "border-gray-300"
              } rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-orange-400`}
              placeholder="your.email@example.com"
            />
            <p className="text-sm text-gray-500 mt-1">For privacy, please enter your email to continue</p>
            <button
              type="button"
              onClick={() => {
                resetHealth();
                setForm({
                  name: "",
                  age: "",
                  email: "",
                  phone: "",
                  gender: "",
                });
                setKeyboardInputs({});
              }}
              className="text-sm text-orange-600 underline mt-1"
            >
              Not you? Start new user
            </button>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone (Optional) */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {t("enterPhone")} <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              readOnly
              onChange={handleChange}
              onFocus={() => openKeyboard("phone")}
              onClick={() => openKeyboard("phone")}
              onTouchStart={() => openKeyboard("phone")}
              className={`w-full border ${
                errors.phone ? "border-red-500" : "border-gray-300"
              } rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-orange-400`}
              placeholder="+91 98765 43210"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Gender */}
          <div className="mb-6">
            <p className="mb-2 font-medium text-sm">{t("selectGender")}</p>
            <div className="flex gap-4 flex-wrap">
              {['male', 'female', 'others'].map((g) => (
                <label key={g} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 border-gray-200 hover:border-orange-300 transition-colors">
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={form.gender === g}
                    onChange={handleChange}
                    className="w-5 h-5 accent-orange-500"
                  />
                  <span className="text-base font-medium">{t(g)}</span>
                </label>
              ))}
            </div>
            {errors.gender && (
              <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-4 md:flex-row">
            <PrimaryButton
              className="w-full md:w-1/2 justify-center"
              onClick={handleProceed}
            >
              {t("proceed")}
            </PrimaryButton>

            <button
              type="button"
              onClick={handleClear}
              className="w-full md:w-1/2 bg-gray-200 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-300"
            >
              {t("clearForm")}
            </button>
          </div>
            </div>
          )}
        </div>
      </div>

      {/* Virtual Keyboard */}
      {keyboardVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-[10000]">
          <VirtualKeyboard
            inputName={activeInputName}
            inputs={keyboardInputs}
            onChange={handleKeyboardChange}
            onClose={closeKeyboard}
          />
        </div>
      )}
    </div>
  );
}

export default CustomerDetails;
