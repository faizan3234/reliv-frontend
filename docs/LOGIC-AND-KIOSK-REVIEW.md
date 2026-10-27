# Kiosk review — 27 October 2026

Frontend: https://github.com/faizan3234/reliv-frontend/pull/81
Backend companion: https://github.com/faizan3234/backend/pull/52

## What changed, in everyday language

- **Next customer's cart:** Rahul's finished cart could remain when Raj started. Ending the visit now clears the cart, readings and credentials from both storage areas. A failure in one storage area does not stop clearing the other. Merely creating a checkout session still preserves the chosen cart.
- **Large medicine orders:** The hardware has a short queue deadline and a maximum number of motor cycles. The UI and backend now allow at most ten units across an order. The customer sees why before paying. Tax, service charges and rounding policy are unchanged.
- **Feedback that disappears:** The old health form continued to say success after an API failure. It now waits for a successful local save, shows an error/retry or exit, prevents simultaneous submissions, and reuses a reference on retry. The backend saves feedback even without email. Admin has a local feedback list.
- **Wrong app-save request:** Turning the feature on could request a report before any auto-save profile existed. Automatic transfer now requires previous auto-save consent. Switching QR packages cancels stale requests and does not let an old request unlock a new submit. Saving remains password-free; existing records are preserved.
- **Made-up comparison numbers:** Missing challenger results previously became example scores/ages. Missing values now remain missing; no winner card is generated without both real scores. A genuine zero stays zero.
- **Reading the kiosk:** Customer entry now matches the orange/white brand, with stronger touch/focus states and simpler spacing. Splash retains the original wave/logo. Reports use calmer surfaces, an improved score ring, and an expandable weight explanation so the main report is not pushed so far down.

The backend document explains preserved dispensing evidence, stock guards, transaction/session binding and why an offline inventory snapshot is not live post-delivery stock.

## Verification and limits

The regression suite exercises session reset, storage failure, expired payments, network loss, measurement recovery, report access/scan numbers, narration coordination, stock changes and password-free app saving. Kiosk and customer-web production builds and lint are checked. Mocked production screenshots were inspected at 1280×800 and a 390-pixel phone width; they are not physical Pi tests.

There is no promise of zero crashes forever or an objective 10/10 rating. Exact Pi Chromium, touch hardware, speakers, sensors, network transitions, real payment capture and email delivery still need the operator checks in the backend document. Unavailable voice services in a mock environment are not evidence that physical audio works. Changes do not replace simulated sensor values with new algorithms.

Install the backend companion before the frontend to provide `/api/admin/feedback`. Never pay twice or replay a motor command to investigate an uncertain delivery. Keep unresolved orders available for staff review.
