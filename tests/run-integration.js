import { JSDOM, VirtualConsole } from 'jsdom';
import { build } from 'esbuild';
import { setTimeout as delay } from 'node:timers/promises';
import { MessageChannel } from 'node:worker_threads';

const bundle = await build({
  entryPoints: ['tests/browser.jsx'], bundle: true, write: false, format: 'iife',
  define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' },
  loader: { '.png': 'dataurl', '.svg': 'dataurl', '.css': 'empty' },
});
const console = new VirtualConsole();
const errors = [];
console.on('jsdomError', (error) => errors.push(error.message));
const dom = new JSDOM('<!doctype html><html><body><pre id="results">Running...</pre><div id="app"></div></body></html>', {
  url: 'http://localhost/tests/browser.html', runScripts: 'dangerously',
  pretendToBeVisual: true, virtualConsole: console,
});
const channels = [];
dom.window.MessageChannel = class extends MessageChannel {
  constructor() { super(); channels.push(this); }
};
try {
  dom.window.eval(bundle.outputFiles[0].text);
  let result = '';
  for (let attempt = 0; attempt < 300; attempt += 1) {
    result = dom.window.document.querySelector('#results').textContent;
    if (result.includes('FAIL ') || /ALL \d+ BROWSER CHECKS PASSED/.test(result)) break;
    await delay(50);
  }
  process.stdout.write(result + '\n');
  if (!/ALL \d+ BROWSER CHECKS PASSED/.test(result)) {
    process.stderr.write(errors.join('\n') + '\n');
    process.exitCode = 1;
  }
} finally {
  dom.window.close();
  for (const channel of channels) { channel.port1.close(); channel.port2.close(); }
}
