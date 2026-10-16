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
