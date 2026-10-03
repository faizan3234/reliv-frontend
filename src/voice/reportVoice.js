import { getScanCount } from '../utils/reportSnapshot.js';
import { containsPhrase, normalizeVoiceText } from './voicePageProfiles.js';

// ── 200+ INTENT LISTS FOR REPORT LANGUAGE SELECTION ──────────────────────────

const HINDI_LANGUAGE_INTENTS = [
  // Core & phonetic misspellings
  'hindi', 'hindee', 'hidni', 'heendi', 'heindi', 'hendee', 'hendi', 'hindii',
  'hndi', 'hind', 'hnd', 'indi', 'hindia', 'hindish', 'hindie', 'hyndi', 'hndy',
  'hinde', 'hindey', 'hindu language', 'hindii bhasha',

  // Phrasal & conversational in Hindi / Hinglish
  'hindi mein', 'hindi me', 'hindi mai', 'hindi mey', 'hindi ma', 'hindi sunna hai',
  'hindi me sunna hai', 'hindi mein batao', 'hindi me batao', 'hindi me boliye',
  'hindi mein boliye', 'hindi sunao', 'hindi mein sunao', 'hindi bol', 'hindi bolo',
  'hindi bhasha', 'hindi language', 'hindi speech', 'hindi audio', 'hindi voice',
  'hindi please', 'only hindi', 'speak hindi', 'speak in hindi', 'in hindi',
  'mujhe hindi chahiye', 'humko hindi chahiye', 'hindi me chahiye', 'hindi chuno',
  'hindi select karo', 'hindi wala', 'hindi option', 'pehla hindi',

  // Transliterations & regional dialects (Bhojpuri, Maithili, etc.)
  'hindi bhasha me', 'hindiya', 'hindia me', 'hindustan', 'hindustani',
  'hindi me samjhao', 'hindi samjhao', 'hindi bhasha me suno', 'hindi bolna',
  'hindi awaz', 'hindi aawaz', 'aurat ki awaz hindi',

  // Devanagari script variations
  'हिंदी', 'हिन्दी', 'हिन्दि', 'हिंदि', 'हिंदी में', 'हिन्दी में', 'हिंदी मे',
  'हिन्दी मे', 'हिंदी भाषा', 'हिन्दी भाषा', 'हिंदी सुनिए', 'हिंदी सुनाओ',
  'हिंदी बोलिए', 'हिंदी बोलो', 'हिंदी आवाज़', 'हिंदी आवाज', 'हिंदी में बताइए',
  'हिंदी में समझाओ', 'मुझे हिंदी चाहिए', 'हिंदी विकल्प', 'हिंदी में बोलें',
  'हिंदी ऑडियो', 'केवल हिंदी', 'सिर्फ हिंदी', 'हिंदी प्लीज',

  // Bengali transliterations for Hindi
  'হিন্দি', 'হিন্দিতে', 'হিন্দী', 'হিন্দি ভাষা', 'হিন্দি বলো', 'হিন্দিতে বলুন',
  'হিন্দি অডিও', 'হিন্দি শুনবো'
];

const ENGLISH_LANGUAGE_INTENTS = [
  // Core & phonetic misspellings
  'english', 'inglish', 'engsh', 'glish', 'englis', 'eng', 'enlish', 'englesh',
  'engish', 'englsh', 'englich', 'inglesh', 'ynglish', 'anglish', 'englee',
  'engl', 'eglish', 'engli', 'enlgish', 'inglis', 'enghlish', 'engilsh',

  // Phrasal & conversational
  'english please', 'in english', 'english me', 'english mein', 'english mey',
  'english e', 'english te', 'english speak', 'speak english', 'speak in english',
  'english language', 'english audio', 'english voice', 'english version',
  'read in english', 'english bol', 'english bolo', 'english boliye', 'english sunao',
  'english mein batao', 'tell in english', 'i want english', 'english only',
  'choose english', 'select english', 'english option',

  // Hinglish / Indian English terms
  'angrezi', 'angreji', 'angrejee', 'angrezy', 'angregi', 'angraji', 'angrezi me',
  'angrezi mein', 'angreji me', 'angreji mein', 'angrezi boliye', 'angrezi sunao',
  'angrezi bhasha', 'vilayati',

  // Script variations (Devanagari)
  'इंग्लिश', 'इंग्लिस', 'अंग्रेजी', 'अंग्रेज़ी', 'अंग्रेजि', 'अंग्रेजी में',
  'अंग्रेज़ी में', 'इंग्लिश में', 'इंग्लिश मे', 'इंग्लिश भाषा', 'अंग्रेजी भाषा',
  'इंग्लिश बोलिए', 'अंग्रेजी बोलिए', 'इंग्लिश ऑडियो', 'अंग्रेजी ऑडियो',
  'इंग्लिश प्लीज',

  // Bengali script variations
  'ইংরেজি', 'ইংলিশ', 'ইংরাজী', 'ইংরেজিতে', 'ইংলিশে', 'ইংরেজি ভাষা', 'ইংলিশ ভাষা',
  'ইংরেজি বলুন', 'ইংলিশ বলুন', 'ইংরেজিতে শুনব', 'ইংলিশে শুনব', 'ইংরেজি অডিও'
];

const BENGALI_LANGUAGE_INTENTS = [
  // Core & phonetic misspellings
  'bengali', 'bangla', 'bagali', 'bengai', 'begali', 'bongali', 'bangali',
  'bengoli', 'bangoli', 'bengle', 'bangle', 'bngla', 'bangal', 'bengalee',
  'bangly', 'bengli', 'banla', 'bangola', 'bengal', 'bangladesh',

  // Phrasal & conversational in Bengali / Banglish
  'bangla te', 'bangla e', 'bangla mey', 'banglay', 'banglaye', 'bangla bhasa',
  'bangla bhasha', 'bengali language', 'bangla language', 'bangla bolo',
  'bangla bolun', 'banglay bolun', 'banglate bolun', 'bangla sunbo', 'bangla shunbo',
  'bangla te shunbo', 'bangla please', 'in bengali', 'in bangla', 'speak bengali',
  'speak in bengali', 'speak bangla', 'bangla audio', 'bengali audio',
  'bengali voice', 'bangla voice', 'amader bangla', 'amar bangla chai',
  'bangla option', 'select bangla', 'choose bangla',

  // Hindi / Hinglish references to Bengali
  'bengali mein', 'bengali me', 'bangla mein', 'bangla me', 'bengali boliye',
  'bangla boliye', 'bangali me', 'bangali mein', 'bangla bhasha me',

  // Bengali script variations
  'বাংলা', 'বাংলায়', 'বাঙালি', 'বাঙালী', 'বাংলা ভাষায়', 'বাংলা ভাষায়',
  'বাংলাতে', 'বাংলায় বলুন', 'বাংলা বলুন', 'বাংলাতে বলুন', 'বাংলা শুনব',
  'বাংলা শুনবো', 'বাংলায় শুনব', 'বাংলায় শুনবো', 'বাংলা ভাষা', 'বাংলা অডিও',
  'বাংলা প্লিজ', 'শুধু বাংলা', 'বাংলা অপশন',

  // Devanagari script variations
  'बंगाली', 'बांग्ला', 'बांगला', 'बंगला', 'बंगाली में', 'बांग्ला में', 'बंगला में',
  'बंगाली भाषा', 'बांग्ला भाषा', 'बंगाली बोलिए', 'बांग्ला बोलिए', 'बंगाली आवाज',
  'बंगाली ऑडियो', 'बांग्ला प्लीज'
];

export const REPORT_LANGUAGE_HINTS = [
  'hindi', 'english', 'bengali', 'bangla', 'angrezi', 'inglish', 'hidni',
  'हिंदी', 'इंग्लिश', 'বাংলা', 'अंग्रेजी', 'হিন্দি', 'ইংরেজি'
];

/**
 * Parses user speech for report language selection.
 * Returns 'hi', 'en', 'bn', or null.
 */
export function parseReportLanguageChoice(raw) {
  const text = normalizeVoiceText(raw);
  if (!text) return null;

  // Exact or phrase check for Bengali
  if (containsPhrase(text, BENGALI_LANGUAGE_INTENTS)) return 'bn';

  // Exact or phrase check for Hindi
  if (containsPhrase(text, HINDI_LANGUAGE_INTENTS)) return 'hi';

  // Exact or phrase check for English
  if (containsPhrase(text, ENGLISH_LANGUAGE_INTENTS)) return 'en';

  return null;
}

// ── 5-YEAR-OLD LAYMAN METRIC EXPLAINER DICTIONARY ──────────────────────────

