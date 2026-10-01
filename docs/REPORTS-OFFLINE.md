# Offline reports and sensor handoff

## What changed

- Every paid report route shows the current saved measurements immediately, including scan 1. Optional email no longer makes a valid report appear incomplete.
- Report hydration replaces the previous report's patient, measurements and history. Missing sensor values stay missing.
- Report QR/photo QR actions were removed. Read reports on the kiosk; customers do not need to join Wi-Fi and land in the advertising portal to read them. Payment QR flow is unchanged.
- Raw impedance is not shown in the measurement summary. Missing impedance is no longer replaced with 500. Existing calculated composition estimates are not direct sensor measurements.
- The body-composition page saves height and weight from the latest incoming readings, avoiding a React state timing race.
- Customer details accepts an optional email. The backend counts locally completed paid visits with that email, without exposing previous health readings. A shared/mistyped email is not proof of identity. Anonymous visits cannot be linked reliably.
- Current values are available immediately. Historical charts need actual authorized earlier readings; a visit count cannot establish a health trend or medical accuracy. No historical chart is fabricated when earlier readings are unavailable.
- Backend report pricing migrates once to ₹17 and uses the same setting for new authoritative payment requests. Existing payment requests retain their original amounts.

## Deployment

Merge the frontend and companion backend PRs. On the Pi, with Internet access for Git/package downloads and no customer session active:

```bash
cd ~/backend
git pull --ff-only
npm ci
```

Restart your existing backend process (Ctrl+C in its terminal, then `npm start` there). Do not launch a second process on port 5000. The price migration runs on startup.

```bash
cd ~/frontend
git pull --ff-only
npm ci
npm run build
sudo python3 deploy/install_frontend.py
```

The installer defaults to `/var/www/reliv`; use `--target` with the actual nginx web root if different. It keeps previous hashed assets and publishes HTML last. Reopen the kiosk page after deployment and reconnect to RELIV-KIOSK before measuring.

## Keep the sensor contract

ESP connects to the local broker at `192.168.50.1:1883`; the browser uses local MQTT WebSockets. Publish non-retained results only in response to an active measurement. Handle `stop` by cancelling the pending result. Replace simulated readings with validated, correctly calibrated sensor readings; do not change topic names, units or JSON fields.

| Command on `kiosk/command` | Response topic | Example schema (test data only) |
| --- | --- | --- |
| `height` | `kiosk/sensor/height` | `{"height_cm":172.3}` |
| `bp` | `kiosk/sensor/bp` | `{"systolic":120,"diastolic":80,"bpm":72}` |
| `oxygen` | `kiosk/sensor/oxygen` | `{"oxygen":98,"bpm":72}` |
| `temperature` | `kiosk/sensor/temperature` | `{"temperature_f":98.4}` |

Weight currently has a separate transport: the Pi weight service must answer `GET /api/weight` on port 5001 with `{"weight":65.4,"impedance":null}`. Weight is kg. Only include a positive impedance value when genuinely measured by compatible equipment. Return null when no current reading exists; never continuously return the previous person's weight. The browser defaults to `http://localhost:5001` because it runs on the Pi.

For an ESP-connected scale, the real firmware/service must preserve this API contract (the temporary Python test receiver is not production sensor support). For a BLE scale, replace the test receiver with its real Pi driver. Stop the test receiver before starting the real service: both cannot own port 5001. Changing Arduino firmware alone is sufficient for the unchanged MQTT measurements, but not automatically for a different scale protocol.

## Verification and boundaries

Automated checks cover all five paid report routes, first visits without email, snapshot replacement, payment denial, stable local visit counts, ₹17 migration/pricing, and offline MQTT measurement state. Lint and production build also pass. Hardware calibration, actual scale freshness, physical 1280×800 touch layout, real payment and email delivery still require on-Pi verification. Email cannot be sent from a permanently Internet-isolated Pi merely by entering an address.
