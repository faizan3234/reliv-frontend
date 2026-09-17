/**
 * kioskTouchScroller.js
 * Universal, high-performance touch & drag momentum scroller
 * Designed specifically for Waveshare & Raspberry Pi kiosk touchscreens
 * 
 * Key Features:
 * 1. Works with touchscreens (Waveshare capacitive/resistive), mice, and styluses.
 * 2. Deduplicates Pointer and Touch events so scrolling is never doubled.
 * 3. Supports kinetic momentum (inertia fling) with natural exponential decay.
 * 4. Touch-to-stop: touching the screen while it is coasting immediately stops it.
 * 5. Safe tap detection: taps (< 8px movement) trigger buttons, inputs, links instantly.
 * 6. Swipe gesture (> 8px movement) suppresses click so swiping over a button scrolls instead of activating it.
 * 7. Intelligently finds scrollable containers or scrolls the window/document.
 * 8. Seamlessly bubbles to window if a container hits its scroll boundary.
 */

let isInitialized = false;

export function initKioskTouchScroller() {
  if (isInitialized || typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  isInitialized = true;

  let activeSource = null; // 'pointer' or 'touch'
  let activeId = null;     // pointerId or identifier
  let isTracking = false;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let lastY = 0;
  let lastTime = 0;
  let scrollTarget = null;
  let velocityY = 0; // in px/ms
  let momentumRaf = null;
  let suppressClickUntil = 0;

  // Find the closest ancestor that is actually scrollable, or fallback to window
  function findScrollTarget(el) {
    let current = el;
    while (current && current !== document.body && current !== document.documentElement) {
      try {
        const style = window.getComputedStyle(current);
        const overflowY = style.overflowY;
        if (
          (overflowY === 'auto' || overflowY === 'scroll') &&
          current.scrollHeight > current.clientHeight + 4
        ) {
          return current;
        }
      } catch (err) {
        break;
      }
      current = current.parentElement;
    }
    return window;
  }

  // Perform scroll on target, bubbling to window if boundary reached
  function performScroll(target, dy) {
    if (!target || target === window || target === document.documentElement || target === document.body || target === document.scrollingElement) {
      window.scrollBy(0, -dy);
      return;
    }

    const prev = target.scrollTop;
    target.scrollTop -= dy;
    // If the container hit its boundary and didn't move, bubble remainder to window
    if (Math.abs(target.scrollTop - prev) < 0.5) {
      window.scrollBy(0, -dy);
    }
  }

  function stopMomentum() {
    if (momentumRaf) {
      cancelAnimationFrame(momentumRaf);
      momentumRaf = null;
    }
  }

  function startMomentum() {
    stopMomentum();
    if (!scrollTarget || Math.abs(velocityY) < 0.08) return;

    // Clamp velocity to avoid disorienting hyper-scrolls
    let v = Math.max(Math.min(velocityY, 3.2), -3.2);
    let lastFrameTime = performance.now();

    function step(now) {
      const dt = Math.min(now - lastFrameTime, 35);
      lastFrameTime = now;

      // Friction decay ~0.94 per 16ms
      const decay = Math.pow(0.94, dt / 16);
      v *= decay;

      if (Math.abs(v) < 0.04) {
        momentumRaf = null;
        return;
      }

      const stepDelta = v * dt;
      performScroll(scrollTarget, stepDelta);
      momentumRaf = requestAnimationFrame(step);
    }

    momentumRaf = requestAnimationFrame(step);
  }

  function onDown(x, y, target, source, id) {
    // Stop any ongoing inertia on new touch
    stopMomentum();

    // Check if interacting with an editable text field
    const tagName = target?.tagName?.toLowerCase() || '';
    const isEditable = tagName === 'input' || tagName === 'textarea' || target?.isContentEditable;

    activeSource = source;
    activeId = id;
    isTracking = true;
    isDragging = false;
    startX = x;
    startY = y;
    lastY = y;
    lastTime = performance.now();
    velocityY = 0;
    scrollTarget = findScrollTarget(target);

    // If tapping an editable input, let native focus happen unless dragging starts later
    if (isEditable) {
      // Allow tap to focus
    }
  }

  function onMove(x, y, source, id, e) {
    if (!isTracking || activeSource !== source) return;
    if (id !== null && activeId !== null && id !== activeId) return;

    const currentY = y;
    const currentX = x;
    const now = performance.now();
    const dt = Math.max(now - lastTime, 8); // at least 8ms to avoid division by zero

    const totalDiffY = currentY - startY;
    const totalDiffX = currentX - startX;

    if (!isDragging) {
      // Threshold: 7px vertical movement confirms drag intent
      if (Math.abs(totalDiffY) > 7 && Math.abs(totalDiffY) > Math.abs(totalDiffX) * 0.7) {
        isDragging = true;
      } else {
        return;
      }
    }

    const dy = currentY - lastY;
    if (Math.abs(dy) > 0.1) {
      performScroll(scrollTarget, dy);

      // Exponential moving average for velocity (px/ms)
      const instantV = dy / dt;
      velocityY = velocityY * 0.4 + instantV * 0.6;

      lastY = currentY;
      lastTime = now;

      // Prevent native ghost drag or text selection during active drag
      if (e && e.cancelable && e.preventDefault && typeof e.preventDefault === 'function') {
        // e.preventDefault();
      }
    }
  }

  function onUp(source, id) {
    if (!isTracking || activeSource !== source) return;
    if (id !== null && activeId !== null && id !== activeId) return;

    if (isDragging) {
      // Suppress subsequent click events for 280ms
      suppressClickUntil = performance.now() + 280;
      startMomentum();
    }

    isTracking = false;
    isDragging = false;
    activeSource = null;
    activeId = null;
  }

  // ========== POINTER EVENTS (Modern Chromium / Desktop / Touch) ==========
  window.addEventListener(
    'pointerdown',
    (e) => {
      // Ignore right clicks or secondary buttons
      if (e.button !== 0 && e.buttons !== 1 && e.pointerType === 'mouse') return;
      onDown(e.clientX, e.clientY, e.target, 'pointer', e.pointerId);
    },
    { passive: true }
  );

  window.addEventListener(
    'pointermove',
    (e) => {
      onMove(e.clientX, e.clientY, 'pointer', e.pointerId, e);
    },
    { passive: true }
  );

  window.addEventListener(
    'pointerup',
    (e) => {
      onUp('pointer', e.pointerId);
    },
    { passive: true }
  );

  window.addEventListener(
    'pointercancel',
    (e) => {
      onUp('pointer', e.pointerId);
    },
    { passive: true }
  );

  // ========== TOUCH EVENTS (Fallback for raw touch drivers) ==========
  window.addEventListener(
    'touchstart',
    (e) => {
      // If pointerdown already caught this, ignore to prevent duplicate deltas
      if (activeSource === 'pointer') return;
      if (e.touches && e.touches.length === 1) {
        const t = e.touches[0];
        onDown(t.clientX, t.clientY, e.target, 'touch', t.identifier);
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    (e) => {
      if (activeSource === 'pointer') return;
      if (e.touches && e.touches.length > 0) {
        const t = e.touches[0];
        onMove(t.clientX, t.clientY, 'touch', t.identifier, e);
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'touchend',
    (e) => {
      if (activeSource === 'pointer') return;
      const id = e.changedTouches?.[0]?.identifier ?? null;
      onUp('touch', id);
    },
    { passive: true }
  );

  window.addEventListener(
    'touchcancel',
    (e) => {
      if (activeSource === 'pointer') return;
      const id = e.changedTouches?.[0]?.identifier ?? null;
      onUp('touch', id);
    },
    { passive: true }
  );

  // ========== SUPPRESS ACCIDENTAL CLICKS AFTER SWIPING ==========
  // If user dragged more than threshold, prevent the click event from firing on the underlying button
  document.addEventListener(
    'click',
    (e) => {
      if (performance.now() < suppressClickUntil) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    },
    true // Capture phase to intercept before React or button listener
  );

  console.log('[KioskTouchScroller] 🚀 Universal touch momentum scroller active');
}
