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
 * Report 1: Health Score & Metabolic Vitality
 */
export function getReport1Speech(healthData, language = 'en') {
  const patient = healthData?.patient || {};
  const vitals = healthData?.vitals || {};
  const name = patient?.name ? patient.name.split(' ')[0] : (language === 'hi' ? 'दोस्त' : language === 'bn' ? 'বন্ধু' : 'Friend');
  const score = Math.round(Number(healthData?.bodyScore || vitals?.bodyScore || 75));
  const age = Number(patient?.age) || 25;
  const metabolicAge = Math.round(Number(healthData?.metabolicAge || vitals?.metabolicAge || age));
  const scanCount = (Array.isArray(healthData?.history) ? healthData.history.length : 0) + 1;

  if (language === 'hi') {
    let text = `अरे वाह ${name}! सुनिए, आपकी सेहत की रिपोर्ट आ गई है। `;
    text += `जैसे स्कूल में 100 में से नंबर मिलते हैं ना, वैसे ही आज आपके पूरे शरीर को 100 में से ${score} नंबर मिले हैं! `;
    if (score >= 80) {
      text += `बहुत ही बढ़िया! आपका शरीर अंदर से एकदम चुस्त और तंदुरुस्त है, जैसे कोई नई चमचमाती गाड़ी। `;
    } else if (score >= 60) {
      text += `आपका स्कोर अच्छा है। थोड़ा रोज़ टहलने और भरपूर पानी पीने से यह और भी शानदार हो जाएगा। `;
    } else {
      text += `घबराने की बिल्कुल बात नहीं है, आपके शरीर को बस थोड़े से आराम और अच्छी हरी सब्ज़ियों की ज़रूरत है, यह बहुत जल्दी सुधर जाएगा। `;
    }

    text += `और सबसे मज़ेदार बात जानते हैं? आपकी अंदरूनी उम्र — यानी मेटाबॉलिक उम्र — ${metabolicAge} साल आई है! इसका मतलब यह है कि कैलेंडर वाली उम्र तो आपके जन्मदिन से गिनी जाती है, लेकिन अंदरूनी उम्र यह बताती है कि आपके अंदर का दिल, फेफड़े और शरीर अंदर से कितना जवान और फुर्तीला महसूस कर रहे हैं। `;
    if (metabolicAge < age) {
      text += `खुशी की बात यह है कि आपकी अंदरूनी उम्र आपकी असली उम्र से ${age - metabolicAge} साल छोटी है! यानी आप अंदर से एकदम जवान और एनर्जेटिक हैं! `;
    } else if (metabolicAge > age) {
      text += `आपकी अंदरूनी उम्र ${metabolicAge} साल है। रोज़ाना 20 मिनट टहलने और ताज़े फल खाने से आपका शरीर अंदर से फिर से बिल्कुल जवान हो जाएगा। `;
    } else {
      text += `आपकी अंदरूनी उम्र आपकी असली उम्र से बिल्कुल कदम से कदम मिलाकर चल रही है। `;
    }

    if (scanCount >= 2) {
      text += `यह आपकी ${scanCount}वीं जाँच है और आपकी सेहत का ग्राफ धीरे-धीरे बहुत अच्छा हो रहा है। `;
    } else {
      text += `यह आपकी पहली जाँच है। अगली बार फिर आकर देखिएगा कि आपकी ताक़त कितनी बढ़ गई है! `;
    }
    text += `नीचे दिए बटनों से आप किसी भी चीज़ का आसान मतलब सुन सकते हैं, या आगे बढ़ने के लिए Next दबाएँ।`;
    return text;
  }

  if (language === 'bn') {
    let text = `আরে বাহ ${name}! শুনুন, আপনার শরীরের রিপোর্ট এসে গেছে। `;
    text += `ঠিক যেমন স্কুলে একশোর মধ্যে নম্বর দেওয়া হয়, তেমনই আজ আপনার শরীর একশোর মধ্যে ${score} নম্বর পেয়েছে! `;
    if (score >= 80) {
      text += `অসাধারণ! আপনার শরীর ভেতর থেকে একদম চাঙ্গা আর তরতাজা রয়েছে, ঠিক যেন কোনো নতুন চকচকে গাড়ি। `;
    } else if (score >= 60) {
      text += `আপনার স্কোর বেশ ভালো। প্রতিদিন একটু হাঁটাহাঁটি আর মন ভরে জল খেলেই এটা আরও দুর্দান্ত হবে। `;
    } else {
      text += `ভয় পাওয়ার কিচ্ছু নেই! শরীরটাকে একটু বিশ্রাম আর টাটকা শাকসবজি দিলে এটা খুব দ্রুত ভালো হয়ে যাবে। `;
    }

    text += `আর সবচেয়ে মজার খবর কী জানেন? আপনার ভেতরের শারীরিক বয়স — যাকে মেটাবলিক বয়স বলে — সেটা এসেছে ${metabolicAge} বছর! এর মানে কী? মানে হলো, আপনার আসল বয়স তো জন্মদিন দেখে গোনা হয়, কিন্তু এই ভেতরের বয়সটা বলে যে আপনার শরীরের ভেতরের ইঞ্জিনটা আসলে কতটা চনমনে আর তরুণ! `;
    if (metabolicAge < age) {
      text += `দারুণ সুখবর হলো, আপনার ভেতরের শরীর আসল বয়সের চেয়েও ${age - metabolicAge} বছর তরুণ ও প্রাণবন্ত! `;
    } else if (metabolicAge > age) {
      text += `ভেতরের বয়স ${metabolicAge} বছর দেখাচ্ছে। প্রতিদিন একটু হাঁটা আর মিষ্টি রোদ গায়ে মাখলে শরীর আবার চনমনে হয়ে উঠবে। `;
    } else {
      text += `আপনার ভেতরের বয়স আসল বয়সের সাথে একদম মিলে গেছে। `;
    }

    if (scanCount >= 2) {
      text += `এটি আপনার ${scanCount} নম্বর পরীক্ষা, আর আগের চেয়ে আপনার শরীর স্পষ্ট উন্নতি করছে। `;
    } else {
      text += `এটি আপনার প্রথম চেকআপ। পরের বার এসে দেখবেন আপনার শরীরে কতটা নতুন শক্তি এসেছে! `;
    }
    text += `সহজ কথায় সব বুঝতে নিচের বোতামগুলোতে চাপ দিন, অথবা পরের পাতায় যেতে Next চাপুন।`;
    return text;
  }

  // English fallback
  let text = `Hey there ${name}! Your wellness report is ready. `;
  text += `Just like getting marks out of 100 in school, your body scored a wonderful ${score} out of 100 today! `;
  if (score >= 80) {
    text += `Super impressive! Your body is performing like a brand-new, smooth-running sports car. `;
  } else if (score >= 60) {
    text += `That's a strong, healthy foundation. Daily fresh water and a gentle walk will boost it even higher. `;
  } else {
    text += `No worries at all! Your body is simply asking for a little more rest and fresh fruits, which will perk it right back up. `;
  }

  text += `And here is the coolest part — your internal metabolic age is ${metabolicAge} years! Wondering what that means? Think of it like this: your birthday tells you how many candles are on your cake, but your metabolic age tells you how young and energetic your body actually feels on the inside! `;
  if (metabolicAge < age) {
    text += `You are actually running ${age - metabolicAge} years younger than your calendar age — like an energetic superhero! `;
  } else if (metabolicAge > age) {
    text += `Your inside age is ${metabolicAge} years. A fun 20-minute daily walk and drinking more water will quickly make your body feel younger and lighter. `;
  } else {
    text += `Your inner age matches your calendar age in great harmony. `;
  }

  if (scanCount >= 2) {
    text += `This is scan number ${scanCount}, and your progress is building up nicely. `;
  } else {
    text += `This is your first checkup. Check back next time to see how your body gets stronger! `;
  }
  text += `Tap any button below to hear what each number means in simple words, or tap Next to continue.`;
  return text;
}

