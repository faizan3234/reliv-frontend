# Android QR scanner → payment browser

## Observed problem and boundary

The same QR pays successfully in the website but may fail to launch Google Pay when opened in a scanner's embedded browser. This is consistent with a WebView intent restriction; we have not inspected the customer's exact Android browser. Razorpay documents mobile-web Google Pay intent support on HTTPS Chrome and limitations for Chrome WebViews. A website cannot modify another app's native WebView handling.

References:
- https://razorpay.com/docs/payments/payment-methods/upi/google-pay
- https://razorpay.com/docs/payments/payment-methods/upi/upi-intent
- https://developer.chrome.com/docs/android/intents

## Fix

Android payment pages offer Continue in Chrome and Copy this payment link, including error recovery. Known WebView user agents get a more prominent explanation; unknown Android scanner browsers still get the fallback. The button is an explicit user-tapped Android intent, not a timed redirect. It preserves the exact encrypted #p fragment and targets Chrome; no payment/health capability is moved into query parameters. Android parses the final #Intent marker, leaving the original URL fragment in its data URI.

If the host scanner blocks the Chrome intent, the customer uses its Open in browser menu or pastes the same link into Chrome. No second QR scan is needed while the request remains valid. Browser storage is not shared; the destination rechecks the original signed request with Oracle. The backend's existing request idempotency is unchanged. This does not implement direct merchant UPI links or bypass Razorpay verification.

Preload the SDK when the order is ready; if already loaded, opening stays in the user's tap. Abort an outstanding SDK launch when its page unmounts, close failed checkout before retry, and suppress duplicate terminal callbacks. Dismissal rechecks Oracle before returning to Pay. Browser switching is hidden during active checkout. Pending callback evidence no longer claims payment is received before server verification. Guidance tells customers to return to the existing page instead of promising an automatic return or telling them to rescan.

Shared card fonts are bundled from source assets in both root/kiosk and customer-web builds; the old customer-web-only public URLs caused missing fonts in the kiosk build. Font bytes are unchanged and licenses remain in customer-web/public/fonts.

## Evidence

- Full `npm test` passed: 78 Node tests and existing integration suites (payment identity, reports/voice, idle handling, ads, medicine stock, support).
- New Android integration: 10 checks including same-link handoff, one checkout on double tap, no switch while paying, dismiss/recovery, code only after server-paid, active-modal unmount cleanup.
- Checkout/unit tests: timeout/retry, abort, synchronous SDK opening, failure cleanup, duplicate terminal callbacks, exact fragment round-trip, oversized/insecure URL rejection.
- Lint and root/customer-web production builds passed. Missing card-font build warnings resolved.
- Standalone Chromium could not launch in this runtime (SIGSEGV before a page opened); no new real-device visual or native app-switch test claimed. No live payment performed.

## Real Android acceptance

1. Scan one kiosk QR with Android camera/Google Pay scanner. If its browser cannot open UPI, tap Continue in Chrome; if blocked use menu/copy fallback.
2. Confirm the same service/amount, tap Pay once, choose Google Pay, complete payment, return to Chrome. The code must follow server verification.
3. Test Cancel, back, app switch, a slow network, and a failed bank payment. A retry must use the same order and never expose another customer's code.
4. If money was deducted, check the same payment before another attempt. Expired/invalid QR and missing Internet require explicit recovery; no promise of universal one-tap success.
5. Confirm merchant UPI Intent availability in Razorpay and test real Android Chrome plus the specific Google Pay/scanner version. Browser/PWA data remains separate from another browser's local records.
