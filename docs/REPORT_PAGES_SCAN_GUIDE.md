# Reliv Health Kiosk: Complete Report Pages (1–5) & Scan Progression Guide (Scans 1–7)
*A Comprehensive Clinical Architecture, UX Design Philosophy, and Real-World Case Study Guide*

---

## Part 1: Architecture of the 5 Report Pages

The Reliv Health Kiosk report experience is engineered around a single core design philosophy:  
**Measure → Simplify → Compare → Explain → Recommend.**

Rather than dumping raw medical data onto the screen, the report organizes complex physiological indicators into five digestible pages. This structure serves both **casual users** (who want immediate answers about their overall wellness and simple action steps) and **curious/power users** (who want to explore tissue compositions, efficiency ratios, and longitudinal trends).

| Page | Title | Core Focus & Clinical Objective |
| :--- | :--- | :--- |
| **Report 1** | **Your Body Overview** | Immediate reassurance & summary: Health Score (0–100), Metabolic Age vs Chronological Age, Peer Group Reference (72), Confetti milestone, Multilingual voice narration, and Everyday Wellbeing remedies. |
| **Report 2** | **Which Body Systems Are Strongest** | Multi-system breakdown: BMI, Body Fat %, Muscle Mass, Bone Mass, Water Balance, Weight Control, Fat Control, Muscle Control, and Ideal Body Weight. |
| **Report 3** | **Tissue Composition & Body Reserves** | Raw sensor vitals (Height, Weight, Blood Pressure, Pulse, SpO2, Temperature) + Deep Structural Biomarkers (Bone Mass, Protein Mass, LBMI, Structural Mass, Subcutaneous Fat). |
| **Report 4** | **Your Scan Comparisons & Progress Graph** | Longitudinal central tracking hub: Single All-in-One Combined Chart (Line/Bar with dual Y-axes) + Derived Performance Analytics (Fat-Muscle Ratio, Hydration Efficiency, Metabolic Load, Energy Reserve, Muscle Efficiency). |
| **Report 5** | **Your Summary, Vision & Next Steps** | Full Screening Synthesis, Eye Vision Acuity check, Take-Home Scannable QR Code (`reliv7.vercel.app`), Challenge A Friend mode, and Journey Milestone Certification. |

---

## Part 2: Detailed Breakdown of Each Report Page (1 to 5)

### Report 1: Your Body Overview
- **Primary Hero Visual**: Dynamic SVG circular gauge displaying the **Health Score (0–100)** calculated using Bioelectrical Impedance Analysis (BIA), BMI, gender, and age formulas.
- **Key Parameters Displayed**:
  - **Health Score**: Overall efficiency score out of 100.
  - **Metabolic Age**: Biological metabolic age compared with chronological age (e.g. *"24 years old · 2 years younger metabolically!"*).
  - **Peer Group Benchmark**: Visual comparison slider comparing "YOU" with the "AVERAGE FOR YOUR AGE GROUP" (Reference: 72).
  - **Confetti Celebration**: Triggers automatically on scores ≥ 90.
  - **Personalized Compliments**: Gender-specific and tier-based encouragement (Elite 95+, High 90+, Mid 80+, etc.).
  - **Multilingual Voice Explainer**: Audio narration in English, Hindi, or Bengali (`ReportVoiceExplainer`).
  - **Challenge A Friend Overlay**: If launched via partner challenge, displays head-to-head comparison cards (`ChallengeComparison`).

---

### Report 2: Which Body Systems Are Strongest
- **Primary Visual**: Grid of clinical system assessment cards, each progressing through 4 stages of evaluation (Status → Direction → Trend → Pattern).
- **Core Body Systems Evaluated**:
  1. **BMI (Body Mass Index)**: Classified into Underweight (<18.5), Normal (18.5–24.9), Overweight (25–29.9), and Obese (30+).
  2. **Body Fat Percentage**: ACE/WHO categories (Essential Fat, Athletic, Fitness, Normal, High) customized for male/female biology.
  3. **Muscle Mass Assessment**: Skeletal muscle status, hypertrophy potential, and sarcopenia screening.
  4. **Bone Mass Assessment**: Skeletal mineral content evaluated against gender baselines.
  5. **Water Balance**: Total body water percentage (cellular hydration and fluid retention).
  6. **Weight Control**: Quantitative target adjustments for healthy body weight.
  7. **Fat Control**: Precise target fat kilograms to shed or maintain.
  8. **Muscle Control**: Target lean mass development goals.
  9. **Ideal Body Weight**: Height- and bone-structure-adjusted ideal target weight.

---

### Report 3: Tissue Composition & Body Reserves
- **Primary Visual**: Comprehensive physiological vitals cards accompanied by deep tissue composition indexes.
- **Core Parameters Displayed**:
  - **Direct Sensor Vitals**:
    - **Height** (cm and ft/in conversion)
    - **Weight** (kg)
    - **Blood Pressure** (Systolic & Diastolic in mmHg)
    - **Pulse / Heart Rate** (bpm)
    - **Blood Oxygen Saturation** (SpO2 %)
    - **Body Temperature** (°F)
  - **Tissue Biomarkers**:
    - **Bone Mineral Mass** (kg) with dietary calcium/vitamin D recommendations (e.g. *"Til laddoo + milk"*, *"Ragi porridge"*).
    - **Protein Mass & Protein %**: Cellular protein reserves necessary for immune and muscular recovery.
    - **LBMI (Lean Body Mass Index)**: Lean mass index normalized by height², identifying genuine muscularity independent of body fat.
    - **Structural Mass**: Total skeleton, cartilage, and connective tissue mass.
    - **Subcutaneous Fat**: Outer pinchable fat layer distinguished from deep visceral fat.

