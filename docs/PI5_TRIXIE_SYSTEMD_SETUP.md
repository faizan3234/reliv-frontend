# 🍓 Raspberry Pi 5 + Trixie + systemd Setup

## ⚡ Quick Setup (Copy & Paste Commands)

Your Raspberry Pi 5 with Trixie OS and systemd is the **perfect setup** for a healthcare kiosk!

```
Raspberry Pi 5:     Latest hardware ✓
Trixie OS:          Latest Debian-based (best support) ✓
systemd:            Modern service management ✓
Touch Support:      Built-in (libinput) ✓
GPU Acceleration:   Full support ✓
```

---

## 🚀 INSTALLATION (5 Minutes)

### **1. Update System**
```bash
sudo apt update && sudo apt upgrade -y
```

### **2. Install Node.js**
```bash
sudo apt install -y nodejs npm
# Trixie has Node 18+ in repos
```

### **3. Install Chromium**
```bash
sudo apt install -y chromium-browser
```

### **3b. Install TTS Engine (Required for Voice/Speech)**
```bash
sudo apt install -y espeak-ng speech-dispatcher
# Verify it works:
espeak-ng "Hello from Reliv"
# If no sound, check audio output:
aplay -l
# Set volume to max:
amixer set Master 100% unmute
amixer set PCM 100% unmute
```

### **4. Clone Project**
```bash
cd ~
git clone <YOUR_REPO> reliv-kiosk
cd reliv-kiosk
npm install
npm run build
```

### **5. Create systemd Service**

```bash
sudo tee /etc/systemd/system/reliv-kiosk.service > /dev/null << 'EOF'
[Unit]
Description=Reliv Healthcare Kiosk
After=network.target
Wants=graphical.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/reliv-kiosk
Environment="NODE_ENV=production"
Environment="NODE_OPTIONS=--max-old-space-size=1024"
ExecStart=/usr/bin/npm run preview
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target graphical.target
EOF
```

### **6. Create Kiosk Launch Script**

> ⚠️ **24/7 kiosk mode** — screen blanking and audio suspend are disabled here.
> This is the fix for the Pi screen/sound going off after a few minutes.

```bash
cat > /home/pi/launch-kiosk.sh << 'EOF'
#!/bin/bash
sleep 3
killall chromium-browser 2>/dev/null || true
sleep 1
export DISPLAY=:0
export PULSE_SERVER=unix:/run/user/1000/pulse/native
export XDG_RUNTIME_DIR=/run/user/1000

# ── PREVENT SCREEN FROM GOING OFF (24/7 kiosk fix) ──────────────────
xset s off          # disable screensaver
xset -dpms          # disable Energy Star / DPMS power management
xset s noblank      # disable screen blanking
# For Wayland/labwc (Pi 5 default desktop):
# wlr-randr --output HDMI-A-1 --on 2>/dev/null || true

# ── PREVENT AUDIO FROM GOING SILENT ─────────────────────────────────
amixer set Master 100% unmute 2>/dev/null || true
amixer set PCM 100% unmute 2>/dev/null || true
# Keep PulseAudio alive and prevent auto-suspend
pactl set-sink-volume @DEFAULT_SINK@ 100% 2>/dev/null || true
pactl set-sink-mute  @DEFAULT_SINK@ 0   2>/dev/null || true
# Disable PulseAudio module-suspend-on-idle (silences audio after inactivity)
pactl unload-module module-suspend-on-idle 2>/dev/null || true

chromium-browser \
  --kiosk \
  --no-first-run \
  --no-default-browser-check \
  --disable-session-crashed-bubble \
  --disable-infobars \
  --enable-smooth-scrolling \
  --enable-gpu \
  --enable-hardware-video-decode \
  --autoplay-policy=no-user-gesture-required \
  --enable-speech-dispatcher \
  --disable-gpu-compositing \
  --disable-software-rasterizer \
  --use-gl=egl \
  http://localhost:4173
EOF

chmod +x /home/pi/launch-kiosk.sh
```

### **6b. Disable Screen Blank at OS level (permanent fix)**

Run these once on your Pi — they survive reboots:

