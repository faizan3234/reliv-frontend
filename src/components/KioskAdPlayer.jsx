import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSpeech } from '../context/SpeechContext';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';
import { absoluteAdMediaUrl, activateAdCampaign, getActiveAdPlaylist, recordAdPlay } from '../services/adApi';
import './KioskAdPlayer.css';

export default function KioskAdPlayer() {
  const isHome = useLocation().pathname === '/';
  const { stop } = useSpeech();
  const { pauseListening, resumeListening, listeningPaused } = useVoiceAssistant();
  const pausedRef = useRef(listeningPaused);
  pausedRef.current = listeningPaused;
  const [ads, setAds] = useState([]);
  const [playlistVersion, setPlaylistVersion] = useState(0);
  const [gap, setGap] = useState(5);
  const [play, setPlay] = useState(null);
  const [gapElapsed, setGapElapsed] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now);
  const [blocked, setBlocked] = useState(false);
  const [keypad, setKeypad] = useState(false);
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const index = useRef(0);
  const activatedCampaign = useRef(null);
  const video = useRef(null);
  const backdrop = useRef(null);
  const activePlay = useRef(null);
  const swallowUntil = useRef(0);
  const activation = useRef(null);
  const dialog = useRef(null);
  const previousFocus = useRef(null);
  const showing = isHome && Boolean(play?.ready) && gapElapsed && !blocked && !keypad;
  const overlayActive = showing || (isHome && keypad);

  const finish = useCallback((completed = false, interrupted = false) => {
    if (video.current) { video.current.muted = true; video.current.pause(); }
    const entry = activePlay.current;
    activePlay.current = null;
    if (entry) void recordAdPlay(entry.campaignId, { startedAt: entry.startedAt, completed, interruptedByUser: interrupted });
    setPlay(null);
    setGapElapsed(false);
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    if (!isHome) return;
    const controller = new AbortController();
    let timer;
    const poll = async () => {
      try {
        const data = await getActiveAdPlaylist({ signal: controller.signal });
        if (controller.signal.aborted) return;
        const next = (Array.isArray(data.ads) ? data.ads : [])
          .filter(ad => ad?.campaignId && ['image', 'video'].includes(ad.mediaType))
          .map(ad => ({ ...ad, mediaUrl: absoluteAdMediaUrl(ad.mediaUrl) })).filter(ad => ad.mediaUrl);
        setAds(prev => JSON.stringify(prev) === JSON.stringify(next) ? prev : next);
        setGap([5, 10, 15].includes(data.splashIntervalSeconds) ? data.splashIntervalSeconds : 5);
      } catch {
        if (!controller.signal.aborted) { setAds([]); finish(); }
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(poll, 2500);
      }
    };
    void poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [isHome, finish, playlistVersion]);

  useEffect(() => {
    if (!isHome || blocked || keypad || document.hidden) return;
    if (play) {
      if (!ads.some(ad => ad.campaignId === play.ad.campaignId)) finish();
      return;
    }
    if (!ads.length) return;
    // Prepare one upcoming creative DURING the splash interval. Reuse this same
    // media element when revealed, so playback doesn't start another download.
    const newlyActivated = ads.find(ad => ad.campaignId === activatedCampaign.current);
    if (newlyActivated) activatedCampaign.current = null;
    setPlay({ ad: newlyActivated || ads[index.current++ % ads.length], ready: false, token: Symbol() });
  }, [isHome, ads, gap, lastActivity, blocked, keypad, play, finish]);

  useEffect(() => {
    if (!isHome || blocked || keypad || document.hidden) return;
    const timer = setTimeout(() => setGapElapsed(true), Math.max(0, gap * 1000 - (Date.now() - lastActivity)));
    return () => clearTimeout(timer);
  }, [isHome, gap, lastActivity, blocked, keypad, play]);

  useEffect(() => {
    if (!play || !isHome) return;
    const seconds = Number(play.ad.durationSeconds);
    const duration = Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 300) : 10;
    // Failed media cannot leave the kiosk covered or loading forever.
    if (play.ready && !showing) return;
    const timer = setTimeout(() => finish(showing && play.ad.mediaType === 'image'), showing ? duration * 1000 : 15000);
    return () => clearTimeout(timer);
  }, [play, isHome, showing, finish]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('reliv_ad_audio_focus', { detail: { owner: 'player', active: overlayActive } }));
    const resume = overlayActive && !pausedRef.current;
    if (overlayActive) { stop(); pauseListening(); }
    return () => {
      window.dispatchEvent(new CustomEvent('reliv_ad_audio_focus', { detail: { owner: 'player', active: false } }));
      if (resume) resumeListening();
    };
  }, [overlayActive, stop, pauseListening, resumeListening]);

  useEffect(() => {
    if (!showing) return;
    activePlay.current = { campaignId: play.ad.campaignId, startedAt: Date.now() };
    const el = video.current;
    if (el) {
      let cancelled = false;
      el.volume = 0.3;
      el.muted = !play.ad.hasAudio;
      const start = async () => {
        try { await el.play(); }
        catch {
          if (cancelled) return;
          el.muted = true;
          try { await el.play(); } catch { if (!cancelled) finish(); }
        }
      };
      void start();
      return () => { cancelled = true; el.muted = true; el.pause(); };
    }
  }, [play, showing, finish]);

  useEffect(() => {
    if (!isHome || keypad || blocked) return;
    const activity = event => {
      if (showing) {
        event.preventDefault(); event.stopImmediatePropagation();
        swallowUntil.current = Date.now() + 600;
        finish(false, true);
      } else { if (play) finish(); setLastActivity(Date.now()); }
    };
    const swallow = event => {
      if (Date.now() < swallowUntil.current) { event.preventDefault(); event.stopImmediatePropagation(); }
    };
    const overlay = event => { setBlocked(Boolean(event.detail)); if (event.detail) finish(false, true); };
    const visibility = () => finish(false, true);
    window.addEventListener('pointerdown', activity, true);
    window.addEventListener('keydown', activity, true);
    document.addEventListener('click', swallow, true);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('reliv_splash_overlay', overlay);
    return () => {
      window.removeEventListener('pointerdown', activity, true);
      window.removeEventListener('keydown', activity, true);
      document.removeEventListener('click', swallow, true);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('reliv_splash_overlay', overlay);
    };
  }, [isHome, keypad, blocked, play, showing, finish]);

  const close = useCallback(() => {
    activation.current?.abort(); activation.current = null;
    setBusy(false); setKeypad(false); setLastActivity(Date.now());
    previousFocus.current?.focus?.();
  }, []);
  useEffect(() => {
    const open = () => {
      if (!isHome) return;
      previousFocus.current = document.activeElement;
      finish(false, true); setCode(''); setFeedback(''); setSuccess(''); setKeypad(true);
    };
    window.addEventListener('reliv_open_ad_keypad', open);
    return () => window.removeEventListener('reliv_open_ad_keypad', open);
  }, [isHome, finish]);
  useEffect(() => { if (keypad) dialog.current?.focus(); }, [keypad]);
  useEffect(() => {
    if (!isHome) { close(); finish(false, true); }
    return () => { activation.current?.abort(); };
  }, [isHome, close, finish]);

  const verify = async () => {
    if (activation.current || !/^\d{4}$/.test(code)) return;
    const controller = new AbortController(); activation.current = controller;
    setBusy(true); setFeedback('');
    try {
      const data = await activateAdCampaign({ code }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!['ACTIVE', 'SCHEDULED', 'PENDING_APPROVAL'].includes(data.status)) throw new Error('Activation was not confirmed. Retry; do not pay again.');
      if (data.status === 'ACTIVE') {
        activatedCampaign.current = data.campaignId || null;
        setPlaylistVersion(version => version + 1);
      }
      setSuccess(data.status === 'ACTIVE' ? 'Your ad is now in rotation.' : data.status === 'PENDING_APPROVAL' ? 'Payment confirmed. Your ad is awaiting venue approval.' : 'Your ad is scheduled for its booked dates and hours.');
    } catch (error) {
      if (!controller.signal.aborted) { setFeedback(error.message || 'Please retry. Do not pay again.'); setCode(''); }
    } finally {
      if (activation.current === controller) { activation.current = null; setBusy(false); }
    }
  };
  const ready = (token, element) => {
    if (play?.token !== token || play.ready) return;
    // Existing paid 16:9 files keep their signed bytes. Draw ONE small blurred
    // frame behind them to fill a 16:10 display, without decoding a second video.
    try {
      const width = element.videoWidth || element.naturalWidth;
      const height = element.videoHeight || element.naturalHeight;
      const context = backdrop.current?.getContext('2d');
      if (width && height && context) {
        const cropWidth = Math.min(width, height * 1.6);
        const cropHeight = Math.min(height, width / 1.6);
        context.filter = 'blur(4px)';
        context.drawImage(element, (width - cropWidth) / 2, (height - cropHeight) / 2, cropWidth, cropHeight, -8, -8, 176, 116);
      }
    } catch { /* Media playback stays available when canvas is unsupported. */ }
    setPlay(prev => prev?.token === token && !prev.ready ? { ...prev, ready: true } : prev);
  };
  if (!isHome) return null;
  return <>
    {play && !blocked && !keypad && <div className={`kiosk-ad-player-overlay ${showing ? 'is-ready' : 'is-loading'}`} aria-hidden={!showing}>
      <canvas ref={backdrop} width="160" height="100" aria-hidden="true" />
      {play.ad.mediaType === 'video'
        ? <video ref={video} key={play.ad.mediaUrl} src={play.ad.mediaUrl} muted playsInline preload="auto" onCanPlay={event => ready(play.token, event.currentTarget)} onEnded={() => finish(true)} onError={() => finish()} />
        : <img key={play.ad.mediaUrl} src={play.ad.mediaUrl} alt="Advertisement" onLoad={event => ready(play.token, event.currentTarget)} onError={() => finish()} />}
      {showing && <span className="ad-touch-hint"><strong>Reliv</strong><span>Touch to start</span></span>}
    </div>}
    {keypad && <div className="kiosk-activation-modal">
      <section className="activation-keypad-card" role="dialog" aria-modal="true" aria-labelledby="ad-code-title" tabIndex={-1} ref={dialog}
        onKeyDown={event => {
          if (event.key === 'Escape') close();
          if (event.key === 'Tab') {
            const buttons = [...dialog.current.querySelectorAll('button:not(:disabled)')];
            const first = buttons[0], last = buttons.at(-1);
            if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          }
        }}>
        <h2 id="ad-code-title">{success ? 'Your ad is ready' : 'Enter ad code'}</h2>
        {success ? <><p role="status">{success}</p><button type="button" className="ad-verify" onClick={close}>Done</button></> : <>
          <p>Enter the 4-digit code shown on your phone after payment.</p>
          <output className="ad-code-display" aria-label={`${code.length} of 4 digits entered`}>{[0, 1, 2, 3].map(i => <span key={i}>{code[i] || '–'}</span>)}</output>
          {feedback && <p className="ad-code-error" role="alert">{feedback}</p>}
          <div className="numeric-keypad-grid">
            {['1','2','3','4','5','6','7','8','9','Clear','0','⌫'].map(key => <button key={key} type="button" disabled={busy}
              aria-label={key === '⌫' ? 'Delete last digit' : key}
              onClick={() => { setFeedback(''); setCode(prev => key === 'Clear' ? '' : key === '⌫' ? prev.slice(0, -1) : (prev + key).slice(0, 4)); }}>{key}</button>)}
          </div>
          <button type="button" className="ad-verify" disabled={busy || code.length !== 4} onClick={verify}>{busy ? 'Verifying…' : 'Verify activation code'}</button>
          <button type="button" className="ad-close" onClick={close}>Close</button>
        </>}
      </section>
    </div>}
  </>;
}
