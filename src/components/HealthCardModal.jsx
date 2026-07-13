// src/components/HealthCardModal.jsx
// Full-screen modal that renders the HealthCard, captures it with html2canvas,
// and shows a QR code for the user to scan & download on phone.
import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import html2canvas from "html2canvas";
import { QRCodeSVG } from "qrcode.react";
import HealthCard from "./HealthCard";
import { API_BASE } from "../config/api";

export default function HealthCardModal({ open, onClose, patient, score, metabolicAge }) {
  const cardRef = useRef(null);
  const [cardImage, setCardImage] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const firstName = patient?.name ? patient.name.split(" ")[0] : "Champion";
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  // Capture card to image once visible
  const captureCard = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      // Small delay to let fonts/layout settle
      await new Promise((r) => setTimeout(r, 300));
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: null,
        width: 540,
        height: 960,
      });
      setCardImage(canvas.toDataURL("image/png"));
    } catch {
      // Fallback — show the live card instead
      setCardImage(null);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setCardImage(null);
      setSent(false);
      setError(null);
      captureCard();
    }
  }, [open, captureCard]);

  // Send card to user's email
  const handleEmailCard = async () => {
    if (!patient?.email || !cardImage) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/send-health-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: patient.email,
          name: patient.name,
          cardImage,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSent(true);
    } catch {
      // Fallback: still show QR
      setError("Couldn't email — scan the QR below instead!");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  // Build a mailto/share URL for the QR code (user scans → opens their email with the card attached isn't possible,
  // so we encode a simple link to the kiosk info page or a dynamic share endpoint)
  const shareUrl = patient?.email
    ? `${API_BASE}/api/health-card/${encodeURIComponent(patient.email)}?t=${Date.now()}`
    : "https://reliv.in";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              display: "flex",
              gap: 32,
              alignItems: "center",
              maxHeight: "95vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card preview */}
            <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 25px 80px rgba(0,0,0,0.5)" }}>
              {cardImage ? (
                <img
                  src={cardImage}
                  alt="Your Reliv Health Card"
                  style={{ width: 360, height: 640, objectFit: "cover" }}
                />
              ) : (
                <div style={{ transform: "scale(0.667)", transformOrigin: "top left", width: 540, height: 960 }}>
                  <HealthCard
                    ref={cardRef}
                    name={patient?.name}
                    score={score}
                    metabolicAge={metabolicAge}
                    age={patient?.age}
                    gender={patient?.gender}
                    date={dateStr}
                  />
                </div>
              )}
            </div>

            {/* Right panel — actions */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
                minWidth: 260,
              }}
            >
              <h2
                style={{
                  color: "#ffffff",
                  fontSize: 26,
                  fontWeight: 800,
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                Your Health Card
                <br />
                is ready, {firstName}!
              </h2>

              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textAlign: "center", maxWidth: 240 }}>
                Scan the QR with your phone to save & share on Instagram or WhatsApp
              </p>

              {/* QR */}
              <div
                style={{
                  background: "#ffffff",
                  padding: 16,
                  borderRadius: 16,
                }}
              >
                <QRCodeSVG value={shareUrl} size={160} level="M" />
              </div>

              {/* Email button */}
              {patient?.email && (
                <button
                  onClick={handleEmailCard}
                  disabled={sending || sent}
                  style={{
                    background: sent
                      ? "#22c55e"
                      : "linear-gradient(135deg, #F97316, #fb923c)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 9999,
                    padding: "14px 32px",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: sending || sent ? "default" : "pointer",
                    opacity: sending ? 0.7 : 1,
                    minWidth: 220,
                    textAlign: "center",
                  }}
                >
                  {sent ? "✓ Sent to your email!" : sending ? "Sending..." : "📧 Email me this card"}
                </button>
              )}

              {error && (
                <p style={{ color: "#fbbf24", fontSize: 13, textAlign: "center" }}>{error}</p>
              )}

              {/* Skip */}
              <button
                onClick={onClose}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 12,
                  padding: "10px 24px",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Skip →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
