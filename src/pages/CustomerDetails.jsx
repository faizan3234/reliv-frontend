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
import { guidanceText } from "../voice/guidanceCopy";
import { ensureKioskSession, saveKioskCustomer, saveKioskHealthProfile } from "../utils/kioskSession";

const PROFILE_COPY = {
  en: { new: 'First time here', returning: 'I have visited before', medicine: 'Only buying medicine', firstHint: 'Start your first health journey', returnHint: 'Add this scan to your progress', medicineHint: 'Continue without a health profile', pin: 'Your private 6-digit PIN', confirm: 'Enter PIN again', privacy: 'Remember this PIN. It keeps your past scans private on this kiosk.', wrong: 'PINs must match.', select: 'Choose First time here or I have visited before. If you only need medicine, tap Only buying medicine.', pinHelp: 'Enter the private six digit PIN you chose on your first visit.' },
  hi: { new: 'पहली बार आए हैं', returning: 'पहले आ चुके हैं', medicine: 'केवल दवा खरीदें', firstHint: 'अपनी पहली जाँच शुरू करें', returnHint: 'आज की जाँच को पिछली जाँच से जोड़ें', medicineHint: 'स्वास्थ्य प्रोफ़ाइल के बिना आगे बढ़ें', pin: 'आपका निजी 6 अंकों का PIN', confirm: 'PIN फिर डालें', privacy: 'यह PIN याद रखें। इससे आपकी पुरानी जाँच निजी रहती हैं।', wrong: 'दोनों PIN एक जैसे होने चाहिए।', select: 'पहली बार आए हैं या पहले आ चुके हैं, चुनें। केवल दवा चाहिए तो केवल दवा खरीदें दबाएँ।', pinHelp: 'पहली जाँच में बनाया गया अपना निजी छह अंकों का PIN डालें।' },
  bn: { new: 'প্রথমবার এসেছেন', returning: 'আগেও এসেছেন', medicine: 'শুধু ওষুধ কিনব', firstHint: 'প্রথম স্বাস্থ্য পরীক্ষা শুরু করুন', returnHint: 'আজকের পরীক্ষার সঙ্গে আগেরটি মিলিয়ে দেখুন', medicineHint: 'স্বাস্থ্য প্রোফাইল ছাড়াই এগোন', pin: 'আপনার ব্যক্তিগত ৬ সংখ্যার PIN', confirm: 'PIN আবার লিখুন', privacy: 'PIN মনে রাখুন। এটি আপনার আগের পরীক্ষার তথ্য সুরক্ষিত রাখে।', wrong: 'দুটি PIN একই হতে হবে।', select: 'প্রথমবার এসেছেন, না আগেও এসেছেন, বেছে নিন। শুধু ওষুধ লাগলে ওষুধের বোতাম চাপুন।', pinHelp: 'প্রথম পরীক্ষার সময় বেছে নেওয়া ব্যক্তিগত ছয় সংখ্যার PIN লিখুন।' },
};

