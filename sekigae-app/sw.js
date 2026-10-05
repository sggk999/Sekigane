/* 席替えアプリ:オフラインで動かすための仕組み
   - 一度開いたら、ネットにつながっていなくても起動できる
   - ネットにつながっているときは裏で最新版を取得し、次回起動時に反映される
   ※ 生徒の名簿などのデータはここでは扱わない(iPadの中だけに保存) */
const CACHE = 'sekigae-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async c => {
      const hit = await c.match(e.request, { ignoreSearch: true });
      const net = fetch(e.request)
        .then(r => { if (r.ok) c.put(e.request, r.clone()); return r; })
        .catch(() => hit);
      return hit || net;
    })
  );
});
