import { useEffect } from 'react';
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

  useEffect(() => {
    // Register the hooks for this page
    const pagePath = location.pathname;
    
    registerPageHook(pagePath, {
      onTranscript,
      onIdle,
      onHelp
    });

    // Send context to backend so Whisper can adapt
    sendToBackend({
      type: 'SET_CONTEXT',
      page: pagePath,
      expecting,
      vocabulary_hints: vocabularyHints
    });

    return () => {
      unregisterPageHook(pagePath);
    };
  }, [location.pathname, onTranscript, onIdle, onHelp, expecting, JSON.stringify(vocabularyHints), registerPageHook, unregisterPageHook, sendToBackend]);
};
