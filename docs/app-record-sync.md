# Optional private app records

Deploy the matching backend PR to Oracle and this customer-web build to Reliv7. Set `RELIV_APP_REPORT_SYNC=true` in the **Oracle bridge environment** and restart that bridge to enable Save to my app. The default is off. Set it to `false` and restart to stop new transfers; normal payment, code display, optional email and existing phone records remain available. This is an operator environment flag, not a switch controlled by an email address or a frontend secret.

After a paid health check, the customer can save readings and text (not a PDF) below the code/card. The exact signed payment package is required; name/email alone cannot retrieve records. The stored scan number and score come from the same snapshot/summary used by the report/card. Profiles group by kiosk private profile ID, never by name. Old packages without a profile ID remain separate.

Records are encrypted locally using AES-GCM and a password-derived key (PBKDF2 SHA-256, 250,000 iterations). The password and key are not sent to the server. Use the Lock button on shared phones. There is no password recovery or cloud account. Clearing site data removes records; an encrypted backup can be downloaded/imported into an empty browser/app. The 500-record limit fails visibly rather than deleting old scans.

Each profile has an auto-save opt-in. While unlocked, later verified scans for that profile save once, by payment request ID. Every new offline kiosk scan still must reach Oracle through its QR; installation does not create a connection to the offline Pi. Opening an old QR does not backfill scans that were never transferred. Browser and installed-PWA storage may differ, particularly on iPhone: install first and scan inside the installed app, or transfer the encrypted backup. OS confirmation is required to install; websites cannot silently install apps.

## Validation

- `npm run lint`, `npm run build`, `npm --prefix customer-web run build`
- `npm run test:app-records`: encryption, wrong password, profile isolation, actual ordinal, duplicate save, consent, quota, concurrent-write rejection, deletion and encrypted backup/import.
- Existing medicine-stock and payment-identity integration suites.
- Browser QA: mobile paid page, save/unlock/lock, feature off, six card variants (solo/couple/friends with short/long text), full-bleed 1080x1920 export.

Live Oracle SMTP delivery, real phone installation/storage, payment, offline Pi and physical motor/drop sensing require on-site tests. An ESP acknowledgement is not proof that a packet reached the customer.

## Finding the save option / October 16 visibility fix

The paid health screen now places **Send my health report to my app** directly below the four-digit code and before the share card. A disabled flag leaves an explanatory disabled control; an unreachable/older bridge shows an unavailable message and retry. This does not bypass the server flag or change payment/email behavior. Check availability again picks up an operator flag change without rescanning.

The live bridge was checked on October 16, 2026 and returned `{"appReportSync":false}` from `https://80.225.243.51/api/v2/app-features`. Reliv7's deployed JavaScript contained the saving feature and the same bridge address. This explains the absent control in the customer's screenshots; it was not evidence of lost records. No production setting was changed remotely.

On Oracle (not the offline Pi), set `RELIV_APP_REPORT_SYNC=true` in the bridge environment/.env, restart its existing service, then verify the endpoint returns true. Refresh Reliv7 or use Check availability again. Setting false disables new saving; existing saved records remain available. Email report delivery is a separate user action. This operator switch is not controlled by knowing an email address.

Validation: 11 new visibility integration checks (off/on/retry/network failure/no automatic export), 19 payment identity checks, vault tests, lint and production builds. No real payment, SMTP delivery or physical dispensing was performed. Old Pi-only scans are not backfilled by installing the app; future QR-transferred saved scans accumulate locally by private profile.

## Simplified records screen

The customer file-upload/import control has been removed. My saved health records appears only when this browser actually contains a saved vault; turning the server feature on alone no longer opens an empty records/password screen. Payment never requires a records password or uploaded file. Existing encrypted data, unlock, scan comparisons and backup download remain. Browser-to-installed-app import is no longer offered in the customer UI; use the original browser for its previously saved records.
