import { getMetricLaymanExplainer, getReport2Speech } from '../src/voice/reportVoice.js';

const patientData = {
  patient: { name: 'Aarav Sharma', age: 21, gender: 'male' },
  vitals: {
    height: 175,
    weight: 65,
    bodyFat: 12.7,
    muscleMass: 36.4,
    bodyWater: 81.6,
    waterPct: 81.6,
    visceralFat: 1,
    subcutaneousFat: 12.6,
    bmr: 1420,
    systolic: 99,
    diastolic: 63,
    pulse: 72,
    oxygen: 98,
    boneMass: 2.97,
    protein: 11.57,
    fatMuscleRatio: 0.2,
    efficiency: 0.8,
    energyReserve: 1028,
    metabolicLoad: 1.5,
  }
};

console.log("=== Testing Standard Weight Explainer ===");
for (const lang of ['en', 'hi', 'bn']) {
  const stdText = getMetricLaymanExplainer('standardWeight', patientData, lang);
  console.log(`[${lang}] standardWeight:`, stdText);
  if (lang === 'en') {
    if (!stdText.includes('68') || !stdText.includes('65') || !stdText.includes('3')) {
      throw new Error(`English standard weight missing 68kg, 65kg or 3kg gain! Got: ${stdText}`);
    }
  }
}

console.log("\n=== Testing Body Fat Explainer ===");
for (const lang of ['en', 'hi', 'bn']) {
  const fatText = getMetricLaymanExplainer('bodyFat', patientData, lang);
  console.log(`[${lang}] bodyFat:`, fatText);
}

console.log("\n=== Testing Muscle Mass Explainer ===");
for (const lang of ['en', 'hi', 'bn']) {
  const muscleText = getMetricLaymanExplainer('muscleMass', patientData, lang);
  console.log(`[${lang}] muscleMass:`, muscleText);
}

console.log("\n=== Testing Report 2 Non-Contradictory Speech ===");
for (const lang of ['en', 'hi', 'bn']) {
  const r2Text = getReport2Speech(patientData, lang);
  console.log(`[${lang}] Report 2:`, r2Text);
  if (lang === 'en') {
    // Muscle should NOT be called the strongest area when user is underweight/low muscle
    if (r2Text.includes('strength today is muscle')) {
      throw new Error('Contradiction detected: Muscle was called strongest area when user has low muscle!');
    }
    if (!r2Text.includes('68') || !r2Text.includes('65') || !r2Text.includes('3')) {
      throw new Error('Report 2 did not include standard weight comparison!');
    }
  }
}

console.log("\n✅ ALL USER SCENARIO TESTS PASSED PERFECTLY!");
