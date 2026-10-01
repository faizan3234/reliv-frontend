import { useEffect, useState } from 'react';
import { useSpeech } from '../context/SpeechContext';

const copy = {
  en: { listen:'Listen to this guide', stop:'Stop speaking', mute:'Sound is off. Turn on sound first.', unmute:'Turn sound on', quiet:'Volume is zero. Raise the volume.', volume:'Raise volume', error:'Voice is unavailable. Read the explanation below or ask staff to check the speaker.', blocked:'Tap Listen to allow sound.', speaking:'Speaking…', ready:'Tap Listen. You can stop or repeat at any time.' },
  hi: { listen:'यह निर्देश सुनें', stop:'आवाज़ रोकें', mute:'आवाज़ बंद है। पहले आवाज़ चालू करें।', unmute:'आवाज़ चालू करें', quiet:'आवाज़ का स्तर शून्य है।', volume:'आवाज़ बढ़ाएँ', error:'आवाज़ उपलब्ध नहीं है। नीचे पढ़ें या कर्मचारी से मदद लें।', blocked:'आवाज़ के लिए सुनें बटन दबाएँ।', speaking:'बोल रहे हैं…', ready:'सुनें दबाएँ। कभी भी रोक सकते हैं या फिर सुन सकते हैं।' },
  bn: { listen:'এই নির্দেশ শুনুন', stop:'কথা থামান', mute:'শব্দ বন্ধ আছে। আগে শব্দ চালু করুন।', unmute:'শব্দ চালু করুন', quiet:'শব্দের মাত্রা শূন্য।', volume:'শব্দ বাড়ান', error:'আওয়াজ পাওয়া যাচ্ছে না। নিচের লেখা পড়ুন অথবা কর্মীর সাহায্য নিন।', blocked:'শব্দ শুনতে শুনুন বোতাম চাপুন।', speaking:'বলা হচ্ছে…', ready:'শুনুন চাপুন। যে কোনও সময় থামাতে বা আবার শুনতে পারেন।' },
};
export default function SpokenGuide({ text, language = 'en', autoSpeak = false }) {
  const { speakText, stop, muted, toggleMute, volume, setVolume } = useSpeech();
  const [status, setStatus] = useState('ready');
  const [caption, setCaption] = useState('');
  const w = copy[language] || copy.en;
  useEffect(() => {
    const speaking = e => setStatus(e.detail ? 'speaking' : 'ready');
    const said = e => setCaption(String(e.detail || ''));
    const error = () => setStatus('error');
    const blocked = () => setStatus('blocked');
    window.addEventListener('reliv_speaking', speaking);
    window.addEventListener('reliv_spoken_text', said);
    window.addEventListener('reliv_speech_error', error);
    window.addEventListener('reliv_speech_blocked', blocked);
    return () => {
      window.removeEventListener('reliv_speaking', speaking);
      window.removeEventListener('reliv_spoken_text', said);
      window.removeEventListener('reliv_speech_error', error);
      window.removeEventListener('reliv_speech_blocked', blocked);
      stop();
    };
  }, [stop]);
  useEffect(() => {
    if (!autoSpeak || !text) return undefined;
    const timer = setTimeout(() => speakText(text, { langHint: language }), 450);
    return () => { clearTimeout(timer); stop(); };
  }, [text, language, autoSpeak, speakText, stop]);
  return <aside className="my-4 rounded-2xl border border-orange-200 bg-orange-50 p-5" aria-label={w.listen}>
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={muted || volume === 0} onClick={() => { setCaption(text); speakText(text, {langHint:language}); }} className="min-h-12 rounded-xl bg-orange-700 px-5 font-bold text-white disabled:opacity-50">{w.listen}</button>
      <button type="button" onClick={stop} className="min-h-12 rounded-xl border border-orange-300 bg-white px-5 font-bold text-orange-900">{w.stop}</button>
      {muted && <button type="button" onClick={toggleMute} className="min-h-12 rounded-xl bg-white px-4 font-bold">{w.unmute}</button>}
      {volume === 0 && <button type="button" onClick={() => setVolume(1)} className="min-h-12 rounded-xl bg-white px-4 font-bold">{w.volume}</button>}
    </div>
    <p role="status" className="mt-3 text-sm text-slate-700">{muted ? w.mute : volume === 0 ? w.quiet : w[status]}</p>
    <p className="mt-3 whitespace-pre-line text-lg leading-relaxed text-slate-900">{caption || text}</p>
  </aside>;
}
