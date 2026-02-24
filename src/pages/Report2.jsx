// src/pages/Report2.jsx
import React, { useMemo, useEffect, useRef } from "react";
import { useHealth } from "../context/HealthContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import * as bodyComposition from "../utils/bodyComposition";
import Logo from "../components/Logo";
import Confetti from "react-confetti";

// Helper: Extract first name
const getFirstName = (patient) => {
  if (patient?.name) return patient.name.split(' ')[0];
  if (patient?.email) return patient.email.split('@')[0].split('.')[0];
  return 'Champion';
};

// Helper: Gender-specific compliments
const getGenderCompliment = (gender, positive = true) => {
  const isMale = gender?.toLowerCase() === 'male';
  if (positive) {
    return isMale ? 'Keep it up, king!' : 'You\'re doing great, queen!';
  } else {
    return isMale ? 'Let\'s optimize, champ!' : 'Time to shine brighter!';
  }
};

// ============================================================================
// UTILITY: Calculate Standard Deviation
// ============================================================================
function stdDeviation(arr) {
  if (!arr || arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

// ============================================================================
// SYSTEM 1: BMI (Body Mass Index) ASSESSMENT
// ============================================================================
function assessBMI(vitals, patient, history) {
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  
  if (!weight || !height) return { status: null, direction: null, trend: null, pattern: null, value: null, stability: null };
  
  const bmi = bodyComposition.calc_bmi(weight, height);
  
  // Step 1: Status
  let status = null;
  if (bmi < 18.5) status = "Underweight";
  else if (bmi >= 18.5 && bmi < 25) status = "Normal";
  else if (bmi >= 25 && bmi < 30) status = "Overweight";
  else status = "Obese";

  // Step 2: Direction (Scan ≥ 2)
  let direction = null;
  if (history && history.length > 0) {
    const prevWeight = Number(history[history.length - 1].vitals?.weight) || weight;
    const prevHeight = Number(history[history.length - 1].vitals?.height) || height;
    const prevBMI = bodyComposition.calc_bmi(prevWeight, prevHeight);
    const delta = bmi - prevBMI;
    
    if (Math.abs(delta) <= 0.3) direction = "Stable";
    else if (delta < 0) direction = "Improving";
    else direction = "Increasing";
  }

  // Step 3: Trend (Scan ≥ 3)
  let trend = null;
  if (history && history.length >= 2) {
    const bmiValues = [bmi, ...history.slice(-2).map(h => {
      const w = Number(h.vitals?.weight) || 0;
      const ht = Number(h.vitals?.height) || 0;
      return ht > 0 ? bodyComposition.calc_bmi(w, ht) : 0;
    })];
    const avgBMI = bmiValues.reduce((a, b) => a + b, 0) / bmiValues.length;
    const firstBMI = bmiValues[bmiValues.length - 1];
    
    if (Math.abs(avgBMI - firstBMI) <= 0.5) trend = "Consistently Stable";
    else if (avgBMI < firstBMI - 0.5) trend = "Trending Down";
    else trend = "Trending Up";
  }

  // Step 4: Pattern (Scan ≥ 5)
  let pattern = null;
  let stabilityVariance = null;
  if (history && history.length >= 4) {
    const bmiValues = [bmi, ...history.slice(-4).map(h => {
      const w = Number(h.vitals?.weight) || 0;
      const ht = Number(h.vitals?.height) || 0;
      return ht > 0 ? bodyComposition.calc_bmi(w, ht) : 0;
    })];
    stabilityVariance = stdDeviation(bmiValues);
    
    if (stabilityVariance < 0.5) pattern = "Highly Stable";
    else if (stabilityVariance < 1.0) pattern = "Moderately Stable";
    else pattern = "Variable";
  }

  return { status, direction, trend, pattern, value: bmi, stability: stabilityVariance };
}

// ============================================================================
// SYSTEM 2: BODY FAT PERCENTAGE ASSESSMENT
// ============================================================================
function assessBodyFat(vitals, patient, history) {
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, direction: null, trend: null, pattern: null, value: null, stability: null };
  
  const bodyFat = bodyComposition.calc_fat_percent(weight, height, sex, age, impedance);
  
  // Status based on gender
  let status = null;
  if (sex === 1) { // Male
    if (bodyFat < 6) status = "Essential Fat";
    else if (bodyFat >= 6 && bodyFat < 14) status = "Athletic";
    else if (bodyFat >= 14 && bodyFat < 25) status = "Normal";
    else status = "High";
  } else { // Female
    if (bodyFat < 14) status = "Essential Fat";
    else if (bodyFat >= 14 && bodyFat < 21) status = "Athletic";
    else if (bodyFat >= 21 && bodyFat < 32) status = "Normal";
    else status = "High";
  }

  // Direction
  let direction = null;
  if (history && history.length > 0) {
    const prevVitals = history[history.length - 1].vitals;
    const prevBodyFat = bodyComposition.calc_fat_percent(
      Number(prevVitals?.weight) || weight,
      Number(prevVitals?.height) || height,
      sex, age,
      Number(prevVitals?.impedance) || impedance
    );
    const delta = bodyFat - prevBodyFat;
    
    if (Math.abs(delta) <= 0.5) direction = "Stable";
    else if (delta < 0) direction = "Decreasing";
    else direction = "Increasing";
  }

  // Trend
  let trend = null;
  if (history && history.length >= 2) {
    const fatValues = [bodyFat, ...history.slice(-2).map(h => {
      return bodyComposition.calc_fat_percent(
        Number(h.vitals?.weight) || 0,
        Number(h.vitals?.height) || 0,
        sex, age,
        Number(h.vitals?.impedance) || impedance
      );
    })];
    const avgFat = fatValues.reduce((a, b) => a + b, 0) / fatValues.length;
    const firstFat = fatValues[fatValues.length - 1];
    
    if (Math.abs(avgFat - firstFat) <= 1) trend = "Consistent";
    else if (avgFat < firstFat - 1) trend = "Reducing";
    else trend = "Accumulating";
  }

  // Pattern
  let pattern = null;
  let stabilityVariance = null;
  if (history && history.length >= 4) {
    const fatValues = [bodyFat, ...history.slice(-4).map(h => {
      return bodyComposition.calc_fat_percent(
        Number(h.vitals?.weight) || 0,
        Number(h.vitals?.height) || 0,
        sex, age,
        Number(h.vitals?.impedance) || impedance
      );
    })];
    stabilityVariance = stdDeviation(fatValues);
    
    if (stabilityVariance < 1) pattern = "Steady State";
    else if (stabilityVariance < 2) pattern = "Adaptive";
    else pattern = "Fluctuating";
  }

  return { status, direction, trend, pattern, value: bodyFat, stability: stabilityVariance };
}

// ============================================================================
// SYSTEM 3: MUSCLE MASS ASSESSMENT
// ============================================================================
function assessMuscle(vitals, patient, history) {
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, direction: null, trend: null, pattern: null, value: null, stability: null };
  
  const musclePercent = bodyComposition.calc_muscle_percent(weight, height, sex, age, impedance);
  
  // Status based on gender
  let status = null;
  if (sex === 1) { // Male
    if (musclePercent >= 45) status = "Excellent";
    else if (musclePercent >= 38) status = "Normal";
    else status = "Below Average";
  } else { // Female
    if (musclePercent >= 38) status = "Excellent";
    else if (musclePercent >= 31) status = "Normal";
    else status = "Below Average";
  }

  // Direction
  let direction = null;
  if (history && history.length > 0) {
    const prevVitals = history[history.length - 1].vitals;
    const prevMuscle = bodyComposition.calc_muscle_percent(
      Number(prevVitals?.weight) || weight,
      Number(prevVitals?.height) || height,
      sex, age,
      Number(prevVitals?.impedance) || impedance
    );
    const delta = musclePercent - prevMuscle;
    
    if (Math.abs(delta) <= 0.5) direction = "Stable";
    else if (delta > 0) direction = "Increasing";
    else direction = "Decreasing";
  }

  // Trend
  let trend = null;
  if (history && history.length >= 2) {
    const muscleValues = [musclePercent, ...history.slice(-2).map(h => {
      return bodyComposition.calc_muscle_percent(
        Number(h.vitals?.weight) || 0,
        Number(h.vitals?.height) || 0,
        sex, age,
        Number(h.vitals?.impedance) || impedance
      );
    })];
    const avgMuscle = muscleValues.reduce((a, b) => a + b, 0) / muscleValues.length;
    const firstMuscle = muscleValues[muscleValues.length - 1];
    
    if (Math.abs(avgMuscle - firstMuscle) <= 1) trend = "Consistent";
    else if (avgMuscle > firstMuscle + 1) trend = "Building";
    else trend = "Declining";
  }

  // Pattern
  let pattern = null;
  let stabilityVariance = null;
  if (history && history.length >= 4) {
    const muscleValues = [musclePercent, ...history.slice(-4).map(h => {
      return bodyComposition.calc_muscle_percent(
        Number(h.vitals?.weight) || 0,
        Number(h.vitals?.height) || 0,
        sex, age,
        Number(h.vitals?.impedance) || impedance
      );
    })];
    stabilityVariance = stdDeviation(muscleValues);
    
    if (stabilityVariance < 1) pattern = "Stable";
    else if (stabilityVariance < 2) pattern = "Adaptive";
    else pattern = "Variable";
  }

  return { status, direction, trend, pattern, value: musclePercent, stability: stabilityVariance };
}

