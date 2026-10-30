# Customer diary and coach — 31 October 2026

This changes the real customer-web app, not the isolated investor demo. Existing kiosk payment and paid report handling remain separate.

Implemented: blue water glasses and one-tap additions with undo; breakfast/lunch/snack/dinner accordions and meal correction; text/microphone/photo chat; selectable/copyable/spoken responses; confirmed local water/weight actions; persistent atomic Undo/Redo journal; one-tap named habit trackers; explicit dietary preferences; question/consumption distinction; biryani clarification; duplicate meal warning; five-entry weight outlier prompt; logged meal/water streak, weight progress and cautious projections from two weeks of entries. Images are resized before sending and not retained in the diary.

The nutrition repository provides food search, text parsing and photo-provider adapters. Configure an HTTPS VITE_NUTRITION_API_URL and matching CORS origin. Its optional /api/coach endpoint is disabled by default; online conversation needs a provider key/model and the production authentication bridge. Users consent before any chat/summary is sent. Model text never executes app writes.

## Remaining acceptance gaps

This is not exact screenshot parity or the complete requested product. Automatic clinical target recommendations, tracker macros/XP, complete recipe builder, all fitness charts, eight day adaptations, wake-time logging migration, notifications and cross-device sync remain unfinished. Health QR import remains on the verified existing report path, not arbitrary unsigned health JSON.

No buffet calorie guess is silently logged and no water-to-flush-sodium prescription is made. No Trust Pool money/refunds are implemented: editable phone-only streaks cannot verify financial eligibility. A rolling 23-hour calendar is not implemented; entries retain their actual dates.

The food catalogue is illustrative until reviewed against reliable composition data; no live recognition accuracy, phone camera/microphone, production payment or offline Raspberry Pi validation is claimed. Browser storage is not guaranteed permanent: clearing app data or losing the phone can remove records. Export remains available.

Run node --test customer-web/tests/*.test.mjs and npm run build in customer-web. Backend tests cover bounded inputs, disabled service, production authentication and non-executable replies. Re-run real-device checks before deployment.
