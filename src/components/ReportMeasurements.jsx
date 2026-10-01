import { useHealth } from '../context/HealthContext';
import { getScanCount, reportMeasurements } from '../utils/reportSnapshot';

export default function ReportMeasurements() {
  const { data } = useHealth();
  const readings = reportMeasurements(data.vitals);
  const count = getScanCount(data);
  const height = Number(data.vitals?.height), weight = Number(data.vitals?.weight);
  if (height > 0 && weight > 0) readings.push({ key: 'bmi', label: 'BMI (calculated)', unit: 'kg/m²', value: Number((weight / ((height / 100) ** 2)).toFixed(1)) });
  return <section aria-label="Current scan measurements" className="bg-orange-50 px-5 py-6 text-slate-900">
    <div className="mx-auto max-w-5xl">
      <h2 className="text-2xl font-bold">Your current measurements</h2>
      <p className="mt-2 text-sm">{data.identityLinked ? `Visit ${count} linked to your email on this kiosk.` : 'Current visit. Add your email at the start of future visits to link their count.'} Your available readings are shown from the first scan.</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {readings.map(item => <div key={item.key} className="rounded-xl bg-white p-4">
          <dt className="text-sm text-slate-600">{item.label}</dt>
          <dd className="mt-1 text-xl font-semibold">{item.value === null ? 'Not measured' : `${item.value} ${item.unit}`}</dd>
        </div>)}
      </dl>
      {!Number(data.vitals?.impedance) && <p className="mt-4 text-sm">No body-composition measurement was received. Any calculated body-fat or muscle estimates below are not direct sensor readings. Your measured values remain available.</p>}
      {!(data.history?.length) && <p className="mt-2 text-sm">Earlier measurement values are not loaded. A visit count alone does not establish a health trend.</p>}
      <p className="mt-2 text-sm">Read your report here; no phone scan or Wi-Fi reconnection is needed.</p>
    </div>
  </section>;
}
