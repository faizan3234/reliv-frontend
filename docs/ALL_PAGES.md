# Reliv Kiosk — All Pages & Routes

## Kiosk Flow (in order)

| #  | Route                        | Page                  | Purpose                                              |
|----|------------------------------|-----------------------|------------------------------------------------------|
| 1  | `/`                          | Splash                | Welcome screen / intro animation                     |
| 2  | `/choose-language`           | Choose Language        | Select language (English / Hindi / Bengali)           |
| 3  | `/customer-details`          | Customer Details       | Enter name, age, sex — via QR or manual entry         |
| 4  | `/two-options`               | Two Options            | Choose: Health Checkup or Medicine Dispensing          |
| 5  | `/health-checkup`            | Health Checkup (BP)    | Blood Pressure measurement                            |
| 6  | `/oxygen-pulse`              | Oxygen & Pulse         | SpO₂ oxygen saturation + heart rate (BPM)             |
| 7  | `/eyesight`                  | Eye Sight Test         | Near vision screening — left & right eye chart        |
| 8  | `/body-temperature`          | Body Temperature       | Infrared temperature measurement                      |
| 9  | `/body-composition`          | Body Composition       | Weight & Height measurement (scale + sensor)          |
| 10 | `/report-1`                  | Report 1 — BP          | Blood Pressure results & advice                       |
| 11 | `/report-2`                  | Report 2 — Oxygen      | Oxygen & Pulse results & advice                       |
| 12 | `/report-3`                  | Report 3 — Temperature | Temperature results & advice                          |
| 13 | `/report-4`                  | Report 4 — Eyesight    | Eyesight results & advice                             |
| 14 | `/report-5`                  | Report 5 — Full Report | Combined full health report                           |
| 15 | `/wellness-recommendations`  | Wellness Recs          | Personalized recommendations based on results         |
| 16 | `/checkout`                  | Checkout / Cart        | Review selected items & cart                          |
| 17 | `/payment`                   | Payment Gate           | Razorpay payment processing                           |
| 18 | `/order-success`             | Order Success          | Order confirmation & receipt                          |
| 19 | `/feedback`                  | Feedback               | User feedback form                                    |

## Medicine Dispensing (optional)

| Route                  | Page                 | Purpose                                          |
|------------------------|----------------------|--------------------------------------------------|
| `/medicine-dispensing`  | Medicine Dispensing   | OTC medicine dispenser (enabled via localStorage) |

## Mobile / QR Routes

| Route            | Page                 | Purpose                                        |
|------------------|----------------------|-------------------------------------------------|
| `/h`             | Mobile Entry Gateway | QR scan landing — validates session token        |
| `/mobile-entry`  | Mobile Entry         | Phone-based patient data entry via QR link       |

## Admin (Hidden)

| Route                  | Page          | Purpose                                          |
|------------------------|---------------|--------------------------------------------------|
| `/admin-x7k9/speech`   | Speech Admin  | Edit TTS text for each page + voice settings      |

## Other

| Route    | Page  | Purpose          |
|----------|-------|------------------|
| `/team`  | Team  | Team / credits   |
