import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';

/**
 * useVoicePage hook
 * Allows a page to register its conversational logic with the VoiceAssistantContext.
 * 
 * @param {Object} options
 * @param {Function} options.onTranscript - Called when a new transcript is received
 * @param {Function} options.onIdle - Called when the user has been inactive for 10s
 * @param {Array} options.vocabularyHints - Hints for the Whisper ASR
 * @param {String} options.expecting - What the page is currently expecting (e.g., 'name', 'confirmation')
 */
export const useVoicePage = ({ onTranscript, onIdle, onHelp, vocabularyHints = [], expecting = '' }) => {
  const { registerPageHook, unregisterPageHook, sendToBackend } = useVoiceAssistant();
  const location = useLocation();
  const handlersRef = useRef({ onTranscript, onIdle, onHelp });
  handlersRef.current = { onTranscript, onIdle, onHelp };
  const vocabularyKey = JSON.stringify(vocabularyHints);

  useEffect(() => {
    // Register the hooks for this page
    const pagePath = location.pathname;
    
    registerPageHook(pagePath, {
      onTranscript: (...args) => handlersRef.current.onTranscript?.(...args),
      onIdle: (...args) => handlersRef.current.onIdle?.(...args),
      onHelp: (...args) => handlersRef.current.onHelp?.(...args),
    });

    return () => {
      unregisterPageHook(pagePath);
    };
  }, [location.pathname, registerPageHook, unregisterPageHook]);

  useEffect(() => {
    sendToBackend({
      type: 'SET_CONTEXT',
      page: location.pathname,
      expecting,
      vocabulary_hints: JSON.parse(vocabularyKey),
    });
  }, [location.pathname, expecting, vocabularyKey, sendToBackend]);
};
