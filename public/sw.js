const CACHE = "adv-diary-v2";
const PAGES = ["/", "/cases", "/report"];
const ASSETS = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.allSettled([
          cache.addAll(ASSETS),
          ...PAGES.map((p) =>
            fetch(p)
              .then((res) => (res.ok ? cache.put(p, res.clone()) : undefined))
              .catch(() => undefined)
          ),
        ])
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Сеть в приоритете для всего: пользователь всегда получает актуальную версию.
  // Кэш используется только офлайн — иначе в превью и установленном PWA
  // может показаться устаревший снапшот приложения.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(
          (hit) =>
            hit ||
            (req.headers.get("accept")?.includes("text/html")
              ? caches.match("/")
              : undefined)
        )
      )
  );
});
