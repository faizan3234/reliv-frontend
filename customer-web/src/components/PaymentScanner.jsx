import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { paymentPathFromQr } from '../services/paymentQr';

export function PaymentScanner({ onClose }) {
  const video = useRef(null);
  const scanner = useRef(null);
  const accepted = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState('Starting camera…');
  const [error, setError] = useState('');
  const [failed, setFailed] = useState(false);
  const [flash, setFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);

  const rejected = useRef({ value: null, count: 0 });
  const accept = (value, fromPhoto = false) => {
    if (!mounted.current || accepted.current) return;
    try {
      const path = paymentPathFromQr(value, window.location.origin);
      accepted.current = true;
      scanner.current?.destroy();
      scanner.current = null;
      setStatus('Opening your payment…');
      // Same-origin navigation preserves standalone PWA mode and initializes
      // the existing recovery/session boundary exactly like an external QR.
      window.location.assign(path);
    } catch (err) {
      const last = rejected.current;
      rejected.current = { value, count: last.value === value ? last.count + 1 : 1 };
      // A noisy camera frame is not evidence that the kiosk QR is invalid.
      if (fromPhoto || rejected.current.count >= 3) setError(err.message);
      else setError('');
    }
  };

  useEffect(() => {
    let disposed = false;
    setFailed(false); setError(''); setFlash(false); setFlashOn(false);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setFailed(true); setStatus('Camera unavailable');
      setError('Open Reliv over HTTPS in Safari or Chrome, or choose a QR photo below.');
      return;
    }
    const instance = new QrScanner(video.current, result => {
      if (!disposed) accept(result.data);
    }, {
      preferredCamera: 'environment', maxScansPerSecond: 20,
      returnDetailedScanResult: true, onDecodeError: () => {},
      // Dense encrypted kiosk QRs need more pixels than the 400px default.
      calculateScanRegion: v => {
        const size = Math.min(v.videoWidth, v.videoHeight);
        const resolution = Math.min(size, 1280);
        return { x: (v.videoWidth-size)/2, y: (v.videoHeight-size)/2,
          width: size, height: size, downScaledWidth: resolution, downScaledHeight: resolution };
      },
    });
    scanner.current = instance;
    // Defer capture until StrictMode has completed its setup/cleanup probe.
    Promise.resolve().then(() => disposed ? undefined : instance.start()).then(async () => {
      if (disposed) { instance.destroy(); return; }
      const track = video.current?.srcObject?.getVideoTracks()[0];
      if (track?.applyConstraints) {
        const caps = track.getCapabilities?.() || {};
        await track.applyConstraints({ width: { ideal: 1920 }, height: { ideal: 1080 },
          ...(caps.focusMode?.includes('continuous') ? { advanced: [{ focusMode: 'continuous' }] } : {}) }).catch(() => {});
      }
      if (disposed) return;
      setStatus('Point at the kiosk payment QR');
      const available = await instance.hasFlash().catch(() => false);
      if (!disposed) setFlash(available);
    }).catch(() => {
      if (disposed) return;
      setFailed(true); setStatus('Camera could not start');
      setError('Allow camera access in your browser settings, then retry. If the camera is busy, close other camera apps. You can also choose a QR photo.');
    });
    // Never keep a camera running while the app is backgrounded or in checkout.
    const pause = () => { instance.stop(); setStatus('Camera paused'); setFlashOn(false); };
    const visibility = () => {
      if (document.hidden) pause();
      else if (!disposed && !accepted.current) instance.start().then(() => {
        if (!disposed) setStatus('Point at the kiosk payment QR');
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
  }, [attempt]);

  const readImage = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || imageBusy || accepted.current) return;
    setImageBusy(true); setError('');
    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      accept(result.data, true);
    } catch { if (mounted.current) setError('No readable QR found. Choose a clear photo containing the entire kiosk QR.'); }
    finally { if (mounted.current) setImageBusy(false); }
  };

  return <section className="space-y-4" aria-label="Reliv payment QR scanner">
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-xl font-bold">Scan kiosk QR</h1>
      <button type="button" onClick={onClose} className="min-h-11 px-4 rounded-xl border border-orange-200 bg-white">Close</button>
    </div>
    <p className="text-sm text-slate-600">Keep the whole QR and its white border visible. Hold steady; avoid screen reflections. Your payment opens here automatically.</p>
    <div className="relative overflow-hidden rounded-3xl bg-slate-950 aspect-square">
      <video ref={video} muted playsInline autoPlay aria-label="Live camera preview" className="w-full h-full object-cover" />
      <div className="absolute inset-3 border-2 border-white/70 rounded-2xl pointer-events-none" aria-hidden="true" />
    </div>
    <p role="status" className="text-sm font-semibold text-center">{status}</p>
    {error && <p role="alert" className="text-sm text-red-800 bg-red-50 rounded-xl p-3">{error}</p>}
    <div className="flex flex-wrap gap-3">
      {failed && <button type="button" className="min-h-11 px-4 rounded-xl bg-orange-600 text-white" onClick={() => setAttempt(a => a+1)}>Retry camera</button>}
      {flash && <button type="button" className="min-h-11 px-4 rounded-xl border border-orange-200" aria-pressed={flashOn} onClick={async () => {
        try { await scanner.current?.toggleFlash(); setFlashOn(Boolean(scanner.current?.isFlashOn())); }
        catch { setError('Torch is unavailable on this camera.'); }
      }}>{flashOn ? 'Turn off torch' : 'Turn on torch'}</button>}
      <label className="min-h-11 px-4 py-3 rounded-xl border border-orange-200 bg-white cursor-pointer">
        {imageBusy ? 'Reading photo…' : 'Choose QR photo'}
        <input aria-label="Choose QR photo" type="file" accept="image/*" className="block max-w-full mt-2 text-xs" disabled={imageBusy} onChange={readImage} />
      </label>
    </div>
    <p className="text-xs text-slate-500">Camera permission is required for live scanning. Images are decoded on your device. Internet is needed to pay.</p>
  </section>;
}