// ============================================================================
// SYSTEM 4: BONE MASS ASSESSMENT
// ============================================================================
function assessBoneMass(vitals, patient, history) {
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, direction: null, trend: null, pattern: null, value: null, stability: null };
  
  const boneMass = bodyComposition.calc_bone_mass(weight, height, sex, age, impedance);
  
  // Status based on gender and weight
  let status = null;
  if (sex === 1) { // Male
    if (boneMass >= 3.2) status = "Strong";
    else if (boneMass >= 2.5) status = "Normal";
    else status = "Low Density";
  } else { // Female
    if (boneMass >= 2.5) status = "Strong";
    else if (boneMass >= 1.8) status = "Normal";
    else status = "Low Density";
  }

  // Direction
  let direction = null;
  if (history && history.length > 0) {
    const prevVitals = history[history.length - 1].vitals;
    const prevBone = bodyComposition.calc_bone_mass(
      Number(prevVitals?.weight) || weight,
      Number(prevVitals?.height) || height,
      sex, age,
      Number(prevVitals?.impedance) || impedance
    );
    const delta = boneMass - prevBone;
    
    if (Math.abs(delta) <= 0.1) direction = "Stable";
    else if (delta > 0) direction = "Increasing";
    else direction = "Decreasing";
  }

  // Trend
  let trend = null;
  if (history && history.length >= 2) {
    const boneValues = [boneMass, ...history.slice(-2).map(h => {
      return bodyComposition.calc_bone_mass(
        Number(h.vitals?.weight) || 0,
        Number(h.vitals?.height) || 0,
        sex, age,
        Number(h.vitals?.impedance) || impedance
      );
    })];
    const avgBone = boneValues.reduce((a, b) => a + b, 0) / boneValues.length;
    const firstBone = boneValues[boneValues.length - 1];
    
    if (Math.abs(avgBone - firstBone) <= 0.15) trend = "Maintained";
    else if (avgBone > firstBone + 0.15) trend = "Strengthening";
    else trend = "Weakening";
  }

  // Pattern
  let pattern = null;
  let stabilityVariance = null;
  if (history && history.length >= 4) {
    const boneValues = [boneMass, ...history.slice(-4).map(h => {
      return bodyComposition.calc_bone_mass(
        Number(h.vitals?.weight) || 0,
        Number(h.vitals?.height) || 0,
        sex, age,
        Number(h.vitals?.impedance) || impedance
      );
    })];
    stabilityVariance = stdDeviation(boneValues);
    
    if (stabilityVariance < 0.1) pattern = "Highly Stable";
    else if (stabilityVariance < 0.2) pattern = "Stable";
    else pattern = "Variable";
  }

  return { status, direction, trend, pattern, value: boneMass, stability: stabilityVariance };
}

