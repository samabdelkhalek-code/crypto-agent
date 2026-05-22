const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const DEFILLAMA_BASE = 'https://api.llama.fi';

let defiLlamaCache: DefiLlamaProtocol[] | null = null;

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

export async function searchCoins(query: string): Promise<CoinSearchResult[]> {
  const res = await fetch(`${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Suche fehlgeschlagen');
  const data = await res.json();
  return (data.coins || []).slice(0, 8);
}

export async function getCoinDetails(id: string): Promise<CoinDetails> {
  const res = await fetch(
    `${COINGECKO_BASE}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=false`
  );
  if (!res.ok) throw new Error('Token nicht gefunden');
  return res.json();
}

export async function getMarketChart(id: string): Promise<MarketChart> {
  const res = await fetch(
    `${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=usd&days=365&interval=daily`
  );
  if (!res.ok) return { prices: [], market_caps: [], total_volumes: [] };
  return res.json();
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
