import { useEffect, useMemo, useState } from "react";
import { useHealth } from "../context/HealthContext";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import * as bodyCompositionUtils from "../utils/bodyComposition";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const API_BASE = import.meta.env.VITE_BACKEND_URL;

// Helper: Extract first name
const getFirstName = (patient) => {
  if (patient?.name) return patient.name.split(' ')[0];
  if (patient?.email) return patient.email.split('@')[0].split('.')[0];
  return 'Champion';
};

// ============================================================================
// NEW: RATIO & EFFICIENCY ASSESSMENTS (Scan-wise unlock)
// ============================================================================

// Fat-Muscle Ratio Assessment (Scan 2+)
function assessFatMuscleRatio(vitals, patient, scanCount) {
  if (scanCount < 2) return { status: null, value: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, value: null, remedy: null, comment: null };
  
  const fatPercent = bodyCompositionUtils.calc_fat_percent(weight, height, sex, age, impedance);
  const musclePercent = bodyCompositionUtils.calc_muscle_percent(weight, height, sex, age, impedance);
  const ratio = bodyCompositionUtils.calc_fat_muscle_ratio(fatPercent, musclePercent);
  const userName = getFirstName(patient);
  
  let status, remedy, comment;
  
  if (ratio <= 0.5) {
    status = "Excellent Balance";
    remedy = "Maintain current lifestyle";
    comment = `${userName}, perfect fat-muscle ratio! Champion physique.`;
  } else if (ratio <= 0.8) {
    status = "Good Balance";
    remedy = "Dal + roti + exercise";
    comment = `${userName}, healthy balance. Keep training!`;
  } else if (ratio <= 1.2) {
    status = "Needs Improvement";
    remedy = "Reduce oil + gym workout";
    comment = `${userName}, fat is higher than muscle. Time to work out!`;
  } else {
    status = "High Fat Ratio";
    remedy = "Methi water + daily walk";
    comment = `${userName}, urgent: too much fat vs muscle. Start exercising now.`;
  }
  
  return { status, value: ratio, remedy, comment };
}

// Hydration Efficiency Assessment (Scan 3+)
// calc_hydration_efficiency(ffm, water_mass) = (water_mass/ffm)*100
function assessHydrationEfficiency(vitals, patient, scanCount) {
  if (scanCount < 3) return { status: null, value: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, value: null, remedy: null, comment: null };
  
  const ffm = bodyCompositionUtils.calc_ffm(weight, height, age, impedance, sex);
  const waterPercent = bodyCompositionUtils.calc_water_percent(weight, height, sex, age, impedance);
  const waterMass = bodyCompositionUtils.calc_water_mass(weight, waterPercent);
  const efficiency = bodyCompositionUtils.calc_hydration_efficiency(ffm, waterMass);
  const userName = getFirstName(patient);
  
  let status, remedy, comment;
  
  if (efficiency >= 73) {
    status = "Optimal Hydration";
    remedy = "Continue water intake";
    comment = `${userName}, perfect hydration! Cells are well-nourished.`;
  } else if (efficiency >= 65) {
    status = "Good Hydration";
    remedy = "Drink 8 glasses water daily";
    comment = `${userName}, good water balance. Keep drinking!`;
  } else if (efficiency >= 55) {
    status = "Low Hydration";
    remedy = "Coconut water + nimbu paani";
    comment = `${userName}, dehydrated. Drink more water!`;
  } else {
    status = "Severe Dehydration";
    remedy = "ORS + lemon water urgently";
    comment = `${userName}, critical dehydration. Drink water NOW!`;
  }
  
  return { status, value: efficiency, remedy, comment };
}

// Metabolic Load Assessment (Scan 3+)
// calc_metabolic_load(bmr, weight) = bmr/weight (kcal per kg body mass)
function assessMetabolicLoad(vitals, patient, scanCount) {
  if (scanCount < 3) return { status: null, value: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, value: null, remedy: null, comment: null };
  
  const bmr = bodyCompositionUtils.calc_bmr(weight, height, sex, age);
  const load = bodyCompositionUtils.calc_metabolic_load(bmr, weight);
  const userName = getFirstName(patient);
  
  let status, remedy, comment;
  
  // load is kcal/kg. Typical: 20-30 kcal/kg=light, 30-40=moderate, >40=high
  if (load <= 25) {
    status = "Light Load";
    remedy = "Maintain balanced diet";
    comment = `${userName}, light metabolic load (${load.toFixed(1)} kcal/kg). Efficient body!`;
  } else if (load <= 35) {
    status = "Moderate Load";
    remedy = "Green vegetables + walk 30min";
    comment = `${userName}, moderate metabolic load (${load.toFixed(1)} kcal/kg). Stay active!`;
  } else if (load <= 45) {
    status = "Heavy Load";
    remedy = "Reduce carbs + regular exercise";
    comment = `${userName}, high metabolic load (${load.toFixed(1)} kcal/kg). Work on it!`;
  } else {
    status = "Overload";
    remedy = "Strict diet + doctor visit";
    comment = `${userName}, very high load (${load.toFixed(1)} kcal/kg). Urgent attention needed!`;
  }
  
  return { status, value: load, remedy, comment };
}