---

### Report 4: Your Scan Comparisons & Progress Graph
- **Primary Visual**: Reliv's flagship **Single Combined Graph (`ReportHistoryChart`)**.
- **Interactive Graph Features**:
  - **Multi-Metric Single Chart**: Combines Blood Pressure (left Y-axis in mmHg), Pulse (right Y-axis in bpm), Oxygen (%), and Weight on a unified timeline.
  - **Mode Switcher**: Instant toggle between smooth line curves (Cubic Spline Bezier interpolation) and grouped comparison bar charts.
  - **Interactive Scan Selection**: Tap any column (Scan 1 to 7) to inspect exact readings, measurement dates, and deltas.
  - **Metabolic Efficiency Assessments**:
    - **Fat-Muscle Ratio**: Ratio of fat mass to lean muscle tissue.
    - **Hydration Efficiency**: Proportion of intracellular fluid within fat-free mass.
    - **Metabolic Load**: Basal calorie burn per kilogram of body mass (kcal/kg).
    - **Energy Reserve**: Total available energy stored in adipose tissue vs daily requirements.
    - **Muscle Efficiency**: Mechanical power output potential per kg of muscle mass.
    - **Protein-Muscle Ratio**: Protein density within muscle fibers.
    - **Metabolic Advantage**: BMR variance against standard age/gender population charts.

---

### Report 5: Your Summary, Vision & Next Steps
- **Primary Visual**: Complete executive health summary, optometry screening, and take-home digital handoff.
- **Core Parameters & Tools**:
  - **Executive Vital Summary**: Synthesized cards highlighting normal parameters and items needing clinical review.
  - **Vision / Eye Screening**: Snellen visual acuity screening results with clinical disclaimer.
  - **Scannable Take-Home QR Code**:
    - Displays high-resolution QR code encoding the secure session token.
    - Scanning with smartphone opens the customer's permanent digital report on `reliv7.vercel.app` (or local kiosk portal).
  - **Advanced Composition Indices**:
    - **Fat-Free Weight (FFW)**: Total functional weight excluding fat.
    - **Body Surface Area (BSA)**: Mosteller body surface area (m²) for physiological regulation.
    - **Fat Dominance Score**: Metabolic propensity to store vs burn lipids.
    - **Body Density Index**: Density in g/cm³.
    - **Thermal Dissipation Index**: Basal heat exchange index.
    - **Recomposition Gap**: Exact quantitative blueprint of kilograms of fat to lose and muscle to gain.
    - **4-Compartment Breakdown**: Visual partition of Fat Mass, Muscle Mass, Bone Mass, and Water Mass.

---

## Part 3: What Unlocks Across Scans 1 to 7