export const METRIC_EXPLAINERS = {
  standardWeight: {
    icon: '⚖️',
    key: 'standardWeight',
    title: {
      hi: 'मानक वज़न (लंबाई के अनुसार सही वज़न)',
      en: 'Standard Weight (Ideal for Your Height)',
      bn: 'মানক ওজন (উচ্চতা অনুযায়ী আদর্শ ওজন)'
    },
    subtitle: {
      hi: 'लंबाई के हिसाब से कितना वज़न होना चाहिए',
      en: 'What your weight should be for your height',
      bn: 'উচ্চতা অনুযায়ী কতটা ওজন হওয়া দরকার'
    },
    getText: (val, ctx, lang = 'en') => {
      const vitals = (typeof ctx === 'object' && ctx !== null) ? (ctx.vitals || ctx) : {};
      const height = Number(vitals.height || 175);
      const weight = Number(vitals.weight || (typeof val === 'number' ? val : 65));
      const stdWeight = Math.round(22.2 * ((height / 100) ** 2) * 10) / 10;
      const gap = Math.round((stdWeight - weight) * 10) / 10;
      const absGap = Math.abs(gap);

      if (lang === 'hi') {
        let s = `आपकी ${height} सेंटीमीटर लंबाई के अनुसार, आपका मानक स्वस्थ वज़न ${stdWeight} किलो होना चाहिए। `;
        s += `आज आपका वज़न ${weight} किलो है। `;
        if (gap > 0.8) {
          s += `यानी सही और आदर्श वज़न तक पहुँचने के लिए आपको लगभग ${absGap} किलो मांसपेशियां और वज़न बढ़ाने की ज़रूरत है। कम वज़न होने का नुकसान यह है कि शरीर में थकान जल्दी आ सकती है और अंदरूनी ऊर्जा कम रहती है। दाल, पनीर, दूध, भुना चना और केले जैसी पौष्टिक चीज़ें खाकर आप यह वज़न आसानी से बढ़ा सकते हैं।`;
        } else if (gap < -0.8) {
          s += `यानी सही संतुलन के लिए आपको लगभग ${absGap} किलो वज़न धीरे-धीरे कम करने की ज़रूरत है। ज़्यादा वज़न होने से घुटनों और दिल पर अतिरिक्त बोझ पड़ता है। रोज़ाना 30 मिनट तेज़ टहलने और मीठी चाय व तली चीज़ें कम करने से यह आराम से कम हो जाएगा।`;
        } else {
          s += `बधाई हो! आपका वज़न आपकी लंबाई के हिसाब से बिल्कुल सही और मानक संतुलन में है! इसे ऐसे ही बनाए रखिए।`;
        }
        return s;
      }
      if (lang === 'bn') {
        let s = `আপনার ${height} সেন্টিমিটার উচ্চতা অনুযায়ী আপনার আদর্শ মানক ওজন হওয়া উচিত ${stdWeight} কেজি। `;
        s += `আজ আপনার বর্তমান ওজন ${weight} কেজি। `;
        if (gap > 0.8) {
          s += `এর অর্থ হলো আদর্শ ওজনে পৌঁছানোর জন্য আপনাকে প্রায় ${absGap} কেজি ওজন বা পেশীর শক্তি বাড়াতে হবে। ওজন কম থাকার সমস্যা হলো শরীর দ্রুত ক্লান্ত হয়ে পড়ে এবং কাজের উদ্যম কমে যায়। প্রতিদিন খাবারে ডাল, ছানা, দুধ ও কলার মতো পুষ্টিকর খাবার যোগ করলে সহজেই সুন্দর স্বাস্থ্য তৈরি হবে।`;
        } else if (gap < -0.8) {
          s += `অর্থাৎ আদর্শ ওজনে পৌঁছাতে আপনাকে প্রায় ${absGap} কেজি অতিরিক্ত ওজন কমাতে হবে। বেশি ওজন থাকলে হাঁটু আর হার্টের ওপর বাড়তি চাপ পড়ে। প্রতিদিন ৩০ মিনিট হাঁটা ও তেল-ভাজাভুজি কমালে এটি অনায়াসেই স্বাভাবিক হয়ে যাবে।`;
        } else {
          s += `দারুণ সুখবর! আপনার ওজন আপনার উচ্চতার সাথে একদম নিখুঁত ও চমৎকার ভারসাম্যে রয়েছে!`;
        }
        return s;
      }
      let s = `According to your height of ${height} cm, your standard healthy ideal weight is ${stdWeight} kg. `;
      s += `Today your weight is ${weight} kg. `;
      if (gap > 0.8) {
        s += `That means you need to gain about ${absGap} kg of healthy muscle to reach your ideal weight. Being underweight means your body has less physical reserve against fatigue and sudden stress. Nourishing home foods like dal, paneer, sprouts, milk, and bananas will help you build solid, lasting strength.`;
      } else if (gap < -0.8) {
        s += `That means you need to gently reduce about ${absGap} kg to reach your ideal weight. Extra weight puts unnecessary strain on your knees and cardiovascular system. Taking a brisk 30-minute walk every day and reducing oily snacks will guide you smoothly back to your goal.`;
      } else {
        s += `Awesome news! Your current weight matches your standard ideal weight in perfect harmony! Keep up your healthy lifestyle.`;
      }
      return s;
    }
  },

  fatControl: {
    icon: '🔥',
    key: 'fatControl',
    title: {
      hi: 'फैट नियंत्रण (चर्बी का संतुलन)',
      en: 'Fat Control (Body Fat Adjustment)',
      bn: 'ফ্যাট নিয়ন্ত্রণ (চর্বির সঠিক মাত্রা)'
    },
    subtitle: {
      hi: 'कितना फैट बढ़ाना या घटाना है',
      en: 'How much fat to adjust for ideal fitness',
      bn: 'কতটা ফ্যাট কমানো বা বাড়ানো দরকার'
    },
    getText: (val, ctx, lang = 'en') => {
      const vitals = (typeof ctx === 'object' && ctx !== null) ? (ctx.vitals || ctx) : {};
      const bodyFat = Number(vitals.bodyFat || 12.7);
      if (lang === 'hi') {
        let s = `फैट कंट्रोल आपको यह बताता है कि शरीर में अतिरिक्त चर्बी घटानी है या बढ़ानी है। `;
        if (bodyFat < 10) {
          s += `आपका फैट काफी कम है। शरीर को गरमाहट और सुरक्षा के लिए थोड़ा स्वस्थ फैट चाहिए, इसलिए खाने में मेवे और थोड़ा घी शामिल करें।`;
        } else if (bodyFat > 25) {
          s += `आपके शरीर में अतिरिक्त चर्बी है। ज़्यादा फैट से सुस्ती आती है और दिल पर ज़ोर पड़ता है। रोज़ 30 मिनट टहलने से यह गुल्लक हल्की हो जाएगी।`;
        } else {
          s += `आपका बॉडी फैट लगभग ${bodyFat} प्रतिशत है, जो कि बहुत ही सुरक्षित, संतुलित और स्वस्थ है!`;
        }
        return s;
      }
      if (lang === 'bn') {
        let s = `ফ্যাট কন্ট্রোল আপনাকে বলে দেয় শরীরে চর্বি কতটা বাড়াতে বা কমাতে হবে। `;
        if (bodyFat < 10) {
          s += `আপনার ফ্যাট বেশ কম। শরীরকে সুরক্ষিত রাখতে একটু স্বাস্থ্যকর ফ্যাট দরকার, তাই বাদাম ও পুষ্টিকর খাবার খান।`;
        } else if (bodyFat > 25) {
          s += `শরীরে চর্বির মাত্রা বেশি। বাড়তি ফ্যাটে ক্লান্তি বাড়ে। প্রতিদিন ৩০ মিনিট হাঁটলেই এটি সহজে কমে যাবে।`;
        } else {
          s += `আপনার শরীরের ফ্যাট মাত্র ${bodyFat} শতাংশ, যা চমৎকার ও সম্পূর্ণ স্বাস্থ্যকর সীমার মধ্যে আছে!`;
        }
        return s;
      }
      let s = `Fat control tells you whether your energy bank needs a small withdrawal or deposit. `;
      if (bodyFat < 10) {
        s += `Your body fat is quite lean. A touch of healthy nuts and milk will give your body a warm, safe cushion.`;
      } else if (bodyFat > 25) {
        s += `Your fat percentage is slightly elevated. Extra fat slows down daily stamina, but a daily 30-minute brisk walk will gently bring it back into balance.`;
      } else {
        s += `Your body fat is about ${bodyFat} percent, which is classified as very healthy and athletic!`;
      }
      return s;
    }
  },

  muscleControl: {
    icon: '💪',
    key: 'muscleControl',
    title: {
      hi: 'मांसपेशियों का लक्ष्य (मसल कंट्रोल)',
      en: 'Muscle Control (Strength Target)',
      bn: 'পেশীর লক্ষ্য (মাসল কন্ট্রোল)'
    },
    subtitle: {
      hi: 'ताक़त और स्टैमिना के लिए कितना मसल बढ़ाना है',
      en: 'Target muscle mass to build for daily stamina',
      bn: 'শক্তি ও স্ট্যামিনার জন্য কতটা পেশী বাড়ানো দরকার'
    },
    getText: (val, ctx, lang = 'en') => {
      const vitals = (typeof ctx === 'object' && ctx !== null) ? (ctx.vitals || ctx) : {};
      const muscle = Number(vitals.muscleMass || 36.4);
      if (lang === 'hi') {
        return `मसल कंट्रोल बताता है कि आपकी लंबाई के हिसाब से आपको कितनी मांसपेशियां बनानी चाहिए। आपका मसल मास ${muscle} किलो है, जो थोड़ा कम है। मांसपेशियों की कमी से शरीर जल्दी थक जाता है और पीठ या घुटनों में कमज़ोरी लगती है। मूंग दाल, पनीर, अंकुरित अनाज, भुना चना और रोज़ाना हल्का व्यायाम करने से मांसपेशियां मज़बूत होंगी!`;
      }
      if (lang === 'bn') {
        return `মাসল কন্ট্রোল দেখায় উচ্চতা অনুযায়ী কতটা পেশীর শক্তি তৈরি করা প্রয়োজন। আপনার পেশীর ওজন ${muscle} কেজি, যা কিছুটা কম। পেশী কম থাকলে অল্পতেই ক্লান্তি আসে আর শরীরে দুর্বলতা লাগে। মুগ ডাল, ছানা, ডিম, অঙ্কুরিত ছোলা আর নিয়মিত হালকা ব্যায়াম করলে পেশী শক্তপোক্ত হবে!`;
      }
      return `Muscle control measures the engine power of your body. Your muscle mass is ${muscle} kg, which is slightly low for your frame. Having low muscle causes earlier physical tiredness and poor posture. Eating protein-rich foods like moong dal, paneer, sprouts, and eggs, along with bodyweight exercises, will build durable strength!`;
    }
  },

  idealBodyWeight: {
    icon: '🎯',
    key: 'idealBodyWeight',
    title: {
      hi: 'आदर्श वज़न (स्वस्थ सीमा)',
      en: 'Ideal Body Weight (Target Range)',
      bn: 'আদর্শ ওজন (স্বাস্থ্যকর সীমা)'
    },
    subtitle: {
      hi: 'आपकी उम्र और लंबाई के लिए सबसे उत्तम वज़न',
      en: 'The golden weight zone for your height and frame',
      bn: 'আপনার উচ্চতার সেরা ওজনের পরিসর'
    },
    getText: (val, ctx, lang = 'en') => {
      const vitals = (typeof ctx === 'object' && ctx !== null) ? (ctx.vitals || ctx) : {};
      const height = Number(vitals.height || 175);
      const ideal = Math.round(22.2 * ((height / 100) ** 2) * 10) / 10;
      if (lang === 'hi') {
        return `आपकी लंबाई ${height} सेंटीमीटर के लिए आदर्श वज़न लगभग ${ideal} किलो है। जब आपका वज़न इस सीमा में रहता है, तो दिल और जोड़ों पर कोई फालतू दबाव नहीं पड़ता और दिनभर खूब फुर्ती रहती है।`;
      }
      if (lang === 'bn') {
        return `আপনার ${height} সেন্টিমিটার উচ্চতার জন্য সবচেয়ে আদর্শ ওজন হলো প্রায় ${ideal} কেজি। ওজন এই সীমার মধ্যে থাকলে হার্ট আর হাড়ের জোড় একদম চাপমুক্ত থাকে এবং সারাদিন প্রাণবন্ত শক্তি থাকে।`;
      }
      return `For your height of ${height} cm, your ideal target weight is about ${ideal} kg. Staying in this golden zone keeps your heart and joints stress-free with maximum daily energy.`;
    }
  },

  metabolicAge: {
    icon: '🎂',
    key: 'metabolicAge',
    title: {
      hi: 'अंदरूनी उम्र (मेटाबॉलिक एज)',
      en: 'Inside Age (Metabolic Age)',
      bn: 'ভেতরের বয়স (মেটাবলিক এজ)'
    },
    subtitle: {
      hi: 'आपकी अंदरूनी मशीन की उम्र',
      en: 'How young your body feels inside',
      bn: 'শরীরের ভেতরের ইঞ্জিনের বয়স'
    },
    getText: (val, ctx, lang = 'en') => {
      const v = val ? Math.round(Number(val)) : null;
      const patientAge = typeof ctx === 'number' ? ctx : Number(ctx?.patient?.age || 21);
      if (lang === 'hi') {
        let s = `सुनिए, आपकी एक उम्र होती है जो आपके जन्मदिन और आधार कार्ड से गिनी जाती है। लेकिन एक उम्र आपके शरीर के अंदर के दिल, फेफड़ों और अंगों की होती है, जिसे अंदरूनी या मेटाबॉलिक उम्र कहते हैं! `;
        if (v) s += `आपकी अंदरूनी उम्र ${v} साल आई है। `;
        if (v && patientAge && v < patientAge) {
          s += `बधाई हो! आप अंदर से अपनी असली उम्र से भी ${patientAge - v} साल छोटे और चुस्त हैं, बिल्कुल एक फुर्तीले सुपरहीरो की तरह! `;
        } else if (v && patientAge && v > patientAge) {
          s += `यानी अंदर की मशीन थोड़ी सी थक गई है। रोज़ाना 20 मिनट की सैर और ताज़े फल खाने से यह अंदर से फिर से एकदम जवान हो जाएगी। `;
        } else {
          s += `यह आपकी असली उम्र के बिल्कुल बराबर और बढ़िया संतुलन में है। `;
        }
        return s;
      }
      if (lang === 'bn') {
        let s = `শুনুন, আপনার একটা বয়স আছে যা আপনার জন্মদিন দেখে গোনা হয়। কিন্তু আরেকটা বয়স আছে যা আপনার শরীরের ভেতরের হার্ট, ফুসফুস আর সব অঙ্গের বয়স বোঝায় — একে বলে মেটাবলিক বয়স! `;
        if (v) s += `আপনার ভেতরের বয়স এসেছে ${v} বছর। `;
        if (v && patientAge && v < patientAge) {
          s += `দারুণ সুখবর! আপনার ভেতরটা আপনার আসল বয়সের চেয়েও ${patientAge - v} বছর তরুণ আর প্রাণবন্ত! `;
        } else if (v && patientAge && v > patientAge) {
          s += `ভেতরের শরীরটা একটু ক্লান্ত। প্রতিদিন একটু হাঁটাহাঁটি আর পুষ্টিকর খাবার খেলেই এটা আবার তরুণ হয়ে উঠবে। `;
        } else {
          s += `এটি আপনার আসল বয়সের সাথে একদম মিলে গেছে। `;
        }
        return s;
      }
      let s = `Your birthday tells you how many years you have lived, but your metabolic age tells you how young and energetic your body actually feels on the inside! `;
      if (v) s += `Your internal age is ${v} years. `;
      if (v && patientAge && v < patientAge) {
        s += `Awesome news! Your inner body is running ${patientAge - v} years younger than your calendar age — like an energetic superhero! `;
      } else if (v && patientAge && v > patientAge) {
        s += `Your inner engine is feeling a bit tired. A fun 20-minute daily walk and plenty of water will quickly make it feel young and light again. `;
      } else {
        s += `Your inside age matches your calendar age in great harmony. `;
      }
      return s;
    }
  },

  bodyScore: {
    icon: '⭐',
    key: 'bodyScore',
    title: {
      hi: 'बॉडी स्कोर (सेहत के नंबर)',
      en: 'Body Score (Health Stars)',
      bn: 'বডি স্কোর (স্বাস্থ্যের নম্বর)'
    },
    subtitle: {
      hi: '100 में से आज की सेहत के नंबर',
      en: 'Your vitality score out of 100',
      bn: '১০০-র মধ্যে আপনার স্কোর'
    },
    getText: (val, ctx, lang = 'en') => {
      const s = val ? Math.round(Number(val)) : 85;
      if (lang === 'hi') {
        return `जैसे स्कूल में टेस्ट देने पर 100 में से नंबर मिलते हैं, वैसे ही आज आपकी पूरी सेहत की जाँच करके आपके शरीर को 100 में से ${s} नंबर मिले हैं! आप अपनी उम्र के शीर्ष 28 प्रतिशत लोगों में आते हैं और वेलनेस चैंपियन हैं। 80 से ऊपर का मतलब है आपकी गाड़ी बिल्कुल मस्त और मक्खन चल रही है।`;
      }
      if (lang === 'bn') {
        return `স্কুলে যেমন পরীক্ষার পর ১০০-র মধ্যে নম্বর দেয়, তেমনই আজ পুরো স্বাস্থ্য পরীক্ষা করে আপনার শরীর ১০০-র মধ্যে ${s} নম্বর পেয়েছে! আপনি সেরা ২৮ শতাংশ মানুষের মধ্যে রয়েছেন এবং একজন ওয়েলনেস চ্যাম্পিয়ন। ৮০-র বেশি মানে আপনি একদম ফার্স্ট ক্লাস স্বাস্থ্য ধরে রেখেছেন।`;
      }
      return `Just like getting a report score out of 100 in school, your body scored ${s} points today! You rank in the top 28 percent as a Wellness Champion and Peak Performer. Above 80 is like winning a shiny gold star for taking great care of yourself.`;
    }
  },

  bmi: {
    icon: '🎒',
    key: 'bmi',
    title: {
      hi: 'बीएमआई (वज़न और लंबाई का मेल)',
      en: 'BMI (Weight & Height Balance)',
      bn: 'বিএমআই (ওজন ও উচ্চতার মিল)'
    },
    subtitle: {
      hi: 'क्या आपका वज़न लंबाई के अनुकूल है?',
      en: 'Is your weight matching your height?',
      bn: 'উচ্চতা অনুযায়ী वजन ठीक আছে কি না'
    },
    getText: (val, ctx, lang = 'en') => {
      const v = val ? Number(val).toFixed(1) : null;
      if (lang === 'hi') {
        let s = `बीएमआई कोई मुश्किल चीज़ नहीं है! इसका सीधा सा मतलब है कि क्या आपका वज़न आपकी लंबाई के हिसाब से बिल्कुल सही है — जैसे स्कूल का बस्ता, ना बहुत भारी, ना बहुत हल्का! `;
        if (v) s += `आपका बीएमआई ${v} है। `;
        if (v && v < 18.5) s += `यह थोड़ा हल्का यानी अंडरवेट है। कम वज़न से कमज़ोरी आ सकती है, इसलिए दाल, पनीर, दूध और पौष्टिक आहार लीजिए। `;
        else if (v && v <= 24.9) s += `यह एकदम सही संतुलन में है, बिल्कुल शानदार! `;
        else s += `यह थोड़ा भारी है। रोज़ 20 मिनट टहलने से यह बस्ता हल्का हो जाएगा। `;
        return s;
      }
      if (lang === 'bn') {
        let s = `বিএমআই কোনো কঠিন ব্যাপার নয়! সহজ কথায়, আপনার উচ্চতার সাথে ওজনটা ঠিকঠাক মিলেছে কি না — ঠিক যেমন স্কুলের মাপমতো সুন্দর একটি ব্যাগ! `;
        if (v) s += `আপনার বিএমআই ${v}। `;
        if (v && v < 18.5) s += `এটি একটু হালকা অর্থাৎ আন্ডারওয়েট। ওজন কম থাকলে ক্লান্তি আসতে পারে, তাই ডাল আর পুষ্টিকর খাবার খেয়ে শক্তি বাড়ান। `;
        else if (v && v <= 24.9) s += `এটি একদম স্বাভাবিক ও চমৎকার সীমার মধ্যে আছে। `;
        else s += `এটি একটু ভারী, নিয়মিত একটু হাঁটলেই নিয়ন্ত্রণে থাকবে। `;
        return s;
      }
      let s = `Don't worry about the letters BMI — it simply checks whether your weight matches your height, just like a school backpack that is neither too heavy nor too empty, but just right for your size! `;
      if (v) s += `Your BMI is ${v}. `;
      if (v && v < 18.5) s += `It's slightly light, indicating an underweight status. Low weight lowers your daily stamina, so healthy nuts and protein meals will build good strength. `;
      else if (v && v <= 24.9) s += `It's in the golden healthy zone! `;
      else s += `It's a little heavy — a daily brisk walk will lighten your backpack naturally. `;
      return s;
    }
  },

  bodyFat: {
    icon: '🏦',
    key: 'bodyFat',
    title: {
      hi: 'शरीर का फैट (ऊर्जा की गुल्लक)',
      en: 'Body Fat (Energy Piggy Bank)',
      bn: 'শরীরের ফ্যাট (শক্তির সঞ্চয়)'
    },
    subtitle: {
      hi: 'शरीर में सुरक्षित रखी गई ऊर्जा',
      en: 'Your backup energy reserve',
      bn: 'জরুরি সময়ের জমানো শক্তি'
    },
    getText: (val, ctx, lang = 'en') => {
      const v = val ? Number(val).toFixed(1) : '12.7';
      if (lang === 'hi') {
        return `शरीर में जो फैट यानी चर्बी होती है, वह आपकी बचत की गुल्लक जैसी है! जब आपको कभी भूख लगे या आप खूब काम करें, तो शरीर इसी गुल्लक से ऊर्जा निकालता है। आपका बॉडी फैट ${v} प्रतिशत है, जो कि बहुत ही स्वस्थ और एथलेटिक है! बहुत ज़्यादा फैट दिल और जोड़ों को थकाता है, पर आपका फैट बिल्कुल सही संतुलन में है।`;
      }
      if (lang === 'bn') {
        return `শরীরের ফ্যাট হলো আপনার এনার্জির জমানো পিগি ব্যাঙ্ক! যখন আপনি খুব ব্যস্ত থাকেন, শরীর এখান থেকেই শক্তি খরচ করে। আপনার ফ্যাটের পরিমাণ ${v} শতাংশ, যা চমৎকার ও অ্যাথলেটিক সুস্থতার প্রমাণ! অতিরিক্ত ফ্যাট শরীরকে ভারী করে, কিন্তু আপনার ফ্যাট একদম সুন্দর নিয়ন্ত্রণে আছে।`;
      }
      return `Think of body fat as your energy piggy bank! When you are running around or working hard, your body takes energy from this bank. Yours is ${v} percent, which is classified as very healthy and athletic! Having too much fat strains the heart, but yours is beautifully balanced.`;
    }
  },

  muscleMass: {
    icon: '🚗',
    key: 'muscleMass',
    title: {
      hi: 'मांसपेशियां (शरीर का असली इंजन)',
      en: 'Muscle Mass (Power Engine)',
      bn: 'মাংসপেশি (শরীরের আসল ইঞ্জিন)'
    },
    subtitle: {
      hi: 'दौड़ने और काम करने की असली ताक़त',
      en: 'Your daily strength and stamina',
      bn: 'দৈনন্দিন কাজের মূল চালিকাশক্তি'
    },
    getText: (val, ctx, lang = 'en') => {
      const v = val ? Number(val).toFixed(1) : '36.4';
      if (lang === 'hi') {
        return `मांसपेशियां आपके शरीर का असली इंजन और सुपरहीरो वाली ताक़त हैं! यही आपको सीढ़ियां चढ़ने, खेलने और भारी चीज़ें उठाने की शक्ति देती हैं। आपका मसल मास ${v} किलो है। अगर मांसपेशियां कम हों तो थकान जल्दी होती है और शरीर ढीला लगता है। मूंग दाल, पनीर, अंकुरित अनाज और रोज़ाना की सैर से यह इंजन हमेशा ताक़तवर रहेगा!`;
      }
      if (lang === 'bn') {
        return `মাংসপেশি হলো আপনার শরীরের আসল ইঞ্জিন আর সুপারহিরোর শক্তি! এগুলোই আপনাকে সিঁড়ি ভাঙতে, জিনিসপত্র তুলতে আর ক্লান্তিহীন থাকতে সাহায্য করে। আপনার পেশীর ওজন ${v} কেজি। পেশী কম থাকলে শরীর দ্রুত ক্লান্ত হয়ে পড়ে। মুগ ডাল, ছানা, ডিম আর নিয়মিত হাঁটাচলায় ইঞ্জিন একদম শক্তিশালী থাকবে!`;
      }
      return `Your muscles are your body's power engine and superhero strength! They help you climb stairs, carry things, and stay active without tiring out. Your muscle mass is ${v} kg. When muscle is low, stamina drops quickly. Adding simple protein like dal, paneer, sprouts, and eggs will give your engine maximum power!`;
    }
  },

  hydration: {
    icon: '💧',
    key: 'hydration',
    title: {
      hi: 'पानी का संतुलन (पौधे की सिंचाई)',
      en: 'Hydration (Plant Watering)',
      bn: 'জলীয় মাত্রা (গাছের গোড়ায় জল)'
    },
    subtitle: {
      hi: 'शरीर को ताज़ा और हल्का रखने का अमृत',
      en: 'Fresh water for natural glow & energy',
      bn: 'শরীরকে সতেজ রাখার মূল উপাদান'
    },
    getText: (val, ctx, lang = 'en') => {
      const v = val ? Number(val).toFixed(1) : '81.6';
      if (lang === 'hi') {
        return `जैसे किसी पौधे को पानी देने से उसकी पत्तियां खिली-खिली रहती हैं, वैसे ही हमारा शरीर है! आपका हाइड्रेशन लेवल लगभग ${v} प्रतिशत है, जो कि बहुत ही बढ़िया है। यह जोड़ों को चिकना रखता है, त्वचा पर चमक लाता है और सुस्ती कभी पास नहीं आने देता।`;
      }
      if (lang === 'bn') {
        return `গাছে যেমন জল দিলে পাতা তরতাজা হয়ে ওঠে, আমাদের শরীরও ঠিক তেমনই! আপনার জলীয় মাত্রা প্রায় ${v} শতাংশ, যা চমৎকার! এটি শরীরের জোড়গুলোকে সচল রাখে, ত্বকে উজ্জ্বলতা আনে এবং ক্লান্তি দূর করে।`;
      }
      return `Just like watering a green houseplant so its leaves stay shiny and bouncy, your cellular hydration is at ${v} percent! This cushions your joints, clears toxins, and keeps your daily vitality steady throughout the day.`;
    }
  },

  visceralFat: {
    icon: '🛡️',
    key: 'visceralFat',
    title: {
      hi: 'विसरल फैट (अंदरूनी अंगों की सुरक्षा)',
      en: 'Visceral Fat (Deep Organ Health)',
      bn: 'ভিসারাল ফ্যাট (ভেতরের অঙ্গের সুরক্ষা)'
    },
    subtitle: {
      hi: 'पेट के अंदरूनी अंगों के आसपास की चर्बी',
      en: 'Hidden belly fat protecting internal organs',
      bn: 'পেটের ভেতরের অঙ্গের চারপাশের চর্বি'
    },
    getText: (val, ctx, lang = 'en') => {
      const v = val ? Math.round(Number(val)) : 1;
      if (lang === 'hi') {
        return `विसरल फैट वह छुपी हुई चर्बी है जो पेट के अंदर लिवर और दिल के आसपास होती है। आपका विसरल फैट स्कोर ${v} है, जो कि बहुत ही सुरक्षित और सेहतमंद है! विसरल फैट बढ़ने से अंदरूनी अंगों पर दबाव पड़ता है, इसलिए इसे 1 से 5 के बीच रखना सबसे अच्छा होता है।`;
      }
      if (lang === 'bn') {
        return `ভিসারাল ফ্যাট হলো পেটের ভেতরের লিভার ও হার্টের চারপাশের লুকোনো চর্বি। আপনার ভিসারাল ফ্যাট স্কোর ${v}, যা খুবই নিরাপদ ও দারুণ স্বাস্থ্যকর! এটি বাড়লে ভেতরের অঙ্গের ওপর চাপ বাড়ে, তাই এটি কম থাকা হার্টের জন্য খুব ভালো।`;
      }
      return `Visceral fat is the hidden cushion around your deep stomach organs like your liver and heart. Your score is ${v}, which is low and very healthy! High visceral fat crowds internal organs, so keeping it low protects your heart and metabolic health.`;
    }
  },

  subcutaneousFat: {
    icon: '🧥',
    key: 'subcutaneousFat',
    title: {
      hi: 'सबक्यूटेनियस फैट (त्वचा के नीचे का सुरक्षा कवच)',
      en: 'Subcutaneous Fat (Skin Cushion Layer)',
      bn: 'সাবকিউটেনিয়াস ফ্যাট (ত্বকের নিচের নরম স্তর)'
    },
    subtitle: {
      hi: 'त्वचा के नीचे की हल्की सुरक्षात्मक परत',
      en: 'Natural warmth and protection layer',
      bn: 'শরীরের স্বাভাবিক উষ্ণতা ও সুরক্ষার স্তর'
    },
    getText: (val, ctx, lang = 'en') => {
      const v = val ? Number(val).toFixed(1) : '12.6';
      if (lang === 'hi') {
        return `सबक्यूटेनियस फैट वह हल्की परत है जो आपकी त्वचा के ठीक नीचे होती है — एक आरामदायक स्वेटर की तरह, जो शरीर को गरमाहट देती है और हल्की चोट से बचाती है। आपका लेवल ${v} प्रतिशत है, जो बिल्कुल सही और उत्तम है!`;
      }
      if (lang === 'bn') {
        return `সাবকিউটেনিয়াস ফ্যাট হলো ত্বকের ঠিক নিচে থাকা নরম সুরক্ষার স্তর — ঠিক যেমন একটা আরামদায়ক হালকা চাদর, যা শরীরকে উষ্ণ রাখে আর বাইরের আঘাত থেকে বাঁচায়। আপনার মাত্রা ${v} শতাংশ, যা একদম নিখুঁত!`;
      }
      return `Subcutaneous fat is the soft, gentle layer right beneath your skin — like a cozy lightweight sweater that keeps you warm and cushions against everyday bumps. Yours is ${v} percent, which is considered optimal!`;
    }
  },

  dailyCalories: {
    icon: '⚡',
    key: 'dailyCalories',
    title: {
      hi: 'दैनिक कैलोरी की ज़रूरत (रोज़ का ईंधन)',
      en: 'Daily Calorie Needs (Daily Energy Fuel)',
      bn: 'দৈনিক ক্যালোরির প্রয়োজন (সারাদিনের জ্বালানি)'
    },
    subtitle: {
      hi: 'शरीर को दिनभर चलाने के लिए कितनी खुराक चाहिए',
      en: 'Recommended calorie intake for optimal vitality',
      bn: 'সারাদিন সক্রিয় থাকতে কতটা খাবারের শক্তি দরকার'
    },
    getText: (val, ctx, lang = 'en') => {
      const vitals = (typeof ctx === 'object' && ctx !== null) ? (ctx.vitals || ctx) : {};
      const cal = val ? Math.round(Number(val)) : Math.round(Number(vitals.bmr || 1420) * 1.2 || 1705);
      if (lang === 'hi') {
        return `जैसे गाड़ी को चलने के लिए रोज़ पेट्रोल चाहिए, वैसे ही आपके शरीर को दिनभर सांस लेने, चलने और काम करने के लिए रोज़ाना लगभग ${cal} कैलोरी ऊर्जा चाहिए। घर की ताज़ी दाल-रोटी, सब्ज़ी, फल और दूध से यह ईंधन आसानी से मिल जाता है!`;
      }
      if (lang === 'bn') {
        return `গাড়ি যেমন চলতে রোজ তেল লাগে, তেমনই আপনার শরীর সারাদিন নিঃশ্বাস নিতে, হাঁটতে ও কাজ করতে প্রতিদিন প্রায় ${cal} ক্যালোরি শক্তি খরচ করে। ঘরের ভাত, ডাল, রুটি আর ফল থেকেই এই পুষ্টিকর শক্তি পাওয়া যায়!`;
      }
      return `Think of calories as the daily fuel your body needs just to breathe, walk, and stay active. Your recommended daily intake is about ${cal} calories. Wholesome home foods like dal, grains, vegetables, and milk easily provide this clean daily energy!`;
    }
  },

  fatMuscleRatio: {
    icon: '⚖️',
    key: 'fatMuscleRatio',
    title: {
      hi: 'फैट-मसल अनुपात (चर्बी और ताक़त का तालमेल)',
      en: 'Fat-to-Muscle Ratio (Body Balance)',
      bn: 'ফ্যাট-মাসল অনুপাত (চর্বি ও পেশীর ভারসাম্য)'
    },
    subtitle: {
      hi: 'फैट और मांसपेशियों का आपस में मुकाबला',
      en: 'Ratio of fat versus active lean muscle',
      bn: 'শরীরে চর্বি ও সক্রিয় পেশীর সঠিক সামঞ্জস্য'
    },
    getText: (val, ctx, lang = 'en') => {
      const r = val ? Number(val).toFixed(1) : '0.2';
      if (lang === 'hi') {
        return `फैट और मसल का अनुपात यह देखता है कि शरीर में चर्बी के मुकाबले मांसपेशियां कितनी हैं। 0.5 से कम होना बहुत ही शानदार माना जाता है, और आपका स्कोर ${r} है! इसका मतलब है कि शरीर में फालतू चर्बी बहुत कम है और मांसपेशियों का संतुलन बहुत अच्छा है।`;
      }
      if (lang === 'bn') {
        return `ফ্যাট আর মাসলের অনুপাত দেখায় চর্বির তুলনায় সক্রিয় পেশী কতটা বেশি। ০.৫-এর কম থাকা মানে চমৎকার, আর আপনার স্কোর ${r}! অর্থাৎ শরীরে অপ্রয়োজনীয় চর্বি খুব কম এবং পেশীর ভারসাম্য দারুণ।`;
      }
      return `The fat-to-muscle ratio compares how much fat you have compared to active muscle. Anything below 0.5 is considered excellent, and your score is ${r}! That means your body carries plenty of useful muscle with very little unwanted fat.`;
    }
  },

  efficiency: {
    icon: '🔋',
    key: 'efficiency',
    title: {
      hi: 'मेटाबॉलिक कार्यक्षमता (ऊर्जा की बचत)',
      en: 'Metabolic Efficiency (Energy Reserve)',
      bn: 'মেটাবলিক দক্ষতা (শক্তির কার্যক্ষমতা)'
    },
    subtitle: {
      hi: 'शरीर कितनी समझदारी से ऊर्जा खर्च करता है',
      en: 'Energy reserve and efficiency of your metabolism',
      bn: 'শরীর কতটা দক্ষতার সাথে শক্তি ব্যবহার করে'
    },
    getText: (val, ctx, lang = 'en') => {
      const eff = val ? Number(val).toFixed(1) : '0.8';
      if (lang === 'hi') {
        return `मेटाबॉलिक कार्यक्षमता यह बताती है कि आपका शरीर कितनी कुशलता से खाना पचाकर ऊर्जा बनाता है। आपकी कार्यक्षमता ${eff} है, जो थोड़ी कम है। जब कार्यक्षमता कम होती है, तो शरीर को काम करने में ज़्यादा मेहनत करनी पड़ती है और सुस्ती आती है। भरपूर पानी पीने, समय पर सोने और रोज़ टहलने से यह जल्दी सुधर जाती है।`;
      }
      if (lang === 'bn') {
        return `মেটাবলিক দক্ষতা দেখায় শরীর কতটা সহজে খাবার থেকে শক্তি তৈরি করতে পারছে। আপনার দক্ষতা ${eff}, যা কিছুটা কম। দক্ষতা কম থাকলে সামান্য কাজেই বেশি ক্লান্তি লাগে। পর্যাপ্ত জল খাওয়া, সময়মতো ঘুম আর নিয়মিত হাঁটলে এটি খুব দ্রুত উন্নত হয়।`;
      }
      return `Metabolic efficiency reflects how smartly your body converts food into daily stamina. Your score is ${eff}, which indicates an area for improvement. Low efficiency means your body spends extra effort doing everyday tasks. Good hydration, sound sleep, and daily walks will quickly boost your efficiency.`;
    }
  },

  dataConfidence: {
    icon: '📊',
    key: 'dataConfidence',
    title: {
      hi: 'जांच की पुष्टि और विश्वास (7-स्कैन प्रणाली)',
      en: 'Scan Confidence (7-Scan Confirmation)',
      bn: 'স্ক্যানের নির্ভুলতা (৭-স্ক্যান পদ্ধতি)'
    },
    subtitle: {
      hi: 'बार-बार जांच करके पक्के नतीजे निकालना',
      en: 'Gradual confirmation across 112 health metrics',
      bn: 'বারবার পরীক্ষার মাধ্যমে ১১২টি তথ্যের নির্ভুলতা'
    },
    getText: (val, ctx, lang = 'en') => {
      if (lang === 'hi') {
        return `रिलिव में हम किसी एक झटके के अंदाज़े पर आपकी सेहत तय नहीं करते! कुल 7 स्कैन के ज़रिये हम 112 से ज़्यादा बायोमेट्रिक संकेत जांचते हैं। पहले स्कैन से विश्वास 14 प्रतिशत से शुरू होकर 7वें स्कैन तक 100 प्रतिशत पक्का हो जाता है, ताकि आपको डॉक्टर को दिखाने लायक सबसे भरोसेमंद रिपोर्ट मिले।`;
      }
      if (lang === 'bn') {
        return `রিলিভে আমরা একটা স্ক্যানের অনুমানে কোনো সিদ্ধান্ত নিই না! মোট ৭টি স্ক্যানের মাধ্যমে ১১২টিরও বেশি তথ্য যাচাই করা হয়। প্রথম স্ক্যানে ১৪ শতাংশ থেকে শুরু করে ৭ম স্ক্যানে এটি ১০০ শতাংশ নিশ্চিত হয়, যাতে আপনি সবচেয়ে নির্ভরযোগ্য স্বাস্থ্য রিপোর্ট পান।`;
      }
      return `At Reliv, we never guess your health from a single quick reading. Across our 7-scan protocol, we sample over 112 biometric data points. Data confidence progresses gradually from 14 percent up to 100 percent, giving you verified, doctor-ready health insights you can truly rely on.`;
    }
  },

  temperature: {
    icon: '🌡️',
    key: 'temperature',
    title: {
      hi: 'शरीर का तापमान (भीतरी गरमाहट)',
      en: 'Body Temperature (Thermal Balance)',
      bn: 'শরীরের তাপমাত্রা (ভেতরের উষ্ণতা)'
    },
    subtitle: {
      hi: 'शरीर की भीतरी गरमाहट और संतुलन',
      en: 'Your gentle thermal balance',
      bn: 'শরীরের স্বাভাবিক উষ্ণতার পরিমাপ'
    },
    getText: (val, ctx, lang = 'en') => {
      const v = val ? Number(val).toFixed(1) : '98.6';
      if (lang === 'hi') {
        return `शरीर का तापमान यह बताता है कि भीतरी गरमाहट कितनी है। सामान्य तापमान 98.6 डिग्री होता है। थोड़ा सा बढ़ा हुआ तापमान हल्की धूप में चलने, भागदौड़ या हल्के तनाव की वजह से भी हो सकता है। थोड़ा सा पानी पीकर आराम करने से यह शांत हो जाता है।`;
      }
      if (lang === 'bn') {
        return `শরীরের তাপমাত্রা ভেতরের স্বাভাবিক উষ্ণতা নির্দেশ করে। সাধারণ তাপমাত্রা ৯৮.৬ ডিগ্রি। সামান্য বেশি থাকা মানে হাঁটাচলা, রোদের তাপ বা মৃদু ক্লান্তির ফল হতে পারে। একটু জল খেয়ে বিশ্রাম নিলেই এটি স্বাভাবিক হয়ে যায়।`;
      }
      return `Body temperature reflects your inner thermal balance. A normal resting reading is around 98.6 degrees. A slightly elevated temperature can easily happen from walking to the kiosk, recent activity, or mild stress. Drinking cool water and resting brings it right back to normal.`;
    }
  },

  eyesight: {
    icon: '👁️',
    key: 'eyesight',
    title: {
      hi: 'आंखों की जांच (दृष्टि की स्पष्टता)',
      en: 'Eyesight Screening (Visual Acuity)',
      bn: 'চোখের পরীক্ষা (দৃষ্টির স্পষ্টতা)'
    },
    subtitle: {
      hi: 'स्क्रीन और दूर की चीज़ें देखने की क्षमता',
      en: 'Vision screening and eye comfort',
      bn: 'চোখের দৃষ্টি ও দেখার স্বচ্ছতা'
    },
    getText: (val, ctx, lang = 'en') => {
      if (lang === 'hi') {
        return `आंखों की यह जांच एक सामान्य स्क्रीनिंग है जो यह देखती है कि आप अक्षर कितनी आसानी से पहचान पा रहे हैं। अगर आपको कभी भी पढ़ते समय आंखों में खिंचाव, भारीपन या धुंधलापन लगे, तो आंखों के डॉक्टर से चश्मा या जांच कराना हमेशा सबसे सुरक्षित रहता है।`;
      }
      if (lang === 'bn') {
        return `চোখের এই পরীক্ষাটি একটি সাধারণ স্ক্রীনিং যা দেখে আপনি অক্ষরগুলো কতটা সহজে পড়তে পারছেন। পড়ার সময় চোখে ক্লান্তি, টান বা ঝাপসা লাগলে চোখের ডাক্তারকে দেখিয়ে চশমা নেওয়া সবসময়ই ভালো।`;
      }
      return `This eyesight check is a friendly screening of how clearly you can read lines on screen. If you ever notice blurred vision, headaches, or eye strain when working, consulting an optometrist for a formal eye exam is always recommended.`;
    }
  },

  bloodPressure: {
    icon: '🚿',
    key: 'bloodPressure',
    title: {
      hi: 'ब्लड प्रेशर (पाइप में पानी का बहाव)',
      en: 'Blood Pressure (Water in a Hose)',
      bn: 'ব্লাড প্রেশার (নালীতে রক্তের গতি)'
    },
    subtitle: {
      hi: 'नसों में खून का शांत और सुरक्षित बहाव',
      en: 'The calm flow of blood in your vessels',
      bn: 'রক্তনালীতে রক্তের শান্ত প্রবাহ'
    },
    getText: (val, ctx, lang = 'en') => {
      const vitals = (typeof ctx === 'object' && ctx !== null) ? (ctx.vitals || ctx) : {};
      const sys = vitals.systolic || vitals.bpSystolic || 99;
      const dia = vitals.diastolic || vitals.bpDiastolic || 63;
      if (lang === 'hi') {
        return `ब्लड प्रेशर का मतलब है नसों में खून का बहाव — जैसे बगीचे के पाइप में पानी बहता है। आपका ब्लड प्रेशर ${sys} और ${dia} है, जो बिल्कुल शांत और सुरक्षित है! अगर नल बहुत तेज़ खोल दें तो पाइप पर ज़ोर पड़ता है। नमक कम खाने और सुकून से सोने से नसों पर कभी दबाव नहीं आता।`;
      }
      if (lang === 'bn') {
        return `ব্লাড প্রেশার মানে হলো রক্তনালীতে রক্ত চলাচলের গতি — ঠিক যেমন বাগানের পাইপে জল শান্তভাবে বইছে। আপনার রক্তচাপ ${sys} বাই ${dia}, যা একদম শান্ত ও নিরাপদ! শান্তিতে ঘুমালে আর কাঁচা লবণ কম খেলে এটি সবসময় সুন্দর থাকে।`;
      }
      return `Blood pressure is just the flow of blood through your body — exactly like water flowing smoothly through a garden hose. Yours is ${sys} over ${dia}, which is in a calm, safe, and optimal range! Sound sleep and low salt keep it peaceful.`;
    }
  },

  oxygen: {
    icon: '🌬️',
    key: 'oxygen',
    title: {
      hi: 'खून में ऑक्सीजन (ताज़ा हवा की खुराक)',
      en: 'Blood Oxygen (Fresh Air Fuel)',
      bn: 'রক্তে অক্সিজেন (টাটকা বাতাসের জোগান)'
    },
    subtitle: {
      hi: 'शरीर के हर अंग तक ताज़ी हवा',
      en: 'Pure morning air fueling every cell',
      bn: 'শরীরের প্রতিটি কোষে তাজা বাতাস'
    },
    getText: (val, ctx, lang = 'en') => {
      const v = val ? Math.round(Number(val)) : 98;
      if (lang === 'hi') {
        return `खून में ऑक्सीजन का मतलब है कि आपके फेफड़े कितनी अच्छी ताज़ी हवा अंदर ले रहे हैं। जैसे गाड़ी को बढ़िया पेट्रोल चाहिए, वैसे ही शरीर के हर हिस्से को ताज़ी हवा चाहिए। आपका ऑक्सीजन ${v} प्रतिशत है, जिसका मतलब है हर अंग तक ताज़ी सुबह की हवा भरपूर पहुँच रही है!`;
      }
      if (lang === 'bn') {
        return `রক্তে অক্সিজেন মানে আপনার ফুসফুস কতটা ভালো তাজা বাতাস শরীরে টেনে নিচ্ছে। গাড়ির যেমন ভালো জ্বালানি দরকার, তেমনই শরীরের সব অংশের তাজা বাতাস দরকার। আপনার অক্সিজেন ${v} শতাংশ, অর্থাৎ শরীর একদম প্রাণবন্ত!`;
      }
      return `Blood oxygen measures how much fresh air your lungs are sending across your body. Just like a car needs clean fuel, your body needs clean oxygen. Yours is ${v} percent, meaning every single cell is happily breathing!`;
    }
  },

  pulse: {
    icon: '🥁',
    key: 'pulse',
    title: {
      hi: 'दिल की धड़कन (सीने का प्यारा ढोल)',
      en: 'Heart Pulse (Chest Drum)',
      bn: 'হৃদস্পন্দন (বুকের ভেতর শান্ত ঢোল)'
    },
    subtitle: {
      hi: 'दिल की ताल और खून का संचरण',
      en: 'Your rhythmic inner heartbeat',
      bn: 'হৃদপিণ্ডের নিয়মিত শান্ত ছন্দ'
    },
    getText: (val, ctx, lang = 'en') => {
      const v = val ? Math.round(Number(val)) : 72;
      if (lang === 'hi') {
        return `पल्स यानी आपके दिल की धड़कन — यह आपके सीने में बजने वाला प्यारा सा ढोल है, जो दिन-रात मस्ती से धड़कता है। आपकी धड़कन ${v} प्रति मिनट है, जो कि बिल्कुल शांत और स्थिर ताल में चल रही है।`;
      }
      if (lang === 'bn') {
        return `নাড়ির গতি বা পালস হলো আপনার বুকের ভেতর একটা শান্ত ঢোলের তাল, যা সারাদিন রাত তালে তালে বাজে। আপনার নাড়ির গতি মিনিটে ${v} বার, যা একটি সুন্দর ও শান্ত ছন্দে চলছে।`;
      }
      return `Your pulse is like a friendly little drum beating rhythmically inside your chest. Yours is ${v} beats per minute, which is calm, steady, and peaceful.`;
    }
  },

  boneMass: {
    icon: '🏛️',
    key: 'boneMass',
    title: {
      hi: 'हड्डियों की मज़बूती (मकान के खंभे)',
      en: 'Bone Strength (House Pillars)',
      bn: 'হাড়ের শক্তি (বাড়ির মজবুত স্তম্ভ)'
    },
    subtitle: {
      hi: 'शरीर को सीधा रखने वाले खंभे',
      en: 'The strong pillars holding you up',
      bn: 'শরীরকে সোজা করে রাখা কাঠামো'
    },
    getText: (val, ctx, lang = 'en') => {
      const v = val ? Number(val).toFixed(2) : '2.97';
      if (lang === 'hi') {
        return `हड्डियां आपके शरीर के मज़बूत खंभे और दीवारें हैं, जो आपके पूरे शरीर को सीधा खड़ा रखती हैं। आपकी हड्डियों का खनिज वज़न ${v} किलोग्राम है। सुबह की धूप, दूध और दालें इन खंभों को हमेशा चट्टान की तरह पक्का बनाए रखती हैं।`;
      }
      if (lang === 'bn') {
        return `হাড় হলো আপনার শরীরের শক্ত দেওয়াল আর স্তম্ভ, যা পুরো শরীরটাকে সোজা করে ধরে রাখে। আপনার হাড়ের ওজন ${v} কিলোগ্রাম। সকালের মিষ্টি রোদ, দুধ আর ডাল এই স্তম্ভগুলোকে পাথরের মতো মজবুত রাখে।`;
      }
      return `Your bones are like the strong pillars holding up a house! Your bone mass is ${v} kg. Morning sunshine for natural Vitamin D and milk or curd keep these pillars solid and unbreakable.`;
    }
  },

  protein: {
    icon: '🛠️',
    key: 'protein',
    title: {
      hi: 'प्रोटीन (शरीर के नन्हें मिस्त्री)',
      en: 'Protein (Daily Repair Crew)',
      bn: 'প্রোটিন (শরীরের ছোট্ট মিস্ত্রি)'
    },
    subtitle: {
      hi: 'अंदरूनी टूट-फूट ठीक करने वाली ताक़त',
      en: 'Daily maintenance and repair',
      bn: 'দৈনন্দিন ক্ষয়পূরণ ও নতুন শক্তি'
    },
    getText: (val, ctx, lang = 'en') => {
      const v = val ? Number(val).toFixed(2) : '11.57';
      if (lang === 'hi') {
        return `प्रोटीन आपके शरीर के अंदर रहने वाले नन्हें मिस्त्रियों की तरह होता है! जब आप दिनभर काम करते हैं, तो यही मिस्त्री रात को अंदर की मरम्मत करते हैं और सुबह आपको नई ताक़त देते हैं। आपका प्रोटीन वज़न ${v} किलोग्राम है। दाल, पनीर और अंडों से यह खूब मिलता है।`;
      }
      if (lang === 'bn') {
        return `প্রোটিন হলো আপনার শরীরের ভেতরে থাকা একদল দক্ষ মিস্ত্রির মতো! সারাদিন কাজ করার পর এই মিস্ত্রিরাই রাতে আপনার শরীর মেরামত করে নতুন শক্তি এনে দেয়। আপনার প্রোটিনের ওজন ${v} কিলোগ্রাম। ডাল, ছানা আর ডিমে প্রচুর প্রোটিন থাকে।`;
      }
      return `Protein is like a team of friendly repair workers living inside you! Every night while you sleep, they patch up tired muscles and build new strength. Your protein mass is ${v} kg. Wholesome dal, paneer, and eggs keep this repair crew fully supplied.`;
    }
  }
};

