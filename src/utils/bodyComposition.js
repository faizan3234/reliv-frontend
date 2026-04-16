// src/utils/bodyComposition.js

// Utility function for rounding to 5 decimal places
function round5(x) {
  return Math.round(x * 100000) / 100000;
}

// Existing functions (from original bodyComposition.js)
export function calc_bmi(weight, height) {
  return height > 0 ? Math.max(1.0, Math.min(round5(weight / ((height / 100) ** 2)), 90.0)) : 0;
}

// Body Surface Area (BSA) using DuBois formula
export function calc_bsa(weight, height) {
  if (!weight || !height || weight <= 0 || height <= 0) return 0;
  // DuBois formula: BSA (m²) = 0.007184 × weight^0.425 × height^0.725
  const bsa = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);
  return round5(bsa);
}

export function calc_ffm(weight, height, age, impedance, sex = 1) {
  if (impedance === 0 || weight === 0) {
    // Fallback when no impedance: estimate FFM from sex-specific body fat approximation
    const estFatPct = sex === 1 ? 0.18 : 0.28;
    return weight * (1 - estFatPct);
  }
  const ht2_z = (height ** 2) / impedance;
  let ffm;
  if (sex === 1) {
    // Consumer BIA calibrated formula for males (foot-to-foot impedance)
    // Adjusted from Kyle (2001) to match consumer-grade impedance values
    ffm = 0.85 * ht2_z + 0.18 * weight - 0.10 * age - 1.5;
  } else {
    // Consumer BIA calibrated formula for females (foot-to-foot impedance)
    ffm = 0.55 * ht2_z + 0.15 * weight + 11.0;
  }
  // Clamp to physiologically possible range
  const minFFM = weight * 0.4; // At least 40% of body weight is lean
  const maxFFM = weight * 0.95; // Cannot exceed 95% (everyone has some fat)
  return Math.max(minFFM, Math.min(ffm, maxFFM));
}

export function calc_fat_percent(weight, height, sex, age, impedance) {
  if (weight === 0) {
    return 0.0;
  }
  const ffm = calc_ffm(weight, height, age, impedance, sex);
  const fat_mass = Math.max(0, weight - ffm);
  const fat_percent = (fat_mass / weight) * 100;
  // Sex-specific realistic clamps
  if (sex === 1) { // Male
    return Math.max(4.0, Math.min(round5(fat_percent), 45.0));
  } else { // Female
    return Math.max(10.0, Math.min(round5(fat_percent), 50.0));
  }
}

export function calc_fat_mass(weight, fat_percent) {
  return weight > 0 ? round5(weight * fat_percent / 100) : 0;
}

export function calc_bone_mass(weight, height, sex, age, impedance) {
  // Estimated bone mineral content based on weight, height, and sex
  // Average adult bone mineral content: males ~2.5-3.5kg, females ~1.8-2.5kg
  let bone_mass;
  if (sex === 1) { // Male
    bone_mass = 0.04 * weight + 0.01 * height - 0.5;
  } else { // Female
    bone_mass = 0.03 * weight + 0.01 * height - 0.3;
  }
  // Age-related bone density decline (after age 30, ~0.5% per decade)
  if (age > 30) {
    bone_mass *= (1 - 0.005 * ((age - 30) / 10));
  }
  // Sex-specific realistic clamps
  if (sex === 1) {
    return Math.max(2.0, Math.min(round5(bone_mass), 4.0));
  } else {
    return Math.max(1.5, Math.min(round5(bone_mass), 3.2));
  }
}

export function calc_bone_percent(weight, bone_mass) {
  return weight > 0 ? round5(bone_mass / weight * 100) : 0;
}

export function calc_muscle_percent(weight, height, sex, age, impedance) {
  const fat_percent = calc_fat_percent(weight, height, sex, age, impedance);
  const bone_mass = calc_bone_mass(weight, height, sex, age, impedance);
  const bone_percent = calc_bone_percent(weight, bone_mass);
  // Remaining tissue after fat and bone = muscle + organs + blood + intracellular water
  // Skeletal muscle is approximately 55% of the lean non-bone tissue remainder
  const remaining = 100 - fat_percent - bone_percent;
  const muscle_percent = remaining * 0.55;
  // Sex and age-specific realistic clamps
  // Average healthy: M ~38-42%, F ~30-34%. Athletes: M ~44-46%, F ~36-38%
  if (sex === 0) { // Female
    if (age >= 60) {
      return Math.max(20.0, Math.min(round5(muscle_percent), 35.0));
    }
    return Math.max(24.0, Math.min(round5(muscle_percent), 38.0));
  } else { // Male
    if (age >= 60) {
      return Math.max(28.0, Math.min(round5(muscle_percent), 42.0));
    }
    return Math.max(33.0, Math.min(round5(muscle_percent), 46.0));
  }
}