The Reliv kiosk employs a **clinically sound progressive disclosure model**. A single scan cannot show trends or longitudinal changes; each subsequent visit progressively unlocks deeper insights:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       7-SCAN PROGRESSION ROADMAP                            │
├──────────┬──────────────────────────────────────────────────────────────────┤
│ Scan 1   │ Baseline Snapshot • Current Status • 🔒 Trend Locked             │
│ Scan 2   │ Comparison Unlocked • Direction Arrows • Remedies • Multi-Chart   │
│ Scan 3   │ Rolling Trends • Delta Values • Protein & Hydration Efficiency    │
│ Scan 4   │ Bezier Curves • Stability Index • LBMI & Recomposition Gap        │
│ Scan 5   │ Pattern Analysis • Data Completeness % • 4-Compartment Breakdown  │
│ Scan 6   │ Longitudinal Trajectory • Repetition Consistency Advisor          │
│ Scan 7   │ 🏆 7-Scan Journey Complete • Lifetime Historical Pager • Baseline │
└──────────┴──────────────────────────────────────────────────────────────────┘
```

---

### 🟢 Scan 1: The Baseline Foundation
> *"This first scan is your starting point. Nothing needs to be unlocked to see these five pages."*

- **What is Available**:
  - **Report 1**: Health Score (0–100), Metabolic Age estimate, Peer Benchmark reference (72).
  - **Report 2**: Current point-in-time **Status** for BMI, Body Fat %, Muscle Mass, Bone Mass, and Water Balance.
  - **Report 3**: All direct vitals recorded (Height, Weight, BP, Heart Rate, SpO2, Temperature).
  - **Report 4**: **Trend Lock Screen (🔒)**: Clearly explains that one scan establishes your starting baseline; trends require a second scan.
  - **Report 5**: Clinical screening summary, eye check, and scannable QR code for phone viewing.
- **What is Locked**:
  - Deltas (`↑`/`↓`), Trend lines, multi-scan comparisons, household remedies, and multi-visit stability analysis.

---

### 🟢 Scan 2: The Direct Comparison
> *"You now have an earlier scan to compare with today. Two readings show a difference, not a long-term trend."*

- **What Unlocks on Scan 2**:
  - **Report 1**:
    - **Everyday Wellbeing Ideas Unlocked**: Household Ayurvedic and lifestyle remedies tailored to score tier (e.g. *Haldi doodh*, *Triphala churna*, *Jeera water*, protein adjustments).
  - **Report 2**:
    - **Direction Assessment Unlocked**: Metrics now display `Stable`, `Improving`, `Increasing`, or `Decreasing`.
    - **System 5 Unlocked**: Weight Control assessment and target body weight.
  - **Report 3**:
    - **Bone Mass Assessment Unlocked**: Bone density classification (Strong, Normal, Low) with targeted calcium/sunlight advice.
  - **Report 4**:
    - **The Combined Multi-Series Graph Unlocks**: Padlock disappears! Plots Scan 1 and Scan 2 side-by-side with dual Y-axes (BP on left, Pulse/SpO2 on right).
    - **Fat-Muscle Ratio Unlocked**: Ratio of fat mass to lean tissue.
  - **Report 5**:
    - **Fat-Free Weight (FFW) Unlocked**: Total body weight minus fat mass.
    - **Body Surface Area (BSA in m²) Unlocked**: Body surface area calculation for thermal regulation.

---

### 🟢 Scan 3: Rolling Trends & Metabolic Efficiency
> *"With more recorded visits, patterns become easier to see. Missing measurements are never filled in."*

- **What Unlocks on Scan 3**:
  - **Report 2**:
    - **Trend Assessment Unlocked**: Classifies readings into `Consistently Stable`, `Trending Up`, or `Trending Down`.
    - **System 6 Unlocked**: Fat Control target kilograms.
    - **System 7 Unlocked**: Muscle Control target kilograms.
  - **Report 3**:
    - **Protein Mass & Protein % Unlocked**: Cellular protein reserves (Optimal 13–18%) with nutritional guidance.
  - **Report 4**:
    - **Delta Values Unlocked**: Exact numerical change indicators (`↑ +3 mmHg · Previous`, `↓ 2 bpm`, etc.).
    - **Hydration Efficiency Unlocked**: Percentage of fluid inside fat-free mass.
    - **Metabolic Load Unlocked**: Basal metabolic rate per kilogram of body weight (kcal/kg).
  - **Report 5**:
    - **Fat Dominance Score Unlocked**: Evaluates lipid storage vs oxidation.
    - **Body Density Index Unlocked**: Body volume-to-mass ratio (g/cm³).

---

### 🟢 Scan 4: Curves, Stability & Body Architecture
> *"Four scans establish meaningful physical adaptation."*

- **What Unlocks on Scan 4**:
  - **Report 2**:
    - **System 8 Unlocked**: Clinically adjusted Ideal Body Weight target.
  - **Report 3**:
    - **LBMI (Lean Body Mass Index) Unlocked**: Height-normalized muscularity index.
  - **Report 4**:
    - **Smooth Cubic Spline Curves**: Multi-point Bezier curved trend lines replace straight segments.
    - **Reading Stability Classification Unlocked**: Distinguishes `Similar readings` from `Readings vary`.
    - **Energy Reserve Unlocked**: Total fasting energy reserves in adipose tissue.
    - **Muscle Efficiency Unlocked**: Mechanical power output per kg of muscle.
  - **Report 5**:
    - **Thermal Dissipation Index Unlocked**: Core body heat exchange efficiency.
    - **Recomposition Gap Unlocked**: Exact quantitative blueprint of fat to lose and muscle to gain.

---

### 🟢 Scan 5: Statistical Patterns & 4-Compartment Breakdown
> *"Five scans provide statistical confidence in your biological baseline."*

- **What Unlocks on Scan 5**:
  - **Report 2**:
    - **Pattern Analysis Unlocked**: Mathematical standard deviation (`stdDeviation`) categorizing systems as `Highly Stable` (<0.5 variance), `Moderately Stable` (0.5–1.0), or `Variable` (>1.0).
  - **Report 3**:
    - **Structural Mass Assessment Unlocked**: Skeleton and connective tissue matrix.
    - **Subcutaneous Fat Assessment Unlocked**: Pinchable outer fat layer separated from visceral fat.
  - **Report 4**:
    - **Data Completeness Coverage Unlocked**: Shows exact measurement completeness ratio (e.g. `Recorded readings: 18/20 (90%)`).
    - **Protein-Muscle Ratio Unlocked**: Intracellular protein density.
    - **Metabolic Advantage Unlocked**: BMR variance against age/gender population averages.
  - **Report 5**:
    - **Physiological Efficiency Score Unlocked**: Comprehensive composite efficiency index out of 100.
    - **4-Compartment Breakdown Unlocked**: Exact kilogram distribution of Fat Mass, Muscle Mass, Bone Mass, and Water Mass.

---

### 🟢 Scan 6: Longitudinal Trajectory & Precision Tracking
> *"Six scans establish dependable multi-month biological trends."*

- **What Unlocks on Scan 6**:
  - **Repetition Consistency Guidance**: Advisory on timing, hydration, and circadian factors to ensure optimal scan accuracy.
  - **Longitudinal Trend Prediction**: 90-day trajectory modeling based on your 6-scan velocity.
  - **Protein Retention Index**: Efficiency of dietary protein retention into skeletal muscle.

---

### 🏆 Scan 7: The Journey Milestone & Lifetime Baseline
> *"✓ Seven-scan journey complete. Your personal biological baseline is permanently established."*

- **What Unlocks on Scan 7**:
  - **Top Banner Milestone Trophy**: `✓ Seven-scan journey complete` displayed proudly across all report headers.
  - **Report 4 Lifetime Historical Pager**: Unlocks pagination controls (`← Earlier scans` and `Later scans →`), displaying the current 7 scans while preserving all prior historical scans for lifetime review.
  - **Comprehensive Multi-Month Audit**: Full side-by-side comparison across all 7 milestones.
  - **Personal Biological Baseline Lock**: Establishes your personalized "Normal" range, allowing future kiosk visits to be evaluated against your own proven biology rather than generic population averages.
  - **Long-Term Health Certificate**: Full journey documentation available for download, printing, or sharing with healthcare providers.

---

## Part 4: The 4-Layer Clinical UX Principle

To ensure accessibility for all users, every indicator across all 5 report pages adheres to the **4-Layer Principle**:

$$\text{Value} \longrightarrow \text{Status} \longrightarrow \text{Meaning} \longrightarrow \text{Action}$$

### Practical Example: Muscle Mass Assessment
1. **Value**: `29.3%` (or `27.6 kg`)
2. **Status**: `Likely Low` (visual gauge highlighted in amber/orange)
3. **Meaning**: *"Your skeletal muscle proportion is below the optimal threshold for your age and height. This can affect daily metabolic efficiency, joint stability, and calorie burn."*
4. **Action**: *"Include protein-rich Indian staples: moong dal chilla, paneer, sprouts, or boiled eggs. Target 20 minutes of resistance or bodyweight exercises daily."*

---

## Part 5: Real-World Case Study: Scan 6 Comprehensive Journey

Below is an end-to-end, screen-by-screen breakdown of a real-world user completing their **Scan 6** checkup on the Reliv Kiosk.

### User Baseline Profile
- **Demographics**: Male, 26 years old, Height: 5'9" (176 cm), Weight: 66 kg
- **Visit Milestone**: Scan 6 of 7 Completed
- **Vital Signs**: Blood Pressure 123/78 mmHg, Pulse 97 bpm, SpO2 98%, Temperature 98.4°F

---

### Screen-by-Screen Walkthrough (20 Journey States)

#### Module A: Overview, Highlights & Core Composition (Screens 1–10)

| Screen | Focus Area | Data Values & Visual State | What the User Understands |
| :---: | :--- | :--- | :--- |
| **1** | **Overall Health Score** | **89 / 100** (Peer Avg: 72). Luminous orange/gold gauge. | Instant positive reinforcement that overall health is strong and well above peer average. |
| **2** | **Body Control Targets** | Target Weight: 64.5 kg, Fat to lose: -1.5 kg, Muscle to gain: +1.0 kg, Ideal Weight: 65 kg. | Converts abstract percentages into actionable weight/fat/muscle targets. |
| **3** | **Strongest Area & Bio-Age** | Strongest: **Body Water (62.9%)** (Top 37%). Biological Age: **24 yrs** (-2 yrs). | Delivers a psychological "win" first, followed by an intuitive biological age metric. |
| **4** | **Core Composition Indicators** | Muscle Mass 29.3% (*Likely Low*), Body Fat 18.0% (*Normal*), Visceral Fat Level 1 (*Optimal*). | Differentiates external pinchable fat from deep organ fat and lean muscle status. |
| **5** | **Tissue Composition Analysis** | Bone Mass 3.90 kg (*Strong*), Protein Mass 8.84 kg / 13.4% (*Normal*), LBMI 17.5 kg/m². | Explains internal structural health: skeletal density, protein stores, and lean framework. |
| **6** | **Tissue Continuation & Fat Distribution** | Subcutaneous Fat 13.5% (*Normal*). Key Insights summary box. | Distinguishes cosmetic subcutaneous fat from visceral risk; provides daily lifestyle takeaways. |
| **7** | **Composition Profile Intro** | Scan 6 confirmation, Height 5'9" (176 cm), Weight 66 kg, Healthy range benchmark. | Re-anchors demographics and confirms measurement accuracy against scientific references. |
| **8** | **Weight & Muscle Target Conclusion** | Muscle status summary, protein foods (paneer, dal), scan confidence badge. | Reassures the user that muscle building is attainable and repeated scans increase accuracy. |
| **9** | **Composition Fundamentals (Report 2/5)** | BMI 21.3 (*Normal*), Body Fat 18% (*Fitness tier*), Confidence level: *95% confident*. | Formal clinical breakdown clearly labelled as calculated estimates, not direct diagnostic tissue biopsy. |
| **10** | **Everyday Wellbeing Transition** | Haldi doodh at bedtime, Triphala, 7–8 hrs sleep, *Continue to Next Screen* button. | Actionable Indian home remedies before moving to cardiovascular and trend pages. |

---

#### Module B: Longitudinal Trends, Efficiency Ratios & Advanced Integration (Screens 11–20)

| Screen | Focus Area | Data Values & Visual State | What the User Understands |
| :---: | :--- | :--- | :--- |
| **11** | **Core Composition Summary** | Muscle 29.3%, Body Fat 18%, Visceral Fat 1, Water 62.9%, BMI 21.3, BMR 1655 kcal. | High-level synthesis card summarizing all 6 primary body compartments. |
| **12** | **Structural / Tissue Analysis** | Bone 3.90 kg, Protein 8.84 kg (13.4%), LBM 54.1 kg, Structural Mass 47.8%. | Detailed breakdown of the body's structural scaffolding and non-fat tissues. |
| **13** | **Fat Distribution & Insights** | Subcutaneous Fat 13.5%, Visceral Fat Level 1. Water balance status: *Optimal*. | Confirms low abdominal visceral risk with well-maintained cellular water. |
| **14** | **Longitudinal Vital Trends** | 6-scan history: BP 123/78 mmHg, Pulse 97 bpm, SpO2 98%. Combined multi-point line chart. | Shows change over time across 6 visits rather than treating the visit as an isolated snapshot. |
| **15** | **Body Efficiency Ratios (Part 1)** | Fat-Muscle Ratio 0.43 (*Optimal*), Hydration Efficiency 76.7% (*High*), Metabolic Load 25.1. | Performance analytics explaining how well tissue compartments cooperate metabolically. |
| **16** | **Efficiency Ratios (Part 2)** | Energy Reserve 46 days, Muscle Efficiency 59.9%, Protein-Muscle Ratio 0.32. | Estimates endurance fasting reserves and cellular protein density. |
| **17** | **Metabolic Age & Progression** | Metabolic Advantage: **-2 Years**. Progress: *Scan 6 of 7 completed*. | Motivates user to complete Scan 7 to permanently establish their biological baseline. |
| **18** | **Wellness Indexes** | Stress Index 64/100, Cardio Fitness 100/100, Respiratory Health 77/100, Recovery Readiness 88/100. | Broadens evaluation into autonomic, cardiovascular, and respiratory readiness. |
| **19** | **Advanced Integration Analysis** | Fat-Free Weight 54.1 kg, BSA 1.81 m², Fat Dominance -23.9%, Body Density 1.058 g/cm³. | Multi-variable integration providing deep physiological insights for clinicians/trainers. |
| **20** | **Thermal, Efficiency & Mass Breakdown** | Thermal Index 914, Physiological Efficiency 72.8%, Recomposition Gap 5.8%, Water 41.5kg, Muscle 27.6kg, Fat 11.9kg. | Deepest synthesis: turns all collected data into an exact 4-compartment mass distribution. |

---

## Part 6: The 3-Tier Measurement Classification for Medical Credibility & Ethics

To maintain clinical integrity and regulatory compliance, every metric on the Reliv Kiosk is classified into one of three distinct tiers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       3-TIER MEASUREMENT SYSTEM                             │
├───────────────────┬─────────────────────────────────────────────────────────┤
│ Tier 1: Direct    │ Sensor-captured measurements (Hardware Truth)           │
│ Tier 2: Clinical  │ Peer-reviewed physiological algorithms (BIA / BSA)      │
│ Tier 3: Derived   │ Reliv-engineered composite wellness indices             │
└───────────────────┴─────────────────────────────────────────────────────────┘
```

