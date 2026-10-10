# Customer PWA installation and session lifetime

Scope: `customer-web` deployed to Reliv7. Kiosk application and payment bridge remain unchanged.

- Android home includes an install action. Uses the browser's retained `beforeinstallprompt` event and one-shot tap guard. If unavailable, explains Chrome's install menu; it does not pretend an install succeeded. The OS/browser owns final confirmation. Installed standalone apps and iPhones hide the Android control.
- Square maskable PNG icons and Apple touch icon derive from the existing Reliv SVG wordmark. `app-icon.svg` contains the padded source. Portrait standalone manifest and one 480px maximum layout keep the same phone layout on large screens. Native vertical scrolling and editable inputs remain available.
- App text disables selection and touch callouts. Viewport/touch policies discourage zoom; browsers and accessibility settings can override them. This is a PWA, not OS-level kiosk mode.
- Valid QR feedback already plays a short chime and requests one 1,000ms vibration. Browser audio activation and vibration support still apply; real iPhone/Android hardware must verify output.
- Only a bridge-confirmed paid response writes the code cache. It is local to this browser profile, bound to the exact encrypted package and request. Ads now have the same retention behavior. It is not a second payment-authorisation mechanism or human identity check.
- Five minutes starts on the first successful code reveal, not scan/page-open time. A slow payment therefore receives the full viewing window. Reopening or re-verifying the same cached request does not extend it. Expiry and Done remove code storage and the URL package. Unsettled payment proof is not discarded by automatic refresh.
- A valid local code restores without creating another order. New QR packages cannot inherit another package's code. Storage-denied sessions retain the code in memory while open; persistent reopening cannot be guaranteed when the browser denies storage.
- Manual refresh checks for updates without reloading an active scanner/payment/code. When idle it refreshes the page. Every five minutes the production PWA checks for updates and refreshes only an idle app. A waiting worker asks every live tab whether it is idle; any busy or unresponsive tab defers activation.
- Each production build emits a changed worker cache version, and Vercel serves the worker/manifest without stale HTTP caching. Updates arrive after deployment, not merely after a Git commit. Closed PWAs update when opened with connectivity. No forced update during payment.

Verification commands:

```
npm run lint
node --test customer-web/test/*.test.js tests/customer-session.test.js tests/customer-pwa-updates.test.js
node tests/run-integration.js tests/customer-pwa-browser.jsx
node tests/run-integration.js tests/payment-identity-browser.jsx
node tests/run-integration.js tests/payment-scanner-browser.jsx
npm --prefix customer-web run build
```

Real installation approval, native Safari behavior, UPI app return, physical camera/sound/vibration and live settlement require phone/on-site checks. Five minutes is the UI retention limit, not a change to the bridge/kiosk authorization validity.
