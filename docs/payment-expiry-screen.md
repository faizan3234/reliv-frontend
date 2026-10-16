# Fresh QR reported expired: confirmed UI bug and remaining diagnosis

The current bridge already validates signed issuedAt/expiresAt and returns REQUEST_EXPIRED plus paymentTiming, or KIOSK_CLOCK_AHEAD. The adapter preserves these fields, but PaymentV2Page replaced the useful message with "Please refresh the QR on the kiosk." This PR preserves the diagnostic and exposes a staff details panel with request ID, kiosk creation/expiry UTC and Oracle time. No medical data, payment code or signing secret appears in these diagnostics.

A fresh QR displaying the payment error has been decoded; this is distinct from camera recognition speed. Possible causes still include an incorrect Pi clock, stale QR actually displayed, wrong Oracle clock, or an old deployed build. This PR does not change expiry limits, accept expired unpaid QRs, or repair a physical clock remotely.

On the Pi run:

```sh
date -u
timedatectl status
```

Compare with the timing panel from a newly generated QR and the Oracle UTC clock. Do not set an old timestamp copied from a chat. An offline Pi needs a correctly set clock and a reliable way to retain it. Changing only the phone clock does not change the signed kiosk timestamps. Keep payment evidence if money was deducted; do not pay again just to diagnose expiry.

Validation: fresh signed window/grace, past/future Pi clocks, malformed windows and paid recovery tests already pass in backend main (test-payment-window.js). Added frontend integration covers retaining the message/times, moving from expired to fresh QR without stale diagnostics, and hiding empty records/file upload. Existing payment identity tests and vault tests remain regression gates. No real Pi clock or live signed QR was available in this workspace, so the root cause of this customer's rejection remains unconfirmed.