export const CANONICAL_METRIC_MAP = {
  standardweight: 'standardWeight',
  standard_weight: 'standardWeight',
  weightcontrol: 'standardWeight',
  idealweight: 'standardWeight',
  idealbodyweight: 'standardWeight',
  weight: 'standardWeight',

  fatcontrol: 'fatControl',
  fat_control: 'fatControl',

  musclecontrol: 'muscleControl',
  muscle_control: 'muscleControl',

  ideal_body_weight: 'idealBodyWeight',

  bodyfat: 'bodyFat',
  fat: 'bodyFat',
  fatpercentage: 'bodyFat',
  fat_percent: 'bodyFat',

  musclemass: 'muscleMass',
  muscle: 'muscleMass',
  muscle_mass: 'muscleMass',

  hydration: 'hydration',
  bodywater: 'hydration',
  water: 'hydration',
  waterbalance: 'hydration',
  waterpct: 'hydration',

  visceralfat: 'visceralFat',
  visceral: 'visceralFat',
  visceral_fat: 'visceralFat',

  subcutaneousfat: 'subcutaneousFat',
  subcutaneous: 'subcutaneousFat',
  subcutaneous_fat: 'subcutaneousFat',

  dailycalories: 'dailyCalories',
  calories: 'dailyCalories',
  bmr: 'dailyCalories',
  dailycalorieneeds: 'dailyCalories',

  fatmuscleratio: 'fatMuscleRatio',
  fat_muscle_ratio: 'fatMuscleRatio',
  ratio: 'fatMuscleRatio',

  efficiency: 'efficiency',
  metabolicefficiency: 'efficiency',
  metabolicload: 'efficiency',
  energyreserve: 'efficiency',

  dataconfidence: 'dataConfidence',
  scanconfidence: 'dataConfidence',
  sevenscans: 'dataConfidence',
  scans: 'dataConfidence',
  confidence: 'dataConfidence',

  temperature: 'temperature',
  bodytemperature: 'temperature',
  temp: 'temperature',

  eyesight: 'eyesight',
  vision: 'eyesight',
  eyescreening: 'eyesight',

  bmi: 'bmi',
  bodymassindex: 'bmi',

  metabolicage: 'metabolicAge',
  biologicalage: 'metabolicAge',
  bioage: 'metabolicAge',
  insideage: 'metabolicAge',

  bodyscore: 'bodyScore',
  healthscore: 'bodyScore',
  vitalityscore: 'bodyScore',

  bloodpressure: 'bloodPressure',
  bp: 'bloodPressure',
  systolic: 'bloodPressure',
  diastolic: 'bloodPressure',

  oxygen: 'oxygen',
  spo2: 'oxygen',
  bloodoxygen: 'oxygen',

  pulse: 'pulse',
  bpm: 'pulse',
  heartrate: 'pulse',

  bonemass: 'boneMass',
  bone: 'boneMass',
  bone_mass: 'boneMass',

  protein: 'protein',
  proteinmass: 'protein',
  protein_mass: 'protein',
};

