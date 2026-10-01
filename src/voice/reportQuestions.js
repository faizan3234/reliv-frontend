const translations = {
  en: {
    missing: 'This measurement was not recorded today. Please repeat the scan if the sensor did not respond.',
    unchanged: 'It is the same as the previous visit. Two readings alone cannot establish a long-term pattern.',
    previous: (a, b, unit) => `It was ${a} ${unit} last visit and is ${b} ${unit} today.`,
    first: 'This is your baseline. On your next visit Reliv can compare these measurements with today.',
    next: 'Your next visit can show how the same measurements change over time. Keep measuring under similar conditions.',
    general: 'I can explain your blood pressure, oxygen, pulse, temperature, weight or how this visit compares with your last one. Which would you like?',
    advice: 'Look at the readings and their changes together. If you feel unwell or a reading worries you, speak to a qualified clinician. This kiosk cannot diagnose a condition.',
    current: (value, unit) => `Today the reading is ${value} ${unit}.`,
  },
  hi: {
    missing: 'आज यह माप दर्ज नहीं हुआ। अगर सेंसर ने जवाब नहीं दिया, तो जाँच दोबारा करें।',
    unchanged: 'पिछली बार जितना ही है। केवल दो मापों से लंबे समय का रुझान तय नहीं होता।',
    previous: (a, b, unit) => `पिछली बार ${a} ${unit} था और आज ${b} ${unit} है।`,
    first: 'यह आपकी पहली जाँच है। अगली बार हम आज के मापों से तुलना कर सकेंगे।',
    next: 'अगली जाँच में इन्हीं मापों का बदलाव दिखेगा। कोशिश करें कि हर बार समान परिस्थिति में जाँच हो।',
    general: 'मैं बी पी, ऑक्सीजन, नाड़ी, तापमान, वज़न या पिछली जाँच से बदलाव समझा सकता हूँ। आप क्या जानना चाहेंगे?',
    advice: 'मापों और उनके बदलाव को साथ में देखें। तबीयत खराब हो या कोई माप चिंता दे, तो डॉक्टर से बात करें। किओस्क बीमारी का निदान नहीं करता।',
    current: (value, unit) => `आज का माप ${value} ${unit} है।`,
  },
  bn: {
    missing: 'আজ এই পরিমাপ পাওয়া যায়নি। সেন্সর কাজ না করলে আবার পরীক্ষা করুন।',
    unchanged: 'আগেরবারের সমান। শুধু দুটি পরিমাপ দিয়ে দীর্ঘমেয়াদি পরিবর্তন বোঝা যায় না।',
    previous: (a, b, unit) => `আগেরবার ${a} ${unit} ছিল, আজ ${b} ${unit}।`,
    first: 'এটাই আপনার প্রথম পরীক্ষার ভিত্তি। পরেরবার আজকের ফলের সঙ্গে তুলনা করা যাবে।',
    next: 'পরের পরীক্ষায় একই পরিমাপের পরিবর্তন দেখা যাবে। একই পরিস্থিতিতে পরীক্ষা করার চেষ্টা করুন।',
    general: 'রক্তচাপ, অক্সিজেন, পালস, তাপমাত্রা, ওজন বা আগের পরীক্ষার সঙ্গে পরিবর্তন বোঝাতে পারি। কোনটি জানতে চান?',
    advice: 'সব পরিমাপ ও পরিবর্তন একসঙ্গে দেখুন। অসুস্থ লাগলে বা কোনও ফল নিয়ে চিন্তা হলে চিকিৎসকের সঙ্গে কথা বলুন। এই কিয়স্ক রোগ নির্ণয় করে না।',
    current: (value, unit) => `আজকের পরিমাপ ${value} ${unit}।`,
  },
};

const topics = [
  { keys: ['blood pressure','bp','pressure','रक्तचाप','ब्लड प्रेशर','बी पी','রক্তচাপ','প্রেশার'], field: 'systolic', other: 'diastolic', unit: 'mmHg' },
  { keys: ['oxygen','spo2','ऑक्सीजन','ऑक्सिजन','অক্সিজেন'], field: 'oxygen', unit: '%' },
  { keys: ['pulse','heart rate','heartbeat','bpm','धड़कन','नाड़ी','পালস','হার্ট'], field: 'bpm', unit: 'bpm' },
  { keys: ['temperature','fever','तापमान','बुखार','তাপমাত্রা','জ্বর'], field: 'temperature', unit: '°F' },
  { keys: ['weight','वजन','वज़न','ওজন'], field: 'weight', unit: 'kg' },
];

