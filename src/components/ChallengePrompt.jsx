// src/components/ChallengePrompt.jsx
// Modal shown on Report5 — user picks Challenge (friend) or Couple (partner)
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";

export default function ChallengePrompt({ open, onClose, userName, score, metabolicAge, gender, email }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // null | "challenge" | "couple"
  const [confirmed, setConfirmed] = useState(false);

  if (!open) return null;

  const handleStart = () => {
    const challengeData = {
      mode: mode,
      challengerName: userName || "Anonymous",
      challengerScore: score ?? 0,
      challengerMetabolicAge: metabolicAge,
      challengerGender: gender,
      challengerEmail: email,
      startedAt: Date.now(),
      expiresAt: Date.now() + 300000, // 5 min
    };
    try {
      localStorage.setItem("reliv_challenge", JSON.stringify(challengeData));
    } catch { /* ignore */ }
    // Navigate to fresh start for User B
    navigate("/choose-language");
  };

  const handleClose = () => {
    setMode(null);
    setConfirmed(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              background: "#ffffff",
              borderRadius: 24, padding: 40, maxWidth: 520, width: "100%",
              border: "1px solid #e5e7eb",
              boxShadow: "0 30px 100px rgba(0,0,0,0.15)",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Logo size="text-3xl" className="mb-6" />

            {/* Step 1: Choose mode */}
            {!mode && (
              <>
                <h2 style={{ color: "#111827", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                  Who's checking next?
                </h2>
                <p style={{ color: "#6b7280", fontSize: 15, marginBottom: 32 }}>
                  Your score is locked in: <span style={{ color: "#F97316", fontWeight: 700 }}>{score ?? 0}/100</span>
                </p>

                <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 24 }}>
                  <button
                    onClick={() => setMode("challenge")}
                    style={{
                      background: "linear-gradient(135deg, #F97316, #ea580c)",
                      color: "#fff", border: "none", borderRadius: 16,
                      padding: "20px 32px", fontSize: 18, fontWeight: 700,
                      cursor: "pointer", flex: 1, maxWidth: 200,
                    }}
                  >
                    ⚔️ A Friend
                    <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.9, marginTop: 4 }}>
                      Loser posts on story!
                    </div>
                  </button>

                  <button
                    onClick={() => setMode("couple")}
                    style={{
                      background: "linear-gradient(135deg, #ec4899, #a855f7)",
                      color: "#fff", border: "none", borderRadius: 16,
                      padding: "20px 32px", fontSize: 18, fontWeight: 700,
                      cursor: "pointer", flex: 1, maxWidth: 200,
                    }}
                  >
                    💕 Partner
                    <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.9, marginTop: 4 }}>
                      Couple health card!
                    </div>
                  </button>
                </div>

                <button
                  onClick={handleClose}
                  style={{
                    background: "none", border: "1px solid #d1d5db",
                    borderRadius: 12, padding: "10px 24px",
                    color: "#9ca3af", fontSize: 14, cursor: "pointer",
                  }}
                >
                  Nah, maybe later →
                </button>
              </>
            )}

            {/* Step 2: Confirm */}
            {mode && !confirmed && (
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>
                  {mode === "challenge" ? "⚔️" : "💕"}
                </div>
                <h2 style={{ color: "#111827", fontSize: 26, fontWeight: 800, marginBottom: 12 }}>
                  {mode === "challenge" ? "Challenge Mode" : "Couple Health Check"}
                </h2>
                <p style={{ color: "#6b7280", fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>
                  {mode === "challenge"
                    ? `Your friend checks their health next. Whoever scores lower puts the result on their Instagram story. Deal? 🤝`
                    : `Your partner checks next. You'll both get a cute couple health card to share on Instagram together! 💕`}
                </p>
                <div style={{
                  background: "#fff7ed", border: "1px solid #fed7aa",
                  borderRadius: 12, padding: "12px 20px", margin: "20px 0",
                  color: "#ea580c", fontSize: 14, fontWeight: 600,
                }}>
                  {userName}'s Score: {score ?? 0}/100 — Locked In ✓
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <button
                    onClick={() => { setConfirmed(true); handleStart(); }}
                    style={{
                      background: mode === "challenge"
                        ? "linear-gradient(135deg, #F97316, #ea580c)"
                        : "linear-gradient(135deg, #ec4899, #a855f7)",
                      color: "#fff", border: "none", borderRadius: 9999,
                      padding: "14px 36px", fontSize: 17, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    {mode === "challenge" ? "Let's Go! ⚔️" : "Start Together 💕"}
                  </button>
                  <button
                    onClick={() => setMode(null)}
                    style={{
                      background: "#f3f4f6", border: "1px solid #e5e7eb",
                      borderRadius: 9999, padding: "14px 24px",
                      color: "#6b7280", fontSize: 15, cursor: "pointer",
                    }}
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
