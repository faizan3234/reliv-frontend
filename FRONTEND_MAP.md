# Reliv Frontend Architectural Map (FRONTEND_MAP.md)

This map is the single source of truth for the Reliv Health Kiosk frontend architecture. Future agents and engineers should consult this document to understand the system layout, data flows, metric calculations, and invariants without reading the entire repository.

---

## 1. High-Level Workspace Architecture

The workspace contains two frontend applications and an integration test harness:

```
reliv-frontend-main/
├── src/                          # Kiosk Primary Application (Vite + React SPA)
│   ├── components/               # Kiosk UI components (Charts, Modals, Voice, Cards)
│   ├── context/                  # Core React Contexts (Health, Speech, VoiceAssistant)
│   ├── pages/                    # Screen-by-screen flow & 5-page reports
│   ├── services/                 # Hardware bridges, WebSockets, MQTT, Offline storage
│   ├── utils/                    # Calculations, 120+ Biomarkers, Body Composition
│   └── voice/                    # Multilingual copy (en, hi, bn), Layman explainers
│
├── customer-web/                 # Mobile Web App (reliv7.vercel.app/pay)
│   ├── src/pages/PaymentV2/      # Phone payment checkout & secure handoff
│   ├── src/components/           # CheckinCard (Instagram Story generator)
│   └── src/services/             # Request-scoped payment verification & session store
│
├── tests/                        # Full Automated Test Suite (199+ assertions & browser checks)
└── FRONTEND_MAP.md               # This architectural reference map
```

---

## 2. Route & Screen Flow

### Kiosk Flow (`src/App.jsx`)
| Route | Component | Purpose | Spoken Voice Guidance |
| :--- | :--- | :--- | :--- |
| `/` | `Landing.jsx` | Idle loop, attractor animations, ad playback | Yes (Attractor audio) |
| `/choose-language` | `ChooseLanguage.jsx` | Select preferred language (`en`, `hi`, `bn`) | Yes |
| `/customer-form` | `CustomerForm.jsx` | Patient registration (Name, Age, Gender, Phone) | Yes |
| `/health-checkup` | `HealthCheckup.jsx` | Test selection menu & hardware preparation | Yes (`usePageSpeech('health-checkup')`) |
| `/body-composition` | `BodyComposition.jsx` | Height, weight & bioimpedance scale measurement | Yes (`usePageSpeech('body-composition')`) |
| `/oxygen-pulse` | `OxygenPulse.jsx` | SpO2 blood oxygen & heart rate pulse clip | Yes (`usePageSpeech('oxygen-pulse')`) |
| `/body-temperature` | `BodyTemperature.jsx` | Non-contact infrared temperature sensor | Yes (`usePageSpeech('body-temperature')`) |
| `/blood-pressure` | `BloodPressure.jsx` | Automated upper arm blood pressure cuff | Yes (`usePageSpeech('blood-pressure')`) |
| `/payment` | `Payment.jsx` | Displays encrypted payment QR for phone checkout | Yes |
| `/report-1` to `/report-5` | `UnifiedReport.jsx` | 5-Page interactive health report & longevity blueprint | Yes (`SpokenGuide` + `ReportVoiceExplainer`) |

### Mobile Customer Web Flow (`customer-web/`)
| Route / Hash | Component | Purpose | Security Rule |
| :--- | :--- | :--- | :--- |
| `/pay#p=<package>` | `PaymentV2Page.jsx` | Decrypts payment token on phone browser | Never shows PIN/code until authoritative payment confirmation |
| `/pay` | `CheckinCard.jsx` | Instagram Story card generator (Duel, Couple, Friends) | 100% client-side canvas render; no kiosk Wi-Fi required |

---

## 3. State Management & Storage Contracts