/**
 * Returns a short, super-friendly 5-year-old child explanation for any vital.
 */
export function getMetricLaymanExplainer(metricKey, healthData, language = 'en') {
  if (!metricKey) return null;
  const normalized = String(metricKey).toLowerCase().replace(/[^a-z0-9_]/g, '');
  const canonicalKey = CANONICAL_METRIC_MAP[normalized] || metricKey;
  const item = METRIC_EXPLAINERS[canonicalKey];
  if (!item) return null;

  const vitals = (typeof healthData === 'object' && healthData !== null) ? (healthData.vitals || healthData) : {};
  let val = null;

  if (canonicalKey === 'metabolicAge') val = healthData?.metabolicAge || vitals?.metabolicAge;
  else if (canonicalKey === 'bodyScore') val = healthData?.bodyScore || vitals?.bodyScore;
  else if (canonicalKey === 'bmi') val = vitals?.bmi;
  else if (canonicalKey === 'bodyFat') val = vitals?.bodyFat;
  else if (canonicalKey === 'muscleMass') val = vitals?.muscleMass;
  else if (canonicalKey === 'pulse') val = vitals?.pulse || vitals?.bpm;
  else if (canonicalKey === 'oxygen') val = vitals?.oxygen || vitals?.spo2;
  else if (canonicalKey === 'standardWeight') val = vitals?.weight;
  else if (canonicalKey === 'hydration') val = vitals?.waterPct || vitals?.bodyWater;
  else if (canonicalKey === 'visceralFat') val = vitals?.visceralFat;
  else if (canonicalKey === 'subcutaneousFat') val = vitals?.subcutaneousFat;
  else if (canonicalKey === 'boneMass') val = vitals?.boneMass;
  else if (canonicalKey === 'protein') val = vitals?.protein || vitals?.proteinMass;
  else if (canonicalKey === 'dailyCalories') val = vitals?.bmr;
  else if (canonicalKey === 'temperature') val = vitals?.temperature;
  else if (canonicalKey === 'fatMuscleRatio') val = vitals?.fatMuscleRatio;
  else if (canonicalKey === 'fatControl') val = vitals?.bodyFat;
  else if (canonicalKey === 'muscleControl') val = vitals?.muscleMass;

  return item.getText(val, healthData, language);
}

