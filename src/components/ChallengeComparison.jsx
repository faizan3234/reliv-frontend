// src/components/ChallengeComparison.jsx — LIGHT THEME
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import Logo from "./Logo";
import confetti from "canvas-confetti";

export default function ChallengeComparison({ challengerB_Name, challengerB_Score, onContinue }) {
  const [challenge, setChallenge] = useState(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("reliv_challenge");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.expiresAt < Date.now()) {
        localStorage.removeItem("reliv_challenge");
        return;
      }
      setChallenge(parsed);
    } catch {
      localStorage.removeItem("reliv_challenge");
    }
  }, []);

  if (!challenge) return null;

  const { mode, challengerName, challengerScore } = challenge;
  const scoreA = challengerScore;
  const scoreB = challengerB_Score;
  const nameA = challengerName || "Player 1";
  const nameB = challengerB_Name || "Player 2";

  const handleReveal = () => {
    setRevealed(true);
    setTimeout(() => confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } }), 400);
  };

  const handleDone = () => {
    localStorage.removeItem("reliv_challenge");
    onContinue();
  };

  const isChallenge = mode === "challenge";
  const tied = scoreA === scoreB;
  const aWins = scoreA > scoreB;
  const winner = aWins ? nameA : nameB;
  const loser = aWins ? nameB : nameA;
  const avg = Math.round((scoreA + scoreB) / 2);
  const getScoreColor = (s) => s >= 80 ? "#16a34a" : s >= 60 ? "#ea580c" : "#dc2626";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 22, stiffness: 300 }}
          style={{
            background: "#fff", borderRadius: 28, padding: "36px 32px", maxWidth: 540, width: "100%",
            border: "1px solid #e5e7eb", boxShadow: "0 25px 60px rgba(0,0,0,0.1)", textAlign: "center",
          }}
        >
          <Logo size="text-2xl" className="mb-4" />
          <div style={{ fontSize: 40, marginBottom: 8 }}>{isChallenge ? "⚔️" : "💕"}</div>
          <h2 style={{ color: "#111827", fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
            {isChallenge ? "Challenge Results" : "Couple Score"}
          </h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 28 }}>
            {isChallenge ? "The moment of truth!" : "How healthy are you together?"}
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 28 }}>
            <div style={{
              flex: 1, background: "#f9fafb", borderRadius: 20, padding: "24px 16px",
              border: `2px solid ${!revealed ? "#e5e7eb" : ((aWins || tied) && isChallenge ? "#F97316" : "#e5e7eb")}`,
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>
                {revealed && isChallenge ? (tied ? "🤝" : aWins ? "👑" : "📸") : "🅰️"}
              </div>
              <div style={{ color: "#111827", fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{nameA}</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: revealed ? getScoreColor(scoreA) : "#d1d5db", fontFamily: "monospace", transition: "color 0.5s ease" }}>
                {revealed ? scoreA : "?"}
              </div>
              <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>/100</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900, color: isChallenge ? "#F97316" : "#ec4899" }}>
              {isChallenge ? "VS" : "❤️"}
            </div>

            <div style={{
              flex: 1, background: "#f9fafb", borderRadius: 20, padding: "24px 16px",
              border: `2px solid ${!revealed ? "#e5e7eb" : ((!aWins || tied) && isChallenge ? "#F97316" : "#e5e7eb")}`,
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>
                {revealed && isChallenge ? (tied ? "🤝" : !aWins ? "👑" : "📸") : "🅱️"}
              </div>
              <div style={{ color: "#111827", fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{nameB}</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: revealed ? getScoreColor(scoreB) : "#d1d5db", fontFamily: "monospace", transition: "color 0.5s ease" }}>
                {revealed ? scoreB : "?"}
              </div>
              <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>/100</div>
            </div>
          </div>

          {!revealed ? (
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleReveal} style={{
              background: isChallenge ? "linear-gradient(135deg, #F97316, #ea580c)" : "linear-gradient(135deg, #ec4899, #a855f7)",
              color: "#fff", border: "none", borderRadius: 9999, padding: "16px 48px", fontSize: 20, fontWeight: 800, cursor: "pointer",
            }}>
              {isChallenge ? "REVEAL! ⚡" : "REVEAL 💕"}
            </motion.button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              {isChallenge ? (
                <>
                  <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 16, padding: "16px 24px", marginBottom: 16 }}>
                    <div style={{ color: "#ea580c", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
                      {tied ? "🤝 It's a tie!" : `👑 ${winner} wins!`}
                    </div>
                    <div style={{ color: "#6b7280", fontSize: 14 }}>
                      {tied ? "Both of you post it on your story! 😏" : `${loser}, time to post it on your story! 📸`}
                    </div>
                  </div>
                  <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 20 }}>A deal's a deal — screenshot this & tag @reliv.health</p>
                </>
              ) : (
                <>
                  <div style={{ background: "#fdf2f8", border: "1px solid #fbcfe8", borderRadius: 16, padding: "16px 24px", marginBottom: 16 }}>
                    <div style={{ color: "#db2777", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>💕 Couple Health Score: {avg}/100</div>
                    <div style={{ color: "#6b7280", fontSize: 14 }}>
                      {avg >= 80 ? "Power couple energy! 🔥 You're both thriving" : avg >= 60 ? "Solid together! Keep pushing each other 💪" : "Health journey starts here — together is better 🫶"}
                    </div>
                  </div>
                  <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 20 }}>Screenshot this & share on Instagram together 💕</p>
                </>
              )}
              <button onClick={handleDone} style={{
                background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "12px 36px",
                color: "#374151", fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}>
                Continue to Report →
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
