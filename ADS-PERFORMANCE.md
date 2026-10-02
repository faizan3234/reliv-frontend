# Advertising loading update — 30 September 2026

The installed display is a Waveshare 10.1-inch 1280×800 panel 

## Changes

- `/advertise` loads independently of the kiosk/report/MQTT bundle. Kiosk font requests no longer block the phone's first render.
- Large photos are reduced to a maximum 1600-pixel edge before Wi-Fi upload when the browser supports it. Smaller originals and unsupported decoders keep the original file; the Pi remains responsible for validation. Videos are not decoded/re-encoded on the phone.
- Preview proportions use the prepared media dimensions. New backend outputs match 1280×800 and show the whole creative with a soft background fill.
- During each 5/10/15-second splash gap, the next image/video preloads hidden. The same DOM media element is revealed after it is ready and the interval ends. Audio and play accounting begin only when shown.
- Successful, currently eligible code activation refreshes the playlist immediately and prioritizes that campaign for the next rotation. Future schedules/approval restrictions remain enforced by the backend.
- The ad and code-entry overlays sit above the floating speech controls. Existing paid 16:9 media gets one tiny blurred backdrop frame; no second video decoder, continuous canvas animation or alteration of signed media is needed.
- Every phone gets a direct anchor to the signed `https://reliv7.vercel.app/pay#p=...` URL. Copy/paste controls and the iPhone copy-only branch are removed.

## Validation

Production build and ESLint with zero errors/warnings passed. UI regressions cover preloading during the gap, reuse of the media element, touch/audio interruption, configured intervals, bad media fallback, signed payment handoff, iPhone direct Pay link, and no activation from forged query parameters. Existing session/measurement/report suites pass. Photo reduction has fallback/abort/resource-cleanup coverage.

Build output: main JS 276.73 KB, advertising chunk 18.83 KB; kiosk/report chunk approximately 1,074 KB and MQTT 365 KB are deferred on the advertising route. These are uncompressed bundle sizes, not end-to-end network timings.

## Deployment and remaining device checks

Deploy the matching backend performance PR on the Pi, rebuild/deploy this frontend and refresh kiosk Chromium. No Oracle bridge changes or payment-key changes are needed for this release. Existing paid campaigns remain intact.

Verify real 1280×800 rendering, picture/video playback, audio interruption and large-upload timings on the Pi. A browser can evict cached media, and large original video uploads still take time over Wi-Fi. This release does not promise instantaneous processing for every file.

Payment requires the phone's mobile Internet. The direct Pay link does not give an offline hotspot Internet access or force iOS to keep its captive sign-in window open. Use the normal Safari/Chrome browser for the upload/payment journey; when necessary, the wall poster's URL QR opens `/advertise` after joining Wi-Fi without typing. Universal one-scan connect-and-open behavior is not controlled by website JavaScript. Apple documents the distinction between joining a captive network and dismissing its login window: https://support.apple.com/en-in/102554.
