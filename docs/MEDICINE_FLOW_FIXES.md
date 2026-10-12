# Medicine photos, entry and payment scanning

Medicine selection now remains selected: choose Medicine, enter details, go directly to the catalog. No private health-profile PIN is created or requested. New/Returning continue directly to the health check after their existing private profile steps. Service selection is still sent to the backend with the pairing token. A failed service request can be retried without repeating successful profile creation.

Existing /medicine-images database URLs are resolved through /api/medicine-images. The backend companion PR must be installed first: nginx already proxies /api, while the old root path was being handled by the static kiosk website. No medicine image files or database rows are moved or erased. Missing files show a visible fallback; an actually deleted file still needs re-uploading in admin.

The collection screen shows delivered item quantities rather than internal job-group counts when the backend provides them. Confirmation remains based on actual matched dispenser ACKs; no timer invents delivery and no status refresh publishes another motor command.

The customer QR scanner now reads live video dimensions on every capture. qr-scanner caches its scan-region object; camera resolution constraints may change video size without another loadedmetadata event. Static dimensions could crop the wrong part of the new frame. The full frame is retained after resolution changes/rotation, resolution is requested up to 2560x1440 where supported, and scanning is capped at 8fps to reduce repeated large frame work. Native camera capability still determines focus and speed; no one-second guarantee is claimed.

Validation: kiosk and customer production builds, frontend lint; medicine entry and pairing tests, image URL tests, dense QR decoder fixtures and live-dimension unit tests, scanner lifecycle and delivery UI browser checks. Hardware, live iPhone/Android camera performance and actual dispensing remain on-site checks.
