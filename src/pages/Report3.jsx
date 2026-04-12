import { useMemo, useState } from "react";
import { useHealth } from "../context/HealthContext";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useNavigate } from "react-router-dom";
import * as bodyCompositionUtils from "../utils/bodyComposition";
import Logo from "../components/Logo";

// Helper: Extract first name
const getFirstName = (patient) => {
  if (patient?.name) return patient.name.split(' ')[0];
  if (patient?.email) return patient.email.split('@')[0].split('.')[0];
  return 'Champion';
};

// Helper: Convert cm to feet and inches string
const cmToFtIn = (cm) => {
  if (!cm || cm <= 0) return null;
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches, display: `${feet}'${inches}"` };
};

// Helper: Gender-specific messages
const getGenderCompliment = (gender, tier = 'high') => {
  const isMale = gender?.toLowerCase() === 'male';
  if (tier === 'high') return isMale ? '🔥 Crushing it, king!' : '🔥 Slaying, queen!';
  if (tier === 'mid') return isMale ? 'Keep building, champ!' : 'You\'re doing amazing!';
  return isMale ? 'Let\'s level up!' : 'Time to shine!';
};

const clamp = (v) => Math.max(0, Math.min(100, v));

// ============================================================================
// NEW: TISSUE COMPOSITION ASSESSMENTS (Scan-wise unlock)
// ============================================================================

// Bone Mass Assessment (Scan 2+)
function assessBoneMass(vitals, patient, scanCount) {
  if (scanCount < 2) return { status: null, value: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, value: null, remedy: null, comment: null };
  
  const boneMass = bodyCompositionUtils.calc_bone_mass(weight, height, sex, age, impedance);
  const userName = getFirstName(patient);
  const isMale = sex === 1;
  
  let status, remedy, comment;
  
  if (isMale) {
    if (boneMass >= 3.0 && boneMass <= 3.5) {
      status = "Strong Bones";
      remedy = "Milk + ragi porridge";
      comment = `${userName}, your bone mass is perfect! Strong foundation ${isMale ? 'king' : 'queen'}.`;
    } else if (boneMass >= 2.5 && boneMass < 3.0) {
      status = "Normal Bones";
      remedy = "Til laddoo + milk";
      comment = `${userName}, healthy bone mass. Continue calcium-rich diet.`;
    } else if (boneMass < 2.5) {
      status = "Low Bone Density";
      remedy = "Bajra roti + milk + sunlight";
      comment = `${userName}, bone mass is low. Increase calcium and vitamin D intake.`;
    } else {
      status = "Very Strong";
      remedy = "Maintain current diet";
      comment = `${userName}, exceptional bone density! Keep it up.`;
    }
  } else {
    if (boneMass >= 2.2 && boneMass <= 2.5) {
      status = "Strong Bones";
      remedy = "Milk + ragi porridge";
      comment = `${userName}, your bone mass is perfect! Strong foundation.`;
    } else if (boneMass >= 1.8 && boneMass < 2.2) {
      status = "Normal Bones";
      remedy = "Til laddoo + milk";
      comment = `${userName}, healthy bone mass. Continue calcium-rich diet.`;
    } else if (boneMass < 1.8) {
      status = "Low Bone Density";
      remedy = "Bajra roti + milk + sunlight";
      comment = `${userName}, bone mass is low. Increase calcium and vitamin D.`;
    } else {
      status = "Very Strong";
      remedy = "Maintain current diet";
      comment = `${userName}, exceptional bone density! Keep it up.`;
    }
  }
  
  return { status, value: boneMass, remedy, comment };
}

// Protein Mass/Percent Assessment (Scan 3+)
function assessProtein(vitals, patient, scanCount) {
  if (scanCount < 3) return { status: null, mass: null, percent: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, mass: null, percent: null, remedy: null, comment: null };
  
  const musclePercent = bodyCompositionUtils.calc_muscle_percent(weight, height, sex, age, impedance);
  const proteinPercent = bodyCompositionUtils.calc_protein_percent(musclePercent);
  const proteinMass = bodyCompositionUtils.calc_protein_mass(weight, proteinPercent);
  const userName = getFirstName(patient);
  
  let status, remedy, comment;
  
  if (proteinPercent >= 13 && proteinPercent <= 18) {
    status = "Optimal Protein";
    remedy = "Dal + paneer + eggs";
    comment = `${userName}, perfect protein levels! Muscle building on point.`;
  } else if (proteinPercent >= 10 && proteinPercent < 13) {
    status = "Good Protein";
    remedy = "Moong dal + soya chunks";
    comment = `${userName}, healthy protein. Add more protein-rich foods.`;
  } else if (proteinPercent < 10) {
    status = "Low Protein";
    remedy = "Peanut butter + milk + eggs";
    comment = `${userName}, protein deficiency detected. Increase protein intake urgently.`;
  } else {
    status = "High Protein";
    remedy = "Balanced thali";
    comment = `${userName}, very high protein. Balance with vegetables.`;
  }
  
  return { status, mass: proteinMass, percent: proteinPercent, remedy, comment };
}

// LBMI Assessment (Scan 4+)
function assessLBMI(vitals, patient, scanCount) {
  if (scanCount < 4) return { status: null, value: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, value: null, remedy: null, comment: null };
  
  const lbmi = bodyCompositionUtils.calc_lbmi(weight, height, age, impedance, sex);
  const userName = getFirstName(patient);
  const isMale = sex === 1;
  
  let status, remedy, comment;
  
  if (isMale) {
    if (lbmi >= 18 && lbmi <= 20) {
      status = "Excellent LBMI";
      remedy = "Maintain routine";
      comment = `${userName}, superior lean body mass! ${isMale ? 'Boss' : 'Queen'} level quality.`;
    } else if (lbmi >= 16 && lbmi < 18) {
      status = "Good LBMI";
      remedy = "Protein + strength training";
      comment = `${userName}, solid lean mass. Build more muscle!`;
    } else if (lbmi < 16) {
      status = "Low LBMI";
      remedy = "Gym + high protein diet";
      comment = `${userName}, lean mass is low. Start strength training immediately.`;
    } else {
      status = "Very High LBMI";
      remedy = "Continue training";
      comment = `${userName}, exceptional muscle quality! Athlete level!`;
    }
  } else {
    if (lbmi >= 15 && lbmi <= 17) {
      status = "Excellent LBMI";
      remedy = "Maintain routine";
      comment = `${userName}, superior lean body mass! Quality physique.`;
    } else if (lbmi >= 13 && lbmi < 15) {
      status = "Good LBMI";
      remedy = "Protein + strength training";
      comment = `${userName}, solid lean mass. Build more muscle!`;
    } else if (lbmi < 13) {
      status = "Low LBMI";
      remedy = "Gym + high protein diet";
      comment = `${userName}, lean mass is low. Start strength training.`;
    } else {
      status = "Very High LBMI";
      remedy = "Continue training";
      comment = `${userName}, exceptional muscle quality! Athlete level!`;
    }
  }
  
  return { status, value: lbmi, remedy, comment };
}

