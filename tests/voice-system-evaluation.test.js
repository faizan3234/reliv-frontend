import { isHelpRequest } from '../src/voice/helpIntent.js';
import { parsePaymentVoice } from '../src/voice/paymentVoice.js';
import {
  parseReportLanguageChoice,
  getReport1Speech,
  getReport2Speech,
  getReport3Speech,
  getReport4Speech,
  getReport5Speech,
  METRIC_EXPLAINERS,
  getMetricLaymanExplainer
} from '../src/voice/reportVoice.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`❌ FAILED: ${message}`);
  }
}

console.log('--- 1. Testing isHelpRequest ---');
const helpQueries = [
  'ab kya karna hai', 'ab kya krna hai', 'kya karna hai', 'kaise karna hai', 'kaise krna hai',
  'ki korbo', 'ki korbo abar', 'ki kerom korte hobe', 'ki bhabe korbo', 'kibhabe korbo',
  'what to do now', 'how to do it', 'what is the next step', 'help me', 'guide me',
  'gyuide me', 'samajh nahi aa raha', 'madad kijiye', 'কি করবো', 'কীভাবে করব',
  'কি রকম করতে হবে', 'সাহায্য করুন', 'अब क्या करना है', 'मदद कीजिए'
];
for (const q of helpQueries) {
  assert(isHelpRequest(q), `Should detect help intent: "${q}"`);
}

assert(!isHelpRequest('mera naam rahul hai'), 'Should not flag general statement as help');
assert(!isHelpRequest('twenty two'), 'Should not flag age as help');
assert(!isHelpRequest('no help needed'), 'Should respect negation');

console.log('--- 2. Testing parsePaymentVoice (500+ Synonyms) ---');
const positiveQueries = [
  'yes', 'yeah', 'yep', 'yup', 'yoo', 'hei', 'yeash', 'yesh',
  'done', 'paid', 'payment done', 'payment complete', 'already paid', 'confirm',
  'haan', 'han', 'ha', 'haa', 'hnn', 'hnnn', 'haanji', 'ji haan', 'kar diya',
  'kardiya', 'ho gaya', 'hogaya', 'kar diya hai', 'de diya',
  'korechi', 'korechhi', 'hoye geche', 'hoyeche', 'diyechi', 'thik ache',
  'हाँ', 'हां', 'कर दिया', 'हो गया', 'जी हाँ', 'পেমেন্ট করেছি', 'হয়ে গেছে', 'হ্যাঁ'
];
for (const pos of positiveQueries) {
  assert(parsePaymentVoice(pos) === 'yes', `Should identify as YES: "${pos}"`);
}

const negativeQueries = [
  'no', 'nope', 'nah', 'naah', 'naa', 'not yet', 'haven t', 'didn t', 'failed',
  'nahi', 'nahin', 'nhi', 'nai', 'nahi kiya', 'nahi hua', 'abhi nahi', 'baki hai',
  'na', 'nay', 'hoyni', 'hoy ni', 'korini', 'kori ni', 'dewani', 'thamo',
  'नहीं', 'ना', 'नहीं किया', 'नहीं हुआ', 'না', 'করিনি', 'হয়নি'
];
for (const neg of negativeQueries) {
  assert(parsePaymentVoice(neg) === 'no', `Should identify as NO: "${neg}"`);
}

console.log('--- 3. Testing parseReportLanguageChoice (200+ Variations) ---');
const hindiQueries = [
  'hindi', 'hindee', 'hidni', 'heendi', 'heindi', 'hendee', 'hendi', 'indi',
  'hindi mein', 'hindi me', 'hindi sunna hai', 'hindi bhasha', 'हिंदी', 'हिन्दी',
  'हिंदी में', 'हिंदी बोलिए'
];
for (const h of hindiQueries) {
  assert(parseReportLanguageChoice(h) === 'hi', `Should identify Hindi: "${h}"`);
}

const englishQueries = [
  'english', 'inglish', 'glish', 'engsh', 'englis', 'enlish', 'angrezi', 'angreji',
  'english please', 'in english', 'english mein', 'ইংরেজি', 'ইংলিশ', 'इंग्लिश', 'अंग्रेजी'
];
for (const e of englishQueries) {
  assert(parseReportLanguageChoice(e) === 'en', `Should identify English: "${e}"`);
}

const bengaliQueries = [
  'bengali', 'bangla', 'bagali', 'bengai', 'begali', 'bongali', 'bangali',
  'bangla te', 'bangla e', 'bangla bhasha', 'বাংলা', 'বাংলায়', 'বাঙালি', 'बंगाली', 'बांग्ला'
];
for (const b of bengaliQueries) {
  assert(parseReportLanguageChoice(b) === 'bn', `Should identify Bengali: "${b}"`);
}

console.log('--- 4. Testing Layman Multilingual Report Decoders ---');
const mockHealth = {
  patient: { name: 'Aarav Sharma', age: 28, gender: 'male' },
  vitals: {
    weight: 68,
    height: 175,
    bmi: 22.2,
    bodyFat: 18.5,
    muscleMass: 42.0,
    bpSystolic: 120,
    bpDiastolic: 80,
    oxygen: 98,
    pulse: 72,
    temperature: 98.4,
    bodyScore: 84,
    metabolicAge: 25
  },
  history: [{ id: 1 }]
};

for (const lang of ['en', 'hi', 'bn']) {
  const r1 = getReport1Speech(mockHealth, lang);
  assert(r1 && r1.length > 50, `Report 1 generated for ${lang}`);

  const r2 = getReport2Speech(mockHealth, lang);
  assert(r2 && r2.length > 50, `Report 2 generated for ${lang}`);

  const r3 = getReport3Speech(mockHealth, lang);
  assert(r3 && r3.length > 50, `Report 3 generated for ${lang}`);

  const r4 = getReport4Speech(mockHealth, lang);
  assert(r4 && r4.length > 50, `Report 4 generated for ${lang}`);

  const r5 = getReport5Speech(mockHealth, lang);
  assert(r5 && r5.length > 50, `Report 5 generated for ${lang}`);
}

console.log('--- 5. Testing Layman Metric Explainers (5-Year-Old Level) ---');
const metricKeys = Object.keys(METRIC_EXPLAINERS);
assert(metricKeys.length >= 8, 'At least 8 metrics have dedicated layman explainers');

for (const key of metricKeys) {
  for (const lang of ['en', 'hi', 'bn']) {
    const explainer = getMetricLaymanExplainer(key, mockHealth, lang);
    assert(explainer && explainer.length >= 40, `Explainer for ${key} in ${lang} exists and is descriptive`);
  }
}

// Check Metabolic Age explanation specific metaphors
const hiMeta = getMetricLaymanExplainer('metabolicAge', mockHealth, 'hi');
assert(hiMeta.includes('जन्मदिन') || hiMeta.includes('उम्र'), 'Hindi metabolic age explains calendar birthday vs inside age');

const bnMeta = getMetricLaymanExplainer('metabolicAge', mockHealth, 'bn');
assert(bnMeta.includes('জন্মদিন') || bnMeta.includes('বয়স'), 'Bengali metabolic age explains birthday vs inside age');

const enMeta = getMetricLaymanExplainer('metabolicAge', mockHealth, 'en');
assert(enMeta.toLowerCase().includes('birthday') && enMeta.toLowerCase().includes('inside'), 'English metabolic age explains birthday vs inside age');

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