export function calc_muscle_mass(weight, muscle_percent) {
  return weight > 0 ? round5(weight * muscle_percent / 100) : 0;
}

export function calc_skeletal_muscle_percent(muscle_percent) {
  return round5(0.7 * muscle_percent);
}

export function calc_water_percent(weight, height, sex, age, impedance) {
  if (weight <= 0 || height <= 0) return 0;
  // Watson (1980) Total Body Water equations
  let tbw; // in liters
  if (sex === 1) { // Male
    tbw = 2.447 - 0.09156 * age + 0.1074 * height + 0.3362 * weight;
  } else { // Female
    tbw = -2.097 + 0.1069 * height + 0.2466 * weight;
  }
  const water_percent = (tbw / weight) * 100;
  // Sex-specific realistic clamps
  if (sex === 0) { // Female
    return Math.max(40.0, Math.min(round5(water_percent), 60.0));
  } else { // Male
    return Math.max(45.0, Math.min(round5(water_percent), 65.0));
  }
}

export function calc_water_mass(weight, water_percent) {
  return weight > 0 ? round5(weight * water_percent / 100) : 0;
}

export function calc_protein_percent(muscle_percent) {
  if (muscle_percent > 0) {
    // Protein content in muscle is roughly 20-22% of muscle mass
    // Whole-body protein % relates to muscle% approximately as:
    const protein_percent = Math.max(6.0, Math.min(22.0, muscle_percent * 0.32));
    return round5(protein_percent);
  }
  return 0;
}

export function calc_protein_mass(weight, protein_percent) {
  return weight > 0 ? round5(weight * protein_percent / 100) : 0;
}

export function calc_visceral_fat_level(weight, height, sex, age, impedance) {
  const fat_percent = calc_fat_percent(weight, height, sex, age, impedance);
  const bmi = calc_bmi(weight, height);
  // Base formula incorporating fat% and BMI
  let visceral_fat = 0.15 * fat_percent + 0.08 * bmi - 4.0;
  // Age correction: visceral fat increases significantly with age, especially after 30
  if (age > 30) {
    visceral_fat += (age - 30) * 0.06;
  }
  // Sex correction: females tend to accumulate less visceral fat (more subcutaneous)
  if (sex === 0) {
    visceral_fat -= 1.5;
  }
  return Math.max(1, Math.min(Math.round(visceral_fat), 20));
}

