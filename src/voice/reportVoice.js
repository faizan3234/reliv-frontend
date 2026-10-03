import { reportRows } from '../utils/reportInsights.js';
import { metricCopy, languageIndex } from './insightCopy.js';
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
const safeNumber = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : null;
const voiceWords = {
 en: {missing:'Not measured.', estimate:'This is a calculated estimate, not a direct measurement or diagnosis.', scan:'Scan', intro:['Your body overview. The score is an estimate, not a diagnosis.','Your body measurements and estimates.','Your recorded vital signs.','Your own scans over time. Tap a point to keep that scan open.','Your summary and next steps.'], next:'Scroll down to see more. You can replay this guide, ask for an explanation, or use Next when ready.', compare:'More visits allow comparisons; they do not automatically mean improvement.', end:'For fair comparisons, use similar measurement conditions next time. Ask a clinician about results that worry you. Do not change medicines based only on this report.'},
 hi: {missing:'यह माप नहीं मिला।',estimate:'यह हिसाब से निकला अंदाज़ा है, सीधे मापा हुआ नंबर या बीमारी का पता नहीं।',scan:'स्कैन',intro:['आपके शरीर का सारांश। स्कोर एक अंदाज़ा है, बीमारी का पता नहीं।','आपके शरीर के माप और अंदाज़े।','आज मशीन से मिली रीडिंग।','ये आपके अपने पुराने स्कैन हैं। किसी बिंदु को छूकर उस स्कैन के नंबर देखिए।','आपकी रिपोर्ट का सारांश और आगे क्या करें।'],next:'और देखने के लिए नीचे स्क्रॉल कीजिए। फिर से सुन सकते हैं, किसी नंबर का मतलब पूछ सकते हैं, या तैयार हों तो आगे बढ़िए।',compare:'ज़्यादा स्कैन से तुलना होती है। इसका मतलब अपने आप सुधार नहीं है।',end:'अगली बार करीब-करीब उन्हीं हालात में माप लीजिए। किसी नंबर को लेकर चिंता हो तो डॉक्टर से पूछिए। सिर्फ इस रिपोर्ट से दवा मत बदलिए।'},
 bn: {missing:'এই মাপ পাওয়া যায়নি।',estimate:'এটা হিসাব থেকে করা আন্দাজ, সরাসরি মাপা রিডিং বা রোগের খবর নয়।',scan:'স্ক্যান',intro:['আপনার শরীরের এক নজরের খবর। স্কোর একটা আন্দাজ, রোগের খবর নয়।','আপনার শরীরের মাপ আর আন্দাজ।','আজ মেশিনে পাওয়া রিডিং।','এগুলো আপনার নিজের আগের স্ক্যান। একটা বিন্দুতে চাপ দিলে সেই স্ক্যানের রিডিং দেখতে পাবেন।','আপনার রিপোর্টের সারাংশ আর এরপর কী করবেন।'],next:'আরও দেখতে নিচে স্ক্রল করুন। আবার শুনতে পারেন, কোনও মাপের মানে জানতে পারেন, বা তৈরি হলে পরের পাতায় যান।',compare:'বেশি স্ক্যান থাকলে তুলনা করা যায়। তার মানেই উন্নতি হয়েছে নয়।',end:'পরের বার কাছাকাছি একই অবস্থায় মাপ নিন। কোনও রিডিং নিয়ে চিন্তা হলে ডাক্তারকে জিজ্ঞেস করুন। শুধু এই রিপোর্ট দেখে ওষুধ বদলাবেন না।'}
};

export function getMetricLaymanExplainer(metricKey, healthData, language = 'en') {
 const normalized=String(metricKey||'').toLowerCase().replace(/[^a-z0-9_]/g,'');
 const key=CANONICAL_METRIC_MAP[normalized]||metricKey;
 const item=METRIC_EXPLAINERS[key];
 if(!item)return null;
 const w=voiceWords[language]||voiceWords.en;
 const mapped={pulse:'bpm',hydration:'bodyWater',dailyCalories:'restingEnergy'}[key]||key;
 const metric=metricCopy[mapped],v=healthData?.vitals||{};
 const value=safeNumber(healthData?.[key]??v[mapped]??v[key]);
 const ageExplanation={en:'Your birthday tells your actual age. This formula does not measure how old your organs are inside.',hi:'जन्मदिन से आपकी असली उम्र पता चलती है। यह हिसाब आपके अंदर के अंगों की उम्र नहीं मापता।',bn:'জন্মদিন থেকে আসল বয়স জানা যায়। এই হিসাব শরীরের ভেতরের অঙ্গের বয়স মাপে না।'};
 const description=key==='metabolicAge'?(ageExplanation[language]||ageExplanation.en):metric?metric[1][languageIndex(language)]:item.subtitle[language]||item.subtitle.en;
 if(key==='bloodPressure') {
  const systolic=safeNumber(v.systolic),diastolic=safeNumber(v.diastolic);
  return `${item.title[language]||item.title.en}. ${systolic===null||diastolic===null?w.missing:`${systolic} / ${diastolic} mmHg.`} ${metricCopy.systolic[1][languageIndex(language)]} ${metricCopy.diastolic[1][languageIndex(language)]}`;
 }
 const measured=['bpm','oxygen','temperature','weight','height','systolic','diastolic'].includes(mapped);
 return `${item.title[language]||item.title.en}. ${description} ${value===null?w.missing:`${value} ${metric?.[2]||''}.`} ${measured?'':w.estimate}`;
}

function pageSpeech(data,language,page) {
 const w=voiceWords[language]||voiceWords.en,v=data?.vitals||{};
 const fields=page===2?['height','weight']:page===3?['systolic','diastolic','bpm','oxygen','temperature']:[];
 const readings=fields.map(key=>{
  const value=safeNumber(v[key]);
  return `${metricCopy[key][0][languageIndex(language)]}: ${value===null?w.missing:`${value} ${metricCopy[key][2]}.`}`;
 }).join(' ');
 const score=page===1?safeNumber(data?.bodyScore):null;
 const scoreText=score===null?'':`${METRIC_EXPLAINERS.bodyScore.title[language]||METRIC_EXPLAINERS.bodyScore.title.en}: ${score} / 100.`;
 let comparison='';
 if(page===4) {
  const rows=reportRows(data),latest=rows.at(-1),previous=rows.at(-2);
  const beforeLabel=language==='hi'?'पिछले स्कैन में':language==='bn'?'আগের স্ক্যানে':'Previous scan';
  const nowLabel=language==='hi'?'इस स्कैन में':language==='bn'?'এই স্ক্যানে':'This scan';
  if(previous&&latest) comparison=['systolic','diastolic','bpm','oxygen'].map(key=>{
   const before=safeNumber(previous[key]),now=safeNumber(latest[key]);
   return before===null||now===null?'':`${metricCopy[key][0][languageIndex(language)]}. ${beforeLabel}: ${before}. ${nowLabel}: ${now} ${metricCopy[key][2]}.`;
  }).join(' ');
 }
 return `${w.scan} ${getScanCount(data)}. ${w.intro[page-1]} ${scoreText} ${readings} ${page===4?`${comparison} ${w.compare}`:''} ${page===5?w.end:w.next}`;
}
export const getReport1Speech=(data,language='en')=>pageSpeech(data,language,1);
export const getReport2Speech=(data,language='en')=>pageSpeech(data,language,2);
export const getReport3Speech=(data,language='en')=>pageSpeech(data,language,3);
export const getReport4Speech=(data,language='en')=>pageSpeech(data,language,4);
export const getReport5Speech=(data,language='en')=>pageSpeech(data,language,5);
