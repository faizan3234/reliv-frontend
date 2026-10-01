import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHealth } from '../context/HealthContext';
import { useSpeech } from '../context/SpeechContext';
import { useVoicePage } from '../hooks/useVoicePage';
import { readBrowserStorage, writeBrowserStorage } from '../utils/browserStorage';
import { measurementNames } from '../voice/reportQuestions';
import { answerReportQuestion } from '../voice/reportQuestions';

const content = {
  en: { heading:'Understanding your results', direction:'Changes since your last measured visit', equal:'unchanged', higher:'higher', lower:'lower', noHistory:'The next visit can compare these same measurements. Your first visit is a useful baseline.', next:'What comes next', nextText:'Repeat the same measurements at your next visit. More real observations make the comparison more useful; missing readings remain missing.', safety:'Numbers can change with time, activity and measurement conditions. A change alone does not diagnose a problem. Speak to a qualified clinician if you feel unwell or a reading concerns you.', finish:'Finish and clear my report', language:'Hear my report in', advice:'Questions? Tap any measurement above or use the microphone to ask.', noData:'There is no measured value to compare for this item.' },
  hi: { heading:'अपनी रिपोर्ट समझें', direction:'पिछली जाँच से बदलाव', equal:'जितना ही', higher:'अधिक', lower:'कम', noHistory:'अगली जाँच में इन्हीं मापों से तुलना होगी। पहली जाँच भी उपयोगी आधार है।', next:'अगली जाँच में क्या होगा', nextText:'अगली बार यही माप फिर लें। असली माप जितने होंगे, तुलना उतनी उपयोगी होगी। जो माप नहीं मिले, उन्हें खाली रखा जाएगा।', safety:'समय और जाँच की परिस्थिति से माप बदल सकते हैं। केवल बदलाव से बीमारी तय नहीं होती। तबीयत खराब लगे या कोई माप चिंता दे तो डॉक्टर से बात करें।', finish:'समाप्त करें और रिपोर्ट हटाएँ', language:'रिपोर्ट की आवाज़', advice:'सवाल है? ऊपर कोई माप चुनें या माइक्रोफ़ोन दबाएँ।', noData:'इस माप के लिए तुलना उपलब्ध नहीं है।' },
  bn: { heading:'আপনার রিপোর্ট বুঝুন', direction:'আগের পরীক্ষার সঙ্গে পরিবর্তন', equal:'একই', higher:'বেশি', lower:'কম', noHistory:'পরের পরীক্ষায় এই মাপগুলির সঙ্গে তুলনা করা যাবে। প্রথম পরীক্ষাও একটি দরকারি ভিত্তি।', next:'পরের পরীক্ষায় কী হবে', nextText:'পরেরবার একই মাপ নিন। বাস্তব পরিমাপ বাড়লে তুলনা আরও উপকারী হবে। অনুপস্থিত তথ্য ফাঁকা থাকবে।', safety:'সময় ও পরীক্ষার পরিস্থিতিতে সংখ্যা বদলাতে পারে। শুধু পরিবর্তন দেখে রোগ নির্ণয় হয় না। অসুস্থ লাগলে বা চিন্তা হলে চিকিৎসকের পরামর্শ নিন।', finish:'শেষ করে রিপোর্ট মুছুন', language:'রিপোর্টের ভাষা', advice:'প্রশ্ন আছে? উপরের কোনও মাপ বা মাইক্রোফোন স্পর্শ করুন।', noData:'এই মাপের তুলনা পাওয়া যায়নি।' },
};
const fields = [
  { name:'Blood pressure', keys:['systolic','diastolic'], unit:'mmHg' },
  { name:'Oxygen', keys:['oxygen'], unit:'%' },
  { name:'Pulse', keys:['bpm'], unit:'bpm' },
  { name:'Temperature', keys:['temperature'], unit:'°F' },
  { name:'Weight', keys:['weight'], unit:'kg' },
];

