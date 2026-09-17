// src/main.jsx
import React, { StrictMode, Suspense, useEffect, useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import { HealthProvider } from "./context/HealthContext.jsx";
import "./index.css";
import "./styles/touch-kiosk.css"; // Touch & Kiosk optimizations

// 👇 THIS LINE BOOTS i18next (must be before <App/> renders)
import "./i18n.js";

import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { recoverBlankScreen } from './utils/crashRecovery';
import { SpeechProvider, useSpeech } from "./context/SpeechContext.jsx";

// ── Kiosk Crash Watchdog ──
// If the screen goes blank (React tree unmounts or white-screens),
// recover the current screen once, then offer a manual retry.
if (typeof window !== "undefined") {
  let watchdogInterval = setInterval(() => {
    const root = document.getElementById("root");
    // If root is empty or has no visible content, the app crashed
    if (root && root.children.length === 0) {
      console.warn("[Watchdog] Blank screen detected — recovering current screen");
      clearInterval(watchdogInterval);
      recoverBlankScreen(root);
    }
  }, 5000);

  // Catch completely unhandled errors that bypass ErrorBoundary
  window.addEventListener("error", (e) => {
    console.error("[Watchdog] Unhandled error:", e.message);
    // Give ErrorBoundary 4s to handle it, then force reload
    setTimeout(() => {
      const root = document.getElementById("root");
      if (root && root.children.length === 0) {
        recoverBlankScreen(root);
      }
    }, 4000);
  });
}

// Kiosk Touch Scroll Helper - prevents text selection on touch drag
// eslint-disable-next-line react-refresh/only-export-components
function KioskTouchHelper() {
  const { pathname, key } = useLocation();
  const { stop } = useSpeech();

  useLayoutEffect(() => {
    stop();
    return () => stop();
  }, [key, stop]);

  useEffect(() => {
    // Skip kiosk protections on user-phone routes and hidden admin tools
    if (
      pathname.startsWith('/mobile-entry') ||
      pathname === '/h' ||
      pathname.startsWith('/admin')
    ) {
      return;
    }

    // Prevent context menu (right-click) on touch devices
    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
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

    // Touch & Pointer Drag-to-Scroll support for kiosk monitors & touchscreens
    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;
    let scrollTarget = null;
    let isTouch = false;

    const findScrollableParent = (el) => {
      let current = el;
      while (current && current !== document.body && current !== document.documentElement) {
        const style = window.getComputedStyle(current);
        const overflowY = style.overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight) {
          return current;
        }
        current = current.parentElement;
      }
      return document.scrollingElement || document.documentElement || document.body;
    };

    const handlePointerDown = (e) => {
      // Don't drag-scroll when interacting with buttons, inputs, links or select elements
      const tag = e.target.tagName?.toLowerCase() || '';
      if (
        tag === 'input' || 
        tag === 'textarea' || 
        tag === 'select' || 
        tag === 'button' ||
        e.target.closest('button') || 
        e.target.closest('a') || 
        e.target.closest('[role="button"]') ||
        e.target.closest('.no-drag-scroll')
      ) {
        return;
      }

      // Real touch devices use native hardware-accelerated touch panning with momentum.
      // Synthetic window.scrollTo would fight native touch gestures.
      isTouch = e.pointerType === 'touch';
      if (isTouch) {
        return;
      }

      isDragging = true;
      startY = e.clientY;
      scrollTarget = findScrollableParent(e.target);
      if (scrollTarget === document.documentElement || scrollTarget === document.body) {
        startScrollTop = window.scrollY || window.pageYOffset || 0;
      } else if (scrollTarget) {
        startScrollTop = scrollTarget.scrollTop;
      }
    };

    const handlePointerMove = (e) => {
      if (!isDragging || !scrollTarget || isTouch) return;
      const deltaY = e.clientY - startY;
      if (Math.abs(deltaY) > 3) {
        if (scrollTarget === document.documentElement || scrollTarget === document.body) {
          window.scrollTo(0, startScrollTop - deltaY);
        } else {
          scrollTarget.scrollTop = startScrollTop - deltaY;
        }
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
      scrollTarget = null;
      isTouch = false;
    };

    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('keydown', preventKeyboardShortcuts);
    document.addEventListener('dragstart', preventDrag);
    document.addEventListener('selectstart', preventSelectStart);
    document.addEventListener('copy', preventCopy);
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerUp, { passive: true });

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
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [pathname]);

  return null;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
    {/* Suspense lets react-i18next wait for resources without showing keys */}
    <Suspense fallback={<div role="status" className="min-h-screen flex items-center justify-center bg-white text-slate-700">Loading Reliv…</div>}>
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