export function answerReportQuestion(question, data, language = 'en') {
  const copy = translations[language] || translations.en;
  const input = String(question || '').toLocaleLowerCase().trim();
  const history = Array.isArray(data?.history) ? data.history : [];
  if (/next|future|अगली|अगले|পরের|পরে/.test(input)) return copy.next;
  if (/improv|advice|help|better|क्या कर|सुधार|কী কর|উন্নতি/.test(input)) return copy.advice;
  const topic = topics.find(item => item.keys.some(key => input.includes(key)));
  if (!topic) return copy.general;
  const present = data?.vitals || {};
  const value = Number(present[topic.field]);
  const second = topic.other && Number(present[topic.other]);
  if (!Number.isFinite(value) || value <= 0 || (topic.other && (!Number.isFinite(second) || second <= 0))) return copy.missing;
  const formatted = topic.other ? `${value}/${second}` : value;
  const earlier = history.slice(0, -1).reverse().find(point => Number(point[topic.field]) > 0 && (!topic.other || Number(point[topic.other]) > 0));
  if (!earlier) return `${copy.current(formatted, topic.unit)} ${copy.first}`;
  const before = topic.other ? `${earlier[topic.field]}/${earlier[topic.other]}` : earlier[topic.field];
  return `${copy.previous(before, formatted, topic.unit)} ${String(before) === String(formatted) ? copy.unchanged : copy.advice}`;
}

export const measurementNames = {
  en: { height:'Height', weight:'Weight', systolic:'Systolic pressure', diastolic:'Diastolic pressure', oxygen:'Oxygen', bpm:'Pulse', temperature:'Temperature', bmi:'BMI (calculated)' },
  hi: { height:'लंबाई', weight:'वज़न', systolic:'ऊपरी रक्तचाप', diastolic:'निचला रक्तचाप', oxygen:'ऑक्सीजन', bpm:'नाड़ी', temperature:'तापमान', bmi:'बी एम आई (गणना)' },
  bn: { height:'উচ্চতা', weight:'ওজন', systolic:'উপরের রক্তচাপ', diastolic:'নিচের রক্তচাপ', oxygen:'অক্সিজেন', bpm:'পালস', temperature:'তাপমাত্রা', bmi:'বি এম আই (হিসাব)' },
};

export function reportNarration(data, language = 'en') {
  const lang = ['en','hi','bn'].includes(language) ? language : 'en';
  const names = measurementNames[lang];
  const intro = { en:'Here are your recorded measurements today.', hi:'आज दर्ज किए गए आपके माप ये हैं।', bn:'আজ নথিভুক্ত আপনার পরিমাপগুলি শুনুন।' }[lang];
  const units = { en:['centimetres','kilograms','millimetres of mercury','millimetres of mercury','percent','beats per minute','degrees Fahrenheit'], hi:['सेंटीमीटर','किलोग्राम','मिलीमीटर मर्करी','मिलीमीटर मर्करी','प्रतिशत','प्रति मिनट','डिग्री फ़ारेनहाइट'], bn:['সেন্টিমিটার','কিলোগ্রাম','মিলিমিটার পারদ','মিলিমিটার পারদ','শতাংশ','প্রতি মিনিট','ডিগ্রি ফারেনহাইট'] }[lang];
  const missing = { en:'not measured', hi:'माप नहीं मिला', bn:'পরিমাপ পাওয়া যায়নি' }[lang];
  const lines = ['height','weight','systolic','diastolic','oxygen','bpm','temperature'].map((key,i) => {
    const value = Number(data?.vitals?.[key]);
    return `${names[key]}: ${Number.isFinite(value) && value > 0 ? `${value} ${units[i]}` : missing}.`;
  });
  return [intro, ...lines, translations[lang].next, translations[lang].advice].join(' ');
}
