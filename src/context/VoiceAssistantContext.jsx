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


  const isRelivSpeakingRef = useRef(false);

  // crypto.randomUUID() is undefined on non-HTTPS network IPs, so we must provide a fallback
  const generateId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'KSK-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const voiceClientIdRef = useRef(
    localStorage.getItem('relivVoiceClientId') || generateId()
  );
  
  const reconnectGenerationRef = useRef(0);
  const manualCloseRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('relivVoiceClientId', voiceClientIdRef.current);
  }, []);

  // Listen for AEC signals from SpeechContext
  useEffect(() => {
    const handleSpeaking = (e) => {
      const active = e.detail;
      setIsSpeaking(active); // UI requirement from user
      isRelivSpeakingRef.current = active;
      setRelivSpeaking(active);
      // Removed frontend acoustic tail. Backend fully owns speaker suppression.
    };
    window.addEventListener('reliv_speaking', handleSpeaking);
    return () => {
      window.removeEventListener('reliv_speaking', handleSpeaking);
    };
  }, []);

  // Connect to the Python Voice Backend
  const connectWebSocket = useCallback(() => {
    if (
      ws.current &&
      (
        ws.current.readyState === WebSocket.OPEN ||
        ws.current.readyState === WebSocket.CONNECTING
      )
    ) {
      return;
    }

    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    const currentGeneration = ++reconnectGenerationRef.current;
    manualCloseRef.current = false;

    const socket = new WebSocket('ws://127.0.0.1:5100');
    ws.current = socket;

    socket.onopen = () => {
      if (currentGeneration !== reconnectGenerationRef.current) {
        socket.close();
        return;
      }
      console.log(`[VoiceAssistant] Connected to backend as ${voiceClientIdRef.current}`);
      setIsConnected(true);

      // Explicit client identity
      socket.send(JSON.stringify({
        type: 'CLIENT_HELLO',
        clientId: voiceClientIdRef.current,
        role: "kiosk-controller"
      }));

      // Only send RESUME_LISTENING for startup/recovery
      setListeningPaused(false);
      socket.send(JSON.stringify({ type: 'RESUME_LISTENING' }));
      
      // Resend the complete context (page, expecting, vocabulary_hints)
      socket.send(JSON.stringify(lastContextPayloadRef.current));
    };

    socket.onmessage = (event) => {
      if (currentGeneration !== reconnectGenerationRef.current) return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'CONTROLLER_ACTIVE') {
           // Backend acknowledged we are the active controller
           // Now we can safely send context
           if (healthData?.language) {
             socket.send(JSON.stringify({ type: 'SET_LANGUAGE', language: healthData.language }));
           }
           socket.send(JSON.stringify({ type: 'SET_CONTEXT', page: currentPathRef.current }));
           socket.send(JSON.stringify({ type: 'SET_RELIV_SPEAKING', active: isRelivSpeakingRef.current }));
        } else {
           handleBackendMessage(msg);
        }
      } catch (e) {
        console.error('[VoiceAssistant] Failed to parse message', e);
      }
    };

    socket.onclose = () => {
      if (currentGeneration !== reconnectGenerationRef.current) return;
      console.log('[VoiceAssistant] Disconnected from backend');
      setIsConnected(false);
      setMicDevice(null);
      
      if (!manualCloseRef.current) {
        // Fast reconnect delay
        reconnectTimeout.current = setTimeout(connectWebSocket, 500);
      }
    };

    socket.onerror = (err) => {
      console.error('[VoiceAssistant] WebSocket error', err);
      // Let onclose handle the reconnect
    };
  }, [healthData?.language]);

  // Exclusive Browser Controller Lock
  useEffect(() => {
    let active = true;
    let lockResolver = null;

    const startController = async () => {
      if (navigator.locks) {
        navigator.locks.request('reliv-kiosk-voice-controller', { mode: 'exclusive' }, (lock) => {
          return new Promise((resolve) => {
            if (!active) {
              resolve();
              return;
            }
            lockResolver = resolve;
            connectWebSocket();
          });
        });
      } else {
        // Fallback for extremely old Chromium, but we will still run
        connectWebSocket();
      }
    };

    startController();

    return () => {
      active = false;
      manualCloseRef.current = true;
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (lockResolver) lockResolver();
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

  const lastContextPayloadRef = useRef({ type: 'SET_CONTEXT', page: '/' });

  // Send a message to the backend
  const sendToBackend = useCallback((payload) => {
    if (payload.type === 'SET_CONTEXT') {
      lastContextPayloadRef.current = payload;
    }
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload));
    }
  }, []);

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
