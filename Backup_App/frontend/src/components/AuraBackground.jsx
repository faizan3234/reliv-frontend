import React from "react";
import { motion } from "framer-motion";
import "./AuraBackground.css";

export default function AuraBackground({ children }) {
  return (
    <div className="premium-root">
      {/* AMBIENT BACKGROUND GLOWS - The "Secret Sauce" */}
      <div className="ambient-glow ambient-glow-top" />
      <div className="ambient-glow ambient-glow-bottom" />
      <div className="ambient-glow ambient-glow-center" />
      
      {/* ORIGINAL FLOWING SILK RIBBONS - Gentle back-forth sway */}
      <div className="golden-wave-container">
        {/* Silk Ribbon 1 - Top */}
        <motion.div
          className="silk-ribbon silk-ribbon-1"
          animate={{
            x: ["-40%", "40%", "-40%"],
          }}
          transition={{
            repeat: Infinity,
            duration: 20,
            ease: "easeInOut",
          }}
        />
        {/* Silk Ribbon 2 - Middle */}
        <motion.div
          className="silk-ribbon silk-ribbon-2"
          animate={{
            x: ["40%", "-40%", "40%"],
          }}
          transition={{
            repeat: Infinity,
            duration: 25,
            ease: "easeInOut",
          }}
        />
        {/* Silk Ribbon 3 - Lower */}
        <motion.div
          className="silk-ribbon silk-ribbon-3"
          animate={{
            x: ["-30%", "30%", "-30%"],
          }}
          transition={{
            repeat: Infinity,
            duration: 22,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* SVG LIQUID GOLDEN WAVES - Like Splash Screen (SLOW & NATURAL) */}
      <div className="svg-wave-container">
        {/* Wave 1 - Top flowing wave */}
        <motion.div
          className="svg-wave svg-wave-1"
          animate={{
            x: ["-100%", "100%"],
            y: ["0%", "8%", "0%", "-8%", "0%"],
          }}
          transition={{
            x: { repeat: Infinity, duration: 25, ease: "easeInOut" },
            y: { repeat: Infinity, duration: 10, ease: "easeInOut" },
          }}
        >
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="wave-svg">
            <defs>
              <linearGradient id="goldGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,184,0,0)" />
                <stop offset="20%" stopColor="rgba(255,200,100,0.3)" />
                <stop offset="40%" stopColor="rgba(255,255,255,0.7)" />
                <stop offset="50%" stopColor="rgba(255,184,0,0.5)" />
                <stop offset="60%" stopColor="rgba(255,255,255,0.7)" />
                <stop offset="80%" stopColor="rgba(255,200,100,0.3)" />
                <stop offset="100%" stopColor="rgba(255,184,0,0)" />
              </linearGradient>
            </defs>
            <path
              fill="url(#goldGradient1)"
              d="M0,160 C200,100 400,220 720,160 C1040,100 1240,220 1440,160 L1440,320 L0,320 Z"
            />
          </svg>
        </motion.div>

        {/* Wave 2 - Middle flowing wave (strongest) */}
        <motion.div
          className="svg-wave svg-wave-2"
          animate={{
            x: ["-100%", "100%"],
            y: ["0%", "-10%", "0%", "10%", "0%"],
          }}
          transition={{
            x: { repeat: Infinity, duration: 22, ease: "easeInOut" },
            y: { repeat: Infinity, duration: 8, ease: "easeInOut" },
          }}
        >
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="wave-svg">
            <defs>
              <linearGradient id="goldGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,184,0,0)" />
                <stop offset="15%" stopColor="rgba(255,210,130,0.4)" />
                <stop offset="35%" stopColor="rgba(255,255,255,0.85)" />
                <stop offset="50%" stopColor="rgba(255,184,0,0.6)" />
                <stop offset="65%" stopColor="rgba(255,255,255,0.85)" />
                <stop offset="85%" stopColor="rgba(255,210,130,0.4)" />
                <stop offset="100%" stopColor="rgba(255,184,0,0)" />
              </linearGradient>
            </defs>
            <path
              fill="url(#goldGradient2)"
              d="M0,224 C200,160 500,320 720,288 C940,256 1200,96 1440,128 L1440,320 L0,320 Z"
            />
          </svg>
        </motion.div>

        {/* Wave 3 - Lower flowing wave */}
        <motion.div
          className="svg-wave svg-wave-3"
          animate={{
            x: ["-100%", "100%"],
            y: ["0%", "6%", "0%", "-6%", "0%"],
          }}
          transition={{
            x: { repeat: Infinity, duration: 28, ease: "easeInOut" },
            y: { repeat: Infinity, duration: 12, ease: "easeInOut" },
          }}
        >
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="wave-svg">
            <defs>
              <linearGradient id="goldGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,184,0,0)" />
                <stop offset="25%" stopColor="rgba(255,220,150,0.35)" />
                <stop offset="45%" stopColor="rgba(255,255,255,0.6)" />
                <stop offset="50%" stopColor="rgba(255,184,0,0.45)" />
                <stop offset="55%" stopColor="rgba(255,255,255,0.6)" />
                <stop offset="75%" stopColor="rgba(255,220,150,0.35)" />
                <stop offset="100%" stopColor="rgba(255,184,0,0)" />
              </linearGradient>
            </defs>
            <path
              fill="url(#goldGradient3)"
              d="M0,96 C150,160 350,32 600,96 C850,160 1100,32 1440,96 L1440,320 L0,320 Z"
            />
          </svg>
        </motion.div>
      </div>

      {/* Secondary golden glow layer */}
      <div className="golden-halo" />

      {/* Content */}
      <div className="premium-content">{children}</div>
    </div>
  );
}