```bash
# Raspberry Pi OS (Bookworm / Trixie) — disable blanking in lightdm
sudo bash -c 'cat >> /etc/lightdm/lightdm.conf << EOF
[SeatDefaults]
xserver-command=X -s 0 -dpms
EOF'

# Also disable in /boot/cmdline.txt (prevents console blanking)
sudo sed -i '$ s/$/ consoleblank=0/' /boot/cmdline.txt

# Disable PulseAudio idle suspend permanently
sudo sed -i 's/^load-module module-suspend-on-idle/#load-module module-suspend-on-idle/' \
  /etc/pulse/default.pa 2>/dev/null || \
sed -i 's/^load-module module-suspend-on-idle/#load-module module-suspend-on-idle/' \
  ~/.config/pulse/default.pa 2>/dev/null || true

# Reboot to apply
sudo reboot
```

### **7. Create Display Service**

```bash
sudo tee /etc/systemd/system/reliv-kiosk-display.service > /dev/null << 'EOF'
[Unit]
Description=Reliv Kiosk Display
After=reliv-kiosk.service display-manager.service
Wants=reliv-kiosk.service

[Service]
Type=simple
User=pi
ExecStart=/home/pi/launch-kiosk.sh
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=graphical.target
EOF
```

### **8. Enable & Start Services**

```bash
# Enable auto-start on boot
sudo systemctl daemon-reload
sudo systemctl enable reliv-kiosk.service
sudo systemctl enable reliv-kiosk-display.service

# Start now
sudo systemctl start reliv-kiosk.service
sudo systemctl start reliv-kiosk-display.service

# Check status
sudo systemctl status reliv-kiosk.service
```

### **9. Reboot to Test**

```bash
sudo reboot
```

✅ **Website should load automatically after boot!**

---

## 📊 systemd Commands Reference

### **View Service Status**
```bash
sudo systemctl status reliv-kiosk.service
sudo systemctl status reliv-kiosk-display.service
```

### **View Real-Time Logs**
```bash
# Follow logs as they appear
sudo journalctl -u reliv-kiosk.service -f
sudo journalctl -u reliv-kiosk-display.service -f
```

### **View Past Logs**
```bash
# Last 50 lines
sudo journalctl -u reliv-kiosk.service -n 50

# Last 100 lines
sudo journalctl -u reliv-kiosk.service -n 100

# Since last boot
sudo journalctl -u reliv-kiosk.service -b
```

### **Stop/Start/Restart Services**
```bash
# Stop
sudo systemctl stop reliv-kiosk.service

# Start
sudo systemctl start reliv-kiosk.service

# Restart
sudo systemctl restart reliv-kiosk.service

# Disable auto-start (but still manual control)
sudo systemctl disable reliv-kiosk.service
```

### **View Service Files**
```bash
# View service configuration
sudo systemctl cat reliv-kiosk.service

# Edit service (opens nano editor)
sudo systemctl edit --full reliv-kiosk.service
```

---

## 🔍 Verify Touch Works

### **Check Touchscreen Detected**
```bash
cat /proc/bus/input/devices | grep -i touch
```

Should show:
```
N: Name="FT5x06 Touchscreen"
or similar
```

### **Test Touch Input**
```bash
# Monitor touch events in real-time
cat /dev/input/event0 | od -x

# Touch screen - should see data flowing
# Ctrl+C to stop
```

### **In Browser Console**
```javascript
// Open DevTools (F12) and paste:
document.addEventListener('touchstart', (e) => {
  console.log('Touch detected at:', e.touches[0].clientX, e.touches[0].clientY);
});

// Try touching screen - should see coordinates in console
```

---

## 🎯 Verify Everything Works

### **Test Website**
```bash
# SSH into Pi
ssh pi@<pi-ip>

# Check if website is running
curl http://localhost:4173

# Should get HTML response
```

### **Check Services Running**
```bash
sudo systemctl status reliv-kiosk.service
# Should show: Active: active (running)

sudo systemctl status reliv-kiosk-display.service
# Should show: Active: active (running)
```

### **Monitor Resource Usage**
```bash
# CPU/RAM usage (refresh every 2 seconds)
top -u pi

# Or simpler:
htop

# Press 'q' to quit
```

---

## 🐛 Troubleshooting

### **Issue: Website doesn't load on boot**

**Check logs:**
```bash
sudo journalctl -u reliv-kiosk.service -n 50
sudo journalctl -u reliv-kiosk-display.service -n 50
```

**Common causes:**
- Port already in use
- npm not installed
- Project files not accessible

