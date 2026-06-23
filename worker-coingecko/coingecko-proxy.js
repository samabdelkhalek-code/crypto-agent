// ─────────────────────────────────────────────────────────────────────────────
//  coingecko-proxy.js — Cloudflare Worker
//
//  Proxy für die CoinGecko-API mit Edge-Caching. CoinGecko hat zwar CORS, aber das
//  schlüssellose API ist hart rate-limitiert. Durch Edge-Caching wird CoinGecko nur
//  noch ~1× pro Endpoint pro TTL getroffen (statt pro Besucher) — das Rate-Limit
//  fällt praktisch weg. Es werden nur /api/v3/*-Pfade weitergereicht (kein offener Proxy).
//
//  Deploy: cd worker-coingecko && npx wrangler deploy
// ─────────────────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Cache-Dauer je nach Endpoint (Sekunden)
function ttlFor(path) {
  if (path.includes('/market_chart')) return 3600; // Tageskurse ändern sich langsam
  if (path.startsWith('/api/v3/search')) return 600;
  return 90; // markets, global, coin details — Preise dürfen ~90s alt sein
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    // Debug: prüft nur, ob das Secret gebunden ist (gibt den Key NICHT aus).
    if (url.searchParams.get('debug') === 'keycheck') {
      const k = env && env.CG_DEMO_KEY ? env.CG_DEMO_KEY.trim() : '';
      return new Response(JSON.stringify({ keyPresent: !!k, keyLen: k.length }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }
    if (!url.pathname.startsWith('/api/v3/')) {
      return new Response(JSON.stringify({ error: 'only /api/v3/* is proxied' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const target = `https://api.coingecko.com${url.pathname}${url.search}`;
    const ttl = ttlFor(url.pathname);

    // Nur Erfolge cachen; bei 429/5xx kurzer Retry, Fehler werden nicht eingefroren.
    let upstream;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // CoinGecko verlangt bei Server-Anfragen einen beschreibenden User-Agent (sonst 403).
        const headers = { Accept: 'application/json', 'User-Agent': 'CryptoAgent/1.0 (+https://cryptoagent.pages.dev)' };
        // Optionaler kostenloser Demo-Key (Secret CG_DEMO_KEY) → deutlich höhere Limits.
        if (env && env.CG_DEMO_KEY) headers['x-cg-demo-api-key'] = env.CG_DEMO_KEY.trim();
        upstream = await fetch(target, {
          headers,
          cf: { cacheTtlByStatus: { '200-299': ttl, '400-599': 0 }, cacheEverything: true },
        });
      } catch {
        if (attempt < 2) { await new Promise((r) => setTimeout(r, 500 * (attempt + 1))); continue; }
        return new Response(JSON.stringify({ error: 'network error reaching CoinGecko' }), {
          status: 502, headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
      }
      if (upstream.ok || (upstream.status !== 429 && upstream.status < 500)) break;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }

    const out = new Response(upstream.body, upstream);
    for (const [k, v] of Object.entries(CORS)) out.headers.set(k, v);
    out.headers.set('Cache-Control', `public, max-age=${ttl}`);
    return out;
  },
};
