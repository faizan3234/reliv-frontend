import asyncio
import os
import edge_tts

VOICES = {
    'en': 'en-IN-NeerjaNeural',
    'hi': 'hi-IN-SwaraNeural',
    'bn': 'bn-IN-TanishaaNeural'
}

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'audio', 'reports')
os.makedirs(OUT_DIR, exist_ok=True)

userName = "Faizan"

SCRIPTS = {
    # Report 1 - Score 85 (Very Good)
    'report1_en_85': (
        f"{userName}... Your health score is 85 out of 100. That is a very good result! "
        "A higher score means more of today's checked values are closer to their preferred ranges. "
        "Most of your readings are looking good, with just a few small areas that can still improve. "
        "The reference score for people around your age is about 72, and your score is 85, which is well above that reference. "
        "This score is an overall summary, not a medical diagnosis. "
        "You do not need to read the screen. I will explain each part of your report to you. "
        "Next, let's find out which areas of your body are strongest, and which ones need attention.",
        'en'
    ),
    'report1_hi_85': (
        f"{userName}... आपका हेल्थ स्कोर 100 में से 85 है। बहुत अच्छा! "
        "आपका हेल्थ स्कोर 100 में से मापा जाता है। एक अच्छे स्कोर का मतलब है कि आज की ज्यादातर जांचें अपनी सही सीमा के बहुत करीब हैं। "
        "आपकी ज्यादातर रीडिंग्स बहुत अच्छी आई हैं, और बस एक-दो जगहों पर थोड़ा सुधार हो सकता है। "
        "आपकी उम्र के लोगों का सामान्य संदर्भ स्कोर लगभग 72 होता है, और आपका स्कोर 85 उससे काफी ऊपर है। "
        "यह स्कोर केवल आज की जांच का एक सार है, कोई डॉक्टरी बीमारी नहीं। "
        "आपको स्क्रीन देखने की बिल्कुल जरूरत नहीं है। मैं आपकी रिपोर्ट का हर जरूरी हिस्सा आपको आसान शब्दों में समझाऊंगी। "
        "अगली स्क्रीन पर चलिए, और देखते हैं कि आपके शरीर का कौन सा हिस्सा सबसे मजबूत है और कहां थोड़ा ध्यान देना है।",
        'hi'
    ),
    'report1_bn_85': (
        f"{userName}... আপনার হেলথ স্কোর ১০০-এর মধ্যে ৮৫। খুব ভালো রেজাল্ট! "
        "আপনার হেলথ স্কোর ১০০-র মধ্যে হিসাব করা হয়। একটি ভালো স্কোরের অর্থ হলো আজকের বেশিরভাগ পরিমাপ স্বাভাবিক সীমার খুব কাছাকাছি রয়েছে। "
        "আপনার বেশিরভাগ রিডিং খুবই ভালো এসেছে, আর সামান্য কিছু জায়গায় আরও একটু উন্নতি করা যেতে পারে। "
        "আপনার বয়সের মানুষদের সাধারণ রেফারেন্স স্কোর প্রায় ৭২, আর আপনার স্কোর ৮৫ তার চেয়ে বেশ উপরে। "
        "এই স্কোরটি শুধুমাত্র আজকের একটি সংক্ষিপ্ত চিত্র, কোনো রোগ নির্ণয় নয়। "
        "আপনাকে স্ক্রিনের দিকে তাকিয়ে পড়ার দরকার নেই। আমি আপনার রিপোর্টের প্রতিটি গুরুত্বপূর্ণ অংশ সহজ ভাষায় বুঝিয়ে দিচ্ছি। "
        "এবার চলুন দেখা যাক আপনার শরীরের কোন দিকটি সবচেয়ে শক্তিশালী আর কোন দিকটায় একটু যত্ন নেওয়া দরকার।",
        'bn'
    ),

    # Report 2 - Body Composition & Muscle Power
    'report2_en': (
        f"{userName}, you do not need to look at the screen. I will explain your body composition results to you in plain words. "
        "Your weight is 70 kilograms and your height is 175 centimeters. "
        "Your standout strength today is your body water, at about 58 percent! "
        "Your body has plenty of healthy hydration, which cushions your joints and keeps your energy steady throughout the day. "
        "Your muscle percentage is slightly lower than preferred for your height. "
        "Muscles are the true power engine of your body, helping you walk easily, climb stairs, and carry everyday things. "
        "To build stronger muscles, add simple protein-rich foods to your daily meals, like yellow moong dal, fresh paneer, sprouts, roasted chana, or boiled eggs, and take a 20-minute brisk walk every day. "
        "Your body fat is slightly above the ideal target. "
        "Reducing fried snacks and sweet chai, and enjoying a 30-minute walk daily will gently bring it back into a healthy balance. "
        "This is scan 1 of 7, which establishes your starting baseline. Progress comparisons will unlock on your next scan. "
        "Tap Continue to go to your vital signs, or tap Back to return to your health score.",
        'en'
    ),
    'report2_hi': (
        f"{userName}, आपको स्क्रीन देखने की बिल्कुल जरूरत नहीं है। मैं आपके शरीर की बनावट का पूरा हिसाब बिल्कुल आसान शब्दों में बता रही हूं। "
        "आपका वजन 70 किलो और लंबाई 175 सेंटीमीटर है। "
        "आज आपके शरीर का सबसे मजबूत हिस्सा पानी का संतुलन है, लगभग 58 प्रतिशत! "
        "आपके शरीर में पानी की मात्रा बहुत अच्छी है, जो आपके जोड़ों को स्वस्थ और लचीला रखती है और दिनभर ताजगी बनाए रखती है। "
        "आपकी मांसपेशियों की ताकत आपकी लंबाई के हिसाब से थोड़ी कम आई है। "
        "मांसपेशियां ही शरीर का असली इंजन हैं, जो आपको चलने, सीढ़ियां चढ़ने और सामान उठाने की ताकत देती हैं। "
        "इन्हें मजबूत करने के लिए खाने में मूंग की दाल, पनीर, अंकुरित अनाज, भुना चना या उबले अंडे शामिल करें, और रोजाना 20 मिनट तेज चाल से टहलें। "
        "शरीर में चर्बी यानी फैट थोड़ा सा अधिक है। "
        "तली-भुनी चीजें और मीठी चाय थोड़ी कम करें, और रोजाना आधा घंटा घूमें, जिससे यह आसानी से सामान्य हो जाएगी। "
        "यह कुल सात में से आपका पहला स्कैन है, जिससे आपकी शुरुआत तय हुई है। अगले स्कैन में पिछली बार से तुलना साफ दिखाई देगी। "
        "आगे ब्लड प्रेशर और जरूरी जांचें देखने के लिए कंटिन्यू दबाएं, या पीछे जाने के लिए बैक दबाएं।",
        'hi'
    ),
    'report2_bn': (
        f"{userName}, আপনাকে স্ক্রিনের দিকে তাকাতে হবে না। আমি আপনার শরীরের গঠন ও উপাদানের হিসাব সহজ ভাষায় বুঝিয়ে দিচ্ছি। "
        "আপনার ওজন ৭০ কেজি এবং উচ্চতা ১৭৫ সেন্টিমিটার। "
        "আজ আপনার শরীরের সবচেয়ে শক্তিশালী অংশ হলো জলের মাত্রা, প্রায় ৫৮ শতাংশ! "
        "শরীরে জলের পরিমাণ দারুণ আছে, যা আপনার হাড়ের জোড়গুলোকে সচল রাখে এবং সারাদিন শরীরে সতেজতা বজায় রাখে। "
        "আপনার উচ্চতার তুলনায় মাংসপেশির শক্তি কিছুটা কম রয়েছে। "
        "পেশীই হলো শরীরের মূল ইঞ্জিন, যা হাঁটাচলা করতে, সিঁড়ি দিয়ে উঠতে এবং প্রতিদিনের কাজের শক্তি যোগায়। "
        "পেশী শক্তপোক্ত করতে রোজকার খাবারে মুগ ডাল, ছানা বা পনির, অঙ্কুরিত ছোলা বা সেদ্ধ ডিম যোগ করুন, আর প্রতিদিন অন্তত ২০ মিনিট একটু জোরে হাঁটুন। "
        "আপনার শরীরের ফ্যাটের মাত্রা সামান্য বেশি আছে। "
        "ভাজাভুজি ও মিষ্টি চা একটু কমিয়ে প্রতিদিন আধঘণ্টা করে হাঁটলে এটি সুন্দরভাবে স্বাভাবিক হয়ে যাবে। "
        "এটি আপনার প্রথম স্ক্যান, যা শুরুর পরিমাপ নির্ধারণ করলো। পরের স্ক্যানে আগের তুলনায় কতটা উন্নতি হলো তা দেখা যাবে। "
        "পরের স্ক্রিনে ব্লাড প্রেশার ও অন্যান্য মাপ দেখতে কন্টিনিউ চাপুন, অথবা আগের স্ক্রিনে ফিরতে ব্যাক চাপুন।",
        'bn'
    ),

    # Report 3 - Core Vitals (BP, Pulse, Oxygen, Bones)
    'report3_en': (
        "Now we examine your core vital signs and inner reserves. You can listen comfortably while I explain each reading. "
        "Your blood pressure is 124 over 82. "
        "This is in a calm, safe, and healthy range, meaning blood is flowing smoothly without unnecessary strain on your heart. "
        "Your blood oxygen is 98 percent. Anything 95 and above means your lungs are delivering plenty of clean, fresh oxygen to every organ in your body. "
        "Your resting pulse is 74 beats per minute, beating with a steady, peaceful rhythm. "
        "Your bone mass is 3.2 kilograms. "
        "Gentle morning sunshine for natural Vitamin D, along with milk, curd, or sesame seeds, will keep your bones solid and strong. "
        "Tap Continue to review your multi-scan progress graph, or tap Back to revisit body composition.",
        'en'
    ),
    'report3_hi': (
        "अब हम आपके दिल की धड़कन, ब्लड प्रेशर और शरीर के जरूरी संकेत देखते हैं। आप आराम से सुनिए, मैं सब आसान शब्दों में समझा रही हूं। "
        "आपका ब्लड प्रेशर 124 और 82 है। "
        "यह बिल्कुल सामान्य और शांत सीमा में है, जिसका मतलब है कि खून बिना किसी दबाव के आसानी से बह रहा है। "
        "आपके खून में ऑक्सीजन 98 प्रतिशत है। 95 से ऊपर का मतलब है कि आपके फेफड़े खूब ताजी हवा पूरे शरीर में पहुंचा रहे हैं। "
        "आपके दिल की धड़कन 74 प्रति मिनट है, जो एक बिल्कुल शांत और स्थिर ताल में चल रही है। "
        "आपकी हड्डियों का खनिज वजन 3.2 किलोग्राम है। "
        "सुबह की मीठी धूप और दूध, दही या दालें आपकी हड्डियों को हमेशा मजबूत खंभे की तरह बनाए रखेंगी। "
        "अगली स्क्रीन पर प्रोग्रेस ग्राफ देखने के लिए कंटिन्यू दबाएं, या पीछे जाने के लिए बैक दबाएं।",
        'hi'
    ),
    'report3_bn': (
        "এবার আমরা আপনার রক্তচাপ, হৃদস্পন্দন ও শরীরের মূল লক্ষণগুলো দেখবো। আপনি আরাম করে শুনুন, আমি সব বুঝিয়ে বলছি। "
        "আপনার রক্তচাপ বা ব্লাড প্রেশার ১২৪ বাই ৮২। "
        "এটি একটি শান্ত ও নিরাপদ সীমার মধ্যে রয়েছে, অর্থাৎ আপনার হার্টের ওপর কোনো বাড়তি চাপ ছাড়াই রক্ত চলাচল স্বাভাবিক রয়েছে। "
        "রক্তে অক্সিজেনের মাত্রা ৯৮ শতাংশ। ৯৫-এর বেশি থাকার অর্থ হলো আপনার ফুসফুস পর্যাপ্ত সতেজ হাওয়া শরীরের প্রতিটি অঙ্গে পৌঁছে দিচ্ছে। "
        "আপনার নাড়ির গতি মিনিটে ৭৪ বার, যা একটি সুন্দর ও শান্ত ছন্দে চলছে। "
        "আপনার হাড়ের ওজন ৩.২ কিলোগ্রাম। "
        "সকালের মিষ্টি রোদ এবং দুধ, দই বা তিল আপনার হাড়ের কাঠামোকে মজবুত ও দৃঢ় রাখবে। "
        "পরের স্ক্রিনে বহু-স্ক্যানের প্রোগ্রেস গ্রাফ দেখতে কন্টিনিউ চাপুন, অথবা আগের স্ক্রিনে ফিরতে ব্যাক চাপুন।",
        'bn'
    ),

    # Report 4 - Longitudinal Scan Trends
    'report4_en': (
        "This is your progress dashboard. If you cannot see the graph on the screen, don't worry, I will tell you exactly what your visit history shows. "
        "This is visit 1 of 7. Today establishes your starting baseline. A single scan captures where you are right now. "
        "When you return for your second scan, your visit-to-visit progress graph will unlock, showing how your body is changing. "
        "Tap Continue to view your full summary, eyesight check, and take-home QR code, or tap Back to return to vitals.",
        'en'
    ),
    'report4_hi': (
        "यह आपका प्रोग्रेस डैशबोर्ड है। अगर आप स्क्रीन पर ग्राफ नहीं देख पा रहे हैं, तो चिंता मत कीजिए, मैं बोलकर बताती हूं कि आपकी जांचें क्या दिखा रही हैं। "
        "यह कुल 7 में से आपकी पहली जांच है। आज आपका शुरुआती आधार बना है। एक स्कैन यह बताता है कि आज आपकी सेहत कहां है। "
        "जब आप दूसरे स्कैन के लिए दोबारा आएंगे, तो दोनों बार की तुलना और ग्राफ अपने आप खुल जाएंगे। "
        "अगली स्क्रीन पर अपनी पूरी रिपोर्ट का सारांश, आंखों की जांच और रिपोर्ट ले जाने वाला क्यूआर कोड देखने के लिए कंटिन्यू दबाएं, या पीछे जाने के लिए बैक दबाएं।",
        'hi'
    ),
    'report4_bn': (
        "এটি আপনার প্রোগ্রেস ড্যাশবোর্ড। স্ক্রিনে গ্রাফ দেখতে না পেলেও কোনো চিন্তা নেই, আমি মুখে বুঝিয়ে দিচ্ছি আপনার ভিজিটের অগ্রগতি কী বলছে। "
        "এটি সাতটি স্ক্যানের মধ্যে আপনার প্রথম ভিজিট। আজকের স্ক্যানে আপনার শুরুর ভিত্তি তৈরি হলো। একটি স্ক্যান দেখায় যে আজ আপনার স্বাস্থ্য কোথায় রয়েছে। "
        "আপনি যখন দ্বিতীয় স্ক্যানের জন্য আবার আসবেন, তখন দুই ভিজিটের তুলনা ও গ্রাফ খুলে যাবে, যার ফলে শরীরের পরিবর্তনগুলো স্পষ্ট বোঝা যাবে। "
        "পরবর্তী স্ক্রিনে সম্পূর্ণ সারাংশ, চোখের পরীক্ষার ফলাফল এবং বাড়ি নিয়ে যাওয়ার কিউআর কোড দেখতে কন্টিনিউ চাপুন, অথবা আগের স্ক্রিনে ফিরতে ব্যাক চাপুন।",
        'bn'
    ),

    # Report 5 - Final Action Plan & QR Take-Home
    'report5_en': (
        f"{userName}, here is the final summary of your entire health checkup. "
        "Overall, your vital signs and blood pressure are calm and healthy, and your body hydration provides solid daily stamina. "
        "Your main opportunity for improvement is building stronger muscle and keeping body fat in check through simple, nutritious home meals and daily brisk walking. "
        "Your eyesight screening is also recorded on this screen. If you ever feel eye strain or blurred vision, having your eyes checked by an eye specialist is always a good idea. "
        "To take this complete digital report home with you, you or someone with you can simply point a smartphone camera at the square QR code on the screen. "
        "It will open your private digital report instantly on your phone without downloading any app. "
        "You can tap Return Home whenever you are ready, or tap Back to review earlier pages. "
        "Thank you for taking care of your health with Reliv today!",
        'en'
    ),
    'report5_hi': (
        f"{userName}, यह आपके पूरे हेल्थ चेकअप का अंतिम सारांश है। "
        "कुल मिलाकर, आपके शरीर के मुख्य संकेत और ब्लड प्रेशर बिल्कुल शांत और स्वस्थ हैं, और शरीर में पानी की मात्रा आपको दिनभर अच्छी स्फूर्ति देती है। "
        "आगे सुधार के लिए सबसे जरूरी कदम है कि पौष्टिक घरेलू खाने और रोजाना की सैर से मांसपेशियों को मजबूत बनाएं और फैट को नियंत्रण में रखें। "
        "आपकी आंखों की जांच का नतीजा भी यहां दर्ज है। अगर आंखों में भारीपन या धुंधलापन लगे, तो आंखों के डॉक्टर से जांच जरूर कराएं। "
        "इस पूरी डिजिटल रिपोर्ट को अपने फोन पर घर ले जाने के लिए, आप या आपका कोई साथी अपने स्मार्टफोन का कैमरा स्क्रीन पर बने चौकोर क्यूआर कोड के सामने करें। "
        "यह बिना कोई ऐप डाउनलोड किए तुरंत आपके फोन पर खुल जाएगी। "
        "जब आप तैयार हों, रिटर्न होम दबा सकते हैं, या पुरानी रिपोर्ट देखने के लिए बैक दबा सकते हैं। "
        "आज रिलिव के साथ अपनी सेहत का ध्यान रखने के लिए बहुत-बहुत धन्यवाद!",
        'hi'
    ),
    'report5_bn': (
        f"{userName}, এটি আপনার সম্পূর্ণ হেলথ চেকআপের চূড়ান্ত সারাংশ। "
        "সামগ্রিকভাবে, আপনার রক্তচাপ ও মূল লক্ষণগুলো শান্ত ও স্বাস্থ্যকর অবস্থায় রয়েছে, এবং শরীরে জলের পর্যাপ্ত মাত্রা আপনাকে সারাদিনের শক্তি জোগাচ্ছে। "
        "উন্নতির জন্য আপনার প্রধান সুযোগ হলো সাধারণ পুষ্টিকর ঘরের খাবার ও নিয়মিত হাঁটার মাধ্যমে পেশীর শক্তি বাড়ানো এবং ফ্যাট নিয়ন্ত্রণে রাখা। "
        "এই স্ক্রিনে আপনার চোখের পরীক্ষার ফলাফলও নথিভুক্ত রয়েছে। চোখে ক্লান্তি বা ঝাপসা লাগলে চোখের ডাক্তার দেখানো সবসময়ই ভালো। "
        "এই সম্পূর্ণ ডিজিটাল রিপোর্টটি নিজের ফোনে বাড়ি নিয়ে যেতে, আপনি বা আপনার সাথে থাকা কেউ স্মার্টফোনের ক্যামেরাটি স্ক্রিনের চারকোণা কিউআর কোডের সামনে ধরুন। "
        "কোনো অ্যাপ ডাউনলোড করা ছাড়াই এটি সরাসরি আপনার ফোনে খুলে যাবে। "
        "আপনার দেখা শেষ হলে রিটার্ন হোম চাপতে পারেন, অথবা পেছনের পাতা দেখতে ব্যাক চাপুন। "
        "আজ রিলিভের সাথে নিজের স্বাস্থ্যের যত্ন নেওয়ার জন্য আপনাকে অনেক ধন্যবাদ!",
        'bn'
    ),
}

async def generate():
    print(f"Generating {len(SCRIPTS)} perfected report audio files with pristine native pronunciation...")
    for key, (text, lang) in SCRIPTS.items():
        voice = VOICES[lang]
        dest = os.path.join(OUT_DIR, f"{key}.mp3")
        print(f">> Generating {key} ({lang}) with {voice}")
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(dest)
    print(">> All perfected report audios generated successfully!")

if __name__ == "__main__":
    asyncio.run(generate())
