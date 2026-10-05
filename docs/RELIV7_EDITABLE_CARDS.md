# Editable Reliv7 story cards

The paid health-check success page renders the supplied individual, friends and couple HTML designs below the verified code. Templates contain no scripts, CDN dependencies, sample scores or sample names. The report summary supplies score, win and focus. Missing values are not invented. Only display names and the personal note are editable; blank notes restore the selected design's default.

The complete card is scaled for narrow screens and exported without cropping into a 1080×1920 PNG. A consent checkbox and an in-flight guard prevent unintended sharing and duplicate exports. Text is assigned with textContent, never interpolated as HTML. The template subtree is memoized so consent/export state cannot erase its bound report data.

The legacy Oracle email card renderer uses different artwork. This client deliberately sends no storyCard attachment request; report/receipt email remains available. Use Save or Share for the new design. Partner names do not link reports; a second score is unavailable until a verified linking flow exists. Backend companion PR adds a measurement-dependent focus prompt, not a diagnosis or inferred hydration recommendation.

Report narration retains the newest saved-history handling and offline EN/HI/BN recordings. It stops repeating the current scan heading on each page, keeps page-one overview focused on the actual score, and bounds the summary to two prioritised concerns and one truthful positive (prefer newly positive, otherwise vary by visit). Weight guidance remains in the summary and composition guidance stays on its page.

## Verification

- Full npm test passed, including routed report autoplay/review, payment identity isolation, sensors, ads and idle tests.
- ESLint passed; kiosk and customer-web production builds passed.
- Focused narration/card tests and payment DOM tests passed after follow-up edits.
- Real headless Chromium: all 3 designs exported 1080×1920 PNGs; inspected exported images; tested 320px layout with long names, default-note restoration, actual score binding, and no page exceptions. Payment responses were synthetic, not live transactions.
- Backend companion: 5 story-card checks passed, including real PNG generation and missing data.

Not verified: actual Pi Chromium/touchscreen/speakers, naturalness of recorded voice, real Oracle/Razorpay checkout, iOS share/download behaviour. Existing npm proxy/Browserslist notices remain; no zero-bug or production-ready claim.
