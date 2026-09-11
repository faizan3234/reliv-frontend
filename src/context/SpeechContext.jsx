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
  const cancelPlaybackRef = useRef(null);
  const retryPlaybackRef = useRef(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  
  const speakerGateRef = useRef(false);

  const setSpeakerGate = useCallback((active) => {
    const next = Boolean(active);

    if (speakerGateRef.current === next) return;

    speakerGateRef.current = next;
    speakingRef.current = next;

    window.dispatchEvent(
      new CustomEvent("reliv_speaking", {
        detail: next,
      })
    );
  }, []);

  configRef.current = config;
  voiceSettingsRef.current = voiceSettings;

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/speech-config`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setConfig((prev) => ({ ...prev, ...data }));
          if (data._voiceSettings) setVoiceSettings((prev) => ({ ...prev, ...data._voiceSettings }));
        }
      } catch { /* Offline defaults remain available. */ }
    })();
    // Recordings must load even if the optional configuration service stalls.
    (async () => {
      try {
        const res = await fetch('/assets/audio/manifest.json', { signal: controller.signal });
        if (res.ok) {
          audioManifestRef.current = await res.json();
        }
      } catch (e) {
        if (!controller.signal.aborted) console.warn("Failed to load audio manifest", e);
      }
    })();
    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);

  const stopActivePlayback = useCallback(async () => {
    try {
      retryPlaybackRef.current = null;
      cancelPlaybackRef.current?.();
      cancelPlaybackRef.current = null;
      if (activeAudioRef.current) {
          activeAudioRef.current.onended = null;
          activeAudioRef.current.onerror = null;
          activeAudioRef.current.pause();
          activeAudioRef.current.currentTime = 0;
          activeAudioRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } finally {
      setSpeakerGate(false);
    }
  }, [setSpeakerGate]);

  const stop = useCallback(async () => {
    playbackRequestRef.current += 1;
    await stopActivePlayback();
  }, [stopActivePlayback]);

  const speakViaSynthesis = useCallback(
    (text, requestId, langHint, callbacks = {}) => {
      if (requestId !== playbackRequestRef.current) return Promise.resolve();

      return new Promise((resolve) => {
        const safeText = String(text).trim();
        const manifest = audioManifestRef.current;
        const language = String(langHint || 'en').split('-')[0];
        const targetLang = ['en', 'hi', 'bn'].includes(language) ? language : 'en';
        let finished = false;
        let utterance = null;
        let audio = null;
        let usingSynthesis = false;
        let playbackTimeout = null;
        const finish = (cancelled = false) => {
          if (finished) return;
          finished = true;
          clearTimeout(playbackTimeout);
          retryPlaybackRef.current = null;
          if (audio) audio.onended = audio.onerror = null;
          if (utterance) utterance.onend = utterance.onerror = null;
          if (requestId === playbackRequestRef.current) {
            setSpeakerGate(false);
            activeAudioRef.current = null;
            cancelPlaybackRef.current = null;
            if (!cancelled) {
              try { callbacks.onEnd?.(); }
              finally { resolve(); }
            }
          }
          resolve();
        };
        cancelPlaybackRef.current = () => finish(true);
        const begin = () => {
          if (finished || requestId !== playbackRequestRef.current) return false;
          setSpeakerGate(true);
          clearTimeout(playbackTimeout);
          playbackTimeout = setTimeout(() => {
            fail(new Error('Speech playback timed out.'));
          }, Math.min(180000, 20000 + safeText.length * 200));
          window.dispatchEvent(new CustomEvent('reliv_spoken_text', { detail: safeText }));
          callbacks.onStart?.();
          return true;
        };
        const fail = (error) => {
          if (finished || requestId !== playbackRequestRef.current) return;
          finish(true);
          audio?.pause();
          if (utterance) window.speechSynthesis?.cancel();
          callbacks.onError?.(error);
        };
        const playSynthesis = () => {
          if (finished || requestId !== playbackRequestRef.current) return;
          if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
            fail(new Error('No recording or browser speech voice is available.'));
            return;
          }
          utterance = new window.SpeechSynthesisUtterance(safeText);
          utterance.lang = { en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN' }[targetLang];
          utterance.volume = volumeRef.current;
          const settings = { ...voiceSettingsRef.current, ...callbacks.voiceSettings };
          utterance.rate = settings.rate;
          utterance.pitch = settings.pitch;
          const localVoices = window.speechSynthesis.getVoices().filter((voice) =>
            voice.localService && voice.lang.toLowerCase().startsWith(targetLang));
          const preference = settings.voicePreference === 'male' ? /\b(male|david|james)\b/i
            : settings.voicePreference === 'female' ? /\b(female|samantha|zira)\b/i : null;
          const localVoice = localVoices.find((voice) => preference?.test(voice.name)) || localVoices[0];
          if (localVoice) utterance.voice = localVoice;
          utterance.onend = () => finish();
          utterance.onerror = (event) => {
            if (finished || requestId !== playbackRequestRef.current) return;
            if (event.error === 'not-allowed') {
              clearTimeout(playbackTimeout);
              setSpeakerGate(false);
              retryPlaybackRef.current = playSynthesis;
            } else {
              fail(event);
            }
          };
          if (begin()) {
            try { window.speechSynthesis.speak(utterance); }
            catch (error) { fail(error); }
          }
        };

        if (callbacks.preferSynthesis || !manifest?.[safeText]) {
          playSynthesis();
          return;
        }
        audio = new Audio(`/assets/audio/${targetLang}/${manifest[safeText]}`);
        audio.volume = volumeRef.current;
        activeAudioRef.current = audio;
        audio.onended = () => finish();
        const fallbackToSynthesis = () => {
          if (finished || usingSynthesis || requestId !== playbackRequestRef.current) return;
          usingSynthesis = true;
          audio.onended = audio.onerror = null;
          audio.pause();
          activeAudioRef.current = null;
          playSynthesis();
        };
        audio.onerror = fallbackToSynthesis;
        const playRecording = () => {
          if (!begin()) return;
          audio.play().catch((error) => {
            if (finished || usingSynthesis || requestId !== playbackRequestRef.current) return;
            if (error.name === 'NotAllowedError') {
              clearTimeout(playbackTimeout);
              setSpeakerGate(false);
              retryPlaybackRef.current = playRecording;
            } else {
              fallbackToSynthesis();
            }
          });
        };
        playRecording();
      });
    },
    [setSpeakerGate]
  );

  const speakText = useCallback(
    async (text, callbacks) => {
      if (!text || muted) return;
      const requestId = ++playbackRequestRef.current;
      await stopActivePlayback();
      if (requestId !== playbackRequestRef.current) return;
      return speakViaSynthesis(text, requestId, callbacks?.langHint || selectedLang, callbacks);
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

      if (textToSpeak) return speakViaSynthesis(textToSpeak, requestId, selectedLang);
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
    const retry = () => {
      const play = retryPlaybackRef.current;
      retryPlaybackRef.current = null;
      play?.();
    };
    window.addEventListener("pointerdown", retry);
    window.addEventListener("keydown", retry);
    return () => {
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
      stop();
    };
  }, [stop]);

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
