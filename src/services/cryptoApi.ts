// CoinGecko optional über den Cloudflare-Proxy (Edge-Caching + Demo-Key) leiten,
// sonst direkt. Aktiviert durch VITE_CG_PROXY in der .env.
const CG_PROXY = (import.meta.env.VITE_CG_PROXY ?? '').replace(/\/$/, '');
const COINGECKO_BASE = CG_PROXY ? `${CG_PROXY}/api/v3` : 'https://api.coingecko.com/api/v3';
const DEFILLAMA_BASE = 'https://api.llama.fi';
// Optionaler kostenloser CoinGecko-Demo-Key (30 Anfragen/Min statt ~10 keyless).
// In .env als VITE_CG_KEY setzen — wird als Query-Param angehängt (kein CORS-Preflight).
const CG_KEY = (import.meta.env.VITE_CG_KEY ?? '').trim();

let defiLlamaCache: DefiLlamaProtocol[] | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Robuster Fetch mit ZWEI Schutzschichten gegen CoinGeckos Limits:
//  1) Serialisierung: alle Anfragen laufen nacheinander mit Mindestabstand
//     (CG_GAP) durch eine Queue — so triggert die App NIE das Burst-Limit
//     (einzelne Calls klappen, gleichzeitige nicht → das war der „Netzwerkfehler").
//  2) Retry mit Backoff bei 429/5xx/Netzwerkaussetzern.
let cgQueue: Promise<unknown> = Promise.resolve();
let cgLast = 0;
const CG_GAP = 320; // ms Mindestabstand zwischen Anfragen

async function robustFetch(url: string, tries = 3, timeoutMs = 12000): Promise<Response> {
  const attempt = async (): Promise<Response> => {
    const wait = CG_GAP - (Date.now() - cgLast);
    if (wait > 0) await sleep(wait);
    cgLast = Date.now();
    // Demo-Key an CoinGecko-Anfragen anhängen (falls gesetzt) — hebt das Rate-Limit an.
    let target = url;
    if (CG_KEY && target.includes('api.coingecko.com')) {
      target += (target.includes('?') ? '&' : '?') + 'x_cg_demo_api_key=' + encodeURIComponent(CG_KEY);
    }
    let lastErr: unknown;
    for (let i = 0; i < tries; i++) {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), timeoutMs);
      try {
        const res = await fetch(target, { signal: ac.signal });
        clearTimeout(timer);
        if ((res.status === 429 || res.status >= 500) && i < tries - 1) {
          await sleep(1000 * (i + 1) + Math.random() * 500);
          continue;
        }
        return res;
      } catch (e) {
        clearTimeout(timer);
        lastErr = e;
        if (i < tries - 1) { await sleep(1000 * (i + 1) + Math.random() * 500); continue; }
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('Netzwerkfehler');
  };
  // in die serielle Queue einreihen (Fehler brechen die Kette nicht)
  const p = cgQueue.then(attempt, attempt);
  cgQueue = p.then(() => {}, () => {});
  return p;
}

export interface CoinSearchResult {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  market_cap_rank: number | null;
}

export interface CoinDetails {
  id: string;
  symbol: string;
  name: string;
  description: { en: string };
  image: { large: string; small: string; thumb: string };
  categories: string[];
  genesis_date: string | null;
  links: {
    homepage: string[];
    twitter_screen_name: string;
    subreddit_url: string;
    repos_url: { github: string[] };
  };
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    market_cap_rank: number;
    fully_diluted_valuation: { usd: number };
    total_volume: { usd: number };
    high_24h: { usd: number };
    low_24h: { usd: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d_in_currency: { usd: number };
    price_change_percentage_30d_in_currency: { usd: number };
    price_change_percentage_1y_in_currency: { usd: number };
    ath: { usd: number };
    ath_date: { usd: string };
    atl: { usd: number };
    atl_date: { usd: string };
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
  };
  community_data: {
    twitter_followers: number;
    reddit_subscribers: number;
    reddit_active_accounts: number;
  };
  developer_data: {
    stars: number;
    forks: number;
    pull_request_contributors: number;
    commit_count_4_weeks: number;
    code_additions_deletions_4_weeks: { additions: number; deletions: number };
  };
  sentiment_votes_up_percentage: number;
}

