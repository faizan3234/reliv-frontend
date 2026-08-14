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
