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
// qr-scanner 1.4.2 recalculates its capture area on loadedmetadata/play,
// but not on video resize after applyConstraints or camera rotation.
// Keep this version-specific adapter here; the decoder must see the whole frame.
export default class PaymentQrScanner extends QrScanner {
  constructor(video, onDecode, options) {
    super(video, onDecode, options);
    this.refreshCaptureRegion = () => this._onLoadedMetaData();
    video.addEventListener('resize', this.refreshCaptureRegion);
  }
  destroy() {
    this.$video.removeEventListener('resize', this.refreshCaptureRegion);
    super.destroy();
  }
}
