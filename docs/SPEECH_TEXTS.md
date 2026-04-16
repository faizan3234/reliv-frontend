# Reliv Kiosk — Speech Texts (What Each Page Says)

All pages auto-speak when they mount via `usePageSpeech("key")` from `SpeechContext`.
If a custom text is saved via Speech Admin, it overrides the default. If left empty, the **default text below is spoken**.

Admin URL: `/admin-x7k9/speech`

---

## Default Voice Settings

| Setting          | Default Value |
|------------------|---------------|
| Speed (rate)     | 0.95x         |
| Pitch            | 1.0           |
| Language         | en-IN         |
| Voice Preference | Female        |

---

## Page Speech Texts (Default)

| #  | Page                        | Key                        | Default Text Spoken                                                                                        |
|----|-----------------------------|----------------------------|------------------------------------------------------------------------------------------------------------|
| 1  | Splash / Welcome            | `splash`                   | Welcome to Reliv! Your personal health companion. Tap the button to get started.                           |
| 2  | Choose Language              | `choose-language`          | Please select your preferred language to continue.                                                         |
| 3  | Customer Details             | `customer-details`         | Please scan the QR code with your phone to enter your details, or tap Enter Manually to type them in.       |
| 4  | Two Options                  | `two-options`              | Great! How can we help you today? Choose Health Checkup or Medicine Dispensing.                             |
| 5  | Blood Pressure (Health Checkup) | `health-checkup`        | Now we'll check your blood pressure. Please place the cuff on your upper arm and stay relaxed.             |
| 6  | Oxygen & Pulse               | `oxygen-pulse`             | Let's check your oxygen levels. Place your finger gently into the sensor clip.                             |
| 7  | Eye Sight Test               | `eyesight`                 | Let's check your eyesight. Follow the instructions on screen carefully.                                    |
| 8  | Body Temperature             | `body-temperature`         | Time to measure your body temperature. Please stay still for an accurate reading.                          |
| 9  | Body Composition             | `body-composition`         | Let's measure your body composition. Please step on the scale and hold the handles.                        |
| 10 | Report 1 — Blood Pressure    | `report-1`                 | Here is your blood pressure report. Let's review your results.                                             |
| 11 | Report 2 — Oxygen & Pulse    | `report-2`                 | Here is your oxygen and pulse report.                                                                      |
| 12 | Report 3 — Temperature       | `report-3`                 | Here is your body temperature analysis.                                                                    |
| 13 | Report 4 — Eyesight          | `report-4`                 | Here is your eyesight assessment.                                                                          |
| 14 | Report 5 — Full Report       | `report-5`                 | Here is your complete health report. You can email it to yourself or your doctor.                          |
| 15 | Wellness Recommendations     | `wellness-recommendations` | Based on your results, here are personalized wellness recommendations for you.                             |
| 16 | Checkout / Cart              | `checkout`                 | Review your health kits and proceed to checkout when ready.                                                |
| 17 | Payment Gate                 | `payment`                  | Please complete your payment to proceed with your order.                                                   |
| 18 | Order Success                | `order-success`            | Thank you! Your order is being processed and your kits will be dispensed shortly.                          |
| 19 | Feedback                     | `feedback`                 | We would love to hear your feedback about your experience today.                                           |

---

## How It Works

1. **On page mount**: `usePageSpeech("key")` waits 400ms, then calls `speak(key)`
2. **`speak(key)`** looks up `config[key]` — if it has text, speaks it. If empty, falls back to `DEFAULT_CONFIG[key]`
3. **Admin override**: Go to `/admin-x7k9/speech`, enter custom text per page, or upload a `.txt` file
4. **Text cleaning** (upload only): Strips `"` quotes, `*_~` formatting, normalizes punctuation for natural speech
5. **On page unmount**: Speech is cancelled (`stop()`)

---

## Upload File Format

Upload a `.txt` file via Speech Admin. Supported formats:

### Single-line format (recommended)
```
Splash: Welcome to Reliv! Your personal health companion.
Oxygen: Place your finger on the sensor. We will measure your oxygen level.
Body Composition: Please step on the scale. We will measure your weight and height.
Report 5: Here is your complete health report.
```

### Multi-line format
```
Splash
Welcome to Reliv! Your personal health companion. Tap the button to get started.

Oxygen
Let's check your oxygen levels. Place your finger gently into the sensor clip.
```

### Recognized keywords per page
- **Splash**: splash, welcome, intro, home
- **Choose Language**: language, choose language, select language
- **Customer Details**: customer, details, name, registration, qr, manual entry
- **Two Options**: two options, options, health checkup or medicine
- **Health Checkup**: health checkup, blood pressure, bp, bp measurement
- **Oxygen & Pulse**: oxygen, pulse, spo2, oximeter, heart rate, bpm
- **Eye Sight**: eyesight, eye test, vision, near vision
- **Body Temperature**: temperature, body temperature, infrared, thermometer
- **Body Composition**: body composition, weight, height, scale, bmi
- **Report 1**: report 1, bp report
- **Report 2**: report 2, oxygen report, pulse report
- **Report 3**: report 3, temperature report
- **Report 4**: report 4, eyesight report, eye report
- **Report 5**: report 5, full report, final report, complete report
- **Wellness**: wellness, recommendations, suggestion, advice, tips
- **Checkout**: checkout, cart, buy, purchase
- **Payment**: payment, pay, razorpay
- **Order Success**: order success, order confirmation, receipt, success
- **Feedback**: feedback, review, rate, rating
