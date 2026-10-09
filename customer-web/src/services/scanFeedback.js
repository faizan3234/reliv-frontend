// Prepare audio only in a user gesture; iOS can otherwise block confirmation.
let context;
export async function prepareScanSound() {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return false;
    if (!context || context.state === 'closed') context = new Audio();
    await context.resume();
    return context.state === 'running';
  } catch { return false; }
}
export function playScanSound() {
  if (!context || context.state !== 'running') return;
  try {
    const tone = context.createOscillator();
    const gain = context.createGain();
    tone.connect(gain); gain.connect(context.destination);
    const now = context.currentTime;
    tone.frequency.setValueAtTime(880, now);
    tone.frequency.setValueAtTime(1175, now + 0.09);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    tone.onended = () => { tone.disconnect(); gain.disconnect(); };
    tone.start(now); tone.stop(now + 0.23);
  } catch { /* Feedback must never interrupt checkout. */ }
}
