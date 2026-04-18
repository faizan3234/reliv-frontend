import { useEffect, useMemo, useRef, useState } from "react";
// ...existing code...
import { useNavigate } from "react-router-dom";
import { useHealth } from "../context/HealthContext";
import { motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import confetti from "canvas-confetti";
import Logo from "../components/Logo";
import EmailSendingAnimation from "../components/EmailSendingAnimation";
import VirtualKeyboard from "../components/VirtualKeyboard";
import * as bodyCompositionUtils from "../utils/bodyComposition";
import { sanitizeError } from "../utils/errorSanitizer";
import { useSpeech } from "../context/SpeechContext";
import ChallengePrompt from "../components/ChallengePrompt";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

// Helper: Extract first name
const getFirstName = (patient) => {
  if (patient?.name) return patient.name.split(' ')[0];
  if (patient?.email) return patient.email.split('@')[0].split('.')[0];
  return 'Champion';
};

// Helper: Vision Assessment
const getVisionAssessment = (line) => {
  const lineNum = Number(line);
  if (lineNum <= 2) return { rating: "🔴 Critical", glasses: "Required (Urgent)", status: "Refer", recommendation: "Immediate ophthalmologist visit" };
  if (lineNum <= 4) return { rating: "🔴 Weak", glasses: "Recommended", status: "Review", recommendation: "Prescription spectacles advised" };
  if (lineNum <= 6) return { rating: "🟠 Fair", glasses: "Suggested", status: "Monitor", recommendation: "Reading glasses (+0.75 to +1.25)" };
  if (lineNum <= 8) return { rating: "🟡 Moderate", glasses: "Optional", status: "Observe", recommendation: "Eye exercises + annual check" };
  if (lineNum <= 10) return { rating: "🟢 Good", glasses: "Not Required", status: "Healthy", recommendation: "Maintain eye hygiene" };
  if (lineNum <= 12) return { rating: "🟢 Strong", glasses: "Not Required", status: "Optimal", recommendation: "Continue healthy habits" };
  return { rating: "🔵 Elite", glasses: "Not Required", status: "Perfect", recommendation: "Peak visual performance" };
};

// ============================================================================
// NEW: INTEGRATION METRICS ASSESSMENTS (Scan-wise unlock)
// ============================================================================

// Fat-Free Weight Assessment (Scan 2+)
function assessFatFreeWeight(vitals, patient, scanCount) {
  if (scanCount < 2) return { status: null, value: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, value: null, remedy: null, comment: null };
  
  const fatPercent = bodyCompositionUtils.calc_fat_percent(weight, height, sex, age, impedance);
  const fatMass = bodyCompositionUtils.calc_fat_mass(weight, fatPercent);
  const fatFreeWeight = bodyCompositionUtils.calc_fat_free_weight(weight, fatMass);
  const userName = getFirstName(patient);
  const isMale = sex === 1;
  
  let status, remedy, comment;
  const fatFreePercent = (fatFreeWeight / weight) * 100;
  
  if (isMale) {
    if (fatFreePercent >= 85) {
      status = "Lean Machine";
      remedy = "Maintain diet + training";
      comment = `${userName}, ${fatFreeWeight.toFixed(1)}kg of pure power! Elite composition.`;
    } else if (fatFreePercent >= 75) {
      status = "Strong Build";
      remedy = "High protein diet";
      comment = `${userName}, ${fatFreeWeight.toFixed(1)}kg lean mass. Solid body!`;
    } else if (fatFreePercent >= 65) {
      status = "Average Build";
      remedy = "Gym + protein intake";
      comment = `${userName}, ${fatFreeWeight.toFixed(1)}kg lean. Build more muscle!`;
    } else {
      status = "High Body Fat";
      remedy = "Diet control + cardio";
      comment = `${userName}, only ${fatFreeWeight.toFixed(1)}kg lean. Reduce fat urgently!`;
    }
  } else {
    if (fatFreePercent >= 75) {
      status = "Lean Machine";
      remedy = "Maintain diet + training";
      comment = `${userName}, ${fatFreeWeight.toFixed(1)}kg of pure power! Elite composition.`;
    } else if (fatFreePercent >= 65) {
      status = "Strong Build";
      remedy = "High protein diet";
      comment = `${userName}, ${fatFreeWeight.toFixed(1)}kg lean mass. Solid body!`;
    } else if (fatFreePercent >= 55) {
      status = "Average Build";
      remedy = "Gym + protein intake";
      comment = `${userName}, ${fatFreeWeight.toFixed(1)}kg lean. Build more muscle!`;
    } else {
      status = "High Body Fat";
      remedy = "Diet control + cardio";
      comment = `${userName}, only ${fatFreeWeight.toFixed(1)}kg lean. Reduce fat urgently!`;
    }
  }
  
  return { status, value: fatFreeWeight, remedy, comment };
}

// Body Surface Area Assessment (Scan 2+)
function assessBSA(vitals, patient, scanCount) {
  if (scanCount < 2) return { status: null, value: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  
  if (!weight || !height) return { status: null, value: null, remedy: null, comment: null };
  
  const bsa = bodyCompositionUtils.calc_bsa(weight, height);
  const userName = getFirstName(patient);
  
  let status, remedy, comment;
  
  if (bsa >= 1.9 && bsa <= 2.2) {
    status = "Optimal Surface Area";
    remedy = "Maintain body size";
    comment = `${userName}, ${bsa.toFixed(2)}m² is perfect for efficient heat regulation!`;
  } else if (bsa >= 1.6 && bsa < 1.9) {
    status = "Good Surface Area";
    remedy = "Balanced nutrition";
    comment = `${userName}, ${bsa.toFixed(2)}m² body surface. Healthy size!`;
  } else if (bsa < 1.6) {
    status = "Small Body Size";
    remedy = "Nutrient-rich diet";
    comment = `${userName}, ${bsa.toFixed(2)}m² is small. Gain healthy weight!`;
  } else {
    status = "Large Body Size";
    remedy = "Moderate portions";
    comment = `${userName}, ${bsa.toFixed(2)}m² is large. Watch portion sizes!`;
  }
  
  return { status, value: bsa, remedy, comment };
}

// Fat Dominance Score Assessment (Scan 3+)
function assessFatDominance(vitals, patient, scanCount) {
  if (scanCount < 3) return { status: null, value: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, value: null, remedy: null, comment: null };
  
  const fatPercent = bodyCompositionUtils.calc_fat_percent(weight, height, sex, age, impedance);
  const musclePercent = bodyCompositionUtils.calc_muscle_percent(weight, height, sex, age, impedance);
  const dominance = bodyCompositionUtils.calc_fat_dominance(fatPercent, musclePercent);
  const userName = getFirstName(patient);
  
  let status, remedy, comment;
  
  if (dominance < -10) {
    status = "Muscle Dominant";
    remedy = "Continue strength training";
    comment = `${userName}, muscles dominate by ${Math.abs(dominance).toFixed(1)}%! Beast mode!`;
  } else if (dominance < 0) {
    status = "Balanced";
    remedy = "Maintain routine";
    comment = `${userName}, balanced composition. Keep it up!`;
  } else if (dominance <= 10) {
    status = "Slight Fat Excess";
    remedy = "Reduce carbs + walk";
    comment = `${userName}, fat leads by ${dominance.toFixed(1)}%. Cut down!`;
  } else {
    status = "Fat Dominant";
    remedy = "Strict diet + exercise";
    comment = `${userName}, fat dominates by ${dominance.toFixed(1)}%! Urgent action needed!`;
  }
  
  return { status, value: dominance, remedy, comment };
}

// Body Density Assessment (Scan 3+)
function assessBodyDensity(vitals, patient, scanCount) {
  if (scanCount < 3) return { status: null, value: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, value: null, remedy: null, comment: null };
  
  const fatPercent = bodyCompositionUtils.calc_fat_percent(weight, height, sex, age, impedance);
  const density = bodyCompositionUtils.calc_body_density(fatPercent);
  const userName = getFirstName(patient);
  
  let status, remedy, comment;
  
  if (density >= 1.055) {
    status = "High Density (Lean)";
    remedy = "Maintain muscle mass";
    comment = `${userName}, ${density.toFixed(3)} g/cm³ - solid and lean!`;
  } else if (density >= 1.045) {
    status = "Good Density";
    remedy = "Balanced diet";
    comment = `${userName}, ${density.toFixed(3)} g/cm³ - healthy composition!`;
  } else if (density >= 1.035) {
    status = "Average Density";
    remedy = "Reduce fat + exercise";
    comment = `${userName}, ${density.toFixed(3)} g/cm³ - room for improvement!`;
  } else {
    status = "Low Density (High Fat)";
    remedy = "Fat loss program";
    comment = `${userName}, ${density.toFixed(3)} g/cm³ - too much fat. Work on it!`;
  }
  
  return { status, value: density, remedy, comment };
}

// Thermal Index Assessment (Scan 4+)
function assessThermalIndex(vitals, patient, scanCount) {
  if (scanCount < 4) return { status: null, value: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  
  if (!weight || !height || !age) return { status: null, value: null, remedy: null, comment: null };
  
  const bmr = bodyCompositionUtils.calc_bmr(weight, height, sex, age);
  const bsa = bodyCompositionUtils.calc_bsa(weight, height);
  const thermalIndex = bodyCompositionUtils.calc_thermal_index(bmr, bsa);
  const userName = getFirstName(patient);
  
  let status, remedy, comment;
  
  if (thermalIndex >= 800) {
    status = "High Heat Production";
    remedy = "Stay hydrated + cool environment";
    comment = `${userName}, ${thermalIndex.toFixed(0)} thermal units! You run hot!`;
  } else if (thermalIndex >= 650) {
    status = "Normal Heat Production";
    remedy = "Balanced hydration";
    comment = `${userName}, ${thermalIndex.toFixed(0)} thermal index. Perfect!`;
  } else if (thermalIndex >= 500) {
    status = "Low Heat Production";
    remedy = "Warm foods + exercise";
    comment = `${userName}, ${thermalIndex.toFixed(0)} index. Boost metabolism!`;
  } else {
    status = "Very Low Metabolism";
    remedy = "Doctor consultation";
    comment = `${userName}, ${thermalIndex.toFixed(0)} - metabolic issues possible!`;
  }
  
  return { status, value: thermalIndex, remedy, comment };
}

// Recomposition Gap Assessment (Scan 4+)
// calc_recomposition_gap(weight_control, fat_control, muscle_control) — sum of differences from ideal
function assessRecompositionGap(vitals, patient, scanCount) {
  if (scanCount < 4) return { status: null, value: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, value: null, remedy: null, comment: null };
  
  const fatPercent = bodyCompositionUtils.calc_fat_percent(weight, height, sex, age, impedance);
  const musclePercent = bodyCompositionUtils.calc_muscle_percent(weight, height, sex, age, impedance);
  const standardWeight = bodyCompositionUtils.calc_standard_weight(height, sex);
  const weightControl = bodyCompositionUtils.calc_weight_control(standardWeight, weight);
  const fatControl = bodyCompositionUtils.calc_fat_control(weight, fatPercent, sex);
  const muscleControl = bodyCompositionUtils.calc_muscle_control(weight, musclePercent, sex);
  const gap = bodyCompositionUtils.calc_recomposition_gap(weightControl, fatControl, muscleControl);
  const userName = getFirstName(patient);
  
  let status, remedy, comment;
  
  if (gap <= 2) {
    status = "No Recomp Needed";
    remedy = "Maintain current plan";
    comment = `${userName}, ideal body composition achieved! Champion status!`;
  } else if (gap <= 6) {
    status = "Minor Adjustments";
    remedy = "Fine-tune diet";
    comment = `${userName}, only small adjustments needed (gap: ${gap.toFixed(1)} kg)! Almost there!`;
  } else if (gap <= 15) {
    status = "Moderate Gap";
    remedy = "Protein + resistance training";
    comment = `${userName}, ${gap.toFixed(1)} kg gap to ideal composition. Keep working!`;
  } else {
    status = "Large Gap";
    remedy = "Full body transformation plan";
    comment = `${userName}, ${gap.toFixed(1)} kg to transform. Start now!`;
  }
  
  return { status, value: gap, remedy, comment };
}

// Physiological Efficiency Assessment (Scan 5+)
// calc_physiological_efficiency(lbmi, hydration_efficiency, muscle_efficiency) — normalized 0-100
function assessPhysiologicalEfficiency(vitals, patient, scanCount) {
  if (scanCount < 5) return { status: null, value: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, value: null, remedy: null, comment: null };
  
  const lbmi = bodyCompositionUtils.calc_lbmi(weight, height, age, impedance, sex);
  const ffm = bodyCompositionUtils.calc_ffm(weight, height, age, impedance, sex);
  const waterPercent = bodyCompositionUtils.calc_water_percent(weight, height, sex, age, impedance);
  const waterMass = bodyCompositionUtils.calc_water_mass(weight, waterPercent);
  const hydrationEff = bodyCompositionUtils.calc_hydration_efficiency(ffm, waterMass);
  const bmr = bodyCompositionUtils.calc_bmr(weight, height, sex, age);
  const musclePercent = bodyCompositionUtils.calc_muscle_percent(weight, height, sex, age, impedance);
  const muscleMass = bodyCompositionUtils.calc_muscle_mass(weight, musclePercent);
  const muscleEff = bodyCompositionUtils.calc_muscle_efficiency(bmr, muscleMass);
  const efficiency = bodyCompositionUtils.calc_physiological_efficiency(lbmi, hydrationEff, muscleEff);
  const userName = getFirstName(patient);
  
  let status, remedy, comment;
  
  if (efficiency >= 85) {
    status = "Elite Efficiency";
    remedy = "Maintain excellence";
    comment = `${userName}, ${efficiency.toFixed(1)}% efficiency! Peak performance!`;
  } else if (efficiency >= 70) {
    status = "Good Efficiency";
    remedy = "Continue healthy habits";
    comment = `${userName}, ${efficiency.toFixed(1)}% efficiency. Strong body!`;
  } else if (efficiency >= 50) {
    status = "Average Efficiency";
    remedy = "Improve fitness routine";
    comment = `${userName}, ${efficiency.toFixed(1)}% efficiency. Room to grow!`;
  } else {
    status = "Low Efficiency";
    remedy = "Complete lifestyle overhaul";
    comment = `${userName}, ${efficiency.toFixed(1)}% - body struggling. Act now!`;
  }
  
  return { status, value: efficiency, remedy, comment };
}

// Mass Calculations (Scan 5+) - Water, Muscle, Fat, Subcutaneous Fat
function assessBodyMasses(vitals, patient, scanCount) {
  if (scanCount < 5) return { 
    waterMass: { status: null, value: null, remedy: null, comment: null },
    muscleMass: { status: null, value: null, remedy: null, comment: null },
    fatMass: { status: null, value: null, remedy: null, comment: null },
    subcutFatMass: { status: null, value: null, remedy: null, comment: null }
  };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { 
    waterMass: { status: null, value: null, remedy: null, comment: null },
    muscleMass: { status: null, value: null, remedy: null, comment: null },
    fatMass: { status: null, value: null, remedy: null, comment: null },
    subcutFatMass: { status: null, value: null, remedy: null, comment: null }
  };
  
  const userName = getFirstName(patient);
  
  // Water Mass
  const waterPercent = bodyCompositionUtils.calc_water_percent(weight, height, sex, age, impedance);
  const waterMass = bodyCompositionUtils.calc_water_mass(weight, waterPercent);
  const waterMassData = {
    status: waterMass >= weight * 0.55 ? "Well Hydrated" : waterMass >= weight * 0.50 ? "Adequate Water" : "Dehydrated",
    value: waterMass,
    remedy: waterMass < weight * 0.50 ? "Drink 3L water daily" : "Continue hydration",
    comment: `${userName}, ${waterMass.toFixed(1)}kg water in your body!`
  };
  
  // Muscle Mass
  const musclePercent = bodyCompositionUtils.calc_muscle_percent(weight, height, sex, age, impedance);
  const muscleMass = bodyCompositionUtils.calc_muscle_mass(weight, musclePercent);
  const muscleMassData = {
    status: muscleMass >= weight * 0.40 ? "Strong Muscle" : muscleMass >= weight * 0.30 ? "Average Muscle" : "Low Muscle",
    value: muscleMass,
    remedy: muscleMass < weight * 0.30 ? "Protein + gym" : "Maintain training",
    comment: `${userName}, ${muscleMass.toFixed(1)}kg muscle power!`
  };
  
  // Fat Mass
  const fatPercent = bodyCompositionUtils.calc_fat_percent(weight, height, sex, age, impedance);
  const fatMass = bodyCompositionUtils.calc_fat_mass(weight, fatPercent);
  const fatMassData = {
    status: fatMass <= weight * 0.20 ? "Lean" : fatMass <= weight * 0.30 ? "Moderate Fat" : "High Fat",
    value: fatMass,
    remedy: fatMass > weight * 0.30 ? "Fat loss diet" : "Maintain balance",
    comment: `${userName}, ${fatMass.toFixed(1)}kg fat to manage!`
  };
  
  // Subcutaneous Fat Mass
  const subcutFatPercent = bodyCompositionUtils.calc_subcutaneous_fat_percent(fatPercent, sex);
  const subcutFatMass = bodyCompositionUtils.calc_subcutaneous_fat_mass(weight, subcutFatPercent);
  const subcutFatMassData = {
    status: (subcutFatMass / fatMass) >= 0.80 ? "Healthy Fat Storage" : "Visceral Risk",
    value: subcutFatMass,
    remedy: (subcutFatMass / fatMass) < 0.80 ? "Reduce belly fat" : "Good distribution",
    comment: `${userName}, ${subcutFatMass.toFixed(1)}kg under-skin fat!`
  };
  
  return { 
    waterMass: waterMassData,
    muscleMass: muscleMassData,
    fatMass: fatMassData,
    subcutFatMass: subcutFatMassData
  };
}

export default function Report5() {
  const { speakText, stop } = useSpeech();
  const { data, resetHealth } = useHealth();
  const { patient, vitals = {} } = data || {};
  const navigate = useNavigate();

  const userName = getFirstName(patient);
  const [showChallengePrompt, setShowChallengePrompt] = useState(false);

  // Compute body score for challenge prompt
  const bodyScore = useMemo(() => {
    if (!vitals?.weight || !patient?.age || !patient?.gender || !vitals?.height || !vitals?.impedance) return null;
    const sex = patient.gender.toLowerCase() === "male" ? 1 : 0;
    return Math.round(bodyCompositionUtils.calc_body_score(vitals.weight, vitals.height, sex, patient.age, vitals.impedance));
  }, [vitals, patient]);

  const metabolicAge = useMemo(() => {
    if (!vitals?.weight || !patient?.age || !patient?.gender || !vitals?.height) return null;
    const sex = patient.gender.toLowerCase() === "male" ? 1 : 0;
    const bmr = bodyCompositionUtils.calc_bmr(vitals.weight, vitals.height, sex, patient.age);
    return Math.round(bodyCompositionUtils.calc_metabolic_age(bmr, patient.age, sex));
  }, [vitals, patient]);

  // Helper function to handle navigation - checks for pending kits
  const handleReturnHome = () => {
    resetHealth();
    const kits = localStorage.getItem('reliv_pending_kits');
    if (kits) {
      try {
        const parsedKits = JSON.parse(kits);
        if (parsedKits && parsedKits.length > 0) {
          // User bought kits with report, dispatch them now
          localStorage.removeItem('reliv_pending_kits');
          navigate('/order-success', { state: { cart: parsedKits, fromReport: true } });
          return;
        }
      } catch (e) {
        console.error('Error parsing pending kits:', e);
      }
    }
    localStorage.removeItem('reliv_pending_kits');
    navigate('/');
  };

  const [history, setHistory] = useState([]);
  const [ecoStats, setEcoStats] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [doctorEmail, setDoctorEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [speechPlaying, setSpeechPlaying] = useState(false);
  const [inactivityTimer, setInactivityTimer] = useState(120);
  const [activeInput, setActiveInput] = useState(null);
  const [keyboardInputs, setKeyboardInputs] = useState({ doctorEmail: "" });
  const doctorEmailInputRef = useRef(null);

  const confettiRef = useRef(false);
  const inactivityIntervalRef = useRef(null);
  const reportContainerRef = useRef(null);

  // Fetch history
  useEffect(() => {
    if (!patient?.email) return;
    fetch(`${API_BASE}/api/reports/history/${encodeURIComponent(patient.email)}`)
      .then((res) => res.json())
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]));
  }, [patient?.email]);

  // Fetch eco stats
  useEffect(() => {
    fetch(`${API_BASE}/api/eco-stats`)
      .then((res) => res.json())
      .then(setEcoStats)
      .catch(() => setEcoStats(null));
  }, []);

  // ── Dynamic speech: full summary with all numbers + vision + simple advice ──
  const speechFired = useRef(false);
  useEffect(() => {
    if (speechFired.current) return;
    speechFired.current = true;
    const timer = setTimeout(() => {
      const name = userName || "Champion";
      let text = `${name}, here are all your numbers in one place. But more importantly, here is what they mean in simple human language.`;
      if (vitals?.systolic && vitals?.diastolic) {
        const bpOk = vitals.systolic < 130 && vitals.diastolic < 85;
        text += ` Your blood pressure is ${vitals.systolic} over ${vitals.diastolic}. ${bpOk ? "That is normal. No worries." : "That needs monitoring. Watch your salt and stress."}`;
      }
      if (vitals?.oxygen) {
        text += ` Oxygen is ${vitals.oxygen} percent. ${vitals.oxygen >= 95 ? "Healthy levels." : "A bit low. Practice deep breathing."}`;
      }
      if (vitals?.temperature) {
        text += ` Temperature is ${vitals.temperature} degrees.`;
      }
      if (vitals?.weight && vitals?.height) {
        text += ` You weigh ${vitals.weight} kg at ${vitals.height} cm.`;
      }
      if (vitals?.leftEye || vitals?.rightEye) {
        const leftLine = Number(vitals.leftEye);
        const rightLine = Number(vitals.rightEye);
        const worstEye = Math.min(leftLine || 13, rightLine || 13);
        if (worstEye <= 4) text += ` Your eyesight needs attention. Please see an ophthalmologist.`;
        else if (worstEye <= 8) text += ` Your eyesight is fair. Consider glasses or eye exercises.`;
        else text += ` Your eyesight is good. Keep it up.`;
      }
      text += ` Do you need glasses? Or just more sleep? Is your BP normal? Or a warning? Read the advice on screen. Screenshot it. Follow it for 7 days. Then come back. A new checkup is waiting for you. Now scroll down, click on send to mail. Your full report will be emailed to you in simple language. You can also challenge a friend or your partner to see who's healthier. Loser posts on their story! Also you can check out the wellness kits. Curated just for you based on your results.`;
      speakText(text);
    }, 400);
    return () => { clearTimeout(timer); stop(); };
  }, []);

  // Fetch QR code using reportId from most recent history entry
  useEffect(() => {
    if (!history || history.length === 0) return;
    
    // Get most recent report ID
    const latestReport = history[history.length - 1];
    const reportId = latestReport._id || latestReport.reportId;
    
    if (!reportId) {
      if (import.meta.env.DEV) console.error('No reportId found in history');
      return;
    }
    
    // QR encodes direct download URL with reportId
    const downloadUrl = `${API_BASE}/api/report/${reportId}/download`;
    
    fetch(`${API_BASE}/api/qr-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: downloadUrl }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('QR generation failed');
        return res.json();
      })
      .then((data) => {
        // Backend returns { qrCode: "data:image/png;base64,..." }
        setQrCode(data.qrCode || data.qrCodeUrl || data.url);
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.error('QR Code error:', err);
        setQrCode(null);
      });
  }, [history]);

  // Inactivity timer - reset on any user interaction
  useEffect(() => {
    const resetTimer = () => setInactivityTimer(120);
    
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    inactivityIntervalRef.current = setInterval(() => {
      setInactivityTimer((prev) => {
        if (prev <= 1) return 0; // Signal expiry — effect below handles navigation
        return prev - 1;
      });
    }, 1000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (inactivityIntervalRef.current) clearInterval(inactivityIntervalRef.current);
    };
  }, []);

  // Separate effect: navigate when timer hits 0 (avoids calling navigation inside setState)
  useEffect(() => {
    if (inactivityTimer === 0) {
      handleReturnHome();
    }
  }, [inactivityTimer]); // eslint-disable-line react-hooks/exhaustive-deps

  const scanCount = data.history?.length || 1;

  // Unlock rules
  const unlock = {
    vitalsTable: scanCount >= 1,
    basicInsights: scanCount >= 2,
    compositionSummary: scanCount >= 3,
    trendLanguage: scanCount >= 4,
    confidenceMeter: scanCount >= 5,
    doctorTone: scanCount >= 6,
    fullNarrative: scanCount >= 7,
  };

  // Strict mapping to avoid any weird rounding fractional issues
  const cycleDay = Math.min(scanCount, 7);
  const scanPercentages = [0, 14, 28, 42, 57, 71, 85, 100];
  const derivedPercent = scanPercentages[cycleDay] || ( (cycleDay/7) * 100 );
  const cyclePercent = derivedPercent;
  const confidencePercent = derivedPercent;

  // Normalize vitals - use backend field names directly
  const bpm = vitals.bpm ?? null;
  const oxygen = vitals.oxygen ?? null;
  const systolic = vitals.systolic ?? null;
  const diastolic = vitals.diastolic ?? null;
  const temperature = vitals.temperature ?? null;

  // Body composition metrics
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
    const waterPct = bodyCompositionUtils.calc_water_percent(vitals.weight, vitals.height, sex, patient.age, vitals.impedance);
    const ffmi = bodyCompositionUtils.calc_ffmi(vitals.weight, vitals.height, bodyCompositionUtils.calc_fat_mass(vitals.weight, bodyFatPct));

    return {
      bmi: Number(bmi.toFixed(1)),
      bmr: Math.round(bmr),
      metabolicAge: Math.round(metabolicAge),
      bodyFatPct: Number(bodyFatPct.toFixed(1)),
      musclePct: Number(musclePct.toFixed(1)),
      waterPct: Number(waterPct.toFixed(1)),
      ffmi: Number(ffmi.toFixed(1)),
    };
  }, [vitals, patient]);

  // Status functions
  const getBPStatus = () => {
    if (!systolic || !diastolic) return { status: "N/A", color: "#888888", text: "Not recorded" };
    if (systolic < 120 && diastolic < 80) return { status: "Optimal", color: "#22c55e", text: "Your blood pressure readings fall within a healthy range across recent measurements." };
    if (systolic < 130 && diastolic < 85) return { status: "Normal", color: "#3b82f6", text: "Blood pressure is within normal range." };
    return { status: "Needs Attention", color: "#ef4444", text: "Blood pressure readings show mild elevation and should be observed over time." };
  };

  const getOxygenStatus = () => {
    if (!oxygen) return { status: "N/A", color: "#888888", text: "Not recorded" };
    if (oxygen >= 95) return { status: "Excellent", color: "#22c55e", text: "Oxygen delivery appears efficient and consistent." };
    if (oxygen >= 90) return { status: "Stable", color: "#3b82f6", text: "Oxygen levels are stable but may vary with activity or posture." };
    return { status: "Low", color: "#ef4444", text: "Oxygen levels may need medical attention." };
  };

  const getPulseStatus = () => {
    if (!bpm) return { status: "N/A", color: "#888888", text: "Not recorded" };
    if (bpm >= 60 && bpm <= 100) return { status: "Normal", color: "#22c55e", text: "Heart rate reflects a balanced autonomic response." };
    return { status: "Variable", color: "#f59e0b", text: "Heart rate shows variability that may reflect stress or activity." };
  };

  const getTemperatureStatus = () => {
    if (!temperature) return { status: "N/A", color: "#888888", text: "Not recorded" };
    if (temperature < 95) return { status: "Very Low", color: "#3b82f6", text: "Body temperature is unusually low and may need attention." };
    if (temperature < 97) return { status: "Low", color: "#3b82f6", text: "Body temperature is slightly below normal range." };
    if (temperature <= 98.9) return { status: "Normal", color: "#22c55e", text: "Body temperature is within healthy range." };
    if (temperature <= 100) return { status: "Slightly Elevated", color: "#f59e0b", text: "Body temperature is slightly elevated but may be normal variation." };
    if (temperature <= 101) return { status: "Fever", color: "#f97316", text: "Mild fever detected. Monitor and stay hydrated." };
    if (temperature <= 104) return { status: "High Fever", color: "#ef4444", text: "High fever present. Consider medical consultation." };
    return { status: "Very High Fever", color: "#dc2626", text: "Very high fever. Seek immediate medical attention." };
  };

  // Progressive insights
  const insights = useMemo(() => {
    const list = [];
    if (scanCount < 2) return list;

    if (oxygen >= 95) list.push("Oxygen delivery appears efficient and consistent");
    if (bpm >= 60 && bpm <= 80) list.push("Heart rate reflects balanced autonomic response");
    
    if (scanCount >= 3) {
      if (metrics && metrics.musclePct > 30) list.push("Your muscle composition and hydration levels support efficient metabolic activity");
      if (systolic < 120) list.push("Blood pressure stability suggests good cardiovascular health");
    }

    if (scanCount >= 4) {
      if (metrics && metrics.waterPct > 50) list.push("Hydration levels are supporting consistent metabolic readings");
      list.push("Repeated measurements show stability across vitals");
      // Trend language unlocked
      if (history && history.length >= 3) {
        const oldestItem = history[0];
        const oldestBP = oldestItem?.vitals?.systolic;
        const latestBP = vitals?.systolic;
        if (oldestBP && latestBP && Math.abs(oldestBP - latestBP) < 10) {
          list.push(`Blood pressure variance within 10 mmHg demonstrates cardiovascular consistency`);
        }
      }
    }

    if (scanCount >= 5) {
      list.push("Pattern consistency suggests balanced physiological regulation");
      // Confidence meter active
      const confidenceLevel = Math.min(Math.round((scanCount / 7) * 100), 100);
      if (confidenceLevel >= 70) {
        list.push(`Data confidence at ${confidenceLevel}% enables reliable health pattern recognition`);
      }
    }

    if (scanCount >= 6) {
      list.push("Your health profile shows established stability over repeated observations");
      // Doctor-tone framing
      if (systolic && systolic < 130) {
        list.push("Clinical assessment: Blood pressure readings within normal therapeutic range");
      }
    }

    if (scanCount >= 7) {
      list.push("Long-term trend analysis confirms consistent metabolic and cardiovascular balance");
      // Full narrative synthesis
      list.push("Seven-scan verification complete: Your baseline health signature is now established");
    }

    return list.slice(0, Math.min(scanCount, 6));
  }, [scanCount, oxygen, bpm, systolic, metrics]);

  // Final narrative summary
  const narrativeSummary = useMemo(() => {
    if (scanCount < 7) return "Complete your 7-scan cycle for a full narrative summary based on repeated observations.";

    const bpStatus = getBPStatus();
    const overallTrend = bpStatus.status === "Optimal" ? "stable cardiovascular and metabolic balance" : "generally stable vitals with areas to observe over time";
    const strongestArea = metrics && metrics.musclePct > 35 ? "muscle composition" : "cardiovascular stability";

    return `Based on seven confirmed scans, your health profile reflects ${overallTrend} with particular strength in ${strongestArea}. Your vital stability and body composition patterns suggest balanced physiological function, with no indicators requiring immediate attention. This report is generated from repeated observations, increasing confidence in its accuracy.`;
  }, [scanCount, metrics]);

  // NEW: Integration Metrics (scan-wise unlocking)
  const integrationMetrics = useMemo(() => {
    const fatFreeWeightData = assessFatFreeWeight(vitals, patient, scanCount);
    const bsaData = assessBSA(vitals, patient, scanCount);
    const fatDominanceData = assessFatDominance(vitals, patient, scanCount);
    const bodyDensityData = assessBodyDensity(vitals, patient, scanCount);
    const thermalIndexData = assessThermalIndex(vitals, patient, scanCount);
    const recompositionGapData = assessRecompositionGap(vitals, patient, scanCount);
    const physiologicalEfficiencyData = assessPhysiologicalEfficiency(vitals, patient, scanCount);
    const bodyMasses = assessBodyMasses(vitals, patient, scanCount);
    
    return {
      fatFreeWeightData,
      bsaData,
      fatDominanceData,
      bodyDensityData,
      thermalIndexData,
      recompositionGapData,
      physiologicalEfficiencyData,
      waterMassData: bodyMasses.waterMass,
      muscleMassData: bodyMasses.muscleMass,
      fatMassData: bodyMasses.fatMass,
      subcutFatMassData: bodyMasses.subcutFatMass
    };
  }, [vitals, patient, scanCount]);

  // Extract for JSX access
  const { 
    fatFreeWeightData, 
    bsaData, 
    fatDominanceData, 
    bodyDensityData, 
    thermalIndexData, 
    recompositionGapData, 
    physiologicalEfficiencyData,
    waterMassData,
    muscleMassData,
    fatMassData,
    subcutFatMassData
  } = integrationMetrics;

  // Email send - sends structured health data to backend for professional PDF generation
  const handleSendEmail = async () => {
    if (!patient?.email) {
      alert('No email address found for patient');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(patient.email)) {
      alert('Invalid email address format');
      return;
    }
    
    setSendingEmail(true);
    
    try {
      // Send structured health data — backend generates professional PDF
      const response = await fetch(`${API_BASE}/api/send-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          to: patient.email, 
          name: patient.name,
          healthData: { 
            patient, 
            vitals: {
              systolic: systolic || null,
              diastolic: diastolic || null,
              bpm: bpm || null,
              oxygen: oxygen || null,
              temperature: temperature || null,
              weight: vitals.weight || null,
              height: vitals.height || null,
              impedance: vitals.impedance || null,
              leftEye: vitals.leftEye || null,
              rightEye: vitals.rightEye || null,
              leftEyeAdvice: vitals.leftEyeAdvice || null,
              rightEyeAdvice: vitals.rightEyeAdvice || null,
            },
            bodyComposition: metrics,
            history 
          } 
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        if (import.meta.env.DEV) console.error('❌ Email send failed:', response.status, errorText);
        throw new Error(`Email failed: ${response.status} - ${errorText}`);
      }
      
      if (import.meta.env.DEV) console.log('✅ Email sent successfully to', patient.email);
      setEmailSent(true);
      // After animation completes (3s), check for pending kits or navigate home
      setTimeout(() => {
        setEmailSent(false);
        handleReturnHome();
      }, 3500);
    } catch (err) {
      if (import.meta.env.DEV) console.error('❌ Email error:', err);
      alert(`Failed to send report: ${sanitizeError(err)}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendToDoctor = async () => {
    if (!doctorEmail) {
      alert('Please enter doctor\'s email address');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(doctorEmail)) {
      alert('Please enter a valid email address');
      return;
    }
    
    setSendingEmail(true);
    
    try {
      // Send structured health data — backend generates professional PDF
      const response = await fetch(`${API_BASE}/api/send-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          to: doctorEmail, 
          name: patient.name,
          healthData: { 
            patient, 
            vitals: {
              systolic: systolic || null,
              diastolic: diastolic || null,
              bpm: bpm || null,
              oxygen: oxygen || null,
              temperature: temperature || null,
              weight: vitals.weight || null,
              height: vitals.height || null,
              impedance: vitals.impedance || null,
              leftEye: vitals.leftEye || null,
              rightEye: vitals.rightEye || null,
              leftEyeAdvice: vitals.leftEyeAdvice || null,
              rightEyeAdvice: vitals.rightEyeAdvice || null,
            },
            bodyComposition: metrics,
            history 
          } 
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        if (import.meta.env.DEV) console.error('❌ Doctor email send failed:', response.status, errorText);
        throw new Error(`Email failed: ${response.status} - ${errorText}`);
      }
      
      if (import.meta.env.DEV) console.log('✅ Report sent successfully to doctor:', doctorEmail);
      setEmailSent(true);
      setDoctorEmail("");
      // After animation completes, check for pending kits or navigate home
      setTimeout(() => {
        setEmailSent(false);
        handleReturnHome();
      }, 3500);
    } catch (err) {
      if (import.meta.env.DEV) console.error('❌ Doctor email error:', err);
      alert(`Failed to send report: ${sanitizeError(err)}`);
    } finally {
      setSendingEmail(false);
    }
  };

  // Read aloud
  const handleReadAloud = () => {
    if (speechPlaying) {
      window.speechSynthesis.cancel();
      setSpeechPlaying(false);
      return;
    }

    const textToRead = `
      Comprehensive Health Report for ${patient?.name || "Patient"}.
      ${narrativeSummary}
      Blood Pressure: ${getBPStatus().status}. ${getBPStatus().text}
      Oxygen Level: ${getOxygenStatus().status}. ${getOxygenStatus().text}
      Pulse: ${getPulseStatus().status}. ${getPulseStatus().text}
      Body Weight: ${vitals.weight || "Not recorded"} kilograms.
      Insights: ${insights.join(". ")}
    `;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.onend = () => setSpeechPlaying(false);
    window.speechSynthesis.speak(utterance);
    setSpeechPlaying(true);
  };

  // Confetti on scan 7 with all normal vitals
  useEffect(() => {
    if (scanCount === 7 && !confettiRef.current) {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      confettiRef.current = true;
    }
  }, [scanCount]);

  const bpStatus = getBPStatus();
  const oxygenStatus = getOxygenStatus();
  const pulseStatus = getPulseStatus();
  const temperatureStatus = getTemperatureStatus();

  // Check for missing health data after refresh
  const healthDataMissing = !data || !data.patient?.email || !data.vitals?.systolic;

  return (
    <div style={{ 
      height: "100vh", 
      background: "#ffffff", 
      padding: "48px 32px", 
      position: "relative",
      paddingBottom: activeInput === 'doctorEmail' ? "350px" : "48px",
      overflowY: "auto",
      WebkitOverflowScrolling: "touch"
    }} className="scrollable-container">
      <div ref={reportContainerRef} style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {healthDataMissing && (
          <div style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "18px",
            borderRadius: "12px",
            marginBottom: "32px",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "18px",
            border: "2px solid #dc2626"
          }}>
            ⚠️ Health data is missing or incomplete. Please complete a scan before sending your report. Data will persist across refreshes unless reset.
          </div>
        )}
        
        {/* Header with Logo and QR Code */}
        <div style={{ position: "relative", textAlign: "center", marginBottom: "60px", minHeight: "180px" }}>
          <Logo size="text-6xl" />
          {qrCode && (
            <div style={{ position: "absolute", right: 0, top: 0 }}>
              <img src={qrCode} alt="QR Code" style={{ width: "140px", height: "140px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <div style={{ fontSize: "12px", color: "#666666", marginTop: "8px", textAlign: "center", maxWidth: "140px" }}>
                Scan for report
              </div>
            </div>
          )}
        </div>

        {/* Inactivity Timer */}
        {inactivityTimer <= 30 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: "fixed",
              bottom: "20px",
              right: "20px",
              background: "#fef3c7",
              border: "2px solid #fbbf24",
              borderRadius: "12px",
              padding: "12px 20px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#92400e",
              zIndex: 1000,
            }}
          >
            ⏱️ Returning to home in {inactivityTimer}s
          </motion.div>
        )}

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: "48px" }}
        >
          <h1 style={{ fontSize: "48px", fontWeight: "900", marginBottom: "12px", color: "#111111" }}>
            Your Comprehensive Health Report
          </h1>
          <p style={{ fontSize: "18px", color: "#555555", maxWidth: "800px", margin: "0 auto" }}>
            A comprehensive assessment based on {scanCount} scan{scanCount !== 1 ? "s" : ""}, combining vital signs, body composition, and trend analysis
          </p>
          {scanCount < 7 && (
            <div style={{ marginTop: "16px", padding: "12px 24px", background: "#fef3c7", border: "2px solid #fbbf24", borderRadius: "12px", display: "inline-block" }}>
              <span style={{ fontSize: "15px", fontWeight: "600", color: "#92400e" }}>
                {scanCount === 1 && "📊 Initial Baseline — Building your health profile"}
                {scanCount === 2 && "🔄 Pattern Recognition — Detecting early trends"}
                {scanCount === 3 && "📈 Composition Analysis — Body metrics now visible"}
                {scanCount === 4 && "🎯 Trend Confirmation — Changes becoming clear"}
                {scanCount === 5 && "✨ Confidence Building — High accuracy achieved"}
                {scanCount === 6 && "🏥 Clinical Validation — Doctor-grade insights ready"}
              </span>
            </div>
          )}
          {scanCount >= 7 && (
            <div style={{ marginTop: "16px", padding: "14px 28px", background: "#d1fae5", border: "2px solid #6ee7b7", borderRadius: "12px", display: "inline-block" }}>
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#065f46" }}>
                ✅ Complete Health Profile — 7-Scan Certification Achieved
              </span>
            </div>
          )}
        </motion.div>

        {/* Patient Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            marginBottom: "48px",
            padding: "24px",
            background: "#f8fafc",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px", color: "#111111" }}>
            Patient Details
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", fontSize: "16px" }}>
            <div><strong>Name:</strong> {patient?.name || "N/A"}</div>
            <div><strong>Age:</strong> {patient?.age || "N/A"}</div>
            <div><strong>Gender:</strong> {patient?.gender || "N/A"}</div>
            <div><strong>Email:</strong> {patient?.email || "N/A"}</div>
            <div><strong>Phone:</strong> {patient?.phone || "N/A"}</div>
          </div>
        </motion.div>

        {/* Wellness Indicators (derived from vitals — not raw repeats) */}
        {unlock.vitalsTable && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              marginBottom: "48px",
              padding: "32px",
              background: "#fff7ed",
              border: "2px solid #ffe8a3",
              borderRadius: "16px",
            }}
          >
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px", color: "#111111" }}>
              Wellness Indicators
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
              {/* Stress Index — derived from HR + BP */}
              {(() => {
                const stressScore = (bpm && systolic) ? Math.min(100, Math.max(0, Math.round(
                  100 - Math.abs(bpm - 72) * 1.2 - Math.abs(systolic - 115) * 0.8
                ))) : null;
                const stressLevel = stressScore === null ? { label: "N/A", color: "#888888", tip: "Not enough data" }
                  : stressScore >= 75 ? { label: "Low Stress", color: "#22c55e", tip: "Your body appears calm and well-regulated" }
                  : stressScore >= 50 ? { label: "Moderate", color: "#f59e0b", tip: "Some elevation — try deep breathing or a walk" }
                  : { label: "High Stress", color: "#ef4444", tip: "Elevated markers — consider rest and hydration" };
                return (
                  <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e5e5", textAlign: "center" }}>
                    <div style={{ fontSize: "15px", color: "#666666", marginBottom: "8px" }}>Stress Index</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#111111" }}>
                      {stressScore !== null ? `${stressScore}/100` : "N/A"}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: stressLevel.color, marginTop: "8px" }}>
                      {stressLevel.label}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{stressLevel.tip}</div>
                  </div>
                );
              })()}

              {/* Cardiovascular Fitness — derived from resting HR + BP range */}
              {(() => {
                const cardioScore = (bpm && systolic && diastolic) ? Math.min(100, Math.max(0, Math.round(
                  100 - (bpm > 100 ? (bpm - 100) * 2 : bpm < 60 ? (60 - bpm) * 1.5 : 0)
                  - (systolic > 130 ? (systolic - 130) * 1.5 : 0)
                  - (diastolic > 85 ? (diastolic - 85) * 1.5 : 0)
                ))) : null;
                const cardioLevel = cardioScore === null ? { label: "N/A", color: "#888888", tip: "Not enough data" }
                  : cardioScore >= 80 ? { label: "Excellent", color: "#22c55e", tip: "Strong cardiovascular indicators" }
                  : cardioScore >= 60 ? { label: "Good", color: "#3b82f6", tip: "Heart and circulation look healthy" }
                  : cardioScore >= 40 ? { label: "Fair", color: "#f59e0b", tip: "Room for improvement — try regular cardio" }
                  : { label: "Needs Work", color: "#ef4444", tip: "Consider consulting a doctor" };
                return (
                  <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e5e5", textAlign: "center" }}>
                    <div style={{ fontSize: "15px", color: "#666666", marginBottom: "8px" }}>Cardio Fitness</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#111111" }}>
                      {cardioScore !== null ? `${cardioScore}/100` : "N/A"}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: cardioLevel.color, marginTop: "8px" }}>
                      {cardioLevel.label}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{cardioLevel.tip}</div>
                  </div>
                );
              })()}

              {/* Respiratory Health — derived from SpO2 + resting pulse */}
              {(() => {
                const respScore = (oxygen && bpm) ? Math.min(100, Math.max(0, Math.round(
                  (oxygen - 90) * 10 - (bpm > 90 ? (bpm - 90) * 0.5 : 0)
                ))) : null;
                const respLevel = respScore === null ? { label: "N/A", color: "#888888", tip: "Not enough data" }
                  : respScore >= 80 ? { label: "Excellent", color: "#22c55e", tip: "Lungs are delivering oxygen efficiently" }
                  : respScore >= 50 ? { label: "Normal", color: "#3b82f6", tip: "Breathing function appears stable" }
                  : respScore >= 25 ? { label: "Below Average", color: "#f59e0b", tip: "Practice pranayama or deep breathing daily" }
                  : { label: "Low", color: "#ef4444", tip: "Oxygen delivery may need medical attention" };
                return (
                  <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e5e5", textAlign: "center" }}>
                    <div style={{ fontSize: "15px", color: "#666666", marginBottom: "8px" }}>Respiratory Health</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#111111" }}>
                      {respScore !== null ? `${respScore}/100` : "N/A"}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: respLevel.color, marginTop: "8px" }}>
                      {respLevel.label}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{respLevel.tip}</div>
                  </div>
                );
              })()}

              {/* Recovery Readiness — derived from temp + HR + SpO2 */}
              {(() => {
                const recoveryScore = (temperature && bpm && oxygen) ? Math.min(100, Math.max(0, Math.round(
                  100
                  - (temperature > 99 ? (temperature - 99) * 15 : temperature < 97 ? (97 - temperature) * 10 : 0)
                  - (bpm > 85 ? (bpm - 85) * 1.0 : 0)
                  - (oxygen < 95 ? (95 - oxygen) * 8 : 0)
                ))) : null;
                const recoveryLevel = recoveryScore === null ? { label: "N/A", color: "#888888", tip: "Not enough data" }
                  : recoveryScore >= 80 ? { label: "Ready", color: "#22c55e", tip: "Body is well-rested and ready to perform" }
                  : recoveryScore >= 55 ? { label: "Moderate", color: "#3b82f6", tip: "Adequate recovery — light activity is fine" }
                  : recoveryScore >= 30 ? { label: "Low", color: "#f59e0b", tip: "Take it easy — prioritize sleep and hydration" }
                  : { label: "Rest Needed", color: "#ef4444", tip: "Your body needs rest before exertion" };
                return (
                  <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e5e5", textAlign: "center" }}>
                    <div style={{ fontSize: "15px", color: "#666666", marginBottom: "8px" }}>Recovery Readiness</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#111111" }}>
                      {recoveryScore !== null ? `${recoveryScore}/100` : "N/A"}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: recoveryLevel.color, marginTop: "8px" }}>
                      {recoveryLevel.label}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{recoveryLevel.tip}</div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}

        {/* Insights */}
        {unlock.basicInsights && insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              marginBottom: "48px",
              padding: "32px",
              background: "#fff7ed",
              borderRadius: "16px",
              border: "2px solid #ffe8a3",
            }}
          >
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px", color: "#111111" }}>
              What Today's Scan Already Tells Us
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
              {insights.map((insight, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                  style={{
                    background: "#ffffff",
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid #e5e5e5",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span style={{ fontSize: "24px", color: "#22c55e" }}>✓</span>
                  <span style={{ fontSize: "15px", color: "#111111" }}>{insight}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Eye Sight Assessment */}
        {vitals.leftEye && vitals.rightEye && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              marginBottom: "48px",
              padding: "28px",
              background: "linear-gradient(135deg, #fef3e8 0%, #fff5eb 100%)",
              border: "2px solid #fed7aa",
              borderRadius: "16px",
            }}
          >
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px", color: "#111111" }}>
              👁️ Vision Assessment
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "24px" }}>
              <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "2px solid #fed7aa" }}>
                <div style={{ fontSize: "14px", color: "#78716c", marginBottom: "8px", fontWeight: "600" }}>Left Eye</div>
                <div style={{ fontSize: "32px", fontWeight: "bold", color: "#ea580c", marginBottom: "8px" }}>
                  Line {vitals.leftEye}
                </div>
                <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
                  {getVisionAssessment(vitals.leftEye).rating}
                </div>
                <div style={{ fontSize: "14px", color: "#57534e", lineHeight: "1.6" }}>
                  <div><strong>Spectacles:</strong> {getVisionAssessment(vitals.leftEye).glasses}</div>
                  <div><strong>Status:</strong> {getVisionAssessment(vitals.leftEye).status}</div>
                </div>
              </div>
              <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "2px solid #fed7aa" }}>
                <div style={{ fontSize: "14px", color: "#78716c", marginBottom: "8px", fontWeight: "600" }}>Right Eye</div>
                <div style={{ fontSize: "32px", fontWeight: "bold", color: "#ea580c", marginBottom: "8px" }}>
                  Line {vitals.rightEye}
                </div>
                <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
                  {getVisionAssessment(vitals.rightEye).rating}
                </div>
                <div style={{ fontSize: "14px", color: "#57534e", lineHeight: "1.6" }}>
                  <div><strong>Spectacles:</strong> {getVisionAssessment(vitals.rightEye).glasses}</div>
                  <div><strong>Status:</strong> {getVisionAssessment(vitals.rightEye).status}</div>
                </div>
              </div>
            </div>
            <div style={{ background: "#fffbeb", padding: "18px", borderRadius: "12px", border: "1px solid #fde047" }}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#713f12", marginBottom: "10px" }}>📋 Clinical Recommendation:</div>
              <div style={{ fontSize: "14px", color: "#854d0e", lineHeight: "1.7" }}>
                <div><strong>Left:</strong> {getVisionAssessment(vitals.leftEye).recommendation}</div>
                <div><strong>Right:</strong> {getVisionAssessment(vitals.rightEye).recommendation}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========== NEW: INTEGRATION METRICS SECTION ========== */}
        {(scanCount >= 2 || fatFreeWeightData.status || bsaData.status || fatDominanceData.status || bodyDensityData.status || thermalIndexData.status || recompositionGapData.status || physiologicalEfficiencyData.status || waterMassData.status) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.27 }}
            style={{
              background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
              border: "2px solid #38bdf8",
              borderRadius: "16px",
              padding: "32px",
              marginBottom: "48px"
            }}
          >
            <div style={{ 
              fontSize: "22px", 
              fontWeight: "bold", 
              color: "#0c4a6e", 
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              🔬 Advanced Integration Analysis
            </div>
            <div style={{ fontSize: "14px", color: "#075985", marginBottom: "24px" }}>
              {scanCount < 2 && "Complete 2 scans to unlock advanced body composition metrics"}
              {scanCount === 2 && "Basic integration metrics unlocked! Continue for more"}
              {scanCount === 3 && "Dominance & density revealed!"}
              {scanCount === 4 && "Thermal & recomposition analysis unlocked!"}
              {scanCount >= 5 && "Complete integration analysis unlocked! All body masses visible"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "18px" }}>
              
              {/* Fat-Free Weight (Scan 2+) */}
              {scanCount >= 2 && fatFreeWeightData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                    border: "2px solid #34d399",
                    borderRadius: "12px",
                    padding: "18px",
                    boxShadow: "0 3px 10px rgba(52, 211, 153, 0.12)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px"
                    }}>
                      💪
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "bold", color: "#064e3b" }}>Fat-Free Weight</div>
                      <div style={{ fontSize: "11px", color: "#065f46" }}>Lean Body Mass</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "30px", fontWeight: "bold", color: "#064e3b", marginBottom: "6px" }}>
                    {fatFreeWeightData.value?.toFixed(1)} kg
                  </div>
                  
                  <div style={{
                    display: "inline-block",
                    background: fatFreeWeightData.status.includes("High") ? "#fee2e2" : 
                                fatFreeWeightData.status.includes("Average") ? "#fef3c7" : "#dbeafe",
                    color: fatFreeWeightData.status.includes("High") ? "#991b1b" :
                           fatFreeWeightData.status.includes("Average") ? "#92400e" : "#1e40af",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "11px",
                    marginBottom: "10px"
                  }}>
                    {fatFreeWeightData.status}
                  </div>
                  
                  <div style={{ fontSize: "12px", color: "#065f46", marginBottom: "10px", lineHeight: "1.4" }}>
                    {fatFreeWeightData.comment}
                  </div>
                  
                  {fatFreeWeightData.remedy && (
                    <div style={{
                      background: "#fef3c7",
                      border: "1px solid #fbbf24",
                      borderRadius: "8px",
                      padding: "8px",
                      marginTop: "8px"
                    }}>
                      <div style={{ fontSize: "10px", fontWeight: "600", color: "#92400e", marginBottom: "3px" }}>
                        🌿 Remedy
                      </div>
                      <div style={{ fontSize: "11px", color: "#78350f" }}>
                        {fatFreeWeightData.remedy}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* BSA (Scan 2+) */}
              {scanCount >= 2 && bsaData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  style={{
                    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                    border: "2px solid #fbbf24",
                    borderRadius: "12px",
                    padding: "18px",
                    boxShadow: "0 3px 10px rgba(251, 191, 36, 0.12)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px"
                    }}>
                      📐
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "bold", color: "#78350f" }}>BSA</div>
                      <div style={{ fontSize: "11px", color: "#92400e" }}>Body Surface Area</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "30px", fontWeight: "bold", color: "#78350f", marginBottom: "6px" }}>
                    {bsaData.value?.toFixed(2)} m²
                  </div>
                  
                  <div style={{
                    display: "inline-block",
                    background: bsaData.status.includes("Small") || bsaData.status.includes("Large") ? "#fee2e2" : 
                                bsaData.status.includes("Good") ? "#dbeafe" : "#d1fae5",
                    color: bsaData.status.includes("Small") || bsaData.status.includes("Large") ? "#991b1b" :
                           bsaData.status.includes("Good") ? "#1e40af" : "#065f46",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "11px",
                    marginBottom: "10px"
                  }}>
                    {bsaData.status}
                  </div>
                  
                  <div style={{ fontSize: "12px", color: "#92400e", marginBottom: "10px", lineHeight: "1.4" }}>
                    {bsaData.comment}
                  </div>
                  
                  {bsaData.remedy && (
                    <div style={{
                      background: "#fef3c7",
                      border: "1px solid #fbbf24",
                      borderRadius: "8px",
                      padding: "8px",
                      marginTop: "8px"
                    }}>
                      <div style={{ fontSize: "10px", fontWeight: "600", color: "#92400e", marginBottom: "3px" }}>
                        🌿 Remedy
                      </div>
                      <div style={{ fontSize: "11px", color: "#78350f" }}>
                        {bsaData.remedy}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Fat Dominance (Scan 3+) */}
              {scanCount >= 3 && fatDominanceData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                    border: "2px solid #f87171",
                    borderRadius: "12px",
                    padding: "18px",
                    boxShadow: "0 3px 10px rgba(248, 113, 113, 0.12)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      background: "linear-gradient(135deg, #ef4444, #dc2626)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px"
                    }}>
                      ⚔️
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "bold", color: "#7f1d1d" }}>Fat Dominance</div>
                      <div style={{ fontSize: "11px", color: "#991b1b" }}>Fat vs Muscle</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "30px", fontWeight: "bold", color: "#7f1d1d", marginBottom: "6px" }}>
                    {fatDominanceData.value > 0 ? "+" : ""}{fatDominanceData.value?.toFixed(1)}%
                  </div>
                  
                  <div style={{
                    display: "inline-block",
                    background: fatDominanceData.status.includes("Fat Dominant") || fatDominanceData.status.includes("Slight") ? "#fee2e2" : 
                                fatDominanceData.status.includes("Balanced") ? "#fef3c7" : "#d1fae5",
                    color: fatDominanceData.status.includes("Fat Dominant") || fatDominanceData.status.includes("Slight") ? "#991b1b" :
                           fatDominanceData.status.includes("Balanced") ? "#92400e" : "#065f46",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "11px",
                    marginBottom: "10px"
                  }}>
                    {fatDominanceData.status}
                  </div>
                  
                  <div style={{ fontSize: "12px", color: "#991b1b", marginBottom: "10px", lineHeight: "1.4" }}>
                    {fatDominanceData.comment}
                  </div>
                  
                  {fatDominanceData.remedy && (
                    <div style={{
                      background: "#fef3c7",
                      border: "1px solid #fbbf24",
                      borderRadius: "8px",
                      padding: "8px",
                      marginTop: "8px"
                    }}>
                      <div style={{ fontSize: "10px", fontWeight: "600", color: "#92400e", marginBottom: "3px" }}>
                        🌿 Remedy
                      </div>
                      <div style={{ fontSize: "11px", color: "#78350f" }}>
                        {fatDominanceData.remedy}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Body Density (Scan 3+) */}
              {scanCount >= 3 && bodyDensityData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  style={{
                    background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                    border: "2px solid #60a5fa",
                    borderRadius: "12px",
                    padding: "18px",
                    boxShadow: "0 3px 10px rgba(96, 165, 250, 0.12)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px"
                    }}>
                      🧊
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1e3a8a" }}>Body Density</div>
                      <div style={{ fontSize: "11px", color: "#1e40af" }}>Tissue Compactness</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1e3a8a", marginBottom: "6px" }}>
                    {bodyDensityData.value?.toFixed(3)}
                  </div>
                  <div style={{ fontSize: "11px", color: "#1e40af", marginBottom: "6px" }}>g/cm³</div>
                  
                  <div style={{
                    display: "inline-block",
                    background: bodyDensityData.status.includes("Low") || bodyDensityData.status.includes("Average") ? "#fef3c7" : "#d1fae5",
                    color: bodyDensityData.status.includes("Low") || bodyDensityData.status.includes("Average") ? "#92400e" : "#065f46",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "11px",
                    marginBottom: "10px"
                  }}>
                    {bodyDensityData.status}
                  </div>
                  
                  <div style={{ fontSize: "12px", color: "#1e40af", marginBottom: "10px", lineHeight: "1.4" }}>
                    {bodyDensityData.comment}
                  </div>
                  
                  {bodyDensityData.remedy && (
                    <div style={{
                      background: "#fef3c7",
                      border: "1px solid #fbbf24",
                      borderRadius: "8px",
                      padding: "8px",
                      marginTop: "8px"
                    }}>
                      <div style={{ fontSize: "10px", fontWeight: "600", color: "#92400e", marginBottom: "3px" }}>
                        🌿 Remedy
                      </div>
                      <div style={{ fontSize: "11px", color: "#78350f" }}>
                        {bodyDensityData.remedy}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Thermal Index (Scan 4+) */}
              {scanCount >= 4 && thermalIndexData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    background: "linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)",
                    border: "2px solid #fb923c",
                    borderRadius: "12px",
                    padding: "18px",
                    boxShadow: "0 3px 10px rgba(251, 146, 60, 0.12)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      background: "linear-gradient(135deg, #f97316, #ea580c)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px"
                    }}>
                      🌡️
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "bold", color: "#7c2d12" }}>Thermal Index</div>
                      <div style={{ fontSize: "11px", color: "#9a3412" }}>Heat Production</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "30px", fontWeight: "bold", color: "#7c2d12", marginBottom: "6px" }}>
                    {thermalIndexData.value?.toFixed(0)}
                  </div>
                  
                  <div style={{
                    display: "inline-block",
                    background: thermalIndexData.status.includes("Low") || thermalIndexData.status.includes("Very Low") ? "#fee2e2" : 
                                thermalIndexData.status.includes("High") ? "#fef3c7" : "#d1fae5",
                    color: thermalIndexData.status.includes("Low") || thermalIndexData.status.includes("Very Low") ? "#991b1b" :
                           thermalIndexData.status.includes("High") ? "#92400e" : "#065f46",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "11px",
                    marginBottom: "10px"
                  }}>
                    {thermalIndexData.status}
                  </div>
                  
                  <div style={{ fontSize: "12px", color: "#9a3412", marginBottom: "10px", lineHeight: "1.4" }}>
                    {thermalIndexData.comment}
                  </div>
                  
                  {thermalIndexData.remedy && (
                    <div style={{
                      background: "#fef3c7",
                      border: "1px solid #fbbf24",
                      borderRadius: "8px",
                      padding: "8px",
                      marginTop: "8px"
                    }}>
                      <div style={{ fontSize: "10px", fontWeight: "600", color: "#92400e", marginBottom: "3px" }}>
                        🌿 Remedy
                      </div>
                      <div style={{ fontSize: "11px", color: "#78350f" }}>
                        {thermalIndexData.remedy}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Recomposition Gap (Scan 4+) */}
              {scanCount >= 4 && recompositionGapData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 }}
                  style={{
                    background: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
                    border: "2px solid #d8b4fe",
                    borderRadius: "12px",
                    padding: "18px",
                    boxShadow: "0 3px 10px rgba(167, 139, 250, 0.12)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px"
                    }}>
                      🎯
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "bold", color: "#581c87" }}>Recomposition Gap</div>
                      <div style={{ fontSize: "11px", color: "#6b21a8" }}>To Ideal Body</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "30px", fontWeight: "bold", color: "#581c87", marginBottom: "6px" }}>
                    {recompositionGapData.value?.toFixed(1)}%
                  </div>
                  
                  <div style={{
                    display: "inline-block",
                    background: recompositionGapData.status.includes("Large") || recompositionGapData.status.includes("Moderate") ? "#fee2e2" : 
                                recompositionGapData.status.includes("Minor") ? "#fef3c7" : "#d1fae5",
                    color: recompositionGapData.status.includes("Large") || recompositionGapData.status.includes("Moderate") ? "#991b1b" :
                           recompositionGapData.status.includes("Minor") ? "#92400e" : "#065f46",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "11px",
                    marginBottom: "10px"
                  }}>
                    {recompositionGapData.status}
                  </div>
                  
                  <div style={{ fontSize: "12px", color: "#6b21a8", marginBottom: "10px", lineHeight: "1.4" }}>
                    {recompositionGapData.comment}
                  </div>
                  
                  {recompositionGapData.remedy && (
                    <div style={{
                      background: "#fef3c7",
                      border: "1px solid #fbbf24",
                      borderRadius: "8px",
                      padding: "8px",
                      marginTop: "8px"
                    }}>
                      <div style={{ fontSize: "10px", fontWeight: "600", color: "#92400e", marginBottom: "3px" }}>
                        🌿 Remedy
                      </div>
                      <div style={{ fontSize: "11px", color: "#78350f" }}>
                        {recompositionGapData.remedy}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Physiological Efficiency (Scan 5+) */}
              {scanCount >= 5 && physiologicalEfficiencyData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    background: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
                    border: "2px solid #f9a8d4",
                    borderRadius: "12px",
                    padding: "18px",
                    boxShadow: "0 3px 10px rgba(244, 114, 182, 0.12)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      background: "linear-gradient(135deg, #ec4899, #db2777)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px"
                    }}>
                      ⚙️
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "bold", color: "#831843" }}>Physiological Efficiency</div>
                      <div style={{ fontSize: "11px", color: "#9f1239" }}>Overall System</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "30px", fontWeight: "bold", color: "#831843", marginBottom: "6px" }}>
                    {physiologicalEfficiencyData.value?.toFixed(1)}%
                  </div>
                  
                  <div style={{
                    display: "inline-block",
                    background: physiologicalEfficiencyData.status.includes("Low") || physiologicalEfficiencyData.status.includes("Average") ? "#fee2e2" : 
                                physiologicalEfficiencyData.status.includes("Good") ? "#dbeafe" : "#d1fae5",
                    color: physiologicalEfficiencyData.status.includes("Low") || physiologicalEfficiencyData.status.includes("Average") ? "#991b1b" :
                           physiologicalEfficiencyData.status.includes("Good") ? "#1e40af" : "#065f46",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "11px",
                    marginBottom: "10px"
                  }}>
                    {physiologicalEfficiencyData.status}
                  </div>
                  
                  <div style={{ fontSize: "12px", color: "#9f1239", marginBottom: "10px", lineHeight: "1.4" }}>
                    {physiologicalEfficiencyData.comment}
                  </div>
                  
                  {physiologicalEfficiencyData.remedy && (
                    <div style={{
                      background: "#fef3c7",
                      border: "1px solid #fbbf24",
                      borderRadius: "8px",
                      padding: "8px",
                      marginTop: "8px"
                    }}>
                      <div style={{ fontSize: "10px", fontWeight: "600", color: "#92400e", marginBottom: "3px" }}>
                        🌿 Remedy
                      </div>
                      <div style={{ fontSize: "11px", color: "#78350f" }}>
                        {physiologicalEfficiencyData.remedy}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Body Mass Components Grid (Scan 5+) */}
              {scanCount >= 5 && waterMassData.status && (
                <>
                  {/* Water Mass */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.45 }}
                    style={{
                      background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                      border: "2px solid #60a5fa",
                      borderRadius: "12px",
                      padding: "18px",
                      boxShadow: "0 3px 10px rgba(96, 165, 250, 0.12)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px"
                      }}>
                        💧
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1e3a8a" }}>Water Mass</div>
                      </div>
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1e3a8a", marginBottom: "4px" }}>
                      {waterMassData.value?.toFixed(1)} kg
                    </div>
                    <div style={{
                      display: "inline-block",
                      background: waterMassData.status.includes("Dehydrated") ? "#fee2e2" : "#d1fae5",
                      color: waterMassData.status.includes("Dehydrated") ? "#991b1b" : "#065f46",
                      padding: "4px 10px",
                      borderRadius: "9999px",
                      fontWeight: "600",
                      fontSize: "11px",
                      marginBottom: "8px"
                    }}>
                      {waterMassData.status}
                    </div>
                    <div style={{ fontSize: "11px", color: "#1e40af" }}>
                      {waterMassData.comment}
                    </div>
                  </motion.div>

                  {/* Muscle Mass */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{
                      background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                      border: "2px solid #34d399",
                      borderRadius: "12px",
                      padding: "18px",
                      boxShadow: "0 3px 10px rgba(52, 211, 153, 0.12)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px"
                      }}>
                        💪
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "bold", color: "#064e3b" }}>Muscle Mass</div>
                      </div>
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#064e3b", marginBottom: "4px" }}>
                      {muscleMassData.value?.toFixed(1)} kg
                    </div>
                    <div style={{
                      display: "inline-block",
                      background: muscleMassData.status.includes("Low") ? "#fee2e2" : 
                                  muscleMassData.status.includes("Average") ? "#fef3c7" : "#d1fae5",
                      color: muscleMassData.status.includes("Low") ? "#991b1b" :
                             muscleMassData.status.includes("Average") ? "#92400e" : "#065f46",
                      padding: "4px 10px",
                      borderRadius: "9999px",
                      fontWeight: "600",
                      fontSize: "11px",
                      marginBottom: "8px"
                    }}>
                      {muscleMassData.status}
                    </div>
                    <div style={{ fontSize: "11px", color: "#065f46" }}>
                      {muscleMassData.comment}
                    </div>
                  </motion.div>

                  {/* Fat Mass */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.55 }}
                    style={{
                      background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                      border: "2px solid #f87171",
                      borderRadius: "12px",
                      padding: "18px",
                      boxShadow: "0 3px 10px rgba(248, 113, 113, 0.12)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px"
                      }}>
                        🔥
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "bold", color: "#7f1d1d" }}>Fat Mass</div>
                      </div>
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#7f1d1d", marginBottom: "4px" }}>
                      {fatMassData.value?.toFixed(1)} kg
                    </div>
                    <div style={{
                      display: "inline-block",
                      background: fatMassData.status.includes("High") ? "#fee2e2" : 
                                  fatMassData.status.includes("Moderate") ? "#fef3c7" : "#d1fae5",
                      color: fatMassData.status.includes("High") ? "#991b1b" :
                             fatMassData.status.includes("Moderate") ? "#92400e" : "#065f46",
                      padding: "4px 10px",
                      borderRadius: "9999px",
                      fontWeight: "600",
                      fontSize: "11px",
                      marginBottom: "8px"
                    }}>
                      {fatMassData.status}
                    </div>
                    <div style={{ fontSize: "11px", color: "#991b1b" }}>
                      {fatMassData.comment}
                    </div>
                  </motion.div>

                  {/* Subcutaneous Fat Mass */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{
                      background: "linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)",
                      border: "2px solid #fb923c",
                      borderRadius: "12px",
                      padding: "18px",
                      boxShadow: "0 3px 10px rgba(251, 146, 60, 0.12)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        background: "linear-gradient(135deg, #f97316, #ea580c)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px"
                      }}>
                        📊
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "bold", color: "#7c2d12" }}>Subcutaneous Fat</div>
                      </div>
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c2d12", marginBottom: "4px" }}>
                      {subcutFatMassData.value?.toFixed(1)} kg
                    </div>
                    <div style={{
                      display: "inline-block",
                      background: subcutFatMassData.status.includes("Risk") ? "#fee2e2" : "#d1fae5",
                      color: subcutFatMassData.status.includes("Risk") ? "#991b1b" : "#065f46",
                      padding: "4px 10px",
                      borderRadius: "9999px",
                      fontWeight: "600",
                      fontSize: "11px",
                      marginBottom: "8px"
                    }}>
                      {subcutFatMassData.status}
                    </div>
                    <div style={{ fontSize: "11px", color: "#9a3412" }}>
                      {subcutFatMassData.comment}
                    </div>
                  </motion.div>
                </>
              )}

              {/* Unlock Message */}
              {scanCount < 2 && (
                <div style={{
                  background: "rgba(255,255,255,0.6)",
                  border: "2px dashed #d1d5db",
                  borderRadius: "12px",
                  padding: "24px",
                  textAlign: "center",
                  gridColumn: "1 / -1"
                }}>
                  <div style={{ fontSize: "40px", marginBottom: "10px" }}>🔒</div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "#6b7280", marginBottom: "4px" }}>
                    Integration Analysis Locked
                  </div>
                  <div style={{ fontSize: "13px", color: "#9ca3af" }}>
                    Complete {2 - scanCount} more scan{2 - scanCount > 1 ? 's' : ''} to unlock advanced metrics
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Body Weight Insight */}
        {vitals.weight && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            style={{
              marginBottom: "48px",
              padding: "28px",
              background: "#ecfdf5",
              border: "2px solid #a7f3d0",
              borderRadius: "16px",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "12px", color: "#111111" }}>
              Body Weight Insight
            </h2>
            <div style={{ fontSize: "18px", marginBottom: "12px", color: "#111111" }}>
              Current weight: <strong>{vitals.weight} kg</strong>
            </div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "#166534" }}>
              Your body weight should be interpreted alongside muscle and hydration data for a complete picture.
            </div>
          </motion.div>
        )}

        {/* Body Composition & Metabolic Tables */}
        {unlock.compositionSummary && metrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ marginBottom: "48px" }}
          >
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px", color: "#111111" }}>
              Current Health Status
            </h2>

            {/* Body Composition */}
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#F28C38", marginBottom: "12px" }}>
              Body Composition
            </h3>
            <div style={{ overflowX: "auto", marginBottom: "32px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb", borderRadius: "12px" }}>
                <thead>
                  <tr style={{ background: "#f3f4f6" }}>
                    <th style={{ padding: "14px", textAlign: "left", fontWeight: "bold", borderBottom: "2px solid #e5e7eb" }}>Parameter</th>
                    <th style={{ padding: "14px", textAlign: "left", fontWeight: "bold", borderBottom: "2px solid #e5e7eb" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "14px", borderBottom: "1px solid #e5e7eb" }}>Skeletal Muscle Mass</td>
                    <td style={{ padding: "14px", borderBottom: "1px solid #e5e7eb" }}>{metrics.musclePct}%</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "14px", borderBottom: "1px solid #e5e7eb" }}>Body Water</td>
                    <td style={{ padding: "14px", borderBottom: "1px solid #e5e7eb" }}>{metrics.waterPct}%</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "14px", borderBottom: "1px solid #e5e7eb" }}>Body Fat</td>
                    <td style={{ padding: "14px", borderBottom: "1px solid #e5e7eb" }}>{metrics.bodyFatPct}%</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "14px" }}>BMI</td>
                    <td style={{ padding: "14px" }}>{metrics.bmi}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Metabolic Table */}
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#F28C38", marginBottom: "12px" }}>
              Metabolic Profile
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb", borderRadius: "12px" }}>
                <thead>
                  <tr style={{ background: "#f3f4f6" }}>
                    <th style={{ padding: "14px", textAlign: "left", fontWeight: "bold", borderBottom: "2px solid #e5e7eb" }}>Parameter</th>
                    <th style={{ padding: "14px", textAlign: "left", fontWeight: "bold", borderBottom: "2px solid #e5e7eb" }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "14px", borderBottom: "1px solid #e5e7eb" }}>FFMI (Fat-Free Mass Index)</td>
                    <td style={{ padding: "14px", borderBottom: "1px solid #e5e7eb" }}>{metrics.ffmi}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "14px", borderBottom: "1px solid #e5e7eb" }}>BMR (Basal Metabolic Rate)</td>
                    <td style={{ padding: "14px", borderBottom: "1px solid #e5e7eb" }}>{metrics.bmr} cal/day</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "14px" }}>Metabolic Age</td>
                    <td style={{ padding: "14px" }}>{metrics.metabolicAge} years</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {!unlock.fullNarrative && (
              <div style={{ fontSize: "14px", color: "#888888", marginTop: "16px", fontStyle: "italic" }}>
                Full interpretation unlocks after repeated confirmation (7 scans).
              </div>
            )}
          </motion.div>
        )}

        {/* Confidence Meter */}
        {unlock.confidenceMeter && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            style={{
              marginBottom: "48px",
              padding: "24px",
              background: "#f0f9ff",
              border: "2px solid #bae6fd",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "12px", color: "#111111" }}>
              Weekly Consistency Confidence: {Math.round(confidencePercent)}%
            </h2>
            <div style={{
              width: "100%",
              height: "12px",
              background: "#e0f2fe",
              borderRadius: "6px",
              overflow: "hidden",
              marginBottom: "12px",
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidencePercent}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                style={{ height: "100%", background: "#F28C38" }}
              />
            </div>
            {confidencePercent >= 85 && (
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#0369a1", marginTop: "16px" }}>
                Your personal health model is now fully active.
              </div>
            )}
            <div style={{ fontSize: "14px", color: "#666666", marginTop: "12px" }}>
              Confidence reflects consistency across repeated scans, not a single reading.
            </div>
          </motion.div>
        )}

        {/* 7-Day Promise */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ textAlign: "center", margin: "60px 0" }}
        >
          <h2 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "16px", color: "#111111" }}>
            The 7-Day Promise
          </h2>
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px", marginBottom: "20px" }}>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div
                key={day}
                style={{
                  width: "48px",
                  height: "10px",
                  borderRadius: "6px",
                  background: day <= cycleDay ? "#F28C38" : "#e5e7eb",
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: "42px", fontWeight: "900", color: "#F28C38" }}>
            {Math.round(cyclePercent)}%
          </div>
          <div style={{ fontSize: "17px", color: "#444444", marginTop: "16px" }}>
            {cycleDay < 7
              ? `${7 - cycleDay} scan${7 - cycleDay !== 1 ? "s" : ""} remaining to complete your cycle`
              : "You've completed the full 7-scan cycle! 🎉"}
          </div>
        </motion.div>

        {/* Eco Stats - Compact optional info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "10px",
            padding: "16px 20px",
            margin: "24px 0",
            fontSize: "13px",
            color: "#166534",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>🌿</span>
              <span style={{ fontWeight: "600", fontSize: "14px" }}>Eco Impact:</span>
            </div>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "12px" }}>
              <span>💧 <strong>{ecoStats?.waterSaved || (scanCount * 20)}L</strong> water</span>
              <span>🌍 <strong>{ecoStats?.co2Reduced || (scanCount * 18)}g</strong> CO₂</span>
              <span>🌳 <strong>{ecoStats?.treesEquivalent || Math.round(scanCount * 0.5)}</strong> trees eq.</span>
            </div>
          </div>
        </motion.div>

        {/* Reference Guide (Scan 7+) */}
        {unlock.fullNarrative && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ marginBottom: "48px" }}
          >
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px", color: "#111111" }}>
              Body Composition Reference Guide
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f4f6" }}>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Metric</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Men</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Women</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>Muscle Mass</td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>33-39%</td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>24-30%</td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>Healthy range</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>Body Fat</td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>12-18%</td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>22-28%</td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>Optimal range</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>Body Water</td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>50-65%</td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>45-60%</td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>Hydration indicator</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px" }}>BMI</td>
                    <td style={{ padding: "12px" }}>18.5-25</td>
                    <td style={{ padding: "12px" }}>18.5-25</td>
                    <td style={{ padding: "12px" }}>Context-dependent</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: "14px", color: "#888888", marginTop: "12px", fontStyle: "italic" }}>
              Provided for reference. Individual ranges may vary.
            </div>
          </motion.div>
        )}

        {/* Final Narrative Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          style={{
            background: "#f0fdf4",
            border: "2px solid #86efac",
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "48px",
          }}
        >
          <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px", color: "#111111" }}>
            Summary
          </h2>
          <p style={{ fontSize: "16px", lineHeight: "1.7", color: "#111111" }}>
            {narrativeSummary}
          </p>
        </motion.div>

        {/* Scan 7 Certification Badge */}
        {scanCount >= 7 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            style={{
              background: "linear-gradient(135deg, #6ee7b7 0%, #3b82f6 100%)",
              border: "3px solid #10b981",
              borderRadius: "20px",
              padding: "32px",
              marginBottom: "48px",
              textAlign: "center",
              boxShadow: "0 8px 24px rgba(16, 185, 129, 0.3)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏆</div>
            <h2 style={{ fontSize: "28px", fontWeight: "900", color: "#ffffff", marginBottom: "12px" }}>
              7-Scan Health Certification
            </h2>
            <p style={{ fontSize: "16px", color: "#ffffff", marginBottom: "16px" }}>
              Your health profile has been confirmed through seven independent observations,
              achieving {Math.min(Math.round((scanCount / 7) * 100), 100)}% data confidence.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap", marginTop: "20px" }}>
              <div style={{ background: "rgba(255,255,255,0.2)", padding: "12px 20px", borderRadius: "12px", backdropFilter: "blur(10px)" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ffffff" }}>{history.length || 1}</div>
                <div style={{ fontSize: "13px", color: "#ffffff" }}>Total Scans</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.2)", padding: "12px 20px", borderRadius: "12px", backdropFilter: "blur(10px)" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ffffff" }}>112+</div>
                <div style={{ fontSize: "13px", color: "#ffffff" }}>Data Points</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.2)", padding: "12px 20px", borderRadius: "12px", backdropFilter: "blur(10px)" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ffffff" }}>95%+</div>
                <div style={{ fontSize: "13px", color: "#ffffff" }}>Confidence</div>
              </div>
            </div>
            <div style={{ marginTop: "20px", fontSize: "14px", color: "#ffffff", fontStyle: "italic" }}>
              "Verified through repeated measurement — your personal health baseline is established."
            </div>
          </motion.div>
        )}

        {/* Completion Note */}
        <div style={{ fontSize: "14px", fontStyle: "italic", color: "#777777", textAlign: "center", marginTop: "40px" }}>
          {scanCount >= 7 ? (
            <span style={{ color: "#22c55e", fontSize: "16px", fontWeight: "600" }}>✅ Complete Health Assessment — Medical-Grade Report Ready</span>
          ) : (
            <span style={{ color: "#f59e0b" }}>⚠️ Partial Assessment - Complete {7 - scanCount} more scan{7 - scanCount !== 1 ? "s" : ""} for full analysis</span>
          )}
        </div>

        {/* Scan Progress Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          style={{
            marginTop: "48px",
            padding: "24px",
            background: "#f8fafc",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#64748b", marginBottom: "12px" }}>
            Health Data Journey Progress
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
            {[1, 2, 3, 4, 5, 6, 7].map((scan) => (
              <div
                key={scan}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: scan <= scanCount ? "#F28C38" : "#e2e8f0",
                  color: scan <= scanCount ? "#ffffff" : "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "14px",
                  transition: "all 0.3s ease",
                  boxShadow: scan <= scanCount ? "0 4px 12px rgba(242, 140, 56, 0.3)" : "none",
                }}
              >
                {scan}
              </div>
            ))}
          </div>
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            {scanCount < 7 ? (
              <>
                <strong>{scanCount}</strong> of <strong>7</strong> scans completed •{" "}
                <strong>{Math.round((scanCount / 7) * 112)}</strong> of <strong>112</strong> data points collected
              </>
            ) : (
              <>
                ✨ All <strong>7 scans</strong> complete • Full <strong>112+ data points</strong> integrated •{" "}
                <span style={{ color: "#22c55e", fontWeight: "600" }}>Medical-Grade Report Active</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <>
          <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                justifyContent: "center",
                marginTop: "48px",
                marginBottom: "32px",
              }}
            >
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                style={{
                  background: "#22c55e",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "16px",
                  padding: "14px 32px",
                  borderRadius: "9999px",
                  border: "none",
                  cursor: sendingEmail ? "not-allowed" : "pointer",
                  opacity: sendingEmail ? 0.6 : 1,
                }}
              >
                {sendingEmail ? "Sending..." : "📧 Send My Report"}
              </button>

              <button
                onClick={handleReadAloud}
                style={{
                  background: speechPlaying ? "#ef4444" : "#3b82f6",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "16px",
                  padding: "14px 32px",
                  borderRadius: "9999px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {speechPlaying ? "⏸️ Stop Reading" : "🔊 Read Aloud"}
              </button>

              <button
                onClick={handleReturnHome}
                style={{
                  background: "#F28C38",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "16px",
                  padding: "14px 32px",
                  borderRadius: "9999px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                🏠 Return Home
              </button>

              <button
                onClick={() => navigate("/wellness-recommendations")}
                style={{
                  background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "16px",
                  padding: "14px 32px",
                  borderRadius: "9999px",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(168, 85, 247, 0.3)",
                }}
              >
                🎁 Wellness Picks for You
              </button>

              <button
                onClick={() => setShowChallengePrompt(true)}
                style={{
                  background: "linear-gradient(135deg, #F97316, #ea580c)",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "16px",
                  padding: "14px 32px",
                  borderRadius: "9999px",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)",
                }}
              >
                ⚔️ Challenge a Friend
              </button>
            </motion.div>

            {/* Send to Doctor */}
            <div style={{ 
              textAlign: "center", 
              marginBottom: "32px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px"
            }}>
              <div style={{ 
                background: "#f9fafb", 
                padding: "16px", 
                borderRadius: "12px",
                minWidth: "300px",
                border: "2px solid #e5e7eb"
              }}>
                <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>Doctor's Email:</div>
                <div style={{ 
                  fontSize: "16px", 
                  fontWeight: "600", 
                  color: keyboardInputs.doctorEmail ? "#111827" : "#9ca3af",
                  minHeight: "24px",
                  wordBreak: "break-all"
                }}>
                  {keyboardInputs.doctorEmail || "Tap below to enter email"}
                </div>
              </div>
              <input
                ref={doctorEmailInputRef}
                type="email"
                placeholder="Tap to enter doctor's email"
                value={keyboardInputs.doctorEmail}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setKeyboardInputs(prev => ({ ...prev, doctorEmail: newValue }));
                  setDoctorEmail(newValue);
                }}
                onClick={() => setActiveInput('doctorEmail')}
                readOnly
                style={{
                  padding: "12px 20px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "15px",
                  minWidth: "300px",
                  cursor: "pointer",
                  textAlign: "center",
                  background: "#ffffff"
                }}
              />
              <button
                onClick={handleSendToDoctor}
                disabled={!doctorEmail}
                style={{
                  background: !doctorEmail ? "#d1d5db" : "#6366f1",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "15px",
                  padding: "12px 24px",
                  borderRadius: "9999px",
                  border: "none",
                  cursor: !doctorEmail ? "not-allowed" : "pointer",
                }}
              >
                Send to Doctor
              </button>
            </div>
          </>

        {/* Virtual Keyboard - Fixed at bottom */}
        {activeInput === 'doctorEmail' && (
          <div className="fixed bottom-0 left-0 right-0 z-[10000]">
            <VirtualKeyboard
              inputName="doctorEmail"
              inputs={keyboardInputs}
              onChange={(inputName, value) => {
                setKeyboardInputs(prev => ({ ...prev, [inputName]: value }));
                setDoctorEmail(value);
              }}
              onClose={() => setActiveInput(null)}
            />
          </div>
        )}

        {/* Email sent animation */}
        {emailSent && (
          <EmailSendingAnimation 
            onComplete={() => {
              // Animation handles navigation via timeout in handleSendEmail
            }} 
          />
        )}

        {/* Challenge a Friend / Couple modal */}
        <ChallengePrompt
          open={showChallengePrompt}
          onClose={() => setShowChallengePrompt(false)}
          userName={userName}
          score={bodyScore}
          metabolicAge={metabolicAge}
          gender={patient?.gender}
          email={patient?.email}
        />
      </div>
    </div>
  );
}