/**
 * Report 2: Body Composition (BMI, Fat, Muscle, Belly Fat)
 */
export function getReport2Speech(healthData, language = 'en') {
  const vitals = healthData?.vitals || {};
  const weight = vitals.weight ? Number(vitals.weight).toFixed(1) : null;
  const height = vitals.height ? Math.round(Number(vitals.height)) : null;
  const bmi = vitals.bmi ? Number(vitals.bmi).toFixed(1) : null;
  const bodyFat = vitals.bodyFat ? Number(vitals.bodyFat).toFixed(1) : null;
  const muscleMass = vitals.muscleMass ? Number(vitals.muscleMass).toFixed(1) : null;

  if (language === 'hi') {
    let text = `चलिए अब देखते हैं आपका वज़न और शरीर की ताक़त! `;
    if (weight && height) text += `आपका वज़न ${weight} किलो है और आपकी लंबाई ${height} सेंटीमीटर। `;
    if (bmi) {
      text += `अब बात करते हैं बीएमआई की — बीएमआई कोई कठिन चीज़ नहीं है, इसका सीधा सा मतलब है कि क्या आपका वज़न आपकी लंबाई के हिसाब से सही है? जैसे स्कूल का बस्ता, ना बहुत भारी, ना बहुत हल्का, बिल्कुल आपकी पीठ के अनुकूल! आपका बीएमआई ${bmi} आया है, `;
      if (bmi < 18.5) text += `जो थोड़ा सा हल्का है। दाल, दूध, पनीर और मेवे खाने से यह बिल्कुल सही हो जाएगा। `;
      else if (bmi <= 24.9) text += `जो एकदम सही संतुलन में है, बिल्कुल शानदार! `;
      else text += `जो थोड़ा सा भारी है। रोज़ 20 मिनट की मस्ती भरी सैर से यह बस्ता हल्का हो जाएगा। `;
    }
    if (bodyFat) {
      text += `शरीर में जो फैट यानी चर्बी है, वह ${bodyFat} प्रतिशत है। चर्बी शरीर की बचत की गुल्लक जैसी है, जो ज़रूरत पड़ने पर काम आती है। `;
    }
    if (muscleMass) {
      text += `और मांसपेशियां ${muscleMass} प्रतिशत हैं — मांसपेशियां आपके शरीर का असली इंजन हैं, जो आपको दौड़ने-भागने और सामान उठाने की ताक़त देती हैं! `;
    }
    text += `और जानना चाहते हैं तो नीचे के बटन दबाकर सुनें, या आगे बढ़ने के लिए Next दबाएँ।`;
    return text;
  }

  if (language === 'bn') {
    let text = `আসুন এবার দেখে নিই আপনার ওজন আর পেশিশক্তির খবর! `;
    if (weight && height) text += `আপনার ওজন ${weight} কেজি আর উচ্চতা ${height} সেন্টিমিটার। `;
    if (bmi) {
      text += `এবার বলি বিএমআই কী — সহজ কথায়, আপনার উচ্চতার সাথে ওজনটা ঠিকঠাক মিলেছে কি না — ঠিক যেমন স্কুলের মাপমতো হালকা সুন্দর ব্যাগ! আপনার বিএমআই এসেছে ${bmi}, `;
      if (bmi < 18.5) text += `যা একটু হালকা। ডাল, দুধ আর পুষ্টিকর খাবার খেলে ওজন সুন্দর বাড়বে। `;
      else if (bmi <= 24.9) text += `যা একদম স্বাভাবিক ও চমৎকার মাপের মধ্যে রয়েছে! `;
      else text += `যা একটু ভারী। প্রতিদিন একটু হাঁটলেই ব্যাগটা একদম হালকা হয়ে যাবে। `;
    }
    if (bodyFat) {
      text += `শরীরের ফ্যাট হলো ${bodyFat} শতাংশ — ফ্যাট হলো জরুরি সময়ের জমানো শক্তির খাতা। `;
    }
    if (muscleMass) {
      text += `আর মাংসপেশি হলো ${muscleMass} শতাংশ — এই পেশিই আপনার শরীরের আসল ইঞ্জিন, যা আপনাকে সব কাজের অফুরন্ত শক্তি জোগায়! `;
    }
    text += `সহজ ভাষায় অর্থ জানতে নিচের বোতামগুলো চাপুন, অথবা Next চাপুন।`;
    return text;
  }

  // English
  let text = `Now let's explore your weight and muscle power! `;
  if (weight && height) text += `You weigh ${weight} kg and stand ${height} cm tall. `;
  if (bmi) {
    text += `Don't worry about the letters BMI — it simply checks whether your weight matches your height, just like a school backpack that is neither too heavy nor too empty, but just right for your size! Yours is ${bmi}, `;
    if (bmi < 18.5) text += `which is a little light. Delicious nuts, dairy, and wholesome meals will help build healthy weight. `;
    else if (bmi <= 24.9) text += `which is in the gold-star optimal balance! `;
    else text += `which is slightly heavy. A cheerful 20-minute daily walk will lighten the backpack naturally. `;
  }
  if (bodyFat) {
    text += `Body fat is ${bodyFat} percent — fat is like your energy piggy bank for times when you are active. `;
  }
  if (muscleMass) {
    text += `Muscle mass is ${muscleMass} percent — your muscles are your superhero power engine that lets you run, carry things, and stay strong! `;
  }
  text += `Tap below to hear what any number means in simple words, or tap Next to continue.`;
  return text;
}

