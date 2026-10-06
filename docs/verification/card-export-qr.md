# Card exports and kiosk QR reliability

Card markup is adapted from `src/voice/Untitled-1.html`, `cards2.html`, and
`cards3.html`. The customer templates retain their photographs and scrapbook
layouts, remove editor controls, and bind user text through `textContent`.
Only the current report's score is shown; a friend or partner name does not
fetch or invent a second person's score.

Exports load same-origin photos as data URLs, wait for bundled fonts, and
capture a full-size clone. The PNG is 1080 × 1920. An image load failure now
fails export visibly instead of silently saving an image with missing photos.
The font measurement override prevents Tailwind's image reset from shifting
html2canvas text below its intended baseline. Font licenses are in
`customer-web/public/fonts`.

The camera requests 1920 × 1080 and continuous focus when available, decodes
up to 20 frames/second at up to 1280 pixels, and navigates trusted payment
packages to the same-origin `/pay` route. Browser camera permission remains
required. Payment method apps may take the user outside the PWA temporarily.

Dense payment QR codes now use L correction (short links retain M), trading
some damage tolerance for larger modules. Six-module white borders and a
large QR view improve screen capture. Encrypted payment data is unchanged;
this does not add an online short-link dependency to the offline kiosk.

## Verification

- Root kiosk and customer-web production builds passed.
- Eight payment QR tests passed, including real backend-format fixtures,
  maximum capacities, same-origin navigation and untrusted-link rejection.
- Existing card data tests passed.
- Automated Chromium at a 390 × 844 viewport exported all three designs;
  all bundled photos decoded, all downloads were 1080 × 1920. Saved images
  were visually inspected, including names, coffee and self-care photos.
- `cards.png` shows the actual saved PNGs with synthetic report data.
- The four supplied camera screenshots could not be decoded by the image
  decoder, so their exact rejection cause could not be established.

Physical iPhone/Android camera latency and native sharing still need device
acceptance testing. No live charge, email, or payment confirmation was sent.
No guaranteed one-second scan time is asserted.
