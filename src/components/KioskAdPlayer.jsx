// src/components/KioskAdPlayer.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useSpeech } from "../context/SpeechContext";
import { useVoiceAssistant } from "../context/VoiceAssistantContext";
import { 
  getCurrentlyEligibleAds, 
  verifyAndActivateCode,
  getPendingPaymentCampaign,
  clearPendingPayment
} from "../utils/adCryptoLocal";
import "./KioskAdPlayer.css";

const IDLE_TIMEOUT_MS = 20_000; // 20 seconds idle before ads start
const RELIV_ATTRACT_DURATION_MS = 5_000; // 5 seconds Reliv screen between ads
const DEFAULT_IMAGE_DURATION_MS = 10_000; // 10 seconds for posters

// Clean SVG Icons
const RelivHeartSvg = ({ className = "ad-reliv-heart" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const FingerTouchSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
  </svg>
);

export default function KioskAdPlayer() {
  const location = useLocation();
  const { stop: stopSpeech } = useSpeech();
  const { pauseListening, resumeListening } = useVoiceAssistant();
  const isHome = location.pathname === '/';

  // Ad Overlay State
  const [isAdActive, setIsAdActive] = useState(false);
  const [currentSlideType, setCurrentSlideType] = useState('attract'); // 'attract' | 'ad'
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [eligibleAds, setEligibleAds] = useState([]);

  // Physical Kiosk Payment QR Mode State
  const [pendingPayment, setPendingPayment] = useState(null);

  // Activation Keypad Modal State
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [activationFeedback, setActivationFeedback] = useState(null);
  const [activatedSuccessData, setActivatedSuccessData] = useState(null);

  const idleTimerRef = useRef(null);
  const rotationTimerRef = useRef(null);
  const videoRef = useRef(null);

  // Check for pending payment broadcasts
  useEffect(() => {
    const checkPayment = () => {
      const pending = getPendingPaymentCampaign();
      setPendingPayment(pending);
    };

    checkPayment();

    const handleShowPayment = (e) => {
      setIsAdActive(false);
      setPendingPayment(e.detail);
    };

    const handleClearPayment = () => {
      setPendingPayment(null);
    };

    window.addEventListener('reliv_kiosk_show_payment_qr', handleShowPayment);
    window.addEventListener('reliv_kiosk_clear_payment_qr', handleClearPayment);

    return () => {
      window.removeEventListener('reliv_kiosk_show_payment_qr', handleShowPayment);
      window.removeEventListener('reliv_kiosk_clear_payment_qr', handleClearPayment);
    };
  }, []);

  // Reset Idle Timer
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    // Advertising only allowed when user is idle on the Home/Splash screen
    // And no active kiosk payment screen is open
    if (location.pathname !== '/' || pendingPayment) {
      setIsAdActive(false);
      return;
    }

    idleTimerRef.current = setTimeout(() => {
      const ads = getCurrentlyEligibleAds();
      setEligibleAds(ads);
      if (ads.length > 0) {
        setIsAdActive(true);
        setCurrentSlideType('attract'); // Always start with Reliv attract screen
      }
    }, IDLE_TIMEOUT_MS);
  }, [location.pathname, pendingPayment]);

  // Fast Exit on any Touch / Pointerdown event (Capture Phase)
  const exitAdMode = useCallback((e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.pause();
    }

    setIsAdActive(false);
    resetIdleTimer();
  }, [resetIdleTimer]);

  // Ads/payment overlays own the speaker while visible. This prevents Reliv guidance,
  // microphone recognition and ad audio from talking over one another.
  const overlayActive = isHome && (isAdActive || Boolean(pendingPayment) || isKeypadOpen);
  useEffect(() => {
    if (overlayActive) {
      stopSpeech();
      pauseListening();
    } else {
      resumeListening();
    }
  }, [isHome, overlayActive, pauseListening, resumeListening, stopSpeech]);

  // Window user activity listeners
  useEffect(() => {
    const handleUserActivity = () => {
      if (!isAdActive) {
        resetIdleTimer();
      }
    };

    window.addEventListener('pointerdown', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });

    resetIdleTimer();

    return () => {
      window.removeEventListener('pointerdown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isAdActive, resetIdleTimer]);

  // Handle route changes
  useEffect(() => {
    if (location.pathname !== '/') {
      setIsAdActive(false);
      setIsKeypadOpen(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (rotationTimerRef.current) clearTimeout(rotationTimerRef.current);
    } else {
      resetIdleTimer();
    }
  }, [location.pathname, resetIdleTimer]);

  // Fair Rotation State Machine: Attract (5s) -> Ad A -> Attract (5s) -> Ad B -> ...
  useEffect(() => {
    if (!isAdActive || eligibleAds.length === 0) {
      if (rotationTimerRef.current) clearTimeout(rotationTimerRef.current);
      return;
    }

    if (currentSlideType === 'attract') {
      rotationTimerRef.current = setTimeout(() => {
        setCurrentSlideType('ad');
      }, RELIV_ATTRACT_DURATION_MS);
    } else if (currentSlideType === 'ad') {
      const activeAd = eligibleAds[currentAdIndex % eligibleAds.length];
      const duration = activeAd.mediaType === 'video' ? 15_000 : DEFAULT_IMAGE_DURATION_MS;

      // Ensure ad video volume is kept at 30% kiosk volume
      if (videoRef.current) {
        videoRef.current.volume = 0.30;
      }

      rotationTimerRef.current = setTimeout(() => {
        setCurrentAdIndex(prev => (prev + 1) % eligibleAds.length);
        setCurrentSlideType('attract');
      }, duration);
    }

    return () => {
      if (rotationTimerRef.current) clearTimeout(rotationTimerRef.current);
    };
  }, [isAdActive, currentSlideType, currentAdIndex, eligibleAds]);

  // Open activation keypad event listener
  useEffect(() => {
    const handleOpenModal = () => {
      setIsAdActive(false);
      setIsKeypadOpen(true);
      setEnteredCode('');
      setActivationFeedback(null);
      setActivatedSuccessData(null);
    };

    window.addEventListener('reliv_open_ad_keypad', handleOpenModal);
    return () => {
      window.removeEventListener('reliv_open_ad_keypad', handleOpenModal);
    };
  }, []);

  // Keypad Handlers
  const handleKeypadPress = (val) => {
    if (enteredCode.length < 4) {
      const nextCode = enteredCode + val;
      setEnteredCode(nextCode);

      if (nextCode.length === 4) {
        setTimeout(() => {
          const result = verifyAndActivateCode(nextCode);
          if (result.success) {
            setActivatedSuccessData({
              campaign: result.campaign,
              isScheduled: result.isScheduled
            });
            setActivationFeedback(null);
            setEligibleAds(getCurrentlyEligibleAds());

            // Auto-dismiss after 4 seconds
            setTimeout(() => {
              setIsKeypadOpen(false);
              setActivatedSuccessData(null);
              setEnteredCode('');
              setPendingPayment(null);
            }, 4000);
          } else {
            setActivationFeedback({
              type: 'error',
              message: result.error
            });
            setTimeout(() => {
              setEnteredCode('');
            }, 1200);
          }
        }, 150);
      }
    }
  };

  const handleKeypadBackspace = () => {
    setEnteredCode(prev => prev.slice(0, -1));
    setActivationFeedback(null);
  };

  const handleKeypadClear = () => {
    setEnteredCode('');
    setActivationFeedback(null);
  };

  const currentAd = eligibleAds[currentAdIndex % eligibleAds.length];

  return (
    <>
      {/* 1. PHYSICAL KIOSK PAYMENT SCREEN (VERY LARGE QR ON KIOSK DISPLAY) */}
      {isHome && pendingPayment && (
        <div className="kiosk-payment-active-screen">
          <div className="kiosk-payment-container">
            <div className="kiosk-pay-left">
              <h2 className="kiosk-pay-title">Pay to activate your advertisement</h2>
              <p className="kiosk-pay-sub">
                {pendingPayment.venueName} · {pendingPayment.durationDays} Days · ₹{pendingPayment.priceRupees}
              </p>

              <div className="kiosk-pay-steps">
                <div className="kiosk-step-row">
                  <span className="kiosk-step-badge">1</span>
                  <span>Turn off Wi-Fi on your phone</span>
                </div>
                <div className="kiosk-step-row">
                  <span className="kiosk-step-badge">2</span>
                  <span>Scan this QR code</span>
                </div>
                <div className="kiosk-step-row">
                  <span className="kiosk-step-badge">3</span>
                  <span>Pay securely via UPI or Card</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn-primary-ads"
                  style={{ width: 'auto', padding: '0 24px' }}
                  onClick={() => {
                    setIsKeypadOpen(true);
                    setEnteredCode('');
                  }}
                >
                  Enter 4-Digit Activation Code
                </button>
                <button
                  type="button"
                  className="link-secondary-action"
                  onClick={() => clearPendingPayment()}
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* VERY LARGE PAYMENT QR ON KIOSK */}
            <div className="kiosk-pay-right">
              <div className="kiosk-large-qr-wrap">
                <QRCodeSVG 
                  value={`https://reliv7.vercel.app/pay#p=${btoa(JSON.stringify({
                    campaignId: pendingPayment.campaignId,
                    price: pendingPayment.priceRupees,
                    venue: pendingPayment.venueId,
                    purpose: 'RELIV_AD_CAMPAIGN'
                  }))}`}
                  size={240}
                />
              </div>
              <span style={{ fontSize: '13px', color: '#64748b', marginTop: '12px', fontWeight: 600 }}>
                Scan with any UPI / Camera app
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. FULL-SCREEN AD PLAYER OVERLAY */}
      {isHome && isAdActive && !pendingPayment && (
        <div 
          className="kiosk-ad-player-overlay"
          onPointerDown={exitAdMode}
          title="Touch anywhere to resume Reliv"
        >
          {currentSlideType === 'attract' || !currentAd ? (
            /* Reliv Attract Screen (5s) */
            <div className="reliv-attract-screen">
              <div className="attract-logo-wrap">
                <RelivHeartSvg className="ad-reliv-heart" />
                <span style={{ fontSize: '32px', fontWeight: 800 }}>RELIV HEALTH</span>
              </div>
              <h1 className="attract-title">Your Health, Measured in Minutes</h1>
              <p className="attract-subtitle">
                Instant contactless vitals, BMI composition, vision screening & wellness guidance.
              </p>
              <div className="attract-touch-prompt">
                <FingerTouchSvg />
                <span>Touch Screen to Begin Checkup</span>
              </div>
            </div>
          ) : (
            /* Active Advertisement Screen */
            <div className="kiosk-ad-canvas">
              {/* Top-Right Label */}
              <div className="ad-system-pill-top">
                ADVERTISEMENT
              </div>

              {/* Blurred background wings if not true 16:9 */}
              {!currentAd.isTrue16x9 && (
                currentAd.mediaType === 'video' ? (
                  <video 
                    src={currentAd.mediaUrl} 
                    className="ad-blur-wings" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                  />
                ) : (
                  <img 
                    src={currentAd.mediaUrl || '/gurukul-ad.png'} 
                    alt="wings" 
                    className="ad-blur-wings" 
                  />
                )
              )}

              {/* Sharp Foreground Creative */}
              {currentAd.mediaType === 'video' ? (
                <video 
                  ref={videoRef}
                  src={currentAd.mediaUrl} 
                  className={`ad-foreground-media ${currentAd.isTrue16x9 ? 'edge-to-edge' : ''}`}
                  autoPlay 
                  playsInline 
                />
              ) : (
                <img 
                  src={currentAd.mediaUrl || '/gurukul-ad.png'} 
                  alt={currentAd.brandName || "Reliv Ad"} 
                  className={`ad-foreground-media ${currentAd.isTrue16x9 ? 'edge-to-edge' : ''}`}
                />
              )}

              {/* Bottom-Center Floating Reliv Pill with subtle 5s micro-tap */}
              <div className="ad-system-pill-bottom">
                <span style={{ color: '#ea580c', display: 'flex', alignItems: 'center' }}>
                  <RelivHeartSvg className="ad-reliv-heart" />
                </span>
                <span className="ad-reliv-text">RELIV TOUCH TO START</span>
                <span className="ad-system-touch-anim">
                  <FingerTouchSvg />
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. OFFLINE ACTIVATION KEYPAD & SUCCESS MODAL */}
      {isHome && isKeypadOpen && (
        <div className="kiosk-activation-modal">
          {!activatedSuccessData ? (
            <div className="activation-keypad-card">
              <h2 className="activation-header-title">Activate Your Ad</h2>
              <p className="activation-header-sub">
                Enter the 4-digit code shown on your phone after payment.
              </p>

              {/* 4 Digit Boxes */}
              <div className="code-inputs-row">
                {[0, 1, 2, 3].map(i => (
                  <div 
                    key={i} 
                    className={`code-box ${enteredCode[i] ? 'filled' : ''}`}
                  >
                    {enteredCode[i] || '—'}
                  </div>
                ))}
              </div>

              {activationFeedback && (
                <div style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>
                  {activationFeedback.message}
                </div>
              )}

              {/* Numeric Keypad */}
              <div className="numeric-keypad-grid">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    type="button"
                    className="keypad-key-btn"
                    onClick={() => handleKeypadPress(num)}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  className="keypad-key-btn action-key"
                  onClick={handleKeypadClear}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="keypad-key-btn"
                  onClick={() => handleKeypadPress('0')}
                >
                  0
                </button>
                <button
                  type="button"
                  className="keypad-key-btn action-key"
                  onClick={handleKeypadBackspace}
                >
                  ⌫
                </button>
              </div>

              <button
                type="button"
                className="link-secondary-action"
                style={{ marginTop: '8px' }}
                onClick={() => setIsKeypadOpen(false)}
              >
                Close
              </button>
            </div>
          ) : (
            /* Kiosk Activation Success Moment */
            <div className="kiosk-activation-success">
              <div className="activation-success-badge">✓</div>
              <h2 className="activation-success-title">Your ad is ready</h2>
              <p className="activation-success-sub">
                {activatedSuccessData.isScheduled 
                  ? 'Campaign scheduled for upcoming start' 
                  : 'Your ad is now in rotation on this kiosk'}
              </p>

              <div className="activation-campaign-info-box">
                <div><strong>Venue:</strong> {activatedSuccessData.campaign.venueName}</div>
                <div><strong>Duration:</strong> {activatedSuccessData.campaign.startDate} to {activatedSuccessData.campaign.endDate}</div>
                <div><strong>Status:</strong> {activatedSuccessData.isScheduled ? 'Scheduled' : 'Added to rotation'}</div>
              </div>

              <button
                type="button"
                className="btn-primary-ads"
                style={{ height: '50px' }}
                onClick={() => {
                  setIsKeypadOpen(false);
                  setActivatedSuccessData(null);
                  setPendingPayment(null);
                }}
              >
                DONE
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
