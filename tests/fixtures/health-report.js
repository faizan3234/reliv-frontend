export const MOCK_TEST_REPORT = {
  sessionId: "KSK-DEMO-2026",
  patient: {
    name: "Rahul Sen",
    age: "23",
    email: "rahul.sen@campus.edu",
    phone: "9876543210",
    gender: "male",
  },
  vitals: {
    systolic: 118,
    diastolic: 76,
    oxygen: 99,
    bpm: 72,
    temperature: 98.4,
    leftEye: "6/6",
    rightEye: "6/6",
    weight: 68.5,
    height: 175.0,
    impedance: 485,
    bodyFat: 16.2,
    visceralFat: 4,
    muscleMass: 54.8,
    bodyWater: 61.2,
    boneMass: 3.1,
    bmr: 1680,
    metabolicAge: 21,
    skeletalMuscle: 34.2,
    ffmi: 19.8,
    isAthlete: false,
  },
  history: [
    { date: "10 Aug", score: 82, weight: 70.0, systolic: 124, diastolic: 82, vitals: { weight: 70.0, height: 175.0, systolic: 124, diastolic: 82, oxygen: 98, bpm: 75, temperature: 98.6 } },
    { date: "18 Aug", score: 85, weight: 69.2, systolic: 120, diastolic: 78, vitals: { weight: 69.2, height: 175.0, systolic: 120, diastolic: 78, oxygen: 98, bpm: 74, temperature: 98.4 } },
    { date: "25 Aug", score: 89, weight: 68.5, systolic: 118, diastolic: 76, vitals: { weight: 68.5, height: 175.0, systolic: 118, diastolic: 76, oxygen: 99, bpm: 72, temperature: 98.4 } }
  ],
  ecoStats: {
    paperSavedSheets: 14,
    co2SavedGrams: 85
  },
  paymentVerified: true,
};
