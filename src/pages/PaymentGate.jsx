// src/pages/PaymentGate.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import TopEllipseBackground from "../components/TopEllipseBackground";
import { useHealth } from "../context/HealthContext";
import { sanitizeError } from "../utils/errorSanitizer";
import { usePageSpeech } from "../context/SpeechContext";
import { API_BASE } from "../config/api";

const INACTIVITY_TIMEOUT = 45000; // 45 seconds - strict for payment screen
const DOUBLE_CLICK_PREVENTION_MS = 1800;

const PaymentGate = () => {
  usePageSpeech("payment");
  const navigate = useNavigate();
  const location = useLocation();
  const { data: healthData } = useHealth();

  // Fetch report price from backend (single source of truth)
  const [reportPrice, setReportPrice] = useState(27); // Default fallback

  const { cart = [], totalPrice = 0, fromPaymentGate = false } = location.state || {};

  // PRODUCTION SAFETY: Force RUN mode on deployed domains
  const isProduction = window.location.hostname !== 'localhost' && 
                       window.location.hostname !== '127.0.0.1';
  const isRunMode = isProduction ? true : (localStorage.getItem("paymentMode") === "run");
  
  const isProcessingRef = useRef(false);

  // Determine navigation path after payment
  const needsReport = fromPaymentGate || cart.length === 0;
  const hasKits = cart.length > 0;
  
  // Calculate final amount correctly
  const finalAmount = totalPrice > 0 ? totalPrice : reportPrice;

  // Fetch report price from backend on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/report-price`)
      .then(res => res.json())
      .then(data => setReportPrice(data.price))
      .catch(() => setReportPrice(27)); // Fallback to default if fetch fails
  }, []);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("idle"); // idle | processing | success | failed | cancelled
  const [lastClickTime, setLastClickTime] = useState(0);

  // ── Inactivity timer (stops during Razorpay modal) ───────────────────────
  const timeoutRef = useRef(null);

  const startInactivityTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      // Hard reload to kill any possible lingering Razorpay iframe/overlay
      window.location.href = "/";
    }, INACTIVITY_TIMEOUT);
  }, []);

  const stopInactivityTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const events = ["click", "touchstart"];

    const resetTimer = () => {
      // Only manage timer when idle AND not processing
      if (paymentStatus === "idle" && !isProcessing) {
        startInactivityTimer();
      }
    };

    events.forEach((ev) => window.addEventListener(ev, resetTimer));

    // Initial start only if we begin idle
    if (paymentStatus === "idle" && !isProcessing) {
      startInactivityTimer();
    }

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
      stopInactivityTimer();
    };
  }, [startInactivityTimer, stopInactivityTimer, paymentStatus, isProcessing]);

  // ── Send receipt & navigate after success ───────
  const completeSuccessfulPayment = useCallback(async () => {
    // Show success IMMEDIATELY — no flicker back to idle/button
    setPaymentStatus("success");

    const patient = healthData?.patient;

    // Send receipt email (non-blocking, don't delay UI)
    if ((needsReport || cart.length > 0) && patient?.email) {
      fetch(`${API_BASE}/api/send-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient,
          cart,
          totalPrice: finalAmount,
          needsReport,
        }),
      }).catch(() => {});
    }

    // DISPENSE: Send MQTT command to rotate motors (only after payment confirmed)
    if (hasKits && cart.length > 0) {
      fetch(`${API_BASE}/api/dispense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart }),
      }).catch(() => {});
    }

    // Navigate after a brief delay to show success message
    setTimeout(() => {
      isProcessingRef.current = false;
      setIsProcessing(false);
      
      // If user bought kits along with report, store cart for later
      if (hasKits && needsReport) {
        localStorage.setItem('reliv_pending_kits', JSON.stringify(cart));
      }
      
      // Navigate based on purchase type
      if (needsReport && !hasKits) {
        // Report only - go to report flow
        navigate("/report-1", { replace: true });
      } else if (hasKits) {
        // Has physical kits - go to order success
        navigate("/order-success", { replace: true, state: { cart } });
      } else {
        navigate("/order-success", { replace: true });
      }
    }, 1500);
  }, [healthData, cart, finalAmount, needsReport, hasKits, navigate]);

  // ── Main payment initiation ──────────────────────────────────────────────
  const initiatePayment = useCallback(async () => {
    const now = Date.now();
    if (now - lastClickTime < DOUBLE_CLICK_PREVENTION_MS) return;
    setLastClickTime(now);

    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
    setPaymentStatus("processing");

    // STOP inactivity timer as soon as payment flow starts
    stopInactivityTimer();

    if (!isRunMode) {
      // Simulation mode
      await new Promise((r) => setTimeout(r, 1800));
      await completeSuccessfulPayment();
      return;
    }

    // Real Razorpay flow
    try {
      const res = await fetch(`${API_BASE}/api/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount }),
      });

      if (!res.ok) throw new Error("Order creation failed. " + (await res.text() || ""));

      const orderData = await res.json();
      const orderId = orderData?.id;
      if (!orderId) throw new Error("Invalid order response from server");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: finalAmount * 100,
        currency: "INR",
        name: "Reliv Health",
        description: needsReport ? "Health Report Access" : "Medical Kits Purchase",
        order_id: orderId,
        handler: async (response) => {
          if (import.meta.env.DEV) console.log("Razorpay success:", response);
          
          // Verify signature server-side before completing (prevents fake/replayed payments)
          try {
            const verifyRes = await fetch(`${API_BASE}/api/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (!verifyRes.ok) {
              setPaymentStatus("failed");
              isProcessingRef.current = false;
              setIsProcessing(false);
              startInactivityTimer();
              return;
            }
            const verifyData = await verifyRes.json();
            if (!verifyData.ok) {
              setPaymentStatus("failed");
              isProcessingRef.current = false;
              setIsProcessing(false);
              startInactivityTimer();
              return;
            }
          } catch (verifyErr) {
            if (import.meta.env.DEV) console.error("Verification call failed:", verifyErr);
            // On network error, proceed optimistically so kiosk doesn't get stuck
          }

          // Immediately stop all timers and prevent any interruption
          stopInactivityTimer();
          
          // Complete the payment flow
          await completeSuccessfulPayment();
        },
        prefill: {
          name: healthData?.patient?.name || "",
          email: healthData?.patient?.email || "",
          contact: healthData?.patient?.phone || "9163606455",
        },
        theme: { color: "#E85C25" },
        modal: {
          confirm_close: true,
          escape: false,
          ondismiss: () => {
            if (import.meta.env.DEV) console.log("Razorpay modal dismissed by user");
            setPaymentStatus("cancelled");
            
            // Auto-reset to idle after 3 seconds
            setTimeout(() => {
              setPaymentStatus("idle");
              isProcessingRef.current = false;
              setIsProcessing(false);
              startInactivityTimer();
            }, 3000);
          },
        },
      };

      if (typeof window.Razorpay !== 'function') {
        setPaymentStatus("failed");
        setTimeout(() => {
          setPaymentStatus("idle");
          isProcessingRef.current = false;
          setIsProcessing(false);
          startInactivityTimer();
        }, 3000);
        return;
      }

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response) => {
        if (import.meta.env.DEV) console.error("Payment failed:", response.error);
        setPaymentStatus("failed");
        
        // Auto-reset to idle after showing error for 3 seconds
        setTimeout(() => {
          setPaymentStatus("idle");
          isProcessingRef.current = false;
          setIsProcessing(false);
          startInactivityTimer();
        }, 3000);
      });

      rzp.open();
    } catch (err) {
      if (import.meta.env.DEV) console.error("Payment initiation error:", err);
      // alert(`Payment failed: ${sanitizeError(err)}`); // Optional: show more detail sanitized
      setPaymentStatus("failed");
      
      // Auto-reset to idle after showing error for 3 seconds
      setTimeout(() => {
        setPaymentStatus("idle");
        isProcessingRef.current = false;
        setIsProcessing(false);
        startInactivityTimer();
      }, 3000);
    }
  }, [
    finalAmount,
    isRunMode,
    healthData,
    needsReport,
    completeSuccessfulPayment,
    lastClickTime,
    stopInactivityTimer,
    startInactivityTimer,
  ]);

  const containerOpacity = isProcessing || paymentStatus !== "idle" ? "opacity-75" : "opacity-100";
  const pointerEvents = isProcessing || paymentStatus !== "idle" ? "pointer-events-none" : "";

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-white to-orange-50/30 font-sans overflow-y-auto scrollable-container">
      <TopEllipseBackground color="#FFF1EA" height="65%" />

      <div className={`relative z-10 flex min-h-full flex-col items-center justify-center px-5 transition-all duration-400 ${containerOpacity} ${pointerEvents}`}>
        <div className="mb-8 scale-110 transform">
          <Logo />
        </div>

        <div className="w-full max-w-md rounded-2xl bg-white/95 p-8 shadow-xl backdrop-blur-sm ring-1 ring-orange-100">
          <h1 className="mb-3 text-center text-2xl font-bold text-gray-900 md:text-3xl">
            {needsReport ? "Your Report is Ready!" : "Complete Your Purchase"}
          </h1>

          <p className="mb-2 text-center text-base text-gray-700 leading-relaxed">
            {needsReport
              ? `Please pay ₹${finalAmount} to unlock your detailed health report${
                  cart.length > 0 ? " + selected kits" : ""
                }`
              : `Secure payment of ₹${finalAmount} for your medical kits`}
          </p>

          <p className="mb-6 text-center text-xs text-gray-500">
            You will be charged exactly ₹{finalAmount}. No hidden fees.
          </p>

          {/* Main Action Area */}
          {paymentStatus === "idle" && (
            <>
              <button
                onClick={initiatePayment}
                disabled={isProcessing}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#E85C25] to-[#f97316] px-8 py-5 text-lg font-bold text-white shadow-lg transition-all hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  Pay ₹{finalAmount}
                  <svg
                    className="h-5 w-5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                <div className="absolute inset-0 scale-x-0 bg-white/20 transition-transform group-hover:scale-x-100 group-active:scale-x-110 origin-left" />
              </button>

              {cart.length > 0 && (
                <button
                  onClick={() => navigate('/checkout', { state: { cart, totalPrice, fromPaymentGate } })}
                  className="mt-4 w-full rounded-xl bg-white border-2 border-gray-200 px-6 py-3.5 font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Checkout
                </button>
              )}
            </>
          )}

          {/* Status messages */}
          {paymentStatus === "processing" && (
            <div className="flex flex-col items-center space-y-4 py-6">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
              <p className="text-lg font-medium text-orange-700">Processing Secure Payment...</p>
              <p className="text-sm text-gray-500">Please do not close or refresh</p>
            </div>
          )}

          {paymentStatus === "success" && (
            <div className="rounded-xl bg-green-50 py-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-green-800">Payment Successful!</h3>
              <p className="mt-2 text-green-700">Thank you for choosing Reliv</p>
              <p className="mt-4 text-sm text-gray-600">Redirecting you now...</p>
            </div>
          )}

          {(paymentStatus === "failed" || paymentStatus === "cancelled") && (
            <div className="rounded-xl bg-gray-50 p-6 text-center border border-gray-200">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                {paymentStatus === "cancelled" ? (
                  <svg className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800">
                {paymentStatus === "cancelled" ? "Payment Cancelled" : "Payment Failed"}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {paymentStatus === "cancelled"
                  ? "No worries! No amount was deducted."
                  : "Something went wrong. Your money is safe."}
              </p>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={initiatePayment}
                  className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 font-semibold text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  Try Again →
                </button>
                
                {cart.length > 0 && (
                  <button
                    onClick={() => navigate('/checkout', { state: { cart, totalPrice, fromPaymentGate } })}
                    className="w-full rounded-xl bg-white border-2 border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
                  >
                    ← Back to Checkout
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Trust & Help */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <div className="flex items-center justify-center gap-1.5">
              <span>🔒 100% Secure Payment</span>
              <span className="font-medium text-orange-600">Powered by Razorpay</span>
            </div>
            <div className="mt-1.5">All major cards, UPI, Netbanking</div>
          </div>


        </div>

        {/* Optional kits upsell */}
        {fromPaymentGate && cart.length === 0 && paymentStatus === "idle" && !isProcessing && (
          <div className="mt-10 text-center">
            <p className="text-sm text-gray-600">Also interested in wellness kits?</p>
            <button
              onClick={() => navigate("/medicine-dispensing", { state: { fromPaymentGate: true, cart } })}
              className="mt-2 text-base font-semibold text-orange-600 hover:text-orange-700 hover:underline"
            >
              Explore Medical Kits →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentGate;