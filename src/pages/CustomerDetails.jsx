// src/pages/CustomerDetails.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import Logo from "../components/Logo";
import TopEllipseBackground from "../components/TopEllipseBackground";
import { useNavigate } from "react-router-dom";
import { useHealth } from "../context/HealthContext";
import VirtualKeyboard from "../components/VirtualKeyboard";
import { ArrowLeft, Plus, Minus, User, Calendar, Users, Check } from "lucide-react";
import { API_BASE } from "../config/api";
import { usePageSpeech } from "../context/SpeechContext";

export default function CustomerDetails() {
  const navigate = useNavigate();
  const { data: healthData, update } = useHealth();
  usePageSpeech("customer-details");

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [activeInputName, setActiveInputName] = useState("");

  const [form, setForm] = useState({
    name: "",
    age: "22",
    gender: "",
  });

  const [keyboardInputs, setKeyboardInputs] = useState({
    name: "",
    age: "22",
  });

  const isCreatingSessionRef = useRef(false);

  // Sync keyboard inputs with form
  useEffect(() => {
    setKeyboardInputs({
      name: form.name,
      age: form.age,
    });
  }, [form.name, form.age]);

  // Handle on-screen keyboard input changes
  const handleKeyboardChange = useCallback((inputName, value) => {
    if (inputName === "age") {
      const numValue = value.replace(/[^0-9]/g, "");
      const ageNum = parseInt(numValue, 10);
      if (numValue === "" || (ageNum >= 1 && ageNum <= 120)) {
        setForm((prev) => ({ ...prev, age: numValue }));
        setKeyboardInputs((prev) => ({ ...prev, age: numValue }));
      }
      return;
    }

    setForm((prev) => ({ ...prev, [inputName]: value }));
    setKeyboardInputs((prev) => ({ ...prev, [inputName]: value }));
  }, []);

  const openKeyboard = (inputName) => {
    setActiveInputName(inputName);
    setKeyboardVisible(true);
  };

  const closeKeyboard = () => {
    setKeyboardVisible(false);
    setActiveInputName("");
  };

  // Age increment / decrement handlers
  const handleAgeIncrement = () => {
    const currentAge = parseInt(form.age, 10) || 20;
    if (currentAge < 120) {
      const newAge = (currentAge + 1).toString();
      setForm((prev) => ({ ...prev, age: newAge }));
      setKeyboardInputs((prev) => ({ ...prev, age: newAge }));
    }
  };

  const handleAgeDecrement = () => {
    const currentAge = parseInt(form.age, 10) || 22;
    if (currentAge > 1) {
      const newAge = (currentAge - 1).toString();
      setForm((prev) => ({ ...prev, age: newAge }));
      setKeyboardInputs((prev) => ({ ...prev, age: newAge }));
    }
  };

  const handleGenderSelect = (genderValue) => {
    setForm((prev) => ({ ...prev, gender: genderValue }));
  };

  // Validation rules
  const ageNum = parseInt(form.age, 10);
  const isNameValid = form.name.trim().length >= 2;
  const isAgeValid = !isNaN(ageNum) && ageNum >= 1 && ageNum <= 120;
  const isGenderValid = Boolean(form.gender);
  const isFormValid = isNameValid && isAgeValid && isGenderValid;

  // Session Helper
  const generateSessionId = () => {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.floor(Math.random() * 16);
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // Ensure authoritative Pi session exists on mount
  useEffect(() => {
    const initKioskSession = async () => {
      if (isCreatingSessionRef.current) return;

      const existingSid =
        healthData?.sessionId ||
        localStorage.getItem("reliv_session_id") ||
        sessionStorage.getItem("reliv_session_id");

      if (
        existingSid &&
        existingSid !== "current" &&
        existingSid !== "default" &&
        existingSid !== "RELIV-001"
      ) {
        return;
      }

      isCreatingSessionRef.current = true;
      try {
        const fallbackSessionId = generateSessionId();
        const res = await fetch(`${API_BASE}/api/create-qr-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: fallbackSessionId }),
        });

        if (res.ok) {
          const sessionData = await res.json();
          const authoritativeId =
            sessionData.id || sessionData.sessionId || fallbackSessionId;
          update({ sessionId: authoritativeId });
          localStorage.setItem("reliv_session_id", authoritativeId);
        }
      } catch (err) {
        console.warn("[CustomerDetails] Session init warning:", err.message);
      } finally {
        isCreatingSessionRef.current = false;
      }
    };

    initKioskSession();
  }, [healthData?.sessionId, update]);

  // Proceed handler
  const handleProceed = async () => {
    if (!isFormValid) return;

    closeKeyboard();

    let currentSid =
      healthData?.sessionId ||
      localStorage.getItem("reliv_session_id") ||
      sessionStorage.getItem("reliv_session_id");

    if (
      !currentSid ||
      currentSid === "current" ||
      currentSid === "default" ||
      currentSid === "RELIV-001"
    ) {
      try {
        const fallbackSessionId = generateSessionId();
        const res = await fetch(`${API_BASE}/api/create-qr-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: fallbackSessionId }),
        });
        if (res.ok) {
          const sData = await res.json();
          currentSid = sData.id || sData.sessionId || fallbackSessionId;
        } else {
          currentSid = fallbackSessionId;
        }
      } catch (e) {
        currentSid = generateSessionId();
      }
    }

    const patientPayload = {
      name: form.name.trim(),
      age: parseInt(form.age, 10),
      gender: form.gender,
    };

    update({
      sessionId: currentSid,
      patient: patientPayload,
    });

    try {
      localStorage.setItem("reliv_session_id", currentSid);
    } catch (e) {}

    navigate("/two-options", { state: { sessionId: currentSid } });
  };

  return (
    <div
      className={`relative min-h-screen bg-slate-50 flex flex-col justify-between font-sans select-none overflow-x-hidden ${
        keyboardVisible ? "pb-80" : "pb-6"
      }`}
    >
      <TopEllipseBackground height="35%" color="#FFF4EC" />

      {/* Top Header */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-5 pt-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/90 border border-orange-200 text-slate-700 font-semibold text-sm shadow-sm active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} className="text-orange-500" />
          <span>Back</span>
        </button>

        <Logo size="text-2xl sm:text-3xl" />

        <div className="w-16" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-5 py-4 flex-1 flex flex-col justify-center">
        {/* Title Card */}
        <div className="text-center mb-6 space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Tell us about you
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Personalize your health checkup and reports
          </p>
        </div>

        {/* Form Container Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100/80 shadow-xl space-y-6">
          {/* 1. Name Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <User size={16} className="text-orange-500" />
              <span>Full Name</span>
            </label>
            <div
              onClick={() => openKeyboard("name")}
              className={`w-full rounded-2xl border-2 px-4 py-3.5 flex items-center bg-slate-50/50 cursor-pointer transition-all ${
                activeInputName === "name" && keyboardVisible
                  ? "border-orange-500 bg-white ring-4 ring-orange-500/10 shadow-sm"
                  : form.name.trim()
                  ? "border-slate-300 bg-white"
                  : "border-slate-200 hover:border-orange-300"
              }`}
            >
              <input
                type="text"
                name="name"
                value={form.name}
                readOnly
                placeholder="Enter your full name"
                className="w-full bg-transparent text-lg font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none cursor-pointer"
              />
              {isNameValid && (
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="stroke-[3]" />
                </div>
              )}
            </div>
          </div>

          {/* 2. Age Stepper Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Calendar size={16} className="text-orange-500" />
              <span>Age</span>
            </label>

            <div className="flex items-center justify-between gap-3 bg-slate-50/70 p-2 rounded-2xl border border-slate-200">
              {/* Decrement Button */}
              <button
                type="button"
                onClick={handleAgeDecrement}
                className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-orange-600 active:scale-90 active:bg-orange-50 flex items-center justify-center shadow-sm font-bold text-2xl transition-all"
                aria-label="Decrease age"
              >
                <Minus size={22} className="stroke-[2.5]" />
              </button>

              {/* Central Display / Touch Target */}
              <div
                onClick={() => openKeyboard("age")}
                className="flex-1 flex flex-col items-center justify-center py-1 cursor-pointer"
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
                    {form.age || "--"}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    yrs
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  Tap to type or use + / -
                </span>
              </div>

              {/* Increment Button */}
              <button
                type="button"
                onClick={handleAgeIncrement}
                className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-orange-600 active:scale-90 active:bg-orange-50 flex items-center justify-center shadow-sm font-bold text-2xl transition-all"
                aria-label="Increase age"
              >
                <Plus size={22} className="stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* 3. Gender Selection Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Users size={16} className="text-orange-500" />
              <span>Gender</span>
            </label>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "male", label: "Male", icon: "👨" },
                { id: "female", label: "Female", icon: "👩" },
                { id: "other", label: "Other", icon: "⚧" },
              ].map((item) => {
                const isSelected =
                  form.gender.toLowerCase() === item.id.toLowerCase();
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleGenderSelect(item.id)}
                    className={`h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 font-bold text-sm transition-all active:scale-95 ${
                      isSelected
                        ? "bg-gradient-to-br from-orange-500 to-orange-600 border-orange-500 text-white shadow-md shadow-orange-500/20 scale-[1.02]"
                        : "bg-slate-50/80 border-slate-200 text-slate-700 hover:border-orange-200 hover:bg-white"
                    }`}
                  >
                    <span className="text-lg leading-none">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Continue Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleProceed}
              disabled={!isFormValid}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-md flex items-center justify-center gap-2 ${
                isFormValid
                  ? "bg-orange-500 hover:bg-orange-600 text-white active:scale-98 shadow-orange-500/25"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              <span>Continue</span>
              <span className="text-xl">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="relative z-10 w-full text-center text-xs text-slate-400 py-2">
        Reliv Health System • Fast & Private
      </div>

      {/* Virtual Keyboard (On-Screen Touch Keyboard) */}
      {keyboardVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-[10000] bg-white border-t border-slate-200 shadow-2xl animate-slideUp">
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
