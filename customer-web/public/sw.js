// Cache only the app shell and same-origin static assets. Payment API requests,
// personal reports and Razorpay responses must always use the network.
const CACHE = 'reliv-customer-shell-v1';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'])));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('reliv-customer-shell-') && key !== CACHE).map(key => caches.delete(key)))));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate' && ['/', '/scan', '/pay', '/pay/'].includes(url.pathname)) {
    event.respondWith(fetch(event.request).catch(() => caches.match('/')));
  } else if (url.pathname.startsWith('/assets/') && /\.(js|css)$/.test(url.pathname)) {
    event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(response => {
      if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy))); }
      return response;
    })));
  }
});

// Every live tab must agree before replacing its worker. Never interrupt UPI.
self.addEventListener('message', event => {
  if (event.data?.type !== 'RELIV_ACTIVATE_IF_IDLE') return;
  event.waitUntil((async () => {
    const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const answers = await Promise.all(tabs.map(tab => new Promise(resolve => {
      const channel = new MessageChannel();
      const finish = value => { clearTimeout(timer); channel.port1.close(); resolve(value); };
      const timer = setTimeout(() => finish(false), 1500);
      channel.port1.onmessage = reply => finish(reply.data?.idle === true);
      tab.postMessage({ type: 'RELIV_CAN_UPDATE' }, [channel.port2]);
    })));
    if (answers.every(Boolean)) await self.skipWaiting();
  })());
});
