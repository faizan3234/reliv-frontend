# Payment scanner validation

The Pi's existing QR format stays compatible: HTTPS /pay#p= with an encrypted,
signed package. No short-link registration or internet connection is added to
the Pi. Payment authenticity remains the payment bridge's responsibility.

Changes:
- Preserve native QR detection where supported; replace the JS fallback with a
  locally hosted ZXing WebAssembly worker. Camera frames stay on the phone.
- Scan the entire visible camera frame, up to 1920 pixels on its longest side,
  rather than discarding off-centre data or reducing dense codes to 400 pixels.
- Request the rear camera, 1080p resolution and continuous autofocus when exposed.
- Recognize rotated/inverted QR codes, accept once, release camera, transfer the
  exact validated package without a document reload, and request 1000ms vibration.
- Preload scanner JavaScript; show recoverable loading/camera errors.

Verified:
- npm run test:scanner: 7 Node checks and 12 mocked-camera browser checks.
- Decoder tests use actual kiosk payment fixtures rendered using the kiosk SVG
  generator, plus a 2953-byte synthetic package. Rotation, inversion, mirroring,
  modest blur and off-centre framing preserve the exact package.
- Payment identity integration: 19 checks including stale-code isolation.
- npm run lint, npm run build, npm run build --prefix customer-web pass.
- Build emits the worker and reader WASM into the customer-web assets.

Limits:
Synthetic images and jsdom do not establish phone autofocus or end-to-end scan
latency. Test deployed /scan on iOS Safari/PWA and Android using the actual Pi
screen, with movement, reflections and both normal/enlarged QR views. Real camera
browser automation was unavailable in this environment. Safari may not provide
vibration; visual feedback remains. A half-hidden QR or severe motion blur cannot
be guaranteed recoverable. Native Apple scanning has camera/OS capabilities a
PWA cannot require. No live payment or physical Pi test was performed.
