import React from 'react';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';
import { useHealth } from '../context/HealthContext';

const labels = {
  en: { speaking: 'Guiding you', listening: 'Listening', processing: 'Understanding', ready: 'Ask for help', unavailable: 'Mic unavailable — use touch' },
  hi: { speaking: 'आपको समझा रही हूँ', listening: 'सुन रही हूँ', processing: 'समझ रही हूँ', ready: 'मदद के लिए पूछिए', unavailable: 'माइक उपलब्ध नहीं — स्क्रीन छूकर चलाएँ' },
  bn: { speaking: 'আপনাকে বুঝিয়ে বলছি', listening: 'শুনছি', processing: 'বুঝে নিচ্ছি', ready: 'সাহায্য চাইতে পারেন', unavailable: 'মাইক নেই — স্ক্রিন ছুঁয়ে ব্যবহার করুন' },
};

export default function VoiceAssistantOverlay() {
  const { isConnected, micDevice, assistantSpeaking, isSpeaking, isProcessing, listeningPaused, guidanceAvailable } = useVoiceAssistant();
  const { data } = useHealth();
  if (!guidanceAvailable) return null;
  const text = labels[data?.language] || labels.en;
  const micReady = isConnected && micDevice && !listeningPaused;
  const status = assistantSpeaking ? 'speaking' : !micReady ? 'unavailable'
    : isProcessing ? 'processing' : isSpeaking ? 'listening' : 'ready';
  const Icon = assistantSpeaking ? Volume2 : !micReady ? MicOff : isProcessing ? Loader2 : Mic;
  return (
    <div className="fixed top-1 left-1/2 -translate-x-1/2 z-50 pointer-events-none max-w-[85vw] rounded-full bg-white/95 border border-orange-100 px-3 py-1 text-[11px] font-medium text-slate-700 flex items-center gap-1.5 shadow-sm" role="status">
      <Icon size={12} className={status === 'processing' ? 'animate-spin' : ''} />
      <span>{text[status]}</span>
    </div>
  );
}
