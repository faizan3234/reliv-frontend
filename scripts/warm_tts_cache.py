import os
import hashlib
import asyncio
import edge_tts

VOICES = {
    'en': 'en-IN-NeerjaNeural',
    'hi': 'hi-IN-SwaraNeural',
    'bn': 'bn-IN-TanishaaNeural'
}

CACHE_DIR = r"c:\Users\khanf\Downloads\backend-main\data\tts_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

# Common Texts to warm into cache
ENTRIES = [
    # Report 1
    ("Faizan... Your health score is 85 out of 100. That is a very good result! A higher score means more of today's checked values are closer to their preferred ranges. Most of your readings are looking good, with just a few small areas that can still improve. The reference score for people around your age is about 72, and your score is 85, which is well above that reference. This score is an overall summary, not a medical diagnosis. You do not need to read the screen. I will explain each part of your report to you. Next, let's find out which areas of your body are strongest, and which ones need attention.", 'en'),
    ("Faizan... आपका हेल्थ स्कोर 100 में से 85 है। बहुत अच्छा! आपका हेल्थ स्कोर 100 में से मापा जाता है। एक अच्छे स्कोर का मतलब है कि आज की ज्यादातर जांचें अपनी सही सीमा के बहुत करीब हैं। आपकी ज्यादातर रीडिंग्स बहुत अच्छी आई हैं, और बस एक-दो जगहों पर थोड़ा सुधार हो सकता है। आपकी उम्र के लोगों का सामान्य संदर्भ स्कोर लगभग 72 होता है, और आपका स्कोर 85 उससे काफी ऊपर है। यह स्कोर केवल एक सामान्य सारांश है, कोई डॉक्टरी बीमारी नहीं। आपको स्क्रीन देखने की बिल्कुल जरूरत नहीं है। मैं आपकी रिपोर्ट का हर जरूरी हिस्सा आपको आसान शब्दों में समझाऊंगी। अगली स्क्रीन पर चलिए, और देखते हैं कि आपके शरीर का कौन सा हिस्सा सबसे मजबूत है और कहां थोड़ा ध्यान देना है।", 'hi'),
    ("Faizan... আপনার হেলথ স্কোর ১০০-এর মধ্যে ৮৫। খুব ভালো রেজাল্ট! আপনার হেলথ স্কোর ১০০-র মধ্যে হিসাব করা হয়। একটি ভালো স্কোরের অর্থ হলো আজকের বেশিরভাগ পরিমাপ স্বাভাবিক সীমার খুব কাছাকাছি রয়েছে। আপনার বেশিরভাগ রিডিং খুবই ভালো এসেছে, আর সামান্য কিছু জায়গায় আরও একটু উন্নতি করা যেতে পারে। আপনার বয়সের মানুষদের সাধারণ রেফারেন্স স্কোর প্রায় ৭২, আর আপনার স্কোর ৮৫ তার চেয়ে বেশ উপরে। এই স্কোরটি শুধুমাত্র একটি সাধারণ সংক্ষিপ্ত চিত্র, কোনো রোগ নির্ণয় নয়। আপনাকে স্ক্রিনের দিকে তাকিয়ে পড়ার দরকার নেই। আমি আপনার রিপোর্টের প্রতিটি গুরুত্বপূর্ণ অংশ সহজ ভাষায় বুঝিয়ে দিচ্ছি। এবার চলুন দেখা যাক আপনার শরীরের কোন দিকটি সবচেয়ে শক্তিশালী আর কোন দিকটায় একটু যত্ন নেওয়া দরকার।", 'bn'),

    # Report 2
    ("Faizan, you do not need to look at the screen. I will explain your body composition results in plain words. According to your height of 175 cm, your standard healthy weight is 68 kg. Today you weigh 65 kg. That means you have to gain about 3 kg of muscle to reach your ideal weight. Today your standout strength is your body hydration, at about 81.6 percent! This cushions your joints and keeps your daily energy steady. Your muscle mass is 36.4 kg, which is slightly lower than preferred for your height. Muscles are the true power engine of your body. To build stronger muscles, add protein-rich foods to your daily meals, like yellow moong dal, fresh paneer, sprouts, roasted chana, and boiled eggs, and take a 20-minute brisk walk daily. This is scan 1 of 7, which establishes your starting baseline. Progress comparisons will unlock on your next scan. Tap Continue to go to your vital signs, or tap Back to return to your health score.", 'en'),
    ("Faizan, आपको स्क्रीन देखने की बिल्कुल जरूरत नहीं है। मैं आपके शरीर की बनावट का पूरा हिसाब आसान शब्दों में बता रही हूं। आपकी 175 सेंटीमीटर लंबाई के अनुसार, आपका मानक स्वस्थ वज़न 68 किलो होना चाहिए, और आज आपका वज़न 65 किलो है। यानी सही और आदर्श वज़न तक पहुँचने के लिए आपको लगभग 3 किलो मांसपेशियां बढ़ाने की ज़रूरत है। आज आपका सबसे मजबूत हिस्सा शरीर का पानी है, लगभग 81.6 प्रतिशत! यह आपके जोड़ों को चिकना और ऊर्जा को ताज़ा रखता है। आपकी मांसपेशियों का वज़न 36.4 किलो है, जो आपकी लंबाई के हिसाब से थोड़ा कम है। मांसपेशियां ही शरीर का असली इंजन हैं। इन्हें मज़बूत करने के लिए खाने में मूंग की दाल, पनीर, अंकुरित अनाज, भुना चना और उबले अंडे शामिल करें, और रोज़ाना 20 मिनट हल्का व्यायाम करें। यह आपका पहला स्कैन है, जिससे आपकी शुरुआत तय हुई है। अगले स्कैन में पिछली बार से तुलना साफ दिखाई देगी। आगे ब्लड प्रेशर और जरूरी जांचें देखने के लिए कंटिन्यू दबाएं, या पीछे जाने के लिए बैक दबाएं।", 'hi'),
    ("Faizan, আপনাকে স্ক্রিনের দিকে তাকাতে হবে না। আমি আপনার শরীরের গঠন ও উপাদানের হিসাব সহজ ভাষায় বুঝিয়ে দিচ্ছি। আপনার ১৭৫ সেন্টিমিটার উচ্চতা অনুযায়ী আপনার আদর্শ মানक ওজন হওয়া উচিত ৬৮ কেজি, আর আজ আপনার ওজন ৬৫ কেজি। অর্থাৎ আদর্শ ওজনে পৌঁছানোর জন্য আপনাকে প্রায় ৩ কেজি ওজন বা পেশীর শক্তি বাড়াতে হবে। আজ আপনার শরীরের সবচেয়ে শক্তিশালী অংশ হলো জলের মাত্রা, প্রায় ৮১.৬ শতাংশ! এটি হাড়ের জোড়গুলোকে সচল রাখে এবং সারাদিন সতেজতা দেয়। আপনার পেশীর ওজন ৩৬.৪ কেজি, যা আপনার উচ্চতার তুলনায় কিছুটা কম। পেশীই হলো শরীরের মূল চালিকাশক্তি। পেশী শক্তপোক্ত করতে রোজকার খাবারে মুগ ডাল, ছানা, ডিম, অঙ্কুরিত ছোলা যোগ করুন এবং প্রতিদিন ২০ মিনিট একটু জোরে হাঁটুন। এটি আপনার প্রথম স্ক্যান, যা শুরুর পরিমাপ নির্ধারণ করলো। পরের স্ক্যানে আগের তুলনায় কতটা উন্নতি হলো তা দেখা যাবে। পরের স্ক্রিনে ব্লাড প্রেশার ও অন্যান্য মাপ দেখতে কন্টিনিউ চাপুন, অথবা আগের স্ক্রিনে ফিরতে ব্যাক চাপুন।", 'bn'),

    # Standard Weight Tap
    ("Standard weight is the ideal, balanced weight for your height where your heart, joints, and organs work with maximum ease and zero strain. According to your height of 175 cm, your standard healthy weight is 68 kg. Today you weigh 65 kg, so gaining 3 kg of healthy muscle mass will bring you to ideal physical strength.", 'en'),
    ("मानक वज़न यानी आपकी लंबाई के हिसाब से शरीर का सबसे सही और आदर्श वज़न, जिस पर दिल, घुटनों और पूरे शरीर पर कोई फालतू दबाव नहीं पड़ता। आपकी 175 सेंटीमीटर लंबाई के अनुसार आपका मानक वज़न 68 किलो होना चाहिए। आज आपका वज़न 65 किलो है, यानी 3 किलो स्वस्थ वज़न या मांसपेशियां बढ़ाकर आप बिल्कुल सही और मजबूत स्थिति में आ जाएंगे।", 'hi'),
    ("আদর্শ মানক ওজন হলো আপনার উচ্চতার অনুপাতে শরীরের সবচেয়ে স্বাস্থ্যকর ওজন, যাতে হার্ট ও হাড়ের ওপর কোনো বাড়তি চাপ পড়ে না। আপনার ১৭৫ সেমি উচ্চতায় আদর্শ মানক ওজন ৬৮ কেজি। আজ আপনার ওজন ৬৫ কেজি, অর্থাৎ ৩ কেজি পেশীর শক্তি বাড়ালে আপনি একদম আদর্শ স্বাস্থ্য ও ভারসাম্যে পৌঁছাবেন।", 'bn'),

    # Body Fat Tap
    ("Body fat is the natural energy reserve and protective blanket for your organs. Yours is 12.7 percent, which is in a very safe, healthy, and athletic range! Keeping refined sweets and fried snacks low will keep it perfectly balanced.", 'en'),
    ("बॉडी फैट यानी आपके शरीर की संचित ऊर्जा और अंगों की सुरक्षा परत। आपका फैट 12.7 प्रतिशत है, जो कि बहुत ही सुरक्षित, स्वस्थ और चुस्त स्थिति में है! तली-भुनी चीजें और मीठा संतुलित रखने से यह हमेशा ऐसी ही बढ़िया बनी रहेगी।", 'hi'),
    ("বডি ফ্যাট হলো শরীরের অভ্যন্তরীণ শক্তি ভাণ্ডার ও অঙ্গপ্রত্যঙ্গের সুরক্ষার চাদর। আপনার ফ্যাটের মাত্রা ১২.৭ শতাংশ, যা অত্যন্ত চমৎকার ও স্বাস্থ্যকর! নিয়মিত হাঁটাচলা ও ভাজাভুজি এড়িয়ে চললে এটি সবসময় সুন্দর থাকবে।", 'bn'),

    # Muscle Mass Tap
    ("Muscle mass is the true power engine of your body! It burns calories even while you sleep and gives you strength to climb stairs and lift things. Yours is 36.4 kg. Wholesome dal, paneer, sprouts, roasted chana, and daily brisk walks will make this power engine even stronger.", 'en'),
    ("मांसपेशियां आपके शरीर का असली पावर इंजन हैं! यह सोते समय भी ऊर्जा जलाती हैं और आपको चलने, दौड़ने और सीढ़ियां चढ़ने की ताक़त देती हैं। आपका मसल वज़न 36.4 किलो है। मूंग की दाल, पनीर, अंकुरित अनाज, भुना चना और रोज़ाना की सैर से यह इंजन और भी शक्तिशाली बन जाएगा।", 'hi'),
    ("পেশীর ওজন হলো আপনার শরীরের মূল পাওয়ার ইঞ্জিন! এটি বিশ্রামের সময়ও ক্যালোরি পোড়ায় এবং চলাফেরা ও কাজের শক্তি জোগায়। আপনার পেশীর ওজন ৩৬.৪ কেজি। মুগ ডাল, ছানা, ডিম, অঙ্কুরিত ছোলা ও নিয়মিত হাঁটা এই ইঞ্জিনকে আরও শক্তিশালী করে তুলবে।", 'bn'),

    # Hydration / Water Tap
    ("Cellular hydration is the life-giving water cushioning your joints and carrying energy to every corner of your body. Yours is 81.6 percent, which is wonderfully hydrating and keeps you refreshed all day long! Enjoy 8 to 10 glasses of water daily.", 'en'),
    ("शरीर का पानी यानी आपके जोड़ों की चिकनाई और पूरे शरीर में ताजगी पहुंचाने वाली जीवनदायिनी धारा। आपका पानी का स्तर 81.6 प्रतिशत है, जो बहुत ही बढ़िया है और आपको दिनभर चुस्त रखता है! रोज़ाना 8 से 10 गिलास पानी ज़रूर पिएं।", 'hi'),
    ("শরীরের জল হলো হাড়ের জোড়গুলোকে সচল রাখা এবং প্রতিটি কোষে পুষ্টি পৌঁছানোর মাধ্যম। আপনার শরীরে জলের মাত্রা ৮১.৬ শতাংশ, যা চমৎকার ও সারাদিনের সতেজতা বজায় রাখে! প্রতিদিন ৮ থেকে ১০ গ্লাস জল পান করুন।", 'bn'),
]

async def warm_cache():
    print(f"Warming {len(ENTRIES)} speech entries into cache...")
    for text, lang in ENTRIES:
        trimmed = text.strip()
        voice = VOICES[lang]
        h = hashlib.sha256(f"{lang}:{voice}:{trimmed}".encode('utf-8')).hexdigest()
        dest = os.path.join(CACHE_DIR, f"{h}.mp3")
        if os.path.exists(dest) and os.path.getsize(dest) > 500:
            print(f"[CACHED] {lang}: {trimmed[:40]}...")
            continue
        print(f"[GENERATING] {lang} ({voice}): {trimmed[:40]}...")
        comm = edge_tts.Communicate(trimmed, voice)
        await comm.save(dest)
        print(f"  -> Saved {dest} ({os.path.getsize(dest)} bytes)")
    print("TTS cache warming complete!")

if __name__ == '__main__':
    asyncio.run(warm_cache())
