# RELIV CUSTOMER HTTPS WEBSITE

Standalone mobile-first customer web application for the Reliv Health Kiosk system.

## Architecture
- **HTTPS Hosted**: Deployed on a secure HTTPS domain.
- **Top-Level Navigation Handoffs**: Communicates with the local Raspberry Pi (`http://192.168.50.1`) via HTML form POST top-level navigation, preventing browser Mixed Content blocking.
- **Payment Bridge Integration**: Integrates with the Payment Bridge via HTTPS for Razorpay order creation and independent RSA-signed payment authorization.
- **Zero-Trust Client**: Client browser contains no payment secrets, RSA keys, or pricing authority.

## Setup & Running
```bash
npm install
npm run dev
```

## Environment Variables
Copy `.env.example` to `.env` and set:
- `VITE_CUSTOMER_SITE_URL`
- `VITE_PAYMENT_BRIDGE_URL`
- `VITE_RAZORPAY_KEY_ID`
- `VITE_KIOSK_FALLBACK_URL`

## Built-in kiosk scanner

Open **Scan kiosk payment QR**, or `/scan`, in the customer app. The rear camera
starts after browser permission. Live scanning uses native QR detection where
available and a bundled worker decoder otherwise. No camera frames are uploaded.
A photo picker is available if camera permission is denied. Camera capture stops
on close, backgrounding, and successful detection.

Only `/pay#p=...` links from the current origin or `https://reliv7.vercel.app`
are accepted. The scanner transfers the package to same-origin `/pay`, leaving
signature, expiry, price, payment recovery, confirmation code, report and card
handling to the existing checkout and bridge. Other QR destinations are rejected.
If the official payment hostname changes, update `src/services/paymentQr.js`.
External phone-camera scans still open the original HTTPS link normally.

The manifest supplies standalone installation and `/` scope. On iPhone, use
Safari's Add to Home Screen. Camera access requires HTTPS and user permission;
UPI provider apps may open externally, as before. Payment needs Internet.
Recognition speed depends on focus, lighting, QR density and hardware. Test the
actual kiosk screen and installed app on physical iPhone and Android before
release; desktop browser emulation cannot verify camera optics or UPI returns.
The service worker caches only the shell/static scripts; never payment APIs.

Validation: `node --test test/payment-qr.test.js` and `npm run build`.
