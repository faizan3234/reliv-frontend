import QrScanner from 'qr-scanner';

// Keep the library's native-detector compatibility checks and camera lifecycle.
// Its JS fallback failed our dense Pi QR fixtures. Substitute only that worker
// through its public engine factory, preserving the same message protocol.
const createOriginalEngine = QrScanner.createQrEngine.bind(QrScanner);
QrScanner.createQrEngine = async (...args) => {
  const engine = await createOriginalEngine(...args);
  if (!(engine instanceof Worker)) return engine;
  engine.terminate();
  return new Worker(new URL('./paymentQr.worker.js', import.meta.url), {type:'module'});
};
export default QrScanner;