/**
 * Report 3: Deep Metrics & Progress Insights (Bones, Protein, Water)
 */
export function getReport3Speech(healthData, language = 'en') {
  const scanCount = (Array.isArray(healthData?.history) ? healthData.history.length : 0) + 1;

  if (language === 'hi') {
    let text = `यहाँ देखिए आपके शरीर के मज़बूत खंभे और अंदरूनी मरम्मत का काम! `;
    text += `हड्डियां क्या हैं? जैसे किसी पक्के मकान में ईंट और सीमेंट के खंभे होते हैं, वैसे ही हड्डियां आपके पूरे शरीर को सीधा खड़ा रखती हैं। सुबह की धूप और दूध-दही इन्हें चट्टान जैसा मज़बूत बनाते हैं। `;
    text += `और प्रोटीन क्या है? प्रोटीन आपके शरीर के नन्हें मिस्त्रियों की तरह है, जो रोज़ रात को अंदर की टूट-फूट ठीक करता है। `;
    text += `और पानी — जैसे पौधे को रोज़ सींचने से पत्तियां खिली रहती हैं, वैसे ही पानी पीने से शरीर में ताज़गी बनी रहती है। `;
    if (scanCount >= 2) {
      text += `बहुत बढ़िया! आपकी हर जाँच के साथ शरीर और भी मज़बूत हो रहा है। `;
    } else {
      text += `अगली बार आने पर आप देख पाएँगे कि आपके शरीर के खंभे कितने और मज़बूत हुए हैं! `;
    }
    text += `नीचे किसी भी विषय पर छूकर उसका आसान मतलब सुन सकते हैं।`;
    return text;
  }

  if (language === 'bn') {
    let text = `এখানে দেখুন আপনার শরীরের মজবুত খুঁটি আর মেরামতের অবস্থা! `;
    text += `হাড় হলো আপনার শরীরের শক্ত দেওয়াল আর স্তম্ভের মতো, যা পুরো শরীরটাকে সোজা ও শক্ত করে রাখে। সকালের মিষ্টি রোদ আর দুধ এদের পাথরের মতো মজবুত রাখে। `;
    text += `আর প্রোটিন হলো শরীরের ছোট্ট মিস্ত্রি, যা প্রতিদিন রাতের বেলা আপনার শরীরের ভেতরের ক্লান্তি দূর করে নতুন শক্তি দেয়। `;
    text += `আর জল হলো গাছের গোড়ায় জল দেওয়ার মতো — প্রতিদিন জল খেলে শরীর একদম সতেজ আর ঝলমলে থাকে। `;
    if (scanCount >= 2) {
      text += `খুবই সুন্দর! আপনার নিয়মিত পরীক্ষায় শরীর দিন দিন আরও মজবুত হচ্ছে। `;
    } else {
      text += `পরের বার আসলে আপনি চার্টে দেখতে পাবেন আপনার শক্তি কতটা বেড়েছে! `;
    }
    text += `সহজে বুঝতে নিচের বোতামে চাপুন।`;
    return text;
  }

  let text = `Here are your body's strong pillars and daily repair crew! `;
  text += `Bones: think of your bones as the strong pillars of a house that hold everything upright. Morning sunshine and nutritious meals keep these pillars rock-solid. `;
  text += `Protein: protein is like a friendly crew of repair workers fixing tired muscles every night while you rest. `;
  text += `Hydration: just like watering a plant so its leaves stay green and fresh, drinking clean water keeps your energy glowing! `;
  if (scanCount >= 2) {
    text += `Fantastic! Your longitudinal trend is showing steady progress over time. `;
  } else {
    text += `On your next scan, you will clearly see how your body pillars and repair power have grown! `;
  }
  text += `Tap any button below to hear more in simple words.`;
  return text;
}

