# Wi-Fi and report UI update

Requires backend PR #53: https://github.com/faizan3234/backend/pull/53

## Owner Wi-Fi

Open `/wifi` on the Pi local site. Sign in with the existing local admin account. The page shows actual Pi network status, nearby networks and a manual hotspot form. Every Wi-Fi endpoint uses the admin bearer token. It does not copy Wi-Fi passwords into browser storage.

The connection request is explicitly pending until the Pi confirms it. A single-radio Pi temporarily pauses its AP and customer visits. The Pi returns automatically after the selected maintenance period. The same phone can submit its hotspot details, then turn its hotspot on during the 12-second delay. The page cannot alter the phone's own network settings. A second physical adapter allows the AP to stay available. See the backend installation guide before use.

## Report pages 1–5

- Named navigation buttons, current page and actual scan count; back button on pages 2–5.
- A visible score arc: legacy CSS previously covered the SVG ring with a white disc.
- Reduced empty spacing and oversized headings for the 1280×800 touch display.
- Clear estimate label outside the ring; removal of misleading fixed parameter/insight counts.
- No continuous confetti or hover-only score tooltip. Tap-to-explain and existing personalised narration remain.
- Existing measured readings, score calculations, signed paid-report access, history and PIN checks remain.
- Report controls use bundled Hindi/Bengali font fallbacks. Header microphone badge no longer overlays report controls.

## Stock and email audit

No accounting, pricing or inventory rewrite is included. Existing completion/stock logic executes in one SQLite transaction, rejects mismatched reservations and preserves manual review for uncertain deliveries. Its 18 dispense/stock/receipt regression tests pass. The low-stock/receipt-email tests pass (16 tests); alerts originate from verified paid cloud orders and do not depend on a customer asking for a receipt.

The cloud gets a signed stock snapshot carried in the payment request. A permanently offline Pi cannot tell the cloud the exact post-dispense stock immediately without another network/data transfer. A cloud email is therefore not proof of physical delivery or live remaining stock. Confirm SMTP on the bridge and a real paid order before claiming actual email delivery.

## Preview and checks

Screenshots use the production build at 1280×800 and a 390px phone viewport with synthetic sample data and mocked APIs. They are not photographs of a tested Pi. Frontend build/lint and focused Wi-Fi, report, commerce and voice regressions are run locally. Physical touch scrolling, hotspot switching, actual speaker audio and radio recovery must be checked on the kiosk.

## Practical next improvements

1. A 12–15 second silent, captioned demonstration: choose service → follow measurement prompts → scan payment QR → enter code → collect report/item.
2. Show one task per scene with a hand animation and large orange action highlight.
3. Store video locally as a modest H.264 MP4; preload only the next asset. Compare playback on the actual Pi before choosing resolution/bitrate.
4. Stop idle video immediately on touch; never cover a measurement, payment or recovery screen.
5. Show a simple progress strip, such as “2 of 4 measurements”, with the next action.
6. Keep the same primary button position and label style across each step.
7. Use words and icons alongside green/amber/red; colour alone is insufficient.
8. Always distinguish “motor ran” from “medicine delivery confirmed”.
9. Show a short customer reference on every paid recovery screen and keep “Do not pay again” prominent.
10. Ask three new users to use the kiosk without help; fix the first point where each hesitates before adding more effects.
