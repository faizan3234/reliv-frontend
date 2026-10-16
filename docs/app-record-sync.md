# Password-free app records

On Oracle keep `RELIV_APP_REPORT_SYNC=true` to permit structured paid-record export. Setting it false disables new transfers without changing payment, code display, email or existing phone records. No backend change is required for password-free storage.

Tap **Send my health report to my app** once. It saves readings/text, original scan number, private profile key and verified summary; it does not store a PDF. The same profile's later paid scans auto-save when their QR is opened here. Auto-save can be switched off in My saved health records. Duplicate request IDs do not duplicate scans. Different private profiles are not merged by name.

Records reopen without any password. Anyone using the unlocked phone/browser can view them. New records use `reliv-device-records-v2`; legacy encrypted `reliv-private-records-v1` is never deleted or overwritten. Legacy encrypted data cannot be decrypted without its original password; this change does not silently migrate it.

Saving happens before installation, so cancelling installation cannot lose an already saved scan. Android offers Install Reliv; iPhone shows Safari Add to Home Screen instructions. The OS requires approval, and a website cannot force installation or guarantee browser/PWA storage sharing. If an installed app has separate storage, open the same paid QR inside it and tap Save; do not pay again. Later scans must also reach that app via their QR. There is no background channel from the offline Pi and no cross-device account sync.

The browser is asked for persistent storage, but may refuse. Records survive ordinary restarts; clearing storage, uninstall behavior, browser eviction or phone loss can remove them. Download records backup is a plaintext JSON export containing health data. Storage failures show an error; old scans are not silently removed to make room.

Validation: password-free save/reopen, scans 1–7, deduplication, profile separation, original encrypted data preserved, storage failure and concurrent same-document saves. JSX compiled separately. Real Android/iOS installation and cross-container storage need device verification.
