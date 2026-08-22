// src/pages/PaymentGate.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import Logo from "../components/Logo";
import TopEllipseBackground from "../components/TopEllipseBackground";
import { useHealth } from "../context/HealthContext";
import { usePageSpeech } from "../context/SpeechContext";
import { API_BASE } from "../config/api";
import { CheckCircle2, AlertCircle, RefreshCw, Lock, ArrowLeft, ShieldAlert, Clock, Home } from "lucide-react";

const INACTIVITY_TIMEOUT = 120000; // 2 minutes inactivity timeout

export default function PaymentGate() {
  usePageSpeech("payment");
  const navigate = useNavigate();
  const location = useLocation();
  const { data: healthData, update: updateHealth } = useHealth();

  const { cart = [], fromPaymentGate = false } = location.state || {};
  const hasKits = cart.length > 0;
  const needsReport = fromPaymentGate || !hasKits;
  const serviceType = hasKits ? "MEDICINE" : "HEALTH_CHECKUP";

  // Resolve authoritative sessionId strictly from context or storage (NEVER fallback to "current" or "default")
  const rawSessionId =
    location.state?.sessionId ||
    healthData?.sessionId ||
    healthData?.patient?.sessionId ||
    localStorage.getItem("reliv_session_id") ||
    sessionStorage.getItem("reliv_session_id") ||
    "";

  const activeSessionId = typeof rawSessionId === "string" ? rawSessionId.trim() : "";

  const isValidSession = Boolean(
    activeSessionId &&
    activeSessionId.length > 0 &&
    activeSessionId !== "current" &&
    activeSessionId !== "default" &&
    activeSessionId !== "RELIV-001"
  );

  // Component UI state: 'PREPARING' | 'QR_READY' | 'VERIFYING' | 'WRONG_CODE' | 'LOCKED' | 'EXPIRED' | 'SUCCESS' | 'ERROR' | 'SESSION_INVALID'
  const [uiState, setUiState] = useState("PREPARING");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [authoritativeAmount, setAuthoritativeAmount] = useState(null);
  const [requestId, setRequestId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [codeDigits, setCodeDigits] = useState(["", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(300);

  const isRequestingRef = useRef(false);
  const expiryTimerRef = useRef(null);
  const inactivityTimerRef = useRef(null);

  // ── 1. Inactivity Timer ──────────────────────────────────────────────────
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      window.location.href = "/";
    }, INACTIVITY_TIMEOUT);
  }, []);

  useEffect(() => {
    const events = ["click", "touchstart", "keydown"];
    const handleActivity = () => resetInactivityTimer();

    events.forEach((ev) => window.addEventListener(ev, handleActivity));
    resetInactivityTimer();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [resetInactivityTimer]);

  // ── 2. Create Fresh Payment Request on Local Pi ───────────────────────────
  const createNewPaymentRequest = useCallback(async () => {
    if (!isValidSession) {
      setErrorMessage("Payment session unavailable. Please restart this session.");
      setUiState("SESSION_INVALID");
      return;
    }

    if (isRequestingRef.current) return;
    isRequestingRef.current = true;

    setUiState("PREPARING");
    setErrorMessage("");
    setCodeDigits(["", "", "", ""]);

    try {
      // Normalize cart items using cartQuantity (selected purchase quantity).
      // ZERO fallback to inventory stock quantity (item.quantity).
      const formattedCart = cart.map((item) => {
        const purchaseQty = Number(
          item.cartQuantity ??
          item.quantityRequested ??
          item.selectedQuantity ??
          1
        );
        return {
          kit_id: item.kit_id || item._id || item.id,
          name: item.name,
          quantity: Number.isInteger(purchaseQty) && purchaseQty > 0 ? purchaseQty : 1,
        };
      });

      const reqRes = await fetch(`${API_BASE}/api/sessions/${encodeURIComponent(activeSessionId)}/payment-v2/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType,
          cart: formattedCart,
        }),
      });

      if (!reqRes.ok) {
        const errData = await reqRes.json().catch(() => ({}));
        throw new Error(errData.message || `Payment request failed (HTTP ${reqRes.status})`);
      }

      const reqData = await reqRes.json();
      if (!reqData.ok || !reqData.paymentUrl) {
        throw new Error(reqData.message || "Invalid payment request response from kiosk backend");
      }

      // Backend must return a valid authoritative amount in paise
      const rawPaise = Number(reqData.amount);
      if (!Number.isInteger(rawPaise) || rawPaise <= 0) {
        throw new Error("Unable to load the payment amount. Please restart payment.");
      }
      const displayRupees = rawPaise / 100;
      setAuthoritativeAmount(displayRupees);

      setRequestId(reqData.requestId);
      setPaymentUrl(reqData.paymentUrl);

      const expiresAt = Number(reqData.expiresAt) || (Date.now() + 300000);
      const remainingSeconds = Math.max(10, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(remainingSeconds);
      setAttemptsRemaining(5);

      setUiState("QR_READY");
    } catch (err) {
      console.error("[KioskPaymentV2] Failed to create payment request:", err);
      setErrorMessage(err.message || "Payment service unavailable. Please try again.");
      setUiState("ERROR");
    } finally {
      isRequestingRef.current = false;
    }
  }, [isValidSession, activeSessionId, serviceType, cart]);

  // ── 3. Initialize / Restore Payment State using Pi Status Endpoint ───────
  const initPaymentFlow = useCallback(async () => {
    if (!isValidSession) {
      setErrorMessage("Payment session unavailable. Please restart this session.");
      setUiState("SESSION_INVALID");
      return;
    }

    if (isRequestingRef.current) return;
    isRequestingRef.current = true;

    setUiState("PREPARING");
    setErrorMessage("");

    try {
      // Query local Pi payment status first
      let statusData = null;
      try {
        const statusRes = await fetch(`${API_BASE}/api/sessions/${encodeURIComponent(activeSessionId)}/payment-v2/status`);
        if (statusRes.ok) {
          statusData = await statusRes.json();
        }
      } catch (statusErr) {
        console.warn("[KioskPaymentV2] Could not check initial status:", statusErr.message);
      }

      // Check 1: If Pi backend already verified payment for this session
      if (statusData && (statusData.paymentVerified || statusData.status === "VERIFIED")) {
        setUiState("SUCCESS");
        updateHealth({ paymentVerified: true });
        setTimeout(() => {
          if (needsReport && !hasKits) {
            navigate("/report-1", { replace: true });
          } else if (hasKits) {
            navigate("/order-success", { replace: true, state: { cart } });
          } else {
            navigate("/order-success", { replace: true });
          }
        }, 1200);
        return;
      }

      // Check 2: If active request exists and is not expired
      const now = Date.now();
      if (
        statusData &&
        statusData.status === "ACTIVE" &&
        statusData.paymentUrl &&
        statusData.expiresAt > now
      ) {
        // Backend must return a valid authoritative amount in paise
        const rawPaise = Number(statusData.amount);
        if (!Number.isInteger(rawPaise) || rawPaise <= 0) {
          throw new Error("Unable to load the payment amount. Please restart payment.");
        }
        const displayRupees = rawPaise / 100;
        setAuthoritativeAmount(displayRupees);

        setRequestId(statusData.requestId);
        setPaymentUrl(statusData.paymentUrl);

        const remainingSeconds = Math.max(10, Math.floor((statusData.expiresAt - now) / 1000));
        setTimeLeft(remainingSeconds);
        if (typeof statusData.attemptsRemaining === "number") {
          setAttemptsRemaining(statusData.attemptsRemaining);
        }
        setUiState("QR_READY");
        return;
      }

      // Check 3: If locked on Pi
      if (statusData && statusData.status === "LOCKED") {
        setUiState("LOCKED");
        return;
      }

      // Check 4: If expired on Pi
      if (statusData && (statusData.status === "EXPIRED" || (statusData.expiresAt && statusData.expiresAt <= now))) {
        setUiState("EXPIRED");
        return;
      }

      // Otherwise, request a new payment package from local Pi backend
      isRequestingRef.current = false;
      await createNewPaymentRequest();
    } catch (err) {
      console.error("[KioskPaymentV2] Payment flow initialization error:", err);
      setErrorMessage(err.message || "Payment service unavailable. Please try again.");
      setUiState("ERROR");
    } finally {
      isRequestingRef.current = false;
    }
  }, [isValidSession, activeSessionId, needsReport, hasKits, navigate, updateHealth, createNewPaymentRequest]);

  // Initial load: Query status then restore or create
  useEffect(() => {
    initPaymentFlow();
  }, [initPaymentFlow]);

  // ── 4. Expiry Countdown Timer ────────────────────────────────────────────
  useEffect(() => {
    if (uiState !== "QR_READY" && uiState !== "WRONG_CODE" && uiState !== "VERIFYING") {
      if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
      return;
    }

    expiryTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(expiryTimerRef.current);
          setUiState("EXPIRED");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
    };
  }, [uiState]);

  // ── 5. Verify 4-Digit Confirmation Code with Pi ──────────────────────────
  const handleConfirmCode = useCallback(async (codeToVerify) => {
    if (!isValidSession) {
      setErrorMessage("Payment session unavailable. Please restart this session.");
      setUiState("SESSION_INVALID");
      return;
    }

    const code = codeToVerify || codeDigits.join("");
    if (code.length !== 4) return;

    setUiState("VERIFYING");
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/sessions/${encodeURIComponent(activeSessionId)}/payment-v2/confirm-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          code,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 423 || data.code === "LOCKED") {
        setUiState("LOCKED");
        return;
      }

      if (data.code === "EXPIRED" || res.status === 410) {
        setUiState("EXPIRED");
        return;
      }

      if (!res.ok || !data.ok) {
        // Wrong code: Decrement attempts and let customer re-type and verify explicitly
        const remaining = typeof data.attemptsRemaining === "number" ? data.attemptsRemaining : attemptsRemaining - 1;
        setAttemptsRemaining(Math.max(0, remaining));
        setCodeDigits(["", "", "", ""]);
        setErrorMessage(data.message || "Incorrect confirmation code. Please check your phone.");
        setUiState("WRONG_CODE");
        return;
      }

      // Authoritative verification success from local Pi!
      setUiState("SUCCESS");
      updateHealth({ paymentVerified: true });

      // Navigate after brief confirmation message
      setTimeout(() => {
        if (needsReport && !hasKits) {
          navigate("/report-1", { replace: true });
        } else if (hasKits) {
          navigate("/order-success", { replace: true, state: { cart } });
        } else {
          navigate("/order-success", { replace: true });
        }
      }, 1800);
    } catch (err) {
      console.error("[KioskPaymentV2] Code verification error:", err);
      setErrorMessage("Could not verify code with kiosk system. Please try again.");
      setUiState("WRONG_CODE");
    }
  }, [isValidSession, activeSessionId, codeDigits, requestId, attemptsRemaining, needsReport, hasKits, navigate, updateHealth]);

  // ── 6. On-Screen Touch Keypad Handlers (NO AUTO-SUBMIT) ───────────────────
  const handleKeypadPress = useCallback((key) => {
    resetInactivityTimer();
    if (uiState === "VERIFYING" || uiState === "SUCCESS" || uiState === "LOCKED" || uiState === "SESSION_INVALID") return;

    if (key === "CLEAR") {
      setCodeDigits(["", "", "", ""]);
      if (uiState === "WRONG_CODE") setUiState("QR_READY");
      return;
    }

    if (key === "BACKSPACE") {
      setCodeDigits((prev) => {
        const next = [...prev];
        for (let i = 3; i >= 0; i--) {
          if (next[i] !== "") {
            next[i] = "";
            break;
          }
        }
        return next;
      });
      if (uiState === "WRONG_CODE") setUiState("QR_READY");
      return;
    }

    // Append digit (0-9) - preserves leading zero, e.g. 0042. Does NOT auto-submit.
    setCodeDigits((prev) => {
      const next = [...prev];
      const emptyIndex = next.findIndex((d) => d === "");
      if (emptyIndex !== -1) {
        next[emptyIndex] = String(key);
        if (uiState === "WRONG_CODE") setUiState("QR_READY");
      }
      return next;
    });
  }, [uiState, resetInactivityTimer]);

  // ── 7. Physical Keyboard Support (Dev & Accessibility) ────────────────────
  const isCodeComplete = codeDigits.every((d) => d !== "");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (uiState === "VERIFYING" || uiState === "SUCCESS" || uiState === "LOCKED" || uiState === "SESSION_INVALID") return;

      if (e.key >= "0" && e.key <= "9") {
        handleKeypadPress(parseInt(e.key, 10));
      } else if (e.key === "Backspace") {
        handleKeypadPress("BACKSPACE");
      } else if (e.key === "Escape" || e.key === "Delete") {
        handleKeypadPress("CLEAR");
      } else if (e.key === "Enter" && isCodeComplete && uiState !== "VERIFYING") {
        handleConfirmCode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [uiState, isCodeComplete, handleKeypadPress, handleConfirmCode]);

  // Format time mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Format rupees display without losing paise precision
  const formatRupees = (amount) => {
    if (typeof amount !== "number" || isNaN(amount)) return "";
    return Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col items-center justify-between px-4 py-2 font-sans select-none overflow-x-hidden">
      <TopEllipseBackground height="25%" color="#FFF4EC" />

      {/* Top Header */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-between pt-1">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/90 border border-orange-200 text-slate-700 font-semibold text-xs shadow-sm active:scale-95 transition-transform"
        >
          <ArrowLeft size={16} className="text-orange-500" />
          <span>Back</span>
        </button>

        <Logo size="text-xl" />

        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
          <Lock size={12} className="text-emerald-600" />
          <span>Offline Secure</span>
        </div>
      </div>

      {/* Main Content Area (Compact, fits seamlessly in 720x1280 portrait kiosk) */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-center flex-grow py-1">

        {/* PREPARING PAYMENT STATE */}
        {uiState === "PREPARING" && (
          <div className="bg-white rounded-3xl p-8 border border-orange-100 shadow-xl text-center space-y-4 w-full max-w-sm animate-fadeIn">
            <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-slate-800">Preparing Secure Payment...</h2>
            <p className="text-xs text-slate-500">Connecting with kiosk payment engine</p>
          </div>
        )}

        {/* SESSION_INVALID STATE */}
        {uiState === "SESSION_INVALID" && (
          <div className="bg-white rounded-3xl p-6 border border-red-200 shadow-xl text-center space-y-4 w-full max-w-sm animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto border border-red-200">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Payment Session Unavailable</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {errorMessage || "Payment session unavailable. Please restart this session."}
            </p>
            <button
              onClick={() => { window.location.href = "/"; }}
              className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Home size={18} />
              <span>Start New Session</span>
            </button>
          </div>
        )}

        {/* ERROR STATE */}
        {uiState === "ERROR" && (
          <div className="bg-white rounded-3xl p-6 border border-red-200 shadow-xl text-center space-y-4 w-full max-w-sm animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto border border-red-200">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Payment Service Unavailable</h2>
            <p className="text-xs text-slate-600">{errorMessage || "Unable to initiate payment on the kiosk."}</p>
            <button
              onClick={createNewPaymentRequest}
              className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* LOCKED STATE */}
        {uiState === "LOCKED" && (
          <div className="bg-white rounded-3xl p-6 border border-red-300 shadow-xl text-center space-y-4 w-full max-w-sm animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto border border-red-300">
              <ShieldAlert size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Payment Locked</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Too many incorrect code attempts. For your security, this payment session has been locked.
            </p>
            <button
              onClick={createNewPaymentRequest}
              className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base shadow-md active:scale-98 transition-all"
            >
              Restart Payment Process
            </button>
          </div>
        )}

        {/* EXPIRED STATE */}
        {uiState === "EXPIRED" && (
          <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-xl text-center space-y-4 w-full max-w-sm animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <Clock size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Payment QR Expired</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              The 5-minute payment window has expired. Please generate a new QR code to continue.
            </p>
            <button
              onClick={createNewPaymentRequest}
              className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              <span>Generate New QR</span>
            </button>
          </div>
        )}

        {/* SUCCESS STATE */}
        {uiState === "SUCCESS" && (
          <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-2xl text-center space-y-4 w-full max-w-sm animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300">
              <CheckCircle2 size={40} className="stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Payment Verified!</h2>
            <p className="text-sm text-slate-600">Starting your health service now...</p>
            <div className="w-7 h-7 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          </div>
        )}

        {/* ACTIVE PAYMENT VIEW: QR + CONFIRMATION CODE KEYPAD */}
        {(uiState === "QR_READY" || uiState === "VERIFYING" || uiState === "WRONG_CODE") && (
          <div className="w-full max-w-sm flex flex-col items-center gap-2.5">

            {/* Top Title & Price Pill */}
            <div className="flex items-center justify-between w-full px-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Scan &amp; Pay</h1>
              {authoritativeAmount !== null && (
                <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-orange-500 text-white font-extrabold text-lg shadow-sm">
                  <span>₹{formatRupees(authoritativeAmount)}</span>
                </div>
              )}
            </div>

            {/* Sharp, Crisp High-Scannability QR Card (240px QR with 4-module quiet zone) */}
            <div className="relative p-2.5 rounded-2xl bg-white border border-orange-200/80 shadow-md flex flex-col items-center w-full">
              {paymentUrl ? (
                <div className="bg-white p-2 rounded-xl shadow-inner border border-slate-100 flex items-center justify-center">
                  <QRCodeSVG
                    value={paymentUrl}
                    size={240}
                    level="L"
                    marginSize={4}
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                    shapeRendering="crispEdges"
                    className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] block"
                  />
                </div>
              ) : (
                <div className="w-[200px] h-[200px] bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}

              {/* Subtitle & Live Countdown Badge */}
              <div className="mt-1.5 flex items-center justify-between w-full px-1 text-[11px]">
                <span className="font-semibold text-slate-500">Scan with phone camera</span>
                <div className="flex items-center gap-1 font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  <Clock size={11} className="text-orange-500 animate-pulse" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>

            {/* 4-Digit Code Entry & Integrated Keypad Card */}
            <div className="w-full bg-white rounded-2xl p-3 sm:p-3.5 border border-orange-100 shadow-md flex flex-col items-center space-y-2">
              <div className="text-center">
                <p className="text-xs font-bold text-slate-800">
                  Enter 4-digit code shown on your phone:
                </p>
                {uiState === "WRONG_CODE" && (
                  <p className="text-[11px] font-bold text-red-600 animate-shake mt-0.5">
                    {errorMessage || "Incorrect code."} ({attemptsRemaining} attempts left)
                  </p>
                )}
              </div>

              {/* 4 Digit Display Boxes */}
              <div className="flex justify-center items-center gap-2.5 py-0.5">
                {codeDigits.map((digit, idx) => {
                  const isCurrent = codeDigits.findIndex((d) => d === "") === idx;
                  return (
                    <div
                      key={idx}
                      className={`w-11 h-13 sm:w-12 sm:h-14 rounded-xl border-2 flex items-center justify-center font-mono text-2xl font-extrabold shadow-inner transition-all ${
                        digit
                          ? "bg-orange-50 border-orange-500 text-orange-700 scale-105"
                          : isCurrent
                          ? "bg-white border-orange-400 ring-2 ring-orange-400/20 animate-pulse"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                      }`}
                    >
                      {digit || ""}
                    </div>
                  );
                })}
              </div>

              {/* Integrated Touch Keypad (50-54px buttons, perfect for 720x1280 kiosk) */}
              <div className="w-full grid grid-cols-3 gap-1.5 pt-0.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(num)}
                    disabled={uiState === "VERIFYING"}
                    className="h-12 sm:h-13 rounded-xl bg-orange-50/80 hover:bg-orange-100 active:bg-orange-200 border border-orange-200/80 text-slate-900 font-bold font-mono text-xl flex items-center justify-center shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {num}
                  </button>
                ))}

                {/* Left: [ ← ] (Backspace) */}
                <button
                  type="button"
                  onClick={() => handleKeypadPress("BACKSPACE")}
                  disabled={uiState === "VERIFYING"}
                  className="h-12 sm:h-13 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Delete last digit"
                >
                  <ArrowLeft size={20} className="stroke-[2.5]" />
                </button>

                {/* Center: [ 0 ] */}
                <button
                  type="button"
                  onClick={() => handleKeypadPress(0)}
                  disabled={uiState === "VERIFYING"}
                  className="h-12 sm:h-13 rounded-xl bg-orange-50/80 hover:bg-orange-100 active:bg-orange-200 border border-orange-200/80 text-slate-900 font-bold font-mono text-xl flex items-center justify-center shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  0
                </button>

                {/* Right: [ Clear ] */}
                <button
                  type="button"
                  onClick={() => handleKeypadPress("CLEAR")}
                  disabled={uiState === "VERIFYING"}
                  className="h-12 sm:h-13 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 text-slate-600 font-bold text-xs sm:text-sm flex items-center justify-center uppercase tracking-wide shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
              </div>

              {/* Verify Payment Button (Directly below Keypad) */}
              <button
                type="button"
                onClick={() => handleConfirmCode()}
                disabled={!isCodeComplete || uiState === "VERIFYING"}
                className={`w-full py-3 rounded-xl font-bold text-base transition-all shadow-md flex items-center justify-center gap-2 ${
                  isCodeComplete && uiState !== "VERIFYING"
                    ? "bg-orange-500 hover:bg-orange-600 text-white active:scale-98 shadow-orange-500/25 cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                }`}
              >
                {uiState === "VERIFYING" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify Payment</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Minimal Footer */}
      <div className="relative z-10 w-full text-center text-[10px] text-slate-400 py-0.5">
        Reliv Health System • Secure Offline Payment Gateway
      </div>
    </div>
  );
}
