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
    let text = `नमस्ते ${name}, आपकी सेहत की रिपोर्ट तैयार है। `;
    text += `आज आपका बॉडी स्कोर 100 में से ${score} आया है। `;
    if (score >= 80) {
      text += `बहुत ही शानदार! आपका शरीर एकदम फिट और एक्टिव है, जैसे एक बेहतरीन नई गाड़ी। `;
    } else if (score >= 60) {
      text += `आपका स्कोर अच्छा है। थोड़ा रोज़ टहलने और पानी पीने से यह और भी बढ़िया हो जाएगा। `;
    } else {
      text += `आपके शरीर को थोड़ा आराम और अच्छी डाइट की ज़रूरत है। घबराइए मत, इसे आसानी से सुधारा जा सकता है। `;
    }

    if (metabolicAge < age) {
      text += `खुशी की बात यह है कि आपकी अंदरूनी फिटनेस उम्र ${metabolicAge} साल है, जो आपकी असली उम्र से ${age - metabolicAge} साल छोटी है! `;
    } else if (metabolicAge > age) {
      text += `आपकी अंदरूनी फिटनेस उम्र ${metabolicAge} साल आई है, यानी शरीर को थोड़ी ज़्यादा कसरत की ज़रूरत है। `;
    }

    if (scanCount >= 2) {
      text += `यह आपकी ${scanCount}वीं जाँच है। पिछली बार से आपका ग्राफ बेहतर हो रहा है। `;
    } else {
      text += `यह आपका पहला चेकअप है। अगले हफ्ते फिर आकर अपनी प्रोग्रेस देखिए। `;
    }
    return text;
  }

  if (language === 'bn') {
    let text = `নমস্কার ${name}, আপনার স্বাস্থ্য রিপোর্ট তৈরি। `;
    text += `আজ আপনার বডি স্কোর ১০০-র মধ্যে ${score} এসেছে। `;
    if (score >= 80) {
      text += `অসাধারণ! আপনার শরীর খুবই ফিট এবং চাঙ্গা রয়েছে। `;
    } else if (score >= 60) {
      text += `আপনার স্কোর বেশ ভালো। নিয়মিত একটু হাঁটা আর পরিমিত জল খেলে এটা আরও চমৎকার হবে। `;
    } else {
      text += `শরীরে একটু যত্নের প্রয়োজন রয়েছে। নিয়মিত ঘুম আর পুষ্টিকর খাবার খেলে স্কোর দ্রুত বাড়বে। `;
    }

    if (metabolicAge < age) {
      text += `দারুণ বিষয় হলো, আপনার ভেতরের শারীরিক বয়স মাত্র ${metabolicAge} বছর, অর্থাৎ আপনার আসল বয়সের চেয়েও ${age - metabolicAge} বছর তরুণ! `;
    } else if (metabolicAge > age) {
      text += `শারীরিক ফিটনেস বয়স ${metabolicAge} বছর দেখাচ্ছে, অর্থাৎ নিয়মিত একটু ব্যায়াম করলে এটি কমে যাবে। `;
    }

    if (scanCount >= 2) {
      text += `এটি আপনার ${scanCount} নম্বর পরীক্ষা। আপনার উন্নতি স্পষ্ট হচ্ছে। `;
    } else {
      text += `এটি আপনার প্রথম চেকআপ। পরবর্তী পরিদর্শনে উন্নতি মেলাতে পারবেন। `;
    }
    return text;
  }

  // English fallback
  let text = `Hello ${name}, your health score is ready. `;
  text += `Your body score is ${score} out of 100. `;
  if (score >= 80) {
    text += `Excellent vitality! Your body is performing like a finely-tuned machine. `;
  } else if (score >= 60) {
    text += `Good healthy foundation. Regular walks and balanced hydration will push it even higher. `;
  } else {
    text += `Your body is asking for a little more rest and nutrition. Simple daily tweaks will boost this quickly. `;
  }

  if (metabolicAge < age) {
    text += `Best of all, your internal metabolic age is ${metabolicAge} years, which is ${age - metabolicAge} years younger than your actual age! `;
  } else if (metabolicAge > age) {
    text += `Your metabolic age is ${metabolicAge} years. Light daily activity will help bring it down. `;
  }

  if (scanCount >= 2) {
    text += `This is scan number ${scanCount}. Your longitudinal trend is building up nicely. `;
  } else {
    text += `This is your baseline scan. Visit again next week to compare your progress. `;
  }
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
    let text = `इस पेज पर आपके शरीर की बनावट है। `;
    if (weight && height) text += `आपका वज़न ${weight} किलो और लंबाई ${height} सेंटीमीटर है। `;
    if (bmi) {
      text += `आपका बीएमआई ${bmi} है, `;
      if (bmi < 18.5) text += `जो थोड़ा कम है। दाल, पनीर और पौष्टिक आहार लीजिए। `;
      else if (bmi <= 24.9) text += `जो एकदम सही और सामान्य संतुलन में है। `;
      else text += `जो थोड़ा अधिक है। रोज़ाना 20 मिनट की सैर से यह नियंत्रित रहेगा। `;
    }
    if (bodyFat) text += `शरीर में फैट ${bodyFat} प्रतिशत है। `;
    if (muscleMass) text += `मांसपेशियों की ताकत ${muscleMass} प्रतिशत है, जो आपके शरीर का असली इंजन है। `;
    text += `स्क्रीन पर देखकर समझें और आगे बढ़ने के लिए Next दबाइए।`;
    return text;
  }

  if (language === 'bn') {
    let text = `এই পাতায় আপনার শরীরের গঠন দেখা যাচ্ছে। `;
    if (weight && height) text += `আপনার ওজন ${weight} কেজি এবং উচ্চতা ${height} সেন্টিমিটার। `;
    if (bmi) {
      text += `আপনার বিএমআই ${bmi}। `;
      if (bmi < 18.5) text += `এটি কিছুটা কম, একটু পুষ্টিকর খাবার বেশি খাওয়া দরকার। `;
      else if (bmi <= 24.9) text += `এটি একদম স্বাভাবিক ও সুস্থ সীমার মধ্যে আছে। `;
      else text += `এটি কিছুটা বেশি, প্রতিদিন একটু হাঁটাহাঁটি করলে নিয়ন্ত্রণে থাকবে। `;
    }
    if (bodyFat) text += `শরীরের ফ্যাটের পরিমাণ ${bodyFat} শতাংশ। `;
    if (muscleMass) text += `মাংসপেশির শক্তি ${muscleMass} শতাংশ, যা শরীরের আসল শক্তি জোগায়। `;
    text += `স্ক্রিনে তথ্য দেখে পরবর্তী পাতায় যেতে Next চাপুন।`;
    return text;
  }

  // English
  let text = `Here is your body composition breakdown. `;
  if (weight && height) text += `You weigh ${weight} kg at a height of ${height} cm. `;
  if (bmi) {
    text += `Your BMI is ${bmi}, `;
    if (bmi < 18.5) text += `which is slightly underweight. Add wholesome proteins and nuts to your diet. `;
    else if (bmi <= 24.9) text += `which is in the optimal healthy zone. `;
    else text += `which indicates slight excess weight. Daily brisk walking will bring it back into balance. `;
  }
  if (bodyFat) text += `Body fat is ${bodyFat} percent. `;
  if (muscleMass) text += `Muscle mass is ${muscleMass} percent, which acts as your body's metabolic engine. `;
  text += `Scroll to review and tap Next to continue.`;
  return text;
}

