# 🖥️ Reliv Kiosk Setup Guide
## Raspberry Pi + Chromium Touch Screen Configuration

---

## 📋 Prerequisites

- Raspberry Pi 4 (recommended) or 3B+
- Touch screen display (1280x800 recommended)
- Raspberry Pi OS (Bookworm or Bullseye)
- Stable internet connection
- microSD card (16GB minimum)

---

## 🚀 Step 1: Update Your System

```bash
sudo apt update && sudo apt upgrade -y
sudo reboot
```

---

## 🖱️ Step 2: Install Touch Screen Drivers

```bash
# Install touch input drivers
sudo apt install -y xserver-xorg-input-libinput xserver-xorg-input-evdev

# Verify touch device is detected
xinput list
```

---

## 🎯 Step 3: Calibrate Touch Screen

```bash
# Install calibration tool
sudo apt install -y xinput-calibrator

# Run calibration (touch the 4 corners when prompted)
xinput_calibrator
```

After calibration, save the output:

```bash
sudo mkdir -p /etc/X11/xorg.conf.d
sudo nano /etc/X11/xorg.conf.d/99-calibration.conf
```

Paste the calibration output and save (`Ctrl+X`, `Y`, `Enter`).

---

## 🌐 Step 4: Install & Configure Chromium

```bash
# Install Chromium if not present
sudo apt install -y chromium-browser

# Install unclutter to hide mouse cursor
sudo apt install -y unclutter
```

---

## ⚙️ Step 5: Configure Chromium Flags for Touch

Create/edit the Chromium flags file:

```bash
mkdir -p ~/.config
nano ~/.config/chromium-flags.conf
```

Add these flags:

```
--touch-events=enabled
--enable-touch-drag-drop
--disable-pinch
--overscroll-history-navigation=0
--disable-features=TranslateUI
--disable-infobars
--noerrdialogs
```

Save and exit.

---

## 🔄 Step 6: Setup Kiosk Autostart

Edit the autostart file:

```bash
sudo nano /etc/xdg/lxsession/LXDE-pi/autostart
```

Replace contents with:

```bash
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xset s off
@xset -dpms
@xset s noblank
@unclutter -idle 0.1 -root
@chromium-browser --kiosk --touch-events=enabled --enable-touch-drag-drop --disable-pinch --noerrdialogs --disable-infobars --disable-session-crashed-bubble --start-fullscreen http://YOUR_KIOSK_URL
```

> ⚠️ Replace `http://YOUR_KIOSK_URL` with your actual URL (e.g., `http://localhost:5173` or your deployed URL)

---

## 🔒 Step 7: Disable Screen Blanking

```bash
sudo nano /boot/config.txt
```

Add at the bottom:

```
# Disable screen blanking
consoleblank=0
```

Also edit:

```bash
sudo nano /boot/cmdline.txt
```

Add at the end of the line (same line, not new line):

```
consoleblank=0
```

---

## 🖥️ Step 8: Set Screen Resolution (Optional)

```bash
sudo nano /boot/config.txt
```

Add or modify:

```
# Force 1280x800 resolution
hdmi_group=2
hdmi_mode=28
hdmi_force_hotplug=1
```

Common resolutions:
| Mode | Resolution |
|------|------------|
| 28   | 1280x800   |
| 35   | 1280x1024  |
| 16   | 1024x768   |
| 85   | 1280x720   |

---

## 🔁 Step 9: Auto-Restart on Crash

Create a watchdog script:

```bash
sudo nano /home/pi/kiosk-watchdog.sh
```

Add:

```bash
#!/bin/bash
while true; do
    if ! pgrep -x "chromium-browse" > /dev/null; then
        chromium-browser --kiosk --touch-events=enabled --enable-touch-drag-drop --disable-pinch --noerrdialogs --disable-infobars --start-fullscreen http://YOUR_KIOSK_URL &
    fi
    sleep 10
done
```

Make it executable:

```bash
chmod +x /home/pi/kiosk-watchdog.sh
```

Add to crontab:

```bash
crontab -e
```

Add this line:

```
@reboot /home/pi/kiosk-watchdog.sh &
```

---

## 🧪 Step 10: Test Touch Input

```bash
# Check touch device
cat /proc/bus/input/devices | grep -A 5 "touch"

# Test touch events
sudo apt install -y evtest
evtest
```

Select your touch device and tap the screen to see events.

---

## 🔧 Troubleshooting

### Touch Not Working
```bash
# Check if device is detected
xinput list

# Reinstall drivers
sudo apt install --reinstall xserver-xorg-input-libinput
sudo reboot
```

### Touch Inverted/Offset
```bash
# Recalibrate
xinput_calibrator

# Or manually set transform matrix
xinput set-prop "YOUR_TOUCH_DEVICE" "Coordinate Transformation Matrix" 1 0 0 0 1 0 0 0 1
```

### Screen Flickering
```bash
sudo nano /boot/config.txt
```
Add:
```
disable_overscan=1
hdmi_drive=2
```

### Chromium Crashes
```bash
# Clear cache
rm -rf ~/.cache/chromium
rm -rf ~/.config/chromium

# Increase GPU memory
sudo nano /boot/config.txt
```
Add:
```
gpu_mem=128
```

---

## 📱 Quick Reference Commands

| Task | Command |
|------|---------|
| Reboot | `sudo reboot` |
| Check touch devices | `xinput list` |
| Calibrate screen | `xinput_calibrator` |
| Kill Chromium | `pkill chromium` |
| Start Chromium kiosk | `chromium-browser --kiosk http://URL` |
| Check logs | `journalctl -xe` |
| Edit autostart | `sudo nano /etc/xdg/lxsession/LXDE-pi/autostart` |

---

## ✅ Final Checklist

- [ ] System updated
- [ ] Touch drivers installed
- [ ] Touch screen calibrated
- [ ] Chromium flags configured
- [ ] Autostart configured with kiosk URL
- [ ] Screen blanking disabled
- [ ] Mouse cursor hidden
- [ ] Watchdog script running
- [ ] Tested touch scrolling

---

## 🎉 Done!

Reboot your Raspberry Pi:

```bash
sudo reboot
```

Your Reliv kiosk should now start automatically in fullscreen with touch support!

---

*Last updated: February 2026*
*For Reliv Health Kiosk v1.0*
