// getRandomValues works on the kiosk's local HTTP origin too.
export function feedbackId() {
  return 'FB-' + [...crypto.getRandomValues(new Uint8Array(16))].map(n=>n.toString(16).padStart(2,'0')).join('');
}
