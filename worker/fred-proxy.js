// ─────────────────────────────────────────────────────────────────────────────
//  fred-proxy.js — Cloudflare Worker
//
//  Proxy für die FRED JSON-API (api.stlouisfed.org). FRED liefert keine CORS-Header
//  und die alte fredgraph.csv ist unzuverlässig — die JSON-API ist für Programm-
//  zugriff gedacht und stabil. Der Worker hängt den API-Key (Secret) an, cached
//  Erfolge 6h am Edge und gibt JSON mit „Access-Control-Allow-Origin: *" zurück.
//
//  Nur eine feste Allowlist an Series-IDs ist erlaubt — KEIN offener Proxy.
//  Secret setzen:  wrangler secret put FRED_API_KEY   (Deploy: siehe worker/README.md)
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED = new Set([
  'DTWEXBGS',  // Nominal Broad U.S. Dollar Index (DXY-Proxy), täglich
  'WM2NS',     // M2 Geldmenge, wöchentlich, nicht saisonbereinigt
  'M2SL',      // M2 Geldmenge, monatlich, saisonbereinigt
  'WALCL',     // Fed Bilanzsumme (Net-Liquidity-Komponente)
  'RRPONTSYD', // Overnight Reverse Repo
  'WTREGEN',   // Treasury General Account
  'NASDAQCOM', // NASDAQ Composite — Tech-/Risiko-Regime (Krypto ist hoch-korreliert)
]);

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

    if (!env || !env.FRED_API_KEY) {
      return json({ error: 'FRED_API_KEY secret not set — run: wrangler secret put FRED_API_KEY' }, 500);
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id || !ALLOWED.has(id)) return json({ error: 'unknown or missing FRED series id' }, 400);

    const start = url.searchParams.get('start'); // optional YYYY-MM-DD, begrenzt die Historie
    const params = new URLSearchParams({
      series_id: id, api_key: env.FRED_API_KEY.trim(), file_type: 'json', sort_order: 'asc',
    });
    if (start && /^\d{4}-\d{2}-\d{2}$/.test(start)) params.set('observation_start', start);
    const fredUrl = `https://api.stlouisfed.org/fred/series/observations?${params}`;

    // Nur Erfolge 6h am Edge cachen; Fehler nicht (Self-Healing) + kleiner Retry.
    let upstream;
    for (let attempt = 0; attempt < 3; attempt++) {
      upstream = await fetch(fredUrl, {
        cf: { cacheTtlByStatus: { '200-299': 21600, '400-599': 0 }, cacheEverything: true },
      });
      if (upstream.ok) break;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
    if (!upstream || !upstream.ok) {
      let detail = '';
      try { detail = (await upstream.text()).slice(0, 300); } catch { /* ignore */ }
      // FRED-Fehlertext enthält den Key NICHT — sicher zur Diagnose durchzureichen.
      return json({ error: 'upstream error', status: upstream ? upstream.status : 0, detail }, 502);
    }

    const out = new Response(upstream.body, upstream);
    for (const [k, v] of Object.entries(CORS)) out.headers.set(k, v);
    out.headers.set('Content-Type', 'application/json; charset=utf-8');
    out.headers.set('Cache-Control', 'public, max-age=21600');
    return out;
  },
};
