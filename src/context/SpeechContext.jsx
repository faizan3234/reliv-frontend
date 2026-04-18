import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { API_BASE } from "../config/api";

const SpeechContext = createContext(null);

// ── Default config (fallback if backend is unreachable) ──
const DEFAULT_CONFIG = {
  splash: "Welcome to Reliv. Your personal health companion. Tap to start.",
  "choose-language": "Pick your language. English, Hindi, or Bengali.",
  "customer-details": "Scan QR code with your phone. Or open Google and scan. Save your details for faster login next time.",
  "two-options": "Great. Health checkup or medicine dispenser? Tap your choice.",
  "body-composition": "Step on the scale. Feet on the black area, not the orange. Bring your feet closer. Hold still. We will measure height too. If weight looks wrong, tap Refresh and stand again. If device disconnected, tap Refresh.",
  "health-checkup": "Now blood pressure. Pick the cuff from the hook. Put it on your wrist at heart level. Press the ON button. Then tap Measure on screen. Don't talk. Stay relaxed. If anything looks off, tap Refresh and measure again. If device disconnected, tap Refresh.",
  "oxygen-pulse": "Place your finger in the sensor clip. Tap Measure. Hold still for 15 seconds. If device disconnected, tap Refresh.",
  "body-temperature": "Hold the temperature gun on your forehead. Tap Measure. If device disconnected, tap Refresh.",
  eyesight: "Now the eyesight test. Cover one eye. Read the letters and numbers you see on screen. Select what you see from the options. Then cover your other eye and repeat.",
  "report-1": "This is your health score compared to an average person your age.",
  "report-2": "Your overall status. Green, yellow, or red.",
  "report-3": "This graph grows as you visit. Come back tomorrow. New insights unlock.",
  "report-4": "Your eyesight assessment is complete.",
  "report-5": "Here are all your numbers in one place. But more importantly, here is what they mean in simple human language. Read the advice on screen. Screenshot it. Follow it for 7 days. Then come back. A free checkup is waiting for you. Scroll down. Your full report will be emailed to you. You can also challenge a friend or your partner to see who's healthier. Loser posts on their story! And check out the wellness kits curated just for you.",
  "wellness-recommendations": "Your personalized advice is on screen. Eat this. Do that. Avoid this. No doctor terms. Just simple steps.",
  checkout: "Review your health kits and proceed to checkout when ready.",
  payment: "That's all the free tests. Now for just 17 rupees, less than a Coke or a cigarette, I will translate everything into simple human language. No doctor terms. Just eat this, do that, avoid this. Plus a 7-day graph. Scan QR code. GPay, PhonePe, Paytm. Or insert 17 rupees, exact change.",
  "order-success": "Thank you. Your full receipt is sent to your email. Simple language. Easy to understand. Come back tomorrow to see the changes and compare. Your graph grows. New insights unlock. I am proud of you. See you tomorrow?",
  feedback: "Rate your experience. 1 to 5 stars. Your feedback helps other students trust Reliv.",
  "idle-loop": "Free weight. Free BP. Free oxygen. A full report with simple human advice, just 17 rupees. Less than a Coke. Step up. Let me help you.",
};

// ── Default voice settings ──
const DEFAULT_VOICE_SETTINGS = { rate: 0.95, pitch: 1.0, lang: "en-IN", voicePreference: "female" };

