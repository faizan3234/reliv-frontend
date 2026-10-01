export function getScanCount(data) {
  const count = Number(data?.scanCount);
  return Number.isSafeInteger(count) && count > 0 ? count : 1;
}

export function reportMeasurements(vitals = {}) {
  const fields = [
    ['height', 'Height', 'cm'], ['weight', 'Weight', 'kg'],
    ['systolic', 'Systolic pressure', 'mmHg'], ['diastolic', 'Diastolic pressure', 'mmHg'],
    ['bpm', 'Pulse', 'bpm'], ['oxygen', 'Oxygen', '%'], ['temperature', 'Temperature', '°F'],
  ];
  return fields.map(([key, label, unit]) => ({ key, label, unit,
    value: Number.isFinite(Number(vitals[key])) && Number(vitals[key]) > 0 ? Number(vitals[key]) : null,
  }));
}
