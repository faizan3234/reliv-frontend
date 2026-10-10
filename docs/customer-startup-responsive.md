# Reliv7 startup and small-screen follow-up

- Initial HTML includes a branded, accessible loading message and three animated dots. It works before the React bundle downloads. After 3.5 seconds the message changes; after 12 seconds a retry button and connection/payment guidance appear. Reduced-motion users see static dots.
- The main stylesheet no longer blocks the first loading-screen paint. The loading screen stays until both the application mounts and its stylesheet is available. React startup/render errors show a reload screen instead of a white page. Reload retains the existing device-local payment deadline.
- Google Fonts are removed from the startup network path. System fonts provide immediate readable text; optional story cards retain their own local fonts.
- Optional share-card templates and export tools load after a successful health payment. Their network failure offers a card-only retry without hiding the kiosk code. Main JS decreases from approximately 470 kB / 124 kB gzip to 204 kB / 63 kB gzip in production builds.
- Four-digit code boxes flex to fit narrow phones. Headers simplify below 360px, content wraps, touch targets remain at least 44px, and landscape safe-area padding/native vertical scrolling remain available. App width stays at most 480px.
- Card resizing falls back to window resize when ResizeObserver is absent. Build output targets ES2018 syntax; this does not polyfill every platform API or guarantee support for obsolete browsers.

Validation: lint and customer production build pass. Startup HTML regression, 19 payment identity checks, 15 install/session checks and 19 scanner checks pass. Chromium layout checks cover 280, 320, 360, 375, 390, 414, 430, 480, 667 (landscape), and 1024px widths. Deliberately blocked startup JS still shows loading and retry. No phone-brand-specific behavior is assumed.

The OS-controlled launch splash appears before web content can draw and cannot show these custom messages. Real old/new Safari, Android vendor browsers, camera timing, native scroll feel and payment-app return need physical device testing. Very old BlackBerry/other browsers may lack required camera, WebAssembly or PWA support.
