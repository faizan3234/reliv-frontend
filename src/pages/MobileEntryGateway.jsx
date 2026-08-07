import React, { useEffect, useState, useCallback } from "react";
import { API_BASE } from "../config/api";
import MobileEntry from "./MobileEntry";

/**
 * MobileEntryGateway - One-time opaque-path gate for the mobile entry form.
 *
 * Flow:
 *  1. QR code encodes an opaque path like /A82HF91K.
 *  2. This component resolves and validates its server-side token.
 *     – If valid → renders MobileEntry with the real sessionId.
 *     – If expired / already used → shows "Session expired" message.
 *  3. Loads saved data from localStorage for auto-fill regardless of token state.
 */
export default function MobileEntryGateway() {
  const path = window.location.pathname.substring(1);

  const [state, setState] = useState("loading"); // loading | valid | expired | error
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    document.title = "Reliv Health";
  }, []);

  // ── Resolve the opaque path, then validate its one-time token ──
  const resolveAndValidatePath = useCallback(async (qrPath) => {
    try {
      const resolveResponse = await fetch(`${API_BASE}/api/resolve-path`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: qrPath }),
      });

      if (!resolveResponse.ok) {
        setState("expired");
        return;
      }

      const { token } = await resolveResponse.json();
      const res = await fetch(`${API_BASE}/api/validate-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
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
    if (!path) {
      setState("expired");
      return;
    }
    resolveAndValidatePath(path);
  }, [path, resolveAndValidatePath]);

  // ── Loading state ──
  if (state === "loading") {
    return (
      <div
        className="mobile-entry-page"
        style={{
          minHeight: "100dvh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
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
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
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
            QR Code Expired
          </h2>
          <p
            style={{
              color: "#6b7280",
              fontSize: "15px",
              lineHeight: "1.6",
              margin: "0 0 20px",
            }}
          >
            Please generate a new QR code from the kiosk.
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
