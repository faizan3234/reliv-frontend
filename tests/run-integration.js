import { JSDOM, VirtualConsole } from 'jsdom';
import { build } from 'esbuild';
import { setTimeout as delay } from 'node:timers/promises';
import { MessageChannel } from 'node:worker_threads';

const bundle = await build({
  entryPoints: ['tests/browser.jsx'], bundle: true, write: false, format: 'iife', jsx: 'automatic',
  define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' },
  loader: { '.png': 'dataurl', '.svg': 'dataurl', '.css': 'empty' },
});
const console = new VirtualConsole();
const errors = [];
console.on('jsdomError', (error) => errors.push(error.message));
console.on('error', (...args) => errors.push(args.map(String).join(' ')));
console.on('warn', (...args) => process.stderr.write('WARN ' + args.map(String).join(' ') + '\n'));
const dom = new JSDOM('<!doctype html><html><body><pre id="results">Running...</pre><div id="app"></div></body></html>', {
  url: 'http://localhost/tests/browser.html', runScripts: 'dangerously',
  pretendToBeVisual: true, virtualConsole: console,
});
const channels = [];
// jsdom has no graphics device. Keep report animations mounted while replacing
// only canvas drawing; page state, hooks, effects and API handling remain real.
dom.window.HTMLCanvasElement.prototype.getContext = function (type) {
  if (type !== '2d') return null;
  return {
    canvas: this,
    clearRect() {}, fillRect() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, arc() {}, ellipse() {}, fill() {}, stroke() {},
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    setTransform() {}, resetTransform() {}, fillText() {},
    measureText: (text) => ({ width: text.length * 6 }),
  };
};
dom.window.MessageChannel = class extends MessageChannel {
  constructor() { super(); channels.push(this); }
};
try {
  dom.window.eval(bundle.outputFiles[0].text);
  let result = '';
  for (let attempt = 0; attempt < 600; attempt += 1) {
    result = dom.window.document.querySelector('#results').textContent;
    if (result.includes('FAIL ') || /ALL \d+ BROWSER CHECKS PASSED/.test(result)) break;
    await delay(50);
  }
  process.stdout.write(result + '\n');
  if (errors.length || !/ALL \d+ BROWSER CHECKS PASSED/.test(result)) {
    process.stderr.write(errors.join('\n') + '\n');
    process.exitCode = 1;
  }
} finally {
  dom.window.close();
  for (const channel of channels) { channel.port1.close(); channel.port2.close(); }
}
