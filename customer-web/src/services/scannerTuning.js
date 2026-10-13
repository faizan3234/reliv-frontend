// The Pi produces dense, black-on-white SVG QRs up to 2953 URL bytes.
// Search the whole visible frame; do not discard off-centre QR finder squares.
export const PAYMENT_READER_OPTIONS = {
  formats: ['QRCode'], tryHarder: true, tryRotate: true, tryInvert: true,
  tryDownscale: true, maxNumberOfSymbols: 1,
};

export function densePaymentScanRegion(video) {
  const width = Math.max(1, video.videoWidth || 1);
  const height = Math.max(1, video.videoHeight || 1);
  const scale = Math.min(1, 1920 / Math.max(width, height));
  return { x: 0, y: 0, width, height,
    downScaledWidth: Math.max(1, Math.round(width * scale)),
    downScaledHeight: Math.max(1, Math.round(height * scale)) };
}

export function acknowledgePaymentScan(device) {
  // Safari/iOS may expose no vibration API; feedback must never block checkout.
  try { device.vibrate?.(1000); } catch { /* Visual confirmation remains available. */ }
}

// Apply independently: rejecting a resolution must not skip focus/exposure.
export async function tunePaymentCamera(track, { resolution = true } = {}) {
  if (!track?.applyConstraints || track.readyState === 'ended') return;
  if (resolution) {
    try { await track.applyConstraints({width:{ideal:1920},height:{ideal:1080}}); } catch { /* Keep working camera. */ }
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