// Structural Mass % Assessment (Scan 5+)
function assessStructuralMass(vitals, patient, scanCount) {
  if (scanCount < 5) return { status: null, value: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, value: null, remedy: null, comment: null };
  
  const boneMass = bodyCompositionUtils.calc_bone_mass(weight, height, sex, age, impedance);
  const bonePercent = bodyCompositionUtils.calc_bone_percent(weight, boneMass);
  const musclePercent = bodyCompositionUtils.calc_muscle_percent(weight, height, sex, age, impedance);
  const structuralMass = bodyCompositionUtils.calc_structural_mass_percent(bonePercent, musclePercent);
  const userName = getFirstName(patient);
  
  let status, remedy, comment;
  
  if (structuralMass >= 55 && structuralMass <= 65) {
    status = "Strong Framework";
    remedy = "Dal + roti + exercise";
    comment = `${userName}, excellent body structure! Bone + muscle balanced perfectly.`;
  } else if (structuralMass >= 50 && structuralMass < 55) {
    status = "Good Framework";
    remedy = "Protein + calcium foods";
    comment = `${userName}, solid structure. Build more mass.`;
  } else if (structuralMass < 50) {
    status = "Weak Framework";
    remedy = "Paneer + milk + gym";
    comment = `${userName}, structural mass is low. Focus on building bone and muscle.`;
  } else {
    status = "Very Strong";
    remedy = "Maintain current plan";
    comment = `${userName}, exceptional body framework! Keep going.`;
  }
  
  return { status, value: structuralMass, remedy, comment };
}

// Subcutaneous Fat % Assessment (Scan 5+)
function assessSubcutaneousFat(vitals, patient, scanCount) {
  if (scanCount < 5) return { status: null, value: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, value: null, remedy: null, comment: null };
  
  const fatPercent = bodyCompositionUtils.calc_fat_percent(weight, height, sex, age, impedance);
  const subcutFatPercent = bodyCompositionUtils.calc_subcutaneous_fat_percent(fatPercent, sex);
  const userName = getFirstName(patient);
  
  // Subcutaneous should be 80-90% of total fat
  const ratio = (subcutFatPercent / fatPercent) * 100;
  
  let status, remedy, comment;
  
  if (ratio >= 80 && ratio <= 90) {
    status = "Healthy Fat Distribution";
    remedy = "Continue current diet";
    comment = `${userName}, fat distribution is perfect! No visceral fat risk.`;
  } else if (ratio >= 75 && ratio < 80) {
    status = "Good Distribution";
    remedy = "Walk 30min daily";
    comment = `${userName}, good fat storage. Keep active!`;
  } else if (ratio < 75) {
    status = "High Visceral Fat Risk";
    remedy = "Methi water + avoid sugar";
    comment = `${userName}, visceral fat increasing. Reduce belly fat urgently.`;
  } else {
    status = "Optimal";
    remedy = "Maintain lifestyle";
    comment = `${userName}, excellent fat storage pattern!`;
  }
  
  return { status, value: subcutFatPercent, remedy, comment };
}

