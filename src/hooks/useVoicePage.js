import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';
import { HELP_HINTS } from '../voice/helpIntent';
import { PAYMENT_HINTS } from '../voice/paymentVoice';

/** Register screen guidance. Only payment may opt into yes/no replies. */
export const useVoicePage = (options = {}) => {
  const { registerPageHook, unregisterPageHook, sendToBackend, resetIdleTimer } = useVoiceAssistant();
  const { pathname } = useLocation();
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const paymentRepliesEnabled = pathname === '/payment' && options.paymentRepliesEnabled === true;
  const { guidanceKey = '', idleEnabled = true, idleDelayMs = 4000 } = options;

  useEffect(() => {
    registerPageHook(pathname, { getCurrent: () => optionsRef.current });
    return () => unregisterPageHook(pathname);
  }, [pathname, registerPageHook, unregisterPageHook]);

  useEffect(() => {
    sendToBackend({ type: 'SET_CONTEXT', page: pathname,
      expecting: paymentRepliesEnabled ? 'payment_confirmation' : 'help',
      vocabulary_hints: paymentRepliesEnabled ? [...HELP_HINTS, ...PAYMENT_HINTS] : HELP_HINTS,
    });
    resetIdleTimer();
  }, [pathname, paymentRepliesEnabled, guidanceKey, idleEnabled, idleDelayMs, sendToBackend, resetIdleTimer]);
};
