import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { API_BASE } from "../config/api";
import { useHealth } from "./HealthContext";

const SpeechContext = createContext(null);

const DEFAULT_CONFIG = {
  splash: {
    en: "Welcome to Reliv, your personal health companion. Tap Start whenever you're ready.",
    hi: "रिलीव में आपका स्वागत है, आपका पर्सनल हेल्थ कम्पैनियन। तैयार हों तो Start दबाइए।",
    bn: "রিলিভ-এ স্বাগতম, আপনার পার্সোনাল হেলথ কম্প্যানিয়ন। প্রস্তুত হলে Start চাপুন।"
  },
  "choose-language": {
    en: "Choose the language you're most comfortable with: English, Hindi, or Bengali.",
    hi: "जिस भाषा में आप सबसे सहज हैं, उसे चुनिए: English, Hindi या Bengali।",
    bn: "যে ভাষায় আপনি সবচেয়ে স্বচ্ছন্দ, সেটি বেছে নিন: English, Hindi অথবা Bengali।"
  },
  "customer-details": {
    en: "Let's fill your details. You can use your phone, the touchscreen, or simply speak to me. If you're using your phone, scan the Details QR with your camera — this is not the payment QR. I'll guide you step by step.",
    hi: "चलिए आपकी details भरते हैं। आप phone, touchscreen या voice — किसी भी तरीके से भर सकते हैं। Phone से भरने के लिए Details QR को camera से scan करें — यह payment QR नहीं है। मैं आपको step by step guide करूँगा।",
    bn: "চলুন আপনার details পূরণ করি। Phone, touchscreen বা voice—যেটা সহজ লাগে ব্যবহার করুন। Phone দিয়ে করতে Details QR camera দিয়ে scan করুন—এটা payment QR নয়। আমি ধাপে ধাপে গাইড করব।"
  },
  "two-options": {
    en: "What would you like to do today — a Health Checkup or Medicine Dispensing? You can tap an option or tell me.",
    hi: "आज आप क्या करना चाहते हैं — Health Checkup या Medicine Dispensing? Screen पर चुन सकते हैं या मुझे बोल सकते हैं।",
    bn: "আজ আপনি কী করতে চান—Health Checkup নাকি Medicine Dispensing? Screen-এ বেছে নিতে পারেন অথবা আমাকে বলতে পারেন।"
  },
  "body-composition": {
    en: "Step onto the scale with both feet on the black area. Keep your feet close and stand still while Reliv measures your weight and height.",
    hi: "Scale पर दोनों पैर black area पर रखकर खड़े हो जाइए। पैर पास रखें और स्थिर रहें। Reliv आपका weight और height measure करेगा।",
    bn: "Scale-এর black area-তে দুই পা রেখে দাঁড়ান। পা কাছাকাছি রাখুন এবং স্থির থাকুন। Reliv আপনার weight ও height measure করবে।"
  },
  "health-checkup": {
    en: "Now we'll check your blood pressure. Place the wrist cuff correctly and keep your wrist at heart level. Stay relaxed and don't talk while the measurement is running.",
    hi: "अब Blood Pressure check करेंगे। Wrist cuff सही तरह पहनिए और wrist को heart level पर रखिए। Measurement के दौरान relaxed रहें और बात न करें।",
    bn: "এবার Blood Pressure check হবে। Wrist cuff ঠিকভাবে পরুন এবং wrist heart level-এ রাখুন। Measurement চলার সময় শান্ত ও স্থির থাকুন।"
  },
  "oxygen-pulse": {
    en: "Place your finger properly inside the sensor clip. Tap Measure and keep your finger still until the reading completes.",
    hi: "Finger को sensor clip में सही तरह रखिए। Measure दबाइए और reading पूरी होने तक finger स्थिर रखिए।",
    bn: "Finger sensor clip-এর ভিতরে ঠিকভাবে রাখুন। Measure চাপুন এবং reading শেষ হওয়া পর্যন্ত finger স্থির রাখুন।"
  },
  "body-temperature": {
    en: "Now we'll check your body temperature. Position the temperature sensor as shown and tap Measure. Hold still for a moment.",
    hi: "अब Body Temperature check करेंगे। Sensor को screen पर दिखाए तरीके से रखें और Measure दबाएँ। थोड़ी देर स्थिर रहें।",
    bn: "এবার Body Temperature check হবে। Screen-এ দেখানোভাবে sensor রাখুন और Measure চাপুন। কিছুক্ষণ স্থির থাকুন।"
  },
  "eyesight": {
    en: "Now for your eyesight test. Cover one eye, read what's shown on screen, and select the matching option. Then we'll repeat with the other eye.",
    hi: "अब Eyesight Test करेंगे। एक आँख ढकिए, screen पर जो दिख रहा है उसे पढ़िए और सही option चुनिए। फिर दूसरी आँख से repeat करेंगे।",
    bn: "এবার Eyesight Test। একটি চোখ ঢেকে screen-এ যা দেখছেন তার সঠিক option বেছে নিন। তারপর অন্য চোখে repeat হবে।"
  },
  "report-1": {
    en: "Your checkup is complete. This is a simple snapshot of today's measurements.",
    hi: "आपका checkup complete हो गया है। यह आज की measurements का simple snapshot है।",
    bn: "আপনার checkup complete হয়েছে। এটি আজকের measurements-এর একটি সহজ snapshot।"
  },
  "report-2": {
    en: "Here is your overall wellness summary. Use the colour indicators and explanations to understand each measurement.",
    hi: "यह आपका overall wellness summary है। हर measurement को समझने के लिए colour indicators और explanation देखें।",
    bn: "এটি আপনার overall wellness summary। প্রতিটি measurement বুঝতে colour indicator এবং explanation দেখুন।"
  },
  "report-3": {
    en: "Your progress becomes more useful with repeat visits. Future checkups can help you see how your measurements are changing over time.",
    hi: "Repeat visits के साथ आपका progress और useful होता जाएगा। आगे के checkups से measurements के changes समझने में मदद मिलेगी।",
    bn: "Repeat visit করলে progress আরও useful হবে। পরবর্তী checkup-এ measurements কীভাবে বদলাচ্ছে তা দেখা যাবে।"
  },
  "report-4": {
    en: "Your eyesight assessment is complete. Review the result and continue when you're ready.",
    hi: "आपका eyesight assessment complete है। Result देखिए और तैयार हों तो आगे बढ़िए।",
    bn: "আপনার eyesight assessment complete হয়েছে। Result দেখুন এবং প্রস্তুত হলে এগিয়ে যান।"
  },
  "report-5": {
    en: "Here are your measurements together with simple explanations and practical wellness suggestions. Your full report can also be sent to your email. Scroll down to review everything.",
    hi: "यहाँ आपकी सभी measurements, simple explanations और practical wellness suggestions हैं। आपका full report email पर भी भेजा जा सकता है। नीचे scroll करके पूरा report देखें।",
    bn: "এখানে আপনার সব measurements, সহজ explanation এবং practical wellness suggestions রয়েছে। Full report email-এও পাঠানো যাবে। নিচে scroll করে সব দেখুন।"
  },
  "wellness-recommendations": {
    en: "Here are simple wellness suggestions based on today's checkup. Focus on practical actions you can follow easily.",
    hi: "यहाँ आज के checkup के आधार पर simple wellness suggestions हैं। ऐसे practical steps पर focus करें जिन्हें आसानी से follow कर सकें।",
    bn: "আজকের checkup-এর ভিত্তিতে সহজ wellness suggestions এখানে রয়েছে। সহজে follow করা যায় এমন practical step-এ focus করুন।"
  },
  "checkout": {
    en: "Review your selected medicines or health kits. When everything looks correct, continue to checkout.",
    hi: "अपनी selected medicines या health kits check कर लीजिए। सब सही हो तो checkout पर जाएँ।",
    bn: "Selected medicines বা health kits দেখে নিন। সব ঠিক থাকলে checkout করুন।"
  },
  "payment": {
    en: "Your tests are complete. To unlock the full plain-language report and progress insights for 17 rupees, scan the QR code with your phone. Complete the payment on your phone, then return here for your four-digit verification code.",
    hi: "आपके tests complete हो गए हैं। 17 rupees में full plain-language report और progress insights unlock करने के लिए phone से QR scan करें। Phone पर payment पूरा करें, फिर four-digit verification code के साथ यहाँ continue करें।",
    bn: "আপনার tests complete হয়েছে। 17 rupees-এ full plain-language report এবং progress insights unlock করতে phone দিয়ে QR scan করুন। Phone-এ payment শেষ করে four-digit verification code দিয়ে এখানে continue করুন।"
  },
  "order-success": {
    en: "All done. Your transaction is complete. Please collect your item if applicable, and check your phone or email for your receipt and report. Thank you for using Reliv.",
    hi: "सब हो गया। आपका transaction complete है। अगर medicine है तो उसे collect करें, और receipt/report के लिए phone या email check करें। Reliv इस्तेमाल करने के लिए धन्यवाद।",
    bn: "সব হয়ে গেছে। আপনার transaction complete। Medicine থাকলে collect করুন এবং receipt/report-এর জন্য phone বা email check করুন। Reliv ব্যবহার করার জন্য ধন্যবাদ।"
  },
  "feedback": {
    en: "Before you go, how was your experience with Reliv? Your feedback helps us improve.",
    hi: "जाने से पहले बताइए, Reliv का experience कैसा रहा? आपका feedback हमें बेहतर बनने में मदद करता है।",
    bn: "যাওয়ার আগে বলুন, Reliv-এর experience কেমন ছিল? আপনার feedback আমাদের আরও ভালো হতে সাহায্য করবে।"
  },
  "idle-loop": {
    en: "Free weight. Free BP. Free oxygen. A full report with simple human advice, just 17 rupees. Less than a Coke. Step up. Let me help you.",
    hi: "Free weight. Free BP. Free oxygen. A full report with simple human advice, just 17 rupees. Less than a Coke. Step up. Let me help you.",
    bn: "Free weight. Free BP. Free oxygen. A full report with simple human advice, just 17 rupees. Less than a Coke. Step up. Let me help you."
  },
  "leaderboard": {
    en: "Take a moment to appreciate our campus health heroes. These students took charge of their health. Can you beat them? Step up to the Reliv kiosk!",
    hi: "Take a moment to appreciate our campus health heroes. These students took charge of their health. Can you beat them? Step up to the Reliv kiosk!",
    bn: "Take a moment to appreciate our campus health heroes. These students took charge of their health. Can you beat them? Step up to the Reliv kiosk!"
  }
};

