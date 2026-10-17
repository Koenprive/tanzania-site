/* Tanzania & Zanzibar 2026 — offline
   De site zelf (index.html, iconen) wordt bewaard, zodat hij ook zonder
   internet opent. Foto's en lodgefoto's die je één keer hebt gezien, blijven
   ook bewaard. Gegevens (jsonbin), uploaden (imgbb) en het weer gaan altijd
   rechtstreeks naar internet; de pagina valt zelf terug op haar laatste kopie. */
const VERSIE = 'tz-v5';
const SCHIL = 'tz-schil-' + VERSIE;
const BEELD = 'tz-beeld';
const FONT = 'tz-font';
const MAX_BEELDEN = 1500;

const SCHIL_BESTANDEN = ['./', 'index.html', 'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'img/hero.webp'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SCHIL).then(c => c.addAll(SCHIL_BESTANDEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('tz-schil-') && k !== SCHIL).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function metTijdslimiet(belofte, ms) {
  return new Promise((ok, fout) => {
    const t = setTimeout(() => fout(new Error('te traag')), ms);
    belofte.then(r => { clearTimeout(t); ok(r); }, e => { clearTimeout(t); fout(e); });
  });
}

// De pagina: eerst internet. Duurt dat langer dan 6 seconden (traag netwerk
// in Tanzania), dan meteen de bewaarde versie tonen — maar de download loopt
// door. Is die klaar en écht anders dan wat er stond, dan krijgt de pagina een
// seintje zodat ze 'Nieuwe versie — vernieuwen' kan laten zien. Is de inhoud
// gelijk, dan komt er geen seintje (anders stond die melding er op een traag
// netwerk élke keer, en leek vernieuwen niets te doen).
function isDePagina(req) {
  const p = new URL(req.url).pathname;
  return p === '/' || p === '/index.html';
}

async function pagina(req) {
  const cache = await caches.open(SCHIL);
  const vers = (async () => {
    const res = await fetch(req, {cache: 'no-store'});
    if (!res || !res.ok || !isDePagina(req)) return {res: res, nieuw: false};
    const kopie = res.clone();
    let nieuw = true;
    try {
      const oud = await cache.match('index.html');
      if (oud) {
        const [a, b] = await Promise.all([oud.clone().text(), res.clone().text()]);
        nieuw = a !== b;
      }
    } catch (e) {}
    if (nieuw) await cache.put('index.html', kopie);
    return {res: res, nieuw: nieuw};
  })();
  try {
    return (await metTijdslimiet(vers, 6000)).res;
  } catch (e) {
    const oud = (await cache.match('index.html')) || (await cache.match('./'));
    if (!oud) { try { return (await vers).res; } catch (e2) { return Response.error(); } }
    vers.then(async r => {
      if (!r || !r.res || !r.res.ok || !r.nieuw) return;
      const lijst = await self.clients.matchAll({type: 'window'});
      lijst.forEach(c => c.postMessage({type: 'nieuweVersie'}));
    }).catch(() => {});
    return oud;
  }
}

async function eigenBestand(req) {
  const cache = await caches.open(SCHIL);
  const hit = await cache.match(req, {ignoreSearch: true});
  const vers = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
  return hit || (await vers) || Response.error();
}

async function snoei() {
  const cache = await caches.open(BEELD);
  const ks = await cache.keys();
  if (ks.length > MAX_BEELDEN) await Promise.all(ks.slice(0, ks.length - MAX_BEELDEN).map(k => cache.delete(k)));
}

// Foto's: eerst uit de bewaarde voorraad, anders van internet (en dan bewaren).
async function beeld(req) {
  const cache = await caches.open(BEELD);
  const hit = await cache.match(req.url);
  // een 'ondoorzichtig' antwoord is prima voor <img>, maar niet voor de
  // collage/PDF-maker (die tekent op een canvas en vraagt om CORS)
  if (hit && !(req.mode === 'cors' && hit.type === 'opaque')) return hit;
  try {
    const res = await fetch(req);
    if (res && (res.ok || res.type === 'opaque')) {
      cache.put(req.url, res.clone()).then(snoei).catch(() => {});
    }
    return res;
  } catch (e) {
    return hit || Response.error();
  }
}

async function lettertype(req) {
  const cache = await caches.open(FONT);
  const hit = await cache.match(req);
  const vers = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => null);
  return hit || (await vers) || Response.error();
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // gegevens, uploaden en weer: nooit uit de voorraad
  if (/(^|\.)jsonbin\.io$|(^|\.)imgbb\.com$|open-meteo\.com$|jasoncameron\.dev$/.test(url.hostname) && url.hostname !== 'i.ibb.co') return;

  if (req.mode === 'navigate') { e.respondWith(pagina(req)); return; }
  if (url.origin === self.location.origin) { e.respondWith(eigenBestand(req)); return; }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) { e.respondWith(lettertype(req)); return; }
  if (req.destination === 'image' || /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url.pathname)) { e.respondWith(beeld(req)); return; }
});

// De pagina kan vragen om een lijst beelden alvast te bewaren
// (lodgefoto's, of — op verzoek — alle reisfoto's).
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'bewaar' && Array.isArray(d.urls)) e.waitUntil(bewaarLijst(d.urls, d.id, e.source));
  if (d.type === 'telling') e.waitUntil(telling(e.source));
});

async function telling(bron) {
  const c = await caches.open(BEELD);
  const n = (await c.keys()).length;
  if (bron) bron.postMessage({type: 'telling', beelden: n});
}

async function bewaarLijst(urls, id, bron) {
  const cache = await caches.open(BEELD);
  let klaar = 0, mis = 0;
  const rij = urls.slice();
  const meld = () => { if (bron && id) bron.postMessage({type: 'voortgang', id: id, klaar: klaar, mis: mis, totaal: urls.length}); };
  async function werker() {
    while (rij.length) {
      const u = rij.shift();
      try {
        if (!(await cache.match(u))) {
          let res = null;
          try { res = await fetch(u, {mode: 'cors'}); } catch (e) { res = null; }
          if (!res || !res.ok) res = await fetch(u, {mode: 'no-cors'});
          if (res && (res.ok || res.type === 'opaque')) await cache.put(u, res); else mis++;
        }
      } catch (e) { mis++; }
      klaar++;
      if (klaar % 3 === 0 || klaar === urls.length) meld();
    }
  }
  await Promise.all([werker(), werker(), werker(), werker()]);
  meld();
  await snoei();
}
