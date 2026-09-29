# Release audit: 29 September 2026

This is a source and automated regression audit, not certification of a physical kiosk or a guarantee that every bug is eliminated.

## Corrections

- Measurement MQTT callbacks use current request state, ignore unsolicited/duplicate readings, allow retry after errors, and release clients/listeners/timers on navigation.
- Missing oxygen/pulse/temperature readings show a retry state. They are never replaced by random health readings. Demo report data exists only in test fixtures.
- Mobile profile submission keeps its session URL, prevents duplicate requests, aborts on navigation, and has a request deadline. Admin login/inventory requests similarly cancel stale work.
- Hook dependency warnings and unstable dependencies were corrected; splash reset callbacks remain stable. Blocked browser storage no longer crashes the app entry point/report gate.
- Failed report history requests stay empty; no sample patient or random purchase counts are displayed.
- Existing ad-only `/advertise` isolation, original logo, native phone scrolling, upload-before-payment handoff and splash/ad transitions are preserved and regression-tested.

## Payment and phone follow-up

- Rebased onto main including the merged iPhone captive-browser handoff fix (#34).
- Removed permanent pre-React kiosk handlers that blocked phone copying and payment windows. Route-aware guards retain kiosk restrictions and explicitly exclude phone/admin routes, with cleanup on navigation.
- Background taps and scroll do not leave `/advertise`; the kiosk ad player only observes input on its own splash screen. On the physical idle kiosk, the requested touch-to-start behavior remains.
- Razorpay script loading has a 20-second deadline and a clean retry. Checkout ignores backdrop taps; duplicate success and late dismiss/error callbacks cannot replace payment success. The displayed amount retains paise.
- Restoring a saved payment link does not expose a misleading back-to-review control for a campaign no longer loaded in memory.
- A captive Wi-Fi window is controlled by iOS/Android and can close when Wi-Fi is switched off. Existing iPhone guidance preserves/copies the payment link before leaving; this website cannot promise to override OS window behavior.

## Passed checks

- `npx eslint . --max-warnings 0`: zero errors and warnings.
- `npm test`: intent/echo checks, 199 kiosk-session assertions, 33 Node tests, 117 UI integration checks, 43 ad checks and 18 measurement checks.
- `npm run build`: Vite production bundle.
- A second production build with an empty `envDir`: no dependency on committed environment files for compilation. Live hardware still requires valid externally supplied configuration.
- HTTP smoke check of that production build: SPA HTML and referenced assets load for `/`, `/advertise`, `/admin`, `/payment`, `/pay` and `/report-1` through Vite preview. This does not verify the Pi's nginx configuration.
- `git diff --check`.

UI integration uses real React pages/providers in jsdom, with network and hardware boundaries simulated. It catches runtime and lifecycle regressions but does not measure layout, GPU/video playback or physical touch latency. No unexpected console errors occurred in these integration runs.

## Deployment configuration: act before pulling

The tracked `.env` and `.env.vercel` files are deleted by this change because they contained credential fields. Preserve the kiosk's required build settings outside version control before pulling, for example by backing up `.env` into the ignored `.env.local` file. Supply required Vite settings through `.env.local` or the deployment environment; consult `.env.example`. Do not commit the backup.

Credential-looking values previously committed for MongoDB, Gmail, Razorpay and MQTT must be rotated in their owning services. Removing files from the current tree does not erase git history or rotate credentials. Backend secrets must never use a `VITE_` prefix. Browser MQTT credentials are public to browser users and must be restricted by broker ACLs.

## Required on-site release checks

1. Deploy both repositories, preserve external configuration, and verify the Pi's API proxy and SPA route fallback. Open `/advertise`, `/admin`, payment and report URLs directly and refresh them.
2. Run the backend's `deploy/install-ads-captive-portal.sh --check`; install its documented configuration from the Pi console if needed. Test fresh Wi-Fi joins on the actual iPhone/Android phones. A QR cannot force an OS to join and open a browser without its prompts; use the poster's smaller URL QR if the portal does not open.
3. Test the production build at 1920×1080 plus phone portrait/landscape: touch/trackpad scrolling, keyboard/modal placement, media fit, speech interruption, actual Chromium compatibility and console/network logs.
4. Upload a real large video, interrupt Wi-Fi, finish a real gateway payment over mobile data, then enter its code on the kiosk. Confirm correct booked hours, one-time activation, replay rejection, ad/splash interval settings and empty-playlist behavior.
5. Disconnect/reconnect MQTT and the backend; restart the Pi during pending and paid workflows. Verify inventory/fulfillment recovery and long-duration playback/memory behavior.

These physical, deployment and live-payment checks remain unverified remotely. Clinical validity of the existing report calculations is outside this software audit.
