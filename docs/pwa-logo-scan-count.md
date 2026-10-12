# Reliv app logo and report count

The supplied vector artwork is the source for `customer-web/public/app-icon.svg`, the SVG favicon, 192px and 512px manifest PNGs, and the 180px Apple touch icon. Manifest icons use `purpose: any`: the supplied edge-to-edge lettering must not be cropped by an Android mask. The service-worker shell cache version changes with this artwork. Installed devices may update their home-screen artwork on their own schedule.

Report responses from older bridges may contain the count of retained emailed reports as `totalScans`. The customer page now never displays a total smaller than the authoritative `scanNumber`. The companion backend change returns actual scan number separately from `retainedReports`.
