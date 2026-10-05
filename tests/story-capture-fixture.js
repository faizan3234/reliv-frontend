// Rasterisation is covered separately in real Chromium; jsdom tests payment/UI state.
export default async function capture() {
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;return canvas;
}
export async function toPng() {
 return 'data:image/png;base64,synthetic-png';
}
export async function toBlob() {
 return new Blob(['synthetic-png'], { type: 'image/png' });
}