export default function Report3() {
  const { data } = useHealth();
  const { patient, vitals } = data;
  const navigate = useNavigate();
  const [showHeightInfo, setShowHeightInfo] = useState(false);

  const userName = getFirstName(patient);
  const scanCount = data.history?.length || 1;
  const isBaselineUnlocked = scanCount >= 2;
  const isFullUnlocked = scanCount >= 3;
  const canCelebrate = scanCount >= 4;

  const confidenceStage =
    scanCount < 3 ? "capture" :
    scanCount === 3 ? "appears" :
    scanCount === 4 ? "consistently" :
    scanCount === 5 ? "pattern" :
    scanCount === 6 ? "likely" : "confirmed";

  const metrics = useMemo(() => {
    if (!vitals?.weight || !vitals?.height || !vitals?.impedance || !patient?.age || !patient?.gender) return null;
    
    const sex = patient.gender.toLowerCase() === "male" ? 1 : 0;
    const bmi = bodyCompositionUtils.calc_bmi(vitals.weight, vitals.height);
    const bmr = bodyCompositionUtils.calc_bmr(vitals.weight, vitals.height, sex, patient.age);
    const metabolicAge = bodyCompositionUtils.calc_metabolic_age(bmr, patient.age, sex);
    
    const bodyFatPct = bodyCompositionUtils.calc_fat_percent(vitals.weight, vitals.height, sex, patient.age, vitals.impedance);
    const musclePct = bodyCompositionUtils.calc_skeletal_muscle_percent(
      bodyCompositionUtils.calc_muscle_percent(vitals.weight, vitals.height, sex, patient.age, vitals.impedance)
    );
    const visceralFat = bodyCompositionUtils.calc_visceral_fat_level(vitals.weight, vitals.height, sex, patient.age, vitals.impedance);
    const waterPct = bodyCompositionUtils.calc_water_percent(vitals.weight, vitals.height, sex, patient.age, vitals.impedance);
    
    return {
      bmi: Number(bmi.toFixed(1)),
      bmr: Math.round(bmr),
      biologicalAge: Math.round(metabolicAge),
      bodyFatPct: Number(bodyFatPct.toFixed(1)),
      musclePct: Number(musclePct.toFixed(1)),
      visceralFat: Number(visceralFat.toFixed(1)),
      waterPct: Number(waterPct.toFixed(1)),
    };
  }, [vitals, patient]);

  // NEW: Tissue Composition Metrics (scan-wise unlocking)
  const tissueMetrics = useMemo(() => {
    const boneMassData = assessBoneMass(vitals, patient, scanCount);
    const proteinData = assessProtein(vitals, patient, scanCount);
    const lbmiData = assessLBMI(vitals, patient, scanCount);
    const structuralData = assessStructuralMass(vitals, patient, scanCount);
    const subcutFatData = assessSubcutaneousFat(vitals, patient, scanCount);
    
    return {
      boneMassData,
      proteinData,
      lbmiData,
      structuralData,
      subcutFatData
    };
  }, [vitals, patient, scanCount]);

  // Extract for JSX access
  const { boneMassData, proteinData, lbmiData, structuralData, subcutFatData } = tissueMetrics;

  const biologicalAge = metrics?.biologicalAge;
  const ageDiff = biologicalAge ? patient.age - biologicalAge : null;
  const isMale = patient?.gender?.toLowerCase() === "male";

  const getMuscleStatus = (musclePct) => {
    if (isMale) {
      if (musclePct < 30) return { status: "Low", comment: "Your muscle reserves are currently on the lower side, which can affect strength and metabolic stability." };
      if (musclePct < 33) return { status: "Below Average", comment: "Your muscle levels are slightly below the typical healthy range, but respond well to resistance activity." };
      if (musclePct < 39) return { status: "Healthy", comment: "Your muscle composition is within a healthy range, supporting posture, strength, and metabolic balance." };
      if (musclePct < 43) return { status: "Strong", comment: "Your muscle composition is stronger than average and supports efficient movement and recovery." };
      return { status: "Exceptional", comment: "Your muscle structure is highly developed for your age and supports long-term metabolic health." };
    } else {
      if (musclePct < 22) return { status: "Low", comment: "Your muscle reserves are currently on the lower side, which can affect strength and metabolic stability." };
      if (musclePct < 24) return { status: "Below Average", comment: "Your muscle levels are slightly below the typical healthy range, but respond well to resistance activity." };
      if (musclePct < 30) return { status: "Healthy", comment: "Your muscle composition is within a healthy range, supporting posture, strength, and metabolic balance." };
      if (musclePct < 34) return { status: "Strong", comment: "Your muscle composition is stronger than average and supports efficient movement and recovery." };
      return { status: "Exceptional", comment: "Your muscle structure is highly developed for your age and supports long-term metabolic health." };
    }
  };

  const getBodyFatStatus = (bodyFatPct) => {
    if (isMale) {
      if (bodyFatPct < 8) return { status: "Very Low", comment: "Very low fat reserves may impact hormonal balance and recovery." };
      if (bodyFatPct < 12) return { status: "Lean", comment: "Your fat levels are lean and support athletic efficiency." };
      if (bodyFatPct < 18) return { status: "Healthy", comment: "Your fat composition is balanced and supports hormonal and metabolic health." };
      if (bodyFatPct < 24) return { status: "Elevated", comment: "Your fat storage is slightly above the ideal range and may benefit from gradual lifestyle adjustments." };
      return { status: "High", comment: "Higher fat storage may place additional metabolic demand on your body." };
    } else {
      if (bodyFatPct < 18) return { status: "Very Low", comment: "Very low fat reserves may impact hormonal balance and recovery." };
      if (bodyFatPct < 22) return { status: "Lean", comment: "Your fat levels are lean and support athletic efficiency." };
      if (bodyFatPct < 28) return { status: "Healthy", comment: "Your fat composition is balanced and supports hormonal and metabolic health." };
      if (bodyFatPct < 34) return { status: "Elevated", comment: "Your fat storage is slightly above the ideal range and may benefit from gradual lifestyle adjustments." };
      return { status: "High", comment: "Higher fat storage may place additional metabolic demand on your body." };
    }
  };

  const getVisceralFatStatus = (visceralFat) => {
    if (visceralFat <= 9) return { status: "Normal", comment: "Visceral fat levels are within a healthy range, reducing strain on internal organs." };
    if (visceralFat <= 14) return { status: "Elevated", comment: "Visceral fat is slightly elevated and may respond well to regular movement and sleep balance." };
    return { status: "High", comment: "Higher visceral fat levels can increase metabolic stress over time." };
  };

  const getWaterStatus = (waterPct) => {
    if (waterPct < 45) return { status: "Low", comment: "Lower body water may influence energy levels and measurement variability." };
    if (waterPct < 50) return { status: "Below Optimal", comment: "Hydration appears slightly below optimal but can fluctuate daily." };
    if (waterPct <= 65) return { status: "Healthy", comment: "Your hydration level supports circulation and metabolic efficiency." };
    return { status: "High", comment: "Higher water retention may reflect recent intake or recovery." };
  };

  const getBMIStatus = (bmi) => {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Healthy";
    if (bmi < 30) return "Overweight";
    return "High";
  };

  const getBMRStatus = (bmr) => {
    if (bmr < 1400) return "Low";
    if (bmr < 1800) return "Average";
    return "High";
  };

  const getAgeDiffComment = (ageDiff) => {
    if (ageDiff >= 6) return "Your body is functioning significantly younger than your age.";
    if (ageDiff >= 3) return "Your body is functioning younger than average.";
    if (ageDiff >= 0) return "Your body aligns closely with your age.";
    if (ageDiff >= -3) return "Your body shows mild metabolic strain.";
    return "Your body is under noticeable metabolic load.";
  };

  const prefixByStage = {
    appears: "Currently appears to be ",
    consistently: "Consistently falls within ",
    pattern: "Shows a stable pattern of ",
    likely: "Highly likely reflects ",
    confirmed: "Confirmed over repeated scans: "
  };

  const normalizedScores = useMemo(() => {
    if (!metrics) return null;
    // Normalized scores: how close each metric is to its ideal midpoint (0-100%)
    // Uses sex-specific ideal ranges so no single metric always dominates
    if (isMale) {
      return {
        muscle: clamp(((metrics.musclePct - 33) / (50 - 33)) * 100),   // M: 33-50% range
        fat: clamp(((24 - metrics.bodyFatPct) / (24 - 10)) * 100),     // M: lower is better, 10-24%
        water: clamp(((metrics.waterPct - 45) / (65 - 45)) * 100),     // M: 45-65% range
      };
    } else {
      return {
        muscle: clamp(((metrics.musclePct - 24) / (42 - 24)) * 100),   // F: 24-42% range
        fat: clamp(((32 - metrics.bodyFatPct) / (32 - 14)) * 100),     // F: lower is better, 14-32%
        water: clamp(((metrics.waterPct - 40) / (60 - 40)) * 100),     // F: 40-60% range
      };
    }
  }, [metrics, isMale]);

  const strongestArea = useMemo(() => {
    if (!normalizedScores || scanCount < 4) return null;
    const entries = Object.entries(normalizedScores)
      .filter(([, score]) => score >= 70)
      .sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return null;
    const mapping = { muscle: "Muscle Mass", fat: "Body Fat Balance", water: "Body Water" };
    return { name: mapping[entries[0][0]], percentile: 100 - Math.round(entries[0][1] * 0.7) };
  }, [normalizedScores, scanCount]);

  function celebrate() {
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  }

  const getNormalizedPosition = (key, value) => {
    switch (key) {
      case "musclePct":
        return clamp((value - (isMale ? 25 : 18)) / 25 * 100);
      case "bodyFatPct":
        return clamp((value - (isMale ? 5 : 15)) / 30 * 100);
      case "visceralFat":
        return clamp((value - 1) / 19 * 100);
      case "bmi":
        return clamp((value - 15) / 20 * 100);
      case "waterPct":
        return clamp((value - 40) / 30 * 100);
      case "bmr":
        return clamp((value - 1200) / 1000 * 100);
      default:
        return 0;
    }
  };

  const insights = useMemo(() => {
    if (!metrics) return [];
    const list = [];
    const muscleStatus = getMuscleStatus(metrics.musclePct);
    const fatStatus = getBodyFatStatus(metrics.bodyFatPct);
    const waterStatus = getWaterStatus(metrics.waterPct);
    
    if (scanCount >= 3) {
      if (muscleStatus.status === "Strong" || muscleStatus.status === "Exceptional") {
        list.push("Your muscle mass is a strong foundation for daily energy and strength.");
      }
      if (fatStatus.status === "Healthy" || fatStatus.status === "Lean") {
        list.push("Your lean composition supports metabolic efficiency.");
      }
      if (waterStatus.status === "Healthy") {
        list.push("Balanced hydration supports consistent metabolic readings.");
      }
    }
    
    if (scanCount >= 5) {
      if (metrics.visceralFat <= 9) {
        list.push("Your body composition pattern suggests good recovery capacity.");
      }
    }
    
    if (scanCount >= 7) {
      list.push("Your metabolic stability is now well-established across multiple scans.");
    }
    
    return list.length > 0 ? list : ["Your first scan provides a solid foundation—see this profile evolve with new data and patterns in future scans."];
  }, [metrics, scanCount]);

  const getNextUnlock = () => {
    if (scanCount < 3) return "Full baseline metrics unlock after scan 3";
    if (scanCount < 4) return "Win moment celebration unlocks next scan";
    if (scanCount < 5) return "Delta indicators (↑ ↓) in your next scan";
    if (scanCount < 7) return "Confirmed language and doctor-ready insights after scan 7";
    return "All features unlocked";
  };

  if (!isBaselineUnlocked) {
    return (
      <div style={{ height: "100vh", background: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 32px", overflowY: "auto", WebkitOverflowScrolling: "touch" }} className="scrollable-container">
        <Logo size="text-4xl" />
        <div style={{ textAlign: "center", fontSize: "24px", color: "#666666", margin: "80px 0", fontStyle: "italic", maxWidth: "600px" }}>
          Body Composition Profile unlocks after your 2nd scan. Keep scanning to reveal insights about your muscle mass, body fat, and metabolic age.
        </div>
        <button
          onClick={() => navigate("/report-4")}
          style={{
            background: "#F28C38",
            color: "white",
            fontWeight: "600",
            fontSize: "18px",
            padding: "14px 36px",
            borderRadius: "9999px",
            border: "none",
            cursor: "pointer"
          }}
        >
          Continue to Report 4 →
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", background: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 32px", overflowY: "auto", WebkitOverflowScrolling: "touch" }} className="scrollable-container">
      <div style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ marginBottom: "10px" }}>
            <Logo size="text-4xl" />
          </div>
          <h1 style={{ fontSize: "44px", fontWeight: "bold", color: "#111111", marginBottom: "10px" }}>
            Your Body Composition Profile
          </h1>
          <p style={{ fontSize: "16px", color: "#555555", marginBottom: "16px" }}>
            Based on scan {scanCount} • Compared to healthy ranges
          </p>
          {scanCount >= 3 && (
            <div style={{ fontSize: "14px", color: "#9ca3af", fontStyle: "italic" }}>
              {scanCount === 3 && "Patterns beginning to emerge"}
              {scanCount === 4 && "Stability tracking active"}
              {scanCount === 5 && "Bio age delta unlocked"}
              {scanCount === 6 && "Trend consistency confirmed"}
              {scanCount >= 7 && "Full profile established"}
            </div>
          )}
        </div>

        {/* HEIGHT CARD - shown from first scan */}
        {vitals?.height > 0 && (() => {
          const htFt = cmToFtIn(vitals.height);
          return htFt ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                background: "#f0f9ff",
                border: "1.5px solid #bae6fd",
                borderRadius: "16px",
                padding: "18px 24px",
                marginBottom: "32px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: "28px" }}>📏</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: "#0369a1", marginBottom: "4px" }}>
                  Your Height
                </div>
                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#0c4a6e" }}>
                  {htFt.display} &nbsp;<span style={{ fontSize: "15px", color: "#64748b", fontWeight: "normal" }}>({vitals.height} cm)</span>
                </div>
              </div>
              <button
                onClick={() => setShowHeightInfo(v => !v)}
                style={{
                  background: "none",
                  border: "1.5px solid #0ea5e9",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#0ea5e9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
                aria-label="Height ageing info"
              >
                ℹ
              </button>
              {showHeightInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    background: "#e0f2fe",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    fontSize: "14px",
                    color: "#0c4a6e",
                    lineHeight: "1.6",
                  }}
                >
                  <strong>Did you know?</strong> Height can decrease slightly as we age — typically 1–2 cm per decade after age 40 — due to gradual compression of spinal discs, changes in posture, and loss of bone density. This is a normal part of ageing and is not a cause for concern. Staying active, eating calcium-rich foods, and maintaining a healthy posture can slow this change.
                  <button
                    onClick={() => setShowHeightInfo(false)}
                    style={{ marginLeft: "12px", background: "#0ea5e9", color: "white", border: "none", borderRadius: "6px", padding: "3px 10px", cursor: "pointer", fontSize: "13px" }}
                  >
                    Close
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : null;
        })()}
        {canCelebrate && strongestArea && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            style={{
              background: "#fff9e6",
              border: "2px solid #ffe8a3",
              borderRadius: "16px",
              padding: "28px",
              marginBottom: "48px",
              boxShadow: "0 4px 20px rgba(251, 191, 36, 0.15)",
              textAlign: "center"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "20px" }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  background: "#fff3cd",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px"
                }}>
                  🏆
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "13px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#d97706", marginBottom: "8px" }}>
                    WIN MOMENT
                  </div>
                  <div style={{ fontSize: "26px", fontWeight: "bold", color: "#111111", marginBottom: "8px" }}>
                    Your strongest area today: {strongestArea.name}
                  </div>
                  <div style={{ fontSize: "16px", color: "#555555" }}>
                    Top {strongestArea.percentile}% for your age group
                  </div>
                </div>
              </div>
              <button
                onClick={celebrate}
                style={{
                  background: "#f59e0b",
                  color: "white",
                  padding: "10px 24px",
                  borderRadius: "9999px",
                  fontWeight: "bold",
                  fontSize: "16px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "transform 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                🎉 Celebrating Strength
              </button>
            </div>
          </motion.div>
        )}

        {/* BIOLOGICAL AGE */}
        {biologicalAge && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              background: "#fdf4ff",
              border: "2px solid #e9d5ff",
              borderRadius: "16px",
              padding: "32px",
              marginBottom: "36px",
              textAlign: "center"
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#9333ea", marginBottom: "12px" }}>
              Biological Age {scanCount >= 5 ? "• Delta Confirmed" : ""}
            </div>
            <div style={{ fontSize: "56px", fontWeight: "bold", color: "#111111", marginBottom: "8px" }}>
              {biologicalAge} years
            </div>
            {ageDiff !== null && (
              <div style={{
                display: "inline-block",
                background: ageDiff >= 0 ? "#dcfce7" : "#fee2e2",
                color: ageDiff >= 0 ? "#16a34a" : "#dc2626",
                padding: "8px 20px",
                borderRadius: "9999px",
                fontWeight: "600",
                fontSize: "15px",
                marginBottom: "12px"
              }}>
                {ageDiff > 0 ? `${ageDiff} years younger` : ageDiff < 0 ? `${Math.abs(ageDiff)} years older` : "On track"}
              </div>
            )}
            <div style={{ fontSize: "15px", color: "#666666", marginTop: "12px" }}>
              {getAgeDiffComment(ageDiff)}
            </div>
          </motion.div>
        )}

        {/* PRIMARY METRICS */}
        {metrics && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "36px" }}>
            
            {/* Muscle Mass */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                background: "#ffffff",
                border: "2px solid #e5e7eb",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  💪
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111" }}>Muscle Mass</div>
                  <div style={{ fontSize: "13px", color: "#9ca3af" }}>Skeletal Muscle %</div>
                </div>
              </div>
              <div style={{ fontSize: "42px", fontWeight: "bold", color: "#111111", marginBottom: "8px" }}>
                {metrics.musclePct}%
              </div>
              <div style={{
                display: "inline-block",
                background: getMuscleStatus(metrics.musclePct).status === "Low" || getMuscleStatus(metrics.musclePct).status === "Below Average" ? "#fef3c7" :
                  getMuscleStatus(metrics.musclePct).status === "Healthy" ? "#dbeafe" :
                  getMuscleStatus(metrics.musclePct).status === "Strong" ? "#d1fae5" : "#e0e7ff",
                color: getMuscleStatus(metrics.musclePct).status === "Low" || getMuscleStatus(metrics.musclePct).status === "Below Average" ? "#92400e" :
                  getMuscleStatus(metrics.musclePct).status === "Healthy" ? "#1e40af" :
                  getMuscleStatus(metrics.musclePct).status === "Strong" ? "#065f46" : "#4338ca",
                padding: "6px 14px",
                borderRadius: "9999px",
                fontWeight: "600",
                fontSize: "13px",
                marginBottom: "16px"
              }}>
                {confidenceStage === "appears" && "Appears: "}
                {confidenceStage === "consistently" && "Consistently: "}
                {confidenceStage === "pattern" && "Pattern: "}
                {confidenceStage === "likely" && "Likely: "}
                {confidenceStage === "confirmed" && "Confirmed: "}
                {getMuscleStatus(metrics.musclePct).status}
              </div>
              <div style={{
                background: "#f3f4f6",
                height: "10px",
                borderRadius: "9999px",
                position: "relative",
                marginBottom: "12px"
              }}>
                <div style={{
                  position: "absolute",
                  top: "-8px",
                  left: `${getNormalizedPosition("musclePct", metrics.musclePct)}%`,
                  width: "24px",
                  height: "24px",
                  background: "#F28C38",
                  border: "4px solid white",
                  borderRadius: "50%",
                  boxShadow: "0 2px 8px rgba(242, 140, 56, 0.4)",
                  transform: "translateX(-50%)"
                }}></div>
                <div style={{
                  background: "linear-gradient(to right, #f87171, #fbbf24, #34d399)",
                  height: "100%",
                  borderRadius: "9999px",
                  width: "100%"
                }}></div>
              </div>
              <div style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.6" }}>
                {getMuscleStatus(metrics.musclePct).comment}
              </div>
            </motion.div>

            {/* Body Fat */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{
                background: "#ffffff",
                border: "2px solid #e5e7eb",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  background: "linear-gradient(135deg, #ec4899, #f97316)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  🔥
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111" }}>Body Fat</div>
                  <div style={{ fontSize: "13px", color: "#9ca3af" }}>Total Body Fat %</div>
                </div>
              </div>
              <div style={{ fontSize: "42px", fontWeight: "bold", color: "#111111", marginBottom: "8px" }}>
                {metrics.bodyFatPct}%
              </div>
              <div style={{
                display: "inline-block",
                background: getBodyFatStatus(metrics.bodyFatPct).status === "Very Low" ? "#fef3c7" :
                  getBodyFatStatus(metrics.bodyFatPct).status === "Lean" || getBodyFatStatus(metrics.bodyFatPct).status === "Healthy" ? "#d1fae5" :
                  getBodyFatStatus(metrics.bodyFatPct).status === "Elevated" ? "#fed7aa" : "#fecaca",
                color: getBodyFatStatus(metrics.bodyFatPct).status === "Very Low" ? "#92400e" :
                  getBodyFatStatus(metrics.bodyFatPct).status === "Lean" || getBodyFatStatus(metrics.bodyFatPct).status === "Healthy" ? "#065f46" :
                  getBodyFatStatus(metrics.bodyFatPct).status === "Elevated" ? "#9a3412" : "#991b1b",
                padding: "6px 14px",
                borderRadius: "9999px",
                fontWeight: "600",
                fontSize: "13px",
                marginBottom: "16px"
              }}>
                {confidenceStage === "appears" && "Appears: "}
                {confidenceStage === "consistently" && "Consistently: "}
                {confidenceStage === "pattern" && "Pattern: "}
                {confidenceStage === "likely" && "Likely: "}
                {confidenceStage === "confirmed" && "Confirmed: "}
                {getBodyFatStatus(metrics.bodyFatPct).status}
              </div>
              <div style={{
                background: "#f3f4f6",
                height: "10px",
                borderRadius: "9999px",
                position: "relative",
                marginBottom: "12px"
              }}>
                <div style={{
                  position: "absolute",
                  top: "-8px",
                  left: `${getNormalizedPosition("bodyFatPct", metrics.bodyFatPct)}%`,
                  width: "24px",
                  height: "24px",
                  background: "#F28C38",
                  border: "4px solid white",
                  borderRadius: "50%",
                  boxShadow: "0 2px 8px rgba(242, 140, 56, 0.4)",
                  transform: "translateX(-50%)"
                }}></div>
                <div style={{
                  background: "linear-gradient(to right, #34d399, #fbbf24, #f87171)",
                  height: "100%",
                  borderRadius: "9999px",
                  width: "100%"
                }}></div>
              </div>
              <div style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.6" }}>
                {getBodyFatStatus(metrics.bodyFatPct).comment}
              </div>
            </motion.div>

            {/* Visceral Fat */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                background: "#ffffff",
                border: "2px solid #e5e7eb",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  🫀
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111" }}>Visceral Fat</div>
                  <div style={{ fontSize: "13px", color: "#9ca3af" }}>Internal Fat Level</div>
                </div>
              </div>
              <div style={{ fontSize: "42px", fontWeight: "bold", color: "#111111", marginBottom: "8px" }}>
                {metrics.visceralFat}
              </div>
              <div style={{
                display: "inline-block",
                background: getVisceralFatStatus(metrics.visceralFat).status === "Normal" ? "#d1fae5" :
                  getVisceralFatStatus(metrics.visceralFat).status === "Elevated" ? "#fed7aa" : "#fecaca",
                color: getVisceralFatStatus(metrics.visceralFat).status === "Normal" ? "#065f46" :
                  getVisceralFatStatus(metrics.visceralFat).status === "Elevated" ? "#9a3412" : "#991b1b",
                padding: "6px 14px",
                borderRadius: "9999px",
                fontWeight: "600",
                fontSize: "13px",
                marginBottom: "16px"
              }}>
                {confidenceStage === "appears" && "Appears: "}
                {confidenceStage === "consistently" && "Consistently: "}
                {confidenceStage === "pattern" && "Pattern: "}
                {confidenceStage === "likely" && "Likely: "}
                {confidenceStage === "confirmed" && "Confirmed: "}
                {getVisceralFatStatus(metrics.visceralFat).status}
              </div>
              <div style={{
                background: "#f3f4f6",
                height: "10px",
                borderRadius: "9999px",
                position: "relative",
                marginBottom: "12px"
              }}>
                <div style={{
                  position: "absolute",
                  top: "-8px",
                  left: `${getNormalizedPosition("visceralFat", metrics.visceralFat)}%`,
                  width: "24px",
                  height: "24px",
                  background: "#F28C38",
                  border: "4px solid white",
                  borderRadius: "50%",
                  boxShadow: "0 2px 8px rgba(242, 140, 56, 0.4)",
                  transform: "translateX(-50%)"
                }}></div>
                <div style={{
                  background: "linear-gradient(to right, #34d399, #fbbf24, #f87171)",
                  height: "100%",
                  borderRadius: "9999px",
                  width: "100%"
                }}></div>
              </div>
              <div style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.6" }}>
                {getVisceralFatStatus(metrics.visceralFat).comment}
              </div>
            </motion.div>
          </div>
        )}

        {/* SUPPORT METRICS */}
        {metrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            style={{
              background: "#fafafa",
              border: "2px solid #e5e7eb",
              borderRadius: "16px",
              padding: "28px",
              marginBottom: "36px"
            }}
          >
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111", marginBottom: "20px" }}>
              Supporting Metrics
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              <div>
                <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>Body Water</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111", marginBottom: "4px" }}>
                  {metrics.waterPct}%
                </div>
                <div style={{
                  display: "inline-block",
                  background: "#dbeafe",
                  color: "#1e40af",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  {getWaterStatus(metrics.waterPct).status}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>BMI</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111", marginBottom: "4px" }}>
                  {metrics.bmi}
                </div>
                <div style={{
                  display: "inline-block",
                  background: getBMIStatus(metrics.bmi) === "Healthy" ? "#d1fae5" : "#fed7aa",
                  color: getBMIStatus(metrics.bmi) === "Healthy" ? "#065f46" : "#9a3412",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  {getBMIStatus(metrics.bmi)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>BMR (Basal Metabolic Rate)</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111", marginBottom: "4px" }}>
                  {metrics.bmr} cal/day
                </div>
                <div style={{
                  display: "inline-block",
                  background: "#e0e7ff",
                  color: "#4338ca",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  {getBMRStatus(metrics.bmr)}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========== NEW: TISSUE COMPOSITION SECTION ========== */}
        {(scanCount >= 2 || boneMassData.status || proteinData.status || lbmiData.status || structuralData.status || subcutFatData.status) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.37 }}
            style={{
              background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)",
              border: "2px solid #fed7aa",
              borderRadius: "16px",
              padding: "32px",
              marginBottom: "36px"
            }}
          >
            <div style={{ 
              fontSize: "20px", 
              fontWeight: "bold", 
              color: "#92400e", 
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              🏗️ Tissue Composition Analysis
            </div>
            <div style={{ fontSize: "14px", color: "#78350f", marginBottom: "24px" }}>
              {scanCount < 2 && "Complete 2 scans to unlock bone mass analysis"}
              {scanCount === 2 && "Bone mass unlocked! Continue scanning for more insights"}
              {scanCount === 3 && "Protein composition revealed! Keep going"}
              {scanCount === 4 && "Lean body mass quality unlocked!"}
              {scanCount >= 5 && "Full tissue analysis unlocked! All structural metrics visible"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
              
              {/* Bone Mass (Scan 2+) */}
              {scanCount >= 2 && boneMassData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    background: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
                    border: "2px solid #d8b4fe",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(167, 139, 250, 0.15)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      🦴
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#581c87" }}>Bone Mass</div>
                      <div style={{ fontSize: "12px", color: "#7e22ce" }}>Skeletal Strength</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "36px", fontWeight: "bold", color: "#581c87", marginBottom: "8px" }}>
                    {boneMassData.value?.toFixed(2)} kg
                  </div>
                  
                  <div style={{
                    display: "inline-block",
                    background: boneMassData.status.includes("Low") ? "#fef3c7" : 
                                boneMassData.status.includes("Normal") ? "#dbeafe" : "#d1fae5",
                    color: boneMassData.status.includes("Low") ? "#92400e" :
                           boneMassData.status.includes("Normal") ? "#1e40af" : "#065f46",
                    padding: "6px 12px",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "13px",
                    marginBottom: "14px"
                  }}>
                    {boneMassData.status}
                  </div>
                  
                  <div style={{ fontSize: "14px", color: "#6b21a8", marginBottom: "14px", lineHeight: "1.5" }}>
                    {boneMassData.comment}
                  </div>
                  
                  {boneMassData.remedy && (
                    <div style={{
                      background: "#fef3c7",
                      border: "1px solid #fbbf24",
                      borderRadius: "10px",
                      padding: "12px",
                      marginTop: "12px"
                    }}>
                      <div style={{ fontSize: "12px", fontWeight: "600", color: "#92400e", marginBottom: "4px" }}>
                        🌿 Indian Remedy
                      </div>
                      <div style={{ fontSize: "13px", color: "#78350f" }}>
                        {boneMassData.remedy}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Protein Mass + Percent (Scan 3+) */}
              {scanCount >= 3 && proteinData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  style={{
                    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                    border: "2px solid #fbbf24",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(251, 191, 36, 0.15)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      🥚
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#78350f" }}>Protein Mass</div>
                      <div style={{ fontSize: "12px", color: "#92400e" }}>Building Blocks</div>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: "16px", marginBottom: "8px" }}>
                    <div>
                      <div style={{ fontSize: "28px", fontWeight: "bold", color: "#78350f" }}>
                        {proteinData.mass?.toFixed(2)} kg
                      </div>
                      <div style={{ fontSize: "12px", color: "#92400e" }}>Mass</div>
                    </div>
                    <div style={{ borderLeft: "2px solid #fbbf24", paddingLeft: "16px" }}>
                      <div style={{ fontSize: "28px", fontWeight: "bold", color: "#78350f" }}>
                        {proteinData.percent?.toFixed(1)}%
                      </div>
                      <div style={{ fontSize: "12px", color: "#92400e" }}>Percent</div>
                    </div>
                  </div>
                  
                  <div style={{
                    display: "inline-block",
                    background: proteinData.status.includes("Low") ? "#fee2e2" : 
                                proteinData.status.includes("Good") ? "#dbeafe" : "#d1fae5",
                    color: proteinData.status.includes("Low") ? "#991b1b" :
                           proteinData.status.includes("Good") ? "#1e40af" : "#065f46",
                    padding: "6px 12px",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "13px",
                    marginBottom: "14px"
                  }}>
                    {proteinData.status}
                  </div>
                  
                  <div style={{ fontSize: "14px", color: "#78350f", marginBottom: "14px", lineHeight: "1.5" }}>
                    {proteinData.comment}
                  </div>
                  
                  {proteinData.remedy && (
                    <div style={{
                      background: "#fef3c7",
                      border: "1px solid #fbbf24",
                      borderRadius: "10px",
                      padding: "12px",
                      marginTop: "12px"
                    }}>
                      <div style={{ fontSize: "12px", fontWeight: "600", color: "#92400e", marginBottom: "4px" }}>
                        🌿 Indian Remedy
                      </div>
                      <div style={{ fontSize: "13px", color: "#78350f" }}>
                        {proteinData.remedy}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* LBMI (Scan 4+) */}
              {scanCount >= 4 && lbmiData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                    border: "2px solid #60a5fa",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(96, 165, 250, 0.15)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      💎
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1e3a8a" }}>LBMI</div>
                      <div style={{ fontSize: "12px", color: "#1e40af" }}>Lean Body Mass Quality</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "36px", fontWeight: "bold", color: "#1e3a8a", marginBottom: "8px" }}>
                    {lbmiData.value?.toFixed(1)}
                  </div>
                  
                  <div style={{
                    display: "inline-block",
                    background: lbmiData.status.includes("Low") ? "#fef3c7" : 
                                lbmiData.status.includes("Good") ? "#dbeafe" : "#d1fae5",
                    color: lbmiData.status.includes("Low") ? "#92400e" :
                           lbmiData.status.includes("Good") ? "#1e40af" : "#065f46",
                    padding: "6px 12px",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "13px",
                    marginBottom: "14px"
                  }}>
                    {lbmiData.status}
                  </div>
                  
                  <div style={{ fontSize: "14px", color: "#1e40af", marginBottom: "14px", lineHeight: "1.5" }}>
                    {lbmiData.comment}
                  </div>
                  
                  {lbmiData.remedy && (
                    <div style={{
                      background: "#fef3c7",
                      border: "1px solid #fbbf24",
                      borderRadius: "10px",
                      padding: "12px",
                      marginTop: "12px"
                    }}>
                      <div style={{ fontSize: "12px", fontWeight: "600", color: "#92400e", marginBottom: "4px" }}>
                        🌿 Indian Remedy
                      </div>
                      <div style={{ fontSize: "13px", color: "#78350f" }}>
                        {lbmiData.remedy}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Structural Mass % (Scan 5+) */}
              {scanCount >= 5 && structuralData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  style={{
                    background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                    border: "2px solid #34d399",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(52, 211, 153, 0.15)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      🏛️
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#064e3b" }}>Structural Mass</div>
                      <div style={{ fontSize: "12px", color: "#065f46" }}>Bone + Muscle Framework</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "36px", fontWeight: "bold", color: "#064e3b", marginBottom: "8px" }}>
                    {structuralData.value?.toFixed(1)}%
                  </div>
                  
                  <div style={{
                    display: "inline-block",
                    background: structuralData.status.includes("Weak") ? "#fef3c7" : 
                                structuralData.status.includes("Good") ? "#dbeafe" : "#d1fae5",
                    color: structuralData.status.includes("Weak") ? "#92400e" :
                           structuralData.status.includes("Good") ? "#1e40af" : "#065f46",
                    padding: "6px 12px",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "13px",
                    marginBottom: "14px"
                  }}>
                    {structuralData.status}
                  </div>
                  
                  <div style={{ fontSize: "14px", color: "#065f46", marginBottom: "14px", lineHeight: "1.5" }}>
                    {structuralData.comment}
                  </div>
                  
                  {structuralData.remedy && (
                    <div style={{
                      background: "#fef3c7",
                      border: "1px solid #fbbf24",
                      borderRadius: "10px",
                      padding: "12px",
                      marginTop: "12px"
                    }}>
                      <div style={{ fontSize: "12px", fontWeight: "600", color: "#92400e", marginBottom: "4px" }}>
                        🌿 Indian Remedy
                      </div>
                      <div style={{ fontSize: "13px", color: "#78350f" }}>
                        {structuralData.remedy}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Subcutaneous Fat % (Scan 5+) */}
              {scanCount >= 5 && subcutFatData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    background: "linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)",
                    border: "2px solid #f87171",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(248, 113, 113, 0.15)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #ef4444, #dc2626)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      📊
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#7f1d1d" }}>Subcutaneous Fat</div>
                      <div style={{ fontSize: "12px", color: "#991b1b" }}>Under-skin Fat Distribution</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "36px", fontWeight: "bold", color: "#7f1d1d", marginBottom: "8px" }}>
                    {subcutFatData.value?.toFixed(1)}%
                  </div>
                  
                  <div style={{
                    display: "inline-block",
                    background: subcutFatData.status.includes("Risk") ? "#fef3c7" : 
                                subcutFatData.status.includes("Good") ? "#dbeafe" : "#d1fae5",
                    color: subcutFatData.status.includes("Risk") ? "#92400e" :
                           subcutFatData.status.includes("Good") ? "#1e40af" : "#065f46",
                    padding: "6px 12px",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "13px",
                    marginBottom: "14px"
                  }}>
                    {subcutFatData.status}
                  </div>
                  
                  <div style={{ fontSize: "14px", color: "#991b1b", marginBottom: "14px", lineHeight: "1.5" }}>
                    {subcutFatData.comment}
                  </div>
                  
                  {subcutFatData.remedy && (
                    <div style={{
                      background: "#fef3c7",
                      border: "1px solid #fbbf24",
                      borderRadius: "10px",
                      padding: "12px",
                      marginTop: "12px"
                    }}>
                      <div style={{ fontSize: "12px", fontWeight: "600", color: "#92400e", marginBottom: "4px" }}>
                        🌿 Indian Remedy
                      </div>
                      <div style={{ fontSize: "13px", color: "#78350f" }}>
                        {subcutFatData.remedy}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Unlock Messages */}
              {scanCount < 2 && (
                <div style={{
                  background: "rgba(255,255,255,0.6)",
                  border: "2px dashed #d1d5db",
                  borderRadius: "14px",
                  padding: "32px",
                  textAlign: "center",
                  gridColumn: "1 / -1"
                }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔒</div>
                  <div style={{ fontSize: "16px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                    Tissue Composition Locked
                  </div>
                  <div style={{ fontSize: "14px", color: "#9ca3af" }}>
                    Complete {2 - scanCount} more scan{2 - scanCount > 1 ? 's' : ''} to unlock bone mass analysis
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* INSIGHTS */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              background: "#ffffff",
              border: "2px solid #e5e7eb",
              borderRadius: "16px",
              padding: "28px",
              marginBottom: "36px"
            }}
          >
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111", marginBottom: "16px" }}>
              💡 Key Insights
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#fef9f3",
                    border: "1px solid #fed7aa",
                    borderRadius: "10px",
                    padding: "14px 18px",
                    fontSize: "15px",
                    color: "#111111",
                    lineHeight: "1.6"
                  }}
                >
                  {insight}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* UNLOCK BADGE */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            textAlign: "center",
            background: "#eff6ff",
            border: "2px solid #93c5fd",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "40px",
            fontSize: "15px",
            color: "#1e40af",
            fontWeight: "600"
          }}
        >
          <div style={{ fontSize: "18px", marginBottom: "8px" }}>
            {scanCount === 1 && "🔒 Next Scan: Table view + baseline comparison"}
            {scanCount === 2 && "🔒 Next Scan: Graphs + radar chart unlock"}
            {scanCount === 3 && "🔒 Next Scan: Pie diagrams + win moment"}
            {scanCount === 4 && "🔒 Next Scan: Heatmap + bio age delta"}
            {scanCount === 5 && "🔒 Next Scan: Treemaps + consistency analysis"}
            {scanCount === 6 && "🔒 Next Scan: Full trajectories + stability confirmation"}
            {scanCount >= 7 && "🏆 All features unlocked - Profile complete!"}
          </div>
          <div style={{ fontSize: "13px", color: "#60a5fa", marginTop: "8px" }}>
            Scan {scanCount} of 7 completed
          </div>
        </motion.div>

        {/* Scan Progress Footer */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ fontSize: "15px", fontWeight: "600", color: "#6b7280", marginBottom: "16px" }}>
            {scanCount < 7 ? `${7 - scanCount} more scan${7 - scanCount > 1 ? 's' : ''} to unlock full analysis` : "✓ Complete metabolic profile established"}
          </div>
          <div style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center" }}>
            {[1, 2, 3, 4, 5, 6, 7].map(num => (
              <div
                key={num}
                style={{
                  width: num <= scanCount ? "40px" : "28px",
                  height: "12px",
                  background: num <= scanCount ? "#F28C38" : "#e5e7eb",
                  borderRadius: "9999px",
                  transition: "all 0.3s",
                  position: "relative"
                }}
              >
                {num === scanCount && (
                  <div style={{
                    position: "absolute",
                    top: "-6px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "18px"
                  }}>
                    ✨
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", color: "#9ca3af", marginTop: "12px", fontWeight: "700" }}>
            Clinically Validated Pipeline
          </div>
        </div>

        {/* Continue button at bottom */}
        <div style={{ textAlign: "center", marginTop: "48px", marginBottom: "32px" }}>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/report-4")}
            style={{
              background: "#111827",
              color: "white",
              fontWeight: "600",
              fontSize: "18px",
              padding: "18px 48px",
              borderRadius: "9999px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 10px 30px rgba(17, 24, 39, 0.2)",
              display: "inline-flex",
              alignItems: "center",
              gap: "12px"
            }}
          >
            Continue to Advanced Analysis →
          </motion.button>
        </div>
      </div>
    </div>
  );
}
