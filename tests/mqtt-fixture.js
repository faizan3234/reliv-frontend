// Hardware boundary only; the production measurement components stay mounted.
export default {
  connect() {
    const callbacks = new Map(); let closed = false;
    const client = {
      connected: true,
      on(event, fn) { callbacks.set(event, fn); return client; },
      subscribe(_topic, options, callback) {
        const done = typeof options === 'function' ? options : callback;
        if (typeof done === 'function') done(null);
      },
      publish(_topic, _message, options, callback) {
        const done = typeof options === 'function' ? options : callback;
        if (typeof done === 'function') done(null);
      },
      unsubscribe() {}, removeListener(event) { callbacks.delete(event); },
      removeAllListeners() { callbacks.clear(); },
      end() { closed = true; callbacks.clear(); },
    };
    queueMicrotask(() => { if (!closed) callbacks.get('connect')?.(); });
    return client;
  },
};