/**
 * Report 3: Deep Metrics & Progress Insights
 */
export function getReport3Speech(healthData, language = 'en') {
  const vitals = healthData?.vitals || {};
  const scanCount = (Array.isArray(healthData?.history) ? healthData.history.length : 0) + 1;

  if (language === 'hi') {
    let text = `यहाँ आपकी हड्डियों की मज़बूती और प्रोटीन का स्तर है। `;
    text += `हड्डियाँ शरीर के खंभों की तरह होती हैं — दूध, धूप और दालें इन्हें मजबूत रखते हैं। `;
    text += `प्रोटीन आपके शरीर की मरम्मत करने वाला ईंधन है। `;
    if (scanCount >= 2) {
      text += `शानदार! आप लगातार अपने शरीर पर ध्यान दे रहे हैं। हर विज़िट के साथ आपका यह चार्ट और सटीक होता जाएगा। `;
    } else {
      text += `यह आपकी पहली विज़िट है। अगली बार आने पर यह ग्राफ दिखाएगा कि आपकी सेहत में क्या सुधार हुआ है। `;
    }
    return text;
  }

  if (language === 'bn') {
    let text = `এখানে আপনার হাড়ের ঘনত্ব ও প্রোটিনের মাত্রা দেখানো হয়েছে। `;
    text += `হাড় হলো শরীরের স্তম্ভের মতো — দুধ, ডাল এবং রোদের আলো এগুলোকে মজবুত রাখে। `;
    text += `প্রোটিন শরীরের ক্ষয়পূরণের জ্বালানি। `;
    if (scanCount >= 2) {
      text += `খুব ভালো! আপনার নিয়মিত পরিদর্শনে শরীর কীভাবে উন্নতি করছে তা এই গ্রাফে স্পষ্ট। `;
    } else {
      text += `পরের বার আসলে এই চার্টে আপনার স্বাস্থ্যের ইতিবাচক পরিবর্তন দেখতে পাবেন। `;
    }
    return text;
  }

  let text = `Here are your vital structural metrics. `;
  text += `Bone mass reflects your skeletal pillars — nutrition and sunshine keep them resilient. `;
  text += `Protein is your daily repair fuel for tissues and stamina. `;
  if (scanCount >= 2) {
    text += `Great job tracking your wellness! Your progress graph is now mapping your trajectory over time. `;
  } else {
    text += `On your next checkup, this graph will show exactly how your fat and muscle curves have shifted. `;
  }
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
    let text = `अब आपकी मुख्य जीवन-जाँच के नतीजे। `;
    if (sys && dia) {
      text += `आपका ब्लड प्रेशर ${sys} और ${dia} आया है। `;
      if (sys <= 125 && dia <= 85) text += `यह पानी के पाइप में सामान्य बहाव की तरह बिल्कुल नॉर्मल है। `;
      else text += `दबाव थोड़ा अधिक है। नमक कम करें, तनाव से बचें और अच्छी नींद लें। `;
    }
    if (spo2) {
      text += `खून में ऑक्सीजन ${spo2} प्रतिशत है, `;
      if (spo2 >= 95) text += `जो फेफड़ों की बेहतरीन कार्यप्रणाली दिखाता है। `;
      else text += `गहरी सांस लेने का अभ्यास करें। `;
    }
    if (pulse) text += `दिल की धड़कन प्रति मिनट ${pulse} है। `;
    if (temp) text += `शरीर का तापमान ${temp} डिग्री है। `;
    text += `आँखों की जाँच और आसान सुझाव देखने के लिए नीचे स्क्रॉल करें।`;
    return text;
  }

  if (language === 'bn') {
    let text = `এবার আপনার মূল স্বাস্থ্য পরীক্ষার ফলাফল। `;
    if (sys && dia) {
      text += `আপনার ব্লাড প্রেশার ${sys} বাই ${dia} এসেছে। `;
      if (sys <= 125 && dia <= 85) text += `এটি একদম স্বাভাবিক ও সুস্থ মাত্রায় রয়েছে। `;
      else text += `চাপ কিছুটা বেশি, খাবারে কাঁচা লবণ কমিয়ে শান্ত মনে বিশ্রাম নিন। `;
    }
    if (spo2) {
      text += `রক্তে অক্সিজেনের মাত্রা ${spo2} শতাংশ, `;
      if (spo2 >= 95) text += `যা ফুসফুসের চমৎকার কার্যক্ষমতা নির্দেশ করে। `;
      else text += `খোলা বাতাসে গভীর শ্বাস নেওয়ার অভ্যাস করুন। `;
    }
    if (pulse) text += `হৃদস্পন্দন প্রতি মিনিটে ${pulse} বার। `;
    if (temp) text += `শরীরের তাপমাত্রা ${temp} ডিগ্রি। `;
    text += `চোখের পরীক্ষার ফলাফল দেখতে নিচে স্ক্রল করুন।`;
    return text;
  }

  let text = `Now for your vital health readings. `;
  if (sys && dia) {
    text += `Your blood pressure is ${sys} over ${dia}. `;
    if (sys <= 125 && dia <= 85) text += `This is in the calm, healthy flow zone. `;
    else text += `Pressure is slightly elevated — like excess water in a hose. Limit table salt and rest well. `;
  }
  if (spo2) {
    text += `Blood oxygen is ${spo2} percent, `;
    if (spo2 >= 95) text += `indicating clean and efficient breathing. `;
    else text += `Take deep breathing pauses during work. `;
  }
  if (pulse) text += `Pulse rate is ${pulse} beats per minute. `;
  if (temp) text += `Body temperature is ${temp} degrees. `;
  text += `Scroll to review eyesight test details and tap Next.`;
  return text;
}

