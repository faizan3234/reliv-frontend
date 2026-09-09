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

  const getHints = () => {
    if (voiceExpecting === 'confirm') return ['yes', 'no', 'correct', 'wrong', 'galat', 'nahi', 'sahi'];
    if (voiceExpecting === 'gender') return ['male', 'female', 'man', 'woman', 'other'];
    if (voiceExpecting === 'age') return ['age', 'years', 'number'];
    return [];
  };

  useVoicePage({
    expecting: voiceExpecting,
    vocabularyHints: getHints(),
    onHelp: () => {
       if (!isNameValid) {
          speakText("Tell me your name.");
       } else if (!isAgeValid) {
          speakText("Tell me your age.");
       } else if (!isGenderValid) {
          speakText("Tell me your gender.");
       } else {
          speakText("Say yes if it's correct, or no if you'd like to change it.");
       }
    },
    onTranscript: (lowerText, rawText) => {
      // Helper to parse age from digits, Hindi/Bengali numerals, or number words
      const parseAgeFromText = (inputLower) => {
        // 1. Convert Bengali & Hindi script numerals to Arabic digits
        const normalized = inputLower
          .replace(/[\u09E6-\u09EF]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x09E6 + 48))
          .replace(/[\u0966-\u096F]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0966 + 48));

        const digitMatch = normalized.match(/\b\d{1,3}\b/);
        if (digitMatch) {
          const val = parseInt(digitMatch[0], 10);
          if (val >= 1 && val <= 120) return val.toString();
        }

        // 2. Multilingual word mapping for English, Hindi, and Bengali numbers (1 - 100)
        const wordMap = {
          // English
          "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
          "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20,
          "twenty one": 21, "twenty two": 22, "twenty three": 23, "twenty four": 24, "twenty five": 25, "twenty six": 26, "twenty seven": 27, "twenty eight": 28, "twenty nine": 29, "thirty": 30,
          "thirty one": 31, "thirty two": 32, "thirty three": 33, "thirty four": 34, "thirty five": 35, "thirty six": 36, "thirty seven": 37, "thirty eight": 38, "thirty nine": 39, "forty": 40,
          "forty one": 41, "forty two": 42, "forty three": 43, "forty four": 44, "forty five": 45, "forty six": 46, "forty seven": 47, "forty eight": 48, "forty nine": 49, "fifty": 50,
          "fifty five": 55, "sixty": 60, "sixty five": 65, "seventy": 70, "seventy five": 75, "eighty": 80, "ninety": 90,
          // Hindi (Transliterated & Devanagari)
          "ek": 1, "do": 2, "teen": 3, "char": 4, "paanch": 5, "panch": 5, "chhah": 6, "che": 6, "saat": 7, "aath": 8, "nau": 9, "das": 10,
          "gyarah": 11, "barah": 12, "terah": 13, "chaudah": 14, "pandrah": 15, "solah": 16, "satrah": 17, "atharah": 18, "unnis": 19, "bees": 20,
          "ikkees": 21, "baais": 22, "baees": 22, "teees": 23, "chaubees": 24, "pachchees": 25, "pachees": 25, "chhabbees": 26, "sattaees": 27, "atthaees": 28, "untees": 29, "tees": 30,
          "iktees": 31, "battees": 32, "tentees": 33, "chauntees": 34, "paintees": 35, "chhattees": 36, "saintees": 37, "adtees": 38, "untalees": 39, "chalees": 40,
          "iktalees": 41, "bayalees": 42, "taintalees": 43, "chawalees": 44, "paintalees": 45, "chhiyalees": 46, "saintalees": 47, "adtalees": 48, "unchaas": 49, "pachaas": 50,
          "ekavvan": 51, "baavan": 52, "tirpan": 53, "chawwan": 54, "pachpan": 55, "chhappan": 56, "sattawan": 57, "atthaavan": 58, "unsath": 59, "saath": 60,
          "पैंतीस": 35, "छब्बीस": 26, "पच्चीस": 25, "चौबीस": 24, "तेईस": 23, "बाईस": 22, "इक्कीस": 21, "बीस": 20, "उन्नीस": 19, "अठारह": 18, "सत्रह": 17, "सोलह": 16, "पंद्रह": 15, "चौदह": 14, "तेरह": 13, "बारह": 12, "ग्यारह": 11, "दस": 10, "तीस": 30, "चालीस": 40, "पचास": 50, "साठ": 60,
          // Bengali (Transliterated & Bengali Script)
          "dui": 2, "tin": 3, "paach": 5, "chhoy": 6, "aat": 8, "noy": 9, "dosh": 10,
          "egaro": 11, "baro": 12, "tero": 13, "choddo": 14, "ponero": 15, "sholo": 16, "sotero": 17, "atharo": 18, "unish": 19, "kuri": 20, "bish": 20,
          "ekush": 21, "baish": 22, "teish": 23, "chobbish": 24, "pochish": 25, "chabbish": 26, "shatash": 27, "athash": 28, "untrish": 29, "trish": 30,
          "ektrish": 31, "botrish": 32, "tetrish": 33, "choutrish": 34, "poyntrish": 35, "chhotrish": 36, "shaytrish": 37, "athtrish": 38, "unochollish": 39, "chollish": 40,
          "একুশ": 21, "বাইশ": 22, "তেইশ": 23, "চব্বিশ": 24, "পঁচিশ": 25, "ছাব্বিশ": 26, "সাতাশ": 27, "আটাশ": 28, "উনত্রিশ": 29, "ত্রিশ": 30, "চল্লিশ": 40, "পঞ্চাশ": 50, "ষাট": 60, "কুড়ি": 20, "বিশ": 20
        };

        for (const [w, n] of Object.entries(wordMap)) {
          const regex = new RegExp(`(^|\\s)${w}(\\s|$)`, 'i');
          if (regex.test(inputLower)) {
            return n.toString();
          }
        }
        return null;
      };

      // Handle Confirmations
      if (voiceExpecting === 'confirm' && pendingField) {
        const hasPositive = /\b(yes|yeah|yep|correct|right|that's right|haan|han|ha|haan ji|sahi|sahi hai|theek|thik|hmm yes|হ্যাঁ|ঠিক|ঠিক আছে)\b/.test(lowerText);
        const hasNegative = /\b(no|nope|wrong|incorrect|not correct|that's wrong|it is wrong|change|change it|edit|edit it|nahi|nahin|na|galat|galat hai|ye galat hai|sahi nahi|sahi nahin|theek nahi|thik nahi|wrong hai|change karo|dobara|नहीं|गलत|गलत है|सही नहीं|ठीक नहीं|naa|bhul|bhool|vul|vul ache|thik na|sothik na|না|ভুল|ভুল আছে|ঠিক না|সঠিক না)\b/.test(lowerText);

        let result = 'unknown';
        if (hasNegative) {
            result = 'negative';
        } else if (hasPositive) {
            result = 'positive';
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
          // Reject provisional value, restore mode, and ask for it again without apology
          setVoiceExpecting(pendingField);
          if (pendingField === 'name') speakText("Okay, tell me the correct name.");
          else if (pendingField === 'age') speakText("Okay, tell me the correct age.");
          else if (pendingField === 'gender') speakText("Okay, tell me the correct gender.");
          setPendingField(null);
          setPendingValue(null);
        } else {
          // Contextual retry instead of generic fallback
          speakText("Say yes if it's correct, or no if you'd like to change it.");
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
         if (rawText.length > 1) {
             // Clean away all introductory prefixes and filler phrases
             let cleaned = rawText
               .replace(/(mera naam hai|mera naam|mera nam hai|mera nam|my name is|the name is|is my name|my name|amar naam hoche|amar nam hoche|amar naam holo|amar nam holo|amar naam|amar nam|naam hai|nam hai|naam|nam|মাই নেম ইজ|মাই নেম|আমার নাম হচ্ছে|আমার নাম হলো|আমার নাম|নাম হলো|নাম হচ্ছে|নাম|মেরা নাম|मेरा नाम है|मेरा नाम|नाम है|नाम|माय नेम इज|माय नेम)/gi, ' ')
               .replace(/(friend|again|try again|repeat|once more|bolo|please|friend again|try|suno)/gi, ' ')
               .replace(/(hai|hoche|holo|হচ্ছে|হলো|হয়|है)/gi, ' ')
               // Clean out affirmative/negative repetitive utterances (e.g. "sahi sahi", "sahi hai", "galat", "wrong", "no", "yes")
               .replace(/\b(sahi|galat|wrong|right|haan|han|nahi|nhi|yes|yeah|no|nope|ok|okay|thik|theek|thek|naa|nah|bhul|ঠিক|ভুল|রং|না|হ্যাঁ|হ্যা|হা|सही|गलत|हाँ|हां|नहीं|ना|ओके|जी|अच्छा)\b/gi, ' ')
               .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
               .trim();

             // Compress multiple whitespace
             cleaned = cleaned.replace(/\s+/g, ' ').trim();

             const isBadName = /^(ok|okay|yes|yeah|yep|yup|haan|han|naa|naah|nah|no|nope|correct|true|false|thik|theek|sahi|galat|wrong|bhul|nahi|nhi|done|next|proceed|friend|again|try|হয়ে গেছে|হ্যাঁ|হ্যা|হা|না|ঠিক|ভুল|রং|রঙ|রক|রঅং|रॉन्ग|सही|गलत|हाँ|हां|नहीं|ना|ओके|जी|करेक्ट|अच्छा)$/i.test(cleaned);

             if (cleaned.length >= 2 && !isBadName && !/^\d+$/.test(cleaned)) {
                 // Format name to Title Case
                 const formattedName = cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                 setPendingField('name');
                 setPendingValue(formattedName);
                 setVoiceExpecting('confirm');
                 speakText(t('confirmName'));
             }
         }
      } else if (voiceExpecting === 'age') {
         const parsedAge = parseAgeFromText(lowerText);
         if (parsedAge) {
             setPendingField('age');
             setPendingValue(parsedAge);
             setVoiceExpecting('confirm');
             speakText(t('confirmAge'));
         }
      } else if (voiceExpecting === 'gender') {
         if (/(female|aurat|ladki|mohila|woman|girl|ফিমেল|ফিমেইল|মহিলা|মেয়ে|নারী|फीमेल|औरत|लड़की|महिला)/.test(lowerText)) {
             setPendingField('gender');
             setPendingValue('female');
             setVoiceExpecting('confirm');
             speakText(t('confirmGender'));
         } else if (/(mail|male|aadmi|ladka|purush|man|boy|মেল|মেইল|পুরুষ|পুরুস|ছেলে|আদমি|मेल|आदमी|लड़का|पुरुष)/.test(lowerText)) {
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