export function calc_bmr(weight, height, sex, age) {
  let val;
  if (sex === 1) { // Male
    val = 10 * weight + 6.25 * height - 5 * age + 5;
  } else { // Female
    val = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  return Math.max(500, Math.min(Math.round(val * 10) / 10.0, 5000));
}

export function calc_metabolic_age(bmr, age, sex) {
  // Reference BMR data based on age and sex (approximated from various health sources)
  const refBMR = {
    male: { 20: 1700, 30: 1650, 40: 1600, 50: 1550, 60: 1500, 70: 1450 },
    female: { 20: 1350, 30: 1300, 40: 1250, 50: 1200, 60: 1150, 70: 1100 }
  };

  const gender = sex === 1 ? 'male' : 'female';
  const ageBrackets = Object.keys(refBMR[gender]).map(Number);

  // Find the closest age bracket
  const closestAge = ageBrackets.reduce((prev, curr) => 
    (Math.abs(curr - age) < Math.abs(prev - age) ? curr : prev)
  );

  const averageBMRForAge = refBMR[gender][closestAge];
  const bmrDifference = bmr - averageBMRForAge;

  // Roughly, a 25-30 BMR point difference can correspond to a year of metabolic age.
  // We'll use an approximate factor. A higher BMR than average means a younger metabolic age.
  const ageDifference = bmrDifference / 27.5;

  const metabolicAge = age - ageDifference;
  
  return Math.max(18, Math.min(Math.round(metabolicAge), 80)); // Keep it within a reasonable range
}

export function calc_subcutaneous_fat_percent(fat_percent, sex = 1) {
  // Females store proportionally more fat subcutaneously (~85%), males ~75%
  const ratio = sex === 0 ? 0.85 : 0.75;
  return round5(ratio * fat_percent);
}

export function calc_subcutaneous_fat_mass(weight, subcutaneous_fat_percent) {
  return weight > 0 ? round5(weight * subcutaneous_fat_percent / 100) : 0;
}

export function calc_fat_free_weight(weight, fat_mass) {
  return weight > 0 ? round5(weight - fat_mass) : 0;
}

export function calc_standard_weight(height, sex = 1) {
  const height_m = height / 100;
  // Sex-specific ideal BMI targets
  const targetBMI = sex === 1 ? 22.5 : 21.5;
  return round5(targetBMI * height_m * height_m);
}

export function calc_healthy_weight_range(height) {
  const height_m = height / 100;
  return {
    min: round5(18.5 * height_m * height_m),
    max: round5(24.9 * height_m * height_m)
  };
}

export function calc_weight_control(standard_weight, weight) {
  return round5(standard_weight - weight);
}

export function calc_fat_control(weight, fat_percent, sex) {
  // Midpoint of healthy range as target
  const target_fat_percent = sex === 1 ? 15.0 : 25.0;
  const target_fat_mass = weight > 0 ? round5(weight * target_fat_percent / 100) : 0;
  const current_fat_mass = calc_fat_mass(weight, fat_percent);
  return round5(target_fat_mass - current_fat_mass);
}

export function calc_muscle_control(weight, muscle_percent, sex = 1) {
  // Sex-specific target muscle percentage (midpoint of healthy range)
  const target_muscle_percent = sex === 1 ? 42.0 : 35.0;
  const target_muscle_mass = weight > 0 ? round5(weight * target_muscle_percent / 100) : 0;
  const current_muscle_mass = calc_muscle_mass(weight, muscle_percent);
  return round5(target_muscle_mass - current_muscle_mass);
}

export function calc_body_score(weight, height, sex, age, impedance) {
  const bmi = calc_bmi(weight, height);
  const fat_percent = calc_fat_percent(weight, height, sex, age, impedance);
  const target_fat = sex === 1 ? 12 : 22;
  const score = 100 - (Math.abs(bmi - 22) * 1.2) - (Math.abs(fat_percent - target_fat) * 1.5);
  return Math.max(0, Math.min(Math.round(score), 100));
}

export function calc_ffmi(weight, height, fat_mass) {
  const ffmi = height > 0 ? (weight - fat_mass) / ((height / 100) ** 2) : 0;
  return round5(ffmi);
}

export function calc_body_surface_area(height, weight) {
  return round5(0.007184 * (height ** 0.725) * (weight ** 0.425));
}

export function calc_ideal_body_weight(height, sex) {
  const height_inches = height / 2.54;
  let ibw;
  if (sex === 1) { // Male
    ibw = 50 + 2.3 * (height_inches - 60);
  } else { // Female
    ibw = 45.5 + 2.3 * (height_inches - 60);
  }
  return round5(ibw);
}

// NEW ADDITIONS: The following functions have been added to expand the body composition metrics.
// These include advanced indices like LBMI, FMR, HEI, etc., which provide deeper insights into lean mass quality,
// hydration, metabolic efficiency, and more. They build upon the existing calculations (e.g., using ffm, bmr, etc.)
// and introduce new formulas for normalization, ratios, and composite scores.

// 1. Lean Body Mass Index (LBMI)
// Meaning: Quality of lean mass normalized by height (better than BMI).
export function calc_lbmi(weight, height, age, impedance, sex = 1) {
  const ffm = calc_ffm(weight, height, age, impedance, sex);
  return height > 0 ? round5(ffm / ((height / 100) ** 2)) : 0;
}

// 2. Fat-to-Muscle Ratio (FMR)
// Meaning: Relative dominance of fat mass vs muscle mass.
export function calc_fat_muscle_ratio(fat_mass, muscle_mass) {
  return muscle_mass > 0 ? round5(fat_mass / muscle_mass) : 0;
}

// 3. Hydration Efficiency Index (HEI)
// Meaning: How much of fat-free mass is water (cellular hydration quality).
export function calc_hydration_efficiency(ffm, water_mass) {
  return ffm > 0 ? round5((water_mass / ffm) * 100) : 0;
}

// 4. Structural Mass Percentage
// Meaning: Structural tissue proportion (bone + muscle).
export function calc_structural_mass_percent(bone_percent, muscle_percent) {
  return round5(bone_percent + muscle_percent);
}

// 5. Metabolic Load Index (MLI)
// Meaning: Energy demand per kg body mass.
export function calc_metabolic_load(bmr, weight) {
  return weight > 0 ? round5(bmr / weight) : 0;
}

// 6. Energy Reserve Score (ERS) - normalized 0-100
// Meaning: Available energy reserves from fat + protein tissue.
// Fat max ~50%, protein max ~22% for normalization.
export function calc_energy_reserve_score(fat_percent, protein_percent) {
  const normalizedFat = Math.min(fat_percent / 50, 1);
  const normalizedProtein = Math.min(protein_percent / 22, 1);
  return round5((normalizedFat * 0.6 + normalizedProtein * 0.4) * 100);
}

// 7. Thermal Regulation Index (TRI)
// Meaning: Heat production capacity relative to surface area.
export function calc_thermal_index(bmr, body_surface_area) {
  return body_surface_area > 0 ? round5(bmr / body_surface_area) : 0;
}

// 8. Fat-Free Weight (FFW)
// Note: Already defined earlier as calc_fat_free_weight (line 144) - no duplicate needed

// 9. Fat Dominance Index (FDI)
// Meaning: Which tissue dominates body composition.
export function calc_fat_dominance(fat_percent, muscle_percent) {
  return round5(fat_percent - muscle_percent);
}

// 10. Recomposition Gap Score
// Meaning: Single-number distance from balanced composition.
export function calc_recomposition_gap(weight_control, fat_control, muscle_control) {
  return round5(
    Math.abs(weight_control) +
    Math.abs(fat_control) +
    Math.abs(muscle_control)
  );
}

// 11. Body Density (Siri 1956 formula)
// Meaning: Actual body density in g/cm³ derived from body fat percentage.
// Formula: density = 4.95 / (fat_fraction + 4.50) — Siri two-component model.
export function calc_body_density(fat_percent) {
  if (!fat_percent || fat_percent <= 0) return 1.062; // healthy default
  const fat_fraction = fat_percent / 100;
  const density = 4.95 / (fat_fraction + 4.50);
  return round5(Math.max(0.90, Math.min(density, 1.12)));
}

// 12. Muscle Efficiency Index (MEI)
// Meaning: Energy output per unit muscle mass.
export function calc_muscle_efficiency(bmr, muscle_mass) {
  return muscle_mass > 0 ? round5(bmr / muscle_mass) : 0;
}

// 13. Protein-to-Muscle Ratio (PMR)
// Meaning: Protein availability relative to muscle tissue.
export function calc_protein_muscle_ratio(protein_mass, muscle_mass) {
  return muscle_mass > 0 ? round5(protein_mass / muscle_mass) : 0;
}

// 14. Metabolic Advantage Index (MAI)
// Meaning: How much metabolism outperforms age expectation.
export function calc_metabolic_advantage(age, metabolic_age) {
  return round5(age - metabolic_age);
}

// 15. Physiological Efficiency Score (PES) - normalized 0-100
// Meaning: Composite efficiency of metabolism, hydration, and lean mass.
// LBMI normalized to 0-100 (typical range 10-25 → 0-100%).
export function calc_physiological_efficiency(lbmi, hydration_efficiency, muscle_efficiency) {
  const lbmiScore = Math.min(Math.max((lbmi / 22) * 100, 0), 100);
  const hydScore = Math.min(Math.max(hydration_efficiency, 0), 100);
  const muscScore = Math.min(Math.max(muscle_efficiency, 0), 100);
  return round5(lbmiScore * 0.4 + hydScore * 0.3 + muscScore * 0.3);
}

// OPTIONAL SINGLE AGGREGATOR (RECOMMENDED)
// This function computes multiple advanced metrics in one go, using input parameters and calling the necessary base calculations.
// Newly added to centralize computations for efficiency in reports/scans.
export function computeAdvancedBodyMetrics(input) {
  const {
    weight, height, age, sex, impedance,
    fatPercent, musclePercent, bonePercent,
    waterPercent, proteinPercent
  } = input;

  const fatMass = calc_fat_mass(weight, fatPercent);
  const muscleMass = calc_muscle_mass(weight, musclePercent);
  const proteinMass = calc_protein_mass(weight, proteinPercent);
  const ffm = calc_ffm(weight, height, age, impedance, sex);
  const waterMass = calc_water_mass(weight, waterPercent);
  const bmr = calc_bmr(weight, height, sex, age);
  const bsa = calc_body_surface_area(height, weight);

  return {
    lbmi: calc_lbmi(weight, height, age, impedance, sex),
    fatMuscleRatio: calc_fat_muscle_ratio(fatMass, muscleMass),
    hydrationEfficiency: calc_hydration_efficiency(ffm, waterMass),
    structuralMassPercent: calc_structural_mass_percent(bonePercent, musclePercent),
    metabolicLoad: calc_metabolic_load(bmr, weight),
    energyReserve: calc_energy_reserve_score(fatPercent, proteinPercent),
    thermalIndex: calc_thermal_index(bmr, bsa),
    bodyDensity: calc_body_density(fatPercent),
    fatDominance: calc_fat_dominance(fatPercent, musclePercent),
    recompositionGap: calc_recomposition_gap(
      calc_weight_control(calc_standard_weight(height, sex), weight),
      calc_fat_control(weight, fatPercent, sex),
      calc_muscle_control(weight, musclePercent, sex)
    ),
    metabolicAdvantage: calc_metabolic_advantage(age, calc_metabolic_age(bmr, age, sex))
  };
}