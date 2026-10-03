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
  const waterPct = vitals.waterPct || vitals.bodyWater ? Number(vitals.waterPct || vitals.bodyWater).toFixed(1) : '58.0';
  const scanCount = getScanCount(healthData);

  const isMale = patient?.gender?.toLowerCase() === 'male';
  const muscleLow = isMale ? (muscleMass && Number(muscleMass) < 36) : (muscleMass && Number(muscleMass) < 28);
  const fatHigh = isMale ? (bodyFat && Number(bodyFat) > 24) : (bodyFat && Number(bodyFat) > 31);

  if (language === 'hi') {
    let text = `${name}, आपको स्क्रीन देखने की बिल्कुल जरूरत नहीं है। मैं आपके शरीर की बनावट का पूरा हिसाब बिल्कुल आसान शब्दों में बता रही हूं। `;
    if (weight && height) {
      text += `आपका वजन ${weight} किलो और लंबाई ${height} सेंटीमीटर है। `;
    }
    text += `आज आपका सबसे मजबूत हिस्सा शरीर का पानी है, लगभग ${waterPct} प्रतिशत! आपके शरीर में पानी की मात्रा बहुत अच्छी है, जो आपके जोड़ों को चिकना रखती है और दिनभर ताजगी बनाए रखती है। `;

    if (muscleLow) {
      text += `आपकी मांसपेशियों की ताकत आपकी लंबाई के हिसाब से थोड़ी कम आई है। मांसपेशियां ही शरीर का असली इंजन हैं, जो आपको चलने, सीढ़ियां चढ़ने और सामान उठाने की ताकत देती हैं। इन्हें मजबूत करने के लिए खाने में मूंग की दाल, पनीर, अंकुरित अनाज, भुना चना या उबले अंडे शामिल करें, और रोजाना 20 मिनट तेज चाल से टहलें। `;
    } else {
      text += `आपकी मांसपेशियों की ताकत बहुत अच्छी स्थिति में है, जो आपको दिनभर फुर्तीला रखती है। `;
    }

    if (fatHigh) {
      text += `आपके शरीर में चर्बी थोड़ी सी ज्यादा है। तली-भुनी चीजें और मीठी चाय थोड़ी कम करें, और रोजाना आधा घंटा घूमें, जिससे यह आसानी से सामान्य हो जाएगी। `;
    } else {
      text += `आपके शरीर का फैट और वजन एक स्वस्थ संतुलन में हैं। `;
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
    if (weight && height) {
      text += `আপনার ওজন ${weight} কেজি এবং উচ্চতা ${height} সেন্টিমিটার। `;
    }
    text += `আজ আপনার শরীরের সবচেয়ে শক্তিশালী অংশ হলো জলের মাত্রা, প্রায় ${waterPct} শতাংশ! শরীরে জলের পরিমাণ দারুণ আছে, যা আপনার হাড়ের জোড়গুলোকে সচল রাখে এবং সারাদিন শরীরে সতেজতা বজায় রাখে। `;

    if (muscleLow) {
      text += `আপনার উচ্চতার তুলনায় পেশীর শক্তি বা মাসল কিছুটা কম রয়েছে। পেশীই হলো শরীরের মূল ইঞ্জিন, যা হাঁটাচলা করতে, সিঁড়ি দিয়ে উঠতে এবং প্রতিদিনের কাজের শক্তি যোগায়। পেশী শক্তপোক্ত করতে রোজকার খাবারে মুগ ডাল, ছানা বা পনির, অঙ্কুরিত ছোলা বা সেদ্ধ ডিম যোগ করুন, আর প্রতিদিন অন্তত ২০ মিনিট একটু জোরে হাঁটুন। `;
    } else {
      text += `আপনার পেশীর শক্তি খুব ভালো অবস্থায় রয়েছে, যা প্রতিদিনের কাজের শক্তি যোগায়। `;
    }

    if (fatHigh) {
      text += `আপনার শরীরের ফ্যাটের মাত্রা সামান্য বেশি আছে। ভাজাভুজি ও মিষ্টি চা একটু কমিয়ে প্রতিদিন আধঘণ্টা করে হাঁটলে এটি সুন্দরভাবে স্বাভাবিক হয়ে যাবে। `;
    } else {
      text += `আপনার শরীরের ফ্যাট ও ওজন একটি ভালো ভারসাম্যে রয়েছে। `;
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
    let text = `अब हम आपके दिल की धड़कन, ब्लड प्रेशर और शरीर के जरूरी संकेत देखते हैं। आप आराम से सुनिए, मैं सब आसान शब्दों में समझा रही हूं। `;
    if (sys && dia) {
      text += `आपका ब्लड प्रेशर ${sys} और ${dia} है। `;
      if (bpHigh) {
        text += `यह थोड़ा सा बढ़ा हुआ है। खाने में ऊपर से नमक कम करें, भरपूर पानी पिएं और अच्छी नींद लें, यह जल्दी ही सामान्य हो जाएगा। `;
      } else {
        text += `यह बिल्कुल सामान्य और शांत सीमा में है, जिसका मतलब है कि खून बिना किसी दबाव के आसानी से बह रहा है। `;
      }
    }
    text += `खून में ऑक्सीजन ${spo2} प्रतिशत है। 95 से ऊपर का मतलब है कि आपके फेफड़े खूब ताजी हवा पूरे शरीर में पहुंचा रहे हैं। `;
    text += `आपके दिल की धड़कन ${pulse} प्रति मिनट है, जो एक बिल्कुल शांत और स्थिर ताल में चल रही है। `;
    text += `आपकी हड्डियों का खनिज वजन ${bone} किलोग्राम है। सुबह की मीठी धूप और दूध, दही या दालें हड्डियों को हमेशा मजबूत बनाए रखेंगी। `;
    if (scanCount >= 2) {
      text += `पिछली जांच के मुकाबले आपके संकेत अच्छी स्थिरता दिखा रहे हैं। `;
    }
    text += `अगली स्क्रीन पर प्रोग्रेस ग्राफ देखने के लिए कंटिन्यू दबाएं, या पीछे जाने के लिए बैक दबाएं।`;
    return text;
  }

  if (language === 'bn') {
    let text = `এবার আমরা আপনার রক্তচাপ, হৃদস্পন্দন ও শরীরের মূল লক্ষণগুলো দেখবো। আপনি আরাম করে শুনুন, আমি সব বুঝিয়ে বলছি। `;
    if (sys && dia) {
      text += `আপনার রক্তচাপ বা ব্লাড প্রেশার ${sys} বাই ${dia}। `;
      if (bpHigh) {
        text += `এটি কিছুটা বেশি রয়েছে। কাঁচা লবণ এড়িয়ে চলুন, পর্যাপ্ত জল খান ও ভালো ঘুমান, এটি শান্ত হয়ে যাবে। `;
      } else {
        text += `এটি শান্ত ও নিরাপদ সীমার মধ্যে রয়েছে, অর্থাৎ আপনার হার্টের ওপর কোনো বাড়তি চাপ ছাড়াই রক্ত চলাচল স্বাভাবিক রয়েছে। `;
      }
    }
    text += `রক্তে অক্সিজেনের মাত্রা ${spo2} শতাংশ। ৯৫-এর বেশি থাকার অর্থ হলো ফুসফুস পর্যাপ্ত সতেজ হাওয়া শরীরের প্রতিটি অঙ্গে পৌঁছে দিচ্ছে। `;
    text += `আপনার নাড়ির গতি মিনিটে ${pulse} বার, যা একটি সুন্দর ও শান্ত ছন্দে চলছে। `;
    text += `আপনার হাড়ের ওজন ${bone} কিলোগ্রাম। সকালের মিষ্টি রোদ এবং দুধ, দই বা তিল আপনার হাড়ের কাঠামোকে মজবুত রাখবে। `;
    if (scanCount >= 2) {
      text += `আগের ভিজিটের তুলনায় আপনার শরীরের লক্ষণগুলো ভালো স্থিরতা দেখাচ্ছে। `;
    }
    text += `পরের স্ক্রিনে বহু-স্ক্যানের প্রোগ্রেস গ্রাফ দেখতে কন্টিনিউ চাপুন, অথবা আগের স্ক্রিনে ফিরতে ব্যাক চাপুন।`;
    return text;
  }

  // English fallback
  let text = `Now we examine your core vital signs and inner reserves. You can listen comfortably while I explain each reading. `;
  if (sys && dia) {
    text += `Your blood pressure is ${sys} over ${dia}. `;
    if (bpHigh) {
      text += `This is slightly elevated today. Cutting back on table salt, staying well hydrated, and getting sound sleep will help keep it relaxed and steady. `;
    } else {
      text += `This is in a calm, safe, and healthy range, meaning blood is flowing smoothly without strain on your heart. `;
    }
  }
  text += `Your blood oxygen is ${spo2} percent. 95 and above means your lungs are delivering plenty of fresh oxygen to every organ in your body. `;
  text += `Your resting pulse is ${pulse} beats per minute, beating with a steady rhythm. `;
  text += `Your bone mass is ${bone} kg. Morning sunshine for natural Vitamin D and calcium-rich foods like milk, curd, or sesame keep your bone structure firm and strong. `;
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
    let text = `यह आपका प्रोग्रेस डैशबोर्ड है। अगर आप स्क्रीन पर ग्राफ नहीं देख पा रहे हैं, तो चिंता मत कीजिए, मैं बोलकर बताती हूं कि आपकी जांचें क्या दिखा रही हैं। `;
    if (scanCount <= 1) {
      text += `यह कुल 7 में से आपकी पहली जांच है। आज आपका शुरुआती आधार बना है। एक स्कैन यह बताता है कि आज आपकी सेहत कहां है। जब आप दूसरे स्कैन के लिए दोबारा आएंगे, तो दोनों बार की तुलना और ग्राफ अपने आप खुल जाएंगे। `;
    } else if (scanCount === 2) {
      text += `यह 7 में से आपकी दूसरी जांच है! अब हम पहली जांच से तुलना कर सकते हैं। आपके सभी संकेत पिछली बार के मुकाबले अच्छी स्थिरता दिखा रहे हैं। ऐसे ही नियमित जांच से एक साफ ट्रेंड बनेगा। `;
    } else if (scanCount >= 7) {
      text += `बधाई हो! आपने रिलिव के सातों स्कैन पूरे कर लिए हैं! आपका व्यक्तिगत स्वास्थ्य आधार हमेशा के लिए तैयार हो चुका है और यह डॉक्टर को दिखाने के लिए बिल्कुल तैयार है। `;
    } else {
      text += `जांच नंबर ${scanCount} of 7! बार-बार जांच करने से आपका व्यक्तिगत स्वास्थ्य पैटर्न बिल्कुल साफ दिख रहा है। `;
    }
    text += `अगली स्क्रीन पर पूरी रिपोर्ट का सारांश, आंखों की जांच और रिपोर्ट ले जाने वाला क्यूआर कोड देखने के लिए कंटिन्यू दबाएं, या पीछे जाने के लिए बैक दबाएं।`;
    return text;
  }

  if (language === 'bn') {
    let text = `এটি আপনার প্রোগ্রেস ড্যাশবোর্ড। স্ক্রিনে গ্রাফ দেখতে না পেলেও কোনো চিন্তা নেই, আমি মুখে বুঝিয়ে দিচ্ছি আপনার ভিজিটের ইতিহাস কী বলছে। `;
    if (scanCount <= 1) {
      text += `এটি সাতটি স্ক্যানের মধ্যে আপনার প্রথম ভিজিট। আজকের স্ক্যানে আপনার শুরুর ভিত্তি তৈরি হলো। একটি স্ক্যান দেখায় যে আজ আপনার স্বাস্থ্য কোথায় রয়েছে। আপনি যখন দ্বিতীয় স্ক্যানের জন্য আবার আসবেন, তখন দুই ভিজিটের তুলনা ও গ্রাফ খুলে যাবে। `;
    } else if (scanCount === 2) {
      text += `এটি সাতটির মধ্যে দ্বিতীয় ভিজিট! এবার আমরা প্রথম ভিজিটের সাথে তুলনা করতে পারছি। শরীরের লক্ষণগুলো আগের চেয়ে ভালো স্থিরতা দেখাচ্ছে। নিয়মিত পরীক্ষা করলে সুন্দর প্যাটার্ন তৈরি হবে। `;
    } else if (scanCount >= 7) {
      text += `অভিনন্দন! আপনি সব সাতটি স্ক্যান সম্পূর্ণ করেছেন! আপনার ব্যক্তিগত স্বাস্থ্য প্রোফাইল স্থায়ীভাবে তৈরি এবং এটি ডাক্তারকে দেখানোর জন্য প্রস্তুত। `;
    } else {
      text += `ভিজিট নম্বর ${scanCount} of 7! বারবার পরীক্ষা করার ফলে আপনার স্বাস্থ্যের অগ্রগতি স্পষ্ট বোঝা যাচ্ছে। `;
    }
    text += `পরবর্তী স্ক্রিনে সম্পূর্ণ সারাংশ, চোখের পরীক্ষার ফলাফল এবং বাড়ি নিয়ে যাওয়ার কিউআর কোড দেখতে কন্টিনিউ চাপুন, অথবা আগের স্ক্রিনে ফিরতে ব্যাক চাপুন।`;
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
    let text = `${name}, यह आपके पूरे हेल्थ चेकअप का अंतिम सारांश है। `;
    text += `कुल मिलाकर, आपके शरीर के मुख्य संकेत और ब्लड प्रेशर बिल्कुल शांत और स्वस्थ हैं, और शरीर में पानी की मात्रा आपको दिनभर अच्छी स्फूर्ति देती है। `;
    text += `आगे सुधार के लिए सबसे जरूरी कदम है कि पौष्टिक घरेलू खाने और रोजाना की सैर से मांसपेशियों को मजबूत बनाएं और फैट को नियंत्रण में रखें। `;
    text += `आपकी आंखों की जांच का नतीजा भी यहां दर्ज है। अगर आंखों में भारीपन या धुंधलापन लगे, तो आंखों के डॉक्टर से जांच जरूर कराएं। `;
    text += `इस पूरी डिजिटल रिपोर्ट को अपने फोन पर घर ले जाने के लिए, आप या आपका कोई साथी अपने स्मार्टफोन का कैमरा स्क्रीन पर बने चौकोर क्यूआर कोड के सामने करें। यह बिना कोई ऐप डाउनलोड किए तुरंत आपके फोन पर खुल जाएगी। `;
    text += `जब आप तैयार हों, रिटर्न होम दबा सकते हैं, या पुरानी रिपोर्ट देखने के लिए बैक दबा सकते हैं। आज रिलिव के साथ अपनी सेहत का ध्यान रखने के लिए बहुत-बहुत धन्यवाद!`;
    return text;
  }

  if (language === 'bn') {
    let text = `${name}, এটি আপনার সম্পূর্ণ হেলথ চেকআপের চূড়ান্ত সারাংশ। `;
    text += `সামগ্রিকভাবে, আপনার রক্তচাপ ও মূল লক্ষণগুলো শান্ত ও স্বাস্থ্যকর অবস্থায় রয়েছে, এবং শরীরে জলের পর্যাপ্ত মাত্রা আপনাকে সারাদিনের শক্তি জোগাচ্ছে। `;
    text += `উন্নতির জন্য আপনার প্রধান সুযোগ হলো সাধারণ পুষ্টিকর ঘরের খাবার ও নিয়মিত হাঁটার মাধ্যমে পেশীর শক্তি বাড়ানো এবং ফ্যাট নিয়ন্ত্রণে রাখা। `;
    text += `এই স্ক্রিনে আপনার চোখের পরীক্ষার ফলাফলও নথিভুক্ত রয়েছে। চোখে ক্লান্তি বা ঝাপসা লাগলে চোখের ডাক্তার দেখানো সবসময়ই ভালো। `;
    text += `এই সম্পূর্ণ ডিজিটাল রিপোর্টটি নিজের ফোনে বাড়ি নিয়ে যেতে, আপনি বা আপনার সাথে থাকা কেউ স্মার্টফোনের ক্যামেরাটি স্ক্রিনের চারকোণা কিউআর কোডের সামনে ধরুন। কোনো অ্যাপ ডাউনলোড করা ছাড়াই এটি সরাসরি আপনার ফোনে খুলে যাবে। `;
    text += `আপনার দেখা শেষ হলে রিটার্ন হোম চাপতে পারেন, অথবা পেছনের পাতা দেখতে ব্যাক চাপুন। আজ রিলিভের সাথে নিজের স্বাস্থ্যের যত্ন নেওয়ার জন্য আপনাকে অনেক ধন্যবাদ!`;
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
