# Reliv7 health sections

My Health shows the latest saved scan and score for the selected private profile. Scan QR uses the existing payment scanner. Health Records lists every saved scan, with expandable readings, previous-scan values, profile selection, auto-save toggle and backup download.

Navigation does not rewrite the payment URL or delete session recovery. An existing payment page stays mounted while sections change, with a Return to payment / kiosk code button. The camera unmounts when leaving Scan QR.

Record storage and the server feature flag are unchanged. Data survives ordinary restarts without a password. Clearing browser/app data, phone loss or storage eviction can remove it: there is no promise of forever or cross-device cloud storage. Back up before clearing data or replacing the phone. Only scans actually saved to this browser/app appear; the offline Pi cannot send unscanned measurements in the background.

Validation: node tests/health-sections.mjs tests actual App/MyHealth/MyRecords with mocked payment/scanner dependencies, seven saved scans, another profile, unchanged storage, camera unmount and preserved payment mount. Changed JSX compiled. Physical phones, actual camera, payment and production build not verified in this change.
