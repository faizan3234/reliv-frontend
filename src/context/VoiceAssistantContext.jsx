import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useSpeech } from './SpeechContext';
import { useHealth } from './HealthContext';

const VoiceAssistantContext = createContext(null);

export const useVoiceAssistant = () => useContext(VoiceAssistantContext);

export const VoiceAssistantProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [micDevice, setMicDevice] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastTranscript, setLastTranscript] = useState(null);
  const [listeningPaused, setListeningPaused] = useState(false);

  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const idleTimer = useRef(null);
  const idleSecondsRef = useRef(0);
  const location = useLocation();
  const currentPathRef = useRef(location.pathname);
  const pageHooks = useRef(new Map());
  const { stop, speakingRef } = useSpeech();
  const { data: healthData } = useHealth();

  useEffect(() => {
    currentPathRef.current = location.pathname;
  }, [location.pathname]);


  const speakingTimeoutRef = useRef(null);
  const isRelivSpeakingRef = useRef(false);

  // Listen for AEC signals from SpeechContext
  useEffect(() => {
    const handleSpeaking = (e) => {
      const active = e.detail;
      setIsSpeaking(active); // UI requirement from user
      
      if (active) {
        if (speakingTimeoutRef.current) {
          clearTimeout(speakingTimeoutRef.current);
          speakingTimeoutRef.current = null;
        }
        isRelivSpeakingRef.current = true;
        setRelivSpeaking(true);
      } else {
        // 350 ms acoustic tail
        // The timer starts ONLY AFTER real speaker playback has ended.
        speakingTimeoutRef.current = setTimeout(() => {
          isRelivSpeakingRef.current = false;
          setRelivSpeaking(false);
        }, 350);
      }
    };
    window.addEventListener('reliv_speaking', handleSpeaking);
    return () => {
      window.removeEventListener('reliv_speaking', handleSpeaking);
      if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
    };
  }, []);

  // Sync language with backend
  useEffect(() => {
    if (isConnected && healthData?.language) {
      sendToBackend({ type: 'SET_LANGUAGE', language: healthData.language });
    }
  }, [healthData?.language, isConnected]);

  // Connect to the Python Voice Backend
  const connectWebSocket = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) return;
    if (ws.current && ws.current.readyState === WebSocket.CONNECTING) return;

    ws.current = new WebSocket('ws://127.0.0.1:5100');

    ws.current.onopen = () => {
      console.log('[VoiceAssistant] Connected to backend');
      setIsConnected(true);
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);

      // AUTOMATIC RECOVERY
      // Guarantees an old PAUSE_LISTENING state can never survive reconnect
      setListeningPaused(false);
      ws.current.send(JSON.stringify({ type: 'RESUME_LISTENING' }));
      
      if (healthData?.language) {
        ws.current.send(JSON.stringify({ type: 'SET_LANGUAGE', language: healthData.language }));
      }
      ws.current.send(JSON.stringify({ type: 'SET_CONTEXT', page: currentPathRef.current }));
      
      // Send current SET_RELIV_SPEAKING state
      ws.current.send(JSON.stringify({ type: 'SET_RELIV_SPEAKING', active: isRelivSpeakingRef.current }));
    };

    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleBackendMessage(msg);
      } catch (e) {
        console.error('[VoiceAssistant] Failed to parse message', e);
      }
    };

    ws.current.onclose = () => {
      console.log('[VoiceAssistant] Disconnected from backend');
      setIsConnected(false);
      setMicDevice(null);
      // Fast reconnect delay
      reconnectTimeout.current = setTimeout(connectWebSocket, 500);
    };

    ws.current.onerror = (err) => {
      console.error('[VoiceAssistant] WebSocket error', err);
      ws.current.close(); // Force close to trigger clean reconnect
    };
  }, [healthData?.language]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [connectWebSocket]);

  // Handle incoming messages from the backend
  const handleBackendMessage = (msg) => {
    // NO SELF-TRANSCRIPTION
    // If RELIV is speaking (or in the 350ms acoustic tail), entirely ignore VAD and transcript events
    if (isRelivSpeakingRef.current && (msg.type === 'vad' || msg.type === 'transcript')) {
       return; 
    }

    switch (msg.type) {
      case 'connected':
        setMicDevice(msg.device_name);
        break;
      case 'mic_status':
        if (!msg.connected) {
          console.warn('[VoiceAssistant] Mic disconnected:', msg.error);
          setMicDevice(null);
        } else {
          setMicDevice(msg.device_name);
        }
        break;
      case 'vad':
        setIsSpeaking(msg.speaking);
        if (msg.speaking) {
          resetIdleTimer();
          // Barge-in temporarily disabled while testing 350ms tail, but keep logic
          if (speakingRef && speakingRef.current && !isRelivSpeakingRef.current) {
            console.log('[VoiceAssistant] Barge-in detected! Stopping RELIV speech.');
            stop();
          }
        }
        break;
      case 'transcript':
        if (msg.text && msg.text.trim().length > 0) {
          setLastTranscript({
            text: msg.text,
            language: msg.language,
            confidence: msg.confidence,
            timestamp: Date.now()
          });
          processTranscript(msg.text);
        }
        break;
      case 'no_speech_result':
        // VAD triggered but Whisper heard nothing
        break;
      case 'error':
        console.error('[VoiceAssistant] Backend error:', msg.message);
        break;
      default:
        break;
    }
  };

  const processTranscript = (text) => {
    resetIdleTimer();
    const lowerText = text.toLowerCase().trim();
    
    // 1. Check Global Intents (expanded to catch 150+ variations of help requests)
    const helpRegex = /(ab kya|what to do|what do|how to|help|samajh nahi|kya karu|kya karna|ki korbo|ki kor|sahajyo|কি করবো|কি করব|সাহায্য|কি করতে|क्या करूं|क्या करें|क्या करना|अब क्या|व्हाट टू|व्हाट तो|मदद|সাহায্য করুন|what now|what next|what should i do|guide me|next step|kya kare|kya karun|kya karoon|kaise karu|kaise karna hai|aage kya|age kya|batao|bataiye|ki korte hobe|ki korob|bujhte parchi na|bujhchi na|ebar ki korbo|help me|tell me|samjh nahi|pata nahi|pata nhi|kya krna|kya kru|kaise kru|ki korbo ebar|কি হবে|কী করব|কী করবো|কি করতে হবে|मुझे समझ नहीं|समझ नहीं आ रहा|क्या करना है|आगे क्या|what i need to do|what do i do|next process)/;
    
    if (helpRegex.test(lowerText)) {
      const hook = pageHooks.current.get(currentPathRef.current);
      if (hook && hook.onHelp) {
        hook.onHelp();
      }
      return;
    }

    // 2. Delegate to active page hook using the latest path from ref
    const activeHook = pageHooks.current.get(currentPathRef.current);
    if (activeHook && activeHook.onTranscript) {
      activeHook.onTranscript(lowerText, text);
    } else {
      console.warn('[VoiceAssistant] No active voice hook for current path:', currentPathRef.current);
    }
  };

  // Tiered Idle Guidance Logic
  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) clearInterval(idleTimer.current);
    idleSecondsRef.current = 0;

    if (listeningPaused) return;

    idleTimer.current = setInterval(() => {
      idleSecondsRef.current += 1;
      const activeHook = pageHooks.current.get(currentPathRef.current);
      if (activeHook && activeHook.onIdle) {
        activeHook.onIdle(idleSecondsRef.current);
      }
    }, 1000); // Check every second
  }, [listeningPaused]);

  // Reset timer on page change
  useEffect(() => {
    resetIdleTimer();
    // Update backend context
    sendToBackend({
      type: 'SET_CONTEXT',
      page: location.pathname
    });
    return () => {
      if (idleTimer.current) clearInterval(idleTimer.current);
    };
  }, [location.pathname, resetIdleTimer]);

  const sendToBackend = (payload) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload));
    }
  };

  const setRelivSpeaking = (active) => {
    sendToBackend({ type: 'SET_RELIV_SPEAKING', active });
  };

  const pauseListening = () => {
    setListeningPaused(true);
    sendToBackend({ type: 'PAUSE_LISTENING' });
    if (idleTimer.current) clearInterval(idleTimer.current);
  };

  const resumeListening = () => {
    setListeningPaused(false);
    sendToBackend({ type: 'RESUME_LISTENING' });
    resetIdleTimer();
  };

  // Allow pages to register themselves
  const registerPageHook = (path, hook) => {
    pageHooks.current.set(path, hook);
  };

  const unregisterPageHook = (path) => {
    pageHooks.current.delete(path);
  };

  const value = {
    isConnected,
    micDevice,
    isSpeaking,
    lastTranscript,
    listeningPaused,
    setRelivSpeaking,
    pauseListening,
    resumeListening,
    registerPageHook,
    unregisterPageHook,
    resetIdleTimer,
    sendToBackend
  };

  return (
    <VoiceAssistantContext.Provider value={value}>
      {children}
    </VoiceAssistantContext.Provider>
  );
};
