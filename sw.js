// sw.js — 서비스 워커(오프라인에서도 열리게 해 주는 브라우저 일꾼)
// 처음 열 때 게임 파일을 저장해 두고, 다음부터는 인터넷이 없어도 게임이 뜬다.
// 페이지·스크립트는 늘 새 파일 먼저(인터넷이 없을 때만 저장본) → 새 index.html 과 옛 스크립트가 섞이지 않는다.
// 그림(webp·png)·글꼴은 저장본 먼저 → 그림을 바꿨으면 VERSION 숫자를 올리기. (tests/monetize.test.mjs 가 목록 누락을 잡는다)
const VERSION = 'jellypop-v0.15.3';
const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'i18n.js',
  'lang-en.js',
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
  // 페이지(HTML)·스크립트(JS)·설정 파일은 새 버전 먼저 → 인터넷이 없으면 저장본
  if (req.mode === 'navigate' || (!font && /\.(js|webmanifest|html)$/.test(url.pathname))) {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) {
          const c = await caches.open(VERSION);
          if (req.mode === 'navigate') {
            // 게임 페이지만 저장 (classic.html 같은 다른 페이지 제외). 주소 끝이 / 이든 index.html 이든 같은 저장본을 갱신
            if (/\/(index\.html)?$/.test(url.pathname)) { c.put('index.html', res.clone()); c.put('./', res.clone()); }
          } else c.put(new Request(url.origin + url.pathname), res.clone());
        }
        return res;
      } catch (err) {
        const hit = await caches.match(req, { ignoreSearch: true });
        return hit || (req.mode === 'navigate' ? (await caches.match('index.html')) || (await caches.match('./')) : Response.error());
      }
    })());
    return;
  }
  // 그림·글꼴은 저장본 먼저 → 없으면 받아서 저장
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: !font });
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok || res.type === 'opaque') { const c = await caches.open(VERSION); c.put(req, res.clone()); }
    return res;
  })());
});
