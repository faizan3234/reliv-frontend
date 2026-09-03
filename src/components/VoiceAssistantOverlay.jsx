import React, { useState, useEffect } from 'react';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function VoiceAssistantOverlay() {
  const { isConnected, micDevice, isSpeaking, listeningPaused } = useVoiceAssistant();
  const [show, setShow] = useState(false);

  // Show a small overlay indicator when listening is active
  useEffect(() => {
    if (isConnected && !listeningPaused) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [isConnected, listeningPaused]);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="flex items-center gap-3 bg-white/90 backdrop-blur-md shadow-2xl rounded-full px-5 py-3 border border-slate-200"
        >
          {/* Avatar/Mic Icon */}
          <div className="relative">
            {isSpeaking ? (
              <div className="absolute inset-0 bg-orange-400 rounded-full animate-ping opacity-75"></div>
            ) : null}
            <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white shadow-inner transition-colors duration-300 ${
              isSpeaking ? 'bg-orange-500' : 'bg-slate-800'
            }`}>
              {isSpeaking ? (
                <Mic className="w-5 h-5 animate-pulse" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </div>
          </div>
          
          {/* Status Text */}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800">
              {isSpeaking ? 'Listening...' : 'Reliv Assistant'}
            </span>
            <span className="text-xs font-medium text-slate-500">
              {micDevice || 'Ready'}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