export interface MarketChart {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface DefiLlamaProtocol {
  name: string;
  slug: string;
  symbol: string;
  tvl: number;
  change_1d: number;
  change_7d: number;
  change_1m: number;
  mcap: number;
  revenue?: number;
  revenue30d?: number;
  fees30d?: number;
}

export interface TopCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
  sparkline_in_7d?: { price: number[] };
}

let topCoinsCache: TopCoin[] | null = null;

export async function getTopCoins(): Promise<TopCoin[]> {
  if (topCoinsCache) return topCoinsCache;
  const base = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=true&price_change_percentage=24h`;
  const grab = (page: number) =>
    robustFetch(`${base}&page=${page}`).then(r => r.ok ? r.json() : []).catch(() => []);
  const [p1, p2] = await Promise.all([grab(1), grab(2)]);
  const merged = [...p1, ...p2];
  if (merged.length) { topCoinsCache = merged; cacheWrite('cg:top', merged); return merged; }
  const cached = cacheRead<TopCoin[]>('cg:top'); // Abruf fehlgeschlagen → zuletzt bekannte Liste
  return cached?.data ?? [];
}

// Aktuelle Marktdaten für bestimmte Coin-IDs (für den Portfolio-Tracker) — ein Call.
export async function getMarketsByIds(ids: string[]): Promise<TopCoin[]> {
  if (!ids.length) return [];
  const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids.join(',')}&order=market_cap_desc&per_page=250&sparkline=false&price_change_percentage=24h`;
  try {
    const res = await robustFetch(url);
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export interface GlobalMarket {
  total_market_cap_usd: number;
  market_cap_change_24h: number;
  btc_dominance: number;
  eth_dominance: number;
  active_cryptocurrencies: number;
}

export interface FearGreed {
  value: number;
  label: string; // "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
}

export async function getGlobalMarket(): Promise<GlobalMarket | null> {
  try {
    const res = await robustFetch(`${COINGECKO_BASE}/global`);
    if (!res.ok) return null;
    const { data } = await res.json();
    return {
      total_market_cap_usd: data.total_market_cap?.usd ?? 0,
      market_cap_change_24h: data.market_cap_change_percentage_24h_usd ?? 0,
      btc_dominance: data.market_cap_percentage?.btc ?? 0,
      eth_dominance: data.market_cap_percentage?.eth ?? 0,
      active_cryptocurrencies: data.active_cryptocurrencies ?? 0,
    };
  } catch { return null; }
}

export async function getFearGreed(): Promise<FearGreed | null> {
  try {
    const res = await robustFetch('https://api.alternative.me/fng/?limit=1');
    if (!res.ok) return null;
    const { data } = await res.json();
    return { value: parseInt(data[0].value), label: data[0].value_classification };
  } catch { return null; }
}

export async function searchCoins(query: string): Promise<CoinSearchResult[]> {
  let res: Response;
  try {
    res = await robustFetch(`${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`);
  } catch { return []; } // Suche soll bei Netzwerk-Aussetzern nicht hart fehlschlagen
  if (!res.ok) return [];
  const data = await res.json();
  return (data.coins || []).slice(0, 8);
}

// ─── Client-Cache mit Stale-on-Error ────────────────────────────────────────
// Erfolgreiche Antworten werden in sessionStorage gespeichert. Bei einem
// CoinGecko-Aussetzer/Rate-Limit werden die zuletzt geladenen Daten (auch
// veraltet) zurückgegeben — statt eines harten Fehlers.
const CG_FRESH_MS = 5 * 60 * 1000; // 5 Min als „frisch"

function cacheRead<T>(key: string): { ts: number; data: T } | null {
  try { const s = sessionStorage.getItem(key); return s ? JSON.parse(s) : null; } catch { return null; }
}
function cacheWrite(key: string, data: unknown) {
  try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch { /* Quota/Privatmodus */ }
}

// CoinGecko liefert developer_data/community_data teils als null → absichern, damit
// die ~24 nachgelagerten Zugriffe (Risiko, Fundamental-Score, Dashboard) nicht crashen.
// Wird an JEDER Rückgabestelle angewandt (auch für alt-gecachte Antworten).
function normalizeCoin(d: CoinDetails): CoinDetails {
  const dev = { ...(d.developer_data || {}) } as CoinDetails['developer_data'];
  if (!dev.code_additions_deletions_4_weeks) dev.code_additions_deletions_4_weeks = { additions: 0, deletions: 0 };
  d.developer_data = dev;
  d.community_data = (d.community_data || {}) as CoinDetails['community_data'];
  return d;
}

export async function getCoinDetails(id: string): Promise<CoinDetails> {
  const key = `cg:detail:${id}`;
  const cached = cacheRead<CoinDetails>(key);
  if (cached && Date.now() - cached.ts < CG_FRESH_MS) return normalizeCoin(cached.data); // frisch → kein API-Call

  let res: Response;
  try {
    res = await robustFetch(
      `${COINGECKO_BASE}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=false`
    );
  } catch {
    if (cached) return normalizeCoin(cached.data); // Netzwerkfehler → letzte bekannte Daten (stale)
    throw new Error('Netzwerkfehler — CoinGecko ist gerade nicht erreichbar. Bitte in ein paar Sekunden erneut versuchen.');
  }
  if (res.status === 404) throw new Error(`Token "${id}" nicht gefunden. Bitte über die Suche auswählen.`);
  if (!res.ok) {
    if (cached) return normalizeCoin(cached.data); // 429/5xx → stale statt Fehler
    if (res.status === 429) throw new Error('CoinGecko Rate-Limit erreicht — bitte ~30 Sekunden warten und erneut versuchen.');
    throw new Error(`Fehler beim Laden (${res.status}) — bitte erneut versuchen.`);
  }
  const data = normalizeCoin(await res.json());
  cacheWrite(key, data);
  return data;
}

export async function getMarketChart(id: string): Promise<MarketChart> {
  const key = `cg:chart:${id}`;
  const cached = cacheRead<MarketChart>(key);
  if (cached && Date.now() - cached.ts < CG_FRESH_MS) return cached.data;
  const empty: MarketChart = { prices: [], market_caps: [], total_volumes: [] };
  try {
    const res = await robustFetch(
      `${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=usd&days=365&interval=daily`
    );
    if (!res.ok) return cached?.data ?? empty;
    const data = await res.json();
    cacheWrite(key, data);
    return data;
  } catch { return cached?.data ?? empty; }
}

export async function getDefiLlamaData(
  symbol: string,
  name: string
): Promise<DefiLlamaProtocol | null> {
  try {
    if (!defiLlamaCache) {
      const res = await fetch(`${DEFILLAMA_BASE}/protocols`);
      defiLlamaCache = await res.json();
    }
    const sym = symbol.toLowerCase();
    const nm = name.toLowerCase();
    return (
      defiLlamaCache!.find(
        (p) =>
          p.symbol?.toLowerCase() === sym ||
          p.name?.toLowerCase() === nm ||
          p.name?.toLowerCase() === nm.split(' ')[0]
      ) ?? null
    );
  } catch {
    return null;
  }
}

// ─── Market-wide context (Liquidität & Zyklus) ───────────────────────────────
// Marktweite Signale, die für alle Coins gelten — werden einmal geladen & gecacht.

export interface MarketContext {
  stablecoinTotalUsd: number | null;  // aggregierte Stablecoin-Marktkap. ("dry powder")
  stablecoinChange30d: number | null; // % Veränderung über 30 Tage (Liquiditäts-Momentum)
  btcPiCycleRatio: number | null;     // BTC 111T-MA / (2 × 350T-MA); ≥1 = historische Top-Zone
  // Makro (nur wenn VITE_FRED_PROXY gesetzt & Worker deployed)
  dxyChange3m: number | null;         // % Veränderung des Dollar-Index über ~3 Monate
  m2Yoy: number | null;               // % Veränderung der M2-Geldmenge ggü. Vorjahr
  netLiquidityUsd: number | null;     // Fed Net Liquidity (WALCL − RRP − TGA), USD
  netLiqChange3m: number | null;      // % Veränderung der Net Liquidity über ~3 Monate
  nasdaqChange3m: number | null;      // % Veränderung des NASDAQ Composite über ~3 Monate (Risiko-Regime)
  macroLiquidityBias: number | null;  // abgeleiteter annualisierter Liquiditäts-Bias
}

interface StablecoinChartPoint { totalCirculatingUSD?: { peggedUSD?: number } }

const FRED_PROXY = (import.meta.env.VITE_FRED_PROXY ?? '').replace(/\/$/, '');

interface FredPoint { date: number; value: number }
interface FredObs { date: string; value: string }

const DAY = 86_400_000;

// FRED JSON-API parsen: { observations: [{ date, value }] }  ("." = fehlend)
function parseFredJson(body: { observations?: FredObs[] }): FredPoint[] {
  const out: FredPoint[] = [];
  for (const o of body.observations ?? []) {
    const val = parseFloat(o.value);
    if (!o.date || !isFinite(val)) continue;
    const ts = new Date(o.date).getTime();
    if (isFinite(ts)) out.push({ date: ts, value: val });
  }
  return out;
}

function valueAtOrBefore(points: FredPoint[], targetTs: number): number | null {
  let best: number | null = null;
  for (const p of points) { if (p.date <= targetTs) best = p.value; else break; }
  return best;
}

async function fetchFred(id: string): Promise<FredPoint[] | null> {
  if (!FRED_PROXY) return null;
  try {
    // 500 Tage Historie: genug Puffer für den M2-Jahresvergleich, auch wenn die
    // jüngste M2-Meldung ~6 Wochen alt ist (sonst fällt der 365-Tage-Rückblick raus).
    const start = new Date(Date.now() - 500 * DAY).toISOString().slice(0, 10);
    const res = await fetch(`${FRED_PROXY}/?id=${id}&start=${start}`);
    if (!res.ok) return null;
    return parseFredJson(await res.json());
  } catch { return null; }
}
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

type MacroPick = Pick<MarketContext, 'dxyChange3m' | 'm2Yoy' | 'netLiquidityUsd' | 'netLiqChange3m' | 'nasdaqChange3m' | 'macroLiquidityBias'>;

// DXY (3M) + M2 YoY + Fed Net Liquidity (3M) + Nasdaq-Risiko-Regime (3M) → Makro-Bias.
async function getMacroLiquidity(): Promise<MacroPick> {
  const empty: MacroPick = { dxyChange3m: null, m2Yoy: null, netLiquidityUsd: null, netLiqChange3m: null, nasdaqChange3m: null, macroLiquidityBias: null };
  if (!FRED_PROXY) return empty;

  const [dxy, m2, walcl, rrp, tga, ndq] = await Promise.all([
    fetchFred('DTWEXBGS'), fetchFred('WM2NS'),
    fetchFred('WALCL'), fetchFred('RRPONTSYD'), fetchFred('WTREGEN'), fetchFred('NASDAQCOM'),
  ]);

  let dxyChange3m: number | null = null;
  if (dxy && dxy.length) {
    const last = dxy[dxy.length - 1];
    const past = valueAtOrBefore(dxy, last.date - 90 * DAY);
    if (past) dxyChange3m = ((last.value - past) / past) * 100;
  }

  let m2Yoy: number | null = null;
  if (m2 && m2.length) {
    const last = m2[m2.length - 1];
    const past = valueAtOrBefore(m2, last.date - 365 * DAY);
    if (past) m2Yoy = ((last.value - past) / past) * 100;
  }

  // Fed Net Liquidity = WALCL − RRP − TGA. ⚠️ Einheiten: WALCL & TGA in Mio. USD,
  // RRP in Mrd. USD → RRP × 1000. Anker = letztes WALCL-Datum (wöchentlich).
  let netLiquidityUsd: number | null = null;
  let netLiqChange3m: number | null = null;
  if (walcl && walcl.length && rrp && rrp.length && tga && tga.length) {
    const netAt = (ts: number): number | null => {
      const w = valueAtOrBefore(walcl, ts), r = valueAtOrBefore(rrp, ts), t = valueAtOrBefore(tga, ts);
      if (w == null || r == null || t == null) return null;
      return (w - r * 1000 - t) * 1e6; // Mio. → USD
    };
    const anchor = walcl[walcl.length - 1].date;
    const now = netAt(anchor);
    const past = netAt(anchor - 90 * DAY);
    netLiquidityUsd = now;
    if (now != null && past != null && past !== 0) netLiqChange3m = ((now - past) / past) * 100;
  }

  // Nasdaq-Risiko-Regime (3M-Trend): Krypto ist hoch-korreliert zum Tech-Komplex.
  let nasdaqChange3m: number | null = null;
  if (ndq && ndq.length) {
    const last = ndq[ndq.length - 1];
    const past = valueAtOrBefore(ndq, last.date - 90 * DAY);
    if (past) nasdaqChange3m = ((last.value - past) / past) * 100;
  }

  // Sub-Biases (jeweils annualisiert), dann Mittelwert der vorhandenen Signale —
  // so verfeinern zusätzliche Reihen den Bias, statt ihn aufzublähen.
  const subs: number[] = [];
  if (m2Yoy != null) subs.push(clamp(((m2Yoy - 3) / 100) * 1.2, -0.06, 0.10));      // M2 ~3 % = neutral
  if (dxyChange3m != null) subs.push(clamp(-(dxyChange3m / 100) * 1.5, -0.08, 0.08)); // steigender DXY = Gegenwind
  if (netLiqChange3m != null) subs.push(clamp((netLiqChange3m / 100) * 1.2, -0.07, 0.10)); // steigende Net Liq = Rückenwind
  if (nasdaqChange3m != null) subs.push(clamp((nasdaqChange3m / 100) * 0.8, -0.07, 0.08)); // steigender Nasdaq = Risk-on

  const macroLiquidityBias = subs.length ? subs.reduce((a, b) => a + b, 0) / subs.length : null;
  return { dxyChange3m, m2Yoy, netLiquidityUsd, netLiqChange3m, nasdaqChange3m, macroLiquidityBias };
}

let marketContextCache: MarketContext | null = null;

export async function getMarketContext(): Promise<MarketContext> {
  if (marketContextCache) return marketContextCache;
  const ctx: MarketContext = {
    stablecoinTotalUsd: null, stablecoinChange30d: null, btcPiCycleRatio: null,
    dxyChange3m: null, m2Yoy: null, netLiquidityUsd: null, netLiqChange3m: null, nasdaqChange3m: null, macroLiquidityBias: null,
  };

  // 1) Aggregierte Stablecoin-Liquidität (DeFiLlama, CORS-frei)
  try {
    const res = await fetch('https://stablecoins.llama.fi/stablecoincharts/all');
    if (res.ok) {
      const arr: StablecoinChartPoint[] = await res.json();
      const val = (x?: StablecoinChartPoint) => x?.totalCirculatingUSD?.peggedUSD ?? null;
      const last = val(arr[arr.length - 1]);
      const prev = val(arr[arr.length - 31]); // ~30 Tage zuvor
      ctx.stablecoinTotalUsd = last;
      if (last && prev) ctx.stablecoinChange30d = ((last - prev) / prev) * 100;
    }
  } catch { /* ignore */ }

  // 2) BTC Pi-Cycle aus der 365-Tage-Tageskurve (marktweites Zyklus-Top-Signal)
  try {
    const chart = await getMarketChart('bitcoin');
    const closes = chart.prices.map((p) => p[1]).filter((v) => isFinite(v) && v > 0);
    if (closes.length >= 350) {
      const avg = (n: number) => { const s = closes.slice(-n); return s.reduce((a, b) => a + b, 0) / s.length; };
      const ma350 = avg(350);
      if (ma350 > 0) ctx.btcPiCycleRatio = avg(111) / (2 * ma350);
    }
  } catch { /* ignore */ }

  // 3) Makro-Liquidität (DXY + M2) via FRED-Proxy — nur wenn konfiguriert
  Object.assign(ctx, await getMacroLiquidity());

  marketContextCache = ctx;
  return ctx;
}