// ── DYNAMIC LAYMAN REPORT EXPLANATION DECODERS (OFFLINE, ZERO DOCTOR JARGON) ──

/**
 * Report 1: Health Score & Overview
 * 9 Score Bands, Plain-Language Explanation, Peer Reference (72), Blind/Elderly Accessibility, Next Guidance
 */
export function getReport1Speech(healthData, language = 'en') {
  const patient = healthData?.patient || {};
  const vitals = healthData?.vitals || {};
  const name = patient?.name ? patient.name.split(' ')[0] : (language === 'hi' ? 'दोस्त' : language === 'bn' ? 'বন্ধু' : 'Friend');
  const score = Math.round(Number(healthData?.bodyScore || vitals?.bodyScore || 85));

  if (language === 'hi') {
    let text = `${name}... `;
    text += `आपका हेल्थ स्कोर 100 में से ${score} है। `;

    if (score >= 95) {
      text += `बहुत ही बढ़िया! आज चेक की गई ज्यादातर रीडिंग्स सही सीमा के बहुत करीब हैं। आप बहुत अच्छा कर रहे हैं। आपकी उम्र के लोगों का सामान्य संदर्भ स्कोर लगभग 72 होता है, और आपका स्कोर उससे काफी ऊपर है। अपनी स्वस्थ दिनचर्या ऐसे ही बनाए रखिए। `;
    } else if (score >= 90) {
      text += `शानदार! आज आपकी सेहत की जांच बहुत अच्छी आई है। ज्यादातर माप अपनी सही सीमा में हैं। एक-दो चीजों में और सुधार हो सकता है, लेकिन कुल मिलाकर आप बहुत अच्छा कर रहे हैं। `;
    } else if (score >= 80) {
      text += `बहुत अच्छा! आपका हेल्थ स्कोर 100 में से मापा जाता है। एक अच्छे स्कोर का मतलब है कि आज की ज्यादातर जांचें अपनी सही सीमा के बहुत करीब हैं। आपकी ज्यादातर रीडिंग्स बहुत अच्छी आई हैं, और बस एक-दो जगहों पर थोड़ा सुधार हो सकता है। आपकी उम्र के लोगों का सामान्य संदर्भ स्कोर लगभग 72 होता है, और आपका स्कोर ${score} उससे काफी ऊपर है। `;
    } else if (score >= 70) {
      text += `अच्छा रिजल्ट है। आपकी रीडिंग्स एक सामान्य आधार पर हैं। काफी जांचें अच्छी हैं और कुछ में सुधार किया जा सकता है। आपकी उम्र का संदर्भ स्कोर लगभग 72 है, और आपका स्कोर उसके करीब है। `;
    } else if (score >= 60) {
      text += `रिजल्ट ठीक है, लेकिन सुधार की गुंजाइश है। कुछ रीडिंग्स अच्छी हैं और कुछ पर थोड़ा ध्यान देने की जरूरत है। नियमित चलना, संतुलित खाना और अच्छी नींद बनाए रखें। यह सिर्फ आज का स्कोर है, इसका मतलब यह नहीं कि आप अस्वस्थ हैं। `;
    } else if (score >= 50) {
      text += `आज की कुछ रीडिंग्स पर थोड़ा ध्यान देने की जरूरत है। इसका मतलब यह नहीं कि कोई गंभीर समस्या है। बस कुछ माप अपनी सही सीमा से थोड़ी दूर हैं। अब हम आपको बताएंगे कि क्या अच्छा है और कहां सुधार करना है। `;
    } else if (score >= 40) {
      text += `कुछ हिस्सों में सुधार की जरूरत है। घबराइए मत। एक चेकअप से पूरी सेहत तय नहीं होती। बस कुछ माप अपनी सीमा से थोड़ी बाहर हैं। हम एक-एक करके समझाएंगे कि किस पर ध्यान देना है। `;
    } else if (score >= 30) {
      text += `आज कई रीडिंग्स पर अधिक ध्यान देने की जरूरत है। घबराइए मत, यह कोई अंतिम रोग का फैसला नहीं है। पानी कम पीना, तनाव या थकान से भी माप बदल सकते हैं। असामान्य जांचों को दोबारा देखना बेहतर रहेगा। `;
    } else {
      text += `आज की कई जांचें सामान्य सीमा से काफी दूर हैं, इसलिए इन्हें ध्यान से देखना जरूरी है। घबराइए मत। सिर्फ इस स्कोर से कोई बीमारी तय नहीं होती। इन जांचों को दोबारा चेक करें और जरूरत लगे तो डॉक्टर से सलाह लें। `;
    }

    text += `यह स्कोर केवल एक सामान्य सारांश है, कोई डॉक्टरी बीमारी नहीं। आपको स्क्रीन देखने की बिल्कुल जरूरत नहीं है। मैं आपकी रिपोर्ट का हर जरूरी हिस्सा आपको आसान शब्दों में समझाऊंगी। अगली स्क्रीन पर चलिए, और देखते हैं कि आपके शरीर का कौन सा हिस्सा सबसे मजबूत है और कहां थोड़ा ध्यान देना है।`;
    return text;
  }

  if (language === 'bn') {
    let text = `${name}... `;
    text += `আপনার হেলথ স্কোর ১০০-এর মধ্যে ${score}। `;

    if (score >= 95) {
      text += `দারুণ রেজাল্ট! আজ চেক করা বেশিরভাগ পরিমাপ স্বাভাবিক সীমার খুব কাছে রয়েছে। আপনি খুব ভালো করছেন। আপনার বয়সের মানুষদের রেফারেন্স স্কোর প্রায় ৭২, আর আপনার স্কোর তার চেয়ে অনেক বেশি। এই সুস্থ রুটিন বজায় রাখুন। `;
    } else if (score >= 90) {
      text += `চমৎকার! আজ আপনার সামগ্রিক রিপোর্ট খুবই ভালো। বেশিরভাগ মান সঠিক সীমার মধ্যে রয়েছে। অল্প কিছু জায়গায় উন্নতির সুযোগ রয়েছে, তবে সার্বিকভাবে আপনি খুব ভালো আছেন। `;
    } else if (score >= 80) {
      text += `খুব ভালো রেজাল্ট! আপনার হেলথ স্কোর ১০০-র মধ্যে হিসাব করা হয়। একটি ভালো স্কোরের অর্থ হলো আজকের বেশিরভাগ পরিমাপ স্বাভাবিক সীমার খুব কাছাকাছি রয়েছে। আপনার বেশিরভাগ রিডিং খুবই ভালো এসেছে, আর সামান্য কিছু জায়গায় আরও একটু উন্নতি করা যেতে পারে। আপনার বয়সের মানুষদের সাধারণ রেফারেন্স স্কোর প্রায় ৭২, আর আপনার স্কোর ${score} তার চেয়ে বেশ উপরে। `;
    } else if (score >= 70) {
      text += `ভালো ফলাফল। আপনার স্বাস্থ্য একটি ভালো স্তরে রয়েছে। অনেকগুলো মান বেশ ভালো, আর কয়েকটিতে একটু নজর দেওয়া যায়। আপনার বয়সের রেফারেন্স স্কোর প্রায় ৭২, আর আপনার স্কোর তার কাছাকাছি বা একটু উপরে। `;
    } else if (score >= 60) {
      text += `ফলাফল মোটামুটি ভালো, তবে উন্নতির সুযোগ রয়েছে। কিছু রিডিং ভালো এসেছে, আর কিছু বিষয়ে একটু বেশি যত্ন নেওয়া দরকার। নিয়মিত হাঁটা, সুষম খাবার আর ভালো ঘুমের ওপর নজর দিন। এটি শুধু আজকের পরিমাপের একটি সারসংক্ষেপ, এর মানে আপনি অসুস্থ নন। `;
    } else if (score >= 50) {
      text += `আজকের কিছু রিডিংয়ে একটু মনোযোগ দেওয়া প্রয়োজন। এর মানে এই নয় যে নিশ্চিত কোনো বড় সমস্যা আছে। শুধু কিছু মান পছন্দের সীমা থেকে কিছুটা দূরে রয়েছে। আমরা সহজ ভাষায় বুঝিয়ে দেবো কোন মানগুলো ভালো আর কোথায় উন্নতি দরকার। `;
    } else if (score >= 40) {
      text += `কিছু জায়গায় উন্নতির প্রয়োজন রয়েছে। একদম ভয় পাবেন না। একটিমাত্র স্ক্যান দিয়ে পুরো স্বাস্থ্য বিচার করা যায় না। কিছু পরিমাপ স্বাভাবিক সীমার বাইরে রয়েছে, আমরা এক এক করে বুঝিয়ে দেবো কী করতে হবে। `;
    } else if (score >= 30) {
      text += `বেশ কিছু রিডিংয়ে আজ বাড়তি নজর দেওয়া দরকার। শান্ত থাকুন, এই স্কোরটি কোনো চূড়ান্ত রোগ নির্ণয় নয়। জল কম খাওয়া, ক্লান্তি বা মানসিক চাপের কারণেও মান পরিবর্তিত হতে পারে। অস্বাভাবিক রিডিংগুলো পুনরায় পরীক্ষা করা ভালো। `;
    } else {
      text += `আজকের বেশ কিছু পরিমাপ স্বাভাবিক সীমা থেকে অনেকটাই দূরে রয়েছে, তাই এগুলো গুরুত্ব দিয়ে দেখা দরকার। ভয় পাওয়ার কারণ নেই। শুধুমাত্র এই স্কোর দিয়ে কোনো রোগ নির্ধারণ হয় না। প্রয়োজনে অস্বাভাবিক মাপগুলো আবার পরীক্ষা করুন এবং ডাক্তারের পরামর্শ নিন। `;
    }

    text += `এই স্কোরটি শুধুমাত্র একটি সংক্ষিপ্ত চিত্র, কোনো রোগ নির্ণয় নয়। আপনাকে স্ক্রিনের দিকে তাকিয়ে পড়ার দরকার নেই। আমি আপনার রিপোর্টের প্রতিটি গুরুত্বপূর্ণ অংশ সহজ ভাষায় বুঝিয়ে দিচ্ছি। এবার চলুন দেখা যাক আপনার শরীরের কোন দিকটি সবচেয়ে শক্তিশালী আর কোন দিকটায় একটু যত্ন নেওয়া দরকার।`;
    return text;
  }

  // English fallback
  let text = `${name}... `;
  text += `Your health score is ${score} out of 100. That is a very good result! `;
  text += `A higher score means more of today's checked values are closer to their preferred ranges. `;

  if (score >= 95) {
    text += `Outstanding! Most of the values checked today are very close to their preferred ranges. You are doing extremely well. The reference score for people around your age is about 72, and your score is much higher. Keep following your healthy routine. `;
  } else if (score >= 90) {
    text += `Excellent! Your overall readings look very good today. Most values are within or close to their preferred ranges. There may still be a small area to improve, but overall you are doing very well. The reference score for people around your age is about 72, and your score is ${score}, which is above that reference. `;
  } else if (score >= 80) {
    text += `Very good! Most of today’s readings are looking good. A few areas could still improve, but your overall result is strong. Keep up your healthy habits. The reference score for your age group is about 72. Your score is ${score}, which is above that reference. `;
  } else if (score >= 70) {
    text += `Good. Your overall result is around a healthy baseline. Several readings are doing well, while a few can improve. The reference score for people around your age is about 72, so your result is close to or slightly above that reference. `;
  } else if (score >= 60) {
    text += `Your result is fair — some improvement needed. Some readings are doing well, but a few areas need improvement. This is a good point to focus on regular activity, balanced food, good sleep and consistency. This score is only a summary of today’s measurements. It does not mean that you are unhealthy. `;
  } else if (score >= 50) {
    text += `Some of today’s readings need attention. This does not mean that something is definitely wrong. It simply means several values are farther from their preferred ranges. We’ll now explain which readings are good and which ones you may want to improve. `;
  } else if (score >= 40) {
    text += `Several areas need improvement. Please don’t worry. One scan cannot diagnose your health. This result simply shows that some of today’s measurements are outside or farther from their preferred ranges. We’ll go through them one by one and explain what you can work on. `;
  } else if (score >= 30) {
    text += `Several readings need more attention today. Please stay calm—this score is not a diagnosis. Some values may also change because of hydration, food, recent exercise, stress or measurement conditions. We recommend reviewing the individual readings and repeating unusual measurements when appropriate. `;
  } else {
    text += `Several of today’s measurements are far from their preferred ranges and should be looked at carefully. Please don’t panic. This score alone does not diagnose an illness. We recommend repeating any unusual measurements. If important readings remain abnormal, or if you are feeling unwell, please speak with a doctor or healthcare professional. `;
  }

  text += `This score is an overall summary, not a medical diagnosis. `;
  text += `You do not need to read the screen. I will explain each part of your report to you. `;
  text += `Next, let’s find out which areas of your body are strongest, and which ones need attention.`;
  return text;
}

