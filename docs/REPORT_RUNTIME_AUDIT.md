# Report runtime audit — 2026-10-05

Audited merged frontend e6631a4 (PR54) and backend dbca89a (PR36).

## Reproduced and fixed

- Next from the bottom of report 1 opened report 2 at scrollY=1888. Reset the report root and its scroll ancestors before painting each page; Chromium now reports scrollY=0. This also applies to Back.
- Report font overrides omitted the bundled Devanagari/Bengali faces. Hindi and Bengali labels rendered as missing-glyph boxes on Chromium without host language fonts. Include both local font families in report styles.
- The floating volume controls could cover report controls on a narrow viewport. Place the report volume controls in the header's wrapping layout.
- Report 1 put Next inside the score's clickable speech container. Restrict the speech action to the score itself, with a separate keyboard-accessible target.
- Missing score inputs left a perpetual Calculating/Analyzing message. Display unavailable instead.

## Verification

- Frontend lint, complete npm test suite, production build.
- Reference report browser suite includes navigation/scroll, independent speech targets, volume control, missing inputs, unpaid access, and scan-count scenarios.
- Headless Chromium: all five actual ReferenceReports routes at 1920x1080, 1280x1080, and 390x844 using synthetic authorized snapshots; no page exceptions or horizontal document overflow observed. Screenshots inspected; local language fonts checked. These are browser simulations, not physical Pi tests.
- Backend: node --check server.js, test:kiosk, test:ads, npm test, and payment-bridge-service npm test. The clean checkout needed a synthetic test-only RSA public key for legacy payment test imports. No production keys were changed or committed.

## Limits

No remote access to the user's Pi, touchscreen, speaker, sensor hardware, or deployed Oracle service. Physical audio/accent, real Wi-Fi/MQTT, payment, captive portal, deployment/cache behavior, and long-duration Pi stability still require on-site checks. No live payment or email was sent.

This audit does not validate the legacy body-composition formulas, age-comparison claims, remedies, or all medical advice. Those remain a separate clinical-content review; passing software checks does not establish diagnostic accuracy. Existing score/metric estimates are not new direct sensor measurements.

Report review mode remains ON as requested. No payment or report-authorization rules were changed. Feature flag OFF retains the documented normal visit flow.