1. **Tier 1: Direct Sensor Measurements (Hardware Truth)**
   - *Parameters*: Blood Pressure (Oscillometric), Heart Rate (PPG / Optical), Blood Oxygen Saturation (SpO2 pulse oximetry), Body Temperature (Infrared sensor), Weight (Load cells), Height (Ultrasonic).
   - *UX Rule*: Displayed with exact measurement units (`mmHg`, `bpm`, `%`, `°F`, `kg`, `cm`). Missing values are **never fabricated**; they are left blank with an explicit explanation.

2. **Tier 2: Calculated Physiological Estimates (Peer-Reviewed Formulas)**
   - *Parameters*: BMI, BMR (Mifflin-St Jeor), Body Fat % (Deurenberg / Gallagher BIA), Total Body Water (Watson formula), Bone Mineral Mass, Body Surface Area (Mosteller).
   - *UX Rule*: Explicitly labeled with disclaimer: *"Calculated estimate based on today's scan, age, and biological sex. Not a direct tissue biopsy or diagnosis."*

3. **Tier 3: Reliv-Derived Wellness & Performance Indexes (Custom Analytics)**
   - *Parameters*: Health Score (0–100), Physiological Efficiency (%), Thermal Index, Stress Index, Cardio Fitness Index, Recomposition Gap (%), Fat Dominance Score.
   - *UX Rule*: Presented as wellness screening benchmarks for tracking lifestyle progress over time. Clearly distinguished from clinical diagnostic markers.

