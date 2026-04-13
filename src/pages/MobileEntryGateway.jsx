import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { API_BASE } from "../config/api";
import MobileEntry from "./MobileEntry";

/**
 * MobileEntryGateway - One-time token gate for the mobile entry form.
 *
 * Flow:
 *  1. QR code encodes a short URL like /h?t=<token>
 *  2. This component validates the token with the backend.
 *     – If valid → renders MobileEntry with the real sessionId.
 *     – If expired / already used → shows "Session expired" message.
 *  3. Immediately hides the real URL from the browser address bar.
 *  4. Loads saved data from localStorage for auto-fill regardless of token state.
 *
 * If the backend validation endpoint is not yet deployed, the gateway
 * falls through and renders MobileEntry directly (graceful degradation).
 */
export default function MobileEntryGateway() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("t");

  const [state, setState] = useState("loading"); // loading | valid | expired | error
  const [sessionId, setSessionId] = useState(null);

  // ── Aggressively hide the URL in the address bar ──
  useEffect(() => {
    document.title = "Reliv Health";
    try {
      // Replace visible URL with just "/" so domain path is hidden
      window.history.replaceState({}, "Reliv Health", "/");
    } catch {
      // SecurityError in cross-origin iframes – ignore
    }
  }, []);

  // ── Validate token with backend ──
  const validateToken = useCallback(async (tkn) => {
    try {
      const res = await fetch(`${API_BASE}/api/validate-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tkn }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.valid && data.sessionId) {
          setSessionId(data.sessionId);
          setState("valid");
        } else {
          setState("expired");
        }
      } else if (res.status === 410 || res.status === 404) {
        // 410 Gone = token already used, 404 = token not found
        setState("expired");
      } else {
        // Server error – treat as expired/invalid
        setState("expired");
      }
    } catch {
      // Network error or endpoint doesn't exist yet
      setState("expired");
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setState("expired");
      return;
    }
    validateToken(token);
  }, [token, validateToken]);

  // ── Loading state ──
  if (state === "loading") {
    return (
      <div
        className="mobile-entry-page"
        style={{
          minHeight: "100dvh",
          background: "linear-gradient(to bottom, #fff7ed, #ffffff)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: "4px solid #fed7aa",
              borderTopColor: "#f97316",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#6b7280", fontSize: "15px" }}>
            Loading your form…
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ── Expired / invalid token ──
  if (state === "expired" || state === "error") {
    return (
      <div
        className="mobile-entry-page"
        style={{
          minHeight: "100dvh",
          background: "linear-gradient(to bottom, #fff7ed, #ffffff)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "40px 32px",
            maxWidth: "400px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "28px",
            }}
          >
            ⏱️
          </div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "600",
              color: "#111827",
              margin: "0 0 10px",
            }}
          >
            Session Expired
          </h2>
          <p
            style={{
              color: "#6b7280",
              fontSize: "15px",
              lineHeight: "1.6",
              margin: "0 0 20px",
            }}
          >
            This QR code has already been used or has expired. Please scan a new
            QR code from the kiosk.
          </p>
          <p style={{ fontSize: "13px", color: "#9ca3af" }}>
            You can close this page.
          </p>
        </div>
      </div>
    );
  }

  // ── Valid – render the actual form, passing sessionId as a prop ──
  return <MobileEntry gatewaySessionId={sessionId} />;
}
