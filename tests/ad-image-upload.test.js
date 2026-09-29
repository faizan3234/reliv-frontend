import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareAdImageUpload } from '../src/utils/adImageUpload.js';

test('large photos are reduced before Wi-Fi upload, with safe fallback and cleanup', async () => {
  const previous = { document: globalThis.document, createImageBitmap: globalThis.createImageBitmap };
  let closed = 0, decoded = 0, drawing;
  const canvas = { getContext: () => ({ drawImage: (...args) => { drawing = args; } }),
    toBlob: callback => callback(new Blob(['compressed'], { type: 'image/webp' })) };
  globalThis.document = { createElement: () => canvas };
  globalThis.createImageBitmap = async () => { decoded++; return { width: 4000, height: 3000, close() { closed++; } }; };
  const photo = new File([new Uint8Array(1024 * 1024)], 'phone.jpg', { type: 'image/jpeg' });
  try {
    const optimized = await prepareAdImageUpload(photo);
    assert.equal(optimized.type, 'image/webp');
    assert.equal(optimized.name, 'phone.webp');
    assert.ok(optimized.size < photo.size);
    assert.equal(canvas.width, 1600); assert.equal(canvas.height, 1200);
    assert.deepEqual(drawing.slice(1), [0, 0, 1600, 1200]);
    assert.equal(closed, 1);
    const cancelled = new AbortController(); cancelled.abort();
    assert.equal(await prepareAdImageUpload(photo, cancelled.signal), photo);
    assert.equal(closed, 2);
    const video = new File([new Uint8Array(1024 * 1024)], 'phone.mov', { type: 'video/quicktime' });
    assert.equal(await prepareAdImageUpload(video), video);
    assert.equal(decoded, 2, 'video is not decoded/re-encoded on the phone');
    globalThis.createImageBitmap = async () => { throw new Error('unsupported decoder'); };
    assert.equal(await prepareAdImageUpload(photo), photo);
  } finally { Object.assign(globalThis, previous); }
});