---

## Part 7: Dual-Persona User Experience Architecture

```
                  ┌─────────────────────────────────────────┐
                  │           RELIV USER ARRIVAL            │
                  └────────────────────┬────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
        ┌───────────────────────┐             ┌───────────────────────┐
        │     CASUAL USER       │             │  CURIOUS / POWER USER │
        ├───────────────────────┤             ├───────────────────────┤
        │ • Health Score (89)   │             │ • Tissue Scaffolding  │
        │ • Strongest Area      │             │ • Efficiency Ratios   │
        │ • Ideal Body Weight   │             │ • Longitudinal Trends │
        │ • Simple Food Tips    │             │ • Recomposition Gap   │
        └───────────────────────┘             └───────────────────────┘
```

The Reliv interface is designed with a **two-depth scroll layout**:
- **Above the Fold / Executive Summary**: Immediate clarity for casual users. Answers: *"Am I healthy?"*, *"What is my best area?"*, *"What should I eat?"*.
- **Deep Scroll / Advanced Analytics**: High-resolution clinical and physiological cards for trainers, doctors, and biohackers seeking actionable recomposition targets.

---

## Part 8: Privacy, Zero-Hallucination & Offline Integrity Standards

1. **Zero-Hallucination Guarantee**:
   If a sensor reading is missing or invalid, the system leaves the field blank (`—`). Missing readings produce an explicit gap in trend charts. The kiosk **never** invents synthetic values.
