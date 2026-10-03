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
