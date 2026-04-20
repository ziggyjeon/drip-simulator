const CACHE_NAME = 'drip-v4';
const ASSETS = [
  '/drip-simulator/',
  '/drip-simulator/index.html',
  '/drip-simulator/desktop.html',
  '/drip-simulator/mobile.html',
  '/drip-simulator/manifest.json',
  '/drip-simulator/icon-192.png',
  '/drip-simulator/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js',
  'https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap'
];

// 설치: 캐시에 모든 에셋 저장
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 활성화: 이전 버전 캐시 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 요청 처리: Cache-first (오프라인 우선)
self.addEventListener('fetch', e => {
  // POST 등 캐시 불가 요청은 그냥 통과
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // 성공 응답만 캐시에 저장
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // 오프라인이고 캐시에도 없으면 index.html 반환 (fallback)
        return caches.match('/drip-simulator/index.html');
      });
    })
  );
});