// ============================================================================
// SYSTEM 5: WATER BALANCE ASSESSMENT
// ============================================================================
function assessWater(vitals, patient, history) {
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, direction: null, trend: null, pattern: null, value: null, stability: null };
  
  const waterPercent = bodyComposition.calc_water_percent(weight, height, sex, age, impedance);
  
  // Status based on gender
  let status = null;
  if (sex === 1) { // Male
    if (waterPercent >= 55 && waterPercent <= 65) status = "Optimal";
    else if (waterPercent >= 50 && waterPercent < 55) status = "Low";
    else if (waterPercent > 65 && waterPercent <= 70) status = "High";
    else if (waterPercent < 50) status = "Dehydrated";
    else status = "High";
  } else { // Female
    if (waterPercent >= 45 && waterPercent <= 60) status = "Optimal";
    else if (waterPercent >= 40 && waterPercent < 45) status = "Low";
    else if (waterPercent > 60 && waterPercent <= 65) status = "High";
    else if (waterPercent < 40) status = "Dehydrated";
    else status = "High";
  }

  // Direction
  let direction = null;
  if (history && history.length > 0) {
    const prevVitals = history[history.length - 1].vitals;
    const prevWater = bodyComposition.calc_water_percent(
      Number(prevVitals?.weight) || weight,
      Number(prevVitals?.height) || height,
      sex, age,
      Number(prevVitals?.impedance) || impedance
    );
    const delta = waterPercent - prevWater;
    
    if (Math.abs(delta) <= 1) direction = "Stable";
    else if (delta > 0 && status === "Low") direction = "Improving";
    else if (delta < 0 && status === "High") direction = "Normalizing";
    else if (delta > 0) direction = "Increasing";
    else direction = "Decreasing";
  }

  // Trend
  let trend = null;
  if (history && history.length >= 2) {
    const waterValues = [waterPercent, ...history.slice(-2).map(h => {
      return bodyComposition.calc_water_percent(
        Number(h.vitals?.weight) || 0,
        Number(h.vitals?.height) || 0,
        sex, age,
        Number(h.vitals?.impedance) || impedance
      );
    })];
    const avgWater = waterValues.reduce((a, b) => a + b, 0) / waterValues.length;
    
    if (status === "Optimal") trend = "Well Hydrated";
    else if (avgWater < 45 || avgWater < 50 && sex === 1) trend = "Needs Hydration";
    else trend = "Monitoring";
  }

  // Pattern
  let pattern = null;
  let stabilityVariance = null;
  if (history && history.length >= 4) {
    const waterValues = [waterPercent, ...history.slice(-4).map(h => {
      return bodyComposition.calc_water_percent(
        Number(h.vitals?.weight) || 0,
        Number(h.vitals?.height) || 0,
        sex, age,
        Number(h.vitals?.impedance) || impedance
      );
    })];
    stabilityVariance = stdDeviation(waterValues);
    
    if (stabilityVariance < 1.5) pattern = "Balanced";
    else if (stabilityVariance < 3) pattern = "Fluctuating";
    else pattern = "Variable";
  }

  return { status, direction, trend, pattern, value: waterPercent, stability: stabilityVariance };
}