### Core Contexts (`src/context/`)
1. **`HealthContext.jsx`**:
   - `data`: Stores `patient` (`name`, `age`, `gender`, `email`, `phone`), `vitals` (`systolic`, `diastolic`, `oxygen`, `temperature`, `bpm`, `weight`, `height`, `impedance`), `history` array, `scanCount`, and `reportSpeechLanguage`.
   - `resetHealth()`: Safely clears active patient vitals upon completion or idle timeout without clearing cached device configuration.

2. **`SpeechContext.jsx`**:
   - Offline-first speech synthesis engine.
   - Attempts browser Web Speech API; seamlessly falls back to bundled WAV audio assets (`/assets/audio/{lang}/...`) if offline or unsupported.

3. **`VoiceAssistantContext.jsx`**:
   - Listens for microphone trigger phrases, navigation intents ("अगला पृष्ठ", "Next page", "ব্লাড প্রেশার"), and language switches.

### Storage Persistence
- `localStorage.getItem('reliv_session_id')`: Active kiosk session ID.
- `sessionStorage.getItem('reliv_profile_access')`: 64-character private profile security token.
- `localStorage.getItem('reliv_challenge')`: Active 2-player health duel record with expiration timestamp.

---

## 4. 120+ Biomarkers Calculation Engine (`src/utils/comprehensiveBiomarkers.js`)

The kiosk computes over 120 clinical, derived, and anthropometric metrics across 5 progressive scan tiers:

### Anthropometric Fallback Guarantee
- If the hardware bioimpedance sensor is not present (`impedance === 0` or `null`), the system **never blocks** the user.
- Anthropometric models (`src/utils/bodyComposition.js`) derive:
  - **Metabolic Age**: Derived via BMR (Harris-Benedict / Mifflin St Jeor) vs chronological age.
  - **Body Water %**: Computed via Total Body Water mass vs total weight (normal: 50% - 65%).
  - **Visceral Fat Level**: Anthropometrically estimated scale (normal: 1 - 9, high: 10 - 14, excess: 15+).
  - **Muscle Mass & Skeletal Muscle**: Estimated from fat-free mass index.
  - **Body Score**: 0-100 vitality composite index.

### Scan Unlock Tiers
- **Scan 1 (16 Core Biomarkers)**: Baseline vitals, BMI, Blood Pressure, SpO2, Heart Pulse, Body Water %, Metabolic Age, Body Score.
- **Scan 2 (32 Advanced Biomarkers)**: Intracellular Water (ICW), Extracellular Water (ECW), Rate Pressure Product (RPP), MAP.
- **Scan 3 (48 Hemodynamic & Metabolic)**: Pulse Pressure, Stroke Volume Index, Cardiac Output estimate, Hydration Efficiency.
- **Scan 4 (72 Cellular & Tissue Reserves)**: Arterial Oxygen Content (CaO2), Subcutaneous Fat, Structural Mass %.
- **Scan 5+ (120+ Longevity Blueprint)**: Physiological Efficiency Index, Longevity Reserve Score, Full Recomposition Matrix.

### Threshold Badge System
Every biomarker includes a clinical status badge:
- 🟢 **Good / Optimal**: Parameter is within ideal demographic reference bounds.
- 🟡 **Caution / Monitor**: Parameter is slightly elevated or borderline; lifestyle optimization advised.
- 🔴 **Alert / Clinical Review**: Parameter requires attention and discussion with a medical practitioner.

---

## 5. Charting Engine (`src/components/ReportHistoryChart.jsx`)

The historical progress charts provide an overview of all metrics with interactive filtering:
- **Combined All-in-One View**:
  - 🔴 Blood Pressure: Red (`#dc2626`)
  - 🔵 Oxygen (SpO2): Blue (`#2563eb`)
  - 🟢 Body Temperature: Green (`#16a34a`)
  - 🟣 Heart Pulse: Purple (`#9333ea`)
  - 🔷 Body Weight: Teal (`#0891b2`)
