function round5(val) {
  return Math.round(val * 10) / 10.0;
}

function calc_bmi(weight, height) {
  return weight / ((height / 100) ** 2);
}

function calc_ffm(weight, height, age, impedance, sex = 1) {
  const ht2_z = (height ** 2) / impedance;
  if (sex === 1) { // Male
    return 0.7374 * ht2_z + 0.1763 * weight - 0.1773 * age - 2.4658;
  } else { // Female
    return 0.3614 * ht2_z + 0.1692 * weight + 14.595;
  }
}

function calc_fat_percent(weight, height, sex, age, impedance) {
  const ffm = calc_ffm(weight, height, age, impedance, sex);
  let fat_percent = ((weight - ffm) / weight) * 100;
  
  if (sex === 1) {
    fat_percent = Math.min(Math.max(fat_percent, 4), 40);
  } else {
    fat_percent = Math.min(Math.max(fat_percent, 10), 45);
  }
  return round5(fat_percent);
}

function calc_bmr(weight, height, sex, age) {
  let val;
  if (sex === 1) { // Male
    val = 10 * weight + 6.25 * height - 5 * age + 5;
  } else { // Female
    val = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  return Math.max(500, Math.min(Math.round(val * 10) / 10.0, 5000));
}

function calc_metabolic_age(bmr, age, sex) {
  const refBMR = {
    male: { 20: 1700, 30: 1650, 40: 1600, 50: 1550, 60: 1500, 70: 1450 },
    female: { 20: 1350, 30: 1300, 40: 1250, 50: 1200, 60: 1150, 70: 1100 }
  };
  const gender = sex === 1 ? 'male' : 'female';
  const ageBrackets = Object.keys(refBMR[gender]).map(Number);
  const closestAge = ageBrackets.reduce((prev, curr) => 
    (Math.abs(curr - age) < Math.abs(prev - age) ? curr : prev)
  );
  const averageBMRForAge = refBMR[gender][closestAge];
  const bmrDifference = bmr - averageBMRForAge;
  const ageDifference = bmrDifference / 27.5;
  const metabolicAge = age - ageDifference;
  return Math.max(18, Math.min(Math.round(metabolicAge), 80));
}

function calc_healthy_weight_range(height) {
  const height_m = height / 100;
  return {
    min: round5(18.5 * height_m * height_m),
    max: round5(24.9 * height_m * height_m)
  };
}

function calc_muscle_percent(weight, height, sex, age, impedance) {
  const fat_percent = calc_fat_percent(weight, height, sex, age, impedance);
  let bone_mass;
  if (sex === 1) bone_mass = 0.1 * weight + 0.02 * height - 6.0;
  else bone_mass = 0.1 * weight + 0.02 * height - 7.5;
  const bone_percent = (bone_mass / weight) * 100;
  
  let raw_musclePercent = (100 - fat_percent - bone_percent) * 0.55;
  
  if (sex === 1) {
    if (age < 60) raw_musclePercent = Math.max(27, Math.min(raw_musclePercent, 46));
    else raw_musclePercent = Math.max(24, Math.min(raw_musclePercent, 42));
  } else {
    if (age < 60) raw_musclePercent = Math.max(24, Math.min(raw_musclePercent, 38));
    else raw_musclePercent = Math.max(20, Math.min(raw_musclePercent, 34));
  }
  return round5(raw_musclePercent);
}

function calc_muscle_mass(weight, muscle_percent) {
  return weight > 0 ? round5(weight * muscle_percent / 100) : 0;
}

const profiles = [
  { name: 'Average Male', weight: 75, height: 175, age: 30, sex: 1, impedance: 500 },
  { name: 'Average Female', weight: 60, height: 160, age: 28, sex: 0, impedance: 600 },
  { name: 'Athletic Male', weight: 80, height: 180, age: 25, sex: 1, impedance: 400 },
  { name: 'Overweight Female', weight: 80, height: 158, age: 45, sex: 0, impedance: 700 }
];

console.log("=== PHASE 2 TEST CASES ===");
profiles.forEach(p => {
  const bmr = calc_bmr(p.weight, p.height, p.sex, p.age);
  const metabolicAge = calc_metabolic_age(bmr, p.age, p.sex);
  const healthyRange = calc_healthy_weight_range(p.height);
  const musclePercent = calc_muscle_percent(p.weight, p.height, p.sex, p.age, p.impedance);
  const absoluteMuscleMass = calc_muscle_mass(p.weight, musclePercent);

  console.log(`\n--- ${p.name} ---`);
  console.log(`BMR: ${bmr} kcal/day`);
  console.log(`Metabolic Age: ${metabolicAge} years (Actual: ${p.age})`);
  console.log(`Healthy Weight Range: ${healthyRange.min} kg - ${healthyRange.max} kg (Actual: ${p.weight} kg)`);
  console.log(`Skeletal Muscle Mass: ${absoluteMuscleMass} kg (${musclePercent}%)`);
});
