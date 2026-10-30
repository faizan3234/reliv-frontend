# Adaptive customer app integration

The customer app remains in reliv-frontend/customer-web. Keep faizan3234/nutrition as a separately deployed Python API. Do not copy model weights or API secrets into the frontend.

## Implemented
- Optional local fitness setup; Scan & Pay uses the existing payment scanner and verified checkout. Active checkout remains mounted while navigating.
- Data / Diary / Scan / AI / Me navigation. Existing paid health records remain separate and untouched.
- IndexedDB fitness profile and atomic confirmed meal batches; daily water and weight logs, deletions, export, five-day expandable summaries, weight chart.
- Actual food search/photo/text API adapter. Camera upload works through the phone's image capture control; unknown dishes require matching; no auto-log. Reviewed portions and consumed percentages determine totals.
- Android install offer only when the browser provides it; no iPhone installation prompt.
- No fabricated kiosk readings, body composition, nutritional targets, or payment success.

## Connect nutrition
1. Deploy nutrition with its dependencies and suitable licensed model weights. Its `/api/readiness` reports missing production gates; a running HTTP service alone does not mean the model is ready.
2. Set `CORS_ALLOWED_ORIGINS=https://reliv7.vercel.app` on that service (add only actual preview origins you need).
3. Set customer-web build environment `VITE_NUTRITION_API_URL=https://YOUR-NUTRITION-SERVICE` and rebuild. Do not put Groq, JWT signing or admin secrets into Vite variables.
4. Verify a real phone photo returns the intended foods and editable portions, then confirm and inspect the diary. The bundled nutrition catalogue identifies itself as illustrative/not verified; deploy an approved sourced catalogue before relying on its values.
5. Photo upload sends images to that service. Local fitness storage stores entries, not photos.

## Explicit remaining work / release gates
- This PR provides guest device storage, not cross-device sync. A real identity/authorization and sync contract is required before enabling cloud records. Existing signed payment/report saving is preserved. Standalone health-data QR imports are deliberately not accepted without a verified protocol.
- AI tab supports nutrition text parsing, optional browser dictation, photo review and spoken logged-data summary. It is not a conversational clinical AI. Browser voice support and connectivity vary; no offline speech promise.
- Recipe builder logs confirmed ingredients; generated recipe recommendations, nutrition trend charts, edit/repeat meal shortcuts, chosen streak goals and notification scheduling remain follow-up features.
- No shop/ad purchasing or placeholder success has been introduced.
- Device records can be lost if browser storage is cleared. Export is available; automatic cloud backup is not.
- No Pi, live payment, camera hardware, model accuracy or phone installation test was performed by this code-only change.

Run `npm run build` in customer-web and `node --test customer-web/tests/care-data.test.mjs` from repository root. Test real QR checkout, returning to a pending payment, reload persistence, camera denial, unknown food, mixed plate, slow API, and Android/iPhone before release.