export function SpeechProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [voiceSettings, setVoiceSettings] = useState(DEFAULT_VOICE_SETTINGS);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1); // 0–1
  const [speaking, setSpeaking] = useState(false);
  const currentUtterance = useRef(null);
  const configLoaded = useRef(false);

  // ── Fetch speech config from backend on mount ──
  useEffect(() => {
    if (configLoaded.current) return;
    configLoaded.current = true;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/speech-config`);
        if (res.ok) {
          const data = await res.json();
          // Extract voice settings if present
          if (data._voiceSettings) {
            setVoiceSettings((prev) => ({ ...prev, ...data._voiceSettings }));
          }
          setConfig((prev) => ({ ...prev, ...data }));
        }
      } catch {
        // Backend unreachable — use defaults
      }
    })();
  }, []);

  // ── Stop any active speech ──
  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    currentUtterance.current = null;
    setSpeaking(false);
  }, []);

  // ── Speak text directly ──
  const speakText = useCallback(
    (text) => {
      if (!text || muted || !window.speechSynthesis) return;

      // Cancel any ongoing speech first
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = volume;
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.lang = voiceSettings.lang;

      // Try to pick a good voice based on preference
      const voices = window.speechSynthesis.getVoices();
      const pref = voiceSettings.voicePreference;
      let preferred;
      if (pref === "male") {
        preferred = voices.find(
          (v) => v.lang.startsWith("en") && (v.name.includes("Male") || v.name.includes("David") || v.name.includes("James"))
        );
      } else if (pref === "female") {
        preferred = voices.find(
          (v) => v.lang.startsWith("en") && (v.name.includes("Female") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Zira"))
        );
      }
      // Fallback: any English voice (covers Linux espeak-ng voices like "English (Great Britain)")
      if (!preferred) {
        preferred = voices.find((v) => v.lang.startsWith("en"));
      }
      // Last resort: use any available voice at all (Pi may only have one)
      if (!preferred && voices.length > 0) {
        preferred = voices[0];
      }
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => {
        setSpeaking(false);
        currentUtterance.current = null;
      };
      utterance.onerror = () => {
        setSpeaking(false);
        currentUtterance.current = null;
      };

      currentUtterance.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [muted, volume, voiceSettings]
  );

  // ── Speak by page key (looks up config, falls back to default if empty) ──
  const speak = useCallback(
    (pageKey) => {
      const text = config[pageKey] || DEFAULT_CONFIG[pageKey];
      if (text) speakText(text);
    },
    [config, speakText]
  );

  // ── Toggle mute ──
  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      if (!prev) {
        // Going mute — stop anything playing
        window.speechSynthesis?.cancel();
        setSpeaking(false);
      }
      return !prev;
    });
  }, []);

  // ── Update volume ──
  const setVol = useCallback((v) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolume(clamped);
  }, []);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ── Pre-load voices (Chrome needs this) ──
  useEffect(() => {
    const loadVoices = () => window.speechSynthesis?.getVoices();
    loadVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener?.("voiceschanged", loadVoices);
  }, []);

  // ── Warm-up speech engine on first user gesture (needed on Linux/Pi) ──
  useEffect(() => {
    const warmUp = () => {
      if (!window.speechSynthesis) return;
      const silent = new SpeechSynthesisUtterance("");
      silent.volume = 0;
      window.speechSynthesis.speak(silent);
      // Remove listeners after first gesture
      document.removeEventListener("click", warmUp);
      document.removeEventListener("touchstart", warmUp);
    };
    document.addEventListener("click", warmUp, { once: true });
    document.addEventListener("touchstart", warmUp, { once: true });
    return () => {
      document.removeEventListener("click", warmUp);
      document.removeEventListener("touchstart", warmUp);
    };
  }, []);

  return (
    <SpeechContext.Provider
      value={{
        config,
        setConfig,
        speak,
        speakText,
        stop,
        muted,
        toggleMute,
        volume,
        setVolume: setVol,
        speaking,
      }}
    >
      {children}
    </SpeechContext.Provider>
  );
}

// ── Hook: use speech context ──
// eslint-disable-next-line react-refresh/only-export-components
export function useSpeech() {
  const ctx = useContext(SpeechContext);
  if (!ctx) throw new Error("useSpeech must be used within SpeechProvider");
  return ctx;
}

// ── Hook: auto-speak when a page mounts ──
// eslint-disable-next-line react-refresh/only-export-components
export function usePageSpeech(pageKey) {
  const { speak, stop } = useSpeech();

  useEffect(() => {
    // Small delay so the page renders first, then speech starts
    const timer = setTimeout(() => speak(pageKey), 400);
    return () => {
      clearTimeout(timer);
      stop();
    };
  }, [pageKey, speak, stop]);
}
