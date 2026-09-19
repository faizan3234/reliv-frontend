import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  absoluteAdMediaUrl,
  confirmAdBooking,
  createAdDraft,
  finalizeAd,
  getAdConfig,
  getAdQuote,
  uploadAdFile
} from "../services/adApi";
import "./Advertise.css";

const RelivHeartSvg = ({ className = "ads-reliv-svg" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const CheckSvg = ({ className = "badge-check-svg" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const UploadSvg = () => (
  <svg className="upload-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const FingerTouchSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 11V6a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2"/>
    <path d="M14 10V4a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v2"/>
    <path d="M10 10.5V6a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v8"/>
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
  </svg>
);

const StarSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="m12 2.4 2.83 5.73 6.32.92-4.57 4.45 1.08 6.29L12 16.82l-5.66 2.97 1.08-6.29-4.57-4.45 6.32-.92L12 2.4Z"/>
  </svg>
);

const SpeakerSvg = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.5 8.5a5 5 0 0 1 0 7"/>
    <path d="M19 5a10 10 0 0 1 0 14"/>
  </svg>
);

const formatISTDate = (offsetDays = 0) => {
  const base = new Date(Date.now() + offsetDays * 86400000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(base);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
};

const toMinutes = (hour) => Number(hour) * 60;

export default function Advertise() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState("");
  const [selectedVenue, setSelectedVenue] = useState("gurukul");
  const [selectedDays, setSelectedDays] = useState(3);
  const [startDate, setStartDate] = useState(formatISTDate(0));
  const [isAllDay, setIsAllDay] = useState(true);
  const [startHour, setStartHour] = useState(10);
  const [endHour, setEndHour] = useState(18);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");

  const [campaignId, setCampaignId] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [media, setMedia] = useState(null);
  const [uploadState, setUploadState] = useState("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [isSandboxTouching, setIsSandboxTouching] = useState(false);
  const [showSafeArea, setShowSafeArea] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let alive = true;
    getAdConfig()
      .then((data) => {
        if (!alive) return;
        setConfig(data);
        const current = data.currentVenueId || "gurukul";
        setSelectedVenue(current);
      })
      .catch((err) => alive && setConfigError(err.message));
    return () => { alive = false; };
  }, []);

  const venueIds = useMemo(() => {
    if (selectedVenue === "all") return (config?.venues || []).map((v) => v.id);
    return [selectedVenue];
  }, [selectedVenue, config]);

  const hasRemoteVenue = useMemo(
    () => venueIds.some((id) => id !== config?.currentVenueId),
    [venueIds, config]
  );

  useEffect(() => {
    if (!config) return;
    const min = formatISTDate(hasRemoteVenue ? 1 : 0);
    if (startDate < min) setStartDate(min);
  }, [hasRemoteVenue, config, startDate]);

  useEffect(() => {
    if (!config || venueIds.length === 0) return;
    let alive = true;
    setQuoteError("");
    getAdQuote({ targetVenueIds: venueIds, durationDays: selectedDays })
      .then((data) => alive && setQuote(data.quote))
      .catch((err) => alive && setQuoteError(err.message));
    return () => { alive = false; };
  }, [config, venueIds.join("|"), selectedDays]);

  useEffect(() => {
    if (!campaignId) return;
    setCampaignId("");
    setMediaFile(null);
    setMedia(null);
    setUploadState("idle");
    setUploadProgress(0);
  // Intentionally invalidate a prepared draft whenever schedule changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVenue, selectedDays, startDate, isAllDay, startHour, endHour]);

  const tiers = config?.pricing || [
    { days:1, rupees:50, perDay:50 },
    { days:3, rupees:117, perDay:39, tag:"Most Popular" },
    { days:7, rupees:245, perDay:35 },
    { days:15, rupees:450, perDay:30 },
    { days:30, rupees:750, perDay:25 }
  ];

  const minStartDate = formatISTDate(hasRemoteVenue ? 1 : 0);

  const handleVenue = (id) => {
    setSelectedVenue(id);
    if (id === "all" || id !== config?.currentVenueId) {
      setStartDate((prev) => prev < formatISTDate(1) ? formatISTDate(1) : prev);
    }
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setMediaFile(file);
    setMedia(null);
    setUploadProgress(0);

    const isVideo = file.type === "video/mp4" || file.type === "video/quicktime";
    const allowedImage = ["image/jpeg","image/png","image/webp"].includes(file.type);
    if (!isVideo && !allowedImage) {
      setUploadError("Use JPG, PNG, WebP, MP4 or MOV.");
      return;
    }
    if ((!isVideo && file.size > 20 * 1024 * 1024) || (isVideo && file.size > 150 * 1024 * 1024)) {
      setUploadError(isVideo ? "Video must be 150 MB or smaller." : "Image must be 20 MB or smaller.");
      return;
    }

    try {
      setUploadState("creating");
      const draft = await createAdDraft({
        targetVenueIds: venueIds,
        durationDays: selectedDays,
        startDate,
        isAllDay,
        dailyStartMinute: isAllDay ? 0 : toMinutes(startHour),
        dailyEndMinute: isAllDay ? 1440 : toMinutes(endHour)
      });
      setCampaignId(draft.campaignId);

      setUploadState("uploading");
      await uploadAdFile({
        campaignId: draft.campaignId,
        file,
        onProgress: setUploadProgress
      });

      setUploadState("processing");
      const result = await finalizeAd(draft.campaignId, file);
      setMedia({
        ...result.media,
        previewUrl: absoluteAdMediaUrl(result.media.previewUrl)
      });
      setUploadState("ready");
    } catch (err) {
      setUploadState("error");
      setUploadError(err.message || "Could not prepare this creative.");
    }
  };

  const handlePreviewTap = () => {
    setIsSandboxTouching(true);
    window.setTimeout(() => setIsSandboxTouching(false), 1700);
  };

  const handleConfirm = async () => {
    if (!campaignId || uploadState !== "ready") return;
    try {
      setConfirming(true);
      await confirmAdBooking(campaignId);
      setHandoffOpen(true);
    } catch (err) {
      setUploadError(err.message || "Could not prepare payment.");
    } finally {
      setConfirming(false);
    }
  };

  const selectedVenueName = selectedVenue === "all"
    ? "All Venues"
    : config?.venues?.find((v) => v.id === selectedVenue)?.name || selectedVenue;

  return (
    <div className="reliv-ads-portal">
      <div className="ads-container">
        <header className="ads-header">
          <div className="ads-logo-wrap">
            <RelivHeartSvg />
            <span className="ads-reliv-title">Reliv Ads</span>
          </div>
          <h1 className="ads-headline">Put your brand on Reliv</h1>
          <p className="ads-subheadline">Reach people while Reliv is idle.</p>
          <div className="ads-pricing-pill">From ₹50/day · 3 days ₹117</div>
        </header>

        <div className="ads-steps-bar" aria-label="Booking progress">
          {["Schedule","Creative","Review"].map((label, index) => (
            <React.Fragment key={label}>
              {index > 0 && <div className="ads-step-line" />}
              <button
                type="button"
                className={`ads-step-item ${step === index + 1 ? "active" : step > index + 1 ? "completed" : ""}`}
                onClick={() => {
                  if (index === 0 || (index === 1 && step > 1) || (index === 2 && media)) setStep(index + 1);
                }}
              >
                <span className="ads-step-dot" />
                <span>{label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>

        {configError && <div className="ads-card"><p className="review-legal-text">{configError}</p></div>}

        {step === 1 && (
          <section className="ads-card">
            <h2 className="ads-section-title">Where should your ad appear?</h2>
            <p className="ads-section-sub">11.6″ Full-HD Reliv displays · up to 8 campaigns per time window</p>

            <div className="venue-options-list">
              {(config?.venues || []).map((venue) => (
                <button
                  key={venue.id}
                  type="button"
                  className={`venue-card-btn ${selectedVenue === venue.id ? "selected" : ""}`}
                  onClick={() => handleVenue(venue.id)}
                >
                  <div>
                    <span className="venue-name">{venue.name}</span>
                    <span className={`venue-status-text ${venue.isCurrent ? "current" : ""}`}>
                      {venue.isCurrent ? "Current kiosk · Instant activation" : venue.requiresApproval ? "Scheduled after approval" : "Scheduled placement"}
                    </span>
                  </div>
                  {selectedVenue === venue.id && <CheckSvg />}
                </button>
              ))}
              <button
                type="button"
                className={`venue-card-btn ${selectedVenue === "all" ? "selected" : ""}`}
                onClick={() => handleVenue("all")}
              >
                <div>
                  <span className="venue-name">All Venues</span>
                  <span className="venue-status-text">Gurukul + DPS Megacity + Beeu Resorts</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span className="venue-badge-pill badge-reach-20">BEST REACH · SAVE 20%</span>
                  {selectedVenue === "all" && <CheckSvg />}
                </div>
              </button>
            </div>

            <h2 className="ads-section-title">How long?</h2>
            <div className="duration-chips-grid">
              {tiers.map((tier) => (
                <button
                  key={tier.days}
                  type="button"
                  className={`duration-chip ${selectedDays === tier.days ? "selected" : ""}`}
                  onClick={() => setSelectedDays(tier.days)}
                >
                  {tier.tag && <span className="duration-tag">{tier.tag}</span>}
                  <span className="duration-days">{tier.days} {tier.days === 1 ? "Day" : "Days"}</span>
                  <span className="duration-price">₹{tier.rupees}</span>
                  <span className="duration-rate">₹{tier.perDay}/day</span>
                </button>
              ))}
            </div>

            <h2 className="ads-section-title">When should it run?</h2>
            <div className="hours-picker-box" style={{marginBottom:16}}>
              <label style={{display:"flex",flexDirection:"column",gap:6,width:"100%"}}>
                <span>Starts</span>
                <input
                  type="date"
                  className="hour-select"
                  min={minStartDate}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
            </div>

            <div className="timing-tabs">
              <button type="button" className={`timing-tab ${isAllDay ? "active" : ""}`} onClick={() => setIsAllDay(true)}>All Day</button>
              <button type="button" className={`timing-tab ${!isAllDay ? "active" : ""}`} onClick={() => setIsAllDay(false)}>Choose Hours</button>
            </div>

            {!isAllDay && (
              <div className="hours-picker-box">
                <label>From
                  <select className="hour-select" value={startHour} onChange={(e) => setStartHour(Number(e.target.value))}>
                    {[8,9,10,11,12,13,14,15,16,17,18].map((h) => <option key={h} value={h}>{h > 12 ? h - 12 : h}:00 {h >= 12 ? "PM" : "AM"}</option>)}
                  </select>
                </label>
                <label>To
                  <select className="hour-select" value={endHour} onChange={(e) => setEndHour(Number(e.target.value))}>
                    {[10,11,12,13,14,15,16,17,18,19,20,21,22].filter((h) => h > startHour).map((h) => <option key={h} value={h}>{h > 12 ? h - 12 : h}:00 {h >= 12 ? "PM" : "AM"}</option>)}
                  </select>
                </label>
              </div>
            )}

            <div className="pricing-quote-banner">
              <div>
                <div className="quote-total">{quote ? `₹${quote.finalRupees} total` : "Calculating…"}</div>
                <div className="quote-breakdown">{quote ? `₹${quote.effectivePerDayRupees}/day with this plan` : ""}</div>
                {quote?.discountRupees > 0 && <div className="quote-savings">Save ₹{quote.discountRupees}</div>}
              </div>
              {!quoteError && <span style={{fontSize:13,color:"#15803d",fontWeight:600}}>Available</span>}
            </div>
            {quoteError && <p className="review-legal-text">{quoteError}</p>}

            {hasRemoteVenue && (
              <p className="review-legal-text">
                Remote offline venues are scheduled from the next day. Gurukul, the current kiosk, can activate immediately.
              </p>
            )}
            <p className="quote-notice">Your ad runs while Reliv is idle. Health sessions always come first.</p>
            <button type="button" className="btn-primary-ads" disabled={!quote || Boolean(quoteError)} onClick={() => setStep(2)}>
              Continue to Creative
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="ads-card">
            <h2 className="ads-section-title">Add your advertisement</h2>
            <p className="ads-section-sub">Landscape looks best. Portrait and square ads are automatically optimized.</p>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
              onChange={handleFile}
            />
            <button type="button" className="upload-drop-zone" onClick={() => fileInputRef.current?.click()}>
              <UploadSvg />
              <span className="upload-title">{mediaFile?.name || "Choose Photo or Video"}</span>
              <span className="upload-hint">JPG, PNG, WebP, MP4 or MOV</span>
              <span className="upload-limits-pill">Image ≤ 20 MB · Video ≤ 150 MB · up to 15s displayed</span>
            </button>

            {["creating","uploading","processing"].includes(uploadState) && (
              <div style={{textAlign:"center",padding:20,color:"#6e6e73",fontSize:14}}>
                {uploadState === "uploading" ? `Uploading ${uploadProgress}%` : uploadState === "processing" ? "Optimizing for the Reliv display…" : "Preparing your slot…"}
              </div>
            )}
            {uploadError && <p className="review-legal-text" style={{color:"#b91c1c"}}>{uploadError}</p>}

            {media && (
              <div style={{marginTop:18}}>
                <div className={`fit-status-pill ${media.isTrue16x9 ? "fit-perfect" : "fit-optimized"}`}>
                  {media.isTrue16x9 ? <><StarSvg /> Perfect Fit · Edge-to-edge</> : <><CheckSvg /> {media.aspectRatio === "portrait" ? "Portrait Optimized" : media.aspectRatio === "square" ? "Square Optimized" : "Optimized for Reliv"}</>}
                </div>
                {media.hasAudio && <div style={{fontSize:12,color:"#6e6e73",marginTop:8,display:"flex",gap:6,alignItems:"center"}}><SpeakerSvg /> Audio included · kiosk playback is volume-limited</div>}
                <button type="button" className="btn-primary-ads" onClick={() => setStep(3)}>Preview on Reliv Screen</button>
              </div>
            )}
            <button type="button" className="link-secondary-action" onClick={() => setStep(1)}>Back to Schedule</button>
          </section>
        )}

        {step === 3 && media && (
          <section className="ads-card">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <h2 className="ads-section-title" style={{margin:0}}>Your ad on Reliv</h2>
              <button type="button" className="link-secondary-action" style={{margin:0,fontSize:12}} onClick={() => setShowSafeArea((v) => !v)}>
                {showSafeArea ? "Hide safe area" : "Show safe area"}
              </button>
            </div>

            <div className="kiosk-preview-frame" onPointerDown={handlePreviewTap} role="button" tabIndex={0}>
              {isSandboxTouching ? (
                <div style={{width:"100%",height:"100%",background:"#f5f5f7",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#1d1d1f"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,color:"#ea580c"}}><RelivHeartSvg /><strong style={{fontSize:22}}>Reliv</strong></div>
                  <div style={{fontSize:13,color:"#6e6e73",marginTop:8}}>Health Checkup & Medicine Dispenser</div>
                </div>
              ) : (
                <div className="preview-media-container">
                  <div className="kiosk-system-pill-top">ADVERTISEMENT</div>
                  {media.mediaType === "video"
                    ? <video src={media.previewUrl} className="preview-main-media edge-to-edge" autoPlay loop muted playsInline />
                    : <img src={media.previewUrl} className="preview-main-media edge-to-edge" alt="Your advertisement preview" />}
                  {showSafeArea && <div style={{position:"absolute",inset:12,border:"1px dashed rgba(255,255,255,.72)",pointerEvents:"none",zIndex:9,borderRadius:8}} />}
                  <div className="kiosk-system-pill-bottom">
                    <span style={{color:"#ea580c",display:"flex"}}><RelivHeartSvg /></span>
                    <span style={{fontSize:13,fontWeight:700,letterSpacing:".5px"}}>RELIV · TOUCH TO START</span>
                    <span className="ad-system-touch-anim"><FingerTouchSvg /></span>
                  </div>
                </div>
              )}
            </div>
            <div className="preview-touch-helper">Try it · touch anywhere and Reliv returns instantly</div>

            <div className="review-clean-summary">
              <div className="review-row-line">
                <span style={{fontWeight:700}}>{selectedVenueName}</span>
                <span className="review-row-sub">{selectedDays} {selectedDays === 1 ? "day" : "days"} · {isAllDay ? "All day" : `${startHour}:00–${endHour > 12 ? endHour - 12 : endHour}:00 ${endHour >= 12 ? "PM" : "AM"}`}</span>
              </div>
              <div className="review-row-line">
                <span style={{color:"#6e6e73"}}>{media.mediaType === "video" ? `${Math.round(media.durationSeconds)}s video` : "Image"} · {media.isTrue16x9 ? "Perfect fit" : "Optimized"}</span>
                <span style={{color:"#15803d",fontWeight:600}}>{quote ? `₹${quote.effectivePerDayRupees}/day` : ""}</span>
              </div>
              <div className="review-total-divider" />
              <div className="review-total-row">
                <span style={{fontSize:14,fontWeight:700,color:"#6e6e73"}}>TOTAL</span>
                <span className="review-total-price">{quote ? `₹${quote.finalRupees}` : ""}</span>
              </div>
            </div>

            <div style={{textAlign:"center"}}><button type="button" className="link-secondary-action" onClick={() => setStep(2)}>Change ad</button></div>
            <p className="review-legal-text">
              By continuing, you confirm that you have the right to display this creative.<br/>
              Your ad runs while Reliv is idle. Health sessions always come first.
            </p>
            {uploadError && <p className="review-legal-text" style={{color:"#b91c1c"}}>{uploadError}</p>}
            <button type="button" className="btn-primary-ads" disabled={confirming} onClick={handleConfirm}>
              {confirming ? "Preparing Payment…" : `Confirm & Pay ₹${quote?.finalRupees ?? ""}`}
            </button>
          </section>
        )}

        {handoffOpen && (
          <div className="payment-modal-overlay" role="dialog" aria-modal="true">
            <div className="payment-modal-card">
              <div className="saved-check-icon"><CheckSvg /></div>
              <h3 className="saved-title">Your ad is saved</h3>
              <p className="saved-subtext">It is already safely stored on this Reliv kiosk.</p>
              <div className="saved-instruction-box">
                <div><strong>1. Turn Wi-Fi off</strong> on your phone.</div>
                <div style={{marginTop:8}}><strong>2. Scan the payment QR</strong> now shown on the physical Reliv screen.</div>
              </div>
              <p style={{fontSize:13,color:"#86868b",margin:"0 0 20px"}}>You will not need to upload your creative again.</p>
              <button type="button" className="btn-primary-ads" style={{marginTop:0}} onClick={() => setHandoffOpen(false)}>Got it</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
