// src/pages/CustomerDetails.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import Logo from "../components/Logo";
import TopEllipseBackground from "../components/TopEllipseBackground";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useHealth } from "../context/HealthContext";
import VirtualKeyboard from "../components/VirtualKeyboard";
import { ArrowLeft, Plus, Minus, User, Calendar, Users, Check } from "lucide-react";
import { API_BASE } from "../config/api";
import { useSpeech } from "../context/SpeechContext";
import { useVoicePage } from "../hooks/useVoicePage";
import { dict } from "../config/CustomerDetailsDict";

export default function CustomerDetails() {
  const navigate = useNavigate();
  const { t: translateUI } = useTranslation();
  const { data: healthData, update } = useHealth();
  const selectedLang = healthData?.language || 'en';
    const { speakText, speakingRef } = useSpeech();

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

  // Voice Interaction Logic
  const [voiceExpecting, setVoiceExpecting] = useState('name');
  const [pendingField, setPendingField] = useState(null);
  const [pendingValue, setPendingValue] = useState(null);
  const [hasSpokenStart, setHasSpokenStart] = useState(false);
  
  // Custom helper for translated text
  const t = useCallback((key, param = null) => {
    const entry = dict[key];
    if (!entry) return "";
    const localized = typeof entry === 'function' ? entry(param) : entry;
    return localized[selectedLang] || localized['en'] || "";
  }, [selectedLang]);

  // Speak intro
  useEffect(() => {
    if (!hasSpokenStart && !form.name && !form.age) {
      const timer = setTimeout(() => {
        speakText(t('start'));
        setHasSpokenStart(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasSpokenStart, form.name, form.age, speakText, t]);

  useVoicePage({
    expecting: voiceExpecting,
    vocabularyHints: ['male', 'female', 'mail', 'haan', 'naa', 'yes', 'no', 'done'],
    onHelp: () => {
       if (!isNameValid) {
          speakText(t('idle12_name'));
       } else if (!isAgeValid) {
          speakText(t('typedNameOnly'));
       } else if (!isGenderValid) {
          speakText(t('typedNameAndAge'));
       } else {
          speakText(t('allComplete'));
       }
    },
    onTranscript: (lowerText, rawText) => {
      // Handle Confirmations
      if (voiceExpecting === 'confirm' && pendingField) {
        const hasPositive = /(haan|yes|yeah|yep|yup|sahi|done|ho gaya|correct|true|confirm|next|proceed|\bha\b|\bhan\b|ok|okay|thik|theek|kore nilam|ইয়েস|কনফার্ম|কনফর্ম|কারেক্ট|হ্যাঁ|হ্যা|হা|হ্যাক|ঠিক|টিকা|ডান|হয়ে গেছে|ওকে|জি|জ্বি|নেক্সট|প্রসিড|করে নিলাম|কোরে নিলাম|করেছি|হয়েছে|আচ্ছা|यस|कन्फर्म|कनफर्म|करेक्ट|हाँ|हां|सही|हो गया|ठीक|ओके|जी|किया|कर लिया)/.test(lowerText);
        const hasNegative = /(naa|naah|nah|\bna\b|\bno\b|nope|galat|wrong|bhul|nahi|nhi|incorrect|false|wait|না|নাহ|নাহ্|ভুল|গলদ|গলত|গালাজ|গালাত|রং|রঙ|নয়|ইনকারেক্ট|নো|ভুল হয়েছে|नहीं|ना|नाह|गलत|ग़लत|भूल|रॉन्ग|नो|इनकरेक्ट)/.test(lowerText);
        const hasStrongNegative = /(theek nai|thik nai|theek noy|sahi nahi|sahi nhi|ঠিক নাই|ঠিক নয়|सही नहीं|सही नही|galat|wrong|bhul|incorrect|false|ভুল|গলদ|গলত|গালাজ|গালাত|রং|রঙ|নয়|ইনকারেক্ট|भूल|रॉन्ग|इनकरेक्ट)/.test(lowerText);

        let result = 'unknown';
        if (hasStrongNegative) {
            result = 'negative';
        } else if (hasPositive) {
            result = 'positive';
        } else if (hasNegative) {
            result = 'negative';
        }

        if (result === 'positive') {
          handleKeyboardChange(pendingField, pendingValue);
          
          if (pendingField === 'name') {
            setVoiceExpecting('age');
            speakText(t('nameSaved'));
          } else if (pendingField === 'age') {
            setVoiceExpecting('gender');
            speakText(t('ageSaved'));
          } else if (pendingField === 'gender') {
            // Auto-proceed!
            setVoiceExpecting('done');
            speakText(t('allComplete'));
            setTimeout(() => {
                handleProceed();
            }, 1000);
          }
          setPendingField(null);
          setPendingValue(null);
        } else if (result === 'negative') {
          setVoiceExpecting(pendingField);
          if (pendingField === 'name') speakText(t('wrongName'));
          else if (pendingField === 'age') speakText(t('wrongAge'));
          else if (pendingField === 'gender') speakText(t('wrongGender'));
          setPendingField(null);
          setPendingValue(null);
        } else {
          speakText(t('notUnderstood'));
        }
        return;
      }

      // Handle Early Completion
      if (/(done|next|continue|proceed|hoye geche|haan|ডান|নেক্সট|প্রসিড|হয়ে গেছে|হ্যাঁ|হ্যা|হা|চলো|চলুন|आगे|चलो|हो गया|हाँ|हां|नेक्स्ट)/.test(lowerText)) {
         if (isFormValid && voiceExpecting === 'done') {
             speakText(t('proceeding'));
             handleProceed();
             return;
         }
      }

      // Handle Form Fields
      if (voiceExpecting === 'name') {
         if (rawText.length > 2) {
             const extractedName = rawText.replace(/(mera naam hai|mera naam|mera nam hai|mera nam|my name is|the name is|is my name|my name|amar naam hoche|amar nam hoche|amar naam holo|amar nam holo|amar naam|amar nam|naam hai|nam hai|naam|nam|মাই নেম ইজ|মাই নেম|আমার নাম হচ্ছে|আমার নাম হলো|আমার নাম|নাম হলো|নাম হচ্ছে|নাম|মেরা নাম|मेरा नाम है|मेरा नाम|नाम है|नाम|माय नेम इज|माय नेम)/gi, '').replace(/(hai|hoche|holo|হচ্ছে|হলো|হয়|है)/gi, '').trim();
             setPendingField('name');
             setPendingValue(extractedName);
             setVoiceExpecting('confirm');
             speakText(t('confirmName'));
         }
      } else if (voiceExpecting === 'age') {
         // Convert Bengali and Hindi numerals to Arabic digits
         const normalizedText = lowerText
           .replace(/[\u09E6-\u09EF]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x09E6 + 48))
           .replace(/[\u0966-\u096F]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0966 + 48));
         if (/\d+/.test(normalizedText)) {
             const extractedAge = normalizedText.match(/\d+/)[0];
             setPendingField('age');
             setPendingValue(extractedAge);
             setVoiceExpecting('confirm');
             speakText(t('confirmAge'));
         }
      } else if (voiceExpecting === 'gender') {
         if (/(female|aurat|ladki|mohila|ফিমেল|ফিমেইল|মহিলা|মেয়ে|নারী|फीमेल|औरत|लड़की|महिला)/.test(lowerText)) {
             setPendingField('gender');
             setPendingValue('female');
             setVoiceExpecting('confirm');
             speakText(t('confirmGender'));
         } else if (/(mail|male|aadmi|ladka|purush|মেল|মেইল|পুরুষ|পুরুস|ছেলে|আদমি|मेल|आदमी|लड़का|पुरुष)/.test(lowerText)) {
             setPendingField('gender');
             setPendingValue('male');
             setVoiceExpecting('confirm');
             speakText(t('confirmGender'));
         } else if (/(other|others|আদার|অন্যান্য|অন্য|अदर|अन्य)/.test(lowerText)) {
             setPendingField('gender');
             setPendingValue('other');
             setVoiceExpecting('confirm');
             speakText(t('confirmGender'));
         }
      }
    },
    onIdle: (elapsedSeconds) => {
      if (elapsedSeconds === 4) {
         if (voiceExpecting === 'name') speakText(t('idle_name'));
         else if (voiceExpecting === 'age') speakText(t('idle_age'));
         else if (voiceExpecting === 'gender') speakText(t('idle_gender'));
      }
    }
  });

  // Automatically skip asking for things the user types manually
  useEffect(() => {
     if (voiceExpecting === 'name' && isNameValid && !pendingField) {
         setVoiceExpecting('age');
         if (!speakingRef.current) speakText(t('typedNameOnly'));
     } else if (voiceExpecting === 'age' && isAgeValid && form.age !== "22" && !pendingField) {
         setVoiceExpecting('gender');
         if (!speakingRef.current) speakText(t('typedNameAndAge'));
     } else if (voiceExpecting === 'gender' && isGenderValid && !pendingField) {
         setVoiceExpecting('done');
         if (!speakingRef.current && isFormValid) speakText(t('typedAll'));
     }
  }, [form.name, form.age, form.gender, isNameValid, isAgeValid, isGenderValid, voiceExpecting, pendingField, speakText, speakingRef, t, isFormValid]);

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
      className={`relative min-h-screen bg-gradient-to-br from-indigo-50 via-white to-orange-50 flex flex-col justify-between font-sans select-none overflow-x-hidden ${
        keyboardVisible ? "pb-80" : "pb-0"
      }`}
    >
      <TopEllipseBackground height="40%" color="#FFF4EC" />

      {/* Top Header */}
      <div className="relative z-10 w-full px-8 pt-8 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/60 backdrop-blur-md border border-white/50 text-slate-700 font-bold shadow-sm active:scale-95 transition-all"
        >
          <ArrowLeft size={20} className="text-orange-500" />
          <span className="text-lg">Back</span>
        </button>

        <Logo size="text-4xl" />

        <div className="w-24" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-6 py-4 flex-1 flex flex-col justify-center">
        {/* Title Card */}
        <div className="text-center mb-6 space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {translateUI('tellUsAboutYou')}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {translateUI('personalizeCheckup')}
          </p>
        </div>

        {/* Form Container Card - Glassmorphism, No borders */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-10 sm:p-12 shadow-2xl shadow-indigo-100/50 space-y-10 border border-white">
          <div className="flex flex-col gap-5">
            {/* 1. Name Field */}
            <div className="space-y-2">
              <label className="flex items-center gap-3 text-sm font-bold text-slate-700 ml-2">
                <User size={22} className="text-orange-500" />
                <span>{translateUI('fullName')}</span>
              </label>
              <div
                onClick={() => openKeyboard("name")}
                className={`w-full rounded-2xl px-4 py-3 flex items-center cursor-pointer transition-all ${
                  activeInputName === "name" && keyboardVisible
                    ? "bg-white ring-4 ring-orange-500/20 shadow-lg"
                    : pendingField === 'name' 
                    ? "bg-blue-50/80 animate-pulse ring-2 ring-blue-300"
                    : form.name.trim()
                    ? "bg-white shadow-sm"
                    : "bg-slate-100/50 hover:bg-white"
                }`}
              >
                <input
                  type="text"
                  name="name"
                  value={pendingField === 'name' ? pendingValue : form.name}
                  readOnly
                  placeholder={translateUI('enterName')}
                  className={`w-full bg-transparent text-lg font-bold focus:outline-none cursor-pointer ${pendingField === 'name' ? 'text-blue-600' : 'text-slate-900 placeholder:text-slate-400'}`}
                />
                {isNameValid && !pendingField && (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Check size={18} className="stroke-[3]" />
                  </div>
                )}
              </div>
            </div>

            {/* 2. Age Stepper Field */}
            <div className="space-y-2">
              <label className="flex items-center gap-3 text-sm font-bold text-slate-700 ml-2">
                <Calendar size={22} className="text-orange-500" />
                <span>{translateUI('age')}</span>
              </label>

              <div className="flex items-center justify-between gap-3 bg-slate-100/40 p-2 rounded-2xl">
                <button
                  type="button"
                  onClick={handleAgeDecrement}
                  className="w-12 h-12 rounded-xl bg-white text-slate-700 hover:text-orange-600 active:scale-90 flex items-center justify-center shadow-sm font-bold transition-all"
                >
                  <Minus size={28} className="stroke-[2.5]" />
                </button>

                <div
                  onClick={() => openKeyboard("age")}
                  className={`flex-1 flex flex-col items-center justify-center cursor-pointer rounded-2xl py-2 ${pendingField === 'age' ? 'bg-blue-50 animate-pulse' : ''}`}
                >
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-extrabold tracking-tight font-mono ${pendingField === 'age' ? 'text-blue-600' : 'text-slate-900'}`}>
                      {pendingField === 'age' ? pendingValue : (form.age || "--")}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {translateUI('years')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAgeIncrement}
                  className="w-12 h-12 rounded-xl bg-white text-slate-700 hover:text-orange-600 active:scale-90 flex items-center justify-center shadow-sm font-bold transition-all"
                >
                  <Plus size={28} className="stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* 3. Gender Selection Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 text-sm font-bold text-slate-700 ml-2">
              <Users size={22} className="text-orange-500" />
              <span>{translateUI('gender')}</span>
            </label>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "male", label: translateUI('male'), icon: "👨" },
                { id: "female", label: translateUI('female'), icon: "👩" },
                { id: "other", label: translateUI('others'), icon: "⚧" },
              ].map((item) => {
                const isSelected = form.gender.toLowerCase() === item.id.toLowerCase();
                const isPending = pendingField === 'gender' && pendingValue?.toLowerCase() === item.id.toLowerCase();
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleGenderSelect(item.id)}
                    className={`h-16 rounded-2xl flex flex-col items-center justify-center gap-2 font-bold text-sm transition-all active:scale-95 ${
                      isSelected
                        ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl shadow-orange-500/30 scale-[1.02]"
                        : isPending
                        ? "bg-blue-50 border-2 border-blue-400 text-blue-700 animate-pulse shadow-md scale-[1.02]"
                        : "bg-slate-100/60 text-slate-700 hover:bg-white shadow-sm"
                    }`}
                  >
                    <span className="text-xl leading-none">{item.icon}</span>
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
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-4 ${
                isFormValid
                  ? "bg-orange-500 hover:bg-orange-600 text-white active:scale-95 shadow-orange-500/30"
                  : "bg-slate-200/50 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              <span>{translateUI('proceed')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Virtual Keyboard */}
      {keyboardVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-[10000] bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-2xl animate-slideUp">
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
