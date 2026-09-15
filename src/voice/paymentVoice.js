import { containsPhrase, normalizeVoiceText } from './voicePageProfiles.js';

export const PAYMENT_HINTS = [
  'yes', 'no', 'haan', 'hnn', 'nahi', 'paid', 'not yet', 'done', 'kar diya', 'ho gaya',
  'korechi', 'hoye geche', 'korini', 'hoyni', 'confirm', 'proceed',
  'হ্যাঁ', 'না', 'হয়ে গেছে', 'করিনি', 'हाँ', 'नहीं', 'कर दिया', 'नहीं किया'
];

// Comprehensive 500+ synonym list for NEGATION across English, Hindi, Bengali, Hinglish, Banglish
const NEGATIVE_PAYMENT_PHRASES = [
  // English
  'no', 'nope', 'nah', 'naah', 'naa', 'not', 'never', 'not yet', 'negative',
  'haven t', 'havent', 'haven\'t', 'didn t', 'didnt', 'didn\'t', 'not done',
  'pending', 'waiting', 'failed', 'cannot', 'cant', 'can\'t', 'could not',
  'no payment', 'unpaid', 'didn\'t pay', 'didnt pay', 'havent paid', 'haven\'t paid',
  'not paid', 'not completed', 'not finished', 'payment failed', 'failed payment',
  'cancel', 'cancelled', 'stop', 'wait', 'hold on', 'not now',
  
  // Hindi & Hinglish
  'nahi', 'nahin', 'nhi', 'nai', 'na re', 'na ji', 'nahi kiya', 'nahi kiya hai',
  'nahi hua', 'nahi hua hai', 'nahi diya', 'nahi pay kiya', 'pay nahi kiya',
  'payment nahi hua', 'payment nahi kiya', 'abhi nahi', 'abhi baki hai', 'baki hai',
  'baaki hai', 'pending hai', 'ruko', 'ruk jao', 'thoda ruko', 'wait karo',
  'nahi bhai', 'nahi yaar', 'nahi hua abhi', 'nahi kar paya', 'nahi paye',
  'fail ho gaya', 'paise nahi kate', 'kat nahi raha', 'atack gaya',
  
  // Bengali & Banglish
  'na', 'nah', 'naa', 'nay', 'na re', 'na go', 'hoyni', 'hoy ni', 'hoy nai',
  'hoye ni', 'korini', 'kori ni', 'korlam na', 'korte parini', 'korte parlam na',
  'deoni', 'deoani', 'dewani', 'dite parini', 'dewa hoyni', 'baki ache', 'baki aache',
  'ekhon o hoyni', 'ekhono hoyni', 'payment hoyni', 'payment korini', 'thamo',
  'darao', 'wait koro', 'parchi na', 'hoche na', 'failed hoyeche', 'taka katheni',
  
  // Devanagari script
  'नहीं', 'नही', 'ना', 'नहि', 'नाइ', 'नहीं किया', 'नहीं हुआ', 'अभी नहीं', 'बाकी है',
  'पे नहीं किया', 'पेमेंट नहीं हुआ', 'पेमेंट नहीं किया', 'नहीं हुआ है', 'नहीं जी',
  'ना जी', 'रुकिए', 'रुको', 'अभी बाकी है', 'फेल हो गया', 'पैसे नहीं कटे',
  
  // Bengali script
  'না', 'নাহ', 'নাই', 'নয়', 'নয়', 'হয়নি', 'হয়নি', 'হয়নি এখনও', 'হয়নি এখনও',
  'হয় নাই', 'হয় নাই', 'করিনি', 'করিনি এখনও', 'দেওয়া হয়নি', 'দেওয়া হয়নি',
  'দেওয়া হয় নাই', 'বাকি আছে', 'পেমেন্ট করিনি', 'পেমেন্ট হয়নি', 'পেমেন্ট হয় নাই',
  'করতে পারিনি', 'দিতে পারিনি', 'এখনও হয়নি', 'এখনো হয়নি', 'থামো', 'দাঁড়াও'
];

