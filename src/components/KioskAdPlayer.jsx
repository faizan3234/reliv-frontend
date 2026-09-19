import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  absoluteAdMediaUrl,
  activateAdCampaign,
  getActiveAdPlaylist,
  getPendingAdPayment,
  recordAdPlay
} from "../services/adApi";
import { useSpeech } from "../context/SpeechContext";
import { useVoiceAssistant } from "../context/VoiceAssistantContext";
import "./KioskAdPlayer.css";

const IDLE_TIMEOUT_MS = 20_000;
const RELIV_ATTRACT_DURATION_MS = 5_000;
const DEFAULT_IMAGE_DURATION_MS = 10_000;

const RelivHeartSvg = ({ className = "ad-reliv-heart" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const FingerTouchSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 11V6a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2"/>
    <path d="M14 10V4a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v2"/>
    <path d="M10 10.5V6a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v8"/>
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
  </svg>
);

export default function KioskAdPlayer() {
  const location = useLocation();
  const { stop } = useSpeech();
  const { pauseListening, resumeListening } = useVoiceAssistant();

  const [isAdActive, setIsAdActive] = useState(false);
  const [slide, setSlide] = useState("attract");
  const [ads, setAds] = useState([]);
  const [adIndex, setAdIndex] = useState(0);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  const [activationError, setActivationError] = useState("");
  const [activationSuccess, setActivationSuccess] = useState(null);

  const idleTimer = useRef(null);
  const rotationTimer = useRef(null);
  const paymentPoll = useRef(null);
  const videoRef = useRef(null);
  const activePlayRef = useRef(null);
  const leavingAdRef = useRef(false);
  const hadPendingPaymentRef = useRef(false);

  const clearTimer = (ref) => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = null;
  };

  const refreshPlaylist = useCallback(async () => {
    try {
      const data = await getActiveAdPlaylist();
      const normalized = (data.ads || []).map((ad) => ({
        ...ad,
        mediaUrl: absoluteAdMediaUrl(ad.mediaUrl)
      }));
      setAds(normalized);
      setAdIndex((prev) => normalized.length ? prev % normalized.length : 0);
      return normalized;
    } catch {
      return [];
    }
  }, []);

  const beginAdMode = useCallback(async () => {
    if (location.pathname !== "/" || pendingPayment || keypadOpen) return;
    const available = await refreshPlaylist();
    if (!available.length) return;
    stop();
    pauseListening();
    setSlide("ad");
    setIsAdActive(true);
  }, [location.pathname, pendingPayment, keypadOpen, refreshPlaylist, stop, pauseListening]);

  const resetIdle = useCallback(() => {
    clearTimer(idleTimer);
    if (location.pathname !== "/" || pendingPayment || keypadOpen || isAdActive) return;
    idleTimer.current = setTimeout(beginAdMode, IDLE_TIMEOUT_MS);
  }, [location.pathname, pendingPayment, keypadOpen, isAdActive, beginAdMode]);

  const endCurrentPlay = useCallback((interrupted) => {
    const play = activePlayRef.current;
    if (!play) return;
    activePlayRef.current = null;
    recordAdPlay(play.campaignId, {
      startedAt: play.startedAt,
      completed: !interrupted,
      interruptedByUser: Boolean(interrupted)
    });
  }, []);

  const exitAdMode = useCallback((event) => {
    if (leavingAdRef.current) return;
    leavingAdRef.current = true;
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.nativeEvent?.stopImmediatePropagation?.();
    }
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.pause();
    }
    clearTimer(rotationTimer);
    endCurrentPlay(true);
    setIsAdActive(false);
    setSlide("attract");
    window.setTimeout(() => {
      leavingAdRef.current = false;
      resumeListening();
      resetIdle();
    }, 0);
  }, [endCurrentPlay, resetIdle, resumeListening]);

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await getPendingAdPayment();
        const hadPending = hadPendingPaymentRef.current;
        hadPendingPaymentRef.current = Boolean(data.pending);
        setPendingPayment(data.pending || null);
        if (data.pending && location.pathname === "/") {
          endCurrentPlay(true);
          setIsAdActive(false);
          clearTimer(rotationTimer);
          stop();
          pauseListening();
        } else if (!data.pending && hadPending && location.pathname === "/" && !keypadOpen) {
          resumeListening();
          resetIdle();
        }
      } catch {}
    };
    poll();
    paymentPoll.current = setInterval(poll, 1000);
    return () => clearInterval(paymentPoll.current);
  }, [stop, pauseListening, resumeListening, resetIdle, location.pathname, keypadOpen, endCurrentPlay]);

  useEffect(() => {
    const activity = () => {
      if (!isAdActive) resetIdle();
    };
    window.addEventListener("pointerdown", activity, { passive:true });
    window.addEventListener("keydown", activity, { passive:true });
    resetIdle();
    return () => {
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
      clearTimer(idleTimer);
    };
  }, [isAdActive, resetIdle]);

  useEffect(() => {
    clearTimer(idleTimer);
    clearTimer(rotationTimer);
    if (location.pathname !== "/") {
      if (isAdActive) {
        endCurrentPlay(true);
        setIsAdActive(false);
      }
      resumeListening();
      return;
    }
    resetIdle();
  }, [location.pathname, resetIdle, isAdActive, endCurrentPlay, resumeListening]);

  const currentAd = ads.length ? ads[adIndex % ads.length] : null;

  useEffect(() => {
    clearTimer(rotationTimer);
    if (!isAdActive || !currentAd) return;

    if (slide === "attract") {
      rotationTimer.current = setTimeout(() => setSlide("ad"), RELIV_ATTRACT_DURATION_MS);
      return () => clearTimer(rotationTimer);
    }

    const durationMs = currentAd.mediaType === "video"
      ? Math.max(1000, Math.min(15_000, Math.round(Number(currentAd.durationSeconds || 15) * 1000)))
      : DEFAULT_IMAGE_DURATION_MS;

    activePlayRef.current = { campaignId:currentAd.campaignId, startedAt:Date.now() };
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = currentAd.hasAudio ? 0.30 : 0;
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }

    rotationTimer.current = setTimeout(() => {
      endCurrentPlay(false);
      setAdIndex((prev) => ads.length ? (prev + 1) % ads.length : 0);
      setSlide("attract");
    }, durationMs);

    return () => clearTimer(rotationTimer);
  }, [isAdActive, slide, currentAd?.campaignId, currentAd?.durationSeconds, ads.length, endCurrentPlay]);

  useEffect(() => {
    const open = () => {
      setIsAdActive(false);
      clearTimer(rotationTimer);
      setKeypadOpen(true);
      setEnteredCode("");
      setActivationError("");
      setActivationSuccess(null);
      stop();
      pauseListening();
    };
    window.addEventListener("reliv_open_ad_keypad", open);
    return () => window.removeEventListener("reliv_open_ad_keypad", open);
  }, [stop, pauseListening]);

  const pressDigit = (digit) => {
    if (enteredCode.length >= 4) return;
    const next = enteredCode + digit;
    setEnteredCode(next);
    setActivationError("");
    if (next.length === 4) {
      window.setTimeout(async () => {
        if (!pendingPayment) {
          setActivationError("No active advertising payment is waiting.");
          setEnteredCode("");
          return;
        }
        try {
          const result = await activateAdCampaign({
            campaignId: pendingPayment.campaignId,
            requestId: pendingPayment.requestId,
            code: next
          });
          setActivationSuccess(result);
          setPendingPayment(null);
          await refreshPlaylist();
          window.setTimeout(() => {
            setKeypadOpen(false);
            setActivationSuccess(null);
            setEnteredCode("");
            resumeListening();
            resetIdle();
          }, 4000);
        } catch (err) {
          setActivationError(err.message || "That code does not match.");
          window.setTimeout(() => setEnteredCode(""), 900);
        }
      }, 120);
    }
  };

  const closeKeypad = () => {
    setKeypadOpen(false);
    setEnteredCode("");
    setActivationError("");
    resumeListening();
    resetIdle();
  };

  const showPaymentScreen = Boolean(pendingPayment && location.pathname === "/");

  return (
    <>
      {showPaymentScreen && (
        <div className="kiosk-payment-active-screen">
          <div className="kiosk-payment-container">
            <div className="kiosk-pay-left">
              <h2 className="kiosk-pay-title">Pay to activate your advertisement</h2>
              <p className="kiosk-pay-sub">
                {pendingPayment.durationDays} {pendingPayment.durationDays === 1 ? "day" : "days"} · ₹{Math.round(pendingPayment.amountPaise / 100)}
              </p>
              <div className="kiosk-pay-steps">
                <div className="kiosk-step-row"><span className="kiosk-step-badge">1</span><span>Turn off Wi-Fi on your phone</span></div>
                <div className="kiosk-step-row"><span className="kiosk-step-badge">2</span><span>Scan this QR code</span></div>
                <div className="kiosk-step-row"><span className="kiosk-step-badge">3</span><span>Pay securely via UPI or Card</span></div>
                <div className="kiosk-step-row"><span className="kiosk-step-badge">4</span><span>Enter the 4-digit code here</span></div>
              </div>
              <button
                type="button"
                className="btn-primary-ads"
                style={{width:"auto",padding:"0 24px",marginTop:24}}
                onClick={() => {
                  setKeypadOpen(true);
                  setEnteredCode("");
                  setActivationError("");
                }}
              >
                Enter 4-Digit Activation Code
              </button>
            </div>
            <div className="kiosk-pay-right">
              <div className="kiosk-large-qr-wrap">
                <QRCodeSVG value={pendingPayment.paymentUrl} size={280} level="M" />
              </div>
              <span style={{fontSize:14,color:"#64748b",marginTop:12,fontWeight:600}}>Scan with your phone camera</span>
            </div>
          </div>
        </div>
      )}

      {isAdActive && !showPaymentScreen && (
        <div
          className="kiosk-ad-player-overlay"
          onPointerDownCapture={exitAdMode}
          aria-label="Advertisement. Touch anywhere to return to Reliv."
        >
          {slide === "attract" || !currentAd ? (
            <div className="reliv-attract-screen">
              <div className="attract-logo-wrap"><RelivHeartSvg /><span style={{fontSize:32,fontWeight:800}}>RELIV HEALTH</span></div>
              <h1 className="attract-title">Health Checkup & Medicine Dispenser</h1>
              <p className="attract-subtitle">BP · SpO₂ · Temperature · Body Composition · More</p>
              <div className="attract-touch-prompt"><FingerTouchSvg /><span>Touch Screen to Begin</span></div>
            </div>
          ) : (
            <div className="kiosk-ad-canvas">
              <div className="ad-system-pill-top">ADVERTISEMENT</div>
              {currentAd.mediaType === "video" ? (
                <video
                  key={currentAd.campaignId}
                  ref={videoRef}
                  src={currentAd.mediaUrl}
                  className="ad-foreground-media edge-to-edge"
                  playsInline
                  preload="auto"
                />
              ) : (
                <img
                  key={currentAd.campaignId}
                  src={currentAd.mediaUrl}
                  alt="Advertisement"
                  className="ad-foreground-media edge-to-edge"
                />
              )}
              <div className="ad-system-pill-bottom">
                <span style={{color:"#ea580c",display:"flex"}}><RelivHeartSvg /></span>
                <span className="ad-reliv-text">RELIV · TOUCH TO START</span>
                <span className="ad-system-touch-anim"><FingerTouchSvg /></span>
              </div>
            </div>
          )}
        </div>
      )}

      {keypadOpen && (
        <div className="kiosk-activation-modal">
          {!activationSuccess ? (
            <div className="activation-keypad-card">
              <h2 className="activation-header-title">Activate Your Ad</h2>
              <p className="activation-header-sub">Enter the 4-digit code shown on your phone after payment.</p>
              <div className="code-inputs-row">
                {[0,1,2,3].map((i) => <div key={i} className={`code-box ${enteredCode[i] ? "filled" : ""}`}>{enteredCode[i] || "—"}</div>)}
              </div>
              {activationError && <div style={{marginBottom:16,fontSize:14,fontWeight:700,color:"#dc2626"}}>{activationError}</div>}
              <div className="numeric-keypad-grid">
                {["1","2","3","4","5","6","7","8","9"].map((n) => <button key={n} type="button" className="keypad-key-btn" onClick={() => pressDigit(n)}>{n}</button>)}
                <button type="button" className="keypad-key-btn action-key" onClick={() => {setEnteredCode("");setActivationError("");}}>Clear</button>
                <button type="button" className="keypad-key-btn" onClick={() => pressDigit("0")}>0</button>
                <button type="button" className="keypad-key-btn action-key" onClick={() => setEnteredCode((v) => v.slice(0,-1))}>⌫</button>
              </div>
              <button type="button" className="link-secondary-action" style={{marginTop:8}} onClick={closeKeypad}>Close</button>
            </div>
          ) : (
            <div className="kiosk-activation-success">
              <div className="activation-success-badge"><span aria-hidden="true">✓</span></div>
              <h2 className="activation-success-title">Your ad is ready</h2>
              <p className="activation-success-sub">
                {activationSuccess.status === "ACTIVE" ? "Your ad is now in rotation on this kiosk." : activationSuccess.status === "PENDING_APPROVAL" ? "Campaign received and waiting for venue approval." : "Campaign scheduled for its selected start."}
              </p>
              <button type="button" className="btn-primary-ads" style={{height:50}} onClick={closeKeypad}>Done</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
