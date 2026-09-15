import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';
import { HELP_HINTS } from '../voice/helpIntent';
import { PAYMENT_HINTS } from '../voice/paymentVoice';
import { REPORT_LANGUAGE_HINTS } from '../voice/reportVoice';

/**
 * Register screen guidance and scoped voice intents.
 * Only designated interaction points (payment yes/no, report language choice)
 * and universal help may listen to speech.
 */
export const useVoicePage = (options = {}) => {
  const { registerPageHook, unregisterPageHook, sendToBackend, resetIdleTimer } = useVoiceAssistant();
  const { pathname } = useLocation();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const paymentRepliesEnabled = pathname === '/payment' && options.paymentRepliesEnabled === true;
  const reportLanguageEnabled = options.reportLanguageEnabled === true;
  const { guidanceKey = '', idleEnabled = true, idleDelayMs = 4000 } = options;

  useEffect(() => {
    registerPageHook(pathname, { getCurrent: () => optionsRef.current });
    return () => unregisterPageHook(pathname);
  }, [pathname, registerPageHook, unregisterPageHook]);

  useEffect(() => {
    let expecting = 'help';
    let hints = HELP_HINTS;

    if (reportLanguageEnabled) {
      expecting = 'report_language';
      hints = [...HELP_HINTS, ...REPORT_LANGUAGE_HINTS];
    } else if (paymentRepliesEnabled) {
      expecting = 'payment_confirmation';
      hints = [...HELP_HINTS, ...PAYMENT_HINTS];
    }

    sendToBackend({
      type: 'SET_CONTEXT',
      page: pathname,
      expecting,
      vocabulary_hints: hints,
    });
    resetIdleTimer();
  }, [pathname, paymentRepliesEnabled, reportLanguageEnabled, guidanceKey, idleEnabled, idleDelayMs, sendToBackend, resetIdleTimer]);
};
