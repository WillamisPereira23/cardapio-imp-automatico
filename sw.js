/* Service worker: rede primeiro, cache como reserva (funciona offline após a 1ª visita) */
const V = "cardapio-v6",
  A = [
    "./",
    "index.html",
    "css/style.css",
    "js/config.js",
    "js/app.js",
    "manifest.json",
    "images/cheeseburger.jpg",
    "images/x-salada.jpg",
    "images/x-egg.jpg",
    "images/x-bacon.jpg",
    "images/x-bacon-egg.jpg",
    "images/x-bacon-egg-salada.jpg",
    "images/x-tudo.jpg",
    "images/turbo.jpg",
    "images/coca-lata.jpg",
    "images/coca-zero.jpg",
    "images/guarana.jpg",
    "images/coca-600.jpg",
    "images/suco.jpg",
    "images/agua.jpg",
    "images/agua-gas.jpg",
    "images/combo-classico.jpg",
    "images/combo-supremo.jpg",
    "images/batata-frita-pequena.jpg",
    "images/batata-frita-grande.jpg",
  ];
self.addEventListener("install", (e) =>
  e.waitUntil(
    caches
      .open(V)
      .then((c) => c.addAll(A))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((k) =>
        Promise.all(k.filter((x) => x !== V).map((x) => caches.delete(x))),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r)
      .then((x) => {
        const c = x.clone();
        caches.open(V).then((h) => h.put(r, c));
        return x;
      })
      .catch(() => caches.match(r)),
  );
});