/**
 * Report 4: Vitals (Blood Pressure, Oxygen, Pulse, Temperature, Eyesight)
 */
export function getReport4Speech(healthData, language = 'en') {
  const vitals = healthData?.vitals || {};
  const sys = vitals.bpSystolic ? Math.round(Number(vitals.bpSystolic)) : null;
  const dia = vitals.bpDiastolic ? Math.round(Number(vitals.bpDiastolic)) : null;
  const spo2 = vitals.oxygen ? Math.round(Number(vitals.oxygen)) : null;
  const pulse = vitals.pulse ? Math.round(Number(vitals.pulse)) : null;
  const temp = vitals.temperature ? Number(vitals.temperature).toFixed(1) : null;

  if (language === 'hi') {
    let text = `अब देखते हैं आपके अंदरूनी इंजन की चाल! `;
    if (sys && dia) {
      text += `सबसे पहले ब्लड प्रेशर: इसे ऐसे समझिए जैसे बगीचे के पाइप में पानी बह रहा हो। जब पानी आराम से और शांत बहता है तो पाइप सुरक्षित रहता है। आपका ब्लड प्रेशर ${sys} और ${dia} आया है, `;
      if (sys <= 125 && dia <= 85) text += `जो पानी के शांत और सुरक्षित बहाव की तरह बिल्कुल नॉर्मल है। `;
      else text += `यानी पाइप में थोड़ा सा दबाव है। खाने में ऊपर से कच्चा नमक कम करें और शांत मन से नींद लें, यह तुरंत नॉर्मल हो जाएगा। `;
    }
    if (spo2) {
      text += `खून में ऑक्सीजन ${spo2} प्रतिशत है — ऑक्सीजन का मतलब है ताज़ा हवा की खुराक! जैसे गाड़ियों को अच्छा पेट्रोल चाहिए, वैसे ही दिमाग और दिल को ताज़ी हवा चाहिए। 95 से ऊपर का मतलब है कि आपके फेफड़े खूब ताज़ी हवा भर रहे हैं! `;
    }
    if (pulse) {
      text += `दिल की धड़कन प्रति मिनट ${pulse} है — यह आपके सीने में बजने वाला प्यारा सा ढोल है, जो दिन-रात मस्ती से धड़क रहा है। `;
    }
    if (temp) {
      text += `शरीर का तापमान ${temp} डिग्री है, बिल्कुल सही जैसे एक आरामदायक कंबल। `;
    }
    text += `आँखों की जाँच देखने के लिए नीचे स्क्रॉल करें, या आसान मतलब जानने के लिए नीचे के बटन छुएं।`;
    return text;
  }

  if (language === 'bn') {
    let text = `এবার দেখে নিই আপনার শরীরের ভেতরের ইঞ্জিনের খবর! `;
    if (sys && dia) {
      text += `প্রথমেই ব্লাড প্রেশার: ভাবুন যেন বাগানের পাইপে জল বইছে। শান্তভাবে জল বইলে পাইপ একদম ভালো থাকে। আপনার রক্তচাপ ${sys} বাই ${dia} এসেছে, `;
      if (sys <= 125 && dia <= 85) text += `যা একদম শান্ত ও স্বাভাবিক মাত্রায় রয়েছে। `;
      else text += `অর্থাৎ পাইপে চাপ কিছুটা বেশি। খাবারে কাঁচা লবণ একটু কমিয়ে শান্তিতে বিশ্রাম নিলে এটি শান্ত হয়ে যাবে। `;
    }
    if (spo2) {
      text += `রক্তে অক্সিজেনের মাত্রা ${spo2} শতাংশ — এর মানে হলো বিশুদ্ধ বাতাসের জোগান! ৯৫-এর বেশি থাকা মানে আপনার ফুসফুস পুরো শরীরে ভরপুর তাজা বাতাস পাঠাচ্ছে! `;
    }
    if (pulse) {
      text += `নাড়ির স্পন্দন মিনিটে ${pulse} বার — এটা আপনার বুকের ভেতরের শান্ত একটা ঢোলের তাল। `;
    }
    if (temp) {
      text += `শরীরের তাপমাত্রা ${temp} ডিগ্রি — একদম স্বাভাবিক ও আরামদায়ক। `;
    }
    text += `চোখের পরীক্ষার বিবরণ দেখতে নিচে যান, আর সহজে বুঝতে নিচের বোতাম চাপুন।`;
    return text;
  }

  // English
  let text = `Now let's check your body's rhythm and flow! `;
  if (sys && dia) {
    text += `First, blood pressure: think of water flowing gently through a garden hose. When water flows smoothly, the hose stays happy and healthy. Yours is ${sys} over ${dia}, `;
    if (sys <= 125 && dia <= 85) text += `which is in the calm, safe, healthy flow zone. `;
    else text += `meaning there is a little extra pressure in the hose. Cutting down on table salt and getting sound sleep will calm it right down. `;
  }
  if (spo2) {
    text += `Blood oxygen is ${spo2} percent — this is pure fresh morning air! Just like a car needs clean fuel, your cells need oxygen. 95 and above means every single cell is breathing happily! `;
  }
  if (pulse) {
    text += `Your pulse is ${pulse} beats per minute — that's the friendly little drum beating rhythmically in your chest. `;
  }
  if (temp) {
    text += `Body temperature is ${temp} degrees, perfectly cozy like a warm blanket. `;
  }
  text += `Scroll to review eyesight results, or tap any button below to hear what each reading means.`;
  return text;
}

