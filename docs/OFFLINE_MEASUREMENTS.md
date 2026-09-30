# Offline measurement readiness

The Pi hotspot has no Internet. Chromium's navigator.onLine flag cannot prove
whether the local MQTT broker is reachable. Previously BP, oxygen and temperature
required both this flag and MQTT, leaving Measure disabled with MQTT green.
These pages now use local MQTT connectivity for readiness and show Local link
instead of claiming to detect the Wi-Fi radio. A connected broker does not prove
an ESP32 is present; a missing sensor response still times out normally.

The existing protocol is unchanged:
- kiosk/command: height, bp, oxygen, temperature, stop
- kiosk/sensor/height: {"height_cm":172.3}
- kiosk/sensor/bp: {"systolic":120,"diastolic":80,"bpm":72}
- kiosk/sensor/oxygen: {"oxygen":98,"bpm":72}
- kiosk/sensor/temperature: {"temperature_f":98.4}
- Weight: existing Pi scale GET /api/weight service on port 5001 (or configured URL).

After merging, on the Pi with Internet available for git:

```bash
cd ~/frontend
git pull --ff-only origin main
npm run build
sudo python3 deploy/install_frontend.py
```

Use the installer's --target option if nginx has a different web root from
/var/www/reliv. Restore RELIV-KIOSK and reopen the kiosk page. The installed app
runs without Internet. No backend or ESP32 protocol update is needed.

For simulator testing, keep the temporary weight service running on port 5001
and use the ESP32 sketch with separate HTTP and MQTT WiFiClient instances.
Restart the temporary weight service before a new session to discard its saved
weight. Stop it and remove reliv-test-weight.py when using the real scale.

Validation: lint, production build, and measurement-browser integration checks
with navigator.onLine=false, offline events, broker disconnect/reconnect, command
counts, retained packets, retries and displayed readings. Physical Pi/ESP32
verification still needs the updated build installed on the kiosk.
