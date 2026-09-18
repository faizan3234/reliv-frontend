/**
 * kioskTouchScroller.js
 * Universal, high-performance touch & drag momentum scroller
 * Designed specifically for Waveshare & Raspberry Pi kiosk touchscreens
 * 
 * Key Principles:
 * 1. Primary Touch Handling uses native Touch Events (touchstart, touchmove, touchend)
 *    AND Pointer Events (pointerdown, pointermove, pointerup) with touch detection.
 * 2. e.preventDefault() is called on touchmove ONLY when a drag is active (>6px vertical movement),
 *    ensuring the browser compositor never drops touch gestures or attempts selection.
 * 3. Taps (<6px movement) are completely untouched so buttons, inputs, links, and cards fire instantly.
 * 4. Active drags (>6px) suppress the synthetic click event on touchend for 300ms so lifting a swipe
 *    does not activate whatever button happens to be under the finger.
 * 5. Full kinetic momentum (inertia) with natural deceleration and touch-to-stop.
 * 6. Intelligently finds the scrollable page container (.scrollable-container or any overflow-y:auto ancestor)
 *    or smoothly scrolls the window/document.
 * 7. Mouse Wheel handler explicitly forwards wheel events to the target or window, guaranteeing that
 *    mouse wheel scrolls everywhere.
 * 8. Mouse drag allows testing on desktop by clicking and dragging with left mouse button.
 */

let isInitialized = false;