/**
 * Report 5: Actionable Daily Habits & Full Report Download
 */
export function getReport5Speech(healthData, language = 'en') {
  const patient = healthData?.patient || {};
  const name = patient?.name ? patient.name.split(' ')[0] : (language === 'hi' ? 'दोस्त' : language === 'bn' ? 'বন্ধু' : 'Friend');

  if (language === 'hi') {
    return `${name}, यहाँ आपकी पूरी जाँच का निचोड़ और अगले 7 दिनों का आसान प्लान है। ` +
      `रोज़ाना 2 से 3 लीटर पानी पीजिए, 7 घंटे की सुकून भरी नींद लीजिए और 20 मिनट पैदल चलिए। ` +
      `स्क्रीन पर दिख रहे क्यूआर कोड को अपने फोन कैमरे से स्कैन कीजिए ताकि यह पूरी रिपोर्ट आपके फोन पर सुरक्षित पहुँच जाए। ` +
      `आप चाहें तो इसे अपनी ईमेल पर भी मंगवा सकते हैं। स्वस्थ रहिए और मुस्कुराते रहिए!`;
  }

  if (language === 'bn') {
    return `${name}, এখানে আপনার সম্পূর্ণ পরীক্ষার সারসংক্ষেপ এবং আগামী ৭ দিনের সহজ রুটিন রয়েছে। ` +
      `প্রতিদিন অন্তত আড়াই লিটার জল খান, ৭ ঘণ্টা নিশ্চিন্তে ঘুমান এবং ২০ মিনিট হাঁটুন। ` +
      `স্ক্রিনের কিউআর কোডটি আপনার ফোনের ক্যামেরা দিয়ে স্ক্যান করুন, যাতে সম্পূর্ণ রিপোর্টটি ফোনে সংরক্ষণ করতে পারেন। ` +
      `ইমেলের মাধ্যমেও রিপোর্ট পাঠাতে পারেন। সুস্থ থাকুন এবং ভালো থাকুন!`;
  }

  return `${name}, here is your complete wellness summary and simple 7-day action plan. ` +
    `Focus on the essentials: 2 to 3 liters of water, 7 hours of uninterrupted sleep, and a 20-minute daily walk. ` +
    `Scan the QR code on screen with your phone camera to take this entire plain-language report home. ` +
    `You can also enter your email to receive a digital copy. Stay healthy and keep moving forward!`;
}
