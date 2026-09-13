import React, { createContext, useContext, useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useSpeech } from './SpeechContext';
import { useHealth } from './HealthContext';
import { looksLikeRelivEcho, normalizeVoiceText } from '../voice/voicePageProfiles';
import { HELP_HINTS, isHelpRequest } from '../voice/helpIntent';
import { parsePaymentVoice } from '../voice/paymentVoice';
import { guidanceText, ROUTE_GUIDANCE, isGuidedRoute } from '../voice/guidanceCopy';
import { GuidanceTimer } from '../voice/guidanceTimer';

const VoiceAssistantContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useVoiceAssistant = () => useContext(VoiceAssistantContext);

export const VoiceAssistantProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [micDevice, setMicDevice] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const [lastTranscript, setLastTranscript] = useState(null);
  const [listeningPaused, setListeningPaused] = useState(false);

  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const connectionTimeout = useRef(null);
  const idleTimer = useRef(null);
  const guidanceClock = useRef(new GuidanceTimer(Date.now()));
  const idleTickRef = useRef(null);
  const userSpeakingRef = useRef(false);
  const speakerEndedAtRef = useRef(0);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const location = useLocation();
  const currentPathRef = useRef(location.pathname);
  const pageHooks = useRef(new Map());
  const { stop, speakText, speakingRef, muted } = useSpeech();
  const { data: healthData } = useHealth();
  const languageRef = useRef(healthData?.language || 'en');
  languageRef.current = healthData?.language || 'en';
  const listeningPausedRef = useRef(false);
  const backendMessageHandlerRef = useRef(null);
  const recentRelivSpeechRef = useRef([]);
  const lastPongRef = useRef(Date.now());

  currentPathRef.current = location.pathname;


  const isRelivSpeakingRef = useRef(speakingRef.current);
  const lastContextPayloadRef = useRef({ type: 'SET_CONTEXT', page: '/', expecting: 'help', vocabulary_hints: HELP_HINTS });

  const sendToBackend = useCallback((payload) => {
    if (payload.type === 'SET_CONTEXT') {
      const previous = lastContextPayloadRef.current;
      lastContextPayloadRef.current = {
        type: 'SET_CONTEXT', expecting: 'help', vocabulary_hints: HELP_HINTS,
        ...(previous.page === payload.page ? previous : {}), ...payload,
      };
      payload = lastContextPayloadRef.current;
    }
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload));
    }
  }, []);

  const setRelivSpeaking = useCallback((active) => {
    sendToBackend({ type: 'SET_RELIV_SPEAKING', active });
  }, [sendToBackend]);

  // Cancel the departed page's prompt before the next page's effects run.
  useLayoutEffect(() => () => { stop(); }, [location.pathname, stop]);
  useEffect(() => {
    const rememberSpeech = (event) => {
      const text = normalizeVoiceText(event.detail);
      if (text) recentRelivSpeechRef.current = [{ text, at: Date.now() }, ...recentRelivSpeechRef.current].slice(0, 4);
    };
    window.addEventListener('reliv_spoken_text', rememberSpeech);
    return () => window.removeEventListener('reliv_spoken_text', rememberSpeech);
  }, []);

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
      const active = Boolean(e.detail);
      setAssistantSpeaking(active);
      if (active) { userSpeakingRef.current = false; setIsSpeaking(false); }
      else speakerEndedAtRef.current = Date.now();
      isRelivSpeakingRef.current = active;
      setRelivSpeaking(active);
      guidanceClock.current.defer(Date.now());
    };
    window.addEventListener('reliv_speaking', handleSpeaking);
    return () => {
      window.removeEventListener('reliv_speaking', handleSpeaking);
    };
  }, [setRelivSpeaking]);

  const reconnectAttemptRef = useRef(0);

  const heartbeatRef = useRef(null);

  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
    lastPongRef.current = Date.now();
    heartbeatRef.current = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        if (Date.now() - lastPongRef.current > 25000) {
          ws.current.close();
          return;
        }
        ws.current.send(JSON.stringify({ type: "PING", ts: Date.now() }));
      }
    }, 10000);
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

    let socket;
    const scheduleReconnect = (busy = false) => {
      if (manualCloseRef.current) return;
      const delays = [100, 250, 500, 1000, 2000];
      const delay = busy ? 2000 : delays[Math.min(reconnectAttemptRef.current++, delays.length - 1)];
      reconnectTimeout.current = setTimeout(connectWebSocket, delay);
    };
    try {
      socket = new WebSocket(import.meta.env.VITE_VOICE_WS_URL || 'ws://127.0.0.1:5100');
    } catch (error) {
      console.warn('[VoiceAssistant] Unable to connect:', error.message);
      scheduleReconnect();
      return;
    }
    let controllerBusy = false;
    ws.current = socket;

    socket.onopen = () => {
      if (currentGeneration !== reconnectGenerationRef.current) {
        socket.close();
        return;
      }
      
      console.log(`[VoiceAssistant] Connected to backend as ${voiceClientIdRef.current}`);

      // Explicit client identity
      socket.send(JSON.stringify({
        type: 'CLIENT_HELLO',
        clientId: voiceClientIdRef.current,
        role: "kiosk-controller"
      }));


    };

    socket.onmessage = (event) => {
      if (currentGeneration !== reconnectGenerationRef.current) return;
      try {
        const msg = JSON.parse(event.data);
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'CONTROLLER_ACTIVE') {
           clearTimeout(connectionTimeout.current);
           reconnectAttemptRef.current = 0;
           setIsConnected(true);
           // Backend acknowledged we are the active controller
           // Now we can safely send context
           startHeartbeat();
           socket.send(JSON.stringify({ type: 'SET_RELIV_SPEAKING', active: isRelivSpeakingRef.current }));
           socket.send(JSON.stringify({ type: 'SET_LANGUAGE', language: languageRef.current }));
           socket.send(JSON.stringify(lastContextPayloadRef.current));
           socket.send(JSON.stringify({ type: listeningPausedRef.current || !isGuidedRoute(currentPathRef.current) ? 'PAUSE_LISTENING' : 'RESUME_LISTENING' }));
        } else if (msg.type === 'CONTROLLER_BUSY') {
           controllerBusy = true;
           socket.close();
        } else {
           backendMessageHandlerRef.current?.(msg);
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
      processingRef.current = false;
      setIsProcessing(false);
      userSpeakingRef.current = false;
    setIsSpeaking(false);
      clearTimeout(connectionTimeout.current);
      socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
      ws.current = null;
      
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }

      scheduleReconnect(controllerBusy);
    };

    // An open TCP connection without a controller acknowledgement is unusable.
    connectionTimeout.current = setTimeout(() => {
      if (currentGeneration !== reconnectGenerationRef.current) return;
      socket.onclose?.();
      socket.close();
    }, 5000);

    socket.onerror = (err) => {
      console.error('[VoiceAssistant] WebSocket error', err);
      // Let onclose handle the reconnect
    };
  }, [startHeartbeat]);

  // Exclusive Browser Controller Lock
  useEffect(() => {
    let active = true;
    let lockResolver = null;

    const startController = async () => {
      if (navigator.locks) {
        navigator.locks.request('reliv-kiosk-voice-controller', { mode: 'exclusive' }, () => {
          return new Promise((resolve) => {
            if (!active) {
              resolve();
              return;
            }
            lockResolver = resolve;
            connectWebSocket();
          });
        }).catch((error) => {
          console.warn('[VoiceAssistant] Browser lock unavailable:', error.message);
          if (active) connectWebSocket();
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
      reconnectGenerationRef.current += 1;
      if (ws.current) {
        const socket = ws.current;
        ws.current = null;
        socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
        socket.close();
      }
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      clearTimeout(connectionTimeout.current);
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
    if ((isRelivSpeakingRef.current || listeningPausedRef.current ||
        !isGuidedRoute(currentPathRef.current) || Date.now() - speakerEndedAtRef.current < 300) &&
        (msg.type === 'vad' || msg.type === 'transcript')) {
       return; 
    }

    switch (msg.type) {
      case 'pong':
        lastPongRef.current = Date.now();
        break;
      case 'connected':
        setMicDevice(msg.device_name);
        processingRef.current = msg.processing === true;
        setIsProcessing(processingRef.current);
        break;
      case 'processing':
        userSpeakingRef.current = false;
        setIsSpeaking(false);
        processingRef.current = msg.active === true;
        setIsProcessing(processingRef.current);
        guidanceClock.current.defer(Date.now());
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
        userSpeakingRef.current = msg.speaking === true;
        setIsSpeaking(userSpeakingRef.current);
        if (msg.speaking) {
          resetIdleTimer();

        }
        break;
      case 'transcript':
        if (msg.is_final !== false && typeof msg.text === 'string' && msg.text.trim().length > 0 &&
            (!msg.page || msg.page === currentPathRef.current) &&
            (!msg.expecting || msg.expecting === lastContextPayloadRef.current.expecting) &&
            !looksLikeRelivEcho(msg.text, recentRelivSpeechRef.current)) {
          if (!processTranscript(msg.text)) break;
          setLastTranscript({
            text: msg.text,
            language: msg.language,
            confidence: msg.confidence,
            timestamp: Date.now()
          });
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

  backendMessageHandlerRef.current = handleBackendMessage;

  const getActiveHook = () => pageHooks.current.get(currentPathRef.current)?.getCurrent?.();

  const guideCurrentPage = (text = '') => {
    const hook = getActiveHook();
    if (hook?.onHelp) hook.onHelp(text);
    else speakText(guidanceText(ROUTE_GUIDANCE[currentPathRef.current], languageRef.current));
  };

  const processTranscript = (text) => {
    if (isHelpRequest(text)) {
      resetIdleTimer();
      guideCurrentPage(text);
      return true;
    }
    const hook = getActiveHook();
    if (currentPathRef.current === '/payment' && hook?.paymentRepliesEnabled === true) {
      const reply = parsePaymentVoice(text);
      if (reply && hook.onPaymentReply) {
        resetIdleTimer();
        hook.onPaymentReply(reply);
        return true;
      }
    }
    // Names, ages, genders, choices, codes, and unrelated speech have no action.
    return false;
  };

  const resetIdleTimer = useCallback(() => {
    const hook = pageHooks.current.get(currentPathRef.current)?.getCurrent?.();
    guidanceClock.current.reset(Date.now(), hook?.idleDelayMs ?? 4000);
  }, []);

  idleTickRef.current = () => {
    const hook = getActiveHook();
    if (!isGuidedRoute(currentPathRef.current) || muted || document.hidden ||
        hook?.idleEnabled === false || isRelivSpeakingRef.current ||
        userSpeakingRef.current || processingRef.current) {
      guidanceClock.current.defer(Date.now());
      return;
    }
    if (guidanceClock.current.take(Date.now())) {
      if (hook?.onIdle) hook.onIdle();
      else guideCurrentPage();
    }
  };

  useEffect(() => {
    idleTimer.current = setInterval(() => idleTickRef.current?.(), 250);
    const events = ['pointerdown', 'pointermove', 'touchstart', 'touchmove', 'keydown', 'input', 'change', 'scroll', 'wheel'];
    const activity = (event) => {
      if (event.type === 'pointermove' && !event.buttons) return;
      resetIdleTimer();
    };
    events.forEach(event => window.addEventListener(event, activity, { capture: true, passive: true }));
    const visible = () => { if (!document.hidden) resetIdleTimer(); };
    document.addEventListener('visibilitychange', visible);
    return () => {
      clearInterval(idleTimer.current);
      events.forEach(event => window.removeEventListener(event, activity, true));
      document.removeEventListener('visibilitychange', visible);
    };
  }, [resetIdleTimer]);

  useEffect(() => {
    userSpeakingRef.current = false;
    setIsSpeaking(false);
    setLastTranscript(null);
    resetIdleTimer();
    sendToBackend({ type: 'SET_CONTEXT', page: location.pathname });
    sendToBackend({ type: listeningPausedRef.current || !isGuidedRoute(location.pathname) ? 'PAUSE_LISTENING' : 'RESUME_LISTENING' });
  }, [location.pathname, resetIdleTimer, sendToBackend]);

  useEffect(() => {
    sendToBackend({ type: 'SET_LANGUAGE', language: languageRef.current });
  }, [healthData?.language, sendToBackend]);

  const pauseListening = () => {
    listeningPausedRef.current = true;
    setListeningPaused(true);
    userSpeakingRef.current = false;
    setIsSpeaking(false);
    sendToBackend({ type: 'PAUSE_LISTENING' });
    resetIdleTimer();
  };

  const resumeListening = () => {
    listeningPausedRef.current = false;
    setListeningPaused(false);
    sendToBackend({ type: isGuidedRoute(currentPathRef.current) ? 'RESUME_LISTENING' : 'PAUSE_LISTENING' });
    resetIdleTimer();
  };

  // Allow pages to register themselves
  const registerPageHook = useCallback((path, hook) => {
    pageHooks.current.set(path, hook);
  }, []);

  const unregisterPageHook = useCallback((path) => {
    pageHooks.current.delete(path);
  }, []);

  const value = {
    isConnected,
    micDevice,
    isSpeaking,
    assistantSpeaking,
    guidanceAvailable: isGuidedRoute(location.pathname),
    isProcessing,
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