// Energy Reserve Score Assessment (Scan 4+)
// calc_energy_reserve_score(fat_percent, protein_percent) = normalized 0-100 score
function assessEnergyReserve(vitals, patient, scanCount) {
  if (scanCount < 4) return { status: null, value: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, value: null, remedy: null, comment: null };
  
  const fatPercent = bodyCompositionUtils.calc_fat_percent(weight, height, sex, age, impedance);
  const musclePercent = bodyCompositionUtils.calc_muscle_percent(weight, height, sex, age, impedance);
  const proteinPercent = bodyCompositionUtils.calc_protein_percent(musclePercent);
  const score = bodyCompositionUtils.calc_energy_reserve_score(fatPercent, proteinPercent);
  const userName = getFirstName(patient);
  
  let status, remedy, comment;
  
  if (score >= 70) {
    status = "High Energy Reserve";
    remedy = "Balanced meals";
    comment = `${userName}, excellent energy storage (${score.toFixed(0)}/100)! Ready for anything.`;
  } else if (score >= 50) {
    status = "Good Energy Reserve";
    remedy = "Nuts + dry fruits daily";
    comment = `${userName}, solid energy backup (${score.toFixed(0)}/100). Stay fueled!`;
  } else if (score >= 30) {
    status = "Low Energy Reserve";
    remedy = "Ghee + dates + almonds";
    comment = `${userName}, energy reserves low (${score.toFixed(0)}/100). Eat more nutritious food!`;
  } else {
    status = "Critical Energy";
    remedy = "High calorie diet + rest";
    comment = `${userName}, critically low energy (${score.toFixed(0)}/100). See a doctor!`;
  }
  
  return { status, value: score, remedy, comment };
}

// Muscle Efficiency Assessment (Scan 4+)
// calc_muscle_efficiency(bmr, muscle_mass) = bmr/muscle_mass (kcal per kg muscle)
function assessMuscleEfficiency(vitals, patient, scanCount) {
  if (scanCount < 4) return { status: null, value: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, value: null, remedy: null, comment: null };
  
  const bmr = bodyCompositionUtils.calc_bmr(weight, height, sex, age);
  const musclePercent = bodyCompositionUtils.calc_muscle_percent(weight, height, sex, age, impedance);
  const muscleMass = bodyCompositionUtils.calc_muscle_mass(weight, musclePercent);
  const efficiency = bodyCompositionUtils.calc_muscle_efficiency(bmr, muscleMass);
  const userName = getFirstName(patient);
  
  let status, remedy, comment;
  
  if (efficiency >= 80) {
    status = "Peak Efficiency";
    remedy = "Continue training";
    comment = `${userName}, muscles working at peak! Athlete quality.`;
  } else if (efficiency >= 60) {
    status = "Good Efficiency";
    remedy = "Protein + resistance training";
    comment = `${userName}, efficient muscles. Build more strength!`;
  } else if (efficiency >= 40) {
    status = "Low Efficiency";
    remedy = "Gym + high protein diet";
    comment = `${userName}, muscles need improvement. Start working out!`;
  } else {
    status = "Poor Efficiency";
    remedy = "Personal trainer + diet plan";
    comment = `${userName}, muscle quality is poor. Professional help recommended!`;
  }
  
  return { status, value: efficiency, remedy, comment };
}

// Protein-Muscle Ratio Assessment (Scan 5+)
function assessProteinMuscleRatio(vitals, patient, scanCount) {
  if (scanCount < 5) return { status: null, value: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, value: null, remedy: null, comment: null };
  
  const musclePercent = bodyCompositionUtils.calc_muscle_percent(weight, height, sex, age, impedance);
  const proteinPercent = bodyCompositionUtils.calc_protein_percent(musclePercent);
  const ratio = bodyCompositionUtils.calc_protein_muscle_ratio(proteinPercent, musclePercent);
  const userName = getFirstName(patient);
  
  let status, remedy, comment;
  
  if (ratio >= 0.35 && ratio <= 0.45) {
    status = "Perfect Protein Distribution";
    remedy = "Maintain diet";
    comment = `${userName}, ideal protein-muscle balance! Quality physique.`;
  } else if (ratio >= 0.30 && ratio < 0.35) {
    status = "Good Distribution";
    remedy = "Add more protein foods";
    comment = `${userName}, solid protein levels. Add more dal/eggs!`;
  } else if (ratio < 0.30) {
    status = "Low Protein";
    remedy = "Paneer + eggs + soya";
    comment = `${userName}, protein deficiency! Muscles need more fuel.`;
  } else {
    status = "High Protein";
    remedy = "Balance with vegetables";
    comment = `${userName}, excess protein. Add more vegetables!`;
  }
  
  return { status, value: ratio, remedy, comment };
}

// Metabolic Advantage Assessment (Scan 5+)
function assessMetabolicAdvantage(vitals, patient, scanCount) {
  if (scanCount < 5) return { status: null, value: null, remedy: null, comment: null };
  
  const weight = Number(vitals.weight);
  const height = Number(vitals.height);
  const age = Number(patient.age);
  const sex = patient.gender?.toLowerCase() === "male" ? 1 : 0;
  const impedance = Number(vitals.impedance) || 0;
  
  if (!weight || !height || !age) return { status: null, value: null, remedy: null, comment: null };
  
  const bmr = bodyCompositionUtils.calc_bmr(weight, height, sex, age);
  const metabolicAge = bodyCompositionUtils.calc_metabolic_age(bmr, age, sex);
  const advantage = bodyCompositionUtils.calc_metabolic_advantage(age, metabolicAge);
  const userName = getFirstName(patient);
  
  let status, remedy, comment;
  
  if (advantage >= 10) {
    status = "Superior Metabolism";
    remedy = "Keep current lifestyle";
    comment = `${userName}, metabolism ${advantage} years younger! Superstar body.`;
  } else if (advantage >= 5) {
    status = "Good Metabolism";
    remedy = "Maintain activity level";
    comment = `${userName}, metabolism ${advantage} years younger! Keep it up.`;
  } else if (advantage >= 0) {
    status = "Normal Metabolism";
    remedy = "More exercise + good sleep";
    comment = `${userName}, metabolism matches age. Room for improvement!`;
  } else if (advantage >= -5) {
    status = "Slow Metabolism";
    remedy = "Green tea + exercise";
    comment = `${userName}, metabolism ${Math.abs(advantage)} years older. Speed it up!`;
  } else {
    status = "Very Slow Metabolism";
    remedy = "Medical checkup + lifestyle change";
    comment = `${userName}, metabolism ${Math.abs(advantage)} years older. Urgent action needed!`;
  }
  
  return { status, value: advantage, remedy, comment };
}