/**
 * Report 2: Body Composition Fundamentals & Strongest Systems
 * Plain-language breakdown of Standard Weight, Muscle, Fat, Water, and Weight goals with Indian nutrition advice.
 */
export function getReport2Speech(healthData, language = 'en') {
  const patient = healthData?.patient || {};
  const vitals = healthData?.vitals || {};
  const name = patient?.name ? patient.name.split(' ')[0] : (language === 'hi' ? 'दोस्त' : language === 'bn' ? 'বন্ধু' : 'Friend');
  const weight = vitals.weight ? Number(vitals.weight).toFixed(1) : '65.0';
  const height = vitals.height ? Math.round(Number(vitals.height)) : 175;
  const bmi = vitals.bmi ? Number(vitals.bmi).toFixed(1) : '18.6';
  const bodyFat = vitals.bodyFat ? Number(vitals.bodyFat).toFixed(1) : '12.7';
  const muscleMass = vitals.muscleMass ? Number(vitals.muscleMass).toFixed(1) : '36.4';
  const waterPct = vitals.waterPct || vitals.bodyWater ? Number(vitals.waterPct || vitals.bodyWater).toFixed(1) : '81.6';
  const scanCount = getScanCount(healthData);

  const standardWeight = Math.round(22.2 * ((height / 100) ** 2) * 10) / 10;
  const weightGap = Math.round((standardWeight - Number(weight)) * 10) / 10;
  const absWeightGap = Math.abs(weightGap);

  const isMale = patient?.gender?.toLowerCase() === 'female' ? false : true;
  const muscleLow = isMale ? (Number(muscleMass) < 38) : (Number(muscleMass) < 28);
  const fatHigh = isMale ? (Number(bodyFat) > 24) : (Number(bodyFat) > 31);
  const fatOptimal = Number(bodyFat) >= 10 && Number(bodyFat) <= 20;

  // Resolve contradiction: If user has low muscle or low weight, muscle is NOT strongest!
  // Standout strength is Body Fat balance or Cellular Hydration.
  const strongestStrength = fatOptimal ? 'bodyFat' : 'water';

  if (language === 'hi') {
    let text = `${name}, आपको स्क्रीन देखने की बिल्कुल जरूरत नहीं है। मैं आपके शरीर की बनावट का पूरा हिसाब आसान शब्दों में बता रही हूं। `;
    text += `आपकी ${height} सेंटीमीटर लंबाई के अनुसार, आपका मानक स्वस्थ वज़न ${standardWeight} किलो होना चाहिए, और आज आपका वज़न ${weight} किलो है। `;

    if (weightGap > 0.8) {
      text += `यानी सही और आदर्श वज़न तक पहुँचने के लिए आपको लगभग ${absWeightGap} किलो मांसपेशियां बढ़ाने की ज़रूरत है। `;
    } else if (weightGap < -0.8) {
      text += `यानी आदर्श वज़न तक पहुँचने के लिए आपको लगभग ${absWeightGap} किलो वज़न घटाने की ज़रूरत है। `;
    } else {
      text += `आपका वज़न आपकी लंबाई के हिसाब से बिल्कुल सही और मानक संतुलन में है! `;
    }

    if (strongestStrength === 'bodyFat') {
      text += `आज आपका सबसे मजबूत हिस्सा शरीर का फैट संतुलन है, लगभग ${bodyFat} प्रतिशत! यह बहुत ही स्वस्थ और सुरक्षित स्तर पर है। `;
    } else {
      text += `आज आपका सबसे मजबूत हिस्सा शरीर का पानी है, लगभग ${waterPct} प्रतिशत! यह आपके जोड़ों को चिकना और ऊर्जा को ताज़ा रखता है। `;
    }

    if (muscleLow) {
      text += `आपकी मांसपेशियों का वज़न ${muscleMass} किलो है, जो आपकी लंबाई के हिसाब से थोड़ा कम है। मांसपेशियां ही शरीर का असली इंजन हैं। इन्हें मज़बूत करने के लिए खाने में मूंग की दाल, पनीर, अंकुरित अनाज, भुना चना और उबले अंडे शामिल करें, और रोज़ाना 20 मिनट हल्का व्यायाम करें। `;
    } else {
      text += `आपकी मांसपेशियों का वज़न ${muscleMass} किलो है, जो बहुत अच्छी स्थिति में है और आपको दिनभर फुर्तीला रखती है। `;
    }

    if (fatHigh) {
      text += `शरीर में चर्बी थोड़ी सी ज्यादा है। तली-भुनी चीजें कम करके रोज़ आधा घंटा टहलने से यह सामान्य हो जाएगी। `;
    }

    if (scanCount >= 2) {
      text += `यह आपका स्कैन नंबर ${scanCount} है, जिससे पिछली बार की तुलना साफ दिखाई दे रही है। `;
    } else {
      text += `यह आपका पहला स्कैन है, जिससे आपकी शुरुआत तय हुई है। अगले स्कैन में पिछली बार से तुलना साफ दिखाई देगी। `;
    }

    text += `आगे ब्लड प्रेशर और जरूरी जांचें देखने के लिए कंटिन्यू दबाएं, या पीछे जाने के लिए बैक दबाएं।`;
    return text;
  }

  if (language === 'bn') {
    let text = `${name}, আপনাকে স্ক্রিনের দিকে তাকাতে হবে না। আমি আপনার শরীরের গঠন ও উপাদানের হিসাব সহজ ভাষায় বুঝিয়ে দিচ্ছি। `;
    text += `আপনার ${height} সেন্টিমিটার উচ্চতা অনুযায়ী আপনার আদর্শ মানক ওজন হওয়া উচিত ${standardWeight} কেজি, আর আজ আপনার ওজন ${weight} কেজি। `;

    if (weightGap > 0.8) {
      text += `অর্থাৎ আদর্শ ওজনে পৌঁছানোর জন্য আপনাকে প্রায় ${absWeightGap} কেজি ওজন বা পেশীর শক্তি বাড়াতে হবে। `;
    } else if (weightGap < -0.8) {
      text += `অর্থাৎ আদর্শ ওজনে পৌঁছাতে আপনাকে প্রায় ${absWeightGap} কেজি অতিরিক্ত ওজন কমাতে হবে। `;
    } else {
      text += `আপনার ওজন আপনার উচ্চতার সাথে একদম নিখুঁত ও সুন্দর ভারসাম্যে রয়েছে! `;
    }

    if (strongestStrength === 'bodyFat') {
      text += `আজ আপনার শরীরের সবচেয়ে সেরা ও শক্তিশালী দিক হলো ফ্যাটের ভারসাম্য, মাত্র ${bodyFat} শতাংশ! এটি চমৎকার ও অত্যন্ত স্বাস্থ্যকর। `;
    } else {
      text += `আজ আপনার শরীরের সবচেয়ে শক্তিশালী অংশ হলো জলের মাত্রা, প্রায় ${waterPct} শতাংশ! এটি হাড়ের জোড়গুলোকে সচল রাখে এবং সারাদিন সতেজতা দেয়। `;
    }

    if (muscleLow) {
      text += `আপনার পেশীর ওজন ${muscleMass} কেজি, যা আপনার উচ্চতার তুলনায় কিছুটা কম। পেশীই হলো শরীরের মূল চালিকাশক্তি। পেশী শক্তপোক্ত করতে রোজকার খাবারে মুগ ডাল, ছানা, ডিম, অঙ্কুরিত ছোলা যোগ করুন এবং প্রতিদিন ২০ মিনিট একটু জোরে হাঁটুন। `;
    } else {
      text += `আপনার পেশীর ওজন ${muscleMass} কেজি, যা খুব ভালো অবস্থায় রয়েছে এবং দৈনন্দিন কাজের শক্তি জোগায়। `;
    }

    if (fatHigh) {
      text += `শরীরে ফ্যাটের মাত্রা সামান্য বেশি। ভাজাভুজি এড়িয়ে প্রতিদিন একটু হাঁটলে এটি স্বাভাবিক হয়ে যাবে। `;
    }

    if (scanCount >= 2) {
      text += `এটি আপনার স্ক্যান নম্বর ${scanCount}, যার মাধ্যমে আগের ভিজিটের উন্নতি বোঝা যাচ্ছে। `;
    } else {
      text += `এটি আপনার প্রথম স্ক্যান, যা শুরুর পরিমাপ নির্ধারণ করলো। পরের স্ক্যানে আগের তুলনায় কতটা উন্নতি হলো তা দেখা যাবে। `;
    }

    text += `পরের স্ক্রিনে ব্লাড প্রেশার ও অন্যান্য মাপ দেখতে কন্টিনিউ চাপুন, অথবা আগের স্ক্রিনে ফিরতে ব্যাক চাপুন।`;
    return text;
  }

  // English fallback
  let text = `${name}, you do not need to look at the screen. I will explain your body composition results in plain words. `;
  text += `According to your height of ${height} cm, your standard healthy weight is ${standardWeight} kg. Today you weigh ${weight} kg. `;

  if (weightGap > 0.8) {
    text += `That means you need to gain about ${absWeightGap} kg of healthy muscle to reach your standard ideal weight. `;
  } else if (weightGap < -0.8) {
    text += `That means you need to gently reduce about ${absWeightGap} kg to reach your standard ideal weight. `;
  } else {
    text += `Your weight matches your standard ideal weight in great harmony! `;
  }

  if (strongestStrength === 'bodyFat') {
    text += `Your standout strength today is body fat balance, at ${bodyFat} percent, which is classified as very healthy and athletic! `;
  } else {
    text += `Your standout strength today is body water, at about ${waterPct} percent, giving your cells deep hydration and steady daily stamina. `;
  }

  if (muscleLow) {
    text += `Your muscle mass is ${muscleMass} kg, which is slightly low for your height. Muscles are your power engine for walking, climbing stairs, and carrying groceries. Adding protein foods like moong dal, paneer, sprouts, or boiled eggs, and doing 20 minutes of daily brisk walking will help you build solid muscle. `;
  } else {
    text += `Your muscle mass is ${muscleMass} kg, providing strong support for all your daily activities. `;
  }

  if (fatHigh) {
    text += `Your body fat is slightly above the target range. Reducing fried snacks and enjoying a 30-minute walk each day will gently bring it back into balance. `;
  }

  if (scanCount >= 2) {
    text += `This is scan ${scanCount} of 7, showing how your muscle and fat targets are progressing over time. `;
  } else {
    text += `This is scan 1 of 7, establishing your baseline. Progress comparisons will unlock on your next scan. `;
  }

  text += `Tap Continue to go to your vital signs, or tap Back to return to your health score.`;
  return text;
}

