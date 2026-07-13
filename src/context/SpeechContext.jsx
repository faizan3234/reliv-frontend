import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { API_BASE } from "../config/api";

const SpeechContext = createContext(null);

// ── Page keys with pre-generated audio ──
const AUDIO_PAGES = new Set([
  "splash", "choose-language", "customer-details", "two-options",
  "body-composition", "health-checkup", "oxygen-pulse", "body-temperature",
  "eyesight", "report-1", "report-2", "report-3", "report-4", "report-5",
  "wellness-recommendations", "checkout", "payment", "order-success",
  "feedback", "idle-loop", "leaderboard",
]);

// ── Local Pi audio server (plays via mpv, bypasses Chromium audio decoder) ──
const PI_AUDIO_URL = "http://localhost:3456";
let piServerAvailable = null; // null = unknown, true/false after check

async function checkPiServer() {
  if (piServerAvailable !== null) return piServerAvailable;
  try {
    const res = await fetch(`${PI_AUDIO_URL}/health`, { signal: AbortSignal.timeout(1000) });
    const data = await res.json();
    piServerAvailable = data.ok === true;
  } catch {
    piServerAvailable = false;
  }
  console.log(`[Speech] Pi audio server: ${piServerAvailable ? "available" : "not found, using browser audio"}`);
  return piServerAvailable;
}

// Check on load
if (typeof window !== "undefined") {
  checkPiServer();
}

// ── Browser audio cache (fallback for non-kiosk devices) ──
const audioCache = {};

function preloadAudio(pageKey) {
  if (audioCache[pageKey]) return audioCache[pageKey];
  const audio = new Audio();
  audio.preload = "auto";
  audio.src = `/audio/${pageKey}.mp3`;
  audioCache[pageKey] = audio;
  return audio;
}
// Preload for non-kiosk fallback
if (typeof window !== "undefined") {
  AUDIO_PAGES.forEach((key) => preloadAudio(key));
}

// ── Default config (fallback if backend is unreachable) ──
const DEFAULT_CONFIG = {
  splash: "Welcome to Reliv. Your personal health companion. Tap to start.",
  "choose-language": "Pick your language. English, Hindi, or Bengali.",
  "customer-details": "Yeh payment QR nahi hai. This is NOT for payment. Do NOT open Google Pay or PhonePe. Open your phone camera and scan to fill your name and age. Ya neeche wala button dabao aur haath se type karo.",
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
  leaderboard: "Take a moment to appreciate our campus health heroes. These students took charge of their health. Can you beat them? Step up to the Reliv kiosk!",
};

// ── Default voice settings (used by speechSynthesis fallback) ──
const DEFAULT_VOICE_SETTINGS = { rate: 0.95, pitch: 1.0, lang: "en-IN", voicePreference: "female" };

