// src/components/HealthCard.jsx
// Premium Instagram-story-sized health card (1080×1920 ratio)
import React, { forwardRef } from "react";

const HealthCard = forwardRef(function HealthCard(
  { name, score, metabolicAge, age, gender, date },
  ref
) {
  const firstName = name ? name.split(" ")[0] : "Champion";
  const yearsYounger = metabolicAge && age ? Math.max(0, age - metabolicAge) : 0;
  const scoreLabel =
    score >= 90
      ? "Elite"
      : score >= 75
      ? "Strong"
      : score >= 60
      ? "Solid"
      : score >= 45
      ? "Building"
      : "Rising";
  const isMale = gender?.toLowerCase() === "male";

  // Circumference for the score ring (radius 90, so C = 2πr ≈ 565.49)
  const C = 2 * Math.PI * 90;
  const offset = C * (1 - (score ?? 0) / 100);

  return (
    <div
      ref={ref}
      style={{
        width: 540,
        height: 960,
        background: "linear-gradient(165deg, #0a0a0a 0%, #1a1a2e 40%, #16213e 70%, #0f3460 100%)",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Subtle grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Glow orbs */}
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -40,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: -60,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top bar accent */}
      <div
        style={{
          width: "100%",
          height: 4,
          background: "linear-gradient(90deg, transparent, #F97316, #fb923c, #F97316, transparent)",
        }}
      />

      {/* Logo */}
      <div style={{ marginTop: 48, textAlign: "center" }}>
        <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.02em" }}>
          <span style={{ color: "#F97316" }}>Re</span>
          <span style={{ color: "#ffffff" }}>l</span>
          <span style={{ color: "#ffffff", position: "relative", display: "inline-block" }}>
            ı
            <span
              style={{
                position: "absolute",
                left: "50%",
                top: "0.08em",
                transform: "translateX(-50%)",
                width: "0.22em",
                height: "0.22em",
                backgroundColor: "#F97316",
                borderRadius: "50%",
              }}
            />
          </span>
          <span style={{ color: "#ffffff" }}>v</span>
        </div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            marginTop: 6,
          }}
        >
          Health Card
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 60,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.6), transparent)",
          marginTop: 28,
          marginBottom: 36,
        }}
      />

      {/* Score ring */}
      <div style={{ position: "relative", width: 210, height: 210, marginBottom: 8 }}>
        {/* Outer glow */}
        <div
          style={{
            position: "absolute",
            inset: -12,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249,115,22,0.12) 40%, transparent 70%)",
          }}
        />
        <svg width="210" height="210" viewBox="0 0 210 210" style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle
            cx="105"
            cy="105"
            r="90"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="10"
          />
          {/* Score arc */}
          {score != null && (
            <circle
              cx="105"
              cy="105"
              r="90"
              fill="none"
              stroke="url(#scoreGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
            />
          )}
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="50%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center text */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            {score ?? "—"}
          </span>
          <span
            style={{
              fontSize: 13,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
              marginTop: 4,
            }}
          >
            out of 100
          </span>
        </div>
      </div>

      {/* Score label badge */}
      <div
        style={{
          marginTop: 12,
          padding: "6px 24px",
          borderRadius: 9999,
          background: "rgba(249,115,22,0.12)",
          border: "1px solid rgba(249,115,22,0.25)",
          color: "#fb923c",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        {scoreLabel}
      </div>

      {/* Metabolic age */}
      {metabolicAge != null && (
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Metabolic Age
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, color: "#ffffff", marginTop: 4 }}>
            {metabolicAge}
            <span style={{ fontSize: 16, fontWeight: 400, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>
              yrs
            </span>
          </div>
          {yearsYounger > 0 && (
            <div style={{ fontSize: 14, color: "#4ade80", fontWeight: 600, marginTop: 4 }}>
              {yearsYounger} year{yearsYounger > 1 ? "s" : ""} younger than real age
            </div>
          )}
        </div>
      )}

      {/* Name + Date card */}
      <div
        style={{
          marginTop: "auto",
          marginBottom: 0,
          width: "calc(100% - 64px)",
          padding: "20px 24px",
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(8px)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.06)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", letterSpacing: "0.01em" }}>
          {firstName}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
          {date || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>

      {/* CTA footer */}
      <div
        style={{
          width: "100%",
          textAlign: "center",
          paddingTop: 20,
          paddingBottom: 28,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
          Check yours at{" "}
          <span style={{ color: "#F97316", fontWeight: 700 }}>Reliv</span>{" "}
          Kiosk
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          #RelivHealthCard
        </div>
      </div>

      {/* Bottom accent bar */}
      <div
        style={{
          width: "100%",
          height: 3,
          background: "linear-gradient(90deg, transparent, #F97316, #fb923c, #F97316, transparent)",
        }}
      />
    </div>
  );
});

export default HealthCard;
