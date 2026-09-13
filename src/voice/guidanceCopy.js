import { dict as measurement } from '../config/MeasurementsDict.js';

export const GUIDANCE = {
  language: {
    en: 'Tap English, Hindi, or Bengali on the screen. I will guide you in your chosen language.',
    hi: 'स्क्रीन पर English, Hindi या Bengali चुनिए। मैं आपकी चुनी हुई भाषा में मदद करूँगी।',
    bn: 'স্ক্রিনে English, Hindi বা Bengali বেছে নিন। আপনার বেছে নেওয়া ভাষায় আমি সাহায্য করব।',
  },
  terms: {
    en: 'Read the terms on screen. Tap I Agree and Continue if you accept them, or Disagree if you do not.',
    hi: 'स्क्रीन पर शर्तें पढ़िए। सहमत हों तो I Agree and Continue दबाइए, नहीं तो Disagree दबाइए।',
    bn: 'স্ক্রিনের শর্তগুলি পড়ুন। সম্মত হলে I Agree and Continue চাপুন, না হলে Disagree চাপুন।',
  },
  detailsName: {
    en: 'Tap the name box and type your name using the keyboard. When finished, tap Done or Hide Keyboard.',
    hi: 'नाम वाले बॉक्स को छूकर कीबोर्ड से अपना नाम लिखिए। पूरा होने पर Done या Hide Keyboard दबाइए।',
    bn: 'নামের ঘরে চাপ দিয়ে কিবোর্ডে নিজের নাম লিখুন। লেখা হলে Done বা Hide Keyboard চাপুন।',
  },
  detailsGender: {
    en: 'Your name is entered. Please select your gender on screen, and check that your age is correct.',
    hi: 'आपका नाम दर्ज हो गया है। अब स्क्रीन पर अपना जेंडर चुनिए और अपनी उम्र जाँच लीजिए।',
    bn: 'আপনার নাম লেখা হয়েছে। এবার স্ক্রিনে নিজের লিঙ্গ বেছে নিন এবং বয়স ঠিক আছে কি না দেখুন।',
  },
  detailsAge: {
    en: 'Check your age. Tap the plus or minus buttons, or tap the age to type it. Then tap Done or Hide Keyboard.',
    hi: 'अपनी उम्र जाँचिए। प्लस या माइनस दबाइए, या उम्र वाले बॉक्स में सही उम्र लिखिए। फिर Done या Hide Keyboard दबाइए।',
    bn: 'নিজের বয়স দেখুন। প্লাস বা মাইনাস চাপুন, অথবা বয়সের ঘরে সঠিক বয়স লিখুন। তারপর Done বা Hide Keyboard চাপুন।',
  },
  detailsReady: {
    en: 'Check your name, age, and gender. If they are correct, tap Proceed to choose your service.',
    hi: 'अपना नाम, उम्र और जेंडर जाँचिए। सब सही हो तो सेवा चुनने के लिए Proceed दबाइए।',
    bn: 'নিজের নাম, বয়স ও লিঙ্গ দেখে নিন। সব ঠিক থাকলে পরিষেবা বেছে নিতে Proceed চাপুন।',
  },
  detailsError: {
    en: 'Your details could not be saved. Check the message on screen, then tap Proceed to retry.',
    hi: 'आपकी जानकारी सेव नहीं हो पाई। स्क्रीन पर संदेश देखिए, फिर दोबारा कोशिश के लिए Proceed दबाइए।',
    bn: 'আপনার তথ্য সেভ হয়নি। স্ক্রিনের বার্তাটি দেখুন, তারপর আবার চেষ্টা করতে Proceed চাপুন।',
  },
  saving: {
    en: 'Please wait while your details are saved.',
    hi: 'आपकी जानकारी सेव हो रही है। कृपया थोड़ा इंतज़ार कीजिए।',
    bn: 'আপনার তথ্য সেভ হচ্ছে। একটু অপেক্ষা করুন।',
  },
  service: {
    en: 'Tap Health Checkup for measurements, or Medicine Dispensing to browse available kits.',
    hi: 'जाँच के लिए Health Checkup दबाइए। उपलब्ध किट देखने के लिए Medicine Dispensing दबाइए।',
    bn: 'পরীক্ষা করতে Health Checkup চাপুন। উপলব্ধ কিট দেখতে Medicine Dispensing চাপুন।',
  },
  medicine: {
    en: 'Scroll to see available kits. Tap a kit to view it, choose what you need, then open your cart to continue.',
    hi: 'उपलब्ध किट देखने के लिए स्क्रॉल कीजिए। किट पर दबाकर जानकारी देखिए, ज़रूरत की चीज़ चुनिए, फिर कार्ट खोलिए।',
    bn: 'উপলব্ধ কিট দেখতে স্ক্রল করুন। কিটে চাপ দিয়ে তথ্য দেখুন, প্রয়োজনীয় জিনিস বেছে নিয়ে কার্ট খুলুন।',
  },
  scale: {
    en: 'Stand on the scale with both feet on the black area. Tap Start Measurement, then stand still until it finishes.',
    hi: 'स्केल के काले हिस्से पर दोनों पैर रखिए। Start Measurement दबाइए और जाँच पूरी होने तक स्थिर खड़े रहिए।',
    bn: 'স্কেলের কালো অংশে দুই পা রাখুন। Start Measurement চাপুন এবং মাপা শেষ হওয়া পর্যন্ত স্থির থাকুন।',
  },
  measuring: measurement.body_composition_measuring,
  bloodPressure: measurement.bp_start,
  bloodPressureRunning: measurement.bp_measuring,
  oxygen: measurement.oxygen_start,
  temperature: measurement.temp_start,
  eyesight: measurement.eyesight_start,
  measurementDone: {
    en: 'The measurement is complete. Check the reading on screen, then tap Next or Continue when it is available.',
    hi: 'जाँच पूरी हो गई है। स्क्रीन पर रीडिंग देखिए। Next या Continue उपलब्ध हो तो दबाइए।',
    bn: 'মাপা শেষ হয়েছে। স্ক্রিনে রিডিং দেখুন। Next বা Continue বোতাম এলে চাপুন।',
  },
  measurementError: {
    en: 'Check the device connection and the message on screen. Use Refresh or the measurement button to try again when available.',
    hi: 'डिवाइस का कनेक्शन और स्क्रीन का संदेश जाँचिए। Refresh या मापने वाला बटन उपलब्ध हो तो दोबारा कोशिश कीजिए।',
    bn: 'যন্ত্রের সংযোগ এবং স্ক্রিনের বার্তা দেখুন। Refresh বা মাপার বোতাম পাওয়া গেলে আবার চেষ্টা করুন।',
  },
  report: {
    en: 'Your results are on screen. Scroll to read them, then use the Next or Continue button to move on.',
    hi: 'आपके नतीजे स्क्रीन पर हैं। पढ़ने के लिए स्क्रॉल कीजिए, फिर आगे जाने के लिए Next या Continue दबाइए।',
    bn: 'আপনার ফলাফল স্ক্রিনে আছে। পড়তে স্ক্রল করুন, তারপর এগিয়ে যেতে Next বা Continue চাপুন।',
  },
  reportDelivery: {
    en: 'Scroll to see your results and report options. When the report QR is ready, scan it with your phone to open the report and email options.',
    hi: 'नतीजे और रिपोर्ट के विकल्प देखने के लिए स्क्रॉल कीजिए। रिपोर्ट का QR तैयार होने पर फोन से स्कैन करके रिपोर्ट और ईमेल के विकल्प खोलिए।',
    bn: 'ফলাফল ও রিপোর্টের বিকল্প দেখতে স্ক্রল করুন। রিপোর্টের QR তৈরি হলে ফোনে স্ক্যান করে রিপোর্ট ও ইমেলের বিকল্প খুলুন।',
  },
  checkout: {
    en: 'Review your selected items and the total on screen. Use the payment button when you are ready to continue.',
    hi: 'चुनी हुई चीज़ें और कुल रकम स्क्रीन पर जाँचिए। तैयार होने पर पेमेंट वाला बटन दबाइए।',
    bn: 'বেছে নেওয়া জিনিস ও মোট দাম স্ক্রিনে দেখুন। প্রস্তুত হলে পেমেন্টের বোতাম চাপুন।',
  },
  collection: {
    en: 'Follow the status on screen. If you ordered a kit, collect it once dispensing finishes. Use the receipt options when they are ready.',
    hi: 'स्क्रीन पर स्थिति देखिए। किट मँगाई है तो निकलने के बाद उठा लीजिए। रसीद के विकल्प तैयार होने पर इस्तेमाल कीजिए।',
    bn: 'স্ক্রিনের অবস্থা দেখুন। কিট অর্ডার করলে বেরিয়ে আসার পর সংগ্রহ করুন। রসিদের বিকল্প তৈরি হলে ব্যবহার করুন।',
  },
  feedback: {
    en: 'Tap a star rating, then use the submit button to share your feedback.',
    hi: 'स्टार पर दबाकर रेटिंग चुनिए, फिर अपना फ़ीडबैक भेजने के लिए सबमिट दबाइए।',
    bn: 'তারায় চাপ দিয়ে রেটিং বেছে নিন, তারপর মতামত পাঠাতে সাবমিট চাপুন।',
  },
  team: {
    en: 'Scroll to read about the team. Use Back to return to the kiosk.',
    hi: 'टीम के बारे में पढ़ने के लिए स्क्रॉल कीजिए। कियोस्क पर लौटने के लिए Back दबाइए।',
    bn: 'টিমের সম্পর্কে পড়তে স্ক্রল করুন। কিয়স্কে ফিরতে Back চাপুন।',
  },
};

export const ROUTE_GUIDANCE = {
  '/': 'language', '/choose-language': 'language', '/customer-details': 'detailsName',
  '/two-options': 'service', '/medicine-dispensing': 'medicine', '/body-composition': 'scale',
  '/health-checkup': 'bloodPressure', '/oxygen-pulse': 'oxygen', '/body-temperature': 'temperature',
  '/eyesight': 'eyesight', '/report-1': 'report', '/report-2': 'report', '/report-3': 'report',
  '/report-4': 'report', '/report-5': 'reportDelivery', '/wellness-recommendations': 'report',
  '/checkout': 'checkout', '/order-success': 'collection', '/feedback': 'feedback', '/team': 'team',
};

export const guidanceText = (key, language = 'en') => GUIDANCE[key]?.[language] || GUIDANCE[key]?.en || '';
export const isGuidedRoute = path => path === '/payment' || Object.hasOwn(ROUTE_GUIDANCE, path);
