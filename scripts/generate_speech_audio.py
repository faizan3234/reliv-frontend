"""
Generate high-quality speech audio files using Microsoft Edge TTS.
Voice: en-US-JennyNeural (female, natural, clear)

Usage:
  pip install edge-tts
  python scripts/generate_speech_audio.py

Output: public/audio/<pageKey>.mp3 for every page
"""

import asyncio
import os
import edge_tts

# ── Same female neural voice as Edge browser ──
VOICE = "en-US-JennyNeural"

# ── All page texts (must match DEFAULT_CONFIG in SpeechContext.jsx) ──
TEXTS = {
    "splash": "Welcome to Reliv. Your personal health companion. Tap to start.",
    "choose-language": "Pick your language. English, Hindi, or Bengali.",
    "customer-details": "Scan QR code with your phone. Or open Google and scan. Save your details for faster login next time.",
    "two-options": "Great. Health checkup or medicine dispenser? Tap your choice.",
    "body-composition": "Step on the scale. Feet on the black area, not the orange. Bring your feet closer. Hold still. We will measure height too. If weight looks wrong, tap Refresh and stand again. If device disconnected, tap Refresh.",
    "health-checkup": "Now blood pressure. Pick the cuff from the hook. Put it on your wrist at heart level. Press the ON button. Then tap Measure on screen. Don't talk. Stay relaxed. If anything looks off, tap Refresh and measure again. If device disconnected, tap Refresh.",
    "oxygen-pulse": "Place your finger in the sensor clip. Tap Measure. Hold still for 15 seconds. If device disconnected, tap Refresh.",
    "body-temperature": "Hold the temperature gun on your forehead. Tap Measure. If device disconnected, tap Refresh.",
    "eyesight": "Now the eyesight test. Cover one eye. Read the letters and numbers you see on screen. Select what you see from the options. Then cover your other eye and repeat.",
    "report-1": "This is your health score compared to an average person your age.",
    "report-2": "Your overall status. Green, yellow, or red.",
    "report-3": "This graph grows as you visit. Come back tomorrow. New insights unlock.",
    "report-4": "Your eyesight assessment is complete.",
    "report-5": "Here are all your numbers in one place. But more importantly, here is what they mean in simple human language. Read the advice on screen. Screenshot it. Follow it for 7 days. Then come back. A free checkup is waiting for you. Scroll down. Your full report will be emailed to you. You can also challenge a friend or your partner to see who's healthier. Loser posts on their story! And check out the wellness kits curated just for you.",
    "wellness-recommendations": "Your personalized advice is on screen. Eat this. Do that. Avoid this. No doctor terms. Just simple steps.",
    "checkout": "Review your health kits and proceed to checkout when ready.",
    "payment": "That's all the free tests. Now for just 17 rupees, less than a Coke or a cigarette, I will translate everything into simple human language. No doctor terms. Just eat this, do that, avoid this. Plus a 7-day graph. Scan QR code. GPay, PhonePe, Paytm. Or insert 17 rupees, exact change.",
    "order-success": "Thank you. Your full receipt is sent to your email. Simple language. Easy to understand. Come back tomorrow to see the changes and compare. Your graph grows. New insights unlock. I am proud of you. See you tomorrow?",
    "feedback": "Rate your experience. 1 to 5 stars. Your feedback helps other students trust Reliv.",
    "idle-loop": "Free weight. Free BP. Free oxygen. A full report with simple human advice, just 17 rupees. Less than a Coke. Step up. Let me help you.",
}

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "audio")


async def generate_all():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for key, text in TEXTS.items():
        output_file = os.path.join(OUTPUT_DIR, f"{key}.mp3")
        print(f"  Generating: {key} ...")
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(output_file)
        size_kb = os.path.getsize(output_file) / 1024
        print(f"    -> {output_file} ({size_kb:.1f} KB)")

    print(f"\nDone! {len(TEXTS)} audio files generated in {OUTPUT_DIR}")
    print("Now run: git add public/audio/ && git commit -m 'add speech audio' && git push")


if __name__ == "__main__":
    print(f"Generating speech audio with voice: {VOICE}\n")
    asyncio.run(generate_all())