export default function UnifiedReport() {
  const navigate = useNavigate();
  const { data, resetHealth } = useHealth();
  const { speakText, stop } = useSpeech();
  const [language, setLanguage] = useState(() => readBrowserStorage('reliv_report_speech_lang', 'sessionStorage') || data.language || 'en');
  const words = content[language] || content.en;
  const history = Array.isArray(data.history) ? data.history : [];
  const previous = history.slice(0,-1).reverse();
  useVoicePage({ onHelp: () => speakText(answerReportQuestion('what is next', data, language), { langHint:language }), idleEnabled:false });

  useEffect(() => {
    const changed = event => setLanguage(event.detail);
    window.addEventListener('reliv_report_language_change', changed);
    return () => window.removeEventListener('reliv_report_language_change', changed);
  }, []);
  useEffect(() => {
    let timer;
    const clear = () => { clearTimeout(timer); timer = setTimeout(() => { stop(); resetHealth(); navigate('/', { replace:true }); }, 120000); };
    ['pointerdown','touchstart','scroll','keydown'].forEach(type => window.addEventListener(type, clear, { passive:true }));
    clear();
    return () => { clearTimeout(timer); ['pointerdown','touchstart','scroll','keydown'].forEach(type => window.removeEventListener(type, clear)); };
  }, [navigate, resetHealth, stop]);
  const selectLanguage = code => {
    setLanguage(code);
    writeBrowserStorage('reliv_report_speech_lang', code, 'sessionStorage');
    window.dispatchEvent(new CustomEvent('reliv_report_language_change', { detail:code }));
    stop();

  };
  const comparisons = fields.map(field => {
    const current = field.keys.map(key => Number(data.vitals?.[key]));
    const earlier = previous.find(point => field.keys.every(key => Number(point[key]) > 0));
    return { ...field, current, earlier: earlier && field.keys.map(key => Number(earlier[key])), available:field.keys.every((key, i) => data.vitals?.[key] !== null && data.vitals?.[key] !== undefined && current[i] > 0) };
  });
  return <main className="touch-pan-y min-h-screen overflow-y-auto bg-[#fffaf6] px-4 pb-16 text-slate-900 sm:px-8">
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold">{words.heading}</h2>
        <p className="mt-2 text-slate-600">{history.length > 1 ? words.direction : words.noHistory}</p>
        {history.length > 1 && <div className="mt-5 grid gap-3 md:grid-cols-2">{comparisons.map(field => <div key={field.name} className="rounded-2xl bg-orange-50 p-4">
          <h3 className="font-semibold">{(measurementNames[language] || measurementNames.en)[field.keys[0]]}</h3>
          {!field.available ? <p className="mt-2 text-slate-600">{words.noData}</p> : <><p className="mt-2 text-lg font-bold">{field.current.join('/')} {field.unit}</p>
          {field.earlier && <p className="text-sm text-slate-600">{field.earlier.join('/')} → {field.current.join('/')} {field.unit} · {field.current[0] === field.earlier[0] ? words.equal : field.current[0] > field.earlier[0] ? words.higher : words.lower}</p>}</>}
        </div>)}</div>}
      </section>
      <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-bold">{words.next}</h2><p className="mt-3 text-slate-700">{words.nextText}</p><p className="mt-3 text-slate-600">{words.safety}</p></section>
      <section className="rounded-3xl bg-orange-50 p-6"><p className="font-semibold">{words.language}</p><div className="mt-3 flex flex-wrap gap-3">{[['en','English'],['hi','हिंदी'],['bn','বাংলা']].map(([code,label]) => <button key={code} type="button" onClick={() => selectLanguage(code)} className={`min-h-12 rounded-xl px-5 font-bold ${language === code ? 'bg-orange-600 text-white' : 'bg-white text-orange-800'}`}>{label}</button>)}</div><p className="mt-3 text-sm text-slate-700">{words.advice}</p></section>
      <button type="button" onClick={() => { stop(); resetHealth(); navigate('/feedback', { replace:true }); }} className="w-full min-h-16 rounded-2xl bg-orange-600 px-6 text-xl font-bold text-white active:scale-[.99]">{words.finish}</button>
    </div>
  </main>;
}
