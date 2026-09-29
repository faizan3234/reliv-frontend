// Reduce oversized phone photos before sending them across kiosk Wi-Fi.
// Unsupported browsers keep the original; the Pi still validates every upload.
export async function prepareAdImageUpload(file, signal) {
  if (!file.type.startsWith('image/') || file.size < 512 * 1024 || typeof createImageBitmap !== 'function') return file;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    if (signal?.aborted) return file;
    if (bitmap.width * bitmap.height > 33554432) return file;
    const scale = Math.min(1, 1600 / bitmap.width, 1600 / bitmap.height);
    if (scale === 1) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.9));
    if (signal?.aborted || !blob?.size || blob.size >= file.size) return file;
    const extension = blob.type === 'image/webp' ? 'webp' : 'png';
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.' + extension, { type: blob.type });
  } catch {
    return file;
  } finally { bitmap?.close(); }
}
