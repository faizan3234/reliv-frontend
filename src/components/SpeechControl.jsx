import React, { useState, useRef, useEffect } from "react";
import { useSpeech } from "../context/SpeechContext";

/**
 * SpeechControl — Floating mute/volume button for each page.
 * Blends with the Reliv orange theme. Tap to mute/unmute, long-press or
 * tap the expand arrow to reveal a volume slider.
 */
export default function SpeechControl({ className = "" }) {
  const { muted, toggleMute, volume, setVolume, speakingRef } = useSpeech();
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef(null);

  // Hide on admin pages
  const isAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin-x7k9');
  if (isAdminPage) return null;

  // Close the volume panel when clicking outside
  useEffect(() => {
    if (!expanded) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setExpanded(false);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [expanded]);

  return (
    <div
      ref={panelRef}
      className={`fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2 ${className}`}
    >
      {/* Volume slider panel */}
      {expanded && (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-orange-100 px-4 py-4 mb-1 flex flex-col items-center gap-3 animate-slideUp w-16">
          {/* Volume percentage */}
          <span className="text-xs font-bold text-orange-600">
            {Math.round(volume * 100)}%
          </span>

          {/* Vertical slider */}
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            className="speech-volume-slider"
            style={{
              writingMode: "vertical-lr",
              direction: "rtl",
              height: "100px",
              width: "28px",
              appearance: "none",
              WebkitAppearance: "none",
              background: `linear-gradient(to top, #F97316 ${volume * 100}%, #e5e7eb ${volume * 100}%)`,
              borderRadius: "14px",
              outline: "none",
              cursor: "pointer",
            }}
          />

          {/* Min label */}
          <span className="text-[10px] text-gray-400">MIN</span>
        </div>
      )}

      {/* Main control button area */}
      <div className="flex items-center gap-2">
        {/* Expand/collapse arrow */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-8 h-8 rounded-full bg-white/80 backdrop-blur border border-orange-100 shadow flex items-center justify-center text-orange-500 hover:bg-orange-50 transition-all"
          aria-label={expanded ? "Hide volume" : "Show volume"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {expanded ? (
              <polyline points="6 9 12 15 18 9" />
            ) : (
              <polyline points="6 15 12 9 18 15" />
            )}
          </svg>
        </button>

        {/* Mute/Unmute button */}
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
            muted
              ? "bg-gray-200 text-gray-500 border-2 border-gray-300"
              : "bg-gradient-to-br from-orange-400 to-orange-600 text-white border-2 border-orange-300"
          }`}
          aria-label={muted ? "Unmute speaker" : "Mute speaker"}
        >
          {muted ? (
            /* Muted icon */
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            /* Speaker icon with waves */
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </button>
      </div>

      {/* Inline styles for the slider thumb and animation */}
      <style>{`
        .speech-volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          border: 3px solid #F97316;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          cursor: pointer;
        }
        .speech-volume-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          border: 3px solid #F97316;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          cursor: pointer;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