function PinPad({ label, value, onChange }) {
  return <div className="space-y-2">
    <p className="text-base font-semibold text-slate-800">{label}</p>
    <div aria-label={label} className="flex justify-center gap-2 rounded-2xl bg-slate-100 p-3">
      {Array.from({ length: 6 }, (_, index) => <span key={index} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-xl font-bold text-orange-600">{index < value.length ? '•' : '·'}</span>)}
    </div>
    <div className="grid grid-cols-3 gap-2" aria-label="PIN keypad">
      {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((digit, index) => digit === ''
        ? <span key={index} />
        : <button key={index} type="button" aria-label={digit === '⌫' ? 'Delete last digit' : `Digit ${digit}`} onClick={() => onChange(digit === '⌫' ? value.slice(0,-1) : (value + digit).slice(0,6))}
            className="min-h-12 rounded-xl bg-white text-xl font-semibold text-slate-800 shadow-sm active:bg-orange-100">{digit}</button>)}
    </div>
  </div>;
}

export default function CustomerDetails() {
  const navigate = useNavigate();
  const { t: translateUI } = useTranslation();
  const { data: healthData, update } = useHealth();
  const selectedLang = healthData?.language || 'en';
  const copy = PROFILE_COPY[selectedLang] || PROFILE_COPY.en;
  const [mode, setMode] = useState(null);
  const [pin, setPin] = useState('');
  const [pinAgain, setPinAgain] = useState('');
  const { speakText } = useSpeech();

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [activeInputName, setActiveInputName] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    age: "22",
    gender: "",
  });

  const [keyboardInputs, setKeyboardInputs] = useState({
    name: "",
    email: "",
    age: "22",
  });

  const submittingRef = useRef(false);
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Sync keyboard inputs with form
  useEffect(() => {
    setKeyboardInputs({
      name: form.name,
      email: form.email,
      age: form.age,
    });
  }, [form.name, form.age, form.email]);

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
  const isEmailValid = !form.email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const isFormValid = isNameValid && (mode === 'medicine' || (pin.length === 6 && (mode === 'returning' || pin === pinAgain))) && (mode === 'returning' || (isAgeValid && isGenderValid && isEmailValid));

  // All details are entered by touch. Speech only describes the next step.
  const guidanceKey = isSubmitting ? 'saving' : submitError ? 'detailsError'
    : keyboardVisible ? (activeInputName === 'age' ? 'detailsAge' : 'detailsName')
    : !mode ? 'detailsReady' : !isNameValid ? 'detailsName' : mode === 'returning' ? 'detailsReady' : !isGenderValid ? 'detailsGender'
    : !isAgeValid ? 'detailsAge' : 'detailsReady';
  const speechPrompt = !mode ? copy.select : mode === 'returning' && isNameValid ? copy.pinHelp : guidanceText(guidanceKey, selectedLang);
  useVoicePage({
    guidanceKey,
    idleEnabled: !isSubmitting,
    onHelp: () => speakText(speechPrompt),
  });

  // Wait for a field/keyboard transition rather than interrupting each keystroke.
  useEffect(() => {
    if (isSubmitting) return;
    const timer = setTimeout(() => speakText(speechPrompt), 450);
    return () => clearTimeout(timer);
  }, [speechPrompt, isSubmitting, speakText]);

  useEffect(() => {
    let active = true;
    ensureKioskSession(API_BASE).then(({ sessionId }) => {
      if (active) update({ sessionId });
    }).catch((error) => {
      if (active) setSubmitError(error.message);
    });
    return () => { active = false; };
  }, [update]);

  const handleProceed = async (values = form) => {
    const patient = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      age: Number(values.age),
      gender: values.gender,
    };
    if (submittingRef.current || !isFormValid) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError("");
    closeKeyboard();
    try {
      const result = mode === 'medicine' ? await saveKioskCustomer(API_BASE, patient) : await saveKioskHealthProfile(API_BASE, { ...patient, mode, pin });
      const { sessionId } = result;
      if (!mountedRef.current) return;
      update({ sessionId, patient: result.customerData || patient });
      navigate("/two-options", { state: { sessionId } });
    } catch (error) {
      if (mountedRef.current) setSubmitError(error.message || "Could not save your details. Please retry.");
    } finally {
      submittingRef.current = false;
      if (mountedRef.current) setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`relative min-h-screen h-auto w-full bg-gradient-to-br from-indigo-50 via-white to-orange-50 flex flex-col justify-between font-sans select-none overflow-x-hidden overflow-y-auto scrollable-container touch-pan-y ${
        keyboardVisible ? "pb-96" : "pb-12"
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

        {!mode && <div className="grid gap-4" aria-label="Choose your visit">
          <button type="button" onClick={() => setMode('new')} className="min-h-28 rounded-3xl bg-orange-500 p-6 text-left text-white shadow-xl active:scale-[.99]">
            <span className="block text-2xl font-bold">{copy.new}</span><span>{copy.firstHint}</span>
          </button>
          <button type="button" onClick={() => setMode('returning')} className="min-h-28 rounded-3xl border-2 border-orange-400 bg-white p-6 text-left text-slate-900 shadow-md active:scale-[.99]">
            <span className="block text-2xl font-bold">{copy.returning}</span><span>{copy.returnHint}</span>
          </button>
          <button type="button" onClick={() => setMode('medicine')} className="min-h-20 rounded-3xl border border-slate-200 bg-white p-5 text-left text-slate-800 active:scale-[.99]">
            <span className="block text-xl font-bold">{copy.medicine}</span><span>{copy.medicineHint}</span>
          </button>
        </div>}

        {/* Form Container Card - Glassmorphism, No borders */}
        {mode && <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-10 shadow-2xl shadow-indigo-100/50 space-y-6 border border-white">
          <button type="button" onClick={() => { setMode(null); setPin(''); setPinAgain(''); setSubmitError(''); }} className="text-orange-700 underline">← {copy.new} / {copy.returning}</button>
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
                    : form.name.trim()
                    ? "bg-white shadow-sm"
                    : "bg-slate-100/50 hover:bg-white"
                }`}
              >
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  readOnly
                  placeholder={translateUI('enterName')}
                  className="w-full bg-transparent text-lg font-bold focus:outline-none cursor-pointer text-slate-900 placeholder:text-slate-400"
                />
                {isNameValid && (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Check size={18} className="stroke-[3]" />
                  </div>
                )}
              </div>
            </div>

            {mode !== 'returning' && <>{/* 2. Age Stepper Field */}
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
                  className="flex-1 flex flex-col items-center justify-center cursor-pointer rounded-2xl py-2"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight font-mono text-slate-900">
                      {form.age || "--"}
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
            </div></>}
          </div>

          {/* 3. Gender Selection Field */}
          {mode !== 'returning' && <div className="space-y-2">
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
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleGenderSelect(item.id)}
                    className={`h-16 rounded-2xl flex flex-col items-center justify-center gap-2 font-bold text-sm transition-all active:scale-95 ${
                      isSelected
                        ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl shadow-orange-500/30 scale-[1.02]"
                        : "bg-slate-100/60 text-slate-700 hover:bg-white shadow-sm"
                    }`}
                  >
                    <span className="text-xl leading-none">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>}

          {mode !== 'returning' && <div className="space-y-2">
            <label htmlFor="customer-email" className="block text-sm font-bold text-slate-700">Email (optional)</label>
            <input id="customer-email" type="email" maxLength={254} value={form.email}
              onFocus={() => openKeyboard('email')}
              onChange={event => setForm(prev => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-2xl border border-slate-300 p-4 text-lg" placeholder="you@example.com" />
            <p className="text-sm text-slate-600">Optional for delivery. Health visits are linked privately by your name and PIN.</p>
            {!isEmailValid && <p role="alert" className="text-red-700">Enter a valid email or leave it empty.</p>}
          </div>}

          {mode !== 'medicine' && <PinPad label={copy.pin} value={pin} onChange={setPin} />}
          {mode === 'new' && <><PinPad label={copy.confirm} value={pinAgain} onChange={setPinAgain} />
            <p className="text-sm text-slate-700">{copy.privacy}</p>
            {pinAgain.length === 6 && pin !== pinAgain && <p role="alert" className="text-red-700">{copy.wrong}</p>}</>}

          {submitError && <p role="alert" className="text-sm text-red-700">{submitError}</p>}
          {/* Continue Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleProceed()}
              disabled={!isFormValid || isSubmitting}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-4 ${
                isFormValid
                  ? "bg-orange-500 hover:bg-orange-600 text-white active:scale-95 shadow-orange-500/30"
                  : "bg-slate-200/50 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              <span>{isSubmitting ? 'Saving...' : translateUI('proceed')}</span>
            </button>
          </div>
        </div>}
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