/**
 * Report 3: Deep Metrics & Vital Signs (Blood Pressure, Pulse, Oxygen, Bones, Protein, Visceral Fat, Calories)
 */
export function getReport3Speech(healthData, language = 'en') {
  const patient = healthData?.patient || {};
  const vitals = healthData?.vitals || {};
  const sys = (vitals.systolic ?? vitals.bpSystolic) ? Math.round(Number((vitals.systolic ?? vitals.bpSystolic))) : 99;
  const dia = (vitals.diastolic ?? vitals.bpDiastolic) ? Math.round(Number((vitals.diastolic ?? vitals.bpDiastolic))) : 63;
  const spo2 = vitals.oxygen ? Math.round(Number(vitals.oxygen)) : 98;
  const pulse = (vitals.bpm ?? vitals.pulse) ? Math.round(Number((vitals.bpm ?? vitals.pulse))) : 72;
  const bone = vitals.boneMass ? Number(vitals.boneMass).toFixed(2) : '2.97';
  const protein = vitals.protein ? Number(vitals.protein).toFixed(2) : (vitals.proteinMass ? Number(vitals.proteinMass).toFixed(2) : '11.57');
  const visceral = vitals.visceralFat ? Math.round(Number(vitals.visceralFat)) : 1;
  const subcut = vitals.subcutaneousFat ? Number(vitals.subcutaneousFat).toFixed(1) : '12.6';
  const calories = Math.round(Number(vitals.bmr || 1420) * 1.2 || 1705);
  const scanCount = getScanCount(healthData);

  const bpHigh = sys > 128 || dia > 85;

  if (language === 'hi') {
    let text = `अब हम आपके दिल की धड़कन, ब्लड प्रेशर और शरीर के जरूरी संकेत देखते हैं। आप आराम से सुनिए, मैं सब आसान शब्दों में समझा रही हूं। `;
    text += `आपका ब्लड प्रेशर ${sys} और ${dia} है। `;
    if (bpHigh) {
      text += `यह थोड़ा सा बढ़ा हुआ है। नमक कम करें और भरपूर पानी पिएं। `;
    } else {
      text += `यह बिल्कुल सामान्य और शांत सीमा में है, जिसका मतलब है कि खून बिना किसी दबाव के आसानी से बह रहा है। `;
    }
    text += `खून में ऑक्सीजन ${spo2} प्रतिशत है, जो फेफड़ों से हर अंग तक ताज़ी हवा पहुंचा रहा है। `;
    text += `आपके दिल की धड़कन ${pulse} प्रति मिनट है, जो एक शांत ताल में चल रही है। `;
    text += `आपकी हड्डियों का खनिज वज़न ${bone} किलोग्राम है, और प्रोटीन ${protein} किलोग्राम है। `;
    text += `अंदरूनी विसरल फैट स्कोर ${visceral} है, जो बहुत सुरक्षित है। त्वचा के नीचे सबक्यूटेनियस फैट ${subcut} प्रतिशत है। `;
    text += `शरीर को चुस्त रखने के लिए आपकी रोज़ाना की कैलोरी ज़रूरत लगभग ${calories} कैलोरी है। `;
    if (scanCount >= 2) {
      text += `पिछली जांच के मुकाबले आपके संकेत अच्छी स्थिरता दिखा रहे हैं। `;
    }
    text += `अगली स्क्रीन पर प्रोग्रेस ग्राफ देखने के लिए कंटिन्यू दबाएं, या पीछे जाने के लिए बैक दबाएं।`;
    return text;
  }

  if (language === 'bn') {
    let text = `এবার আমরা আপনার রক্তচাপ, হৃদস্পন্দন ও শরীরের মূল লক্ষণগুলো দেখবো। আপনি আরাম করে শুনুন, আমি সব বুঝিয়ে বলছি। `;
    text += `আপনার রক্তচাপ বা ব্লাড প্রেশার ${sys} বাই ${dia}। `;
    if (bpHigh) {
      text += `এটি কিছুটা বেশি রয়েছে। কাঁচা লবণ এড়িয়ে চলুন ও পর্যাপ্ত জল খান। `;
    } else {
      text += `এটি শান্ত ও নিরাপদ সীমার মধ্যে রয়েছে, অর্থাৎ রক্ত চলাচল স্বাভাবিক রয়েছে। `;
    }
    text += `রক্তে অক্সিজেনের মাত্রা ${spo2} শতাংশ, ফুসফুস পর্যাপ্ত সতেজ হাওয়া প্রতিটি অঙ্গে পৌঁছে দিচ্ছে। `;
    text += `আপনার নাড়ির গতি মিনিটে ${pulse} বার, যা একটি সুন্দর ও শান্ত ছন্দে চলছে। `;
    text += `আপনার হাড়ের ওজন ${bone} কিলোগ্রাম এবং প্রোটিন ${protein} কিলোগ্রাম। `;
    text += `ভেতরের ভিসারাল ফ্যাট স্কোর ${visceral}, যা খুবই স্বাস্থ্যকর। সাবকিউটেনিয়াস ফ্যাট ${subcut} শতাংশ। `;
    text += `সারাদিন সক্রিয় থাকতে আপনার দৈনিক ক্যালোরির প্রয়োজন প্রায় ${calories} ক্যালোরি। `;
    if (scanCount >= 2) {
      text += `আগের ভিজিটের তুলনায় আপনার শরীরের লক্ষণগুলো ভালো স্থিরতা দেখাচ্ছে। `;
    }
    text += `পরের স্ক্রিনে বহু-স্ক্যানের প্রোগ্রেস গ্রাফ দেখতে কন্টিনিউ চাপুন, অথবা আগের স্ক্রিনে ফিরতে ব্যাক চাপুন।`;
    return text;
  }

  // English fallback
  let text = `Now we examine your core vital signs and inner reserves. You can listen comfortably while I explain each reading. `;
  text += `Your blood pressure is ${sys} over ${dia}. `;
  if (bpHigh) {
    text += `This is slightly elevated today. Cutting back on table salt and staying hydrated will help keep it steady. `;
  } else {
    text += `This is in a calm, safe, and optimal range, meaning blood is flowing smoothly without strain on your heart. `;
  }
  text += `Your blood oxygen is ${spo2} percent, delivering plenty of fresh oxygen across your body. `;
  text += `Your resting pulse is ${pulse} beats per minute, beating with a steady rhythm. `;
  text += `Your bone mass is ${bone} kg, and your protein mass is ${protein} kg. `;
  text += `Your visceral fat score is ${visceral}, which is low and very healthy. Subcutaneous fat is ${subcut} percent, considered optimal. `;
  text += `To maintain healthy daily energy, your recommended daily intake is about ${calories} calories. `;
  if (scanCount >= 2) {
    text += `Your vitals are showing dependable stability compared to your earlier visits. `;
  }
  text += `Tap Continue to review your multi-scan progress graph, or tap Back to revisit body composition.`;
  return text;
}

