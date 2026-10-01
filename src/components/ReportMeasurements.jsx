import { useEffect, useState } from 'react';
import Logo from './Logo';
import { useHealth } from '../context/HealthContext';
import { useSpeech } from '../context/SpeechContext';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';
import { getScanCount, reportMeasurements } from '../utils/reportSnapshot';
import { answerReportQuestion } from '../voice/reportQuestions';

const wording = {
  en: { title: 'Health screening report', today: 'Today’s measurements', journey: 'Your health journey', baseline: 'This visit is your baseline. Your next visit can compare these measurements.', private: 'This chart uses only visits unlocked with your name and PIN on this kiosk.', ask: 'Ask about your report', listening: 'Listening… ask your question', next: 'What will my next visit tell me?', improve: 'What can I improve?', missing: 'Not measured', caution: 'Screening information only. This is not a diagnosis or a substitute for a clinician.' },
  hi: { title: 'स्वास्थ्य जाँच रिपोर्ट', today: 'आज के माप', journey: 'आपकी स्वास्थ्य यात्रा', baseline: 'यह आपकी पहली जाँच है। अगली बार आज के मापों से तुलना होगी।', private: 'इस चार्ट में केवल आपके नाम और PIN से जुड़ी जाँच शामिल हैं।', ask: 'रिपोर्ट के बारे में पूछें', listening: 'सुन रहे हैं… सवाल पूछें', next: 'अगली जाँच क्या बताएगी?', improve: 'मुझे क्या सुधारना चाहिए?', missing: 'माप नहीं मिला', caution: 'यह प्रारंभिक जाँच है, बीमारी का निदान नहीं। स्वास्थ्य सलाह के लिए चिकित्सक से बात करें।' },
  bn: { title: 'স্বাস্থ্য পরীক্ষার রিপোর্ট', today: 'আজকের পরিমাপ', journey: 'আপনার স্বাস্থ্যের যাত্রা', baseline: 'এটি আপনার প্রথম পরীক্ষা। পরেরবার আজকের মাপের সঙ্গে তুলনা করা যাবে।', private: 'এই চার্টে শুধুমাত্র আপনার নাম ও PIN দিয়ে খোলা পরীক্ষাগুলি আছে।', ask: 'রিপোর্ট নিয়ে প্রশ্ন করুন', listening: 'শুনছি… প্রশ্ন করুন', next: 'পরের পরীক্ষা কী জানাবে?', improve: 'কী উন্নতি করতে পারি?', missing: 'পরিমাপ হয়নি', caution: 'এটি প্রাথমিক পরীক্ষার তথ্য, রোগ নির্ণয় নয়। চিকিৎসকের পরামর্শ নিন।' },
};
const trends = [['systolic','Systolic BP','mmHg','#e96922'], ['diastolic','Diastolic BP','mmHg','#c65d33'], ['oxygen','Oxygen','%','#187d86'], ['bpm','Pulse','bpm','#7956a3'], ['temperature','Temperature','°F','#b35a4a'], ['weight','Weight','kg','#39785c']];

function TrendCard({ field, label, unit, color, history }) {
  const scans = history.slice(-7);
  const points = scans.map((scan, i) => ({ i, value: Number(scan[field]), valid: scan[field] !== null && scan[field] !== undefined && Number(scan[field]) > 0 }));
  const present = points.filter(p => p.valid);
  if (!present.length) return null;
  const values = present.map(p => p.value);
  const low = Math.min(...values), high = Math.max(...values);
  const padding = Math.max(1, (high - low) * .15);
  const x = i => 30 + (i / Math.max(points.length - 1, 1)) * 260;
  const y = value => 106 - ((value - low + padding) / (high - low + padding * 2)) * 84;
  const lines = [];
  let run = [];
  points.forEach(p => { if (p.valid) run.push(p); else { if (run.length > 1) lines.push(run); run = []; } });
  if (run.length > 1) lines.push(run);
  const prior = present.length > 1 ? present.at(-2).value : null;
  const delta = prior === null ? null : Number((present.at(-1).value - prior).toFixed(1));
  return <figure className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
    <figcaption className="flex justify-between gap-3 font-semibold text-slate-900"><span>{label}</span><span style={{ color }}>{present.at(-1).value} {unit}</span></figcaption>
    <svg viewBox="0 0 320 140" role="img" aria-label={`${label}: ${present.map(p => `visit ${p.i + 1} ${p.value} ${unit}`).join(', ')}`} className="mt-2 w-full max-h-36">
      <path d="M28 106H290" stroke="#cbd5e1" fill="none" />
      {lines.map((line, i) => <polyline key={i} points={line.map(p => `${x(p.i)},${y(p.value)}`).join(' ')} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />)}
      {present.map(p => <g key={p.i}><circle cx={x(p.i)} cy={y(p.value)} r="5" fill={color} /><text x={x(p.i)} y="128" textAnchor="middle" fontSize="11" fill="#475569">{Math.max(1, history.length - 6) + p.i}</text></g>)}
    </svg>
    <p className="text-sm text-slate-600">{delta === null ? 'First measured value' : `${delta > 0 ? '+' : ''}${delta} ${unit} since the previous measured visit. Changes need clinical context.`}</p>
  </figure>;
}

