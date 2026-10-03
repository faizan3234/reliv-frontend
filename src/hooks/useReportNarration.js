import { useEffect, useRef } from 'react';
import { useSpeech } from '../context/SpeechContext';

// A render must not cancel the pending introduction or interrupt active speech.
export function useReportNarration(play, ready = true) {
  const { stop, enableReportAudio } = useSpeech();
  const latest = useRef(play);
  latest.current = play;
  const stopRef = useRef(stop);
  stopRef.current = stop;

  useEffect(() => {
    // Idempotent under StrictMode. Users can still stop or mute after entry.
    enableReportAudio();
  }, [enableReportAudio]);

  useEffect(() => {
    if (!ready) return undefined;
    const timer = setTimeout(() => latest.current(), 450);
    return () => { clearTimeout(timer); stopRef.current(); };
  }, [ready]);
}
