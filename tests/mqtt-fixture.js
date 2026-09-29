// Hardware boundary only; the production measurement components stay mounted.
export const clients = [];
export default {
  connect() {
    const callbacks = new Map(); let closed = false;
    const client = {
      connected: true,
      published: [],
      emit(event, ...args) { if (!closed) callbacks.get(event)?.(...args); },
      get closed() { return closed; },
      on(event, fn) { callbacks.set(event, fn); return client; },
      subscribe(_topic, options, callback) {
        const done = typeof options === 'function' ? options : callback;
        if (typeof done === 'function') done(null);
      },
      publish(_topic, _message, options, callback) {
        client.published.push([_topic, _message]);
        const done = typeof options === 'function' ? options : callback;
        if (typeof done === 'function') done(null);
      },
      unsubscribe() {}, removeListener(event) { callbacks.delete(event); },
      removeAllListeners() { callbacks.clear(); },
      end() { closed = true; callbacks.clear(); },
    };
    clients.push(client);
    queueMicrotask(() => { if (!closed) callbacks.get('connect')?.(); });
    return client;
  },
};