const DEFAULT_VOICE_SETTINGS = { rate: 0.95, pitch: 1.0, voicePreference: "female" };

export function SpeechProvider({ children }) {
  const { data: healthData } = useHealth();
  const selectedLang = healthData?.language || 'en';
  
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [voiceSettings, setVoiceSettings] = useState(DEFAULT_VOICE_SETTINGS);
  const [muted, setMuted] = useState(() => localStorage.getItem("reliv_muted") === "true");
  const [volume, setVolume] = useState(1);
  const speakingRef = useRef(false);
  const playbackRequestRef = useRef(0);
  const configRef = useRef(config);
  const voiceSettingsRef = useRef(voiceSettings);
  const audioManifestRef = useRef(null);
  const activeAudioRef = useRef(null);

  configRef.current = config;
  voiceSettingsRef.current = voiceSettings;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/speech-config`);
        if (res.ok) {
          const data = await res.json();
          if (data._voiceSettings) setVoiceSettings((prev) => ({ ...prev, ...data._voiceSettings }));
          // We no longer overwrite DEFAULT_CONFIG with API unless it matches nested structure,
          // assuming API doesn't have the nested strings yet.
        }
      } catch {}

      try {
        const res = await fetch('/assets/audio/manifest.json');
        if (res.ok) {
          audioManifestRef.current = await res.json();
        }
      } catch (e) {
        console.error("Failed to load audio manifest", e);
      }
    })();
  }, []);

  const stopActivePlayback = useCallback(async () => {
    if (activeAudioRef.current) {
        // Remove event listeners BEFORE pausing to prevent stale callbacks
        // from racing with new playback after stop() returns
        activeAudioRef.current.onended = null;
        activeAudioRef.current.onerror = null;
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
        activeAudioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    speakingRef.current = false;
    window.dispatchEvent(new CustomEvent('reliv_speaking', { detail: false }));
  }, []);

  const stop = useCallback(async () => {
    playbackRequestRef.current += 1;
    await stopActivePlayback();
  }, [stopActivePlayback]);

  const speakViaSynthesis = useCallback(
    (text, requestId, langHint, callbacks = {}) => {
      if (requestId !== playbackRequestRef.current) return Promise.resolve();

      return new Promise((resolve) => {
        const manifest = audioManifestRef.current;
        
        // Fallback gracefully if manifest or audio file is missing
        if (!manifest || !manifest[text]) {
            console.warn("No pre-recorded audio found for:", text);
            if (callbacks.onEnd) callbacks.onEnd();
            resolve();
            return;
        }

        let targetLang = "en";
        if (langHint === "hi") targetLang = "hi";
        if (langHint === "bn") targetLang = "bn";
        
        const audioUrl = `/assets/audio/${targetLang}/${manifest[text]}`;
        const audio = new Audio(audioUrl);
        
        // Guard against double-finish (onended + onerror can both fire)
        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          if (requestId === playbackRequestRef.current) {
            speakingRef.current = false;
            window.dispatchEvent(new CustomEvent('reliv_speaking', { detail: false }));
            activeAudioRef.current = null;
            if (callbacks.onEnd) callbacks.onEnd();
          }
          resolve();
        };

        audio.onended = finish;
        audio.onerror = (e) => {
          console.error("Audio error", e);
          if (callbacks.onError) callbacks.onError(e);
          finish();
        };

        if (callbacks.onStart) callbacks.onStart();
        speakingRef.current = true;
        window.dispatchEvent(new CustomEvent('reliv_speaking', { detail: true }));
        activeAudioRef.current = audio;
        
        audio.play().catch(e => {
            console.error("Play blocked", e);
            finish();
        });
      });
    },
    []
  );

  const speakText = useCallback(
    async (text, callbacks) => {
      if (!text || muted) return;
      const requestId = ++playbackRequestRef.current;
      await stopActivePlayback();
      if (requestId !== playbackRequestRef.current) return;
      speakViaSynthesis(text, requestId, selectedLang, callbacks);
    },
    [muted, stopActivePlayback, speakViaSynthesis, selectedLang]
  );

  const speakChained = useCallback(
    async (messages, callbacks = {}) => {
      if (!messages || messages.length === 0 || muted) return;
      const requestId = ++playbackRequestRef.current;
      await stopActivePlayback();
      if (requestId !== playbackRequestRef.current) return;

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (msg.text && requestId === playbackRequestRef.current) {
          const isLast = i === messages.length - 1;
          await speakViaSynthesis(msg.text, requestId, msg.langHint || 'en', isLast ? callbacks : {});
        }
      }
    },
    [muted, stopActivePlayback, speakViaSynthesis]
  );

  const speak = useCallback(
    async (pageKey) => {
      if (muted) return;
      const requestId = ++playbackRequestRef.current;
      await stopActivePlayback();
      if (requestId !== playbackRequestRef.current) return;

      const pageConfig = configRef.current[pageKey] || DEFAULT_CONFIG[pageKey];
      let textToSpeak = "";
      
      if (typeof pageConfig === "string") {
        textToSpeak = pageConfig;
      } else if (pageConfig) {
        textToSpeak = pageConfig[selectedLang] || pageConfig['en'] || "";
      }

      if (textToSpeak) speakViaSynthesis(textToSpeak, requestId, selectedLang);
    },
    [muted, stopActivePlayback, speakViaSynthesis, selectedLang]
  );

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      if (!prev) stop();
      const nextMuted = !prev;
      localStorage.setItem("reliv_muted", String(nextMuted));
      return nextMuted;
    });
  }, [stop]);

  const setVol = useCallback((v) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolume(clamped);
  }, []);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    const loadVoices = () => window.speechSynthesis?.getVoices();
    loadVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener?.("voiceschanged", loadVoices);
  }, []);

  return (
    <SpeechContext.Provider
      value={{
        config,
        setConfig,
        speak,
        speakText,
        speakChained,
        stop,
        muted,
        toggleMute,
        volume,
        setVolume: setVol,
        speakingRef,
      }}
    >
      {children}
    </SpeechContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSpeech() {
  const ctx = useContext(SpeechContext);
  if (!ctx) throw new Error("useSpeech must be used within SpeechProvider");
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePageSpeech(pageKey) {
  const { speak, stop } = useSpeech();

  useEffect(() => {
    const timer = setTimeout(() => speak(pageKey), 400);
    return () => {
      clearTimeout(timer);
      stop();
    };
  }, [pageKey, speak, stop]);
}
