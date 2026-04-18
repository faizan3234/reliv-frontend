// src/components/CampusLeaderboard.jsx
// Premium campus leaderboard — glassmorphic, animated, kiosk-optimized
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import { supabase, LEADERBOARD_BUCKET } from "../config/supabase";
import { QRCodeSVG } from "qrcode.react";

const TABLE = "leaderboard";

const TAGLINES = [
  "Your campus. Your health. Your legacy.",
  "Who's the healthiest on campus?",
  "Health is the real flex 💪",
  "Scan. Score. Dominate.",
  "The scoreboard doesn't lie.",
  "Legends are made here.",
];

/* Circular score ring as SVG */
function ScoreRing({ score, size = 52, stroke = 4, delay = 0 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score, 100) / 100;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : score >= 40 ? "#f97316" : "#ef4444";

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1.2, delay, ease: "easeOut" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: size * 0.32, fontWeight: 900, color, fontFamily: "'SF Mono', monospace", lineHeight: 1 }}>
          {score}
        </span>
      </div>
    </div>
  );
}


/* Shimmer keyframes injected once */
const STYLE_ID = "lb-premium-styles";
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes lb-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes lb-float {
      0%,100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    @keyframes lb-glow-pulse {
      0%,100% { box-shadow: 0 0 20px rgba(251,191,36,0.15); }
      50% { box-shadow: 0 0 35px rgba(251,191,36,0.3); }
    }
    .lb-glass {
      background: rgba(255,255,255,0.75);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }
    .lb-shimmer-text {
      background: linear-gradient(90deg, #f97316 0%, #fbbf24 25%, #f97316 50%, #fbbf24 75%, #f97316 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: lb-shimmer 3s linear infinite;
    }
  `;
  document.head.appendChild(style);
}

export default function CampusLeaderboard({ overlay = false }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tagline] = useState(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)]);

  useEffect(() => { injectStyles(); fetchLeaders(); }, []);

  useEffect(() => {
    if (!supabase) return;
    const ch = supabase
      .channel("leaderboard-live")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, () => fetchLeaders())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function fetchLeaders() {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from(TABLE).select("*").order("score", { ascending: false }).limit(7);
      if (error) throw error;
      setLeaders((data || []).map((e) => {
        let photoUrl = null;
        if (e.photo_path) {
          const { data: u } = supabase.storage.from(LEADERBOARD_BUCKET).getPublicUrl(e.photo_path);
          photoUrl = u?.publicUrl || null;
        }
        return { ...e, photoUrl };
      }));
    } catch (err) { console.error("LB fetch:", err); }
    finally { setLoading(false); }
  }

  if (loading) {
    return (
      <div style={{
        ...(overlay ? { position: "fixed", inset: 0, zIndex: 9998, background: "#fafbfc" } : {}),
        display: "flex", alignItems: "center", justifyContent: "center", minHeight: overlay ? "100vh" : 420,
      }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ textAlign: "center" }}
        >
          <div style={{ fontSize: 48, marginBottom: 16, animation: "lb-float 2s ease-in-out infinite" }}>🏆</div>
          <div style={{ color: "#94a3b8", fontSize: 14, fontWeight: 500 }}>Loading Health Heroes...</div>
        </motion.div>
      </div>
    );
  }

  if (leaders.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        ...(overlay
          ? { position: "fixed", inset: 0, zIndex: 9998, overflowY: "auto" }
          : {}),
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 30%, #fff7ed 100%)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: overlay ? "flex-start" : "center",
        minHeight: overlay ? "100vh" : "auto",
        padding: overlay ? "32px 16px 40px" : "20px 16px",
      }}
    >
      <div style={{ maxWidth: 680, width: "100%" }}>

        {/* ══════ HEADER ══════ */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
          style={{ textAlign: "center", marginBottom: 6 }}
        >
          {/* Badge pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "linear-gradient(135deg, #fff7ed, #fef3c7)",
            border: "1px solid #fde68a", borderRadius: 9999,
            padding: "4px 14px", marginBottom: 10,
            boxShadow: "0 2px 12px rgba(251,191,36,0.15)",
          }}>
            <span style={{ fontSize: 20 }}>✨</span>
            <span style={{
              fontSize: 15, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase",
            }} className="lb-shimmer-text">
              Reliv Health Heroes
            </span>
            <span style={{ fontSize: 20 }}>✨</span>
          </div>

          <h2 style={{
            color: "#0f172a", fontSize: 38, fontWeight: 900,
            letterSpacing: -0.8, lineHeight: 1.15, marginBottom: 8,
          }}>
            Campus Leaderboard
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 17, fontWeight: 500, fontStyle: "italic" }}>
            {tagline}
          </p>
        </motion.div>

        {/* ══════ ALL LEADERS — HORIZONTAL ROWS ══════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          {leaders.map((entry, idx) => {
            const rank = idx + 1;
            const medal = rank === 1 ? "👑" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
            const isChamp = rank === 1;
            const borderCol = isChamp ? "#fbbf24" : rank === 2 ? "#94a3b8" : rank === 3 ? "#d97706" : "#e2e8f0";

            return (
              <motion.div
                key={entry.id || rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + idx * 0.07 }}
                className="lb-glass"
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  borderRadius: 18, padding: isChamp ? "18px 20px" : "14px 18px",
                  border: `1.5px solid ${borderCol}`,
                  boxShadow: isChamp
                    ? "0 6px 24px rgba(251,191,36,0.15)"
                    : "0 2px 12px rgba(0,0,0,0.03)",
                  ...(isChamp ? {
                    background: "linear-gradient(135deg, #fffbeb 0%, #fff7ed 50%, #fef3c7 100%)",
                    animation: "lb-glow-pulse 3s ease-in-out infinite",
                  } : {}),
                }}
              >
                {/* Rank */}
                <div style={{
                  width: 38, textAlign: "center", flexShrink: 0,
                  fontSize: medal ? (isChamp ? 30 : 24) : 18,
                  fontWeight: 800, color: "#64748b",
                }}>
                  {medal || `#${rank}`}
                </div>

                {/* Photo */}
                <div style={{
                  width: isChamp ? 64 : 52, height: isChamp ? 64 : 52,
                  borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                  border: `2.5px solid ${borderCol}`, background: "#f8fafc",
                }}>
                  {entry.photoUrl ? (
                    <img src={entry.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{
                      width: "100%", height: "100%", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontSize: isChamp ? 28 : 22, background: isChamp ? "#fef3c7" : "#f8fafc",
                    }}>🧑</div>
                  )}
                </div>

                {/* Name + IG handle */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: "#0f172a", fontSize: isChamp ? 22 : 18, fontWeight: isChamp ? 900 : 700,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {entry.name}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 14 }}>
                    {entry.instagram ? (
                      <span style={{ color: "#E1306C", fontWeight: 600 }}>@{entry.instagram}</span>
                    ) : isChamp ? "Campus Champion" : `Rank #${rank}`}
                  </div>
                </div>

                {/* Score ring */}
                <ScoreRing score={entry.score} size={isChamp ? 60 : 50} stroke={isChamp ? 5 : 4} delay={0.3 + idx * 0.08} />

                {/* IG QR */}
                {entry.instagram && (
                  <div style={{
                    background: "#fff", borderRadius: 6, padding: 2,
                    border: "1px solid #e2e8f0", flexShrink: 0,
                  }}>
                    <QRCodeSVG value={`https://www.instagram.com/${entry.instagram}`} size={isChamp ? 52 : 42} level="L" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* ══════ CTA FOOTER ══════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          style={{
            textAlign: "center", padding: "22px 24px",
            background: "linear-gradient(135deg, #fff7ed, #fef3c7)",
            border: "1px solid #fde68a", borderRadius: 20,
            boxShadow: "0 4px 20px rgba(251,191,36,0.08)",
          }}
        >
          <p style={{ color: "#92400e", fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
            Think you can beat them? 🔥
          </p>
          <p style={{ color: "#b45309", fontSize: 16, fontWeight: 500, opacity: 0.8 }}>
            ₹17 for 30 health parameters • Step up to the Reliv kiosk
          </p>
        </motion.div>

        {/* Branding */}
        <div style={{ textAlign: "center", marginTop: 18, marginBottom: 16 }}>
          <p style={{ color: "#cbd5e1", fontSize: 10, letterSpacing: 0.5 }}>
            Powered by <strong style={{ color: "#94a3b8" }}>Reliv</strong> — Health Checkup & Medicine Dispenser
          </p>
        </div>
      </div>
    </motion.div>
  );
}
