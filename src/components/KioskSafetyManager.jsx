import React, { useEffect, useRef } from 'react';

/**
 * KioskSafetyManager
 * Handles kiosk-specific safety features:
 * - Disables right-click (context menu)
 * - Disables keyboard shortcuts that could break kiosk
 * - Implements inactivity timeout
 * - Prevents full-screen exit
 * - Blocks developer tools access
 * 
 * Already imported in App.jsx as KioskGuardian
 */

export default function KioskSafetyManager() {
  const inactivityTimeout = useRef(null);
  const INACTIVITY_TIME = 5 * 60 * 1000; // 5 minutes (adjust as needed)

  useEffect(() => {
    // ============================================
    // 1. DISABLE RIGHT-CLICK (Context Menu)
    // ============================================
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // ============================================
    // 2. DISABLE DANGEROUS KEYBOARD SHORTCUTS
    // ============================================
    const handleKeyDown = (e) => {
      // Prevent Ctrl+W (close tab)
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        return false;
      }

      // Prevent Alt+F4 (close window) - works on some browsers
      if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+Q (quit) - Firefox/Chrome on Linux
      if ((e.ctrlKey || e.metaKey) && e.key === 'q') {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+Q (quit Chrome)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Q') {
        e.preventDefault();
        return false;
      }

      // Prevent F11 (full screen toggle)
      if (e.key === 'F11') {
        e.preventDefault();
        return false;
      }

      // Prevent F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+I (Developer Tools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+C (Inspect Element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+S (Save page)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+P (Print)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        return false;
      }
    };

    // ============================================
    // 3. DISABLE DRAGGING & FILE DROP
    // ============================================
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // ============================================
    // 4. INACTIVITY TIMEOUT HANDLER
    // ============================================
    const resetInactivityTimer = () => {
      // Clear existing timeout
      if (inactivityTimeout.current) {
        clearTimeout(inactivityTimeout.current);
      }

      // Set new timeout
      inactivityTimeout.current = setTimeout(() => {
        console.log('🕐 Kiosk inactivity timeout reached - returning to home');
        window.location.href = '/'; // Go back to home
      }, INACTIVITY_TIME);
    };

    // ============================================
    // 5. ATTACH EVENT LISTENERS
    // ============================================

    // Disable context menu (right-click)
    document.addEventListener('contextmenu', handleContextMenu, false);

    // Disable keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown, false);

    // Disable drag & drop
    document.addEventListener('dragover', handleDragOver, false);
    document.addEventListener('drop', handleDrop, false);

    // Inactivity tracking
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((event) => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    // Initialize inactivity timer
    resetInactivityTimer();

    // ============================================
    // 6. BACK BUTTON - ALLOW FUNCTIONAL BACK NAVIGATION
    // ============================================
    // Back button is now ENABLED for user navigation
    // Only browser back/forward to external sites is restricted
    // In-app navigation works normally via React Router

    // ============================================
    // 7. DISABLE ZOOM WITH KEYBOARD
    // ============================================
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });

    // ============================================
    // CLEANUP
    // ============================================
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('wheel', handleWheel);
      
      activityEvents.forEach((event) => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });

      if (inactivityTimeout.current) {
        clearTimeout(inactivityTimeout.current);
      }
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
