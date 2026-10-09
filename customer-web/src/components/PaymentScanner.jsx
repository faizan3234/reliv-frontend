import { prepareScanSound, playScanSound } from '../services/scanFeedback';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import QrScanner from '../services/paymentScannerEngine';
import { paymentPathFromQr, isDemoPaymentQr } from '../services/paymentQr';
import { densePaymentScanRegion, acknowledgePaymentScan, tunePaymentCamera } from '../services/scannerTuning';

export function PaymentScanner({ onClose, onScan }) {
  const video = useRef(null);
  const scanner = useRef(null);
  const accepted = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [attempt, setAttempt] = useState(0);
  const [demoDetected, setDemoDetected] = useState(false);
  const [status, setStatus] = useState('Starting camera…');
  const [error, setError] = useState('');
  const [failed, setFailed] = useState(false);
  const [flash, setFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const rejected = useRef({ value: null, count: 0 });
  const accept = useCallback((value) => {
    if (!mounted.current || accepted.current) return;
    if (isDemoPaymentQr(value)) {
      accepted.current = true;
      scanner.current?.destroy();
      scanner.current = null;
      setError('');
      setDemoDetected(true);
      acknowledgePaymentScan(navigator);
      playScanSound();
      return;
    }
    try {
      const path = paymentPathFromQr(value, window.location.origin);
      accepted.current = true;
      scanner.current?.destroy();
      scanner.current = null;
      setStatus('QR captured. Opening your payment…');
      acknowledgePaymentScan(navigator);
      playScanSound();
      // Same-origin navigation preserves standalone PWA mode and initializes
      // the existing recovery/session boundary exactly like an external QR.
      if (onScan) onScan(path);
      else window.location.assign(path);
    } catch (err) {
      const last = rejected.current;
      rejected.current = { value, count: last.value === value ? last.count + 1 : 1 };
      // A noisy camera frame is not evidence that the kiosk QR is invalid.
      if (rejected.current.count >= 3) {
        setStatus('QR read — payment link not recognized');
        setError(err.message);
      }
      else setError('');
    }
  }, [onScan]);

  useEffect(() => {
    let disposed = false;
    setFailed(false); setError(''); setFlash(false); setFlashOn(false);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setFailed(true); setStatus('Camera unavailable');
      setError('Open Reliv over HTTPS in Safari or Chrome.');
      return;
    }
    const instance = new QrScanner(video.current, result => {
      if (!disposed) accept(result.data);
    }, {
      preferredCamera: 'environment', maxScansPerSecond: 25,
      returnDetailedScanResult: true, onDecodeError: () => {},
      // Dense encrypted kiosk QRs need more pixels than the 400px default.
      calculateScanRegion: densePaymentScanRegion,
    });
    scanner.current = instance;
    // Defer capture until StrictMode has completed its setup/cleanup probe.
    Promise.resolve().then(() => disposed ? undefined : instance.start()).then(async () => {
      if (disposed) { instance.destroy(); return; }
      const track = video.current?.srcObject?.getVideoTracks()[0];
      await tunePaymentCamera(track);
      if (disposed || accepted.current) return;
      setStatus('Point at the kiosk payment QR');
      const available = await instance.hasFlash().catch(() => false);
      if (!disposed) setFlash(available);
    }).catch(() => {
      if (disposed) return;
      setFailed(true); setStatus('Camera could not start');
      setError('Allow camera access in your browser settings, then retry. If the camera is busy, close other camera apps.');
    });
    // Never keep a camera running while the app is backgrounded or in checkout.
    const pause = () => { instance.stop(); setStatus('Camera paused'); setFlashOn(false); };
    const visibility = () => {
      if (document.hidden) pause();
      else if (!disposed && !accepted.current) instance.start().then(() => {
        if (!disposed && !accepted.current) {
          setStatus('Point at the kiosk payment QR');
          void tunePaymentCamera(video.current?.srcObject?.getVideoTracks()[0]);
        }
      }).catch(() => { if (!disposed) { setFailed(true); setError('Tap Retry camera to resume scanning.'); } });
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', pause);
    window.addEventListener('pageshow', visibility);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', pause);
      window.removeEventListener('pageshow', visibility);
      instance.destroy();
      if (scanner.current === instance) scanner.current = null;
    };
  }, [attempt, accept]);

  return <section className="space-y-4" aria-label="Reliv payment QR scanner">
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-xl font-bold">Scan kiosk QR</h1>
      <button type="button" onClick={onClose} className="min-h-11 px-4 rounded-xl border border-orange-200 bg-white">Close</button>
    </div>
    {demoDetected ? <div role="status" className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 space-y-4">
      <h2 className="text-xl font-bold text-emerald-900">✓ Demo QR scanned successfully</h2>
      <p className="text-emerald-950">Your scanner is working. This is a test QR marked “NOT PAYABLE”, so it cannot open a payment or give an activation code.</p>
      <p className="text-sm text-emerald-950">For payment, start a real checkup or medicine purchase on the kiosk and scan its payment QR.</p>
      <button type="button" className="min-h-12 rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white" onClick={() => {
        accepted.current = false;
        rejected.current = {value:null,count:0};
        setDemoDetected(false);
        setStatus('Starting camera…');
        setAttempt(value => value + 1);
      }}>Scan another QR</button>
    </div> : <>
    <p className="text-sm text-slate-600">Show the whole QR anywhere in the camera view. No need to centre it. Payment opens automatically when it is read.</p>
    <div className="relative overflow-hidden rounded-3xl bg-slate-950 aspect-square">
      <video ref={video} muted playsInline autoPlay aria-label="Live camera preview" className="w-full h-full object-contain" />
      <div className="absolute inset-3 border-2 border-white/70 rounded-2xl pointer-events-none" aria-hidden="true" />
    </div>
    <p role="status" className="text-sm font-semibold text-center">{status}</p>
    {error && <p role="alert" className="text-sm text-red-800 bg-red-50 rounded-xl p-3">{error}</p>}
    <div className="flex flex-wrap gap-3">
      <button type="button" className="min-h-11 px-4 rounded-xl border border-orange-200" onClick={async () => { const enabled = await prepareScanSound(); if (mounted.current) setSoundEnabled(enabled); if (enabled) playScanSound(); }}>{soundEnabled ? 'Sound enabled · test' : 'Enable scan sound'}</button>
      {!failed && <button type="button" className="min-h-11 px-4 rounded-xl border border-orange-200" onClick={() => {
        prepareScanSound();
        setStatus('Starting camera…');
        setAttempt(value => value + 1);
      }}>Refresh camera</button>}
      {failed && <button type="button" className="min-h-11 px-4 rounded-xl bg-orange-600 text-white" onClick={() => setAttempt(a => a+1)}>Retry camera</button>}
      {flash && <button type="button" className="min-h-11 px-4 rounded-xl border border-orange-200" aria-pressed={flashOn} onClick={async () => {
        try { prepareScanSound(); await scanner.current?.toggleFlash(); setFlashOn(Boolean(scanner.current?.isFlashOn()));
          await tunePaymentCamera(video.current?.srcObject?.getVideoTracks()[0], {resolution:false}); }
        catch { setError('Torch is unavailable on this camera.'); }
      }}>{flashOn ? 'Turn off torch' : 'Turn on torch'}</button>}
    </div>
    </>}
    <p className="text-xs text-slate-500">If blurry, move slightly back or tap Enlarge QR on the kiosk. Avoid bright reflections.</p>
    <p className="text-xs text-slate-500">Camera permission is required for live scanning. Frames are decoded on your device. Internet is needed to pay.</p>
  </section>;
}
