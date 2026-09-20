// src/components/KioskAdPlayer.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useSpeech } from "../context/SpeechContext";
import { useVoiceAssistant } from "../context/VoiceAssistantContext";
import { absoluteAdMediaUrl, activateAdCampaign, getActiveAdPlaylist, getPendingAdPayment, recordAdPlay } from "../services/adApi";
import { normalizePaymentQrValue } from "../utils/paymentQr";
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
  const { pauseListening, resumeListening, listeningPaused } = useVoiceAssistant();
  const wasListeningPausedRef = useRef(listeningPaused);
  wasListeningPausedRef.current = listeningPaused;
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


  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [dismissedRequestId, setDismissedRequestId] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [backendError, setBackendError] = useState('');
  const lifecycleRef = useRef(null);
  const activationRef = useRef(false);
  const suppressClickUntilRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const activePlayRef = useRef(null);
  const currentAd = eligibleAds.length ? eligibleAds[currentAdIndex % eligibleAds.length] : null;
  const paymentVisible = isHome && pendingPayment && pendingPayment.requestId !== dismissedRequestId;
  const paymentQrValue = normalizePaymentQrValue(pendingPayment?.paymentUrl);
  const overlayActive = isHome && (isAdActive || Boolean(paymentVisible) || isKeypadOpen);
  const isBuiltInFallback = false;

  const stopVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.pause();
    }
  }, []);

  const finishPlay = useCallback((interrupted) => {
    const play = activePlayRef.current;
    activePlayRef.current = null;
    if (play) void recordAdPlay(play.campaignId, {
      startedAt: play.startedAt, completed: !interrupted, interruptedByUser: interrupted,
    });
  }, []);

  const advanceToNextAd = useCallback(() => {
    stopVideo();
    finishPlay(false);
    setCurrentAdIndex(prev => eligibleAds.length ? (prev + 1) % eligibleAds.length : 0);
    setCurrentSlideType('attract');
  }, [eligibleAds.length, finishPlay, stopVideo]);

  // The Pi is authoritative: phone localStorage cannot notify another device.
  // Serial polling prevents overlapping requests and stale post-navigation updates.
  useEffect(() => {
    const controller = new AbortController();
    lifecycleRef.current = controller;
    let timer;
    if (isHome) {
      const poll = async () => {
        try {
          const [payment, playlist] = await Promise.all([
            getPendingAdPayment({ signal: controller.signal }),
            getActiveAdPlaylist({ signal: controller.signal }),
          ]);
          if (controller.signal.aborted) return;
          const pending = payment.pending;
          const next = pending && typeof pending.campaignId === 'string' && pending.campaignId && typeof pending.requestId === 'string' && pending.requestId && Number.isInteger(pending.amountPaise) && pending.amountPaise > 0
            ? {
                campaignId: pending.campaignId, requestId: pending.requestId,
                paymentUrl: pending.expiresAt && Number(pending.expiresAt) <= Date.now() ? '' : normalizePaymentQrValue(pending.paymentUrl),
                venueName: typeof pending.venueName === 'string' ? pending.venueName : 'Reliv kiosk',
                durationDays: Number(pending.durationDays) || 0,
                priceRupees: Number(pending.amountPaise) / 100,
              } : null;
          if (pending && !next) throw new Error('The kiosk returned an incomplete ad payment. Please retry.');
          const ads = (Array.isArray(playlist.ads) ? playlist.ads : [])
            .filter(ad => ad && typeof ad.campaignId === 'string' && ['image', 'video'].includes(ad.mediaType))
            .map(ad => ({ ...ad, mediaUrl: absoluteAdMediaUrl(ad.mediaUrl) }))
            .filter(ad => ad.mediaUrl);
          setPendingPayment(prev => JSON.stringify(prev) === JSON.stringify(next) ? prev : next);
          setEligibleAds(prev => JSON.stringify(prev) === JSON.stringify(ads) ? prev : ads);
          setBackendError('');
        } catch (error) {
          if (!controller.signal.aborted) {
            setBackendError(error.message || 'Advertising service unavailable.');
            setEligibleAds([]);
            setIsAdActive(false);
            stopVideo();
          }
        } finally {
          if (!controller.signal.aborted) timer = setTimeout(poll, 2500);
        }
      };
      void poll();
    }
    return () => {
      controller.abort();
      clearTimeout(timer);
      stopVideo();
      finishPlay(true);
      activationRef.current = false;
    };
  }, [isHome, stopVideo, finishPlay]);

  const resetIdleTimer = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    if (!isHome || paymentVisible || isKeypadOpen || isBookingOpen || isAdActive || !eligibleAds.length) return;
    const remaining = Math.max(0, IDLE_TIMEOUT_MS - (Date.now() - lastActivityRef.current));
    idleTimerRef.current = setTimeout(() => {
      setCurrentSlideType('attract');
      setIsAdActive(true);
    }, remaining);
  }, [isHome, paymentVisible, isKeypadOpen, isBookingOpen, isAdActive, eligibleAds.length]);

  const exitAdMode = useCallback((event) => {
    event?.preventDefault();
    event?.stopPropagation();
    event?.nativeEvent?.stopImmediatePropagation?.();
    stopVideo();
    finishPlay(true);
    suppressClickUntilRef.current = Date.now() + 500;
    lastActivityRef.current = Date.now();
    setIsAdActive(false);
  }, [finishPlay, stopVideo]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('reliv_ad_audio_focus', { detail: { owner: 'player', active: overlayActive } }));
    const shouldResume = overlayActive && !wasListeningPausedRef.current;
    if (overlayActive) {
      stopSpeech();
      pauseListening();
    }
    return () => {
      window.dispatchEvent(new CustomEvent('reliv_ad_audio_focus', { detail: { owner: 'player', active: false } }));
      if (shouldResume) resumeListening();
    };
  }, [overlayActive, stopSpeech, pauseListening, resumeListening]);

  useEffect(() => {
    const activity = () => {
      lastActivityRef.current = Date.now();
      if (!isAdActive) resetIdleTimer();
    };
    const swallowClick = event => {
      if (Date.now() < suppressClickUntilRef.current) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    const booking = event => {
      setIsBookingOpen(Boolean(event.detail));
      lastActivityRef.current = Date.now();
      if (event.detail) { stopVideo(); finishPlay(true); setIsAdActive(false); }
    };
    window.addEventListener('pointerdown', activity, { passive: true });
    window.addEventListener('keydown', activity);
    window.addEventListener('reliv_splash_overlay', booking);
    document.addEventListener('click', swallowClick, true);
    resetIdleTimer();
    return () => {
      window.removeEventListener('pointerdown', activity);
      window.removeEventListener('keydown', activity);
      window.removeEventListener('reliv_splash_overlay', booking);
      document.removeEventListener('click', swallowClick, true);
      clearTimeout(idleTimerRef.current);
    };
  }, [isAdActive, resetIdleTimer, stopVideo, finishPlay]);

  useEffect(() => {
    if (!isHome || paymentVisible || isBookingOpen) {
      stopVideo();
      finishPlay(true);
      setIsAdActive(false);
      clearTimeout(rotationTimerRef.current);
      if (!isHome) {
        setIsKeypadOpen(false);
        setIsActivating(false);
        lastActivityRef.current = Date.now();
      }
    }
  }, [isHome, paymentVisible, isBookingOpen, stopVideo, finishPlay]);

  useEffect(() => {
    clearTimeout(rotationTimerRef.current);
    if (!isHome || !isAdActive || !currentAd) return;
    if (currentSlideType === 'attract') {
      rotationTimerRef.current = setTimeout(() => setCurrentSlideType('ad'), RELIV_ATTRACT_DURATION_MS);
    } else {
      const seconds = Number(currentAd.durationSeconds);
      const duration = currentAd.mediaType === 'video'
        ? (Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 300) * 1000 : 30000)
        : DEFAULT_IMAGE_DURATION_MS;
      activePlayRef.current = { campaignId: currentAd.campaignId, startedAt: Date.now() };
      rotationTimerRef.current = setTimeout(advanceToNextAd, duration);
    }
    return () => clearTimeout(rotationTimerRef.current);
  }, [isHome, isAdActive, currentSlideType, currentAd, advanceToNextAd]);

  useEffect(() => {
    const open = () => {
      if (!isHome) return;
      stopVideo(); finishPlay(true); setIsAdActive(false);
      setDismissedRequestId('');
      setIsKeypadOpen(true);
      setEnteredCode('');
      setActivationFeedback(null);
      setActivatedSuccessData(null);
    };
    window.addEventListener('reliv_open_ad_keypad', open);
    return () => window.removeEventListener('reliv_open_ad_keypad', open);
  }, [isHome, finishPlay, stopVideo]);

  const handleKeypadPress = digit => {
    if (!activationRef.current) setEnteredCode(prev => prev.length < 4 ? prev + digit : prev);
  };
  const handleKeypadBackspace = () => {
    if (!activationRef.current) { setEnteredCode(prev => prev.slice(0, -1)); setActivationFeedback(null); }
  };
  const handleKeypadClear = () => {
    if (!activationRef.current) { setEnteredCode(''); setActivationFeedback(null); }
  };
  const handleActivate = async () => {
    if (activationRef.current || !/^\d{4}$/.test(enteredCode)) return;
    const lifecycle = lifecycleRef.current;
    if (!pendingPayment || lifecycle?.signal.aborted) {
      setActivationFeedback({ message: 'No ad payment is waiting. Please complete your booking first.' });
      return;
    }
    activationRef.current = true;
    setIsActivating(true);
    setActivationFeedback(null);
    try {
      const result = await activateAdCampaign({
        campaignId: pendingPayment.campaignId, requestId: pendingPayment.requestId, code: enteredCode,
      }, { signal: lifecycle.signal });
      if (lifecycle.signal.aborted) return;
      if (!['ACTIVE', 'SCHEDULED'].includes(result.status || result.campaign?.status)) {
        throw new Error('The kiosk has not confirmed activation. Retry here; do not pay again.');
      }
      setActivatedSuccessData({
        isScheduled: result.status === 'SCHEDULED' || result.campaign?.status === 'SCHEDULED',
        campaign: result.campaign || {},
      });
      setDismissedRequestId(pendingPayment.requestId);
      setPendingPayment(null);
    } catch (error) {
      if (!lifecycle.signal.aborted) {
        setActivationFeedback({ message: error.message || 'Activation unavailable. Retry; do not pay again.' });
        setEnteredCode('');
      }
    } finally {
      if (lifecycleRef.current === lifecycle && !lifecycle.signal.aborted) {
        activationRef.current = false;
        setIsActivating(false);
      }
    }
  };
  const clearPendingPayment = () => {
    setDismissedRequestId(pendingPayment?.requestId || '');
    setIsKeypadOpen(false);
    lastActivityRef.current = Date.now();
  };

  const handleVideoReady = useCallback((event) => {
    const video = event.currentTarget;
    if (!isHome || !isAdActive || currentSlideType !== 'ad' || paymentVisible || isKeypadOpen || isBookingOpen) return;
    video.volume = currentAd?.hasAudio === false ? 0 : 0.3;
    video.muted = false;
    video.play()?.catch(() => {
      if (!video.isConnected) return;
      video.muted = true;
      video.play()?.catch(advanceToNextAd);
    });
  }, [isHome, isAdActive, currentSlideType, paymentVisible, isKeypadOpen, isBookingOpen, currentAd, advanceToNextAd]);

  return (
    <>
      {/* 1. PHYSICAL KIOSK PAYMENT SCREEN (VERY LARGE QR ON KIOSK DISPLAY) */}
      {paymentVisible && (
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
                  Back to health
                </button>
              </div>
            </div>

            {/* VERY LARGE PAYMENT QR ON KIOSK */}
            <div className="kiosk-pay-right">
              <div className="kiosk-large-qr-wrap">
                {paymentQrValue ? (
                  <QRCodeSVG
                    value={paymentQrValue}
                    size={300}
                    level="M"
                    marginSize={4}
                    boostLevel={false}
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                    role="img"
                    aria-label="Secure Reliv advertisement payment QR code"
                    title="Scan with a phone camera or Google Lens"
                    style={{ display: 'block', width: '100%', height: 'auto' }}
                  />
                ) : (
                  <div className="kiosk-payment-qr-pending" role="status">
                    {backendError || 'Secure payment QR is unavailable or expired. Please return to booking.'}
                  </div>
                )}
              </div>
              <span style={{ fontSize: '13px', color: '#64748b', marginTop: '12px', fontWeight: 600 }}>
                Scan with your phone camera or Google Lens
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. FULL-SCREEN AD PLAYER OVERLAY */}
      {isHome && isAdActive && !paymentVisible && !isKeypadOpen && !isBookingOpen && (
        <div 
          className="kiosk-ad-player-overlay"
          onPointerDownCapture={exitAdMode}
          onKeyDown={exitAdMode}
          role="button"
          tabIndex={0}
          aria-label="Advertisement. Touch to start your health check."
          title="Touch anywhere to resume Reliv"
        >
          {currentSlideType === 'attract' || !currentAd ? (
            /* Reliv Attract Screen (5s) */
            <div className="reliv-attract-screen">
              <div className="attract-ambient attract-ambient-one" />
              <div className="attract-ambient attract-ambient-two" />
              <div className="attract-content">
                <div className="attract-logo-wrap">
                  <span className="attract-logo-icon"><RelivHeartSvg className="ad-reliv-heart" /></span>
                  <span>RELIV HEALTH</span>
                </div>
                <div className="attract-kicker">A smarter health check, right here</div>
                <h1 className="attract-title">Know your body.<br />In under 3 minutes.</h1>
                <p className="attract-subtitle">
                  Blood pressure, oxygen, BMI, temperature and clear wellness guidance — in one simple checkup.
                </p>
                <div className="attract-metrics" aria-hidden="true">
                  <span>Blood Pressure</span><i />
                  <span>SpO₂ & Pulse</span><i />
                  <span>Body Composition</span>
                </div>
                <div className="attract-touch-prompt">
                  <FingerTouchSvg />
                  <span>Touch anywhere to begin</span>
                </div>
              </div>
              <div className="attract-progress" aria-hidden="true"><span /></div>
            </div>
          ) : (
            /* Active Advertisement Screen */
            <div className="kiosk-ad-canvas">
              {/* Top-Right Label */}
              <div className="ad-system-pill-top">
                ADVERTISEMENT
              </div>

              {/* Blurred background wings if not true 16:9 */}
              {!currentAd.isTrue16x9 && !isBuiltInFallback && (
                currentAd.mediaType === 'video' ? (
                  <div className="ad-video-wings" />
                ) : (
                  <img 
                    src={currentAd.mediaUrl}
                    alt="wings" 
                    className="ad-blur-wings" 
                  />
                )
              )}

              {/* Sharp Foreground Creative */}
              {isBuiltInFallback ? (
                <div className="reliv-house-ad">
                  <div className="house-ad-mark"><RelivHeartSvg /></div>
                  <div className="house-ad-kicker">RELIV HEALTH CHECKUP</div>
                  <h2>Small check.<br />Powerful habit.</h2>
                  <p>Understand your everyday health in minutes.</p>
                  <div className="house-ad-tags"><span>Fast</span><span>Private</span><span>Paperless</span></div>
                </div>
              ) : currentAd.mediaType === 'video' ? (
                <video 
                  key={currentAd.campaignId || currentAd.mediaUrl}
                  ref={videoRef}
                  src={currentAd.mediaUrl} 
                  className={`ad-foreground-media ${currentAd.isTrue16x9 ? 'edge-to-edge' : ''}`}
                  autoPlay
                  muted
                  playsInline 
                  onCanPlay={handleVideoReady}
                  onEnded={advanceToNextAd}
                  onError={advanceToNextAd}
                />
              ) : (
                <img 
                  src={currentAd.mediaUrl}
                  alt={currentAd.brandName || "Reliv Ad"} 
                  className={`ad-foreground-media ${currentAd.isTrue16x9 ? 'edge-to-edge' : ''}`}
                  onError={advanceToNextAd}
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

              <button type="button" className="btn-primary-ads" disabled={isActivating || enteredCode.length !== 4 || !pendingPayment} onClick={handleActivate}>
                {isActivating ? 'Verifying…' : 'Verify activation code'}
              </button>
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
                <div><strong>Venue:</strong> {activatedSuccessData.campaign.venueName || 'Reliv kiosk'}</div>
                <div><strong>Duration:</strong> {activatedSuccessData.campaign.startDate || 'As booked'} {activatedSuccessData.campaign.endDate ? 'to ' + activatedSuccessData.campaign.endDate : ''}</div>
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
