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
import { readAdHandoff, safeAdPaymentUrl, saveAdHandoff } from '../utils/adHandoff';
import RelivBrandLogo from '../components/RelivBrandLogo';

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
const formatHour = (hour) => `${hour % 12 || 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
const formatCampaignDate = (start, offset = 0) => {
  const date = new Date(`${start}T00:00:00+05:30`);
  date.setTime(date.getTime() + offset * 86400000);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric'
  }).format(date) : '';
};

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
  const [previewFailed, setPreviewFailed] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(() => Boolean(readAdHandoff()));
  const [paymentUrl, setPaymentUrl] = useState(() => readAdHandoff()?.paymentUrl || '');
  const [confirming, setConfirming] = useState(false);
  const fileInputRef = useRef(null);
  const uploadControllerRef = useRef(null);
  const confirmingRef = useRef(false);
  const stepHeadingRef = useRef(null);
  const [paymentAmount, setPaymentAmount] = useState(() => readAdHandoff()?.amountPaise || 0);
  const isBusy = confirming || ['creating', 'uploading', 'processing'].includes(uploadState);

  useEffect(() => () => {
    uploadControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    if (handoffOpen) return;
    const controller = new AbortController();
    getAdConfig({ signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(data.venues) || !data.venues.length) throw new Error('The kiosk advertising configuration is unavailable. Connect to RELIV-KIOSK Wi-Fi and retry.');
        setConfig(data);
        const current = data.currentVenueId || "gurukul";
        setSelectedVenue(current);
      })
      .catch((err) => !controller.signal.aborted && setConfigError(err.message));
    return () => controller.abort();
  }, [handoffOpen]);

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
    if (handoffOpen || !config || venueIds.length === 0) return;
    const controller = new AbortController();
    setQuote(null);
    setQuoteError("");
    getAdQuote({ targetVenueIds: venueIds, durationDays: selectedDays }, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        if (!Number.isFinite(data.quote?.finalRupees) || data.quote.finalRupees <= 0) throw new Error('The kiosk could not confirm the price.');
        setQuote(data.quote);
      })
      .catch((err) => !controller.signal.aborted && setQuoteError(err.message));
    return () => controller.abort();
  }, [config, venueIds, selectedDays, handoffOpen]);

  useEffect(() => {
    uploadControllerRef.current?.abort();
    setCampaignId("");
    setMediaFile(null);
    setMedia(null);
    setUploadState("idle");
    setUploadProgress(0);
  // Intentionally invalidate a prepared draft whenever schedule changes.
  }, [selectedVenue, selectedDays, startDate, isAllDay, startHour, endHour]);

  useEffect(() => {
    stepHeadingRef.current?.scrollIntoView?.({ block: 'start', behavior: 'auto' });
  }, [step, handoffOpen]);

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
    if (isBusy) return;
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setPreviewFailed(false);
    setMediaFile(file);
    setMedia(null);
    setUploadProgress(0);
    setCampaignId('');
    setUploadState('idle');

    const isVideo = file.type === "video/mp4" || file.type === "video/quicktime";
    const allowedImage = ["image/jpeg","image/png","image/webp"].includes(file.type);
    if (!isVideo && !allowedImage) {
      setUploadError("Use JPG, PNG, WebP, MP4 or MOV.");
      return;
    }
    if (!file.size || (!isVideo && file.size > 20 * 1024 * 1024) || (isVideo && file.size > 150 * 1024 * 1024)) {
      setUploadError(isVideo ? "Video must be 150 MB or smaller." : "Image must be 20 MB or smaller.");
      return;
    }

    if (!quote || quoteError || startDate < minStartDate || (!isAllDay && endHour <= startHour)) {
      setUploadError('Check the schedule and wait for a confirmed price.');
      return;
    }
    uploadControllerRef.current?.abort();
    const controller = new AbortController();
    uploadControllerRef.current = controller;
    try {
      setUploadState("creating");
      const draft = await createAdDraft({
        targetVenueIds: venueIds,
        durationDays: selectedDays,
        startDate,
        isAllDay,
        dailyStartMinute: isAllDay ? 0 : toMinutes(startHour),
        dailyEndMinute: isAllDay ? 1440 : toMinutes(endHour)
      }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (typeof draft.campaignId !== 'string' || !draft.campaignId) throw new Error('The kiosk did not create a campaign.');
      setCampaignId(draft.campaignId);

      setUploadState("uploading");
      await uploadAdFile({
        campaignId: draft.campaignId,
        file,
        onProgress: setUploadProgress,
        signal: controller.signal
      });

      setUploadState("processing");
      const result = await finalizeAd(draft.campaignId, file, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!absoluteAdMediaUrl(result.media?.previewUrl)) throw new Error('The kiosk did not return a ready creative. Please retry uploading.');
      setMedia({
        ...result.media,
        previewUrl: absoluteAdMediaUrl(result.media.previewUrl)
      });
      setUploadState("ready");
    } catch (err) {
      if (controller.signal.aborted) return;
      setUploadState("error");
      setUploadError(err.message || "Could not prepare this creative.");
    }
  };

  const handleConfirm = async () => {
    if (confirmingRef.current || !campaignId || uploadState !== "ready" || !quote || quoteError) return;
    confirmingRef.current = true;
    const controller = uploadControllerRef.current;
    try {
      setConfirming(true);
      const payment = await confirmAdBooking(campaignId, { signal: controller?.signal });
      if (controller?.signal.aborted) return;
      const url = safeAdPaymentUrl(payment.paymentUrl);
      if (!url) {
        throw new Error('The kiosk did not return a secure payment link. Retry; do not upload again.');
      }
      const amountPaise = payment.amountPaise || Math.round(quote.finalRupees * 100);
      saveAdHandoff({ ...payment, amountPaise });
      setPaymentAmount(amountPaise);
      setPaymentUrl(url);
      setHandoffOpen(true);
    } catch (err) {
      if (!controller?.signal.aborted) setUploadError(err.message || "Could not prepare payment.");
    } finally {
      confirmingRef.current = false;
      if (!controller?.signal.aborted) setConfirming(false);
    }
  };

  const selectedVenueName = selectedVenue === "all"
    ? "All Venues"
    : config?.venues?.find((v) => v.id === selectedVenue)?.name || selectedVenue;

  return (
    <div className="reliv-ads-portal">
      <div className="ads-container">
        <header className="ads-header" ref={stepHeadingRef}>
          <div className="ads-logo-wrap">
            <RelivBrandLogo /><span className="ads-brand-caption">ADVERTISE</span>
          </div>
          <h1 className="ads-headline">{handoffOpen ? "Your ad is saved" : step === 3 ? "Ready for the big screen" : "Your brand. On Reliv."}</h1>
          <p className="ads-subheadline">{handoffOpen ? "One last step to activate your advertisement." : "A local audience. A screen that gets noticed."}</p>
          {!handoffOpen && <div className="ads-pricing-pill">From ₹50/day · 3 days ₹117</div>}
        </header>

        {!handoffOpen && <fieldset disabled={isBusy} className="ads-booking-fields">
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

        {configError && <div className="ads-card" role="alert"><p className="review-legal-text">{configError}</p><button type="button" className="btn-primary-ads" onClick={() => window.location.reload()}>Retry connection</button></div>}

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
              {(config?.venues?.length || 0) > 1 && <button
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
              </button>}
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
                  <select className="hour-select" value={startHour} onChange={(e) => { const hour = Number(e.target.value); setStartHour(hour); setEndHour(end => Math.max(end, hour + 1)); }}>
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
              {quote && !quoteError && <span style={{fontSize:13,color:"#15803d",fontWeight:600}}>Available</span>}
            </div>
            {quoteError && <p className="review-legal-text">{quoteError}</p>}

            {hasRemoteVenue && (
              <p className="review-legal-text">
                Remote offline venues are scheduled from the next day. Gurukul, the current kiosk, can activate immediately.
              </p>
            )}
            <p className="quote-notice">Your ad runs while Reliv is idle. Health sessions always come first.</p>
            <button type="button" className="btn-primary-ads" disabled={!quote || Boolean(quoteError) || !startDate || startDate < minStartDate || (!isAllDay && endHour <= startHour)} onClick={() => setStep(2)}>
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
              <span className="upload-limits-pill">Image ≤ 20 MB · Video ≤ 150 MB · playback length confirmed by kiosk</span>
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
            <h2 className="ads-section-title">Your advertisement</h2>
            <p className="ads-section-sub">This is the prepared file that will play on the kiosk.</p>
            <figure className="ads-creative-preview">
              {media.mediaType === "video"
                ? <video src={media.previewUrl} controls playsInline preload="metadata" onError={() => setPreviewFailed(true)} />
                : <img src={media.previewUrl} alt="Your advertisement, fitted to the Reliv display" decoding="async" onError={() => setPreviewFailed(true)} />}
            </figure>
            {previewFailed && <p role="alert" className="ads-inline-error">Preview could not load. Connect to RELIV-KIOSK and choose your file again before paying.</p>}
            <p className="ads-preview-caption">{media.isTrue16x9 ? "Perfect fit · Full HD display" : "Automatically fitted · Your full creative stays visible"}</p>

            <div className="review-clean-summary">
              <div className="review-row-line">
                <span style={{fontWeight:700}}>{selectedVenueName}</span>
                <span className="review-row-sub">{selectedDays} {selectedDays === 1 ? "day" : "days"} · {isAllDay ? "All day" : `${formatHour(startHour)}–${formatHour(endHour)} IST`}</span>
              </div>
              <p className="review-row-sub">{formatCampaignDate(startDate)}{selectedDays > 1 ? ` – ${formatCampaignDate(startDate, selectedDays - 1)}` : ''}</p>
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
            <button type="button" className="btn-primary-ads" disabled={confirming || previewFailed} onClick={handleConfirm}>
              {confirming ? "Preparing Payment…" : `Confirm & Pay ₹${quote?.finalRupees ?? ""}`}
            </button>
          </section>
        )}

        </fieldset>}
        {handoffOpen && (
          <section className="ads-card ads-payment-handoff" aria-label="Pay for your saved advertisement">
            <div className="saved-check-icon"><CheckSvg /></div>
            <h2>Advertisement saved ✓</h2>
            <p>Your file is safely stored on this kiosk. It will not be lost when you switch Wi-Fi off.</p>
            <ol className="ads-payment-steps">
              <li><strong>Turn Wi-Fi OFF once.</strong><span>Use your phone's 4G or 5G connection.</span></li>
              <li><strong>Tap Pay below.</strong><span>Complete payment on Reliv's secure payment page.</span></li>
            </ol>
            <a className="btn-primary-ads ads-pay-link" href={paymentUrl} rel="noreferrer">
              {paymentAmount > 0 ? `Pay ₹${(paymentAmount / 100).toLocaleString('en-IN')}` : 'Pay securely'} <span aria-hidden="true">→</span>
            </a>
            <p className="ads-payment-note">After payment, enter the 4-digit code on the kiosk using <strong>Enter ad code</strong>. No reconnection or re-upload needed.</p>
            <details className="ads-payment-help"><summary>Using the Wi-Fi sign-in window?</summary><p>Before turning Wi-Fi off, press and hold Pay to copy its payment link. Then open that link in Safari or Chrome. Use the payment link above so you can continue with this saved advertisement.</p></details>
            <button type="button" className="link-secondary-action" onClick={() => setHandoffOpen(false)}>Back to review</button>
          </section>
        )}
      </div>
    </div>
  );
}