/**
 * Report 5: Actionable Daily Habits & Full Report Download
 */
export function getReport5Speech(healthData, language = 'en') {
  const patient = healthData?.patient || {};
  const name = patient?.name ? patient.name.split(' ')[0] : (language === 'hi' ? 'दोस्त' : language === 'bn' ? 'বন্ধু' : 'Friend');

  if (language === 'hi') {
    return `सुनिए ${name}, यहाँ आपकी पूरी सेहत का निचोड़ और तीन सबसे आसान आदतें हैं! ` +
      `कोई कड़वी दवाई नहीं, बस तीन काम रोज़ कीजिए: पहला, रोज़ 2 से 3 लीटर साफ़ पानी पीजिए। दूसरा, रात को 7 घंटे की सुकून भरी नींद लीजिए। और तीसरा, रोज़ 20 मिनट के लिए ताज़ी हवा में टहलिए। ` +
      `स्क्रीन पर जो क्यूआर कोड दिख रहा है, उसे अपने फोन कैमरे से स्कैन कर लीजिए ताकि यह आसान रिपोर्ट आपके फोन पर हमेशा सुरक्षित रहे। आप इसे अपने परिवार और दोस्तों को भी दिखा सकते हैं। हमेशा स्वस्थ रहिए और मुस्कुराते रहिए!`;
  }

  if (language === 'bn') {
    return `শুনুন ${name}, এখানে আপনার সম্পূর্ণ পরীক্ষার সারসংক্ষেপ আর তিনটি সবচেয়ে সহজ দৈনন্দিন অভ্যাস রয়েছে! ` +
      `কোনো তেঁতো ওষুধ নয়, শুধু তিনটি সহজ কাজ: এক, দিনে আড়াই থেকে তিন লিটার জল খান। দুই, রাতে ৭ ঘণ্টা নিশ্চিন্তে ঘুমান। আর তিন, প্রতিদিন ২০ মিনিট খোলা বাতাসে হাঁটুন। ` +
      `স্ক্রিনের কিউআর কোডটি আপনার ফোনের ক্যামেরা দিয়ে স্ক্যান করে নিন, যাতে সম্পূর্ণ সহজ রিপোর্টটি আপনার ফোনেই থেকে যায়। ভালো থাকুন, সুস্থ থাকুন আর হাসিখুশি থাকুন!`;
  }

  return `Hey ${name}, here is your whole wellness summary and three simple daily habits! ` +
    `No complicated medicine, just three cheerful routines: drink 2 to 3 liters of fresh water, enjoy 7 hours of peaceful sleep, and take a 20-minute breezy walk every day. ` +
    `Scan the QR code on screen with your phone camera to keep this entire plain-language report right in your pocket. You can also share it with family. Stay healthy, vibrant, and keep smiling!`;
}
