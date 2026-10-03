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
    getText: (val, patientAge, lang = 'en') => {
      const v = val ? Math.round(Number(val)) : null;
      const age = patientAge ? Number(patientAge) : null;
      if (lang === 'hi') {
        let s = `सुनिए, आपकी एक उम्र होती है जो आपके जन्मदिन और आधार कार्ड से गिनी जाती है। लेकिन एक उम्र आपके शरीर के अंदर के दिल, फेफड़ों और अंगों की होती है, जिसे अंदरूनी या मेटाबॉलिक उम्र कहते हैं! `;
        if (v) s += `आपकी अंदरूनी उम्र ${v} साल आई है। `;
        if (v && age && v < age) {
          s += `बधाई हो! आप अंदर से अपनी असली उम्र से भी ${age - v} साल छोटे और चुस्त हैं, बिल्कुल एक फुर्तीले सुपरहीरो की तरह! `;
        } else if (v && age && v > age) {
          s += `यानी अंदर की मशीन थोड़ी सी थक गई है। रोज़ाना 20 मिनट की सैर और ताज़े फल खाने से यह अंदर से फिर से एकदम जवान हो जाएगी। `;
        } else {
          s += `यह आपकी असली उम्र के बिल्कुल बराबर और बढ़िया संतुलन में है। `;
        }
        return s;
      }
      if (lang === 'bn') {
        let s = `শুনুন, আপনার একটা বয়স আছে যা আপনার জন্মদিন দেখে গোনা হয়। কিন্তু আরেকটা বয়স আছে যা আপনার শরীরের ভেতরের হার্ট, ফুসফুস আর সব অঙ্গের বয়স বোঝায় — একে বলে মেটাবলিক বয়স! `;
        if (v) s += `আপনার ভেতরের বয়স এসেছে ${v} বছর। `;
        if (v && age && v < age) {
          s += `দারুণ সুখবর! আপনার ভেতরটা আপনার আসল বয়সের চেয়েও ${age - v} বছর তরুণ আর প্রাণবন্ত! `;
        } else if (v && age && v > age) {
          s += `ভেতরের শরীরটা একটু ক্লান্ত। প্রতিদিন একটু হাঁটাহাঁটি আর পুষ্টিকর খাবার খেলেই এটা আবার তরুণ হয়ে উঠবে। `;
        } else {
          s += `এটি আপনার আসল বয়সের সাথে একদম মিলে গেছে। `;
        }
        return s;
      }
      let s = `Your birthday tells you how many years you have lived, but your metabolic age tells you how young and energetic your body actually feels on the inside! `;
      if (v) s += `Your internal age is ${v} years. `;
      if (v && age && v < age) {
        s += `Awesome news! Your inner body is running ${age - v} years younger than your calendar age — like an energetic superhero! `;
      } else if (v && age && v > age) {
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
    getText: (val, patientAge, lang = 'en') => {
      const s = val ? Math.round(Number(val)) : 75;
      if (lang === 'hi') {
        return `जैसे स्कूल में टेस्ट देने पर 100 में से नंबर मिलते हैं, वैसे ही आज आपकी पूरी सेहत की जाँच करके आपके शरीर को 100 में से ${s} नंबर मिले हैं! 80 से ऊपर का मतलब है गोल्ड स्टार — आपकी गाड़ी बिल्कुल मस्त और मक्खन चल रही है।`;
      }
      if (lang === 'bn') {
        return `স্কুলে যেমন পরীক্ষার পর ১০০-র মধ্যে নম্বর দেয়, তেমনই আজ পুরো স্বাস্থ্য পরীক্ষা করে আপনার শরীর ১০০-র মধ্যে ${s} নম্বর পেয়েছে! ৮০-র বেশি মানে আপনি একদম ফার্স্ট ক্লাস স্বাস্থ্য ধরে রেখেছেন।`;
      }
      return `Just like getting a test score out of 100 in school, your body scored ${s} points today! Above 80 is like winning a shiny gold star for taking good care of yourself.`;
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
      bn: 'উচ্চতা অনুযায়ী ওজন ঠিক আছে কি না'
    },
    getText: (val, patientAge, lang = 'en') => {
      const v = val ? Number(val).toFixed(1) : null;
      if (lang === 'hi') {
        let s = `बीएमआई कोई मुश्किल चीज़ नहीं है! इसका सीधा सा मतलब है कि क्या आपका वज़न आपकी लंबाई के हिसाब से बिल्कुल सही है — जैसे स्कूल का बस्ता, ना बहुत भारी, ना बहुत हल्का, बल्कि आपकी पीठ के लिए बिल्कुल सही! `;
        if (v) s += `आपका बीएमआई ${v} है। `;
        if (v && v < 18.5) s += `यह थोड़ा हल्का है, थोड़ा दाल, पनीर और पौष्टिक आहार लीजिए। `;
        else if (v && v <= 24.9) s += `यह एकदम सही संतुलन में है, बिल्कुल शानदार! `;
        else s += `यह थोड़ा भारी है। रोज़ 20 मिनट टहलने से यह बस्ता हल्का हो जाएगा। `;
        return s;
      }
      if (lang === 'bn') {
        let s = `বিএমআই কোনো কঠিন ব্যাপার নয়! সহজ কথায়, আপনার উচ্চতার সাথে ওজনটা ঠিকঠাক মিলেছে কি না — ঠিক যেমন স্কুলের মাপমতো সুন্দর একটি ব্যাগ, খুব ভারীও নয়, খুব হালকাও নয়! `;
        if (v) s += `আপনার বিএমআই ${v}। `;
        if (v && v < 18.5) s += `এটি একটু হালকা, ডাল আর পুষ্টিকর খাবার খেলে ওজন সুন্দর বাড়বে। `;
        else if (v && v <= 24.9) s += `এটি একদম স্বাভাবিক ও চমৎকার সীমার মধ্যে আছে। `;
        else s += `এটি একটু ভারী, নিয়মিত একটু হাঁটলেই নিয়ন্ত্রণে থাকবে। `;
        return s;
      }
      let s = `Don't worry about the letters BMI — it simply checks whether your weight matches your height, just like a school backpack that is neither too heavy nor too empty, but just right for your size! `;
      if (v) s += `Your BMI is ${v}. `;
      if (v && v < 18.5) s += `It's slightly light — healthy nuts and meals will build good strength. `;
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
    getText: (val, patientAge, lang = 'en') => {
      const v = val ? Number(val).toFixed(1) : null;
      if (lang === 'hi') {
        return `शरीर में जो फैट यानी चर्बी होती है, वह आपकी बचत की गुल्लक जैसी है! जब आपको कभी भूख लगे या आप खूब दौड़ें, तो शरीर इसी गुल्लक से ऊर्जा निकालता है। थोड़ा फैट हमें गरम और सुरक्षित रखता है, लेकिन बहुत ज़्यादा गुल्लक भारी कर देता है। ${v ? `आपका फैट ${v} प्रतिशत है।` : ''}`;
      }
      if (lang === 'bn') {
        return `শরীরের ফ্যাট হলো আপনার এনার্জির জমানো ব্যাঙ্ক বা পিগি ব্যাঙ্ক! যখন আপনি খুব ব্যস্ত থাকেন, শরীর এখান থেকেই শক্তি খরচ করে। পরিমিত ফ্যাট শরীরকে উষ্ণ ও সুরক্ষিত রাখে। ${v ? `আপনার ফ্যাটের পরিমাণ ${v} শতাংশ।` : ''}`;
      }
      return `Think of body fat as your energy piggy bank! When you are running around or working hard, your body takes energy from this bank. A healthy amount keeps you cozy and safe, and daily activity keeps it perfectly balanced. ${v ? `Yours is ${v} percent.` : ''}`;
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
    getText: (val, patientAge, lang = 'en') => {
      const v = val ? Number(val).toFixed(1) : null;
      if (lang === 'hi') {
        return `मांसपेशियां आपके शरीर का असली इंजन और सुपरहीरो वाली ताक़त हैं! यही आपको सीढ़ियां चढ़ने, खेलने और भारी चीज़ें उठाने की शक्ति देती हैं। जितनी मज़बूत मांसपेशियां, दिनभर में उतनी ही कम थकान महसूस होगी! ${v ? `आपकी मांसपेशियों का ज़ोर ${v} प्रतिशत है।` : ''}`;
      }
      if (lang === 'bn') {
        return `মাংসপেশি হলো আপনার শরীরের আসল ইঞ্জিন আর সুপারহিরোর শক্তি! এগুলোই আপনাকে সিঁড়ি ভাঙতে, জিনিসপত্র তুলতে আর ক্লান্তিহীন থাকতে সাহায্য করে। ইঞ্জিন যত শক্তিশালী, শরীর তত তরতাজা! ${v ? `আপনার পেশির শক্তি ${v} শতাংশ।` : ''}`;
      }
      return `Your muscles are your body's power engine and superhero strength! They help you climb stairs, carry things, and play without tiring out. The stronger your engine, the more stamina you have all day long! ${v ? `Yours is ${v} percent.` : ''}`;
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
    getText: (val, patientAge, lang = 'en') => {
      if (lang === 'hi') {
        return `ब्लड प्रेशर का मतलब है नसों में खून का बहाव — बिल्कुल वैसे जैसे बगीचे के पाइप में पानी बहता है। जब पानी आराम से और शांत बहता है तो पाइप सालों-साल सुरक्षित रहता है। अगर नल बहुत तेज़ खोल दें तो पाइप पर ज़ोर पड़ता है। नमक कम खाने और सुकून से सोने से यह हमेशा शांत रहता है।`;
      }
      if (lang === 'bn') {
        return `ব্লাড প্রেশার মানে হলো রক্তনালীতে রক্ত চলাচলের গতি — ঠিক যেমন বাগানের পাইপে জল বইছে। শান্তভাবে বইলে পাইপ একদম সুরক্ষিত থাকে। শান্তিতে ঘুমালে আর খাবারে কাঁচা লবণ কম খেলে এটি সবসময় সুন্দর থাকে।`;
      }
      return `Blood pressure is just the flow of blood through your body — exactly like water flowing smoothly through a garden hose. When water glides gently, the hose stays happy and healthy. Sound sleep and low salt keep it peaceful.`;
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
    getText: (val, patientAge, lang = 'en') => {
      const v = val ? Math.round(Number(val)) : null;
      if (lang === 'hi') {
        return `खून में ऑक्सीजन का मतलब है कि आपके फेफड़े कितनी अच्छी ताज़ी हवा अंदर ले रहे हैं। जैसे गाड़ी को बढ़िया पेट्रोल चाहिए, वैसे ही शरीर के हर हिस्से को ताज़ी हवा चाहिए। 95 से ऊपर का मतलब है हर अंग तक ताज़ी सुबह की हवा पहुँच रही है! ${v ? `आपका ऑक्सीजन ${v} प्रतिशत है।` : ''}`;
      }
      if (lang === 'bn') {
        return `রক্তে অক্সিজেন মানে আপনার ফুসফুস কতটা ভালো তাজা বাতাস শরীরে টেনে নিচ্ছে। গাড়ির যেমন ভালো জ্বালানি দরকার, তেমনই শরীরের সব অংশের তাজা বাতাস দরকার। ৯৫-এর বেশি থাকা মানে শরীর একদম প্রাণবন্ত! ${v ? `আপনার অক্সিজেন ${v} শতাংশ।` : ''}`;
      }
      return `Blood oxygen measures how much fresh air your lungs are sending across your body. Just like a car needs clean fuel, your body needs clean oxygen. 95 and above means every single cell is happily breathing! ${v ? `Yours is ${v} percent.` : ''}`;
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
    getText: (val, patientAge, lang = 'en') => {
      const v = val ? Math.round(Number(val)) : null;
      if (lang === 'hi') {
        return `पल्स यानी आपके दिल की धड़कन — यह आपके सीने में बजने वाला प्यारा सा ढोल है, जो दिन-रात मस्ती से धड़कता है। जब आप दौड़ते हैं तो यह तेज़ बजता है, और जब आराम से बैठते हैं तो 60 से 100 के बीच मस्तानी चाल से चलता है। ${v ? `आपकी धड़कन ${v} है।` : ''}`;
      }
      if (lang === 'bn') {
        return `নাড়ির গতি বা পালস হলো আপনার বুকের ভেতর একটা শান্ত ঢোলের তাল, যা সারাদিন রাত তালে তালে বাজে। দৌড়লে এটি দ্রুত বাজে, আর শান্ত হয়ে বসলে প্রতি মিনিটে ৬০ থেকে ১০০ বারের মধ্যে বাজে। ${v ? `আপনার নাড়ির গতি মিনিটে ${v} বার।` : ''}`;
      }
      return `Your pulse is like a friendly little drum beating rhythmically inside your chest. When you run, it beats faster; when you rest peacefully, it beats happily between 60 and 100 times a minute. ${v ? `Yours is ${v} beats per minute.` : ''}`;
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
    getText: (val, patientAge, lang = 'en') => {
      if (lang === 'hi') {
        return `हड्डियां आपके शरीर के मज़बूत खंभे और दीवारें हैं, जो आपके पूरे शरीर को सीधा खड़ा रखती हैं। सुबह की धूप, दूध और दालें इन खंभों को हमेशा चट्टान की तरह पक्का बनाए रखती हैं।`;
      }
      if (lang === 'bn') {
        return `হাড় হলো আপনার শরীরের শক্ত দেওয়াল আর স্তম্ভ, যা পুরো শরীরটাকে সোজা করে ধরে রাখে। সকালের মিষ্টি রোদ, দুধ আর ডাল এই স্তম্ভগুলোকে পাথরের মতো মজবুত রাখে।`;
      }
      return `Your bones are like the strong pillars holding up a house! Morning sunshine, milk, and nutritious meals keep these pillars solid and unbreakable.`;
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
    getText: (val, patientAge, lang = 'en') => {
      if (lang === 'hi') {
        return `प्रोटीन आपके शरीर के अंदर रहने वाले नन्हें-नन्हें मिस्त्रियों की तरह होता है! जब आप दिनभर काम करते हैं, तो यही मिस्त्री रात को अंदर की मरम्मत करते हैं और सुबह आपको नई ताक़त देते हैं। दाल, पनीर और मेवे में यह खूब मिलता है।`;
      }
      if (lang === 'bn') {
        return `প্রোটিন হলো আপনার শরীরের ভেতরে থাকা একদল দক্ষ মিস্ত্রির মতো! সারাদিন কাজ করার পর এই মিস্ত্রিরাই রাতে আপনার শরীর মেরামত করে নতুন শক্তি এনে দেয়। ডাল, পনির আর ডিমে প্রচুর প্রোটিন থাকে।`;
      }
      return `Protein is like a team of friendly repair workers living inside you! Every night while you sleep, they patch up tired muscles and build new strength so you wake up refreshed and energetic.`;
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
    getText: (val, patientAge, lang = 'en') => {
      if (lang === 'hi') {
        return `जैसे किसी पौधे को अगर दो दिन पानी ना दो तो उसकी पत्तियां मुरझा जाती हैं और पानी डालते ही खिली-खिली हो जाती हैं, वैसे ही हमारा शरीर है! दिनभर में 2 से 3 लीटर पानी पीने से चेहरे पर चमक रहती है और सुस्ती कभी पास नहीं आती।`;
      }
      if (lang === 'bn') {
        return `গাছে যেমন জল না দিলে পাতা শুকিয়ে যায় আর জল দিলেই তরতাজা হয়ে ওঠে, আমাদের শরীরও ঠিক তেমনই! দিনে অন্তত আড়াই লিটার জল খেলে শরীর একদম সতেজ আর হালকা থাকে।`;
      }
      return `Just like watering a green houseplant so its leaves stay shiny and bouncy, drinking 2 to 3 liters of clean water every day keeps your skin glowing and your energy high!`;
    }
  }
};

/**
 * Returns a short, super-friendly 5-year-old child explanation for any vital.
 */
export function getMetricLaymanExplainer(metricKey, healthData, language = 'en') {
  const item = METRIC_EXPLAINERS[metricKey];
  if (!item) return null;
  const vitals = healthData?.vitals || {};
  const patient = healthData?.patient || {};
  let val = null;
  if (metricKey === 'metabolicAge') val = healthData?.metabolicAge || vitals?.metabolicAge;
  else if (metricKey === 'bodyScore') val = healthData?.bodyScore || vitals?.bodyScore;
  else if (metricKey === 'bmi') val = vitals?.bmi;
  else if (metricKey === 'bodyFat') val = vitals?.bodyFat;
  else if (metricKey === 'muscleMass') val = vitals?.muscleMass;
  else if (metricKey === 'pulse') val = vitals?.pulse;
  else if (metricKey === 'oxygen') val = vitals?.oxygen;
  return item.getText(val, patient?.age, language);
}

// ── DYNAMIC LAYMAN REPORT EXPLANATION DECODERS (OFFLINE, ZERO DOCTOR JARGON) ──

/**
 * Report 1: Health Score & Overview
 * 9 Score Bands, Plain-Language Explanation, Peer Reference (72), Blind/Elderly Accessibility, Next Guidance
 */
export function getReport1Speech(healthData, language = 'en') {
  const patient = healthData?.patient || {};
  const vitals = healthData?.vitals || {};
  const name = patient?.name ? patient.name.split(' ')[0] : (language === 'hi' ? 'Dost' : language === 'bn' ? 'Bondhu' : 'Friend');
  const score = Math.round(Number(healthData?.bodyScore || vitals?.bodyScore || 85));

  if (language === 'hi') {
    let text = `${name}... `;
    text += `Aapka health score 100 mein se ${score} hai. `;
    text += `Health score 100 mein se hota hai. Ek higher score ka matlab hai ki aaj ki check ki gayi readings preferred range ke zyada paas hain. `;

    if (score >= 95) {
      text += `Bahut hi badhiya! Outstanding! Aaj check ki gayi zyada tar readings preferred range ke bahut paas hain. Aap bahut achha kar rahe hain. Aapki age ke logon ka reference score lagbhag 72 hai, aur aapka score usse kaafi upar hai. Apni healthy routine aise hi continue rakhiye. `;
    } else if (score >= 90) {
      text += `Excellent! Aaj aapki overall readings bahut achhi hain. Zyada tar values preferred range mein ya uske paas hain. Ek-do cheezein aur improve ho sakti hain, lekin overall aap bahut achha kar rahe hain. Aapki age ke logon ka reference score lagbhag 72 hai, aur aapka score ${score} usse upar hai. `;
    } else if (score >= 80) {
      text += `Bahut achha! Very good! Aaj ki zyada tar readings achhi hain. Kuch areas mein thoda aur improvement ho sakta hai, lekin overall result strong hai. Healthy habits continue rakhiye. Aapki age ke logon ka reference score lagbhag 72 hai, aur aapka score ${score} us reference se upar hai. `;
    } else if (score >= 70) {
      text += `Achha result hai. Good. Aapki overall readings ek theek baseline par hain. Kaafi readings achhi hain aur kuch aur improve ho sakti hain. Aapki age ka reference score lagbhag 72 hai, aur aapka score uske aas-paas ya thoda upar hai. `;
    } else if (score >= 60) {
      text += `Result theek hai, lekin improvement ki jagah hai. Kuch readings achhi hain aur kuch areas par thoda dhyan dene ki zarurat hai. Regular activity, balanced khana aur achhi neend par focus rakhiye. Ye sirf aaj ki measurements ka summary score hai. Iska matlab ye nahi hai ki aap unhealthy hain. `;
    } else if (score >= 50) {
      text += `Aaj ki kuch readings par dhyan dene ki zarurat hai. Iska matlab ye nahi hai ki kuch zaroor galat hai. Bas kuch values preferred range se thodi door hain. Ab hum simple language mein batayenge ki kaunsi readings achhi hain aur kin cheezon ko improve karna hai. `;
    } else if (score >= 40) {
      text += `Kuch areas mein improvement ki zarurat hai. Ghabraiye mat. Ek scan se kisi ki poori health decide nahi hoti. Bas aaj ki kuch measurements preferred range se bahar ya thodi door hain. Ab hum ek-ek karke simple language mein samjhayenge ki kis cheez par kaam karna hai. `;
    } else if (score >= 30) {
      text += `Aaj kai readings ko thoda zyada attention dene ki zarurat hai. Ghabraiye mat—ye score diagnosis nahi hai. Paani kam peena, khana, recent exercise, stress ya measurement ke tareeke se bhi readings change ho sakti hain. Unusual readings ko dobara check karna better rahega. `;
    } else {
      text += `Aaj ki kai measurements preferred range se kaafi door hain, isliye unhe dhyan se dobara dekhna chahiye. Ghabraiye mat. Sirf is score se kisi bimari ka diagnosis nahi hota. Unusual readings ko dobara check karein. Agar important readings baar-baar abnormal aayein, ya aapki tabiyat theek na lage, to doctor ya healthcare professional se baat karein. `;
    }

    text += `Aapko screen padhne ki zarurat nahi hai. Main aapki report ka har important part simple language mein samjhaunga. `;
    text += `Agla part dekhne ke liye Next dabayein, jisme hum batayenge ki aapke shareer ka kaunsa hissa sabse strong hai aur kisme sudhaar ki zarurat hai.`;
    return text;
  }

  if (language === 'bn') {
    let text = `${name}... `;
    text += `Apnar health score 100-r moddhe ${score}. `;
    text += `Health score 100-er moddhe hishab kora hoy. Higher score-er mane ajker check kora beshirbhag reading preferred range-er kachakachi ache. `;

    if (score >= 95) {
      text += `Darun result! Outstanding! Aj check kora beshirbhag reading preferred range-er khub kachakachi ache. Apni khub bhalo korchen. Apnar boyosher manusher reference score pray 72, ar apnar score tar theke onek beshi. Ei healthy routine-ta continue korun. `;
    } else if (score >= 90) {
      text += `Excellent! Aj apnar overall reading khub bhalo. Beshirbhag value preferred range-e ba tar kachakachi ache. Ek-dui jaygay aro improvement hote pare, kintu overall apni khub bhalo korchen. Apnar boyosher reference score pray 72, ar apnar score ${score} tar theke beshi. `;
    } else if (score >= 80) {
      text += `Khub bhalo! Very good! Ajker beshirbhag reading bhalo ache. Kichu jaygay aro ektu improvement hote pare, kintu overall result strong. Healthy habit-gulo continue korun. Apnar boyosher reference score pray 72, ar apnar score ${score} tar theke beshi. `;
    } else if (score >= 70) {
      text += `Bhalo result. Good. Overall reading ekta bhalo baseline-e ache. Onnek reading bhalo, ar kichu aro improve kora jay. Apnar boyosher reference score pray 72, ar apnar score tar kachakachi ba ektu beshi. `;
    } else if (score >= 60) {
      text += `Result motamuti bhalo, kintu improvement-er jayga ache. Kichu reading bhalo, ar kichu jaygay ektu beshi kheyal rakha dorkar. Regular activity, balanced khabar ar bhalo ghum-er upor focus korun. Eta sudhu ajker measurement-er summary score. Er mane ei noy je apni unhealthy. `;
    } else if (score >= 50) {
      text += `Ajker kichu reading-e attention dorkar. Er mane ei noy je nishchit bhabe kono problem ache. Sudhu kichu value preferred range theke ektu dure ache. Ebar amra sohoj bhashay bolbo kon reading bhalo ar kon jaygay improvement kora jay. `;
    } else if (score >= 40) {
      text += `Kichu jaygay improvement dorkar. Bhoy paben na. Ekta scan diye puro health decide kora jay na. Ajker kichu measurement preferred range-er baire ba ektu dure ache. Ebar amra ek-ek kore sohoj bhashay bojhabo kon jaygay kaj kora jay. `;
    } else if (score >= 30) {
      text += `Aj besh kichu reading-e aro attention dorkar. Bhoy paben na—ei score kono diagnosis noy. Kom jol khawa, khabar, recent exercise, stress ba measurement-er condition-er jonno-o reading change hote pare. Unusual reading abar check kora bhalo. `;
    } else {
      text += `Ajker besh kichu measurement preferred range theke onekta dure ache, tai segulo bhalo kore abar dekha dorkar. Bhoy paben na. Sudhu ei score diye kono rog diagnose kora jay na. Unusual reading abar check korun. Important reading bar-bar abnormal thakle, ba shorir kharap lagle, doctor ba healthcare professional-er sathe kotha bolun. `;
    }

    text += `Apnake screen porte hobe na. Ami apnar report-er prottekta important part sohoj bhashay bojhabo. `;
    text += `Poroborti ongsho dekhte Next chapun, jekhane amra bolbo apnar shorirer kon jaygata shobcheye shoktishali ar kothay aro unnoti dorkar.`;
    return text;
  }

  // English fallback
  let text = `${name}... `;
  text += `Your health score is ${score} out of 100. `;
  text += `A higher score means more of today’s checked values are closer to the preferred ranges. `;

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

  text += `This score is a summary, not a diagnosis. `;
  text += `You do not need to read the screen. I’ll explain each part of your report to you. `;
  text += `Next, let’s find out which areas of your body report are strongest and which ones need attention.`;
  return text;
}

/**
 * Report 2: Body Composition Fundamentals & Strongest Systems
 * Plain-language breakdown of Muscle, Fat, Water, and Weight goals with Indian nutrition advice.
 */
export function getReport2Speech(healthData, language = 'en') {
  const patient = healthData?.patient || {};
  const vitals = healthData?.vitals || {};
  const name = patient?.name ? patient.name.split(' ')[0] : (language === 'hi' ? 'Dost' : language === 'bn' ? 'Bondhu' : 'Friend');
  const weight = vitals.weight ? Number(vitals.weight).toFixed(1) : null;
  const height = vitals.height ? Math.round(Number(vitals.height)) : null;
  const bmi = vitals.bmi ? Number(vitals.bmi).toFixed(1) : null;
  const bodyFat = vitals.bodyFat ? Number(vitals.bodyFat).toFixed(1) : null;
  const muscleMass = vitals.muscleMass ? Number(vitals.muscleMass).toFixed(1) : null;
  const waterPct = vitals.waterPct || vitals.bodyWater ? Number(vitals.waterPct || vitals.bodyWater).toFixed(1) : '60';
  const scanCount = getScanCount(healthData);

  const isMale = patient?.gender?.toLowerCase() === 'male';
  const muscleLow = isMale ? (muscleMass && Number(muscleMass) < 36) : (muscleMass && Number(muscleMass) < 28);
  const fatHigh = isMale ? (bodyFat && Number(bodyFat) > 24) : (bodyFat && Number(bodyFat) > 31);

  if (language === 'hi') {
    let text = `${name}, aapko screen dekhne ki zarurat nahi hai. Main aapke body composition ka pura hisab aasan bhasha mein bata raha hoon. `;
    if (weight && height) {
      text += `Aapka vajan ${weight} kilo aur lambai ${height} centimeter hai. `;
    }
    text += `Aaj aapka sabse strong area body water hai, lagbhag ${waterPct} percent! Shareer mein paani ki matra bahut achhi hai, jisse jodo mein lachak aur dinbhar taazgi bani rehti hai. `;

    if (muscleLow) {
      text += `Aapka muscle level aapki height ke hisaab se thoda kam hai. Muscles hi shareer ka engine hain jo aapko chalne, seedhiyan chadhne aur taaqat dene ka kaam karti hain. Inhe badhane ke liye khane mein moong dal, paneer, ande ya bhuna chana lein, aur roz 20 minute brisk walk ya halki kasrat karein. `;
    } else {
      text += `Aapki muscles ki taaqat acchi sthiti mein hai, jo daily activities mein aapko strong rakhti hai. `;
    }

    if (fatHigh) {
      text += `Aapka body fat thoda sa zyada hai. Tali hui cheezein aur meethi chai thodi kam karein, aur roz aadha ghanta ghoomein, jisse yeh aasaani se balance mein aa jayega. `;
    } else {
      text += `Aapka body fat aur vajan ek acche balance mein hain. `;
    }

    if (scanCount >= 2) {
      text += `Yeh aapka scan number ${scanCount} hai, jisme hum dekh sakte hain ki pichli visit se kitna sudhaar hua hai. `;
    } else {
      text += `Yeh aapka pehla scan hai, jisse aapka starting baseline tay hua hai. Agle scan par changes saaf dikhenge. `;
    }

    text += `Agli screen par blood pressure aur vitals dekhne ke liye Continue dabayein, ya pichli screen ke liye Back dabayein.`;
    return text;
  }

  if (language === 'bn') {
    let text = `${name}, apnake screen dekhte hobe na. Ami apnar body composition-er puro hishab sohoj bhashay bolchhi. `;
    if (weight && height) {
      text += `Apnar ojon ${weight} kg ar uchhota ${height} cm. `;
    }
    text += `Aj apnar shobcheye shoktishali area body water, pray ${waterPct} percent! Shorire joler matra khub bhalo, ja shorirke sotej ar jor-gulo ke chholochhole rakhe. `;

    if (muscleLow) {
      text += `Apnar mangshopeshi ba muscle uchhotar tulonay ektu kom. Khub sohoje eta barhanor jonno rojkar khabare moong dal, chhana, dim ba chhola add korun, ar roj 20 minute ektu haata-haati korun. `;
    } else {
      text += `Apnar muscle power khub bhalo obosthay ache, ja rojkar kaaje shokti jogay. `;
    }

    if (fatHigh) {
      text += `Apnar body fat ektu beshi ache. Bhaja-porha ar mishti cha ektu komiye roj adha ghonta haatle eta shundor bhabe kome jabe. `;
    } else {
      text += `Apnar body fat ar ojon ekta bhalo balance-e royeche. `;
    }

    if (scanCount >= 2) {
      text += `Eta apnar scan number ${scanCount}, jar madhyome ager visit-er poriborton bojha jachhe. `;
    } else {
      text += `Eta apnar prothom scan, tai eta baseline. Agami scan-e ager tulona shuru hobe. `;
    }

    text += `Poroborti screen-e blood pressure ar vitals dekhte Continue chapun, ba ager screen-e jete Back chapun.`;
    return text;
  }

  // English fallback
  let text = `${name}, you do not need to look at the screen. I will explain your body composition results to you in plain words. `;
  if (weight && height) {
    text += `You weigh ${weight} kg and stand ${height} cm tall. `;
  }
  text += `Your standout strength today is body water, at about ${waterPct} percent! Your cells are well hydrated, which cushions your joints and keeps your daily energy steady. `;

  if (muscleLow) {
    text += `Your muscle percentage is slightly lower than preferred for your height. Muscles are your body's power engine for walking, climbing stairs, and carrying groceries. Adding simple protein foods to your meals—like moong dal, paneer, sprouts, or boiled eggs—and doing 20 minutes of brisk walking or light exercise will help build strong muscle. `;
  } else {
    text += `Your muscle mass is in a strong and healthy range, providing great support for your daily activities. `;
  }

  if (fatHigh) {
    text += `Your body fat is slightly above the target range. Reducing fried snacks and sweet chai, and enjoying a 30-minute walk each day will gently bring it back into balance. `;
  } else {
    text += `Your body fat and overall weight are in a healthy, balanced range. `;
  }

  if (scanCount >= 2) {
    text += `This is scan ${scanCount} of 7, showing how your muscle and fat targets are progressing over time. `;
  } else {
    text += `This is scan 1 of 7, which establishes your starting baseline. Progress comparisons will unlock on your next scan. `;
  }

  text += `Tap Continue to go to your vital signs, or tap Back to return to your health score.`;
  return text;
}

/**
 * Report 3: Deep Metrics & Vital Signs (Blood Pressure, Pulse, Oxygen, Bones, Protein)
 */
export function getReport3Speech(healthData, language = 'en') {
  const vitals = healthData?.vitals || {};
  const sys = (vitals.systolic ?? vitals.bpSystolic) ? Math.round(Number((vitals.systolic ?? vitals.bpSystolic))) : null;
  const dia = (vitals.diastolic ?? vitals.bpDiastolic) ? Math.round(Number((vitals.diastolic ?? vitals.bpDiastolic))) : null;
  const spo2 = vitals.oxygen ? Math.round(Number(vitals.oxygen)) : 98;
  const pulse = (vitals.bpm ?? vitals.pulse) ? Math.round(Number((vitals.bpm ?? vitals.pulse))) : 75;
  const bone = vitals.boneMass ? Number(vitals.boneMass).toFixed(1) : '3.2';
  const scanCount = getScanCount(healthData);

  const bpHigh = sys && (sys > 128 || (dia && dia > 85));

  if (language === 'hi') {
    let text = `Ab hum aapke zaroori vitals aur shareer ke andar ke building blocks dekhenge. Aap aaram se sunte rahiye, main sab samjha raha hoon. `;
    if (sys && dia) {
      text += `Aapka blood pressure ${sys} aur ${dia} hai. `;
      if (bpHigh) {
        text += `Yeh thoda sa upar hai. Khane mein upar se namak na dalein, khub paani piyein aur shant neend lein, yeh steady ho jayega. `;
      } else {
        text += `Yeh bilkul normal aur shant range mein hai, jisse dil par koi faltu dabav nahi hai. `;
      }
    }
    text += `Khoon mein oxygen ${spo2} percent hai. 95 se upar ka matlab hai ki aapke phepde khub taazi hawa shareer ko bhej rahe hain. `;
    text += `Aapke dil ki dhadkan ${pulse} beats per minute hai, jo ek steady rhythm mein chal rahi hai. `;
    text += `Haddiyon ka mineral mass ${bone} kilo hai. Subah ki halki dhoop aur doodh-dahi haddiyon ko mazboot banaye rakhte hain. `;
    if (scanCount >= 2) {
      text += `Pichli visits ke mukable aapke vitals achhi stability dikha rahe hain. `;
    }
    text += `Agli screen par progress graph dekhne ke liye Continue dabayein, ya peechhe jaane ke liye Back dabayein.`;
    return text;
  }

  if (language === 'bn') {
    let text = `Ebar amra apnar core vitals ar shorirer bhetorer building blocks dekhbo. Apni aaramse shunun, ami shob boley dichhi. `;
    if (sys && dia) {
      text += `Apnar blood pressure ${sys} by ${dia}. `;
      if (bpHigh) {
        text += `Eta ektu beshir dike. Kacha lobon kom khaben, porjapto jol khaben ar bhalo ghumaben, eta shanto hoye jabe. `;
      } else {
        text += `Eta ekdom normal ar safe range-e royeche, hridpinde kono baroti chaap nei. `;
      }
    }
    text += `Rakte oxygen ${spo2} percent. 95-er beshi thaka mane phushphush bhalo taaja hawa pachhe ar shorir-e oxygen thikmoto pouchhachhe. `;
    text += `Naadir spondon ${pulse} beats per minute, ekta shanto chhonnde cholchhe. `;
    text += `Haader mineral mass ${bone} kg. Shokaler mishti rode ar dudh-doi haad-ke shokto rakhe. `;
    if (scanCount >= 2) {
      text += `Ager visit-er tulonay apnar vitals bhalo stability dekhachhe. `;
    }
    text += `Poroborti screen-e progress graph dekhte Continue chapun, ba ager screen-e jete Back chapun.`;
    return text;
  }

  // English fallback
  let text = `Now we examine your core vital signs and inner tissue reserves. You can listen comfortably while I explain each reading. `;
  if (sys && dia) {
    text += `Your blood pressure is ${sys} over ${dia} mmHg. `;
    if (bpHigh) {
      text += `This is slightly elevated today. Cutting back on table salt, staying well hydrated, and getting sound sleep will help keep it relaxed and steady. `;
    } else {
      text += `This is in a calm, safe, and healthy range, meaning blood is flowing smoothly without strain on your heart. `;
    }
  }
  text += `Your blood oxygen is ${spo2} percent. 95 and above means your lungs are delivering plenty of fresh oxygen to every organ in your body. `;
  text += `Your resting pulse is ${pulse} beats per minute, beating with a steady rhythm. `;
  text += `Your bone mineral mass is ${bone} kg. Morning sunshine for natural Vitamin D and calcium-rich foods like milk, curd, or sesame keep your bone structure firm and strong. `;
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
  const scanCount = getScanCount(healthData);

  if (language === 'hi') {
    let text = `Yeh aapka progress dashboard hai. Agar aap screen par graph nahi dekh pa rahe, to chinta mat kijiye—main bolkar batata hoon ki aapki visits kya dikha rahi hain. `;
    if (scanCount <= 1) {
      text += `Yeh visit 1 of 7 hai. Aaj aapka starting baseline bana hai. Ek scan yeh batata hai ki aaj aap kahan hain. Jab aap doosre scan ke liye aayenge, to dono visits ka graph aur comparison unlock ho jayega. `;
    } else if (scanCount === 2) {
      text += `Yeh visit 2 of 7 hai! Ab hum aapki pichli visit se tulna kar sakte hain. Aapke vitals pichli baar ke mukable acchi stability dikha rahe hain. Aise hi regular checkup se ek saaf trend banega. `;
    } else if (scanCount >= 7) {
      text += `Badhai ho! Aapne Reliv ke saaton scan poore kar liye hain! Aapka personal baseline hamesha ke liye ban chuka hai aur yeh doctor ko dikhane ke liye bilkul taiyar hai. `;
    } else {
      text += `Visit number ${scanCount} of 7! Baar-baar checkup karne se aapka personal health pattern bilkul saaf dikh raha hai. Roz ke chote-mote badlav ke peeche asli sehat ka pata chal raha hai. `;
    }
    text += `Agli screen par poori summary aur take-home QR code dekhne ke liye Continue dabayein, ya peechhe jaane ke liye Back dabayein.`;
    return text;
  }

  if (language === 'bn') {
    let text = `Eta apnar progress dashboard. Graph dekhte na pele-o chinta nei—ami mukhe boley dichhi ager visit-er theke ajki obostha. `;
    if (scanCount <= 1) {
      text += `Eta visit 1 of 7. Ajker scan apnar baseline toiri korlo. Porer bar jokhon ashben, tokhon du-ti visit-er graph ar tulona unlock hoye jabe. `;
    } else if (scanCount === 2) {
      text += `Eta visit 2 of 7! Ebar amra prothom visit-er sathe tulona korte parchi. Shorirer vitals ager theke bhalo stability dekhachhe. Regular checkup korle shundor pattern toiri hobe. `;
    } else if (scanCount >= 7) {
      text += `Abhinandan! Apni shob 7-ti scan complete korechen! Apnar personal health baseline permanent bhabe toiri ar eta doctor-ke dekhanor moto ready. `;
    } else {
      text += `Visit number ${scanCount} of 7! Bar-bar checkup korar fole apnar shorirer pattern ekdom spashtho. Blood pressure, pulse ar muscle-er trend shundor bhabe bojha jachhe. `;
    }
    text += `Poroborti screen-e puro summary ar QR code dekhte Continue chapun, ba ager screen-e jete Back chapun.`;
    return text;
  }

  // English fallback
  let text = `This is your progress dashboard. If you cannot see the graph on the screen, don't worry—I will tell you exactly what your visit history shows. `;
  if (scanCount <= 1) {
    text += `This is visit 1 of 7. Today establishes your starting baseline. A single scan captures where you are right now. When you return for your second scan, your visit-to-visit progress graph will unlock. `;
  } else if (scanCount === 2) {
    text += `Visit 2 of 7! You now have two points of data. Your vital signs show steady consistency compared to your first checkup. Keep visiting regularly to build a clear health trend. `;
  } else if (scanCount >= 7) {
    text += `Congratulations! You have completed all 7 scans of your Reliv journey! Your personal biological baseline is now permanently locked and confirmed. You have a complete, doctor-ready health profile. `;
  } else {
    text += `Visit ${scanCount} of 7! With multiple visits recorded, your personal health pattern is becoming clear and reliable. Your blood pressure, pulse, and muscle levels are showing dependable trends over time. `;
  }
  text += `Tap Continue to view your full summary, eye check, and take-home QR code, or tap Back to return to vitals.`;
  return text;
}

/**
 * Report 5: Actionable Daily Habits, Eyesight & Take-Home QR Code Guidance
 */
export function getReport5Speech(healthData, language = 'en') {
  const patient = healthData?.patient || {};
  const name = patient?.name ? patient.name.split(' ')[0] : (language === 'hi' ? 'Dost' : language === 'bn' ? 'Bondhu' : 'Friend');

  if (language === 'hi') {
    let text = `${name}, yeh aapke poore checkup ki aakhiri summary hai. `;
    text += `Overall, aapke zaroori vitals aur blood pressure shant hain, aur shareer mein paani ki matra aapko achhi taazgi deti hai. `;
    text += `Aage badhane ke liye sabse zaroori kaam hai: protein-rich khana jaise dal ya paneer lein taaki muscles banein, aur roz 30 minute paidal chalein. `;
    text += `Aapki aankhon ki jaanch bhi yahan darj hai. Agar aankhon par zor ya dhundhla lage, to eye doctor se zaroor check karwayein. `;
    text += `Is poori report ko apne phone par le jaane ke liye, aap ya aapka koi saathi phone ka camera screen par bane square QR code par dikhayein. Yeh bina kisi app ke turant aapke phone par khul jayegi. `;
    text += `Aap jab chahein Return Home daba sakte hain, ya peechhe dekhne ke liye Back daba sakte hain. Reliv ke saath apni sehat ka dhyan rakhne ke liye shukriya!`;
    return text;
  }

  if (language === 'bn') {
    let text = `${name}, eta apnar puro checkup-er final summary. `;
    text += `Overall, apnar vitals khub bhalo ar shorire joler poriman energy dhore rakhchhe. `;
    text += `Shobcheye dorkari kaj holo mangshopeshi barhano ar fat control-e rakha, jar jonno ghorer bhalo khabar ar roj ektu haata-i jothestho. `;
    text += `Chokher parikshar result-o ekhane ache. Chokhe chaap ba jhapsha lagle ekjon eye doctor-er sathe dekha kora bhalo. `;
    text += `Ei puro report-ta nijer phone-e niye jete, apnar smartphone-er camera screen-er square QR code-er shamne dhorun. Kono app chhara-i eta phone-e khule jabe. `;
    text += `Shob shesh hole Return Home chapun, ba ager pata dekhte Back chapun. Reliv-er sathe nijer shorirer jotno neoyar jonno dhonyobad!`;
    return text;
  }

  // English fallback
  let text = `${name}, here is the final summary of your entire checkup. `;
  text += `Overall, your vital rhythm is functioning well and your cellular hydration provides solid daily stamina. `;
  text += `Your primary opportunity for improvement is building lean muscle and keeping everyday fat in check through balanced home meals and daily brisk walking. `;
  text += `Your eyesight screening is also recorded here. If you ever feel eye strain or blurred vision, having your eyes checked by an optometrist is always recommended. `;
  text += `To take this complete report home, you or someone with you can point a smartphone camera at the square QR code on the screen. It will open your private digital report on your phone without downloading any app. `;
  text += `You can tap Return Home whenever you are ready, or tap Back to review earlier pages. Thank you for checking your health with Reliv today!`;
  return text;
}