2. **Private Identity Token Security**:
   Historical scan comparisons unlock **only** when authenticated with the user's private 6-digit PIN and crypto-verified session token. An email address alone cannot expose historical data.
3. **Screening vs Diagnostic Boundary**:
   Calculated body estimates are clearly identified as screening information. If readings show elevated risk (e.g. Stage 2 hypertension), the UI prioritizes a gentle, clear recommendation to consult a qualified physician.

---

## Part 9: Multilingual Voice Narration & Audio Accessibility Architecture

The voice assistant is engineered so that **any user—whether an elderly citizen, a non-technical person, or someone who is visually impaired—can listen and completely understand what is happening inside their body**.

### 1. Dual-Modal Language Architecture
- **On-Screen Visuals**: Always rendered in clean, standardized **English** to maintain professional clinical layouts, universal iconography, and international medical terminology.
- **Spoken Audio Narration**: Dynamically synthesized in **English**, **Conversational Hindi (Hinglish)**, or **Conversational Bengali (Banglish)** based on user preference, with zero technical jargon.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SPOKEN VOICE PHILOSOPHY                               │
├───────────────────┬─────────────────────────────────────────────────────────┤
│ Screen Text       │ Always English (Standardized typography & medical terms)│
│ Voice Languages   │ English • Hindi (Hinglish) • Bengali (Banglish)         │
│ Jargon Ban        │ No "adipose risk", "recomposition", "demographic %"     │
│ Blind Access      │ "You do not need to read the screen. I will explain."   │
│ 2-Way Navigation  │ Back & Next buttons across all Report Pages (1 to 5)    │
└───────────────────┴─────────────────────────────────────────────────────────┘
```

---

### 2. Report 1 Spoken Logic: The 9 Exact Score Bands

Every user hears their Health Score narrated in this exact 9-step sequence:
1. **Name greeting** (`"Faizan..."`)
2. **Exact score** (`"Your health score is 85 out of 100."`)
3. **Simple status** (`"Very good!"`)
4. **Core benchmark definition**: *"Your health score is out of 100. A higher score means more of today’s checked values are closer to the preferred ranges."*
5. **Tier interpretation**: (From the 9 bands below)
6. **Peer comparison**: *"The reference score for people around your age is about 72. Your score is [X]."*
7. **Reassurance**: *"This score is a summary, not a diagnosis."*
8. **Blind / elderly accessibility reassurance**:  
   - **English**: *"You do not need to read the screen. I’ll explain each part of your report to you."*  
   - **Hindi**: *"Aapko screen padhne ki zarurat nahi hai. Main aapki report ka har important part simple language mein samjhaunga."*  
   - **Bengali**: *"Apnake screen porte hobe na. Ami apnar report-er prottekta important part sohoj bhashay bojhabo."*
9. **Transition**: *"Next, let’s find out which areas of your body report are strongest and which ones need attention."*

#### Exact Spoken Scripts Across All 9 Tiers

| Score Band | UI Tier | Spoken Label | English / Hindi / Bengali Spoken Scripts |
| :---: | :--- | :--- | :--- |
| **95–100** | Outstanding / Elite | **Outstanding** | **EN**: *"Your health score is [score] out of 100. Outstanding! Most of the values checked today are very close to their preferred ranges. You are doing extremely well. The reference score for people around your age is about 72, and your score is much higher. Keep following your healthy routine."*<br>**HI**: *"Aapka health score 100 mein se [score] hai. Bahut hi badhiya! Outstanding! Aaj check ki gayi zyada tar readings preferred range ke bahut paas hain. Aap bahut achha kar rahe hain. Aapki age ke logon ka reference score lagbhag 72 hai, aur aapka score usse kaafi upar hai. Apni healthy routine aise hi continue rakhiye."*<br>**BN**: *"Apnar health score 100-r moddhe [score]. Darun result! Outstanding! Aj check kora beshirbhag reading preferred range-er khub kachakachi ache. Apni khub bhalo korchen. Apnar boyosher manusher reference score pray 72, ar apnar score tar theke onek beshi. Ei healthy routine-ta continue korun."* |
| **90–94** | Excellent | **Excellent** | **EN**: *"Your health score is [score] out of 100. Excellent! Your overall readings look very good today. Most values are within or close to their preferred ranges. There may still be a small area to improve, but overall you are doing very well."*<br>**HI**: *"Aapka health score 100 mein se [score] hai. Excellent! Aaj aapki overall readings bahut achhi hain. Zyada tar values preferred range mein ya uske paas hain. Ek-do cheezein aur improve ho sakti hain, lekin overall aap bahut achha kar rahe hain."*<br>**BN**: *"Apnar health score 100-r moddhe [score]. Excellent! Aj apnar overall reading khub bhalo. Beshirbhag value preferred range-e ba tar kachakachi ache. Ek-dui jaygay aro improvement hote pare, kintu overall apni khub bhalo korchen."* |
| **80–89** | Very Good | **Very good** | **EN**: *"Your health score is [score] out of 100. Very good! Most of today’s readings are looking good. A few areas could still improve, but your overall result is strong. Keep up your healthy habits. The reference score for your age group is about 72, and your score is [score], which is above that reference."*<br>**HI**: *"Aapka health score 100 mein se [score] hai. Bahut achha! Very good! Aaj ki zyada tar readings achhi hain. Kuch areas mein thoda aur improvement ho sakta hai, lekin overall result strong hai. Healthy habits continue rakhiye. Aapki age ke logon ka reference score lagbhag 72 hai, aur aapka score [score] us reference se upar hai."*<br>**BN**: *"Apnar health score 100-r moddhe [score]. Khub bhalo! Very good! Ajker beshirbhag reading bhalo ache. Kichu jaygay aro ektu improvement hote pare, kintu overall result strong. Healthy habit-gulo continue korun. Apnar boyosher reference score pray 72, ar apnar score [score] tar theke beshi."* |
| **70–79** | Good / Balanced | **Good** | **EN**: *"Your health score is [score] out of 100. Good. Your overall result is around a healthy baseline. Several readings are doing well, while a few can improve. The reference score for people around your age is about 72, so your result is close to or slightly above that reference."*<br>**HI**: *"Aapka health score 100 mein se [score] hai. Achha result hai. Good. Aapki overall readings ek theek baseline par hain. Kaafi readings achhi hain aur kuch aur improve ho sakti hain. Aapki age ka reference score lagbhag 72 hai, aur aapka score uske aas-paas ya thoda upar hai."*<br>**BN**: *"Apnar health score 100-r moddhe [score]. Bhalo result. Good. Overall reading ekta bhalo baseline-e ache. Onnek reading bhalo, ar kichu aro improve kora jay. Apnar boyosher reference score pray 72, ar apnar score tar kachakachi ba ektu beshi."* |
| **60–69** | Fair / Building | **Fair — some improvement needed** | **EN**: *"Your health score is [score] out of 100. Your result is fair. Some readings are doing well, but a few areas need improvement. This is a good point to focus on regular activity, balanced food, good sleep and consistency. This score is only a summary of today’s measurements. It does not mean that you are unhealthy."*<br>**HI**: *"Aapka health score 100 mein se [score] hai. Result theek hai, lekin improvement ki jagah hai. Kuch readings achhi hain aur kuch areas par thoda dhyan dene ki zarurat hai. Regular activity, balanced khana aur achhi neend par focus rakhiye. Ye sirf aaj ki measurements ka summary score hai. Iska matlab ye nahi hai ki aap unhealthy hain."*<br>**BN**: *"Apnar health score 100-r moddhe [score]. Result motamuti bhalo, kintu improvement-er jayga ache. Kichu reading bhalo, ar kichu jaygay ektu beshi kheyal rakha dorkar. Regular activity, balanced khabar ar bhalo ghum-er upor focus korun. Eta sudhu ajker measurement-er summary score. Er mane ei noy je apni unhealthy."* |
| **50–59** | Needs Attention | **Needs some attention** | **EN**: *"Your health score is [score] out of 100. Some of today’s readings need attention. This does not mean that something is definitely wrong. It simply means several values are farther from their preferred ranges. We’ll now explain which readings are good and which ones you may want to improve."*<br>**HI**: *"Aapka health score 100 mein se [score] hai. Aaj ki kuch readings par dhyan dene ki zarurat hai. Iska matlab ye nahi hai ki kuch zaroor galat hai. Bas kuch values preferred range se thodi door hain. Ab hum simple language mein batayenge ki kaunsi readings achhi hain aur kin cheezon ko improve karna hai."*<br>**BN**: *"Apnar health score 100-r moddhe [score]. Ajker kichu reading-e attention dorkar. Er mane ei noy je nishchit bhabe kono problem ache. Sudhu kichu value preferred range theke ektu dure ache. Ebar amra sohoj bhashay bolbo kon reading bhalo ar kon jaygay improvement kora jay."* |
| **40–49** | Growth Mode | **Needs improvement** | **EN**: *"Your health score is [score] out of 100. Several areas can improve. Please don’t worry. One scan cannot diagnose your health. This result simply shows that some of today’s measurements are outside or farther from their preferred ranges. We’ll go through them one by one and explain what you can work on."*<br>**HI**: *"Aapka health score 100 mein se [score] hai. Kuch areas mein improvement ki zarurat hai. Ghabraiye mat. Ek scan se kisi ki poori health decide nahi hoti. Bas aaj ki kuch measurements preferred range se bahar ya thodi door hain. Ab hum ek-ek karke simple language mein samjhayenge ki kis cheez par kaam karna hai."*<br>**BN**: *"Apnar health score 100-r moddhe [score]. Kichu jaygay improvement dorkar. Bhoy paben na. Ekta scan diye puro health decide kora jay na. Ajker kichu measurement preferred range-er baire ba ektu dure ache. Ebar amra ek-ek kore sohoj bhashay bojhabo kon jaygay kaj kora jay."* |
| **30–39** | Improvement Zone | **Needs more attention** | **EN**: *"Your health score is [score] out of 100. Several readings need more attention today. Please stay calm—this score is not a diagnosis. Some values may also change because of hydration, food, recent exercise, stress or measurement conditions. We recommend reviewing the individual readings and repeating unusual measurements when appropriate."*<br>**HI**: *"Aapka health score 100 mein se [score] hai. Aaj kai readings ko thoda zyada attention dene ki zarurat hai. Ghabraiye mat—ye score diagnosis nahi hai. Paani kam peena, khana, recent exercise, stress ya measurement ke tareeke se bhi readings change ho sakti hain. Unusual readings ko dobara check karna better rahega."*<br>**BN**: *"Apnar health score 100-r moddhe [score]. Aj besh kichu reading-e aro attention dorkar. Bhoy paben na—ei score kono diagnosis noy. Kom jol khawa, khabar, recent exercise, stress ba measurement-er condition-er jonno-o reading change hote pare. Unusual reading abar check kora bhalo."* |
| **0–29** | Clinical Advisory | **Several readings need attention** | **EN**: *"Your health score is [score] out of 100. Several of today’s measurements are far from their preferred ranges and should be looked at carefully. Please don’t panic. This score alone does not diagnose an illness. We recommend repeating any unusual measurements. If important readings remain abnormal, or if you are feeling unwell, please speak with a doctor or healthcare professional."*<br>**HI**: *"Aapka health score 100 mein se [score] hai. Aaj ki kai measurements preferred range se kaafi door hain, isliye unhe dhyan se dobara dekhna chahiye. Ghabraiye mat. Sirf is score se kisi bimari ka diagnosis nahi hota. Unusual readings ko dobara check karein. Agar important readings baar-baar abnormal aayein, ya aapki tabiyat theek na lage, to doctor ya healthcare professional se baat karein."*<br>**BN**: *"Apnar health score 100-r moddhe [score]. Ajker besh kichu measurement preferred range theke onekta dure ache, tai segulo bhalo kore abar dekha dorkar. Bhoy paben na. Sudhu ei score diye kono rog diagnose kora jay na. Unusual reading abar check korun. Important reading bar-bar abnormal thakle, ba shorir kharap lagle, doctor ba healthcare professional-er sathe kotha bolun."* |

---

### 3. Plain-Language Spoken Logic for Reports 2, 3, 4, and 5

#### Report 2: Body Systems & Composition Strengths
- **Accessibility Opening**: Reminds the user they do not need to study the screen charts; the voice will explain what is strongest and what needs improvement.
- **Positive Area Highlight First**: Announces the standout strength (e.g. *"Your standout strength today is body water, at about 63 percent! Your cells are well hydrated, which cushions your joints and keeps your daily energy steady"*).
- **Targeted Action & Desi Nutrition**:
  - *If muscle is low*: *"Your muscle percentage is slightly lower than preferred for your height. Muscles are your body's power engine. To build them up gently, add simple protein foods to your meals—like moong dal, paneer, sprouts, or boiled eggs—and do 20 minutes of brisk walking or light exercise daily."*
  - *If fat is elevated*: *"Your body fat is slightly above the target range. Reducing fried snacks and sweet chai, and enjoying a 30-minute walk each day will gently bring it back into balance."*
- **Two-Way Navigation**: Directs the user to tap **Continue** to proceed to vitals or tap **Back** to return to their Health Score.

#### Report 3: Tissue Reserves & Direct Vitals
- **Direct Vitals Explained Simply**:
  - *Blood Pressure*: Gives exact systolic/diastolic values. If normal: *"In a calm and safe range, meaning blood is flowing smoothly without strain on your heart."* If elevated: advises reducing table salt and getting sound sleep.
  - *Oxygen*: Explains that $\ge 95\%$ means the lungs are delivering rich oxygen to every organ.
  - *Pulse*: Explains resting heart rate rhythm simply.
  - *Bones & Protein*: Bone mineral mass explained with morning sunlight/milk; protein explained as the nightly cellular repair crew.
- **Two-Way Navigation**: Includes **← Back to Body Composition** and **Continue to Progress Graph →**.

#### Report 4: Multi-Scan Progress & Trend History
- **Audio Progress Tracking for the Blind**: Explains visit velocity and historical direction without requiring the user to interpret Bezier curves or dual Y-axis charts.
- **Scan-Specific Context**:
  - *Scan 1*: Explains that this visit creates their baseline and comparisons will unlock on Scan 2.
  - *Scan 2*: Confirms first comparison and vital stability.
  - *Scan 3 to 6*: Highlights emerging multi-visit health patterns.
  - *Scan 7*: Celebrates completing the 7-scan journey and locking in a permanent, doctor-ready baseline.
- **Two-Way Navigation**: Includes **← Back to Vitals & Tissue** and **Continue to Summary & Vision →**.

#### Report 5: Complete Screening Summary & Take-Home QR Code
- **Total Summary**: Balances strengths (hydration/vital calm) with primary opportunities (muscle building and daily movement).
- **Eyesight Screening**: Reassures the user and advises optometrist review if they experience fatigue or blurriness.
- **Verbal QR Code Guidance (Elderly / Blind / Non-Tech Assistance)**:
  - **English**: *"To take this complete report home, you or someone with you can point a smartphone camera at the square QR code on the screen. It will open your private digital report on your phone without downloading any app. You can tap Return Home whenever you are ready, or tap Back to review earlier pages."*
  - **Hindi**: *"Is poori report ko apne phone par le jaane ke liye, aap ya aapka koi saathi phone ka camera screen par bane square QR code par dikhayein. Yeh bina kisi app ke turant aapke phone par khul jayegi. Aap jab chahein Return Home daba sakte hain, ya peechhe dekhne ke liye Back daba sakte hain."*
  - **Bengali**: *"Ei puro report-ta nijer phone-e niye jete, apnar smartphone-er camera screen-er square QR code-er shamne dhorun. Kono app chhara-i eta phone-e khule jabe. Shob shesh hole Return Home chapun, ba ager pata dekhte Back chapun."*
- **Two-Way Navigation**: Includes **← Back to Progress Graph** alongside **Return Home** and **Wellness Picks**.

