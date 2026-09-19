// src/pages/Advertise.jsx
import React, { useState, useMemo, useRef } from "react";
import { 
  calculatePricing, 
  VENUES, 
  DURATION_TIERS, 
  savePendingCampaign 
} from "../utils/adCryptoLocal";
import "./Advertise.css";

// Clean SVG Icons
const RelivHeartSvg = () => (
  <svg className="ads-reliv-svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const CheckSvg = ({ className = "badge-check-svg" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const UploadSvg = () => (
  <svg className="upload-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const FingerTouchSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
  </svg>
);

export default function Advertise() {
  const [currentStep, setCurrentStep] = useState(1); // 1: Schedule, 2: Creative, 3: Review & Pay

  // Step 1: Schedule State
  const [selectedVenue, setSelectedVenue] = useState('gurukul');
  const [selectedDays, setSelectedDays] = useState(3);
  const [isAllDay, setIsAllDay] = useState(true);
  const [startHour, setStartHour] = useState(10);
  const [endHour, setEndHour] = useState(18);

  // Step 2: Creative State
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [aspectRatioCategory, setAspectRatioCategory] = useState('landscape'); // 'landscape' | 'portrait' | 'square'
  const [isTrue16x9, setIsTrue16x9] = useState(false);
  const [videoDuration, setVideoDuration] = useState(12);
  const [hasAudio, setHasAudio] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showVideoLengthNotice, setShowVideoLengthNotice] = useState(false);
  const fileInputRef = useRef(null);

  // Step 3: Interactive Preview State
  const [isSandboxTouching, setIsSandboxTouching] = useState(false);
  const [showSafeArea, setShowSafeArea] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);

  // Authoritative Pricing
  const pricing = useMemo(() => {
    return calculatePricing({
      venueSelection: selectedVenue,
      durationDays: selectedDays,
      isAllDay,
      startHour,
      endHour
    });
  }, [selectedVenue, selectedDays, isAllDay, startHour, endHour]);

  // Handle Media File Upload
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setIsReady(false);
    setShowVideoLengthNotice(false);

    const isVid = file.type.startsWith('video');
    setMediaType(isVid ? 'video' : 'image');
    setMediaFile(file);

    const objectUrl = URL.createObjectURL(file);
    setMediaUrl(objectUrl);

    if (isVid) {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = objectUrl;
      tempVideo.onloadedmetadata = () => {
        const width = tempVideo.videoWidth;
        const height = tempVideo.videoHeight;
        const dur = Math.round(tempVideo.duration) || 12;
        setVideoDuration(dur);
        setHasAudio(Boolean(tempVideo.webkitAudioDecodedByteCount !== 0 || tempVideo.mozHasAudio || true));

        const ratio = width / height;
        // Strictly true 16:9 check (1.74 <= ratio <= 1.81)
        if (ratio >= 1.74 && ratio <= 1.81) {
          setIsTrue16x9(true);
          setAspectRatioCategory('landscape');
        } else if (ratio > 1.0) {
          setIsTrue16x9(false);
          setAspectRatioCategory('landscape');
        } else if (ratio < 0.85) {
          setIsTrue16x9(false);
          setAspectRatioCategory('portrait');
        } else {
          setIsTrue16x9(false);
          setAspectRatioCategory('square');
        }

        if (dur > 15) {
          setShowVideoLengthNotice(true);
        }

        setTimeout(() => {
          setIsUploading(false);
          setIsReady(true);
        }, 800);
      };
    } else {
      const tempImg = new Image();
      tempImg.src = objectUrl;
      tempImg.onload = () => {
        const width = tempImg.naturalWidth;
        const height = tempImg.naturalHeight;
        const ratio = width / height;

        // Strictly true 16:9 check (1.74 <= ratio <= 1.81)
        if (ratio >= 1.74 && ratio <= 1.81) {
          setIsTrue16x9(true);
          setAspectRatioCategory('landscape');
        } else if (ratio > 1.0) {
          setIsTrue16x9(false);
          setAspectRatioCategory('landscape');
        } else if (ratio < 0.85) {
          setIsTrue16x9(false);
          setAspectRatioCategory('portrait');
        } else {
          setIsTrue16x9(false);
          setAspectRatioCategory('square');
        }

        setTimeout(() => {
          setIsUploading(false);
          setIsReady(true);
        }, 600);
      };
    }
  };

  // Interactive Sandbox Tap Test
  const handlePreviewTap = () => {
    setIsSandboxTouching(true);
    setTimeout(() => {
      setIsSandboxTouching(false);
    }, 2000);
  };

  // Confirm & Pay Flow
  const handleConfirmAndPay = () => {
    const venueObj = VENUES.find(v => v.id === selectedVenue) || { name: 'All Venues' };
    const today = new Date();
    const startOffset = selectedVenue === 'gurukul' ? 0 : 1;
    const startDateObj = new Date(today.getTime() + (startOffset * 86400000));
    const endDateObj = new Date(startDateObj.getTime() + (selectedDays * 86400000));

    const campaignData = {
      venueId: selectedVenue,
      venueName: selectedVenue === 'all' ? 'All Venues (3 Kiosks)' : venueObj.name,
      durationDays: selectedDays,
      isAllDay,
      dailyStartHour: isAllDay ? 0 : startHour,
      dailyEndHour: isAllDay ? 24 : endHour,
      startDate: startDateObj.toISOString().split('T')[0],
      endDate: endDateObj.toISOString().split('T')[0],
      mediaType,
      aspectRatio: isTrue16x9 ? '16:9' : aspectRatioCategory,
      isTrue16x9,
      hasAudio,
      mediaUrl: mediaUrl || '/gurukul-ad.png',
      priceRupees: pricing.totalPrice
    };

    savePendingCampaign(campaignData);
    setIsSavedModalOpen(true);
  };

  return (
    <div className="reliv-ads-portal">
      <div className="ads-container">
        
        {/* Apple-style Restrained Header */}
        <header className="ads-header">
          <div className="ads-logo-wrap">
            <RelivHeartSvg />
            <span className="ads-reliv-title">Reliv Ads</span>
          </div>
          <h1 className="ads-headline">Put your brand on Reliv</h1>
          <p className="ads-subheadline">
            Reach people while Reliv is idle.
          </p>
          <div className="ads-pricing-pill">
            From ₹50/day · 3 days ₹117
          </div>
        </header>

        {/* Clean 3-Step Navigation */}
        <div className="ads-steps-bar">
          <div 
            className={`ads-step-item ${currentStep === 1 ? 'active' : 'completed'}`}
            onClick={() => setCurrentStep(1)}
          >
            <span className="ads-step-dot" />
            <span>Schedule</span>
          </div>
          <div className="ads-step-line" />
          <div 
            className={`ads-step-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}
            onClick={() => currentStep > 1 && setCurrentStep(2)}
          >
            <span className="ads-step-dot" />
            <span>Creative</span>
          </div>
          <div className="ads-step-line" />
          <div 
            className={`ads-step-item ${currentStep === 3 ? 'active' : ''}`}
            onClick={() => isReady && setCurrentStep(3)}
          >
            <span className="ads-step-dot" />
            <span>Review</span>
          </div>
        </div>

        {/* SCREEN 1: SCHEDULE */}
        {currentStep === 1 && (
          <div className="ads-card">
            <h2 className="ads-section-title">Where should your ad appear?</h2>
            <p className="ads-section-sub">11.6″ Full-HD Reliv displays · Up to 8 concurrent sponsors</p>

            <div className="venue-options-list">
              {VENUES.map(v => (
                <button
                  key={v.id}
                  type="button"
                  className={`venue-card-btn ${selectedVenue === v.id ? 'selected' : ''}`}
                  onClick={() => setSelectedVenue(v.id)}
                >
                  <div>
                    <span className="venue-name">{v.name}</span>
                    <span className={`venue-status-text ${v.isCurrent ? 'current' : ''}`}>
                      {v.isCurrent && <span style={{ color: '#15803d' }}>●</span>}
                      {v.statusText}
                    </span>
                  </div>
                  {selectedVenue === v.id && <CheckSvg />}
                </button>
              ))}

              {/* All Venues Option */}
              <button
                type="button"
                className={`venue-card-btn ${selectedVenue === 'all' ? 'selected' : ''}`}
                onClick={() => setSelectedVenue('all')}
              >
                <div>
                  <span className="venue-name">All Venues</span>
                  <span className="venue-status-text">
                    Gurukul + DPS Megacity + Beeu Resorts
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="venue-badge-pill badge-reach-20">BEST REACH · SAVE 20%</span>
                  {selectedVenue === 'all' && <CheckSvg />}
                </div>
              </button>
            </div>

            <h2 className="ads-section-title">How long?</h2>
            <div className="duration-chips-grid">
              {DURATION_TIERS.map(t => (
                <div
                  key={t.days}
                  className={`duration-chip ${selectedDays === t.days ? 'selected' : ''}`}
                  onClick={() => setSelectedDays(t.days)}
                >
                  {t.tag && <span className="duration-tag">{t.tag}</span>}
                  <span className="duration-days">{t.days} {t.days === 1 ? 'Day' : 'Days'}</span>
                  <div className="duration-price-row">
                    {t.savings && <span className="duration-price-strike">₹{t.basePrice}</span>}
                    <span className="duration-price">₹{t.launchPrice}</span>
                  </div>
                  <span className="duration-rate">₹{t.perDay}/day</span>
                </div>
              ))}
            </div>

            <h2 className="ads-section-title">When should it run?</h2>
            <div className="timing-tabs">
              <button
                type="button"
                className={`timing-tab ${isAllDay ? 'active' : ''}`}
                onClick={() => setIsAllDay(true)}
              >
                All Day
              </button>
              <button
                type="button"
                className={`timing-tab ${!isAllDay ? 'active' : ''}`}
                onClick={() => setIsAllDay(false)}
              >
                Choose Hours
              </button>
            </div>

            {!isAllDay && (
              <div className="hours-picker-box">
                <div>
                  <span>From: </span>
                  <select 
                    className="hour-select"
                    value={startHour} 
                    onChange={e => setStartHour(parseInt(e.target.value, 10))}
                  >
                    {[8, 9, 10, 11, 12, 13, 14].map(h => (
                      <option key={h} value={h}>{h}:00 AM</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span>To: </span>
                  <select 
                    className="hour-select"
                    value={endHour} 
                    onChange={e => setEndHour(parseInt(e.target.value, 10))}
                  >
                    {[15, 16, 17, 18, 19, 20, 21, 22].map(h => (
                      <option key={h} value={h}>{h > 12 ? `${h - 12}:00 PM` : `${h}:00 PM`}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Clean Pricing Quote */}
            <div className="pricing-quote-banner">
              <div>
                <div className="quote-total">₹{pricing.totalPrice} total</div>
                <div className="quote-breakdown">₹{pricing.effectivePerDay}/day with this plan</div>
                {pricing.savings > 0 && (
                  <div className="quote-savings">Save ₹{pricing.savings} launch discount</div>
                )}
              </div>
              <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 600 }}>● Available</span>
            </div>

            <p className="quote-notice">
              Your ad runs while Reliv is idle. Health sessions always come first.
            </p>

            <button
              type="button"
              className="btn-primary-ads"
              onClick={() => setCurrentStep(2)}
            >
              Continue to Creative →
            </button>
          </div>
        )}

        {/* SCREEN 2: CREATIVE UPLOAD */}
        {currentStep === 2 && (
          <div className="ads-card">
            <h2 className="ads-section-title">Add your advertisement</h2>
            <p className="ads-section-sub">
              Landscape looks best. Portrait and square ads are automatically optimized.
            </p>

            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }}
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
              onChange={handleFileChange}
            />

            <div className="upload-drop-zone" onClick={() => fileInputRef.current?.click()}>
              <UploadSvg />
              <div className="upload-title">
                {mediaFile ? mediaFile.name : 'Photo or Video'}
              </div>
              <div className="upload-hint">
                JPG, PNG, WebP, MP4 or MOV
              </div>
              <span className="upload-limits-pill">
                Image ≤ 20 MB · Video ≤ 150 MB, max 15s
              </span>
            </div>

            {isUploading && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6e6e73', fontSize: '14px' }}>
                Optimizing creative for Reliv…
              </div>
            )}

            {isReady && (
              <div style={{ marginTop: '18px' }}>
                {isTrue16x9 ? (
                  <div className="fit-status-pill fit-perfect">
                    ⭐ Perfect Fit — Edge-to-edge full screen
                  </div>
                ) : (
                  <div className="fit-status-pill fit-optimized">
                    ✓ {aspectRatioCategory === 'portrait' ? 'Portrait Optimized' : aspectRatioCategory === 'square' ? 'Square Optimized' : 'Optimized for Reliv'}
                  </div>
                )}

                {hasAudio && (
                  <div style={{ fontSize: '12px', color: '#6e6e73', marginTop: '8px' }}>
                    🔊 Audio included (volume automatically balanced on kiosk)
                  </div>
                )}

                {showVideoLengthNotice && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px', fontSize: '13px', color: '#92400e', marginTop: '12px' }}>
                    Your video is {videoDuration} seconds. Reliv ad slots support up to 15 seconds. We'll use the first 15 seconds.
                  </div>
                )}

                <button
                  type="button"
                  className="btn-primary-ads"
                  onClick={() => setCurrentStep(3)}
                >
                  Preview on Reliv Screen →
                </button>
              </div>
            )}

            <button
              type="button"
              className="link-secondary-action"
              onClick={() => setCurrentStep(1)}
            >
              ← Back to Schedule
            </button>
          </div>
        )}

        {/* SCREEN 3: REVIEW & PAY */}
        {currentStep === 3 && (
          <div className="ads-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 className="ads-section-title" style={{ margin: 0 }}>Your ad on Reliv</h2>
              <button 
                type="button" 
                className="link-secondary-action"
                style={{ margin: 0, fontSize: '12px' }}
                onClick={() => setShowSafeArea(!showSafeArea)}
              >
                {showSafeArea ? 'Hide safe area' : 'Show safe area'}
              </button>
            </div>

            {/* True 16:9 Kiosk Preview */}
            <div className="kiosk-preview-frame" onClick={handlePreviewTap} title="Tap to test instant exit">
              {isSandboxTouching ? (
                /* Simulated Reliv Home Screen after touch */
                <div style={{ width: '100%', height: '100%', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ffffff', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <RelivHeartSvg />
                    <span style={{ fontSize: '20px', fontWeight: 800 }}>RELIV HEALTH KIOSK</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                    Touch detected — Reliv resumes instantly.
                  </div>
                </div>
              ) : (
                <div className="preview-media-container">
                  {/* Top-Right Translucent Label */}
                  <div className="kiosk-system-pill-top">
                    ADVERTISEMENT
                  </div>

                  {/* Blurred wings if non-16:9 */}
                  {!isTrue16x9 && (
                    mediaType === 'video' ? (
                      <video src={mediaUrl} className="preview-blur-bg" autoPlay loop muted playsInline />
                    ) : (
                      <img src={mediaUrl || '/gurukul-ad.png'} alt="blur-bg" className="preview-blur-bg" />
                    )
                  )}

                  {/* Sharp Foreground Creative */}
                  {mediaType === 'video' ? (
                    <video 
                      src={mediaUrl} 
                      className={`preview-main-media ${isTrue16x9 ? 'edge-to-edge' : ''}`}
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                    />
                  ) : (
                    <img 
                      src={mediaUrl || '/gurukul-ad.png'} 
                      alt="Ad Preview" 
                      className={`preview-main-media ${isTrue16x9 ? 'edge-to-edge' : ''}`}
                    />
                  )}

                  {/* Safe Area Visual Overlay (Optional) */}
                  {showSafeArea && (
                    <div style={{ position: 'absolute', inset: 0, border: '1px dashed rgba(234,88,12,0.6)', pointerEvents: 'none', zIndex: 9 }} />
                  )}

                  {/* Bottom-Center Floating Reliv System Pill */}
                  <div className="kiosk-system-pill-bottom">
                    <span style={{ color: '#ea580c', display: 'flex', alignItems: 'center' }}>
                      <RelivHeartSvg />
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px' }}>
                      RELIV TOUCH TO START
                    </span>
                    <span style={{ opacity: 0.8, display: 'flex', alignItems: 'center' }}>
                      <FingerTouchSvg />
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="preview-touch-helper">
              Touch anywhere → Reliv opens instantly
            </div>

            {/* Clean Invoice-Free Summary */}
            <div className="review-clean-summary">
              <div className="review-row-line">
                <span style={{ fontWeight: 700 }}>
                  {selectedVenue === 'all' ? 'All Venues (3 Kiosks)' : VENUES.find(v => v.id === selectedVenue)?.name}
                </span>
                <span className="review-row-sub">
                  {selectedDays} Days · {isAllDay ? 'All day' : `${startHour}:00 - ${endHour > 12 ? endHour - 12 : endHour}:00 PM`}
                </span>
              </div>

              <div className="review-row-line">
                <span style={{ color: '#6e6e73' }}>
                  {mediaType === 'video' ? `${videoDuration}s video` : 'Image'} · {isTrue16x9 ? 'Perfect fit' : 'Optimized'}
                </span>
                <span style={{ color: '#15803d', fontWeight: 600 }}>
                  ₹{pricing.effectivePerDay}/day
                </span>
              </div>

              <div className="review-total-divider" />

              <div className="review-total-row">
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#6e6e73' }}>TOTAL</span>
                <span className="review-total-price">₹{pricing.totalPrice}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                className="link-secondary-action"
                onClick={() => setCurrentStep(2)}
              >
                ✎ Change ad
              </button>
            </div>

            <p className="review-legal-text">
              By continuing, you confirm that you have the right to display this creative.<br />
              Your ad runs while Reliv is idle. Health sessions always come first.
            </p>

            <button
              type="button"
              className="btn-primary-ads"
              onClick={handleConfirmAndPay}
            >
              Confirm & Pay ₹{pricing.totalPrice}
            </button>
          </div>
        )}

        {/* PHONE HANDOFF MODAL (NO QR ON PHONE!) */}
        {isSavedModalOpen && (
          <div className="payment-modal-overlay">
            <div className="payment-modal-card">
              <div className="saved-check-icon">
                <CheckSvg className="badge-check-svg" />
              </div>
              <h3 className="saved-title">Your ad is saved</h3>
              <p className="saved-subtext">It's already safely stored on Reliv.</p>

              <div className="saved-instruction-box">
                <div style={{ marginBottom: '8px' }}>
                  <strong>1. Turn Wi-Fi off</strong> on your phone.
                </div>
                <div>
                  <strong>2. Scan the payment QR</strong> shown on the Reliv kiosk screen.
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#86868b', margin: '0 0 20px 0' }}>
                Your advertisement will not be lost.
              </p>

              <button
                type="button"
                className="btn-primary-ads"
                style={{ marginTop: 0 }}
                onClick={() => setIsSavedModalOpen(false)}
              >
                Got it
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