export default function ReportMeasurements() {
  const { data } = useHealth();
  const { speakText, stop } = useSpeech();
  const voice = useVoiceAssistant();
  const [language, setLanguage] = useState(() => sessionStorage.getItem('reliv_report_speech_lang') || localStorage.getItem('reliv_report_speech_language') || data.reportSpeechLanguage || data.language || 'en');
  const words = wording[language] || wording.en;
  const [listening, setListening] = useState(false);
  const history = Array.isArray(data.history) ? data.history : [];
  const readings = reportMeasurements(data.vitals);
  const height = Number(data.vitals?.height), weight = Number(data.vitals?.weight);
  if (height > 0 && weight > 0) readings.push({ key:'bmi', label:'BMI (calculated)', unit:'kg/m²', value:Number((weight / (height / 100) ** 2).toFixed(1)) });
  useEffect(() => {
    const changed = event => setLanguage(event.detail);
    window.addEventListener('reliv_report_language_change', changed);
    return () => window.removeEventListener('reliv_report_language_change', changed);
  }, []);
  useEffect(() => {
    const reply = event => { setListening(false); speakText(answerReportQuestion(event.detail, data, language), { langHint:language }); };
    window.addEventListener('reliv_report_question', reply);
    return () => window.removeEventListener('reliv_report_question', reply);
  }, [data, language, speakText]);
  useEffect(() => { if (!listening) return undefined; const timer = setTimeout(() => setListening(false), 21000); return () => clearTimeout(timer); }, [listening]);
  const ask = text => { stop(); setListening(false); speakText(answerReportQuestion(text, data, language), { langHint:language }); };
  return <section aria-label="Health screening report" className="touch-pan-y bg-[#fffaf6] px-4 py-8 text-slate-900 sm:px-8">
    <div className="mx-auto max-w-5xl rounded-3xl border border-orange-100 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-orange-100 pb-6"><Logo size="text-4xl" /><div className="text-right text-sm text-slate-600"><p className="text-xl font-bold text-slate-900">{words.title}</p><p>{data.patient?.name || 'Patient'} · Visit {getScanCount(data)}</p><p>Report {String(data.sessionId || '').slice(0, 36)}</p></div></div>
      <h2 className="mt-6 text-2xl font-bold">{words.today}</h2>
      <p className="mt-2 text-sm text-slate-600">{history.length > 1 ? words.private : words.baseline}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{readings.map(item => <div key={item.key} className="rounded-xl border border-slate-100 bg-[#fffaf6] p-4"><dt className="text-sm text-slate-600">{item.label}</dt><dd className="mt-1 text-xl font-semibold">{item.value === null ? words.missing : `${item.value} ${item.unit}`}</dd></div>)}</dl>
      <div className="mt-8 border-t border-orange-100 pt-6"><h3 className="text-2xl font-bold">{words.journey}</h3><p className="mt-2 text-sm text-slate-600">{history.length > 1 ? words.private : words.baseline}</p>{history.length > 1 && <div className="mt-4 grid gap-4 md:grid-cols-2">{trends.map(([field,label,unit,color]) => <TrendCard key={field} field={field} label={label} unit={unit} color={color} history={history} />)}</div>}</div>
      <div className="mt-8 rounded-2xl bg-orange-50 p-5"><h3 className="text-lg font-bold">{words.ask}</h3><div className="mt-3 flex flex-wrap gap-2">{trends.map(([,label]) => <button key={label} type="button" onClick={() => ask(label)} className="min-h-11 rounded-xl bg-white px-4 text-sm font-semibold text-orange-800 shadow-sm">{label}</button>)}<button type="button" onClick={() => ask('next visit')} className="min-h-11 rounded-xl bg-white px-4 text-sm font-semibold text-orange-800 shadow-sm">{words.next}</button><button type="button" onClick={() => ask('improve')} className="min-h-11 rounded-xl bg-white px-4 text-sm font-semibold text-orange-800 shadow-sm">{words.improve}</button>{voice?.isConnected && voice?.micDevice && <button type="button" disabled={listening} onClick={() => { stop(); setListening(true); window.dispatchEvent(new Event('reliv_report_ask_start')); }} className="min-h-11 rounded-xl bg-orange-600 px-5 font-semibold text-white disabled:opacity-60">{listening ? words.listening : `🎙 ${words.ask}`}</button>}</div></div>
      <p className="mt-7 border-t border-orange-100 pt-4 text-sm text-slate-600">{words.caution}</p>
    </div>
  </section>;
}
