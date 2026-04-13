// src/main.jsx
import React, { StrictMode, Suspense, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HealthProvider } from "./context/HealthContext.jsx";
import "./index.css";
import "./styles/touch-kiosk.css"; // Touch & Kiosk optimizations

// 👇 THIS LINE BOOTS i18next (must be before <App/> renders)
import "./i18n.js";

import App from "./App.jsx";

// Kiosk Touch Scroll Helper - prevents text selection on touch drag
function KioskTouchHelper() {
  useEffect(() => {
    // Skip ALL kiosk protections on /mobile-entry — that page runs on user phones
    if (window.location.pathname.startsWith('/mobile-entry')) {
      return;
    }

    // Prevent context menu (right-click) on touch devices
    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Prevent text selection on touch start
    const preventTextSelection = (e) => {
      // Allow touch on inputs, textareas, and buttons
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'button' || tag === 'select') {
        return;
      }
      // Prevent default only if it's causing selection issues
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    };

    // Prevent keyboard shortcuts (Ctrl+C, Ctrl+A, etc.)
    const preventKeyboardShortcuts = (e) => {
      // Block Ctrl/Cmd + A, C, V, X, P (Select All, Copy, Paste, Cut, Print)
      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'p'].includes(e.key.toLowerCase())) {
        // Allow in input/textarea
        const tag = e.target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea') {
          return;
        }
        e.preventDefault();
        return false;
      }
      // Block F12 (DevTools), F5 (Refresh), Ctrl+Shift+I (DevTools)
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        return false;
      }
    };

    // Prevent drag events globally
    const preventDrag = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
        return false;
      }
    };

    // Prevent copy event
    const preventCopy = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
        return false;
      }
    };

    // Prevent select all
    const preventSelectStart = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
        return false;
      }
    };

    // Prevent long-press context menu on touch
    let longPressTimer;
    const handleTouchStart = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'button' || tag === 'select') {
        return;
      }
      // Clear any selection immediately
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    };

    const handleTouchMove = () => {
      // Clear selection during scroll
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    };

    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('keydown', preventKeyboardShortcuts);
    document.addEventListener('dragstart', preventDrag);
    document.addEventListener('selectstart', preventSelectStart); // NOT passive - must preventDefault
    document.addEventListener('copy', preventCopy);

    // Clear any accidental text selection on touch end
    const clearSelection = () => {
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    };
    document.addEventListener('touchend', clearSelection, { passive: true });
    document.addEventListener('mouseup', clearSelection, { passive: true });

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', clearSelection);
      document.removeEventListener('mouseup', clearSelection);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
      document.removeEventListener('dragstart', preventDrag);
      document.removeEventListener('selectstart', preventSelectStart);
      document.removeEventListener('copy', preventCopy);
    };
  }, []);

  return null;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Suspense lets react-i18next wait for resources without showing keys */}
    <Suspense fallback={null}>
      <BrowserRouter>
        <HealthProvider>
          <KioskTouchHelper />
          {/* Wrap App in HealthProvider to provide context */} 
        <App />
        </HealthProvider>
      </BrowserRouter>
    </Suspense>
  </StrictMode>
);
