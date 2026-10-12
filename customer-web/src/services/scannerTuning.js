// The Pi produces dense, black-on-white SVG QRs up to 2953 URL bytes.
// Search the whole visible frame; do not discard off-centre QR finder squares.
export const PAYMENT_READER_OPTIONS = {
  formats: ['QRCode'], tryHarder: true, tryRotate: true, tryInvert: true,
  tryDownscale: true, maxNumberOfSymbols: 1,
};

export function densePaymentScanRegion(video) {
  // qr-scanner caches this object at loadedmetadata. applyConstraints can
  // subsequently resize the live stream without another loadedmetadata event.
  // Read current dimensions each frame or a 640px top-left crop can replace
  // the visible 1920px camera view and miss the QR entirely.
  const width = () => Math.max(1, video.videoWidth || 1);
  const height = () => Math.max(1, video.videoHeight || 1);
  const scale = () => Math.min(1, 2560 / Math.max(width(), height()));
  return { x: 0, y: 0,
    get width() { return width(); }, get height() { return height(); },
    get downScaledWidth() { return Math.max(1, Math.round(width() * scale())); },
    get downScaledHeight() { return Math.max(1, Math.round(height() * scale())); } };
}

export function acknowledgePaymentScan(device) {
  // Safari/iOS may expose no vibration API; feedback must never block checkout.
  try { device.vibrate?.(1000); } catch { /* Visual confirmation remains available. */ }
}

// Apply independently: rejecting a resolution must not skip focus/exposure.
export async function tunePaymentCamera(track, { resolution = true } = {}) {
  if (!track?.applyConstraints || track.readyState === 'ended') return;
  if (resolution) {
    try { await track.applyConstraints({width:{ideal:2560},height:{ideal:1440}}); } catch { /* Keep working camera. */ }
  }
  let caps;
  try { caps = track.getCapabilities?.() || {}; } catch { return; }
  for (const mode of ['focusMode', 'exposureMode', 'whiteBalanceMode']) {
    if (track.readyState === 'ended') return;
    if (caps[mode]?.includes('continuous')) {
      try { await track.applyConstraints({advanced:[{[mode]:'continuous'}]}); } catch { /* Optional per camera. */ }
    }
  }
}
