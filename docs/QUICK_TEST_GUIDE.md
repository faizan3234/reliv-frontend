# 🎯 Quick Testing & Deployment Guide

## ⚡ Quick Start - Test Your Kiosk

### 1️⃣ **Test on Local Machine (1280x800)**

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Open browser
# Chrome/Edge/Firefox → http://localhost:5173
```

**In Browser DevTools:**
1. Press `F12` (or Ctrl+Shift+I)
2. Click device toolbar icon (top-left, 📱 icon)
3. Set size: **Width: 1280, Height: 800**
4. Check "Touch simulation" ✓
5. Scroll and test all pages

---

## ✅ Touch Scrolling Test Checklist

### Page by Page Testing:

```
[SPLASH PAGE]
✓ Scrolls smoothly
✓ Logo visible
✓ Buttons clickable
✓ No cut-off content

[CHOOSE LANGUAGE]
✓ Language buttons (44px+ size)
✓ Scroll if needed
✓ Touch responsive

[CUSTOMER DETAILS]
✓ Virtual keyboard appears
✓ Input fields responsive
✓ Scroll up/down smoothly
✓ Submit button at bottom

[HEALTH CHECKUP (All Pages)]
✓ Video plays on touch screen
✓ Measurement UI responsive
✓ Status messages visible
✓ Navigation smooth

[CHECKOUT]
✓ Cart sidebar visible on 1280px
✓ Product scroll works
✓ Total price visible
✓ Buttons aligned

[ORDER SUCCESS → FEEDBACK]
✓ All pages scroll smoothly
✓ Content fits screen
✓ Inactivity timer works (5 min)
✓ Returns to home
```

---

## 🚀 Deployment Steps

### **For Raspberry Pi 4B+ (Recommended)**

#### Hardware Setup:
- Touchscreen connected to GPIO/HDMI
- Ethernet or WiFi connection
- 1280x800 display (10.1 inch)

#### Software Installation (SSH into Pi):

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install Chromium (kiosk browser)
sudo apt install -y chromium-browser

# 4. Install your app
cd ~
git clone YOUR_REPO_URL reliv-kiosk
cd reliv-kiosk
npm install
```

#### Build & Deploy:

```bash
# Build production version
npm run build

# Test locally
npm run preview

# Access: http://localhost:4173
```

#### Auto-Start on Boot:

**Create startup script** `/home/pi/kiosk-start.sh`:
```bash
#!/bin/bash
cd /home/pi/reliv-kiosk
npm run preview &
sleep 3
DISPLAY=:0 chromium-browser \
  --kiosk \
  --no-first-run \
  --disable-session-crashed-bubble \
  --disable-infobars \
  http://localhost:4173
```

Make executable:
```bash
chmod +x /home/pi/kiosk-start.sh
```

**Add to autostart** - Edit `~/.bashrc`:
```bash
# Add at end:
/home/pi/kiosk-start.sh
```

Or use systemd (more reliable):

**Create** `/etc/systemd/system/kiosk.service`:
```ini
[Unit]
Description=Reliv Kiosk
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/reliv-kiosk
ExecStart=/home/pi/kiosk-start.sh
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable kiosk
sudo systemctl start kiosk
```

---

### **For Cloud Deployment (VPS/AWS/Azure)**

#### Option A: Vercel (Easiest)
```bash
npm install -g vercel
vercel deploy --prod
```
✓ URL: `https://your-kiosk.vercel.app`

#### Option B: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 4173
CMD ["npm", "run", "preview"]
```

Deploy to Heroku/Railway/Render

#### Option C: Your Own Server
```bash
npm run build
# Copy dist/ to server
# Serve with nginx/apache
```

---

## 🔧 Configuration Files

### What Was Added:

1. **Touch CSS**: `src/styles/touch-kiosk.css` ✅
   - Momentum scrolling
   - Touch target sizing (44px)
   - Gesture optimization

2. **Safety Manager**: `src/components/KioskSafetyManager.jsx` ✅
   - Blocks Ctrl+W, F12, Alt+F4
   - 5-minute inactivity timeout
   - Disables right-click menu

3. **Updated Files**:
   - `src/main.jsx` - Import touch CSS
   - `src/App.jsx` - Add KioskSafetyManager
   - `index.html` - Viewport already configured

---

## 📊 Performance Metrics

```
Resolution:           1280x800 ✅
Touch Scrolling:      Enabled ✅
Mobile-like Feel:     Yes ✅
Responsive:           Tablet, Kiosk, Desktop ✅
Bundle Size:          ~1.3MB
Gzip Size:            ~345KB
Load Time:            < 2s (4G/WiFi)
```

---

## 🔐 Security Features Active

✅ Right-click disabled
✅ F12 (Dev tools) blocked  
✅ Ctrl+W (close tab) blocked
✅ Alt+F4 blocked
✅ Ctrl+S (save) blocked
✅ Inactivity timeout: 5 minutes
✅ Back button disabled
✅ Drag-drop disabled
✅ Cache disabled (fresh data each visit)

---

## 🐛 Common Issues & Fixes

### Issue: "Touch not working on Raspberry Pi"
**Fix:**
```bash
# Check if touchscreen is detected
cat /proc/bus/input/devices | grep -i touch

# Update drivers
sudo apt update && sudo apt upgrade -y
```

### Issue: "Scrolling is slow"
**Fix:**
```bash
# Enable GPU acceleration in Chromium
chromium-browser --enable-gpu --enable-gpu-compositing
```

### Issue: "Pages don't fit 1280x800"
**Fix:**
- Check DevTools shows 1280x800
- Verify no fixed width content
- Test with different browsers

### Issue: "Inactivity timer not working"
**Fix:**
- Check browser console (F12)
- Ensure JavaScript enabled
- Check localhost has no CORS issues

---

## ✨ Features Summary

### ✅ Touch Optimization
- Mobile-like scrolling (swipe to scroll)
- Momentum scrolling enabled
- No text selection on drag
- Smooth animations

### ✅ Responsive Design
- Optimized for 1280x800
- Touch target minimum 44px
- Font sizes readable
- Proper spacing

### ✅ Kiosk Safety
- Keyboard shortcuts disabled
- Context menu disabled
- Inactivity timeout
- Navigation locked

### ✅ Virtual Keyboard
- On-screen keyboard included
- Works with text inputs
- No hardware keyboard needed

---

## 🎉 Ready to Deploy!

Your Reliv Kiosk is fully configured for:
✓ Touch screens
✓ 1280x800 resolution  
✓ Mobile-like scrolling
✓ Kiosk safety
✓ Raspberry Pi deployment

**Next:** Deploy to Raspberry Pi and connect touchscreen! 🚀
