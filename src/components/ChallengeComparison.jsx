import relivLogo from "../assets/relivlogo.jpeg";
// src/components/ChallengeComparison.jsx — HEALTH DUEL & COUPLE STORY CARD
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import Logo from "./Logo";
import confetti from "canvas-confetti";
import { Download, Share2, Sparkles, Award, Droplets, Clock, Flame, CheckCircle2 } from "lucide-react";

export default function ChallengeComparison({
  challengerB_Name,
  challengerB_Score,
  challengerB_MetabolicAge,
  challengerB_BodyWater,
  challengerB_VisceralFat,
  onContinue
}) {
  const [challenge, setChallenge] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const canvasRef = useRef(null);
  const [logoImage, setLogoImage] = useState(null);
  const [exportError, setExportError] = useState('');
  useEffect(() => {
    const image = new Image();
    image.onload = () => setLogoImage(image);
    image.src = relivLogo;
    return () => { image.onload = null; };
  }, []);

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


  const {
    mode = "challenge",
    challengerName = "Player 1",
    challengerScore = 75,
    challengerMetabolicAge = 26,
    challengerBodyWater = 56,
    challengerVisceralFat = 4
  } = challenge || {};

  const nameA = challengerName || "Player 1";
  const nameB = challengerB_Name || "Player 2";
  const scoreA = Number(challengerScore) || 75;
  const scoreB = Number(challengerB_Score) || 75;
  const metaA = Number(challengerMetabolicAge) || 26;
  const metaB = Number(challengerB_MetabolicAge) || 25;
  const waterA = Number(challengerBodyWater) || 56;
  const waterB = Number(challengerB_BodyWater) || 57;
  const viscA = Number(challengerVisceralFat) || 4;
  const viscB = Number(challengerB_VisceralFat) || 4;

  const isChallenge = mode === "challenge";
  const tied = scoreA === scoreB;
  const aWins = scoreA > scoreB;
  const winner = aWins ? nameA : nameB;
  const loser = aWins ? nameB : nameA;
  const avg = Math.round((scoreA + scoreB) / 2);

  const getScoreColor = (s) => s >= 80 ? "#16a34a" : s >= 60 ? "#ea580c" : "#dc2626";

  const handleReveal = () => {
    setRevealed(true);
    setTimeout(() => {
      try {
        confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } });
      } catch { /* ignore */ }
    }, 350);
  };

  const handleDone = () => {
    localStorage.removeItem("reliv_challenge");
    onContinue();
  };

  // Draw 1080x1920 Instagram Story Winning Card on Canvas
  useEffect(() => {
    if (!revealed || !logoImage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dark vibrant luxury gradient
    const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
    grad.addColorStop(0, "#090d16");
    grad.addColorStop(0.35, isChallenge ? "#1e1b4b" : "#3b0764");
    grad.addColorStop(0.7, "#0f172a");
    grad.addColorStop(1, isChallenge ? "#7c2d12" : "#831843");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Glowing atmospheric accent circles
    ctx.fillStyle = isChallenge ? "rgba(249, 115, 22, 0.15)" : "rgba(236, 72, 153, 0.15)";
    ctx.beginPath();
    ctx.arc(950, 200, 420, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(59, 130, 246, 0.12)";
    ctx.beginPath();
    ctx.arc(100, 1500, 360, 0, Math.PI * 2);
    ctx.fill();

    // Top Brand Badge
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px Arial, sans-serif";
    ctx.drawImage(logoImage, 90, 330, 840, 285, 90, 65, 300, 102);

    ctx.fillStyle = isChallenge ? "#fdba74" : "#fbcfe8";
    ctx.font = "bold 30px Arial, sans-serif";
    ctx.fillText(isChallenge ? "⚔️ OFFICIAL HEALTH DUEL" : "💕 POWER COUPLE SYNC", 90, 190, 880);

    // Main Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 78px Arial, sans-serif";
    if (isChallenge) {
      ctx.fillText(tied ? "EPIC HEALTH TIE!" : "HEALTH DUEL", 90, 310, 880);
      ctx.fillStyle = "#fb923c";
      ctx.fillText(tied ? "PERFECT MATCH 🤝" : `${winner.toUpperCase()} WINS! 👑`, 90, 400, 880);
    } else {
      ctx.fillText("BETTER TOGETHER.", 90, 310, 880);
      ctx.fillStyle = "#f472b6";
      ctx.fillText(`COUPLE SCORE: ${avg}/100`, 90, 400, 880);
    }

    // Winner & Loser Head-to-Head Card
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.roundRect ? ctx.roundRect(80, 480, 920, 680, 36) : ctx.fillRect(80, 480, 920, 680);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Player A Column
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 46px Arial, sans-serif";
    ctx.fillText(nameA, 120, 560, 380, 880);
    ctx.fillStyle = isChallenge ? "#fdba74" : "#fbcfe8";
    ctx.font = "bold 26px Arial, sans-serif";
    ctx.fillText((aWins || tied) && isChallenge ? "CHAMPION 👑" : "CHALLENGER ⚡", 120, 605, 880);

    // Player B Column
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 46px Arial, sans-serif";
    ctx.fillText(nameB, 580, 560, 380, 880);
    ctx.fillStyle = isChallenge ? "#fdba74" : "#fbcfe8";
    ctx.font = "bold 26px Arial, sans-serif";
    ctx.fillText((!aWins || tied) && isChallenge ? "CHAMPION 👑" : "CHALLENGER ⚡", 580, 605, 880);

    // Metric 1: Health Score
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillRect(110, 640, 860, 90);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 28px Arial, sans-serif";
    ctx.fillText("HEALTH SCORE", 440, 695, 880);
    ctx.font = "900 44px monospace";
    ctx.fillStyle = getScoreColor(scoreA);
    ctx.fillText(`${scoreA}`, 140, 700, 880);
    ctx.fillStyle = getScoreColor(scoreB);
    ctx.fillText(`${scoreB}`, 860, 700, 880);

    // Metric 2: Metabolic Age
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.fillRect(110, 750, 860, 90);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 28px Arial, sans-serif";
    ctx.fillText("METABOLIC AGE", 430, 805, 880);
    ctx.font = "900 38px monospace";
    ctx.fillStyle = metaA <= metaB ? "#4ade80" : "#cbd5e1";
    ctx.fillText(`${metaA} yrs`, 140, 810, 880);
    ctx.fillStyle = metaB <= metaA ? "#4ade80" : "#cbd5e1";
    ctx.fillText(`${metaB} yrs`, 820, 810, 880);

    // Metric 3: Body Water %
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillRect(110, 860, 860, 90);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 28px Arial, sans-serif";
    ctx.fillText("BODY WATER %", 440, 915, 880);
    ctx.font = "900 38px monospace";
    ctx.fillStyle = waterA >= 50 ? "#38bdf8" : "#cbd5e1";
    ctx.fillText(`${waterA}%`, 140, 920, 880);
    ctx.fillStyle = waterB >= 50 ? "#38bdf8" : "#cbd5e1";
    ctx.fillText(`${waterB}%`, 850, 920, 880);

    // Metric 4: Visceral Fat Level
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.fillRect(110, 970, 860, 90);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 28px Arial, sans-serif";
    ctx.fillText("VISCERAL FAT", 440, 1025, 880);
    ctx.font = "900 38px monospace";
    ctx.fillStyle = viscA <= viscB ? "#a78bfa" : "#cbd5e1";
    ctx.fillText(`Lvl ${viscA}`, 140, 1030, 880);
    ctx.fillStyle = viscB <= viscA ? "#a78bfa" : "#cbd5e1";
    ctx.fillText(`Lvl ${viscB}`, 830, 1030, 880);

    // Loser Buys Coffee & Instagram Tag Box
    ctx.fillStyle = isChallenge ? "rgba(234, 88, 12, 0.25)" : "rgba(219, 39, 119, 0.25)";
    ctx.fillRect(80, 1220, 920, 360);
    ctx.strokeStyle = isChallenge ? "#f97316" : "#ec4899";
    ctx.lineWidth = 4;
    ctx.strokeRect(80, 1220, 920, 360);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px Arial, sans-serif";
    if (isChallenge) {
      ctx.fillText(tied ? "🤝 BOTH OF YOU POST ON STORY!" : `☕ ${loser} BUYS COFFEE!`, 120, 1300, 880);
      ctx.fillStyle = "#fed7aa";
      ctx.font = "32px Arial, sans-serif";
      ctx.fillText(`Tag @reliv_care on your Instagram Story.`, 120, 1370, 880);
      ctx.fillText(`Small steps. Better habits. Together.`, 120, 1420, 880);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Arial, sans-serif";
      ctx.fillText("Download this PNG on this device to save or share.", 120, 1510, 880);
    } else {
      ctx.fillText("💕 COUPLE HEALTH GOALS UNLOCKED!", 120, 1300, 880);
      ctx.fillStyle = "#fbcfe8";
      ctx.font = "32px Arial, sans-serif";
      ctx.fillText(`Tag @reliv_care on your Instagram Story.`, 120, 1370, 880);
      ctx.fillText(`Small steps. Better habits. Together.`, 120, 1420, 880);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Arial, sans-serif";
      ctx.fillText("Download this PNG on this device to save or share.", 120, 1510, 880);
    }

    // Footer
    ctx.fillStyle = "#94a3b8";
    ctx.font = "28px Arial, sans-serif";
    ctx.fillText("Wellbeing estimates · Not a medical diagnosis", 90, 1720, 880);
    ctx.fillStyle = isChallenge ? "#fdba74" : "#f472b6";
    ctx.font = "bold 32px Arial, sans-serif";
    ctx.fillText("#RelivHealth #HealthDuel #LoserBuysCoffee", 90, 1780, 880);

  }, [logoImage, revealed, isChallenge, nameA, nameB, scoreA, scoreB, metaA, metaB, waterA, waterB, viscA, viscB, tied, aWins, winner, loser, avg]);

  const handleDownloadStoryCard = () => {
    const canvas = canvasRef.current;
    if (!canvas || !logoImage) return;
    try {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `Reliv-${isChallenge ? "HealthDuel" : "CoupleSync"}-${winner.replace(/\s+/g, "_")}.png`;
      a.click();
    } catch {
      setExportError("Image could not be saved. Please try again.");
    }
  };

  const handleShareStory = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !logoImage) return;
    setExportError('');
    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Image could not be prepared.');
      const file = new File([blob], 'Reliv-Better-Together.png', { type:'image/png' });
      if (navigator.canShare?.({files:[file]})) await navigator.share({title:'Reliv · Better habits together',files:[file]});
      else handleDownloadStoryCard();
    } catch (error) {
      if (error.name !== 'AbortError') setExportError('Sharing is unavailable. Use Download image to save your PNG.');
    }
  };

  if (!challenge) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          overflowY: "auto"
        }}
      >
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 320 }}
          style={{
            background: "#ffffff",
            borderRadius: 28,
            padding: "32px 28px",
            maxWidth: 620,
            width: "100%",
            border: "1px solid #e2e8f0",
            boxShadow: "0 25px 70px rgba(0,0,0,0.25)",
            textAlign: "center",
            maxHeight: "92vh",
            overflowY: "auto"
          }}
        >
          <Logo size="text-2xl" className="mb-2" />
          <div style={{ fontSize: 44, marginBottom: 4 }}>{isChallenge ? "⚔️" : "💕"}</div>
          <h2 style={{ color: "#0f172a", fontSize: 26, fontWeight: 900, marginBottom: 4 }}>
            {isChallenge ? "The Health Duel Results" : "Couple Health Harmony"}
          </h2>
          <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>
            {isChallenge
              ? "Comparing Health Score, Metabolic Age, Body Water & Visceral Fat!"
              : "Here is your synchronized health comparison together!"}
          </p>

          {/* Two Player Badges */}
          <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 20 }}>
            {/* Player A */}
            <div
              style={{
                flex: 1,
                background: "#f8fafc",
                borderRadius: 20,
                padding: "20px 14px",
                border: `2px solid ${!revealed ? "#e2e8f0" : (aWins || tied) && isChallenge ? "#f97316" : "#e2e8f0"}`
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 6 }}>
                {revealed && isChallenge ? (tied ? "🤝" : aWins ? "👑" : "📸") : "🅰️"}
              </div>
              <div style={{ color: "#0f172a", fontSize: 15, fontWeight: 800, marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {nameA}
              </div>
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  color: revealed ? getScoreColor(scoreA) : "#cbd5e1",
                  fontFamily: "monospace",
                  lineHeight: 1
                }}
              >
                {revealed ? scoreA : "?"}
              </div>
              <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 4, fontWeight: 700 }}>HEALTH SCORE</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: isChallenge ? "#f97316" : "#ec4899" }}>
              {isChallenge ? "VS" : "❤️"}
            </div>

            {/* Player B */}
            <div
              style={{
                flex: 1,
                background: "#f8fafc",
                borderRadius: 20,
                padding: "20px 14px",
                border: `2px solid ${!revealed ? "#e2e8f0" : (!aWins || tied) && isChallenge ? "#f97316" : "#e2e8f0"}`
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 6 }}>
                {revealed && isChallenge ? (tied ? "🤝" : !aWins ? "👑" : "📸") : "🅱️"}
              </div>
              <div style={{ color: "#0f172a", fontSize: 15, fontWeight: 800, marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {nameB}
              </div>
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  color: revealed ? getScoreColor(scoreB) : "#cbd5e1",
                  fontFamily: "monospace",
                  lineHeight: 1
                }}
              >
                {revealed ? scoreB : "?"}
              </div>
              <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 4, fontWeight: 700 }}>HEALTH SCORE</div>
            </div>
          </div>

          {!revealed ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleReveal}
              style={{
                background: isChallenge
                  ? "linear-gradient(135deg, #f97316, #ea580c)"
                  : "linear-gradient(135deg, #ec4899, #a855f7)",
                color: "#ffffff",
                border: "none",
                borderRadius: 9999,
                padding: "16px 48px",
                fontSize: 18,
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 10px 25px rgba(249, 115, 22, 0.35)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <Sparkles size={20} />
              {isChallenge ? "REVEAL WINNER! ⚡" : "REVEAL COUPLE CARD 💕"}
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{ textAlign: "left" }}
            >
              {/* Detailed Head-to-Head Breakdown Table */}
              <div style={{ background: "#f8fafc", borderRadius: 16, border: "1px solid #e2e8f0", padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                  Head-to-Head Biomarker Duel
                </div>

                {/* Row 1: Metabolic Age */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                    <Clock size={15} className="text-amber-500" />
                    <span>Metabolic Age</span>
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>(Younger is better)</span>
                  </div>
                  <div style={{ display: "flex", gap: 24, fontSize: 13, fontWeight: 800, fontFamily: "monospace" }}>
                    <span style={{ color: metaA <= metaB ? "#16a34a" : "#64748b" }}>{metaA} yrs {metaA <= metaB ? "⚡" : ""}</span>
                    <span style={{ color: metaB <= metaA ? "#16a34a" : "#64748b" }}>{metaB} yrs {metaB <= metaA ? "⚡" : ""}</span>
                  </div>
                </div>

                {/* Row 2: Body Water % */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                    <Droplets size={15} className="text-blue-500" />
                    <span>Body Water %</span>
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>(Hydration)</span>
                  </div>
                  <div style={{ display: "flex", gap: 24, fontSize: 13, fontWeight: 800, fontFamily: "monospace" }}>
                    <span style={{ color: waterA >= 50 ? "#0284c7" : "#64748b" }}>{waterA}%</span>
                    <span style={{ color: waterB >= 50 ? "#0284c7" : "#64748b" }}>{waterB}%</span>
                  </div>
                </div>

                {/* Row 3: Visceral Fat */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                    <Flame size={15} className="text-red-500" />
                    <span>Visceral Fat</span>
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>(Organ fat)</span>
                  </div>
                  <div style={{ display: "flex", gap: 24, fontSize: 13, fontWeight: 800, fontFamily: "monospace" }}>
                    <span style={{ color: viscA <= viscB ? "#16a34a" : "#ea580c" }}>Lvl {viscA}</span>
                    <span style={{ color: viscB <= viscA ? "#16a34a" : "#ea580c" }}>Lvl {viscB}</span>
                  </div>
                </div>
              </div>

              {/* Instagram Story Penalty / Win Banner */}
              <div
                style={{
                  background: isChallenge ? "#fff7ed" : "#fdf2f8",
                  border: `1px solid ${isChallenge ? "#fed7aa" : "#fbcfe8"}`,
                  borderRadius: 18,
                  padding: "16px 20px",
                  marginBottom: 16
                }}
              >
                <div style={{ color: isChallenge ? "#ea580c" : "#db2777", fontSize: 20, fontWeight: 900, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  <Award size={22} />
                  {isChallenge ? (tied ? "🤝 It's an Epic Tie!" : `👑 ${winner} Wins!`) : `💕 Couple Health Score: ${avg}/100`}
                </div>
                <div style={{ color: "#334155", fontSize: 13, lineHeight: 1.5 }}>
                  {isChallenge ? (
                    tied ? (
                      "Both of you scored equally high! Post the card on your Instagram Story together."
                    ) : (
                      <>
                        <strong>{loser}</strong> buys coffee! ☕ Post this card on your Instagram Story and tag{" "}
                        <span style={{ color: "#ea580c", fontWeight: 800 }}>@reliv_care</span>. Small steps. Better habits. Together.
                      </>
                    )
                  ) : (
                    "Power couple energy! Post this story card to Instagram and tag @reliv_care — we'll tag both of you back! 💕"
                  )}
                </div>
                <div style={{ color: "#64748b", fontSize: 11, marginTop: 6 }}>
                  📱 <strong>No Wi-Fi needed on kiosk:</strong> Save the card image right now to your device or phone.
                </div>
              </div>

              {/* Story Card Actions */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={handleDownloadStoryCard}
                  style={{
                    background: isChallenge
                      ? "linear-gradient(135deg, #f97316, #ea580c)"
                      : "linear-gradient(135deg, #ec4899, #a855f7)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 14,
                    padding: "12px 24px",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 4px 14px rgba(249, 115, 22, 0.3)"
                  }}
                >
                  <Download size={16} />
                  Download Story Card (PNG)
                </button>

                <button
                  type="button"
                  onClick={handleShareStory}
                  style={{
                    background: "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 14,
                    padding: "12px 22px",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  <Share2 size={16} />
                  Share to Story
                </button>
              </div>

              {/* Exit Button */}
              <div style={{ textAlign: "center" }}>
                <button
                  type="button"
                  onClick={handleDone}
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: 9999,
                    padding: "10px 32px",
                    color: "#334155",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Continue to Full 120+ Report →
                </button>
              </div>
            </motion.div>
          )}

          {/* Hidden Canvas for 1080x1920 Instagram Story rendering */}
          {exportError && <p role="alert" className="text-amber-700 bg-amber-50 p-3 rounded-xl">{exportError}</p>}
              <canvas ref={canvasRef} width="1080" height="1920" style={{ display: "none" }} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

