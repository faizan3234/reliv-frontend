# Scanner feedback and story export fixes

## Confirmed issues
The solo template's min-height:100vh exceeded the 746.67px story height on tall
viewports. The export captured only 746.67px, cutting off lower rows. Long
names/notes also pushed the friends and couple compositions past that boundary.
Header stickers and the lower background texture overlapped card content.
Mobile-width export also lost text when the offscreen capture inherited page
scroll coordinates; the cloned capture now uses the origin and zero scroll.
Images used cover/scale transforms, which cropped photo content and were not
reliably reproduced by html2canvas.

## Changes
All three cards now fit their complete natural-height composition into one fixed
9:16 canvas. Font loading and size changes update the preview fit; export fits
again after images/fonts finish. The output stays 1080x1920, with a full-bleed
background. Longer text reduces composition scale instead of cutting off rows.
Photos use contain sizing, and export embeds decoded images at that exact fit.
Existing local photo stickers remain; the footer-overlapping background texture
is hidden in both preview and download. No new externally hosted artwork.
The couple label says My Health Score because the displayed score belongs to
the authenticated person, not an invented combined couple score.

Scanner feedback adds a short two-tone confirmation sound prepared from the
open-scanner user gesture, plus an explicit enable/test button on the direct
scan route. Existing one-second optional vibration remains. Acceptance is
still guarded once per code and validation/payment authority is unchanged.
Resolution, continuous focus, exposure and white balance are requested
independently where exposed; resolution rejection no longer skips focus.
Refresh camera offers a stream restart without needing a torch toggle.
No automatic torch flashing, inferred payment success or performance guarantee.

## Verification
- 9 scanner Node checks and 19 scanner browser lifecycle checks pass.
- 19 payment identity/browser checks pass.
- ESLint and customer-web production build pass.
- Real headless Chromium rendered and exported solo, couple and friends cards,
  with short and long names/notes at 1200x1000 and 390x844 viewports.
- All tested image/field/footer bounds stayed inside the story canvas and all
  visible local photos loaded; saved PNGs were inspected for clipping.
- Live Reliv7 served the Scan kiosk payment QR entry during inspection.

Camera hardware, autofocus quality, iPhone audio policy/silent settings and
Android haptics still need on-device testing. No live financial transaction
was made. Updating the deployed customer-web build is required.