// ============================================================================
// SYSTEM 5: WEIGHT CONTROL (Scan 2+)
// ============================================================================
function assessWeightControl(vitals, patient, history, scanCount) {
  if (scanCount < 2) return { status: null, gap: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  if (!weight || !height) return { status: null, gap: null, remedy: null, comment: null };
  
  const standardWeight = bodyComposition.calc_standard_weight(height);
  const gap = bodyComposition.calc_weight_control(standardWeight, weight);
  
  let status, remedy, comment;
  const absGap = Math.abs(gap);
  const userName = getFirstName(patient);
  const isMale = patient.gender?.toLowerCase() === 'male';
  
  if (absGap <= 2) {
    status = "Perfect Weight";
    remedy = "Almond + milk daily";
    comment = `${userName}, your weight is spot-on! ${isMale ? 'King' : 'Queen'} of balance.`;
  } else if (absGap <= 5) {
    status = gap > 0 ? "Slightly Underweight" : "Slightly Overweight";
    remedy = gap > 0 ? "Banana + peanut butter" : "Jeera water before meals";
    comment = `${userName}, just ${absGap.toFixed(1)}kg ${gap > 0 ? 'more' : 'less'} to perfect weight. Easy to achieve!`;
  } else if (absGap <= 10) {
    status = gap > 0 ? "Underweight" : "Overweight";
    remedy = gap > 0 ? "Milk + dates shake" : "Lemon + jeera water";
    comment = `${userName}, ${absGap.toFixed(1)}kg ${gap > 0 ? 'weight gain' : 'weight loss'} recommended. Start with small steps.`;
  } else {
    status = gap > 0 ? "Significantly Underweight" : "Significantly Overweight";
    remedy = gap > 0 ? "Dry fruits mix + banana" : "Methi water + morning walk";
    comment = `${userName}, ${absGap.toFixed(1)}kg adjustment needed. Consult a nutritionist for personalized plan.`;
  }
  
  return { status, gap, remedy, comment, standardWeight };
}

// ============================================================================
// SYSTEM 6: FAT CONTROL (Scan 3+)
// ============================================================================
function assessFatControl(vitals, patient, history, scanCount) {
  if (scanCount < 3) return { status: null, gap: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, gap: null, remedy: null, comment: null };
  
  const fatPercent = bodyComposition.calc_fat_percent(weight, height, sex, age, impedance);
  const gap = bodyComposition.calc_fat_control(weight, fatPercent, sex);
  const userName = getFirstName(patient);
  const isMale = sex === 1;
  
  let status, remedy, comment;
  
  if (gap >= -1 && gap <= 1) {
    status = "Optimal Fat Levels";
    remedy = "Coconut water + sprouts";
    comment = `${userName}, your body fat is perfectly balanced! Maintain this ${isMale ? 'brother' : 'sister'}.`;
  } else if (gap < -5) {
    status = "Excess Fat";
    remedy = "Methi tea + lauki sabzi";
    comment = `${userName}, reduce ${Math.abs(gap).toFixed(1)}kg fat. Start with daily 30-min walk.`;
  } else if (gap < -2) {
    status = "Slightly High Fat";
    remedy = "Jeera water + reduce oil";
    comment = `${userName}, ${Math.abs(gap).toFixed(1)}kg fat reduction suggested. Small diet changes help!`;
  } else if (gap > 2) {
    status = "Too Lean";
    remedy = "Paneer + milk + nuts";
    comment = `${userName}, add ${gap.toFixed(1)}kg healthy fat. Include ghee in diet.`;
  } else {
    status = "Near Optimal";
    remedy = "Balanced thali daily";
    comment = `${userName}, almost there! Just ${Math.abs(gap).toFixed(1)}kg adjustment needed.`;
  }
  
  return { status, gap, remedy, comment };
}

// ============================================================================
// SYSTEM 7: MUSCLE CONTROL (Scan 3+)
// ============================================================================
function assessMuscleControl(vitals, patient, history, scanCount) {
  if (scanCount < 3) return { status: null, gap: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, gap: null, remedy: null, comment: null };
  
  const musclePercent = bodyComposition.calc_muscle_percent(weight, height, sex, age, impedance);
  const gap = bodyComposition.calc_muscle_control(weight, musclePercent);
  const userName = getFirstName(patient);
  const isMale = sex === 1;
  
  let status, remedy, comment;
  
  if (gap >= -2 && gap <= 2) {
    status = "Strong Muscles";
    remedy = "Dal + roti + paneer";
    comment = `${userName}, excellent muscle mass! ${isMale ? 'Mashallah!' : 'Keep shining!'}`;
  } else if (gap < -5) {
    status = "Excess Muscle (Rare)";
    remedy = "Maintain protein intake";
    comment = `${userName}, you have ${Math.abs(gap).toFixed(1)}kg extra muscle. Athlete level!`;
  } else if (gap > 5) {
    status = "Low Muscle Mass";
    remedy = "Peanut chikki + eggs + gym";
    comment = `${userName}, build ${gap.toFixed(1)}kg muscle. Strength training 3x/week recommended.`;
  } else if (gap > 2) {
    status = "Below Average Muscle";
    remedy = "Soya chunks + moong dal";
    comment = `${userName}, add ${gap.toFixed(1)}kg muscle. Start with bodyweight exercises!`;
  } else {
    status = "Slightly Low Muscle";
    remedy = "Roasted chana + milk";
    comment = `${userName}, ${gap.toFixed(1)}kg muscle gain suggested. Include more protein.`;
  }
  
  return { status, gap, remedy, comment };
}

// ============================================================================
// SYSTEM 8: IDEAL BODY WEIGHT (Scan 4+)
// ============================================================================
function assessIdealBodyWeight(vitals, patient, history, scanCount) {
  if (scanCount < 4) return { status: null, ideal: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  
  if (!weight || !height) return { status: null, ideal: null, remedy: null, comment: null };
  
  const idealWeight = bodyComposition.calc_ideal_body_weight(height, sex);
  const diff = weight - idealWeight;
  const userName = getFirstName(patient);
  const isMale = sex === 1;
  
  let status, remedy, comment;
  const absDiff = Math.abs(diff);
  
  if (absDiff <= 3) {
    status = "Ideal Weight Zone";
    remedy = "Continue current diet";
    comment = `${userName}, you're in the ideal weight range! ${isMale ? 'Boss level' : 'Perfect balance'}!`;
  } else if (absDiff <= 7) {
    status = diff > 0 ? "Above Ideal" : "Below Ideal";
    remedy = diff > 0 ? "Sabzi + roti only" : "Banana + milk shake";
    comment = `${userName}, ${absDiff.toFixed(1)}kg ${diff > 0 ? 'above' : 'below'} ideal. Easily manageable!`;
  } else if (absDiff <= 15) {
    status = diff > 0 ? "Overweight Range" : "Underweight Range";
    remedy = diff > 0 ? "Methi water + walk" : "Dry fruits + protein";
    comment = `${userName}, ${absDiff.toFixed(1)}kg ${diff > 0 ? 'reduction' : 'gain'} brings you to ideal. Start today!`;
  } else {
    status = diff > 0 ? "Obese Range" : "Severely Underweight";
    remedy = diff > 0 ? "Doctor consultation" : "Nutritionist visit";
    comment = `${userName}, ${absDiff.toFixed(1)}kg adjustment needed. Medical guidance recommended.`;
  }
  
  return { status, ideal: idealWeight, remedy, comment, diff };
}

// ============================================================================
// DESCRIPTION DATABASE (7-SCAN UNLOCK SYSTEM)
// ============================================================================
const descriptionBank = {
  BMI: {
    Normal: {
      capture: "Your Body Mass Index has been calculated.",
      direction: "Your BMI remains in the healthy range.",
      trend: "Sustained healthy weight-to-height ratio detected.",
      pattern: "Your BMI profile shows excellent long-term stability.",
      confidence: "Highly consistent BMI pattern confirmed across scans.",
      confirmed: "Seven scans confirm your BMI is consistently within the healthy range. Your weight-to-height ratio is well-balanced."
    },
    Underweight: {
      capture: "BMI recorded in underweight category.",
      direction: "Underweight BMI noted. Monitoring for nutritional needs.",
      trend: "Consistent underweight pattern observed.",
      pattern: "Reliable underweight profile established. Consider nutritional guidance.",
      confidence: "Confirmed underweight BMI across measurements.",
      confirmed: "Your BMI consistently indicates underweight status. Consult with a healthcare provider about healthy weight gain strategies."
    },
    Overweight: {
      capture: "BMI recorded in overweight range.",
      direction: "Overweight BMI detected. Tracking for changes.",
      trend: "Sustained overweight pattern observed.",
      pattern: "Established overweight profile. Lifestyle interventions may help.",
      confidence: "Consistently overweight BMI confirmed.",
      confirmed: "Your BMI reliably indicates overweight status. Your healthcare provider can recommend personalized strategies."
    },
    Obese: {
      capture: "BMI recorded in obese category.",
      direction: "Obese BMI noted. Close monitoring recommended.",
      trend: "Persistent obese pattern detected.",
      pattern: "Established obesity profile. Medical guidance strongly recommended.",
      confidence: "Confirmed obese BMI pattern across scans.",
      confirmed: "Your BMI consistently indicates obesity. Work with healthcare professionals for comprehensive management strategies."
    }
  },
  "Body Fat": {
    Normal: {
      capture: "Your body fat percentage has been measured.",
      direction: "Body fat percentage remains in healthy range.",
      trend: "Consistently optimal fat distribution maintained.",
      pattern: "Your body fat profile demonstrates healthy stability.",
      confidence: "Highly consistent healthy body fat pattern confirmed.",
      confirmed: "Seven scans confirm your body fat percentage is consistently optimal. Your fat distribution supports overall health."
    },
    Athletic: {
      capture: "Athletic body fat percentage recorded.",
      direction: "Maintaining athletic body fat levels.",
      trend: "Sustained athletic fat percentage detected.",
      pattern: "Established athletic body composition profile.",
      confidence: "Consistent athletic body fat pattern confirmed.",
      confirmed: "Your body fat percentage consistently indicates athletic composition. Maintain your training regimen."
    },
    High: {
      capture: "Elevated body fat percentage detected.",
      direction: "High body fat noted. Monitoring for trends.",
      trend: "Sustained high body fat pattern observed.",
      pattern: "Established high body fat profile. Consider interventions.",
      confidence: "Consistently elevated body fat confirmed.",
      confirmed: "Your body fat percentage consistently indicates elevation. Your healthcare provider can recommend reduction strategies."
    },
    "Essential Fat": {
      capture: "Essential fat levels recorded.",
      direction: "Essential fat range detected. Careful monitoring needed.",
      trend: "Persistent essential fat pattern observed.",
      pattern: "Established essential fat profile. Medical guidance recommended.",
      confidence: "Confirmed essential fat levels across scans.",
      confirmed: "Your body fat is at essential levels. Consult healthcare professionals about safe ranges."
    }
  },
  "Muscle Mass": {
    Excellent: {
      capture: "Your muscle percentage has been assessed.",
      direction: "Excellent muscle mass maintained.",
      trend: "Sustained optimal muscle development detected.",
      pattern: "Your muscle profile demonstrates exceptional stability.",
      confidence: "Highly consistent excellent muscle pattern confirmed.",
      confirmed: "Seven scans confirm your muscle mass is consistently excellent. Your strength foundation is solid."
    },
    Normal: {
      capture: "Healthy muscle percentage recorded.",
      direction: "Normal muscle mass remains stable.",
      trend: "Consistent healthy muscle levels maintained.",
      pattern: "Established healthy muscle composition profile.",
      confidence: "Confirmed normal muscle mass pattern.",
      confirmed: "Your muscle mass consistently indicates healthy levels. Continue strength-maintaining activities."
    },
    "Below Average": {
      capture: "Below average muscle mass detected.",
      direction: "Low muscle percentage noted. Monitoring recommended.",
      trend: "Persistent low muscle pattern observed.",
      pattern: "Established below-average muscle profile. Consider strength training.",
      confidence: "Consistently low muscle mass confirmed.",
      confirmed: "Your muscle mass indicates below-average levels. Resistance training and protein intake may help."
    }
  },
  "Bone Mass": {
    Strong: {
      capture: "Your bone mass has been measured.",
      direction: "Strong bone density maintained.",
      trend: "Sustained optimal bone health detected.",
      pattern: "Your skeletal profile demonstrates excellent stability.",
      confidence: "Highly consistent strong bone pattern confirmed.",
      confirmed: "Seven scans confirm your bone mass is consistently strong. Your skeletal foundation is robust."
    },
    Normal: {
      capture: "Healthy bone mass recorded.",
      direction: "Normal bone density remains stable.",
      trend: "Consistent healthy bone levels maintained.",
      pattern: "Established healthy bone composition profile.",
      confidence: "Confirmed normal bone mass pattern.",
      confirmed: "Your bone mass consistently indicates healthy levels. Maintain calcium and vitamin D intake."
    },
    "Low Density": {
      capture: "Low bone density detected.",
      direction: "Reduced bone mass noted. Monitoring recommended.",
      trend: "Persistent low bone density pattern observed.",
      pattern: "Established low bone mass profile. Consider bone health interventions.",
      confidence: "Consistently low bone density confirmed.",
      confirmed: "Your bone mass indicates low density. Consult healthcare professionals about bone strengthening strategies."
    }
  },
  "Water Balance": {
    Optimal: {
      capture: "Your body water percentage has been measured.",
      direction: "Optimal hydration levels maintained.",
      trend: "Sustained healthy water balance detected.",
      pattern: "Your hydration profile demonstrates excellent stability.",
      confidence: "Highly consistent optimal hydration pattern confirmed.",
      confirmed: "Seven scans confirm your water balance is consistently optimal. Your hydration status supports all body functions."
    },
    Low: {
      capture: "Low hydration levels recorded.",
      direction: "Reduced water percentage noted. Increase fluid intake.",
      trend: "Persistent low hydration pattern observed.",
      pattern: "Established low hydration profile. Increase water consumption.",
      confidence: "Consistently low hydration confirmed.",
      confirmed: "Your water balance indicates low hydration. Focus on increasing daily fluid intake."
    },
    High: {
      capture: "High water percentage detected.",
      direction: "Elevated hydration noted. Monitoring recommended.",
      trend: "Sustained high water balance observed.",
      pattern: "Established high hydration profile. Medical evaluation may be needed.",
      confidence: "Consistently high water percentage confirmed.",
      confirmed: "Your water balance indicates elevation. Consult healthcare provider to rule out underlying conditions."
    },
    Dehydrated: {
      capture: "Dehydrated state detected.",
      direction: "Severe dehydration noted. Immediate action needed.",
      trend: "Persistent dehydration pattern observed.",
      pattern: "Established dehydration profile. Urgent hydration protocol recommended.",
      confidence: "Confirmed dehydration across scans.",
      confirmed: "Your water balance consistently indicates dehydration. Immediate consultation with healthcare provider recommended."
    }
  }
};

// ============================================================================
// SYSTEM SCORING & STRONGEST SYSTEM CALCULATION
// ============================================================================
function calculateSystemScore(systemName, assessment, scanCount) {
  if (!assessment.status) return 0;

  let score = 0;

  // Status weight
  if (assessment.status === "Excellent") {
    score += 4;
  } else if (assessment.status === "Normal" || assessment.status === "Optimized") {
    score += 3;
  } else if (assessment.status === "Borderline") {
    score += 2;
  } else if (assessment.status === "Low" || assessment.status === "Imbalanced" || assessment.status === "Needs Support") {
    score += 1;
  }

  // Direction bonus (Scan ≥ 2)
  if (scanCount >= 2 && assessment.direction === "Stable") {
    score += 1;
  } else if (scanCount >= 2 && assessment.direction === "Improving") {
    score += 2;
  }

  // Stability variance bonus (Scan ≥ 5)
  if (scanCount >= 5 && assessment.variance !== null) {
    if (assessment.variance < 5) {
      score += 2;
    } else if (assessment.variance < 12) {
      score += 1;
    }
  }

  return score;
}

// ============================================================================
// BADGE SYSTEM FOR EACH SCAN
// ============================================================================
function getBadges(scanCount) {
  const badges = [];
  
  if (scanCount === 1) {
    badges.push({ emoji: "🟡", text: "Baseline Captured", color: "bg-amber-50 text-amber-700 border border-amber-200" });
  } else if (scanCount === 2) {
    badges.push({ emoji: "🔵", text: "Consistency Started", color: "bg-blue-50 text-blue-700 border border-blue-200" });
    badges.push({ emoji: "🟢", text: "First Comparison Ready", color: "bg-green-50 text-green-700 border border-green-200" });
  } else if (scanCount === 3) {
    badges.push({ emoji: "🟣", text: "Early Pattern Emerging", color: "bg-purple-50 text-purple-700 border border-purple-200" });
  } else if (scanCount === 4) {
    badges.push({ emoji: "🟢", text: "Trend Identified", color: "bg-green-50 text-green-700 border border-green-200" });
    badges.push({ emoji: "🔒", text: "Doctor-grade insights unlocking", color: "bg-gray-50 text-gray-700 border border-gray-200" });
  } else if (scanCount === 5) {
    badges.push({ emoji: "🏅", text: "System Intelligence Active", color: "bg-yellow-50 text-yellow-700 border border-yellow-200" });
    badges.push({ emoji: "🧠", text: "Pattern Recognized", color: "bg-indigo-50 text-indigo-700 border border-indigo-200" });
  } else if (scanCount === 6) {
    badges.push({ emoji: "🔐", text: "Clinically Consistent", color: "bg-slate-50 text-slate-700 border border-slate-200" });
    badges.push({ emoji: "📊", text: "High Confidence Profile", color: "bg-slate-50 text-slate-700 border border-slate-200" });
  } else if (scanCount >= 7) {
    badges.push({ emoji: "🏆", text: "System Profile Complete", color: "bg-[#F28C38]/10 text-[#F28C38] border border-[#F28C38]/30" });
    badges.push({ emoji: "🩺", text: "Doctor-Ready Insights", color: "bg-[#F28C38]/10 text-[#F28C38] border border-[#F28C38]/30" });
    badges.push({ emoji: "🌟", text: "7-Scan Commitment Completed", color: "bg-[#F28C38]/10 text-[#F28C38] border border-[#F28C38]/30" });
  }

  return badges;
}

// ============================================================================
// TRUST MESSAGING (SCAN-BY-SCAN)
// ============================================================================
function getTrustMessage(scanCount) {
  const messages = {
    1: "One measurement captures data. Interpretation requires consistency.",
    2: "Two scans show direction, not patterns. We're comparing you to yourself.",
    3: "Three scans help us understand consistency. Descriptions unlock now.",
    4: "Trends require repeated confirmation to avoid false signals.",
    5: "Patterns reflect how your body behaves, not just reacts to a single moment.",
    6: "Confidence is based on repeated confirmations. Your profile is becoming clear.",
    7: "Your system profile is now based on confirmations, not estimates."
  };

  return messages[Math.min(scanCount, 7)] || messages[7];
}

// ============================================================================
// CONFIDENCE STAGE CALCULATION
// ============================================================================
function getConfidenceStage(scanCount) {
  if (scanCount === 1) return "capture";
  if (scanCount === 2) return "direction";
  if (scanCount <= 4) return "trend";
  if (scanCount <= 6) return "pattern";
  return "confirmed";
}

// ============================================================================
// MAIN REPORT COMPONENT
// ============================================================================
const Report2 = () => {
  const { data } = useHealth();
  const { patient, vitals } = data;
  const navigate = useNavigate();
  
  const userName = getFirstName(patient);
  const confettiShownRef = useRef(false);

  const systemsData = useMemo(() => {
    if (!vitals || !patient) return null;

    // SCAN COUNT CALCULATION
    const history = data.history || [];
    const confidenceStage = getConfidenceStage(history.length + 1);

    // SYSTEM ASSESSMENTS
    const bmi = assessBMI(vitals, patient, history);
    const bodyFat = assessBodyFat(vitals, patient, history);
    const muscle = assessMuscle(vitals, patient, history);
    const boneMass = assessBoneMass(vitals, patient, history);
    const water = assessWater(vitals, patient, history);

    // SCORING FOR STRONGEST SYSTEM
    const scores = {
      BMI: calculateSystemScore("BMI", bmi, scanCount),
      "Body Fat": calculateSystemScore("Body Fat", bodyFat, scanCount),
      "Muscle Mass": calculateSystemScore("Muscle Mass", muscle, scanCount),
      "Bone Mass": calculateSystemScore("Bone Mass", boneMass, scanCount),
      "Water Balance": calculateSystemScore("Water Balance", water, scanCount),
    };

    const maxScore = Math.max(...Object.values(scores));
    const strongestSystem = Object.keys(scores).find(key => scores[key] === maxScore) || null;

    // SYSTEM CONFIGURATION
    const systemConfigs = [
      {
        name: "BMI",
        icon: "⚖️",
        accent: "#8B5CF6",
        assessment: bmi,
      },
      {
        name: "Body Fat",
        icon: "📊",
        accent: "#EF4444",
        assessment: bodyFat,
      },
      {
        name: "Muscle Mass",
        icon: "💪",
        accent: "#10B981",
        assessment: muscle,
      },
      {
        name: "Bone Mass",
        icon: "🦴",
        accent: "#F59E0B",
        assessment: boneMass,
      },
      {
        name: "Water Balance",
        icon: "💧",
        accent: "#3B82F6",
        assessment: water,
      },
    ];

    // BUILD SYSTEM CARDS
    return systemConfigs.map(config => {
      const { name, icon, accent, assessment } = config;
      const hasStatus = assessment.status !== null;
      const isStrongest = name === strongestSystem && scanCount >= 2 && hasStatus;

      // DESCRIPTION LOGIC
      let description = "";
      if (scanCount === 1) {
        // SCAN 1: Always just captured message
        description = descriptionBank[name][assessment.status || "Normal"]?.capture || "Data captured.";
      } else if (!hasStatus) {
        // No status available
        description = "Unlocks once we have more data about you.";
      } else {
        // SCANS 2+: Use assessment status to get description
        const statusDescriptions = descriptionBank[name][assessment.status] || descriptionBank[name]["Normal"];
        description = statusDescriptions[confidenceStage] || statusDescriptions.capture;
      }

      // CATEGORY & SECONDARY LABEL
      let category = null;
      let secondary = "";

      if (scanCount === 1) {
        // SCAN 1: No category shown
        secondary = hasStatus ? "Data captured" : "Data not captured this scan";
      } else if (scanCount === 2) {
        // SCAN 2: Direction labels
        if (hasStatus) {
          if (assessment.direction === "Stable") {
            category = "STABLE";
            secondary = "Comparing to last scan";
          } else if (assessment.direction === "Improving") {
            category = "IMPROVING";
            secondary = "Better than last scan";
          } else if (assessment.direction === "Declining" || assessment.direction === "Elevating") {
            category = "MONITORING";
            secondary = "Needs observation";
          } else {
            category = assessment.status === "Normal" ? "STABLE" : "MONITORING";
            secondary = "Direction detected";
          }
        }
      } else if (scanCount === 3) {
        // SCAN 3: Status + consistency
        if (hasStatus) {
          category = assessment.status === "Excellent" ? "EXCELLENT" : 
                     assessment.status === "Normal" ? "CONSISTENT" : 
                     assessment.status === "Optimized" ? "OPTIMIZED" : "MONITORING";
          secondary = assessment.trend ? `Trend: ${assessment.trend}` : "Data captured";
        }
      } else if (scanCount === 4) {
        // SCAN 4: Trend mode
        if (hasStatus) {
          category = assessment.status === "Excellent" ? "EXCELLENT" : 
                     assessment.status === "Normal" ? "STABLE" : "MONITORING";
          secondary = assessment.trend || "Trend forming";
        }
      } else if (scanCount === 5) {
        // SCAN 5: Pattern mode
        if (hasStatus) {
          category = assessment.status === "Excellent" ? "EXCELLENT" : 
                     assessment.status === "Normal" ? "RESILIENT" : "MONITORING";
          secondary = assessment.pattern || "Pattern emerging";
        }
      } else if (scanCount === 6) {
        // SCAN 6: Confidence mode
        if (hasStatus) {
          const confidencePercent = Math.min(75 + (scanCount * 4), 95);
          category = `${confidencePercent}% CONFIDENT`;
          secondary = assessment.pattern || "Established pattern";
        }
      } else if (scanCount >= 7) {
        // SCAN 7+: Confirmed mode
        if (hasStatus) {
          const prefix = assessment.status === "Excellent" ? "CONFIRMED STRENGTH" :
                         assessment.status === "Normal" ? "CONFIRMED NORMAL" : "CONFIRMED AREA TO IMPROVE";
          category = prefix;
          secondary = assessment.pattern ? `${assessment.pattern} system` : "Profile confirmed";
        }
      }

      return {
        name,
        icon,
        accent,
        assessment,
        description,
        category,
        secondary,
        hasStatus,
        isStrongest,
        scanCount,
        strongestSystem, // Pass this to identify which system is strongest
      };
    });
  }, [data, vitals, patient]);

  const systems = systemsData || [];
  const scanCount = (data.history?.length || 0) + 1;
  const badges = getBadges(scanCount);
  const trustMessage = getTrustMessage(scanCount);
  
  // Calculate control metrics separately (scan-wise unlock)
  const controlMetrics = useMemo(() => {
    if (!vitals || !patient) return null;
    
    const history = data.history || [];
    
    return {
      weightControl: assessWeightControl(vitals, patient, history, scanCount),
      fatControl: assessFatControl(vitals, patient, history, scanCount),
      muscleControl: assessMuscleControl(vitals, patient, history, scanCount),
      idealBodyWeight: assessIdealBodyWeight(vitals, patient, history, scanCount)
    };
  }, [vitals, patient, data.history]);
  
  const weightControl = controlMetrics?.weightControl || {};
  const fatControl = controlMetrics?.fatControl || {};
  const muscleControl = controlMetrics?.muscleControl || {};
  const idealBodyWeight = controlMetrics?.idealBodyWeight || {};
  
  // Find if there's a strongest system and trigger confetti
  const hasStrongestSystem = systems.some(s => s.isStrongest);
  const shouldShowConfetti = hasStrongestSystem && scanCount >= 2 && !confettiShownRef.current;
  
  // Trigger confetti when strongest system is discovered (scan 2+)
  useEffect(() => {
    if (shouldShowConfetti) {
      confettiShownRef.current = true;
    }
  }, [shouldShowConfetti]);

  return (
    <div className="h-screen bg-[#FDFAF5] flex flex-col items-center justify-center px-6 py-8 overflow-y-auto scrollable-container">
      {shouldShowConfetti && <Confetti numberOfPieces={200} recycle={false} />}
      <div className="w-full max-w-5xl">
        {/* HEADER */}
        <div className="text-center mb-10">
          <Logo className="flex justify-center mb-6" size="text-3xl" />

          <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-2">
            SCREEN 2 OF 5 • SCAN {scanCount}
          </p>

          <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-2">
            Body Composition Fundamentals
          </h1>

          <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-1">
            BODY COMPOSITION ANALYSIS · PHASE 2
          </p>

          <p className="text-xs text-gray-400 mt-1">
            {scanCount === 1 ? "First scan — Data capture mode" : `Scan ${scanCount} — ${getConfidenceStage(scanCount)} analysis`}
          </p>
        </div>

        {/* SYSTEM CARDS */}
        <div className="space-y-5">
          {systems.map((system, idx) => (
            <motion.div
              key={system.name}
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.12, duration: 0.7 }}
              className={`bg-white rounded-2xl p-8 flex items-center relative overflow-hidden transition-all duration-300 ${
                system.hasStatus
                  ? "shadow-[0_10px_40px_-12px_rgba(0,0,0,0.08)]"
                  : "shadow-sm opacity-75 scale-[0.985]"
              } ${system.isStrongest ? "ring-1 ring-[#F28C38]/20" : ""}`}
            >
              {system.hasStatus && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-2.5"
                  style={{ backgroundColor: system.accent, opacity: system.isStrongest ? 0.92 : 0.58 }}
                />
              )}

              <div className="w-[22%] flex items-center gap-8">
                <div
                  className={`size-20 rounded-2xl flex items-center justify-center text-5xl transition-all ${
                    system.isStrongest
                      ? "bg-[#F28C38]/10 text-[#F28C38]"
                      : system.hasStatus
                      ? "bg-gray-50 text-gray-500"
                      : "bg-gray-100/50 text-gray-300"
                  }`}
                >
                  {system.icon}
                </div>

                <div>
                  {system.isStrongest && system.hasStatus && (
                    <div className="bg-[#F28C38]/90 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase mb-2 inline-block">
                      Strongest
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-gray-900">{system.name}</h3>
                </div>
              </div>

              <div className="w-[56%] px-14">
                <p
                  className={`text-lg font-medium leading-relaxed ${
                    system.hasStatus ? "text-gray-800" : "text-gray-400 italic"
                  }`}
                >
                  {system.description}
                </p>
              </div>

              <div className="w-[22%] flex flex-col items-end gap-2.5">
                {system.category ? (
                  <>
                    <div
                      className={`px-6 py-2 rounded-full font-semibold text-xs tracking-wider uppercase ${
                        system.category === "EXCELLENT"
                          ? "bg-[#F28C38] text-white"
                          : system.category?.includes("CONFIDENT")
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : system.category?.includes("CONFIRMED")
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : system.category === "STABLE" || system.category === "IMPROVING"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {system.category}
                    </div>
                    <span className="text-xs text-gray-500 font-medium text-right">{system.secondary}</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400 italic">{system.secondary}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* NEW: BODY CONTROL TARGETS (Scan 2+) */}
        {scanCount >= 2 && (weightControl.status || fatControl.status || muscleControl.status || idealBodyWeight.status) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">🎯 Your Body Control Targets</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weight Control (Scan 2+) */}
              {scanCount >= 2 && weightControl.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 border-2 border-purple-200 shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-3xl mb-2">⚖️</div>
                      <h3 className="text-xl font-bold text-gray-900">Weight Control</h3>
                    </div>
                    <div className="bg-purple-100 px-3 py-1 rounded-full">
                      <span className="text-xs font-bold text-purple-700">SCAN {scanCount}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="text-base font-bold text-purple-700">{weightControl.status}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Standard Weight:</span>
                      <span className="text-base font-semibold text-gray-800">{weightControl.standardWeight?.toFixed(1)} kg</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Gap:</span>
                      <span className={`text-base font-semibold ${weightControl.gap > 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {weightControl.gap > 0 ? '+' : ''}{weightControl.gap?.toFixed(1)} kg
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">{weightControl.comment}</p>
                    <div className="bg-amber-50 px-4 py-3 rounded-xl border border-amber-200">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">🏠</span>
                        <div>
                          <p className="text-xs font-bold text-amber-800 uppercase">Indian Home Remedy</p>
                          <p className="text-sm text-amber-900 font-semibold">{weightControl.remedy}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Fat Control (Scan 3+) */}
              {scanCount >= 3 && fatControl.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gradient-to-br from-red-50 to-white rounded-2xl p-6 border-2 border-red-200 shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-3xl mb-2">🔥</div>
                      <h3 className="text-xl font-bold text-gray-900">Fat Control</h3>
                    </div>
                    <div className="bg-red-100 px-3 py-1 rounded-full">
                      <span className="text-xs font-bold text-red-700">SCAN {scanCount}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="text-base font-bold text-red-700">{fatControl.status}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Fat to Adjust:</span>
                      <span className={`text-base font-semibold ${fatControl.gap < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {fatControl.gap < 0 ? '' : '+'}{fatControl.gap?.toFixed(1)} kg
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-red-200">
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">{fatControl.comment}</p>
                    <div className="bg-amber-50 px-4 py-3 rounded-xl border border-amber-200">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">🏠</span>
                        <div>
                          <p className="text-xs font-bold text-amber-800 uppercase">Indian Home Remedy</p>
                          <p className="text-sm text-amber-900 font-semibold">{fatControl.remedy}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Muscle Control (Scan 3+) */}
              {scanCount >= 3 && muscleControl.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 }}
                  className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 border-2 border-green-200 shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-3xl mb-2">💪</div>
                      <h3 className="text-xl font-bold text-gray-900">Muscle Control</h3>
                    </div>
                    <div className="bg-green-100 px-3 py-1 rounded-full">
                      <span className="text-xs font-bold text-green-700">SCAN {scanCount}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="text-base font-bold text-green-700">{muscleControl.status}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Muscle to Build:</span>
                      <span className={`text-base font-semibold ${muscleControl.gap > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        {muscleControl.gap > 0 ? '+' : ''}{muscleControl.gap?.toFixed(1)} kg
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">{muscleControl.comment}</p>
                    <div className="bg-amber-50 px-4 py-3 rounded-xl border border-amber-200">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">🏠</span>
                        <div>
                          <p className="text-xs font-bold text-amber-800 uppercase">Indian Home Remedy</p>
                          <p className="text-sm text-amber-900 font-semibold">{muscleControl.remedy}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Ideal Body Weight (Scan 4+) */}
              {scanCount >= 4 && idealBodyWeight.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.0 }}
                  className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border-2 border-blue-200 shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-3xl mb-2">🎯</div>
                      <h3 className="text-xl font-bold text-gray-900">Ideal Weight</h3>
                    </div>
                    <div className="bg-blue-100 px-3 py-1 rounded-full">
                      <span className="text-xs font-bold text-blue-700">SCAN {scanCount}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="text-base font-bold text-blue-700">{idealBodyWeight.status}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Your Ideal:</span>
                      <span className="text-base font-semibold text-gray-800">{idealBodyWeight.ideal?.toFixed(1)} kg</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Difference:</span>
                      <span className={`text-base font-semibold ${idealBodyWeight.diff > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                        {idealBodyWeight.diff > 0 ? '+' : ''}{idealBodyWeight.diff?.toFixed(1)} kg
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">{idealBodyWeight.comment}</p>
                    <div className="bg-amber-50 px-4 py-3 rounded-xl border border-amber-200">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">🏠</span>
                        <div>
                          <p className="text-xs font-bold text-amber-800 uppercase">Indian Home Remedy</p>
                          <p className="text-sm text-amber-900 font-semibold">{idealBodyWeight.remedy}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* TRUST MESSAGE & BADGES */}
        <div className="mt-16 bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center mb-12">
          <p className="text-sm text-blue-900 font-medium italic">
            💡 {trustMessage}
          </p>
        </div>

        {/* BADGES */}
        {badges.length > 0 && (
          <div className="mt-12 flex flex-wrap justify-center gap-3 mb-12">
            {badges.map((badge, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className={`px-4 py-2 rounded-full border text-xs font-semibold tracking-wider uppercase ${badge.color}`}
              >
                {badge.emoji} {badge.text}
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA SECTION */}
        <div className="mt-20 text-center">
          <p className="text-base text-gray-600 mb-10 max-w-3xl mx-auto">
            All body composition metrics shown are being tracked for optimal health assessment.
          </p>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/report-3")}
            className="bg-gray-900 text-white font-semibold text-lg px-16 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-3 mb-8"
          >
            Continue to Metabolic Analysis →
          </motion.button>

          {/* PROGRESS INDICATOR */}
          <div className="mt-12 flex flex-col items-center gap-6">
            <p className="text-lg font-medium text-gray-600">
              {scanCount === 1
                ? "Next Scan Shows: Directional changes detected"
                : scanCount === 2
                ? "Next Scan Shows: Early patterns emerging"
                : scanCount === 3
                ? "Next Scan Shows: Trend confirmation"
                : scanCount === 4
                ? "Next Scan Shows: Pattern analysis"
                : scanCount === 5
                ? "Next Scan Shows: Confidence metrics"
                : scanCount === 6
                ? "Next Scan Shows: Final confirmations"
                : "Your profile is now complete"}
            </p>

            <div className="flex gap-3">
              {[1, 2, 3, 4, 5, 6, 7].map(num => (
                <motion.div
                  key={num}
                  className={`h-3 rounded-full transition-all ${
                    num < scanCount
                      ? "bg-[#F28C38] w-12"
                      : num === scanCount
                      ? "w-14 bg-[#F28C38]"
                      : "w-8 bg-gray-200"
                  }`}
                  animate={num === scanCount ? { scale: [1, 1.25, 1] } : {}}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                />
              ))}
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-4">
              Scan {scanCount} of 7
            </p>

            <div className="mt-6 bg-white/80 px-6 py-3 rounded-full border border-gray-200 shadow-sm inline-flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-700">
                Clinically Validated Data Pipeline
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report2;