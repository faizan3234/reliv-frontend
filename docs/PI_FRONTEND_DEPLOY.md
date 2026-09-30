# Repair CSS preload failures on the Pi

`Unable to preload CSS for /assets/KioskApp-....css` means the browser failed to
load a production stylesheet. It is not an MQTT error. The screenshot alone
cannot distinguish a missing file, a stale deployment, or an nginx response
with the wrong MIME type. Refreshing the same broken deployment cannot fix it.

This build puts all CSS into one stylesheet loaded directly by index.html.
Kiosk and phone JavaScript remain lazy-loaded. The install script validates
the build manifest, copies assets first, and atomically replaces index.html
last. It never deletes old hashed assets needed by existing tabs.

After merging, update and build with internet available (npm ci only if needed):

```bash
cd ~/frontend
git pull --ff-only origin main
npm run build
sudo python3 deploy/install_frontend.py
```

The default nginx web root is /var/www/reliv. If your active nginx site uses a
different root, pass `--target /actual/web/root` instead. Do not copy index.html
alone and do not delete the live assets directory during deployment.

Activate the RELIV-KIOSK hotspot again, then open
http://192.168.50.1/?reliv_reload=css-fix. No internet is needed to install a
previously built dist or run the kiosk. Installing frontend files does not
restart Mosquitto or change backend configuration.

If an asset still fails, inspect its exact URL on the Pi with
`curl -I --noproxy '*' http://192.168.50.1/assets/EXACT-FILENAME.css`.
It must return 200 with Content-Type text/css, not HTML. Ensure nginx serves
the configured web root, loads mime.types, and does not return index.html for
missing /assets files. This script validates files on disk; it does not modify
nginx or prove network delivery. Build once, install that same complete dist.

Local checks:
`python3 -B -m unittest discover -s deploy -p 'test_*.py'`
and `python3 deploy/install_frontend.py --check` after `npm run build`.
