# Medicine, camera and delivery repair

Medicine-only visitors save their basic details without creating a health PIN, select MEDICINE on the local API, and go directly to the medicine list. Report-review test mode has an explicit no-PIN medicine button. Health-profile PIN protection is unchanged.

Medicine image URLs now use /api/medicine-images so nginx's existing /api proxy reaches the local backend. Deploy the matching backend alias before this frontend. Existing image files and stored paths remain unchanged.

The pinned qr-scanner 1.4.2 adapter refreshes the capture region on video resize (camera constraints and orientation changes), and immediately after tuning. The old region could omit much of the higher-resolution preview. Twelve maximum scan attempts per second limit repeated full-frame work. The decoder's existing rotation/inversion/full-frame behavior is preserved. This uses a version-specific library method isolated in one adapter with a real-library regression test; review when upgrading qr-scanner.

After 90 seconds without confirmation, OrderSuccess displays and speaks staff-help instructions instead of Preparing indefinitely. Background status checks continue; an authoritative all-items confirmation enables collection. The backend moves overdue jobs to durable staff review; once in that state, staff must reconcile delivery. No timeout fabricates success, repeats a motor command, clears an unresolved paid order or starts a new payment.

Validation: 128 main browser checks; 24 medicine-stock checks; 22 offline-voice checks including delayed/partial/late ACK behavior; 20 report-review checks; 19 scanner browser checks; scanner Node tests including actual resize adapter and dense QR raster transformations. Kiosk lint and both production builds pass (existing build advisories remain).

Not a real-phone motion/autofocus benchmark. Half-hidden or strongly blurred codes cannot be guaranteed to decode. No actual motor delivery, speaker output or Oracle SMTP test was performed. The backend repository contains sensor firmware but no dispenser motor sketch; hardware ACK diagnosis needs that sketch and Pi MQTT logs. Never simulate successful delivery to clear a paid order.

Consolidates the medicine-photo work from frontend #70 while preserving the newer #69 stock controls. Use this PR with backend #44 instead of merging both older and newer pairs. Health entry keeps its existing service-choice behavior; only medicine entry bypasses it.