**Fix:**
```bash
# Kill anything on port 4173
sudo lsof -i :4173 | awk 'NR!=1 {print $2}' | xargs sudo kill -9

# Restart services
sudo systemctl restart reliv-kiosk.service
```

### **Issue: Touch not working**

**Check driver:**
```bash
cat /proc/bus/input/devices | grep -i touch
```

**If not showing, install drivers:**
```bash
sudo apt install -y xserver-xorg-input-libinput
```

**Restart services:**
```bash
sudo systemctl restart reliv-kiosk-display.service
```

### **Issue: Website scrolls slow**

**Enable GPU in Chromium:**
Already in launch-kiosk.sh with `--enable-gpu`

**If still slow, optimize:**
```bash
# Edit launch script
sudo nano /home/pi/launch-kiosk.sh

# Add these flags:
--enable-oop-rasterization
--enable-gpu-compositing
--disable-gpu-vsync

# Then restart:
sudo systemctl restart reliv-kiosk-display.service
```

### **Issue: Chromium window doesn't appear**

**Check DISPLAY variable:**
```bash
echo $DISPLAY
# Should show: :0

# If empty, add to launch-kiosk.sh:
export DISPLAY=:0
```

**Test Chromium directly:**
```bash
export DISPLAY=:0
chromium-browser --version
```

---

## 📈 Performance Optimization for Pi 5

### **Enable All GPU Features**

Edit `/boot/firmware/config.txt`:
```bash
sudo nano /boot/firmware/config.txt
```

Add/modify:
```ini
# GPU Memory (Pi 5 has more headroom)
gpu_mem=512

# Video acceleration
dtoverlay=vc4-kms-v3d
enable_gpu_memory_scaling=1

# Performance
arm_freq=2400
over_voltage=0
```

Save and reboot.

### **Update GPU Drivers**

```bash
sudo apt install -y rpi-eeprom
sudo apt install -y mesa-utils

# Check version
glxinfo | grep "OpenGL version"
```

---

## 🔄 Update Website Code

### **Pull Latest Changes**

```bash
cd ~/reliv-kiosk
git pull origin main
npm install  # If dependencies changed
npm run build

# Restart services
sudo systemctl restart reliv-kiosk.service
```

### **Update via Script**

Create `/home/pi/update-kiosk.sh`:
```bash
#!/bin/bash
cd ~/reliv-kiosk
git pull
npm install
npm run build
sudo systemctl restart reliv-kiosk.service
echo "Kiosk updated!"
```

Make executable:
```bash
chmod +x /home/pi/update-kiosk.sh

# Run anytime:
./update-kiosk.sh
```

---

## 🎬 Daily Operations

### **Check if Running**
```bash
sudo systemctl status reliv-kiosk.service
```

### **View Recent Errors**
```bash
sudo journalctl -u reliv-kiosk.service -p err -n 20
```

### **Restart Services**
```bash
sudo systemctl restart reliv-kiosk.service
sudo systemctl restart reliv-kiosk-display.service
```

### **Manual Update & Restart**
```bash
cd ~/reliv-kiosk
git pull && npm install && npm run build
sudo systemctl restart reliv-kiosk.service
```

---

## ✨ Raspberry Pi 5 Advantages

```
✓ BCM2712 CPU (8-core @ 2.4GHz)
✓ 8GB RAM standard
✓ M.2 NVMe support (super fast storage)
✓ Full GPU acceleration
✓ Hardware video decoding
✓ Modern libinput drivers
✓ systemd (perfect for services)
✓ Trixie OS (latest & greatest)

Perfect for healthcare kiosk! 🏥
```

---

## 📋 Final Checklist

Before declaring "ready":

- [ ] systemd services running (`sudo systemctl status`)
- [ ] Website loads at http://localhost:4173
- [ ] Touch input detected (`cat /proc/bus/input/devices`)
- [ ] Website appears in Chromium
- [ ] Touch scrolling works smooth
- [ ] 1280x800 resolution correct
- [ ] Inactivity timeout works (5 min)
- [ ] Logs clean (no errors: `journalctl`)
- [ ] Reboot test (auto-start works)
- [ ] All pages accessible

---

## 🚀 You're Ready!

Your healthcare kiosk is now:
✅ Optimized for Pi 5
✅ Running on Trixie OS
✅ Managed by systemd
✅ Auto-starting on boot
✅ Production-ready

**Let's help patients! 🏥**
