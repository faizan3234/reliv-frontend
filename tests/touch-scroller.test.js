import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const source = (await readFile(new URL('../src/utils/kioskTouchScroller.js', import.meta.url), 'utf8'))
  .replace('export function initKioskTouchScroller', 'function initKioskTouchScroller');

function fixture() {
  const dom = new JSDOM('<!doctype html><div id="outer" style="overflow-y:auto"><div id="inner" style="overflow-y:auto"><button>Touch</button></div></div>', { runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom;
  const { document } = window;
  const root = document.documentElement;
  const inner = document.getElementById('inner');
  const outer = document.getElementById('outer');
  for (const [el, limit] of [[root, 2000], [outer, 200], [inner, 100]]) {
    let top = 0;
    Object.defineProperties(el, {
      scrollHeight: { value: limit + 100 }, clientHeight: { value: 100 },
      scrollTop: { get: () => top, set: (v) => { top = Math.max(0, Math.min(limit, v)); } },
    });
  }
  Object.defineProperty(document, 'scrollingElement', { value: root });
  window.requestAnimationFrame = () => 1;
  window.cancelAnimationFrame = () => {};
  window.eval(source + '\ninitKioskTouchScroller();');
  const touch = (type, touches) => {
    const event = new window.Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'touches', { value: touches.map(([identifier, clientY]) => ({ identifier, clientY, clientX: 30 })) });
    inner.querySelector('button').dispatchEvent(event);
    return event;
  };
  return { dom, window, root, inner, outer, touch };
}

test('nested wheel deltas chain once and preserve the unconsumed distance', () => {
  const { dom, window, root, inner, outer } = fixture();
  try {
    inner.scrollTop = 90; outer.scrollTop = 190;
    const wheel = new window.WheelEvent('wheel', { deltaY: 30, bubbles: true, cancelable: true });
    inner.dispatchEvent(wheel);
    assert.deepEqual([inner.scrollTop, outer.scrollTop, root.scrollTop], [100, 200, 10]);
    assert.equal(wheel.defaultPrevented, true);
    inner.dispatchEvent(new window.WheelEvent('wheel', { deltaY: 20, bubbles: true, cancelable: true }));
    assert.equal(root.scrollTop, 30);
  } finally { dom.window.close(); }
});

test('touch handoff preserves position and suppresses accidental clicks after drag', () => {
  const { dom, inner, touch, window } = fixture();
  try {
    touch('touchstart', [[1, 200]]);
    touch('touchmove', [[1, 180]]);
    assert.equal(inner.scrollTop, 20);
    touch('touchstart', [[1, 180], [2, 400]]);
    touch('touchend', [[2, 400]]);
    touch('touchmove', [[2, 380]]);
    assert.equal(inner.scrollTop, 40);
    touch('touchend', []);
    const click = new window.MouseEvent('click', { bubbles: true, cancelable: true });
    inner.querySelector('button').dispatchEvent(click);
    assert.equal(click.defaultPrevented, true);
  } finally { dom.window.close(); }
});

test('modal containment blocks background scrolling and wheel line units are respected', () => {
  const { dom, window, root, inner, outer } = fixture();
  try {
    inner.style.overscrollBehaviorY = 'contain';
    inner.scrollTop = 100;
    inner.dispatchEvent(new window.WheelEvent('wheel', { deltaY: 50, bubbles: true, cancelable: true }));
    assert.deepEqual([outer.scrollTop, root.scrollTop], [0, 0]);
    root.dispatchEvent(new window.WheelEvent('wheel', { deltaY: 2, deltaMode: 1, bubbles: true, cancelable: true }));
    assert.equal(root.scrollTop, 32);
  } finally { dom.window.close(); }
});