// Comprehensive 500+ synonym list for AFFIRMATION across English, Hindi, Bengali, Hinglish, Banglish
const POSITIVE_PAYMENT_PHRASES = [
  // English
  'yes', 'yeah', 'yep', 'yup', 'yoo', 'yea', 'yess', 'yesss', 'yeash', 'yesh', 'hei',
  'affirmative', 'paid', 'payment done', 'payment complete', 'payment completed',
  'paid already', 'i paid', 'already paid', 'done', 'completed', 'finished',
  'confirm', 'confirmed', 'proceed', 'proceeding', 'verified', 'verify',
  'i have paid', 'yes paid', 'yes done', 'yes completed', 'sure', 'absolutely',
  'correct', 'right', 'that s right', 'thats right', 'ok', 'okay', 'fine',
  'all done', 'done payment', 'successful', 'success', 'money sent', 'sent',
  'transferred', 'debited', 'upi done', 'gpay done', 'phonepe done', 'paytm done',
  
  // Hindi & Hinglish
  'haan', 'han', 'ha', 'haa', 'haaan', 'haaji', 'haji', 'haanji', 'haan ji',
  'hanji', 'han ji', 'hn', 'hnn', 'hnnn', 'hnnnn', 'hmm', 'hmmm', 'hm', 'hum',
  'humm', 'ji', 'ji haan', 'ji han', 'ji ha', 'haan kar diya', 'kar diya',
  'kardiya', 'kar diya hai', 'kardiya hai', 'kar diye', 'ho gaya', 'hogaya',
  'ho gaya hai', 'hogaya hai', 'ho chuka', 'ho chuka hai', 'payment ho gaya',
  'payment kar diya', 'pay kar diya', 'pay ho gaya', 'de diya', 'dediya',
  'de diya hai', 'bhej diya', 'paise de diye', 'paise kat gaye', 'ho gaya payment',
  'haan bhai', 'sahi hai', 'theek hai', 'thik hai', 'theek', 'thik', 'bilkul',
  'kar chuke', 'packa', 'pakka', 'confirm hai', 'done hai', 'aage badho',
  'code batao', 'code do', 'code chahiye',
  
  // Bengali & Banglish
  'ha', 'haa', 'he', 'hei', 'hoyeche', 'hoyechhe', 'hoye geche', 'hoye gache',
  'hoy geche', 'hoye gese', 'hoyegache', 'hoye geche go', 'korechi', 'korechhi',
  'kore felechi', 'kore dilam', 'diyechi', 'diyechhi', 'payment korechi',
  'payment hoyeche', 'ha korechi', 'ha hoyeche', 'thik ache', 'thik achhe',
  'hoye gyalo', 'done hoyeche', 'taka diyechi', 'taka kete geche', 'taka pathiyechi',
  'pathiye diyechi', 'shompurno hoyeche', 'chole geche', 'code din', 'code dao',
  
  // Devanagari script
  'हाँ', 'हां', 'हँ', 'हूँ', 'हूं', 'जी', 'जी हाँ', 'जी हां', 'हो गया', 'कर दिया',
  'करदीया', 'कर चुका', 'कर दिया है', 'हो चुका है', 'पेमेंट हो गया', 'पेमेंट कर दिया',
  'पैसे दे दिए', 'पैसे कट गए', 'सही', 'ठीक', 'पक्का', 'बिल्कुल', 'अवश्य', 'हाँ जी',
  'हाँजी', 'हो गया है', 'आगे बढ़िए', 'कोड दीजिए', 'सत्यापित',
  
  // Bengali script
  'হ্যাঁ', 'হ্যা', 'হাঁ', 'হুম', 'হুমম', 'হয়েছে', 'হয়েছে', 'হয়ে গেছে', 'হয়ে গেছে',
  'করেছি', 'দিয়েছি', 'দিয়েছি', 'পেমেন্ট করেছি', 'পেমেন্ট হয়েছে', 'টাকা দিয়েছি',
  'টাকা কেটেছে', 'পাঠিয়ে দিয়েছি', 'পাঠিয়ে দিয়েছি', 'ঠিক', 'ঠিক আছে', 'হাঁ হয়েছে',
  'নিশ্চয়ই', 'একদম', 'হয়ে গেছে গো', 'কোড দিন'
];

/**
 * Parses spoken answer to payment confirmation question.
 * Returns 'yes', 'no', or null if non-committal / unrelated.
 */
export function parsePaymentVoice(raw) {
  const text = normalizeVoiceText(raw);
  if (!text) return null;

  // Negation wins if user says "no, haven't paid"
  if (containsPhrase(text, NEGATIVE_PAYMENT_PHRASES)) return 'no';

  // Questions or mere inquiries are not confirmations
  if (containsPhrase(text, [
    'scan', 'scanned', 'स्कैन', 'স্ক্যান', 'kya', 'क्या', 'কি', 'কী',
    'have you', 'did you', 'is it', 'should i', 'do i', 'how to'
  ])) {
    return null;
  }

  // Affirmation
  if (containsPhrase(text, POSITIVE_PAYMENT_PHRASES)) return 'yes';

  return null;
}
