import { containsPhrase, normalizeVoiceText } from './voicePageProfiles.js';

export const PAYMENT_HINTS = ['yes', 'no', 'haan', 'hnn', 'nahi', 'paid', 'not yet',
  'হ্যাঁ', 'না', 'হয়ে গেছে', 'করিনি', 'हाँ', 'नहीं', 'कर दिया', 'नहीं किया'];

// Only answers to the payment question. Never a payment authorization.
export function parsePaymentVoice(raw) {
  const text = normalizeVoiceText(raw);
  if (!text) return null;
  // Negation wins, including “yes, but payment has not completed”.
  if (containsPhrase(text, ['no', 'nope', 'nah', 'naah', 'naa', 'na', 'not', 'never',
    'nahi', 'nahin', 'nhi', 'nai', 'hoyni', 'hoy ni', 'korini', 'kori ni', 'korlam na',
    'hoy nai', 'not yet', 'waiting', 'pending', 'failed', 'cannot', 'cant', "can't", 'haven t',
    'didn t', 'didnt', 'नहीं', 'नही', 'ना', 'नहि', 'नाइ', 'बाकी',
    'না', 'নাহ', 'নাই', 'হয়নি', 'হয়নি', 'হয় নাই', 'করিনি', 'করিনি এখনও'])) return 'no';
  // A question or a completed QR scan is not a completed payment.
  if (containsPhrase(text, ['scan', 'scanned', 'स्कैन', 'স্ক্যান', 'kya', 'क्या', 'কি', 'কী',
    'have you', 'did you', 'is it', 'should i', 'do i'])) return null;
  if (containsPhrase(text, ['yes', 'yeah', 'yep', 'yup', 'affirmative', 'paid', 'payment done',
    'payment complete', 'done', 'completed', 'haan', 'han', 'ha', 'haa', 'hn', 'hnn', 'hmm',
    'hmmm', 'hm', 'hum', 'ji haan', 'haanji', 'haji', 'ji', 'ho gaya', 'kar diya', 'kardiya',
    'hoye geche', 'hoy geche', 'hoyeche', 'hoyechhe', 'korechi', 'korechhi', 'diyechi',
    'diyechhi', 'হ্যাঁ', 'হ্যা', 'হাঁ', 'হুম', 'হুমম', 'হয়েছে', 'হয়েছে', 'হয়ে গেছে',
    'হয়ে গেছে', 'করেছি', 'দিয়েছি', 'দিয়েছি', 'হাঁ হয়েছে', 'हाँ', 'हां', 'हँ', 'हूँ',
    'हूं', 'जी हाँ', 'हो गया', 'कर दिया', 'करदीया', 'कर चुका'])) return 'yes';
  return null;
}