- **Interactive Pill Filters**: Users can tap individual metric pills ("Blood Pressure", "Oxygen", "Pulse", etc.) to isolate that single metric, or tap "All Metrics" to view the combined chart.
- **SVG Test DOM Invariants**:
  - The chart strictly maintains `circle` elements (`document.querySelectorAll('figure circle')`) and `rect` bars (`document.querySelectorAll('figure rect')`) corresponding exactly to the number of available history points to satisfy automated browser assertions.

---

## 6. Challenge a Friend / Couple Health Duel Flow

### Architecture
- **Trigger**: Click "⚔️ Challenge a Friend" or "💕 Couple Health Duel" on Report 5 (`UnifiedReport.jsx`).
- **Data Stored**: `localStorage.setItem('reliv_challenge', JSON.stringify({ mode, challengerName, challengerScore, challengerMetabolicAge, challengerBodyWater, challengerVisceralFat, expiresAt }))`.
- **Comparison Screen**: `src/components/ChallengeComparison.jsx` activates automatically on Scan 1 for Player 2.
  - Compares Health Score, Inside Metabolic Age, Body Water %, and Visceral Fat Level side-by-side.
  - Declares the winner: "👑 [Winner] wins! [Loser] buys coffee ☕".
- **Instagram Story Card Generator**:
  - Built-in canvas renders an ultra-crisp 1080x1920 (9:16) Instagram Story card.
  - Call to action: "Tag @reliv.health on your Instagram Story — Reliv tags back! 🔥".
  - One-click "Download Story Card (PNG)" and "Share to Story" buttons.
  - **Zero Kiosk Wi-Fi Dependency**: The user can download the image directly to their phone or scan the report QR code with cellular data.

---

## 7. Phone QR Payment Security (`customer-web/`)

### Preventing Payment PIN Leaks
1. **Unpaid Orders**: When an order is generated (`ORDER_READY`), the verification code is strictly set to `''` (empty string).
2. **Authoritative Confirmation**: The confirmation code is only revealed after an authoritative backend verification response (`PAYMENT_CONFIRMED`).
3. **Request-Scoped Caching**: `getPendingVerification(requestId)` and `getPaymentRecovery(encryptedPackage)` strictly require a matching `requestId` and `encryptedPackage`, preventing any cross-session or previous QR code leakage upon browser refresh.

---

## 8. Layman Multilingual Conversational Voice

The kiosk voice system uses warm, conversational everyday language rather than formal or Sanskritized words:
- **Hindi Conversational Terms**:
  - Blood Pressure: "खून का प्रेशर (Blood Pressure)"
  - Oxygen: "साँस और खून में ऑक्सीजन"
  - Pulse: "दिल की धड़कन"
  - Body Water: "शरीर का पानी और हाइड्रेशन"
  - Metabolic Age: "अंदरूनी उम्र यानी मेटाबॉलिक एज"
  - Body Score: "सेहत के नंबर (Body Score)"
- **Explainers**: `src/components/ReportVoiceExplainer.jsx` and `src/voice/reportVoice.js` provide 5-year-old level explanations with relatable analogies (e.g. blood vessels as a garden hose, body fat as an energy piggy bank, muscles as a car engine).

---

## 9. Critical Testing Invariants & Rules

When modifying frontend files, ensure:
1. **`tests/report-insights.test.js`**: `bodyEstimates(vitals, patient)` must not return `metabolicAge` or `visceralFat` directly on the baseline object (extended metrics are computed in `comprehensiveBiomarkers.js`).
2. **`tests/report-browser.jsx`**:
   - `reportCopy.en.titles`, `reportCopy.hi.titles`, and `reportCopy.bn.titles` must remain consistent with the test suite.
   - The disclaimer `v.metabolic` must be preserved in the DOM (`document.body.textContent.includes('cannot measure them reliably')`).
   - SVG `circle` and `rect` counts inside `figure` elements must match the number of historical scan entries.
3. **Test Command**:
   ```bash
   npm test
   ```
   Must pass with 0 failures across all 46 test suites and all integration browser runners.