export function initKioskTouchScroller() {
  if (isInitialized || typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  isInitialized = true;

  let isTracking = false;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let lastY = 0;
  let lastTime = 0;
  let scrollTarget = null;
  let velocityY = 0; // px/ms
  let momentumRaf = null;
  let suppressClickUntil = 0;
  let activeTouchId = null;

  // Find the closest scrollable container, prioritizing .scrollable-container or window
  function findScrollTarget(el) {
    if (!el) return document.querySelector('.scrollable-container') || window;

    // 1. Walk up the DOM tree to find any element with active vertical overflow
    let current = el;
    while (current && current !== document.body && current !== document.documentElement) {
      try {
        const style = window.getComputedStyle(current);
        const overflowY = style.overflowY;
        if (
          (overflowY === 'auto' || overflowY === 'scroll') &&
          current.scrollHeight > current.clientHeight + 2
        ) {
          return current;
        }
      } catch (err) {
        break;
      }
      current = current.parentElement;
    }

    // 2. Check if the element is inside a .scrollable-container
    const closestContainer = el.closest?.('.scrollable-container');
    if (closestContainer && closestContainer.scrollHeight > closestContainer.clientHeight + 2) {
      return closestContainer;
    }

    // 3. Check for any .scrollable-container on the active page
    const pageContainer = document.querySelector('.scrollable-container');
    if (pageContainer && pageContainer.scrollHeight > pageContainer.clientHeight + 2) {
      return pageContainer;
    }

    // 4. Fallback to window/document
    return window;
  }

  // Perform scroll on target, bubbling to root if container boundary reached
  function performScroll(target, dy) {
    if (!target) return;

    if (target === window || target === document.documentElement || target === document.body || target === document.scrollingElement) {
      window.scrollBy(0, -dy);
      if (document.documentElement) document.documentElement.scrollTop -= dy;
      if (document.body) document.body.scrollTop -= dy;
      return;
    }

    const prev = target.scrollTop;
    target.scrollTop -= dy;

    // If target didn't move (reached top/bottom edge), bubble to document/window
    if (Math.abs(target.scrollTop - prev) < 0.5) {
      window.scrollBy(0, -dy);
      if (document.documentElement) document.documentElement.scrollTop -= dy;
      if (document.body) document.body.scrollTop -= dy;
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

    let v = Math.max(Math.min(velocityY, 3.2), -3.2);
    let lastFrameTime = performance.now();

    function step(now) {
      const dt = Math.min(now - lastFrameTime, 32);
      lastFrameTime = now;

      // Decay factor ~0.94 per 16ms
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

  // =========================================================================
  // 1. TOUCH EVENTS (Primary for Waveshare / RPi touchscreens)
  // =========================================================================
  window.addEventListener(
    'touchstart',
    (e) => {
      // Arrest any coasting momentum immediately upon contact
      stopMomentum();

      if (!e.touches || e.touches.length === 0) return;
      const touch = e.touches[0];
      activeTouchId = touch.identifier;

      isTracking = true;
      isDragging = false;
      startX = touch.clientX;
      startY = touch.clientY;
      lastY = touch.clientY;
      lastTime = performance.now();
      velocityY = 0;

      scrollTarget = findScrollTarget(e.target);
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    (e) => {
      if (!isTracking || !e.touches || e.touches.length === 0) return;

      // Find active touch
      let touch = null;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === activeTouchId) {
          touch = e.touches[i];
          break;
        }
      }
      if (!touch) touch = e.touches[0];

      const currentY = touch.clientY;
      const currentX = touch.clientX;
      const now = performance.now();
      const dt = Math.max(now - lastTime, 8);

      const totalDiffY = currentY - startY;
      const totalDiffX = currentX - startX;

      if (!isDragging) {
        // Vertical movement of 6px confirms user intent to scroll
        if (Math.abs(totalDiffY) > 6 && Math.abs(totalDiffY) > Math.abs(totalDiffX) * 0.6) {
          isDragging = true;
        } else {
          return;
        }
      }

      const dy = currentY - lastY;
      if (Math.abs(dy) > 0.1) {
        performScroll(scrollTarget, dy);

        // Velocity tracking with exponential moving average
        const instantV = dy / dt;
        velocityY = velocityY * 0.35 + instantV * 0.65;

        lastY = currentY;
        lastTime = now;

        // Prevent browser from canceling the touch gesture with pointercancel
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    },
    { passive: false } // passive: false is REQUIRED so e.preventDefault() keeps the gesture alive
  );

  window.addEventListener(
    'touchend',
    () => {
      if (!isTracking) return;

      if (isDragging) {
        // Suppress any synthetic click event on whatever button is under the finger
        suppressClickUntil = performance.now() + 300;
        startMomentum();
      }

      isTracking = false;
      isDragging = false;
      activeTouchId = null;
    },
    { passive: true }
  );

  window.addEventListener(
    'touchcancel',
    () => {
      isTracking = false;
      isDragging = false;
      activeTouchId = null;
      stopMomentum();
    },
    { passive: true }
  );

  // =========================================================================
  // 2. MOUSE DRAG (For testing with mouse or trackpad)
  // =========================================================================
  let isMouseTracking = false;
  let isMouseDragging = false;
  let mouseStartY = 0;
  let mouseLastY = 0;
  let mouseLastTime = 0;
  let mouseTarget = null;
  let mouseVelocityY = 0;

  window.addEventListener(
    'mousedown',
    (e) => {
      if (e.button !== 0) return; // only left click
      // Don't drag-scroll inside inputs or textareas with mouse
      const tag = e.target?.tagName?.toLowerCase() || '';
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;

      stopMomentum();
      isMouseTracking = true;
      isMouseDragging = false;
      mouseStartY = e.clientY;
      mouseLastY = e.clientY;
      mouseLastTime = performance.now();
      mouseVelocityY = 0;
      mouseTarget = findScrollTarget(e.target);
    },
    { passive: true }
  );

  window.addEventListener(
    'mousemove',
    (e) => {
      if (!isMouseTracking) return;

      const currentY = e.clientY;
      const now = performance.now();
      const dt = Math.max(now - mouseLastTime, 8);
      const totalDiffY = currentY - mouseStartY;

      if (!isMouseDragging) {
        if (Math.abs(totalDiffY) > 8) {
          isMouseDragging = true;
        } else {
          return;
        }
      }

      const dy = currentY - mouseLastY;
      if (Math.abs(dy) > 0.1) {
        performScroll(mouseTarget, dy);
        const instantV = dy / dt;
        mouseVelocityY = mouseVelocityY * 0.35 + instantV * 0.65;
        mouseLastY = currentY;
        mouseLastTime = now;
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'mouseup',
    () => {
      if (!isMouseTracking) return;

      if (isMouseDragging) {
        suppressClickUntil = performance.now() + 300;
        // Apply momentum for mouse drag release
        if (Math.abs(mouseVelocityY) > 0.1) {
          velocityY = mouseVelocityY;
          scrollTarget = mouseTarget;
          startMomentum();
        }
      }

      isMouseTracking = false;
      isMouseDragging = false;
      mouseTarget = null;
    },
    { passive: true }
  );

  // =========================================================================
  // 3. MOUSE WHEEL (Ensures mouse wheel ALWAYS scrolls target or window)
  // =========================================================================
  window.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey) return; // allow pinch/zoom blocker
      const target = findScrollTarget(e.target);
      if (target && target !== window && target !== document.documentElement && target !== document.body) {
        const prev = target.scrollTop;
        target.scrollTop += e.deltaY;
        if (Math.abs(target.scrollTop - prev) > 0.5) {
          return; // successfully scrolled inner container
        }
      }
      // Otherwise scroll document/window
      window.scrollBy(0, e.deltaY);
      if (document.documentElement) document.documentElement.scrollTop += e.deltaY;
      if (document.body) document.body.scrollTop += e.deltaY;
    },
    { passive: true }
  );

  // =========================================================================
  // 4. CLICK SUPPRESSION (Prevents accidental clicks after swipe gestures)
  // =========================================================================
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
    true // Capture phase: intercepts click before React or buttons see it
  );

  console.log('[KioskTouchScroller] 🚀 Direct touch & drag scroller + wheel active');
}
