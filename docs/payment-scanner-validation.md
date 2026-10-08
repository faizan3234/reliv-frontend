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

## Follow-up: demo QR misreported as a scanning failure

User screenshots from 2026-10-08 show `DEMO QR · NOT PAYABLE` on the kiosk.
Three supplied PWA screenshots decoded to a 2048-character JSON object with
`type: RELIV_DEMO_SAMPLE` and `status: NOT_PAYABLE`. The previous URL validator
rejected its spaces before URL parsing, displayed a generic instruction after
three detections, and kept scanning indefinitely. This was successful decoding
followed by rejection, not an unreadable QR in those frames. A more blurred PWA
screenshot and the supplied native scanner photo did not decode as still images.
These still-image results do not measure native/PWA camera speed.

Demo recognition now immediately stops scanning and shows a success explanation,
with one optional vibration and a Scan another QR button. Demo contents are never
rendered as HTML, sent to the bridge, or accepted by paymentPathFromQr. Unrelated
QR rejection now explicitly says the QR was read but its payment link was not
recognized. The production payment URL validation remains unchanged.

Follow-up checks: 8 Node checks, 17 browser lifecycle checks, zero lint findings,
and customer-web production build pass. Real-phone timing remains unverified.
