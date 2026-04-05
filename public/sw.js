const CACHE_NOMBRE = "hogar-lizanggus-v1";
const RUTAS_CACHE = ["/", "/manifest.webmanifest", "/logo-app.svg"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(CACHE_NOMBRE).then((cache) => cache.addAll(RUTAS_CACHE)));
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) => Promise.all(claves.filter((c) => c !== CACHE_NOMBRE).map((c) => caches.delete(c)))),
  );
});

self.addEventListener("fetch", (evento) => {
  if (evento.request.method !== "GET") return;
  evento.respondWith(caches.match(evento.request).then((resp) => resp || fetch(evento.request)));
});