export function SpeechProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [voiceSettings, setVoiceSettings] = useState(DEFAULT_VOICE_SETTINGS);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1); // 0–1
  const speakingRef = useRef(false);       // Track speaking without re-renders
  const currentAudio = useRef(null);   // HTML5 Audio element
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
  // Returns a promise so callers can await full stop before starting new audio
  const stop = useCallback(async () => {
    // Stop browser audio
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current.currentTime = 0;
      currentAudio.current = null;
    }
    window.speechSynthesis?.cancel();
    speakingRef.current = false;
    // Stop Pi audio server playback — await so next play doesn't clash
    if (piServerAvailable) {
      try { await fetch(`${PI_AUDIO_URL}/stop`, { signal: AbortSignal.timeout(400) }); } catch { /* ignore */ }
    }
  }, []);

  // ── Play via Pi local server (mpv, no Chromium audio decoding) ──
  const playViaPiServer = useCallback(
    async (pageKey) => {
      speakingRef.current = true;
      try {
        await fetch(`${PI_AUDIO_URL}/play/${pageKey}`);
      } catch {
        speakingRef.current = false;
        throw new Error("Pi server unreachable");
      }
    },
    []
  );

  // ── Play via browser Audio element (fallback for non-kiosk) ──
  const playViaBrowser = useCallback(
    (pageKey) => {
      return new Promise((resolve, reject) => {
        const audio = preloadAudio(pageKey);
        audio.volume = volume;
        audio.currentTime = 0;

        audio.onplay = () => { speakingRef.current = true; };
        audio.onended = () => {
          speakingRef.current = false;
          currentAudio.current = null;
          resolve();
        };
        audio.onerror = () => {
          speakingRef.current = false;
          currentAudio.current = null;
          reject(new Error("Audio file not found"));
        };

        currentAudio.current = audio;
        audio.play().catch(reject);
      });
    },
    [volume]
  );

  // ── Fallback: speak via browser speechSynthesis (for desktops or custom text) ──
  const speakViaSynthesis = useCallback(
    (text) => {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = volume;
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.lang = voiceSettings.lang;

      const voices = window.speechSynthesis.getVoices();
      const pref = voiceSettings.voicePreference;
      let preferred;
      if (pref === "female") {
        preferred = voices.find(
          (v) => v.lang.startsWith("en") && (v.name.includes("Female") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Zira"))
        );
      } else if (pref === "male") {
        preferred = voices.find(
          (v) => v.lang.startsWith("en") && (v.name.includes("Male") || v.name.includes("David") || v.name.includes("James"))
        );
      }
      if (!preferred) preferred = voices.find((v) => v.lang.startsWith("en"));
      if (!preferred && voices.length > 0) preferred = voices[0];
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => { speakingRef.current = true; };
      utterance.onend = () => { speakingRef.current = false; };
      utterance.onerror = (e) => {
        if (e.error !== "interrupted") speakingRef.current = false;
      };

      window.speechSynthesis.speak(utterance);
    },
    [volume, voiceSettings]
  );

  // ── Speak arbitrary text (admin preview, custom text) ──
  const speakText = useCallback(
    (text) => {
      if (!text || muted) return;
      stop();
      speakViaSynthesis(text);
    },
    [muted, stop, speakViaSynthesis]
  );

  // ── Speak by page key ──
  // On Pi kiosk: plays via local mpv server (zero Chromium audio = no HDMI glitch)
  // On other devices: plays via browser Audio element
  const speak = useCallback(
    async (pageKey) => {
      if (muted) return;
      await stop(); // await so Pi stop fully completes before next play (prevents voice clash)

      if (AUDIO_PAGES.has(pageKey)) {
        // Try Pi local server first (no Chromium audio decoding)
        const usePi = await checkPiServer();
        if (usePi) {
          try {
            await playViaPiServer(pageKey);
            return;
          } catch {
            // Pi server failed — fall through to browser
          }
        }

        // Browser fallback
        try {
          await playViaBrowser(pageKey);
          return;
        } catch {
          // MP3 failed — fall through to speechSynthesis
        }
      }

      // Final fallback: speechSynthesis
      const text = config[pageKey] || DEFAULT_CONFIG[pageKey];
      if (text) speakViaSynthesis(text);
    },
    [muted, config, stop, playViaPiServer, playViaBrowser, speakViaSynthesis]
  );

  // ── Toggle mute ──
  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      if (!prev) stop();
      return !prev;
    });
  }, [stop]);

  // ── Update volume ──
  const setVol = useCallback((v) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolume(clamped);
    if (currentAudio.current) currentAudio.current.volume = clamped;
  }, []);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (currentAudio.current) {
        currentAudio.current.pause();
        currentAudio.current = null;
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ── Pre-load voices for speechSynthesis fallback ──
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
    const timer = setTimeout(() => speak(pageKey), 400);
    return () => {
      clearTimeout(timer);
      stop();
    };
  }, [pageKey, speak, stop]);
}
