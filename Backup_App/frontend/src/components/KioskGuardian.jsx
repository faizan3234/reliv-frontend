import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * KioskGuardian - 100% Kiosk Safe Version
 * 
 * BLOCKS on ALL pages:
 * - All external links (http://, https://)
 * - window.open() calls
 * - target="_blank" links
 * - Right-click context menu
 * - Middle-click (new tab)
 * - Ctrl+click, Shift+click, Meta+click
 * - Keyboard shortcuts (Ctrl+T, Ctrl+N, Ctrl+W, F5, F11, Alt+Tab, etc.)
 * - Drag and drop (prevents dragging links to new tab)
 * - (Back/forward is now allowed for in-app navigation)
 * - Developer tools shortcuts
 * 
 * ALSO:
 * - Inactivity timeout (120s → home)
 * - Attempts fullscreen on kiosk
 */
export default function KioskGuardian() {
  const navigate = useNavigate();
  const location = useLocation();
  const originalWindowOpen = useRef(null);
  const inactivityTimer = useRef(null);

  useEffect(() => {
    const currentPath = location.pathname;
    const HOME_PATH = "/";
    const INACTIVITY_TIMEOUT = 120000; // 120 seconds
    
    // Pages where inactivity timer should be disabled
    // /payment manages its own smarter timer (pauses during Razorpay modal)
    const noTimerPages = ['/order-success', '/report-1', '/report-2', '/report-3', '/report-4', '/report-5', '/payment'];
    const disableTimer = noTimerPages.some(page => currentPath.startsWith(page));
    
    console.log('[KioskGuardian] 🔒 KIOSK MODE ACTIVE on:', currentPath);

    // ========== FORCE RETURN TO HOME ==========
    const forceReturnHome = (reason) => {
      console.log(`[KioskGuardian] ⛔ BLOCKED: ${reason} - returning to home`);
      window.location.href = HOME_PATH;
    };

    // ========== 1. BLOCK window.open GLOBALLY ==========
    originalWindowOpen.current = window.open;
    window.open = function(url, ...args) {
      console.log('[KioskGuardian] ⛔ window.open BLOCKED:', url);
      return null; // Block silently
    };

    // ========== 2. BLOCK ALL EXTERNAL LINKS & NEW TABS ==========
    const handleClick = (e) => {
      // Block middle-click
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('[KioskGuardian] ⛔ Middle-click BLOCKED');
        return false;
      }
      
      // Block Ctrl+click, Shift+click, Meta+click (opens new tab)
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        const target = e.target.closest("a");
        if (target) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          console.log('[KioskGuardian] ⛔ Modifier+click on link BLOCKED');
          return false;
        }
      }

      const target = e.target.closest("a");
      if (!target) return;

      const href = target.getAttribute("href") || target.href || "";
      const targetAttr = target.getAttribute("target");

      // Block target="_blank" or "_new"
      if (targetAttr === "_blank" || targetAttr === "_new") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('[KioskGuardian] ⛔ New tab link BLOCKED:', href);
        return false;
      }

      // Allow internal navigation
      if (!href || href.startsWith("/") || href.startsWith("#") || href.startsWith("javascript:")) {
        return; // Safe internal link
      }

      // BLOCK ALL external URLs
      if (href.includes("://") || href.startsWith("//") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('[KioskGuardian] ⛔ External link BLOCKED:', href);
        return false;
      }
    };

    // ========== 3. BLOCK MOUSEDOWN ON EXTERNAL LINKS ==========
    const handleMouseDown = (e) => {
      // Block middle-click
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }

      const target = e.target.closest("a");
      if (!target) return;

      const href = target.getAttribute("href") || target.href || "";
      
      // Block external links on mousedown too
      if (href.includes("://") || href.startsWith("//") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    // ========== 4. BLOCK RIGHT-CLICK CONTEXT MENU ==========
    const handleContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[KioskGuardian] ⛔ Right-click BLOCKED');
      return false;
    };

    // ========== 5. BLOCK DANGEROUS KEYBOARD SHORTCUTS ==========
    const handleKeyDown = (e) => {
      const key = e.key?.toLowerCase();
      
      // Block F-keys (F1-F12) - F5 refresh, F11 fullscreen, F12 devtools
      if (e.key?.startsWith('F') && !isNaN(e.key.substring(1))) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[KioskGuardian] ⛔ F-key BLOCKED:', e.key);
        return false;
      }
      
      // Block Ctrl/Cmd combinations
      if (e.ctrlKey || e.metaKey) {
        const blockedKeys = [
          't', 'n', 'w', 'q',  // New tab, window, close
          'r', 'f5',           // Refresh
          'l', 'd',            // Address bar, bookmark
          'h', 'j',            // History, downloads
          'u', 's',            // View source, save
          'p',                 // Print (could access print dialog)
          'shift',             // Ctrl+Shift combinations
          'o',                 // Open file
          'g', 'f',            // Find (could expose URL bar)
        ];
        
        if (blockedKeys.includes(key)) {
          e.preventDefault();
          e.stopPropagation();
          console.log('[KioskGuardian] ⛔ Keyboard shortcut BLOCKED: Ctrl+' + key);
          return false;
        }
        
        // Block Ctrl+Shift combinations (dev tools, etc.)
        if (e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          console.log('[KioskGuardian] ⛔ Ctrl+Shift shortcut BLOCKED');
          return false;
        }
      }
      
      // Block Alt combinations (Alt+Tab, Alt+F4, etc.)
      if (e.altKey) {
        const blockedAltKeys = ['tab', 'f4', 'd', 'home', 'left', 'right'];
        if (blockedAltKeys.includes(key)) {
          e.preventDefault();
          e.stopPropagation();
          console.log('[KioskGuardian] ⛔ Alt shortcut BLOCKED: Alt+' + key);
          return false;
        }
      }
      
      // Block Escape (might close fullscreen/modals unexpectedly)
      // But allow it for internal use (closing our own modals)
      // if (key === 'escape') {
      //   e.preventDefault();
      //   return false;
      // }
    };

    // ========== 6. BLOCK DRAG AND DROP ==========
    const handleDragStart = (e) => {
      const target = e.target.closest("a");
      if (target) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[KioskGuardian] ⛔ Drag link BLOCKED');
        return false;
      }
      
      // Block dragging images too (can be dragged to new tab)
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleDrop = (e) => {
      // Prevent dropping anything (files, links, etc.)
      e.preventDefault();
      e.stopPropagation();
      console.log('[KioskGuardian] ⛔ Drop BLOCKED');
      return false;
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // ========== 7. ALLOW BROWSER BACK/FORWARD FOR IN-APP NAVIGATION ==========
    // Back/forward is allowed so users can return to previous screens.
    // External navigation is still prevented elsewhere.

    // ========== 8. BLOCK BEFOREUNLOAD (accidental page leave) ==========
    const handleBeforeUnload = (e) => {
      // Only block on payment page (Razorpay might need this)
      if (currentPath === '/payment') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    // ========== 9. INACTIVITY TIMER ==========
    const resetInactivityTimer = () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      
      if (!disableTimer) {
        inactivityTimer.current = setTimeout(() => {
          console.log('[KioskGuardian] ⏰ Inactivity timeout - returning home');
          window.location.href = HOME_PATH;
        }, INACTIVITY_TIMEOUT);
      }
    };

    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    // ========== 10. ATTEMPT FULLSCREEN (for production kiosk) ==========
    const attemptFullscreen = () => {
      // Only try fullscreen on production domains
      const isProduction = window.location.hostname !== 'localhost' && 
                           window.location.hostname !== '127.0.0.1';
      
      if (isProduction && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          // Silently fail - fullscreen needs user interaction
        });
      }
    };

    // Try fullscreen on first user interaction
    const handleFirstInteraction = () => {
      attemptFullscreen();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    // ========== ATTACH ALL EVENT LISTENERS ==========
    
    // Click/Mouse events
    document.addEventListener("click", handleClick, { capture: true, passive: false });
    document.addEventListener("mousedown", handleMouseDown, { capture: true, passive: false });
    window.addEventListener("click", handleClick, { capture: true, passive: false });
    window.addEventListener("mousedown", handleMouseDown, { capture: true, passive: false });
    
    // Context menu (right-click)
    document.addEventListener("contextmenu", handleContextMenu, { capture: true, passive: false });
    window.addEventListener("contextmenu", handleContextMenu, { capture: true, passive: false });
    
    // Keyboard
    document.addEventListener("keydown", handleKeyDown, { capture: true, passive: false });
    window.addEventListener("keydown", handleKeyDown, { capture: true, passive: false });
    
    // Drag and drop
    document.addEventListener("dragstart", handleDragStart, { capture: true, passive: false });
    document.addEventListener("drop", handleDrop, { capture: true, passive: false });
    document.addEventListener("dragover", handleDragOver, { capture: true, passive: false });
    window.addEventListener("dragstart", handleDragStart, { capture: true, passive: false });
    window.addEventListener("drop", handleDrop, { capture: true, passive: false });
    window.addEventListener("dragover", handleDragOver, { capture: true, passive: false });
    
    // Browser navigation
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    // Inactivity detection
    document.addEventListener("mousemove", handleUserActivity, { passive: true });
    document.addEventListener("mousedown", handleUserActivity, { passive: true });
    document.addEventListener("keydown", handleUserActivity, { passive: true });
    document.addEventListener("touchstart", handleUserActivity, { passive: true });
    document.addEventListener("scroll", handleUserActivity, { passive: true });
    
    // Fullscreen on first interaction
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    
    // Start inactivity timer
    resetInactivityTimer();
    
    console.log('[KioskGuardian] 🔒 All protections ACTIVE');

    // ========== CLEANUP ==========
    return () => {
      // Restore window.open
      if (originalWindowOpen.current) {
        window.open = originalWindowOpen.current;
      }
      
      // Remove all event listeners
      document.removeEventListener("click", handleClick, { capture: true });
      document.removeEventListener("mousedown", handleMouseDown, { capture: true });
      window.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("mousedown", handleMouseDown, { capture: true });
      
      document.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      window.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      
      document.removeEventListener("dragstart", handleDragStart, { capture: true });
      document.removeEventListener("drop", handleDrop, { capture: true });
      document.removeEventListener("dragover", handleDragOver, { capture: true });
      window.removeEventListener("dragstart", handleDragStart, { capture: true });
      window.removeEventListener("drop", handleDrop, { capture: true });
      window.removeEventListener("dragover", handleDragOver, { capture: true });
      
      window.removeEventListener("beforeunload", handleBeforeUnload);
      
      document.removeEventListener("mousemove", handleUserActivity);
      document.removeEventListener("mousedown", handleUserActivity);
      document.removeEventListener("keydown", handleUserActivity);
      document.removeEventListener("touchstart", handleUserActivity);
      document.removeEventListener("scroll", handleUserActivity);
      
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      
      // Clear inactivity timer
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      
      console.log('[KioskGuardian] 🔓 Protections deactivated');
    };
  }, [navigate, location]);

  return null; // Invisible guardian
}

