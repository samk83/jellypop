// sw.js — 서비스 워커(오프라인에서도 열리게 해 주는 브라우저 일꾼)
// 처음 열 때 게임 파일을 저장해 두고, 다음부터는 인터넷이 없어도 게임이 뜬다.
// 게임 파일을 바꿨으면 VERSION 숫자를 올리기 → 휴대폰이 새 파일을 받는다. (tests/monetize.test.mjs 가 목록 누락을 잡는다)
const VERSION = 'jellypop-v0.11.0';
const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'sprites3d.js',
  'jelly3d.js',
  'gummy.js',
  'stages.js',
  'banner.js',
  'story-data.js',
  'story.js',
  'monetize-config.js',
  'monetize.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'assets/bg/title.webp',
];
// 처음 화면에 꼭 필요하지 않은 큰 파일: 받아 오는 대로 저장 (첫 설치를 가볍게)
const LATER = [
  'sprites3d-scene.js',
  'assets/bg/w1.webp', 'assets/bg/w2.webp', 'assets/bg/w3.webp', 'assets/bg/w4.webp', 'assets/bg/w5.webp',
  'assets/map/w1.webp', 'assets/map/w2.webp', 'assets/map/w3.webp', 'assets/map/w4.webp', 'assets/map/w5.webp',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(PRECACHE);
    c.addAll(LATER).catch(() => {});   // 실패해도 설치는 계속 (다음에 쓸 때 저장)
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION && k.startsWith('jellypop-')) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !font) return;   // 광고 등 다른 사이트 요청은 건드리지 않는다
  // 페이지(HTML)는 새 버전 먼저 → 안 되면 저장본
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        const isGame = /\/(index\.html)?$/.test(url.pathname);   // classic.html 같은 다른 페이지는 저장 안 함
        if (isGame && res.ok) { const c = await caches.open(VERSION); c.put('index.html', res.clone()); }
        return res;
      } catch (err) {
        return (await caches.match(req, { ignoreSearch: true })) || (await caches.match('index.html'));
      }
    })());
    return;
  }
  // 나머지(스크립트·그림·글꼴)는 저장본 먼저 → 없으면 받아서 저장
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: !font });
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok || res.type === 'opaque') { const c = await caches.open(VERSION); c.put(req, res.clone()); }
    return res;
  })());
});