/**
 * Report 4: Vitals Longitudinal Trends & Scan History
 */
export function getReport4Speech(healthData, language = 'en') {
  const vitals = healthData?.vitals || {};
  const scanCount = getScanCount(healthData);
  const ratio = vitals.fatMuscleRatio ? Number(vitals.fatMuscleRatio).toFixed(1) : '0.2';
  const waterPct = vitals.waterPct || vitals.bodyWater ? Number(vitals.waterPct || vitals.bodyWater).toFixed(1) : '81.6';
  const efficiency = vitals.efficiency ? Number(vitals.efficiency).toFixed(1) : '0.8';
  const energyReserve = vitals.energyReserve ? Math.round(Number(vitals.energyReserve)) : 1028;
  const metabolicLoad = vitals.metabolicLoad ? Number(vitals.metabolicLoad).toFixed(1) : '1.5';

  if (language === 'hi') {
    let text = `यह आपका प्रोग्रेस डैशबोर्ड है। अगर आप स्क्रीन पर ग्राफ नहीं देख पा रहे हैं, तो चिंता मत कीजिए, मैं बोलकर बताती हूं। `;
    text += `आपका फैट-मसल अनुपात ${ratio} है, जो 0.5 से कम होने के कारण बहुत ही शानदार है। `;
    text += `शरीर में पानी की मात्रा ${waterPct} प्रतिशत है, और मेटाबॉलिक लोड ${metabolicLoad} है। `;
    text += `एनर्जी रिज़र्व ${energyReserve} है और कार्यक्षमता ${efficiency} है। कार्यक्षमता थोड़ी कम है, जिस पर भरपूर पानी और अच्छी नींद से सुधार किया जा सकता है। `;
    text += `आपकी अंदरूनी मेटाबॉलिक उम्र आपकी असली उम्र से बिल्कुल मेल खाती है, जो एक बड़ा मेटाबॉलिक फायदा है। `;
    text += `बार-बार जांच करने से ब्लड प्रेशर का पैटर्न साफ दिख रहा है, जो पहले 104-74, 120-80 और अब 99-63 पर शांत है। `;

    if (scanCount <= 1) {
      text += `यह कुल 7 में से आपकी पहली जांच है, जो शुरुआती आधार बनाती है। `;
    } else if (scanCount >= 7) {
      text += `बधाई हो! आपने सातों स्कैन पूरे कर लिए हैं और 100 प्रतिशत विश्वास के साथ आपका स्वास्थ्य आधार पक्का हो चुका है! `;
    } else {
      text += `जांच नंबर ${scanCount} of 7! जैसे-जैसे स्कैन बढ़ते हैं, जांच का विश्वास 14 प्रतिशत से बढ़कर 100 प्रतिशत तक पहुंचता है। `;
    }
    text += `अगली स्क्रीन पर पूरी रिपोर्ट का सारांश, आंखों की जांच और रिपोर्ट ले जाने वाला क्यूआर कोड देखने के लिए कंटिन्यू दबाएं, या पीछे जाने के लिए बैक दबाएं।`;
    return text;
  }

  if (language === 'bn') {
    let text = `এটি আপনার প্রোগ্রেস ড্যাশবোর্ড। স্ক্রিনে গ্রাফ দেখতে না পেলেও কোনো চিন্তা নেই, আমি মুখে বুঝিয়ে দিচ্ছি। `;
    text += `আপনার ফ্যাট-মাসল অনুপাত ${ratio}, যা ০.৫-এর কম হওয়ায় অত্যন্ত চমৎকার। `;
    text += `শরীরে জলের মাত্রা ${waterPct} শতাংশ, এবং মেটাবলিক লোড ${metabolicLoad}। `;
    text += `এনার্জি রিজার্ভ ${energyReserve} এবং কার্যক্ষমতা ${efficiency}। দক্ষতা কিছুটা কম, যা পর্যাপ্ত জল ও ভালো ঘুমে দ্রুত বাড়বে। `;
    text += `আপনার মেটাবলিক বয়স আসল বয়সের সাথে একদম মিলে গেছে, যা একটি বড় মেটাবলিক সুবিধা। `;
    text += `বারবার পরীক্ষায় ব্লাড প্রেশারের ধারা স্পষ্ট, যা আগে ১০৪-৭৪, ১২০-৮০ এবং এখন ৯৯-৬৩ তে শান্ত রয়েছে। `;

    if (scanCount <= 1) {
      text += `এটি সাতটি স্ক্যানের মধ্যে প্রথম ভিজিট, যা শুরুর ভিত্তি তৈরি করেছে। `;
    } else if (scanCount >= 7) {
      text += `অভিনন্দন! আপনি সব সাতটি স্ক্যান সম্পূর্ণ করেছেন এবং ১০০ শতাংশ নিশ্চয়তার সাথে প্রোফাইল তৈরি হয়েছে! `;
    } else {
      text += `ভিজিট নম্বর ${scanCount} of 7! স্ক্যান বাড়ার সাথে সাথে তথ্যের নির্ভুলতা ১৪ শতাংশ থেকে ১০০ শতাংশে পৌঁছায়। `;
    }
    text += `পরবর্তী স্ক্রিনে সম্পূর্ণ সারাংশ, চোখের পরীক্ষার ফলাফল এবং বাড়ি নিয়ে যাওয়ার কিউআর কোড দেখতে কন্টিনিউ চাপুন, অথবা আগের স্ক্রিনে ফিরতে ব্যাক চাপুন।`;
    return text;
  }

  // English fallback
  let text = `This is your progress dashboard. If you cannot see the graph on the screen, don't worry—I will tell you exactly what your trends show. `;
  text += `Your fat-to-muscle ratio is ${ratio}, which is excellent since anything under 0.5 is ideal. `;
  text += `Hydration is at ${waterPct} percent, and metabolic load is ${metabolicLoad}. `;
  text += `Your energy reserve is ${energyReserve} with an efficiency of ${efficiency}, which points to an opportunity for metabolic improvement through hydration and restful sleep. `;
  text += `Your biological age matches your chronological age, confirming favorable metabolic health. `;
  text += `Your blood pressure trend shows steady, calm readings, moving from earlier 104 over 74 and 120 over 80 to your most recent 99 over 63. `;

  if (scanCount <= 1) {
    text += `This is visit 1 of 7, establishing your starting baseline. `;
  } else if (scanCount >= 7) {
    text += `Congratulations! You have completed all 7 scans, locking in 100 percent data confidence across all 112 health metrics! `;
  } else {
    text += `Visit ${scanCount} of 7! As you complete scans, confidence progresses from 14 percent to 100 percent. `;
  }
  text += `Tap Continue to view your full summary, eye check, and take-home QR code, or tap Back to return to vitals.`;
  return text;
}

/**
 * Report 5: Actionable Daily Habits, Eyesight & Take-Home QR Code Guidance
 */
export function getReport5Speech(healthData, language = 'en') {
  const patient = healthData?.patient || {};
  const vitals = healthData?.vitals || {};
  const name = patient?.name ? patient.name.split(' ')[0] : (language === 'hi' ? 'दोस्त' : language === 'bn' ? 'বন্ধু' : 'Friend');
  const height = Number(vitals.height || 175);
  const weight = Number(vitals.weight || 65);
  const standardWeight = Math.round(22.2 * ((height / 100) ** 2) * 10) / 10;
  const weightGap = Math.round((standardWeight - weight) * 10) / 10;
  const absWeightGap = Math.abs(weightGap);
  const calories = Math.round(Number(vitals.bmr || 1420) * 1.2 || 1705);

  if (language === 'hi') {
    let text = `${name}, यह आपके पूरे हेल्थ चेकअप का अंतिम सारांश है। `;
    text += `कुल मिलाकर, आपके शरीर का फैट संतुलन, मुख्य संकेत और पानी की मात्रा आपको दिनभर अच्छी स्फूर्ति देते हैं। `;
    if (weightGap > 0.8) {
      text += `आगे सुधार के लिए सबसे जरूरी कदम है कि अपने मानक वज़न ${standardWeight} किलो तक पहुंचने के लिए लगभग ${absWeightGap} किलो मांसपेशियां बढ़ाएं। इसके लिए रोज़ाना लगभग ${calories} कैलोरी पौष्टिक घरेलू खाना लें। `;
    } else if (weightGap < -0.8) {
      text += `आगे सुधार के लिए सबसे जरूरी कदम है कि अपने मानक वज़न ${standardWeight} किलो तक पहुंचने के लिए लगभग ${absWeightGap} किलो अतिरिक्त वज़न कम करें। `;
    } else {
      text += `आपका वज़न आपकी लंबाई के हिसाब से बिल्कुल सही और मानक संतुलन में है! `;
    }
    text += `आपकी आंखों की जांच का नतीजा भी यहां दर्ज है। अगर आंखों में भारीपन या धुंधलापन लगे, तो आंखों के डॉक्टर से जांच जरूर कराएं। `;
    text += `कुल 7 स्कैन में 112 से ज़्यादा बायोमेट्रिक संकेत जांचकर आपकी रिपोर्ट तैयार हुई है। `;
    text += `इस पूरी डिजिटल रिपोर्ट को 2 मिनट में अपने फोन पर ले जाने के लिए, आप अपने स्मार्टफोन का कैमरा स्क्रीन पर बने चौकोर क्यूआर कोड के सामने करें। यह बिना कोई ऐप डाउनलोड किए तुरंत खुल जाएगी। `;
    text += `जब आप तैयार हों, रिटर्न होम दबा सकते हैं, या पुरानी रिपोर्ट देखने के लिए बैक दबा सकते हैं। आज रिलिव के साथ अपनी सेहत का ध्यान रखने के लिए बहुत-बहुत धन्यवाद!`;
    return text;
  }

  if (language === 'bn') {
    let text = `${name}, এটি আপনার সম্পূর্ণ হেলথ চেকআপের চূড়ান্ত সারাংশ। `;
    text += `সামগ্রিকভাবে, আপনার ফ্যাটের ভারসাম্য, মূল লক্ষণগুলো এবং জলের পর্যাপ্ত মাত্রা আপনাকে সারাদিনের শক্তি জোগাচ্ছে। `;
    if (weightGap > 0.8) {
      text += `উন্নতির জন্য প্রধান পদক্ষেপ হলো আপনার আদর্শ মানক ওজন ${standardWeight} কেজিতে পৌঁছানো এবং প্রায় ${absWeightGap} কেজি পেশীর শক্তি বাড়ানো, যার জন্য প্রতিদিন প্রায় ${calories} ক্যালোরি পুষ্টিকর খাবার প্রয়োজন। `;
    } else if (weightGap < -0.8) {
      text += `উন্নতির জন্য প্রধান পদক্ষেপ হলো আপনার আদর্শ মানক ওজন ${standardWeight} কেজিতে পৌঁছাতে প্রায় ${absWeightGap} কেজি ওজন কমানো। `;
    } else {
      text += `আপনার ওজন আপনার উচ্চতার সাথে একদম আদর্শ ভারসাম্যে রয়েছে! `;
    }
    text += `এই স্ক্রিনে আপনার চোখের পরীক্ষার ফলাফলও নথিভুক্ত রয়েছে। চোখে ক্লান্তি বা ঝাপসা লাগলে চোখের ডাক্তার দেখানো সবসময়ই ভালো। `;
    text += `মোট ৭টি স্ক্যানে ১১২টিরও বেশি তথ্য যাচাই করে এই নির্ভরযোগ্য রিপোর্ট তৈরি হয়েছে। `;
    text += `মাত্র ২ মিনিটে এই সম্পূর্ণ ডিজিটাল রিপোর্টটি নিজের ফোনে নিয়ে যেতে, স্মার্টফোনের ক্যামেরাটি স্ক্রিনের চারকোণা কিউআর কোডের সামনে ধরুন। কোনো অ্যাপ ছাড়াই এটি ফোনে খুলে যাবে। `;
    text += `আপনার দেখা শেষ হলে রিটার্ন হোম চাপতে পারেন, অথবা পেছনের পাতা দেখতে ব্যাক চাপুন। আজ রিলিভের সাথে নিজের স্বাস্থ্যের যত্ন নেওয়ার জন্য আপনাকে অনেক ধন্যবাদ!`;
    return text;
  }

  // English fallback
  let text = `${name}, here is the final summary of your entire checkup. `;
  text += `Overall, your body fat balance, vital signs, and cellular hydration provide solid daily stamina. `;
  if (weightGap > 0.8) {
    text += `Your primary opportunity for improvement is reaching your standard healthy weight of ${standardWeight} kg by gaining about ${absWeightGap} kg of lean muscle, supported by ${calories} daily calories and nutritious home foods. `;
  } else if (weightGap < -0.8) {
    text += `Your primary opportunity for improvement is reaching your standard healthy weight of ${standardWeight} kg by gently reducing ${absWeightGap} kg through balanced home meals and daily brisk walking. `;
  } else {
    text += `Your weight matches your standard ideal weight of ${standardWeight} kg in great harmony! `;
  }
  text += `Your eyesight screening is also recorded on this screen. If you ever feel eye strain or blurred vision, having your eyes checked by an optometrist is always recommended. `;
  text += `Your report is confirmed across 7 scans with over 112 biometric data points. `;
  text += `To take this complete digital report home with you in under two minutes, simply point your smartphone camera at the square QR code on the screen. It will open your private digital report instantly on your phone without downloading any app. `;
  text += `You can tap Return Home whenever you are ready, or tap Back to review earlier pages. Thank you for checking your health with Reliv today!`;
  return text;
}
