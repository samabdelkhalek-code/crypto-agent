// ─────────────────────────────────────────────────────────────────────────────
//  coingecko-proxy.js — Cloudflare Worker
//
//  Proxy für die CoinGecko-API (api.coingecko.com). CoinGecko blockt keyless
//  Browser-Origins per CORS — der Browser bekommt „No Access-Control-Allow-Origin".
//  Dieser Worker holt die Daten SERVER-SEITIG (kein Browser-CORS), hängt optional
//  den Demo-Key (Secret) an, cached Erfolge kurz am Edge und gibt JSON mit
//  „Access-Control-Allow-Origin: *" zurück.
//
//  Nur GET auf /api/v3/* wird durchgereicht — KEIN offener Proxy.
//  Optionaler Key (hebt Rate-Limit auf 30/min):
//     echo <KEY> | wrangler secret put CG_DEMO_KEY -c wrangler.coingecko.toml
// ─────────────────────────────────────────────────────────────────────────────

const UPSTREAM = 'https://api.coingecko.com';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (obj, status) => new Response(JSON.stringify(obj), {
  status, headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'GET') return json({ error: 'only GET allowed' }, 405);

    const url = new URL(request.url);

    // Health-/Info-Antwort an der Wurzel.
    if (url.pathname === '/' || url.pathname === '') {
      return json({ ok: true, service: 'cryptoagent-cg-proxy', usage: '/api/v3/...' }, 200);
    }

    // Nur den offiziellen API-Pfad durchreichen — kein offener Proxy.
    if (!url.pathname.startsWith('/api/v3/')) {
      return json({ error: 'only /api/v3/* is proxied' }, 400);
    }

    const target = new URL(UPSTREAM + url.pathname + url.search);
    // Demo-Key server-seitig anhängen (falls gesetzt) — hebt das Rate-Limit an.
    if (env && env.CG_DEMO_KEY) {
      target.searchParams.set('x_cg_demo_api_key', String(env.CG_DEMO_KEY).trim());
    }

    // Erfolge kurz am Edge cachen (60s) → weniger Upstream-Calls, kein 429-Sturm.
    // Fehler nicht cachen (Self-Healing) + kleiner Retry bei 429/5xx.
    let upstream;
    for (let attempt = 0; attempt < 3; attempt++) {
      upstream = await fetch(target.toString(), {
        headers: { 'Accept': 'application/json' },
        cf: { cacheTtlByStatus: { '200-299': 60, '400-599': 0 }, cacheEverything: true },
      });
      if (upstream.ok) break;
      if ((upstream.status === 429 || upstream.status >= 500) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
      break;
    }

    if (!upstream) return json({ error: 'no upstream response' }, 502);

    // Antwort (auch Fehler) mit CORS-Headern durchreichen, damit der Client sie sieht.
    const out = new Response(upstream.body, upstream);
    for (const [k, v] of Object.entries(CORS)) out.headers.set(k, v);
    out.headers.set('Content-Type', 'application/json; charset=utf-8');
    out.headers.set('Cache-Control', upstream.ok ? 'public, max-age=60' : 'no-store');
    return out;
  },
};
