// src/main.jsx
import React, { StrictMode, Suspense, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import { HealthProvider } from "./context/HealthContext.jsx";
import "./index.css";
import "./styles/touch-kiosk.css"; // Touch & Kiosk optimizations

// 👇 THIS LINE BOOTS i18next (must be before <App/> renders)
import "./i18n.js";

import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { SpeechProvider } from "./context/SpeechContext.jsx";

// ── Kiosk Crash Watchdog ──
// If the screen goes blank (React tree unmounts or white-screens),
// auto-reload to home after 5 seconds. Prevents stuck kiosk.
if (typeof window !== "undefined") {
  let watchdogInterval = setInterval(() => {
    const root = document.getElementById("root");
    // If root is empty or has no visible content, the app crashed
    if (root && root.children.length === 0) {
      console.warn("[Watchdog] Blank screen detected — reloading to home");
      clearInterval(watchdogInterval);
      window.location.href = "/";
    }
  }, 5000);

  // Catch completely unhandled errors that bypass ErrorBoundary
  window.addEventListener("error", (e) => {
    console.error("[Watchdog] Unhandled error:", e.message);
    // Give ErrorBoundary 4s to handle it, then force reload
    setTimeout(() => {
      const root = document.getElementById("root");
      if (root && root.children.length === 0) {
        window.location.href = "/";
      }
    }, 4000);
  });
}

// Kiosk Touch Scroll Helper - prevents text selection on touch drag
function KioskTouchHelper() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Skip kiosk protections on user-phone routes and hidden admin tools
    if (
      pathname.startsWith('/mobile-entry') ||
      pathname === '/h' ||
      pathname.startsWith('/admin-x7k9')
    ) {
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
  }, [pathname]);

  return null;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
    {/* Suspense lets react-i18next wait for resources without showing keys */}
    <Suspense fallback={null}>
      <BrowserRouter>
        <HealthProvider>
          <SpeechProvider>
          <KioskTouchHelper />
          {/* Wrap App in HealthProvider to provide context */} 
        <App />
          </SpeechProvider>
        </HealthProvider>
      </BrowserRouter>
    </Suspense>
    </ErrorBoundary>
  </StrictMode>
);
