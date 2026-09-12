# Reliability progress — 12 September 2026

This checklist replaces the previous unverified production-readiness claims. It records the latest-main review, not a live Raspberry Pi certification.

| Area | Result | Evidence / remaining action |
| --- | --- | --- |
| Current source | Reviewed | Based on frontend `02b0a8f` and backend `ac13a20`. |
| Customer details → service | Automated pass | Customer save, retry, pairing token, expired session and both service paths tested. Existing latest-main port-5000 API routing retained. |
| Service switching | Fixed and tested | A 409 rejection stays on the selection page. Explicit switch requests select the named service. |
| Payment code entry | Fixed and tested | Visible top code tab retained; yes opens keypad; negative replies keep payment guidance; verification remains server controlled. |
| Payment retries | Fixed and tested | Duplicate-tap protection, bounded requests, existing-payment recovery, no guessed wrong-code attempts, stale navigation cancelled. |
| Voice | Automated pass | Short retry echoes suppressed; short service answers retained; multilingual help speaks page instructions. |
| Pi mic | Code/tests pass; device check pending | Physical microphone selection excludes loopback. USB cleanup recovers; malformed PCM is skipped. Latest 220/250 ms endpointing retained. Measure actual recognition latency on the Pi. |
| Route walkthrough | Automated pass | All 26 production routes mounted with synthetic network/hardware data, with console errors captured. Payment/report guards remain in production code. |
| Scrolling | Code updated; visual check pending | Content grows inside outer scrolling viewport; payment children cannot shrink away; centered order screens use minimum height. Check 720×1280 and 1280×800 on the touchscreen. |
| Checkout | Fixed and tested | Malformed inventory responses show an error instead of crashing on `.filter()`. |
| Reports and receipts | Fixed and tested | PDF generation deduplicates concurrent requests and repairs missing files. Receipt inserts include required cart/amount fields. Legacy endpoints require paid sessions. |
| Email on phone | Automated pass | Uses configured HTTPS payment bridge over the phone's internet; bounded JSON requests; success requires confirmed delivery. No real email sent during tests. |
| Admin | Fixed and tested | Configured account login and expiring bearer sessions protect inventory/speech/price writes. No default-password bypass. Speech settings save offline. |
| Crash recovery | Fixed and tested | Retains current URL; one automatic reload then manual recovery, without silently sending paid users home. |
| Builds | Pass | Kiosk and customer-web production builds. |
| Lint | No errors | 25 existing hook/refresh warnings remain; this is not a warning-free result. |
| GitHub | Review branch | Changes are intended for `codex/reliability-kiosk-latest`, with paired frontend/backend PRs. Merge/deployment are separate. |
| Physical acceptance | Pending | Live Pi browser, speaker/mic loopback, sensors, actual dispensing, real payment provider and email delivery. |

## Automated checks

- 231 intent/echo assertions.
- 14 session, timeout, payment-voice and crash-recovery tests.
- 91 React/jsdom screen and interaction checks (including all 26 production routes).
- Backend: 262 payment/security/pricing/cart assertions, 10 offline API/reliability tests, 20 cloud-report assertions.
- 34 Python microphone/voice/protocol tests.
- Both production builds; lint has zero errors.

The DOM walkthrough does not measure rendered overflow, frame rate or microphone accuracy. The live browser preview was blocked in this environment; there is no justified green tick for the physical kiosk yet.

## Deployment requirements

Deploy the paired backend and frontend together. Keep existing admin credentials. If no admin account exists, configure `RELIV_ADMIN_EMAIL` and a private `RELIV_ADMIN_PASSWORD` of at least 12 characters in the backend service environment; never put it in frontend variables or git. Sign in at `/admin`; a backend restart expires admin sessions.

Keep the Pi API address/port reachable from Chromium and configure `VITE_BACKEND_URL` explicitly when the installation uses another host. Phone payment/email uses `VITE_PAYMENT_API_BASE` (HTTPS) and the customer's internet. Actual SMTP/provider configuration must be checked on deployment.

Before merging/deploying, back up the Pi database and credentials using the deployment's normal process. The email queue migration preserves existing events and adds admin recovery emails. Legacy `/api/send-receipt` and `/api/save-report` now require a real paid session ID; caller-supplied totals or health data cannot manufacture a paid document.