export default function Report4() {
  const { data } = useHealth();
  const { patient, vitals } = data;
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  const userName = getFirstName(patient);

  useEffect(() => {
    if (!patient?.email) return;
    fetch(`${API_BASE}/api/reports/history/${encodeURIComponent(patient.email)}`)
      .then((r) => r.json())
      .then((h) => setHistory(Array.isArray(h) ? h : []))
      .catch(() => setHistory([]));
  }, [patient?.email]);

  const scanCount = (data.history?.length || 0) + 1;

  // Unlock rules
  const unlocks = {
    graphVisible: scanCount >= 2,
    deltaValues: scanCount >= 3,
    trendLabels: scanCount >= 4,
    confidenceScore: scanCount >= 5,
    patternLanguage: scanCount >= 6,
    longTermSummary: scanCount >= 7,
  };

  // Normalize vitals from history
  const normalizeVitals = (v) => ({
    systolic: v?.systolic ?? null,
    diastolic: v?.diastolic ?? null,
    bpm: v?.bpm ?? null,
    oxygen: v?.oxygen ?? null,
    temperature: v?.temperature ?? null,
  });

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [history]);

  // Chart data preparation
  const chartData = useMemo(() => {
    if (!unlocks.graphVisible) return null;

    const labels = sortedHistory.map((_, i) => `Scan ${i + 1}`);
    const datasets = [];

    // Systolic BP (red)
    datasets.push({
      label: "Systolic BP",
      data: sortedHistory.map((s) => normalizeVitals(s.vitals).systolic),
      borderColor: "#ef4444",
      backgroundColor: "#ef4444",
      yAxisID: "y",
      spanGaps: true,
      tension: unlocks.trendLabels ? 0.4 : 0,
      pointRadius: 5,
      pointBackgroundColor: "#ef4444",
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2,
    });

    // Diastolic BP (blue)
    datasets.push({
      label: "Diastolic BP",
      data: sortedHistory.map((s) => normalizeVitals(s.vitals).diastolic),
      borderColor: "#3b82f6",
      backgroundColor: "#3b82f6",
      yAxisID: "y",
      spanGaps: true,
      tension: unlocks.trendLabels ? 0.4 : 0,
      pointRadius: 5,
      pointBackgroundColor: "#3b82f6",
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2,
    });

    // Pulse (green)
    datasets.push({
      label: "Pulse (BPM)",
      data: sortedHistory.map((s) => normalizeVitals(s.vitals).bpm),
      borderColor: "#10b981",
      backgroundColor: "#10b981",
      yAxisID: "y1",
      spanGaps: true,
      tension: unlocks.trendLabels ? 0.4 : 0,
      pointRadius: 5,
      pointBackgroundColor: "#10b981",
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2,
    });

    // Oxygen (purple)
    datasets.push({
      label: "Oxygen (%)",
      data: sortedHistory.map((s) => normalizeVitals(s.vitals).oxygen),
      borderColor: "#a855f7",
      backgroundColor: "#a855f7",
      yAxisID: "y1",
      spanGaps: true,
      tension: unlocks.trendLabels ? 0.4 : 0,
      pointRadius: 5,
      pointBackgroundColor: "#a855f7",
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2,
    });

    return { labels, datasets };
  }, [sortedHistory, unlocks.graphVisible, unlocks.trendLabels]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: { font: { size: 13 }, padding: 16, usePointStyle: true },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0,0,0,0.8)",
        padding: 12,
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 13 } } },
      y: {
        type: "linear",
        position: "left",
        title: { display: true, text: "Blood Pressure (mmHg)", font: { size: 13, weight: "600" } },
        grid: { color: "#e5e7eb" },
      },
      y1: {
        type: "linear",
        position: "right",
        min: 40,
        max: 160,
        title: { display: true, text: "Pulse (BPM) & Oxygen (%)", font: { size: 13, weight: "600" } },
        grid: { display: false },
      },
    },
  };

  // Delta calculation
  const deltas = useMemo(() => {
    if (!unlocks.deltaValues || scanCount < 2 || sortedHistory.length < 2) return null;

    const latestItem = sortedHistory[sortedHistory.length - 1];
    const previousItem = sortedHistory[sortedHistory.length - 2];
    
    if (!latestItem?.vitals || !previousItem?.vitals) return null;

    const latest = normalizeVitals(latestItem.vitals);
    const previous = normalizeVitals(previousItem.vitals);

    // lowerIsBetter: decrease = green (good), increase = red (bad)
    // e.g. BP and resting pulse — lower is healthier
    const calc = (curr, prev, threshold, unit, lowerIsBetter = false) => {
      if (curr == null || prev == null) return null;
      const delta = curr - prev;
      if (Math.abs(delta) < threshold) return { text: "No meaningful change", symbol: "—", color: "#888888" };
      const isImprovement = lowerIsBetter ? delta < 0 : delta > 0;
      return {
        text: `${Math.abs(delta).toFixed(0)} ${unit}`,
        symbol: delta > 0 ? "↑" : "↓",
        color: isImprovement ? "#10b981" : "#ef4444",
      };
    };

    return {
      systolic: calc(latest.systolic, previous.systolic, 4, "mmHg", true),
      diastolic: calc(latest.diastolic, previous.diastolic, 4, "mmHg", true),
      bpm: calc(latest.bpm, previous.bpm, 3, "bpm", true),
      oxygen: calc(latest.oxygen, previous.oxygen, 1, "%", false),
    };
  }, [sortedHistory, scanCount, unlocks.deltaValues]);

  // Trend labels
  const trendLabel = useMemo(() => {
    if (!unlocks.trendLabels || scanCount < 4 || sortedHistory.length < 4) return null;

    const recent3 = sortedHistory.slice(-3);
    const systolicAvg = recent3.reduce((sum, s) => sum + (normalizeVitals(s?.vitals).systolic || 0), 0) / 3;
    const firstItem = sortedHistory[0];
    
    if (!firstItem?.vitals) return null;
    
    const first = normalizeVitals(firstItem.vitals).systolic || 0;

    if (systolicAvg < first - 5) return unlocks.patternLanguage ? "Established improvement" : "Improving Trend";
    if (systolicAvg > first + 5) return unlocks.patternLanguage ? "Established increase" : "Increasing Trend";
    return unlocks.patternLanguage ? "Consistent stability" : "Stable Trend";
  }, [sortedHistory, scanCount, unlocks.trendLabels, unlocks.patternLanguage]);

  // Confidence score
  const confidenceScore = unlocks.confidenceScore ? Math.min((scanCount / 7) * 100, 100) : null;

  // Insights
  const insights = useMemo(() => {
    if (scanCount < 3) return [];
    const list = [];

    if (deltas?.bpm?.symbol === "↓") {
      list.push({
        icon: "💓",
        title: "Pulse Stability",
        desc: "Your pulse shows improvement between scans.",
        arrow: "↓",
        color: "#10b981",
      });
    }

    if (deltas?.oxygen?.symbol === "↑" || deltas?.oxygen?.text === "No meaningful change") {
      list.push({
        icon: "🫁",
        title: "Oxygen Efficiency",
        desc: "Oxygen levels remain reliably efficient.",
        arrow: "✓",
        color: "#10b981",
      });
    }

    if (unlocks.patternLanguage && scanCount >= 6) {
      list.push({
        icon: "📊",
        title: "Pattern Recognition",
        desc: "Your vitals show consistent recovery between scans.",
        arrow: "✓",
        color: "#10b981",
      });
    }

    return list;
  }, [deltas, scanCount, unlocks.patternLanguage]);

  // Long-term summary
  const longTermSummary = useMemo(() => {
    if (!unlocks.longTermSummary) return null;
    return "Across seven measurements, your cardiovascular and oxygen trends show consistent stability, suggesting balanced autonomic regulation.";
  }, [unlocks.longTermSummary]);

  // NEW: Ratio & Efficiency Metrics (scan-wise unlocking)
  const ratioMetrics = useMemo(() => {
    const fatMuscleRatioData = assessFatMuscleRatio(vitals, patient, scanCount);
    const hydrationData = assessHydrationEfficiency(vitals, patient, scanCount);
    const metabolicLoadData = assessMetabolicLoad(vitals, patient, scanCount);
    const energyReserveData = assessEnergyReserve(vitals, patient, scanCount);
    const muscleEfficiencyData = assessMuscleEfficiency(vitals, patient, scanCount);
    const proteinMuscleRatioData = assessProteinMuscleRatio(vitals, patient, scanCount);
    const metabolicAdvantageData = assessMetabolicAdvantage(vitals, patient, scanCount);
    
    return {
      fatMuscleRatioData,
      hydrationData,
      metabolicLoadData,
      energyReserveData,
      muscleEfficiencyData,
      proteinMuscleRatioData,
      metabolicAdvantageData
    };
  }, [vitals, patient, scanCount]);

  // Extract for JSX access
  const { 
    fatMuscleRatioData, 
    hydrationData, 
    metabolicLoadData, 
    energyReserveData, 
    muscleEfficiencyData, 
    proteinMuscleRatioData, 
    metabolicAdvantageData 
  } = ratioMetrics;

  // Next unlock message
  const getNextUnlock = () => {
    if (scanCount < 2) return "Graphs unlock after your next scan";
    if (scanCount < 3) return "Delta indicators (↑ ↓) unlock in your next scan";
    if (scanCount < 4) return "Trend labels unlock after scan 4";
    if (scanCount < 5) return "Confidence score unlocks after scan 5";
    if (scanCount < 6) return "Pattern language unlocks after scan 6";
    if (scanCount < 7) return "Long-term summary unlocks after scan 7";
    return "All features unlocked";
  };

  // LOCKED STATE (Scan 1)
  if (!unlocks.graphVisible) {
    return (
      <div style={{ height: "100vh", background: "#FDFAF5", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 32px", overflowY: "auto", WebkitOverflowScrolling: "touch" }} className="scrollable-container">
        <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ marginBottom: "10px" }}>
              <Logo size="text-4xl" />
            </div>
            <h1 style={{ fontSize: "42px", fontWeight: "bold", color: "#111111", marginBottom: "12px" }}>
              Health Trends Over Time
            </h1>
            <p style={{ fontSize: "17px", color: "#555555", maxWidth: "680px", margin: "0 auto 8px" }}>
              Based on scan {scanCount} • Tracking changes across your journey
            </p>
            <p style={{ fontSize: "15px", fontStyle: "italic", color: "#666666", marginBottom: "16px" }}>
              {scanCount === 1 && "First scan captured - trends unlock next scan"}
              {scanCount === 2 && "Baseline comparison active - deltas unlock next"}
              {scanCount === 3 && "Delta indicators revealed - trends emerging"}
              {scanCount === 4 && "Trend labels active - confidence building"}
              {scanCount === 5 && "Confidence scoring enabled - patterns next"}
              {scanCount === 6 && "Pattern recognition active - summary unlocks next"}
              {scanCount >= 7 && "Complete timeline established - all insights available"}
            </p>
          </div>

          {/* Baseline Metrics Preview (Scan 1) */}
          {vitals && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "32px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                marginBottom: "32px"
              }}
            >
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111", marginBottom: "24px" }}>
                📊 Baseline Captured
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
                {vitals.systolic && vitals.diastolic && (
                  <div style={{ textAlign: "center", padding: "16px", background: "#fef2f2", borderRadius: "12px" }}>
                    <div style={{ fontSize: "14px", color: "#dc2626", fontWeight: "600", marginBottom: "8px" }}>Blood Pressure</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111" }}>
                      {vitals.systolic}/{vitals.diastolic}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px" }}>mmHg</div>
                  </div>
                )}
                {vitals.bpm && (
                  <div style={{ textAlign: "center", padding: "16px", background: "#f0fdf4", borderRadius: "12px" }}>
                    <div style={{ fontSize: "14px", color: "#10b981", fontWeight: "600", marginBottom: "8px" }}>Pulse</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111" }}>
                      {vitals.bpm}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px" }}>BPM</div>
                  </div>
                )}
                {vitals.oxygen && (
                  <div style={{ textAlign: "center", padding: "16px", background: "#faf5ff", borderRadius: "12px" }}>
                    <div style={{ fontSize: "14px", color: "#a855f7", fontWeight: "600", marginBottom: "8px" }}>Oxygen</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111" }}>
                      {vitals.oxygen}%
                    </div>
                    <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px" }}>SpO₂</div>
                  </div>
                )}
                {vitals.temperature && (
                  <div style={{ textAlign: "center", padding: "16px", background: "#fff7ed", borderRadius: "12px" }}>
                    <div style={{ fontSize: "14px", color: "#f97316", fontWeight: "600", marginBottom: "8px" }}>Temperature</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111" }}>
                      {vitals.temperature}°F
                    </div>
                    <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px" }}>Body Temp</div>
                  </div>
                )}
              </div>
              <div style={{ fontSize: "14px", color: "#666666", textAlign: "center", marginTop: "20px", fontStyle: "italic" }}>
                Deltas will appear after your next scan
              </div>
            </motion.div>
          )}

          {/* Locked Chart Container */}
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            marginBottom: "48px",
            position: "relative",
            minHeight: "400px"
          }}>
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(12px)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "24px",
              zIndex: 10
            }}>
              <div style={{ fontSize: "72px" }}>🔒</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111", textAlign: "center", maxWidth: "500px" }}>
                Trends appear after your next scan
              </div>
              <div style={{ fontSize: "18px", color: "#666666", textAlign: "center", maxWidth: "500px" }}>
                One scan shows a value, not a change. Complete a full scan to see how your body responds over time.
              </div>
            </div>
          </div>

          {/* Unlock message */}
          <div style={{
            textAlign: "center",
            background: "#f0fdf4",
            border: "2px dashed #86efac",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "40px",
            fontSize: "15px",
            color: "#16a34a",
            fontWeight: "600"
          }}>
            🔓 {getNextUnlock()}
          </div>

          {/* Continue button */}
          <div style={{ textAlign: "center", marginTop: "64px" }}>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/report-5")}
              style={{
                background: "#F28C38",
                color: "white",
                fontWeight: "600",
                fontSize: "19px",
                padding: "16px 44px",
                borderRadius: "9999px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 10px 25px rgba(242, 140, 56, 0.3)"
              }}
            >
              Continue to Report 5 →
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // UNLOCKED STATE (Scan 2+)
  return (
    <div style={{ height: "100vh", background: "#FDFAF5", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 32px", overflowY: "auto", WebkitOverflowScrolling: "touch" }} className="scrollable-container">
      <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ marginBottom: "10px" }}>
            <Logo size="text-4xl" />
          </div>
          <h1 style={{ fontSize: "42px", fontWeight: "bold", color: "#111111", marginBottom: "12px" }}>
            {trendLabel || "Health Trends Over Time"}
          </h1>
          <p style={{ fontSize: "17px", color: "#555555", maxWidth: "680px", margin: "0 auto 8px" }}>
            Based on scan {scanCount} • Tracking changes across your journey
          </p>
          <p style={{ fontSize: "15px", fontStyle: "italic", color: "#666666", marginBottom: "16px" }}>
            {scanCount === 2 && "Baseline comparison active - deltas unlock next"}
            {scanCount === 3 && "Delta indicators revealed - trends emerging"}
            {scanCount === 4 && "Trend labels active - confidence building"}
            {scanCount === 5 && "Confidence scoring enabled - patterns next"}
            {scanCount === 6 && "Pattern recognition active - summary unlocks next"}
            {scanCount >= 7 && "Complete timeline established - all insights available"}
          </p>
        </div>

        {/* Chart Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            marginBottom: "48px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#888888", textTransform: "uppercase", marginBottom: "4px" }}>
                VITALS OVER TIME
              </div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111" }}>
                {trendLabel || "Your Health Journey"}
              </div>
            </div>
            {confidenceScore && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "32px", fontWeight: "bold", color: "#F28C38", marginBottom: "4px" }}>
                  {Math.round(confidenceScore)}%
                </div>
                <div style={{ fontSize: "14px", color: "#888888" }}>
                  Trend Confidence
                </div>
              </div>
            )}
          </div>

          <div style={{ height: "320px" }}>
            <Line data={chartData} options={chartOptions} />
          </div>

          <div style={{ fontSize: "14px", color: "#666666", textAlign: "center", marginTop: "16px" }}>
            {scanCount === 2 && "Two measurements show initial direction. Continue scanning for trend stability."}
            {scanCount >= 3 && scanCount < 5 && "Your vitals are being tracked across multiple scans."}
            {scanCount >= 5 && "Confidence increases with repeated measurements."}
          </div>
        </motion.div>

        {/* Deltas (Scan 3+) */}
        {deltas && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ marginBottom: "48px" }}
          >
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#111111", marginBottom: "16px" }}>
              Since your last scan
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
              {deltas.systolic && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px", color: deltas.systolic.color }}>{deltas.systolic.symbol}</span>
                  <span style={{ fontSize: "16px", color: "#555555" }}>
                    Systolic BP: {deltas.systolic.text}
                  </span>
                </div>
              )}
              {deltas.diastolic && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px", color: deltas.diastolic.color }}>{deltas.diastolic.symbol}</span>
                  <span style={{ fontSize: "16px", color: "#555555" }}>
                    Diastolic BP: {deltas.diastolic.text}
                  </span>
                </div>
              )}
              {deltas.bpm && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px", color: deltas.bpm.color }}>{deltas.bpm.symbol}</span>
                  <span style={{ fontSize: "16px", color: "#555555" }}>
                    Pulse: {deltas.bpm.text}
                  </span>
                </div>
              )}
              {deltas.oxygen && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px", color: deltas.oxygen.color }}>{deltas.oxygen.symbol}</span>
                  <span style={{ fontSize: "16px", color: "#555555" }}>
                    Oxygen: {deltas.oxygen.text}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Insights (Scan 3+) */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
              marginBottom: "48px"
            }}
          >
            {insights.map((insight, idx) => (
              <div
                key={idx}
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "32px" }}>{insight.icon}</span>
                  <span style={{ fontSize: "24px", fontWeight: "bold", color: insight.color }}>
                    {insight.arrow}
                  </span>
                </div>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111" }}>
                  {insight.title}
                </div>
                <div style={{ fontSize: "15px", color: "#555555" }}>
                  {insight.desc}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Long-term Summary (Scan 7+) */}
        {longTermSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              background: "#f0fdf4",
              border: "2px solid #86efac",
              borderRadius: "16px",
              padding: "28px",
              marginBottom: "48px"
            }}
          >
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#16a34a", marginBottom: "12px" }}>
              ✓ Long-Term Summary
            </div>
            <div style={{ fontSize: "16px", color: "#111111", lineHeight: "1.6" }}>
              {longTermSummary}
            </div>
          </motion.div>
        )}

        {/* ========== NEW: RATIO & EFFICIENCY ANALYSIS SECTION ========== */}
        {(scanCount >= 2 || fatMuscleRatioData.status || hydrationData.status || metabolicLoadData.status || energyReserveData.status || muscleEfficiencyData.status || proteinMuscleRatioData.status || metabolicAdvantageData.status) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.27 }}
            style={{
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              border: "2px solid #fbbf24",
              borderRadius: "16px",
              padding: "32px",
              marginBottom: "48px"
            }}
          >
            <div style={{ 
              fontSize: "20px", 
              fontWeight: "bold", 
              color: "#78350f", 
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              ⚖️ Body Ratio & Efficiency Analysis
            </div>
            <div style={{ fontSize: "14px", color: "#92400e", marginBottom: "24px" }}>
              {scanCount < 2 && "Complete 2 scans to unlock fat-muscle ratio analysis"}
              {scanCount === 2 && "Fat-muscle ratio unlocked! Continue for more insights"}
              {scanCount === 3 && "Hydration & metabolic load revealed!"}
              {scanCount === 4 && "Energy & muscle efficiency unlocked!"}
              {scanCount >= 5 && "Full efficiency analysis unlocked! All ratios visible"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              
              {/* Fat-Muscle Ratio (Scan 2+) */}
              {scanCount >= 2 && fatMuscleRatioData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
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
                      ⚖️
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#7f1d1d" }}>Fat-Muscle Ratio</div>
                      <div style={{ fontSize: "12px", color: "#991b1b" }}>Body Composition Balance</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "36px", fontWeight: "bold", color: "#7f1d1d", marginBottom: "8px" }}>
                    {fatMuscleRatioData.value?.toFixed(2)}
                  </div>
                  
                  <div style={{
                    display: "inline-block",
                    background: fatMuscleRatioData.status.includes("High") ? "#fef3c7" : 
                                fatMuscleRatioData.status.includes("Needs") ? "#fed7aa" : 
                                fatMuscleRatioData.status.includes("Good") ? "#dbeafe" : "#d1fae5",
                    color: fatMuscleRatioData.status.includes("High") ? "#92400e" :
                           fatMuscleRatioData.status.includes("Needs") ? "#9a3412" :
                           fatMuscleRatioData.status.includes("Good") ? "#1e40af" : "#065f46",
                    padding: "6px 12px",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "13px",
                    marginBottom: "14px"
                  }}>
                    {fatMuscleRatioData.status}
                  </div>
                  
                  <div style={{ fontSize: "14px", color: "#991b1b", marginBottom: "14px", lineHeight: "1.5" }}>
                    {fatMuscleRatioData.comment}
                  </div>
                  
                  {fatMuscleRatioData.remedy && (
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
                        {fatMuscleRatioData.remedy}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Hydration Efficiency (Scan 3+) */}
              {scanCount >= 3 && hydrationData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
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
                      💧
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1e3a8a" }}>Hydration Efficiency</div>
                      <div style={{ fontSize: "12px", color: "#1e40af" }}>Water-Muscle Balance</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "36px", fontWeight: "bold", color: "#1e3a8a", marginBottom: "8px" }}>
                    {hydrationData.value?.toFixed(1)}%
                  </div>
                  
                  <div style={{
                    display: "inline-block",
                    background: hydrationData.status.includes("Severe") || hydrationData.status.includes("Low") ? "#fee2e2" : 
                                hydrationData.status.includes("Good") ? "#dbeafe" : "#d1fae5",
                    color: hydrationData.status.includes("Severe") || hydrationData.status.includes("Low") ? "#991b1b" :
                           hydrationData.status.includes("Good") ? "#1e40af" : "#065f46",
                    padding: "6px 12px",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "13px",
                    marginBottom: "14px"
                  }}>
                    {hydrationData.status}
                  </div>
                  
                  <div style={{ fontSize: "14px", color: "#1e40af", marginBottom: "14px", lineHeight: "1.5" }}>
                    {hydrationData.comment}
                  </div>
                  
                  {hydrationData.remedy && (
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
                        {hydrationData.remedy}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Metabolic Load (Scan 3+) */}
              {scanCount >= 3 && metabolicLoadData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    background: "linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)",
                    border: "2px solid #fb923c",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(251, 146, 60, 0.15)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #f97316, #ea580c)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      ⚡
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#7c2d12" }}>Metabolic Load</div>
                      <div style={{ fontSize: "12px", color: "#9a3412" }}>Body Stress Level</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "36px", fontWeight: "bold", color: "#7c2d12", marginBottom: "8px" }}>
                    {metabolicLoadData.value?.toFixed(1)}
                  </div>
                  
                  <div style={{
                    display: "inline-block",
                    background: metabolicLoadData.status.includes("Overload") || metabolicLoadData.status.includes("Heavy") ? "#fee2e2" : 
                                metabolicLoadData.status.includes("Moderate") ? "#fef3c7" : "#d1fae5",
                    color: metabolicLoadData.status.includes("Overload") || metabolicLoadData.status.includes("Heavy") ? "#991b1b" :
                           metabolicLoadData.status.includes("Moderate") ? "#92400e" : "#065f46",
                    padding: "6px 12px",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "13px",
                    marginBottom: "14px"
                  }}>
                    {metabolicLoadData.status}
                  </div>
                  
                  <div style={{ fontSize: "14px", color: "#9a3412", marginBottom: "14px", lineHeight: "1.5" }}>
                    {metabolicLoadData.comment}
                  </div>
                  
                  {metabolicLoadData.remedy && (
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
                        {metabolicLoadData.remedy}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Energy Reserve Score (Scan 4+) */}
              {scanCount >= 4 && energyReserveData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  style={{
                    background: "linear-gradient(135deg, #fef3c7 0%, #fde047 100%)",
                    border: "2px solid #facc15",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(250, 204, 21, 0.15)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #eab308, #ca8a04)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      🔋
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#78350f" }}>Energy Reserve</div>
                      <div style={{ fontSize: "12px", color: "#854d0e" }}>Fuel Storage Score</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "36px", fontWeight: "bold", color: "#78350f", marginBottom: "8px" }}>
                    {energyReserveData.value?.toFixed(0)}
                  </div>
                  
                  <div style={{
                    display: "inline-block",
                    background: energyReserveData.status.includes("Critical") || energyReserveData.status.includes("Low") ? "#fee2e2" : 
                                energyReserveData.status.includes("Good") ? "#dbeafe" : "#d1fae5",
                    color: energyReserveData.status.includes("Critical") || energyReserveData.status.includes("Low") ? "#991b1b" :
                           energyReserveData.status.includes("Good") ? "#1e40af" : "#065f46",
                    padding: "6px 12px",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "13px",
                    marginBottom: "14px"
                  }}>
                    {energyReserveData.status}
                  </div>
                  
                  <div style={{ fontSize: "14px", color: "#854d0e", marginBottom: "14px", lineHeight: "1.5" }}>
                    {energyReserveData.comment}
                  </div>
                  
                  {energyReserveData.remedy && (
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
                        {energyReserveData.remedy}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Muscle Efficiency (Scan 4+) */}
              {scanCount >= 4 && muscleEfficiencyData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
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
                      💪
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#064e3b" }}>Muscle Efficiency</div>
                      <div style={{ fontSize: "12px", color: "#065f46" }}>Performance Quality</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "36px", fontWeight: "bold", color: "#064e3b", marginBottom: "8px" }}>
                    {muscleEfficiencyData.value?.toFixed(1)}%
                  </div>
                  
                  <div style={{
                    display: "inline-block",
                    background: muscleEfficiencyData.status.includes("Poor") || muscleEfficiencyData.status.includes("Low") ? "#fee2e2" : 
                                muscleEfficiencyData.status.includes("Good") ? "#dbeafe" : "#d1fae5",
                    color: muscleEfficiencyData.status.includes("Poor") || muscleEfficiencyData.status.includes("Low") ? "#991b1b" :
                           muscleEfficiencyData.status.includes("Good") ? "#1e40af" : "#065f46",
                    padding: "6px 12px",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "13px",
                    marginBottom: "14px"
                  }}>
                    {muscleEfficiencyData.status}
                  </div>
                  
                  <div style={{ fontSize: "14px", color: "#065f46", marginBottom: "14px", lineHeight: "1.5" }}>
                    {muscleEfficiencyData.comment}
                  </div>
                  
                  {muscleEfficiencyData.remedy && (
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
                        {muscleEfficiencyData.remedy}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Protein-Muscle Ratio (Scan 5+) */}
              {scanCount >= 5 && proteinMuscleRatioData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 }}
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
                      🥩
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#581c87" }}>Protein-Muscle Ratio</div>
                      <div style={{ fontSize: "12px", color: "#6b21a8" }}>Building Block Distribution</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "36px", fontWeight: "bold", color: "#581c87", marginBottom: "8px" }}>
                    {proteinMuscleRatioData.value?.toFixed(2)}
                  </div>
                  
                  <div style={{
                    display: "inline-block",
                    background: proteinMuscleRatioData.status.includes("Low") ? "#fee2e2" : 
                                proteinMuscleRatioData.status.includes("Good") ? "#dbeafe" : 
                                proteinMuscleRatioData.status.includes("High") ? "#fef3c7" : "#d1fae5",
                    color: proteinMuscleRatioData.status.includes("Low") ? "#991b1b" :
                           proteinMuscleRatioData.status.includes("Good") ? "#1e40af" :
                           proteinMuscleRatioData.status.includes("High") ? "#92400e" : "#065f46",
                    padding: "6px 12px",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "13px",
                    marginBottom: "14px"
                  }}>
                    {proteinMuscleRatioData.status}
                  </div>
                  
                  <div style={{ fontSize: "14px", color: "#6b21a8", marginBottom: "14px", lineHeight: "1.5" }}>
                    {proteinMuscleRatioData.comment}
                  </div>
                  
                  {proteinMuscleRatioData.remedy && (
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
                        {proteinMuscleRatioData.remedy}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Metabolic Advantage (Scan 5+) */}
              {scanCount >= 5 && metabolicAdvantageData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    background: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
                    border: "2px solid #f9a8d4",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(244, 114, 182, 0.15)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #ec4899, #db2777)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      ⭐
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#831843" }}>Metabolic Advantage</div>
                      <div style={{ fontSize: "12px", color: "#9f1239" }}>Age vs Metabolism</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "36px", fontWeight: "bold", color: "#831843", marginBottom: "8px" }}>
                    {metabolicAdvantageData.value > 0 ? "+" : ""}{metabolicAdvantageData.value?.toFixed(0)} yrs
                  </div>
                  
                  <div style={{
                    display: "inline-block",
                    background: metabolicAdvantageData.status.includes("Very Slow") || metabolicAdvantageData.status.includes("Slow") ? "#fee2e2" : 
                                metabolicAdvantageData.status.includes("Normal") ? "#fef3c7" : 
                                metabolicAdvantageData.status.includes("Good") ? "#dbeafe" : "#d1fae5",
                    color: metabolicAdvantageData.status.includes("Very Slow") || metabolicAdvantageData.status.includes("Slow") ? "#991b1b" :
                           metabolicAdvantageData.status.includes("Normal") ? "#92400e" :
                           metabolicAdvantageData.status.includes("Good") ? "#1e40af" : "#065f46",
                    padding: "6px 12px",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "13px",
                    marginBottom: "14px"
                  }}>
                    {metabolicAdvantageData.status}
                  </div>
                  
                  <div style={{ fontSize: "14px", color: "#9f1239", marginBottom: "14px", lineHeight: "1.5" }}>
                    {metabolicAdvantageData.comment}
                  </div>
                  
                  {metabolicAdvantageData.remedy && (
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
                        {metabolicAdvantageData.remedy}
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
                    Ratio & Efficiency Analysis Locked
                  </div>
                  <div style={{ fontSize: "14px", color: "#9ca3af" }}>
                    Complete {2 - scanCount} more scan{2 - scanCount > 1 ? 's' : ''} to unlock fat-muscle ratio analysis
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Unlock badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            textAlign: "center",
            background: "#fff9f0",
            border: "2px dashed #fed7aa",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "24px",
            fontSize: "15px",
            color: "#ea580c",
            fontWeight: "600"
          }}
        >
          🔓 {getNextUnlock()}
        </motion.div>

        {/* Scan Progress Footer */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#6b7280", marginBottom: "12px" }}>
            {scanCount < 7 ? `Scan ${scanCount} of 7 completed` : "✓ Complete trend analysis established"}
          </div>
          <div style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center" }}>
            {[1, 2, 3, 4, 5, 6, 7].map(num => (
              <div
                key={num}
                style={{
                  width: num <= scanCount ? "36px" : "24px",
                  height: "10px",
                  background: num <= scanCount ? "#F28C38" : "#e5e7eb",
                  borderRadius: "9999px",
                  transition: "all 0.3s"
                }}
              />
            ))}
          </div>
        </div>

        {/* Continue button */}
        <div style={{ textAlign: "center", marginTop: "64px" }}>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/report-5")}
            style={{
              background: "#F28C38",
              color: "white",
              fontWeight: "600",
              fontSize: "19px",
              padding: "16px 44px",
              borderRadius: "9999px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(242, 140, 56, 0.3)"
            }}
          >
            Continue to Report 5 →
          </motion.button>
        </div>
      </div>
    </div>
  );
}
