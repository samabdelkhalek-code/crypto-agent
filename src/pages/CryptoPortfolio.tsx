import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, ExternalLink, MessageCircle, GitBranch, TrendingUp,
  Flame, Lock, Users, BarChart2, AlertTriangle, CheckCircle,
  Globe, ChevronDown, ArrowLeft, Clock, Shield, Zap, Activity, Star,
} from 'lucide-react';
import {
  searchCoins, getCoinDetails, getMarketChart, getDefiLlamaData, getTopCoins,
  getGlobalMarket, getFearGreed, getMarketContext, getMarketsByIds,
  type CoinSearchResult, type CoinDetails, type MarketChart, type DefiLlamaProtocol,
  type TopCoin, type GlobalMarket, type FearGreed, type MarketContext,
} from '../services/cryptoApi';
import {
  computeIndicators, computeForecast, rankBeta, portfolioProjection, computeMarketRegime,
  type Indicators, type Forecast, type Scenario,
} from '../services/forecast';
import { getProjectMeta } from '../data/projectMetadata';

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2): string {
  if (!isFinite(n)) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3)  return `$${(n / 1e3).toFixed(2)}K`;
  if (n >= 1)    return `$${n.toFixed(decimals)}`;
  return `$${n.toPrecision(4)}`;
}

function fmtNum(n: number): string {
  if (!n || !isFinite(n)) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return `${n.toLocaleString()}`;
}

function fmtPct(n: number | undefined | null): string {
  if (n == null || !isFinite(n)) return '—';
  return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function pctColor(n: number | undefined | null): string {
  if (n == null || !isFinite(n)) return 'text-slate-400';
  if (n > 0) return 'text-emerald-400';
  if (n < 0) return 'text-red-400';
  return 'text-slate-400';
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function ago(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const years = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
  return years > 0 ? `${years} Jahr${years > 1 ? 'e' : ''}` : '< 1 Jahr';
}

// ─── Category ────────────────────────────────────────────────────────────────

interface CategoryInfo {
  label: string; gradient: string; badge: string;
  audience: string; emoji: string; blurb: string;
  problem: string; solution: string;
}

function getCategoryInfo(categories: string[]): CategoryInfo {
  const c = categories.map((x) => x.toLowerCase()).join(' ');
  if (c.includes('layer 1') || c.includes('smart contract platform') || c.includes('proof of work') || c.includes('proof of stake')) return {
    label: 'Layer-1 Blockchain', gradient: 'from-blue-600/30 to-sky-600/20', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    audience: 'Entwickler, Unternehmen & alle die dezentrale Apps nutzen', emoji: '🌐',
    blurb: 'Eine eigenständige Blockchain, auf der Entwickler dezentrale Anwendungen (dApps) und Smart Contracts erstellen können.',
    problem: 'Zentralisierte Server können zensiert, gehackt oder abgeschaltet werden. Nutzer verlassen sich auf Intermediäre, die ihre Daten kontrollieren.',
    solution: 'Eine dezentrale Blockchain läuft auf tausenden Computern gleichzeitig — kein einzelner Akteur kann sie abschalten oder zensieren. Entwickler bauen darauf Apps ohne Erlaubnis.',
  };
  if (c.includes('layer 2') || c.includes('rollup') || categories.some(cat => /^layer.?2$/i.test(cat) || /^optimism$/i.test(cat) || /^arbitrum$/i.test(cat))) return {
    label: 'Layer-2 Skalierung', gradient: 'from-violet-600/30 to-purple-600/20', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    audience: 'Nutzer, die günstigere & schnellere Transaktionen wollen', emoji: '⚡',
    blurb: 'Layer-2 baut auf einer bestehenden Blockchain auf und macht Transaktionen dramatisch günstiger und schneller.',
    problem: 'Ethereum-Transaktionen können $10–$100 kosten und Minuten dauern. Das macht kleine Zahlungen und häufige Interaktionen unwirtschaftlich.',
    solution: 'Layer-2 bündelt Tausende Transaktionen zusammen und verarbeitet sie off-chain — Kosten sinken auf Cents, Geschwindigkeit steigt auf Sekunden.',
  };
  if (c.includes('oracle')) return {
    label: 'Blockchain-Oracle', gradient: 'from-blue-600/30 to-indigo-600/20', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    audience: 'Entwickler, die reale Daten in Blockchains einbinden', emoji: '🔮',
    blurb: 'Oracles verbinden Blockchains mit der realen Welt — sie liefern verlässliche Preis-, Wetter- und andere Echtdaten für Smart Contracts.',
    problem: 'Blockchains können von sich aus keine Daten aus der realen Welt abrufen (Aktienkurse, Wetter, Sportergebnisse). Ohne verlässliche Datenquellen sind viele Smart Contracts nutzlos.',
    solution: 'Oracle-Netzwerke aggregieren Daten aus vielen unabhängigen Quellen, prüfen sie und liefern manipulationssichere Echtdaten direkt in Smart Contracts.',
  };
  if (c.includes('meme')) return {
    label: 'Meme-Coin', gradient: 'from-pink-600/30 to-rose-600/20', badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    audience: 'Spekulanten & Community-Mitglieder', emoji: '🎭',
    blurb: 'Ein Meme-Coin basiert primär auf Community-Hype und Viral-Marketing, nicht auf technologischem Nutzen.',
    problem: 'Kein klassisches technisches Problem — der Mehrwert liegt in der Community-Zugehörigkeit und viraler Verbreitung.',
    solution: 'Durch starke Online-Community und Social-Media-Präsenz erzeugt er Nachfrage. Der Wert entsteht durch kollektives Glauben und Spekulation.',
  };
  if (c.includes('gaming') || c.includes('play-to-earn')) return {
    label: 'Blockchain-Gaming', gradient: 'from-green-600/30 to-teal-600/20', badge: 'bg-green-500/20 text-green-300 border-green-500/30',
    audience: 'Gamer, die digitale Assets wirklich besitzen wollen', emoji: '🎮',
    blurb: 'Ein Gaming-Token ermöglicht echtes Eigentum an In-Game-Items und Belohnungen in Blockchain-Spielen.',
    problem: 'In klassischen Spielen gehören Items dem Hersteller. Spieler investieren hunderte Stunden, können aber nie wirklich Eigentümer ihrer digitalen Gegenstände sein.',
    solution: 'Blockchain-Gaming-Token verbriefen echtes Eigentum: Items werden als NFTs gehalten, können gehandelt werden und gehören dem Spieler — nicht dem Studio.',
  };
  if (c.includes('nft')) return {
    label: 'NFT & Digitale Kunst', gradient: 'from-orange-600/30 to-yellow-600/20', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    audience: 'Kreative, Sammler & Künstler', emoji: '🎨',
    blurb: 'NFT-Plattformen ermöglichen den Kauf, Verkauf und die Erstellung einzigartiger digitaler Kunstwerke und Sammlerstücke.',
    problem: 'Digitale Dateien sind kopierbar — Künstler können keine Echtheit oder Knappheit ihrer Werke beweisen. Provenienz und Urheberschaft sind schwer nachweisbar.',
    solution: 'NFTs schaffen digitale Knappheit: jedes Token ist einzigartig, die Eigentumshistorie ist öffentlich auf der Blockchain nachverfolgbar.',
  };
  if (c.includes('decentralized exchange') || c.includes('automated market')) return {
    label: 'Dezentrale Börse', gradient: 'from-cyan-600/30 to-blue-600/20', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    audience: 'Trader und DeFi-Nutzer', emoji: '🔄',
    blurb: 'Eine dezentrale Börse (DEX) ermöglicht den direkten Handel von Krypto-Assets ohne zentrale Kontrollinstanz.',
    problem: 'Zentralisierte Börsen (Binance, Coinbase) kontrollieren die Gelder der Nutzer. Bei Hacks oder Insolvenzen verlieren Nutzer alles — wie bei FTX geschehen.',
    solution: 'DEXs erlauben direkten Handel Wallet-zu-Wallet. Niemand verwahrt die Gelder der Nutzer — Transaktionen laufen autonom über Smart Contracts.',
  };
  if (c.includes('defi') || c.includes('lending') || c.includes('stablecoin') || c.includes('yield')) return {
    label: 'Decentralized Finance', gradient: 'from-yellow-600/30 to-amber-600/20', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    audience: 'Nutzer ohne Bankzugang & erfahrene DeFi-Anleger', emoji: '🏦',
    blurb: 'DeFi-Protokolle ersetzen traditionelle Finanzdienstleistungen (Kredite, Zinsen, Handel) durch transparente Smart Contracts.',
    problem: '1,4 Milliarden Menschen weltweit haben keinen Zugang zu Bankdienstleistungen. Selbst wer eine Bank hat, erhält kaum Zinsen und zahlt hohe Gebühren.',
    solution: 'DeFi-Protokolle sind für jeden zugänglich — nur eine Wallet wird benötigt. Kredite, Zinsen und Handel laufen ohne Intermediäre, transparent und 24/7.',
  };
  if (c.includes('privacy') || c.includes('zero knowledge')) return {
    label: 'Privacy & ZK', gradient: 'from-gray-600/30 to-slate-600/20', badge: 'bg-gray-500/20 text-gray-300 border-slate-500/30',
    audience: 'Datenschutz-bewusste Nutzer & Entwickler', emoji: '🔒',
    blurb: 'Privacy-Protokolle schützen Transaktionsdaten und ermöglichen anonyme oder vertrauliche Zahlungen.',
    problem: 'Öffentliche Blockchains sind vollständig transparent — jeder kann sehen, wer wann wieviel wohin überwiesen hat. Das ist für viele Anwendungen inakzeptabel.',
    solution: 'Zero-Knowledge-Proofs erlauben es, die Gültigkeit einer Transaktion zu beweisen, ohne deren Inhalt preiszugeben. Datenschutz ohne Vertrauensanforderung.',
  };
  if (c.includes('exchange') || c.includes('derivatives')) return {
    label: 'Krypto-Börse', gradient: 'from-cyan-600/30 to-blue-600/20', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    audience: 'Trader, die Krypto-Assets kaufen und verkaufen wollen', emoji: '🏛️',
    blurb: 'Ein Börsen-Token berechtigt zu reduzierten Handelsgebühren und Governance-Rechten auf der jeweiligen Krypto-Handelsplattform.',
    problem: 'Krypto-Handelsbörsen verdienen Milliarden — Token-Inhaber profitieren davon, wenn der Exchange-Token ihnen Rabatte und Stimmrechte sichert.',
    solution: 'Der Exchange-Token teilt den Plattform-Erfolg mit Nutzern: Gebührenrabatte, Staking-Renditen und Governance-Mitsprache direkt proportional zum Token-Besitz.',
  };
  return {
    label: 'Krypto-Token', gradient: 'from-slate-600/30 to-slate-700/20', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    audience: 'Crypto-Investoren & Technologie-Interessierte', emoji: '💎',
    blurb: 'Ein dezentralisiertes digitales Asset auf der Blockchain mit spezifischen Nutzungsanwendungen im jeweiligen Ökosystem.',
    problem: 'Spezifisches Problem und Anwendungsfall des Projekts — Details im Whitepaper des Projekts.',
    solution: 'Token-basiertes Anreizsystem zur Koordination eines dezentralisierten Netzwerks oder Ökosystems.',
  };
}

function getRiskLevel(coin: CoinDetails): { label: string; color: string; score: number } {
  let score = 0;
  const rank = coin.market_data.market_cap_rank;
  if (rank && rank <= 10) score += 30;
  else if (rank && rank <= 50) score += 20;
  else if (rank && rank <= 200) score += 10;
  if (coin.genesis_date) {
    const years = (Date.now() - new Date(coin.genesis_date).getTime()) / (365.25 * 24 * 3600 * 1000);
    if (years >= 5) score += 25;
    else if (years >= 2) score += 15;
    else if (years >= 1) score += 8;
  }
  const circ = coin.market_data.circulating_supply;
  const max = coin.market_data.max_supply;
  if (max && circ / max > 0.7) score += 15;
  else if (max && circ / max > 0.4) score += 8;
  if (coin.developer_data.commit_count_4_weeks > 50) score += 10;
  else if (coin.developer_data.commit_count_4_weeks > 10) score += 5;
  if (score >= 55) return { label: 'Niedrig', color: 'text-emerald-400', score };
  if (score >= 30) return { label: 'Mittel', color: 'text-yellow-400', score };
  return { label: 'Hoch', color: 'text-red-400', score };
}

// ─── History ──────────────────────────────────────────────────────────────────

interface HistoryEntry {
  id: string; name: string; symbol: string; image: string;
  price: number; pct24h: number | null; marketCap: number;
  riskLabel: string; riskColor: string;
  categoryEmoji: string; categoryLabel: string; ts: number;
}

const HISTORY_KEY = 'crypto-history';

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}

function saveHistory(entries: HistoryEntry[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries)); } catch { /* ignore */ }
}

function HistoryPanel({ history, onSelect, onClear }: { history: HistoryEntry[]; onSelect: (id: string) => void; onClear: () => void }) {
  if (history.length === 0) return null;
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-widest">
          <Clock size={13} /> Zuletzt analysiert ({history.length} / 100)
        </div>
        <button onClick={onClear} className="text-slate-600 hover:text-slate-400 text-xs transition-colors cursor-pointer bg-transparent border-none">
          Verlauf löschen
        </button>
      </div>

      {/* Compact table — same style as Top-200, no height limit */}
      <div className="overflow-hidden border border-white/10" style={{ borderRadius: 8 }}>
        <div className="grid grid-cols-[1fr_90px_70px_80px_80px] gap-2 px-4 py-2 bg-white/5 text-xs text-slate-500 uppercase tracking-widest border-b border-white/10">
          <span>Name</span>
          <span className="text-right">Preis</span>
          <span className="text-right">24h</span>
          <span className="text-right hidden sm:block">Risiko</span>
          <span className="text-right hidden sm:block">Typ</span>
        </div>
        {history.map(e => {
          const pct = e.pct24h;
          return (
            <button
              key={e.id}
              onClick={() => onSelect(e.id)}
              className="w-full grid grid-cols-[1fr_90px_70px_80px_80px] gap-2 px-4 py-2.5 hover:bg-white/6 transition-colors text-left border-b border-white/5 last:border-0 cursor-pointer"
            >
              <span className="flex items-center gap-2 min-w-0">
                {e.image
                  ? <img src={e.image} alt={e.name} className="w-5 h-5 shrink-0" style={{ borderRadius: '50%' }} />
                  : <div className="w-5 h-5 shrink-0 bg-white/10 flex items-center justify-center text-xs" style={{ borderRadius: '50%' }}>{e.symbol[0]}</div>
                }
                <span className="text-white text-sm font-medium truncate">{e.name}</span>
                <span className="text-slate-600 text-xs uppercase hidden md:inline">{e.symbol}</span>
              </span>
              <span className="text-right text-white text-sm self-center font-mono">{fmt(e.price)}</span>
              <span className={`text-right text-sm self-center font-semibold ${pctColor(pct)}`}>{pct != null ? fmtPct(pct) : '—'}</span>
              <span className={`text-right text-xs self-center font-semibold hidden sm:block ${e.riskColor}`}>{e.riskLabel}</span>
              <span className="text-right text-slate-500 text-xs self-center hidden sm:block truncate">{e.categoryEmoji} {e.categoryLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

const WATCHLIST_KEY = 'crypto-watchlist';
function loadWatchlist(): string[] { try { return JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]'); } catch { return []; } }
function saveWatchlist(ids: string[]) { try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(ids)); } catch { /* */ } }

function HistoryCard({ entry, onSelect }: { entry: HistoryEntry; onSelect: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect(entry.id)}
      className="text-left bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/8 transition-all p-3 cursor-pointer"
      style={{ borderRadius: 8 }}
    >
      <div className="flex items-center gap-2 mb-2 min-w-0">
        {entry.image
          ? <img src={entry.image} alt={entry.name} className="w-6 h-6 shrink-0" style={{ borderRadius: '50%' }} />
          : <div className="w-6 h-6 shrink-0 bg-white/10 flex items-center justify-center text-xs" style={{ borderRadius: '50%' }}>{entry.symbol[0]}</div>}
        <span className="text-white text-sm font-semibold truncate">{entry.name}</span>
        <span className="text-slate-600 text-xs uppercase ml-auto shrink-0">{entry.symbol}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-white text-sm font-mono">{fmt(entry.price)}</span>
        <span className={`text-xs font-semibold ${pctColor(entry.pct24h)}`}>{entry.pct24h != null ? fmtPct(entry.pct24h) : '—'}</span>
      </div>
      <div className="mt-1.5 text-xs text-slate-500 truncate">{entry.categoryEmoji} {entry.categoryLabel}</div>
    </button>
  );
}

function WatchlistPanel({ ids, history, onSelect }: { ids: string[]; history: HistoryEntry[]; onSelect: (id: string) => void }) {
  if (ids.length === 0) return null;
  const entries = ids.map(id => history.find(h => h.id === id)).filter(Boolean) as HistoryEntry[];
  if (entries.length === 0) return null;
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 text-amber-400 text-xs uppercase tracking-widest mb-3">
        <Star size={13} fill="#F59E0B" /> Watchlist ({entries.length})
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {entries.map(e => <HistoryCard key={e.id} entry={e} onSelect={onSelect} />)}
      </div>
    </div>
  );
}

// ─── Marktlage-Ampel ─────────────────────────────────────────────────────────

function MarketRegimeBanner({ market, fg, ctx }: { market: GlobalMarket | null; fg: FearGreed | null; ctx: MarketContext | null }) {
  const r = computeMarketRegime(fg, ctx);
  const ring = r.emoji === '🟢' ? 'border-emerald-500/30' : r.emoji === '🟡' ? 'border-yellow-500/30' : r.emoji === '🟠' ? 'border-orange-500/30' : 'border-red-500/30';
  return (
    <div className={`border ${ring} bg-white/3 p-4`} style={{ borderRadius: 10 }}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-lg">{r.emoji}</span>
        <span className="text-slate-400 text-xs uppercase tracking-widest">Marktlage</span>
        <span className="text-white font-bold">{r.label}</span>
        {market && (
          <span className="text-slate-500 text-xs ml-auto">
            🌍 {fmt(market.total_market_cap_usd)} <span className={pctColor(market.market_cap_change_24h)}>{fmtPct(market.market_cap_change_24h)}</span>
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {r.drivers.map((d, i) => {
          const c = d.impact === 'pos' ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/8'
            : d.impact === 'neg' ? 'text-red-300 border-red-500/30 bg-red-500/8'
            : 'text-slate-300 border-white/10 bg-white/5';
          return <span key={i} className={`text-[11px] px-2 py-0.5 border ${c}`} style={{ borderRadius: 6 }}>{d.label}</span>;
        })}
      </div>
      <div className="text-[11px] text-slate-600 mt-2">Aggregiertes Forward-Signal aus Zyklus, Liquidität, Sentiment &amp; Tech-Markt — keine Finanzberatung.</div>
    </div>
  );
}

// ─── Portfolio Tracker ──────────────────────────────────────────────────────

interface Holding { id: string; symbol: string; name: string; image: string; amount: number; buyPrice?: number; buyDate?: string; }
const PORTFOLIO_KEY = 'crypto-portfolio';

// §23 EStG Haltefrist: steuerfrei ab dem Tag NACH dem 1-Jahres-Jahrestag (kalendergenau,
// konsistent mit crypto-tax). Gibt gehaltene Tage, Status & Tage bis steuerfrei zurück.
function holdingPeriod(buyDate?: string): { heldDays: number; taxFree: boolean; daysToFree: number } | null {
  if (!buyDate) return null;
  const t = new Date(buyDate).getTime();
  if (!isFinite(t)) return null;
  const heldDays = Math.floor((Date.now() - t) / 86_400_000);
  const anniv = new Date(buyDate); anniv.setFullYear(anniv.getFullYear() + 1);
  const freeTs = anniv.getTime() + 86_400_000; // Tag nach dem Jahrestag
  return { heldDays, taxFree: Date.now() >= freeTs, daysToFree: Math.max(0, Math.ceil((freeTs - Date.now()) / 86_400_000)) };
}
function loadPortfolio(): Holding[] { try { return JSON.parse(localStorage.getItem(PORTFOLIO_KEY) || '[]'); } catch { return []; } }
function savePortfolio(h: Holding[]) { try { localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(h)); } catch { /* */ } }

function AddHolding({ onAdd }: { onAdd: (coin: { id: string; symbol: string; name: string; image: string }, amount: number, buyPrice?: number, buyDate?: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CoinSearchResult[]>([]);
  const [picked, setPicked] = useState<CoinSearchResult | null>(null);
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [buyDate, setBuyDate] = useState('');
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const onQuery = (v: string) => {
    setQuery(v); setPicked(null);
    clearTimeout(timer.current);
    if (!v.trim()) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => { setResults(await searchCoins(v)); setOpen(true); }, 350);
  };

  const submit = () => {
    const amt = parseFloat(amount.replace(',', '.'));
    if (!picked || !isFinite(amt) || amt <= 0) return;
    const bp = parseFloat(buyPrice.replace(',', '.'));
    onAdd(
      { id: picked.id, symbol: picked.symbol.toUpperCase(), name: picked.name, image: picked.thumb }, amt,
      isFinite(bp) && bp > 0 ? bp : undefined,
      buyDate || undefined,
    );
    setQuery(''); setPicked(null); setAmount(''); setBuyPrice(''); setBuyDate(''); setResults([]); setOpen(false);
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 placeholder-slate-600 outline-none';
  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input value={query} onChange={e => onQuery(e.target.value)}
            placeholder="Coin suchen (z.B. Bitcoin)…" className={inputCls} style={{ borderRadius: 6 }} />
          {open && results.length > 0 && !picked && (
            <div className="absolute top-full left-0 right-0 mt-1 z-40 overflow-y-auto" style={{ maxHeight: 240, borderRadius: 8, background: '#1a2035', border: '1px solid rgba(255,255,255,0.15)' }}>
              {results.map(r => (
                <button key={r.id} onClick={() => { setPicked(r); setQuery(r.name); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/8 text-left cursor-pointer">
                  {r.thumb && <img src={r.thumb} alt={r.name} className="w-5 h-5" style={{ borderRadius: '50%' }} />}
                  <span className="text-white text-sm">{r.name}</span>
                  <span className="text-slate-500 text-xs uppercase">{r.symbol}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <input value={amount} onChange={e => setAmount(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          placeholder="Menge" inputMode="decimal" className={`${inputCls} sm:w-28`} style={{ borderRadius: 6 }} />
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={buyPrice} onChange={e => setBuyPrice(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          placeholder="Einstand $/Stück (optional)" inputMode="decimal" className={`${inputCls} flex-1`} style={{ borderRadius: 6 }} />
        <input value={buyDate} onChange={e => setBuyDate(e.target.value)} type="date" title="Kaufdatum (optional, für §23-Haltefrist)"
          className={`${inputCls} flex-1`} style={{ borderRadius: 6, colorScheme: 'dark' }} />
        <button onClick={submit} disabled={!picked || !amount}
          className="px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          style={{ borderRadius: 6, background: 'rgba(16,185,129,0.18)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.4)' }}>
          + Hinzufügen
        </button>
      </div>
    </div>
  );
}

function PortfolioPanel({ onSelect }: { onSelect: (id: string) => void }) {
  const [holdings, setHoldings] = useState<Holding[]>(loadPortfolio);
  const [prices, setPrices] = useState<Record<string, TopCoin>>({});
  const [showForecast, setShowForecast] = useState(false);

  useEffect(() => {
    if (!holdings.length) return;
    getMarketsByIds(holdings.map(h => h.id))
      .then(list => Object.fromEntries(list.map(c => [c.id, c])) as Record<string, TopCoin>)
      .then(setPrices)
      .catch(() => {});
  }, [holdings]);

  const update = (next: Holding[]) => { setHoldings(next); savePortfolio(next); };
  const removeHolding = (id: string) => update(holdings.filter(h => h.id !== id));
  const setAmount = (id: string, amount: number) => update(holdings.map(h => h.id === id ? { ...h, amount } : h));
  const addHolding = (coin: { id: string; symbol: string; name: string; image: string }, amount: number, buyPrice?: number, buyDate?: string) => {
    const ex = holdings.find(h => h.id === coin.id);
    if (ex) update(holdings.map(h => h.id === coin.id
      ? { ...h, amount: h.amount + amount, buyPrice: buyPrice ?? h.buyPrice, buyDate: buyDate ?? h.buyDate }
      : h));
    else update([...holdings, { ...coin, amount, buyPrice, buyDate }]);
  };

  const downloadFile = (name: string, content: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const csvCell = (v: unknown) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (Array.isArray(data)) {
          const clean = data.filter((h): h is Holding => h && typeof h.id === 'string' && typeof h.amount === 'number' && h.amount > 0);
          if (clean.length) update(clean);
        }
      } catch { /* ungültige Datei */ }
    };
    reader.readAsText(file);
  };

  const rows = holdings.map(h => {
    const p = prices[h.id];
    const price = p?.current_price ?? 0;
    const value = price * h.amount;
    const cost = h.buyPrice != null ? h.buyPrice * h.amount : null;
    const pl = cost != null ? value - cost : null;
    const plPct = cost && cost > 0 ? (value / cost - 1) * 100 : null;
    return { h, price, value, cost, pl, plPct, hp: holdingPeriod(h.buyDate), pct24: p?.price_change_percentage_24h ?? null, rank: p?.market_cap_rank ?? null, image: p?.image || h.image };
  }).sort((a, b) => b.value - a.value);

  const total = rows.reduce((s, r) => s + r.value, 0);
  const total24Ago = rows.reduce((s, r) => s + (r.pct24 != null ? r.value / (1 + r.pct24 / 100) : r.value), 0);
  const totalPct = total24Ago > 0 ? (total / total24Ago - 1) * 100 : null;
  const change24Abs = total - total24Ago;

  // Unrealisiertes G/V (nur über Bestände mit Einstandspreis)
  const totalCost = rows.reduce((s, r) => s + (r.cost ?? 0), 0);
  const valueWithCost = rows.reduce((s, r) => s + (r.cost != null ? r.value : 0), 0);
  const totalPL = totalCost > 0 ? valueWithCost - totalCost : null;
  const totalPLPct = totalCost > 0 ? (valueWithCost / totalCost - 1) * 100 : null;

  const beta = total > 0 ? rows.reduce((s, r) => s + rankBeta(r.rank) * r.value, 0) / total : 1.2;
  const proj = portfolioProjection(beta);

  const stamp = new Date().toISOString().slice(0, 10);
  const exportCsv = () => {
    const header = ['Coin', 'Symbol', 'Menge', 'Einstand_USD', 'Kaufdatum', 'Preis_USD', 'Wert_USD', 'GV_USD'];
    const lines = rows.map(r => [r.h.name, r.h.symbol, r.h.amount, r.h.buyPrice ?? '', r.h.buyDate ?? '', r.price || '', r.value || '', r.pl ?? ''].map(csvCell).join(','));
    downloadFile(`portfolio-${stamp}.csv`, [header.join(','), ...lines].join('\n'), 'text/csv;charset=utf-8');
  };
  const exportJson = () => downloadFile(`portfolio-${stamp}.json`, JSON.stringify(holdings, null, 2), 'application/json');

  return (
    <div className="mt-6 border border-emerald-500/20 p-5 bg-gradient-to-br from-emerald-600/6 to-teal-600/4" style={{ borderRadius: 10 }}>
      <div className="flex items-center justify-between mb-1 gap-3">
        <div className="text-slate-300 text-xs uppercase tracking-widest flex items-center gap-2">💼 Mein Portfolio</div>
        {total > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-white leading-none">{fmt(total)}</div>
            {totalPct != null && (
              <div className={`text-xs font-semibold ${pctColor(totalPct)}`}>
                {fmtPct(totalPct)} ({change24Abs >= 0 ? '+' : '−'}{fmt(Math.abs(change24Abs))}) · 24h
              </div>
            )}
            {totalPL != null && (
              <div className={`text-xs font-semibold ${pctColor(totalPL)}`}>
                G/V: {totalPL >= 0 ? '+' : '−'}{fmt(Math.abs(totalPL))} ({fmtPct(totalPLPct)}) · unrealisiert
              </div>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500 mb-4">Eigene Bestände eingeben — Werte, Allokation &amp; Prognose. Lokal gespeichert, nichts verlässt deinen Browser.</p>

      <AddHolding onAdd={addHolding} />

      {rows.length === 0 ? (
        <div className="text-center py-6 text-slate-600 text-sm">Noch keine Bestände — oben einen Coin + Menge hinzufügen.</div>
      ) : (
        <>
          <div className="space-y-2">
            {rows.map(r => {
              const alloc = total > 0 ? (r.value / total) * 100 : 0;
              return (
                <div key={r.h.id} className="flex items-center gap-3 bg-white/4 border border-white/8 px-3 py-2.5" style={{ borderRadius: 8 }}>
                  <button onClick={() => onSelect(r.h.id)} className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer bg-transparent border-none p-0">
                    {r.image
                      ? <img src={r.image} alt={r.h.name} className="w-7 h-7 shrink-0" style={{ borderRadius: '50%' }} />
                      : <div className="w-7 h-7 shrink-0 bg-white/10" style={{ borderRadius: '50%' }} />}
                    <div className="min-w-0">
                      <div className="text-white text-sm font-semibold truncate">{r.h.name} <span className="text-slate-600 text-xs uppercase">{r.h.symbol}</span></div>
                      <div className="text-slate-500 text-xs">{r.h.amount} × {fmt(r.price)} <span className={pctColor(r.pct24)}>{r.pct24 != null ? fmtPct(r.pct24) : ''}</span></div>
                      {(r.pl != null || r.hp) && (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          {r.pl != null && (
                            <span className={`text-xs font-semibold ${pctColor(r.pl)}`}>
                              G/V {r.pl >= 0 ? '+' : '−'}{fmt(Math.abs(r.pl))}{r.plPct != null ? ` (${fmtPct(r.plPct)})` : ''}
                            </span>
                          )}
                          {r.hp && (
                            <span className={`text-[10px] px-1.5 py-0.5 border ${r.hp.taxFree ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/8' : 'text-yellow-300 border-yellow-500/30 bg-yellow-500/8'}`} style={{ borderRadius: 4 }}>
                              §23 {r.hp.taxFree ? 'steuerfrei (>1J)' : `noch ${r.hp.daysToFree}T`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                  <div className="text-right shrink-0">
                    <div className="text-white text-sm font-semibold font-mono">{fmt(r.value)}</div>
                    <div className="flex items-center gap-1.5 justify-end mt-0.5">
                      <div className="w-12 h-1 bg-white/10" style={{ borderRadius: 2 }}><div className="h-full bg-emerald-400" style={{ width: `${alloc}%`, borderRadius: 2 }} /></div>
                      <span className="text-slate-500 text-xs w-8 text-right">{alloc.toFixed(0)}%</span>
                    </div>
                  </div>
                  <input defaultValue={r.h.amount} key={`${r.h.id}-${r.h.amount}`}
                    onBlur={e => { const v = parseFloat(e.target.value.replace(',', '.')); if (isFinite(v) && v > 0) setAmount(r.h.id, v); }}
                    title="Menge bearbeiten" inputMode="decimal"
                    className="w-20 bg-white/5 border border-white/10 text-white text-xs px-2 py-1 outline-none hidden md:block" style={{ borderRadius: 4 }} />
                  <button onClick={() => removeHolding(r.h.id)} title="Entfernen" className="text-slate-600 hover:text-red-400 text-base cursor-pointer bg-transparent border-none px-1 shrink-0">✕</button>
                </div>
              );
            })}
          </div>

          <button onClick={() => setShowForecast(!showForecast)} className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 cursor-pointer bg-transparent border-none p-0">
            {showForecast ? '▾' : '▸'} 🔮 Portfolio-Prognose (Szenarien)
          </button>
          {showForecast && total > 0 && (
            <>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {proj.map(p => (
                  <div key={p.key} className="bg-white/4 border border-white/8 p-3" style={{ borderRadius: 8 }}>
                    <div className="text-center text-white text-xs font-bold mb-2">{p.label}</div>
                    <div className="space-y-1.5">
                      {(['bear', 'base', 'bull'] as Scenario[]).map(sc => {
                        const v = total * p.mult[sc];
                        const col = sc === 'bear' ? 'text-red-300' : sc === 'bull' ? 'text-emerald-300' : 'text-blue-200';
                        const emo = sc === 'bear' ? '🐻' : sc === 'bull' ? '🐂' : '⚖️';
                        const ret = (p.mult[sc] - 1) * 100;
                        return (
                          <div key={sc} className="flex items-center justify-between text-xs gap-2">
                            <span className={col}>{emo}</span>
                            <span className="text-white font-mono flex-1 text-right">{fmt(v)}</span>
                            <span className={`${pctColor(ret)} w-12 text-right`}>{ret > 0 ? '+' : ''}{ret >= 1000 ? `${(ret / 100).toFixed(1)}x` : `${ret.toFixed(0)}%`}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-slate-600">Szenarien aus rang-basiertem Portfolio-Beta (Ø {beta.toFixed(2)}) &amp; Markt-Annahmen — keine Finanzberatung.</div>
            </>
          )}

          <a href="https://tax.alpen-huettentouren.de" target="_blank" rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{ borderRadius: 8, background: 'rgba(16,185,129,0.12)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.3)' }}>
            🧾 Diese Bestände versteuern — mit crypto-tax (§23 EStG, FIFO) →
          </a>
        </>
      )}

      <div className="mt-3 pt-3 border-t border-white/8 flex flex-wrap items-center gap-4 text-xs">
        {rows.length > 0 && <button onClick={exportCsv} className="text-slate-400 hover:text-white cursor-pointer bg-transparent border-none p-0">⬇ Export CSV</button>}
        {rows.length > 0 && <button onClick={exportJson} className="text-slate-400 hover:text-white cursor-pointer bg-transparent border-none p-0">⬇ JSON-Backup</button>}
        <label className="text-slate-400 hover:text-white cursor-pointer">
          ⬆ Import (JSON)
          <input type="file" accept=".json,application/json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) importJson(f); e.currentTarget.value = ''; }} />
        </label>
      </div>
    </div>
  );
}

// ─── Market Bar ───────────────────────────────────────────────────────────────

function fgColor(v: number): string {
  if (v >= 75) return 'text-emerald-400';
  if (v >= 55) return 'text-green-400';
  if (v >= 45) return 'text-yellow-400';
  if (v >= 25) return 'text-orange-400';
  return 'text-red-400';
}
function fgEmoji(v: number): string {
  if (v >= 75) return '🤑';
  if (v >= 55) return '😊';
  if (v >= 45) return '😐';
  if (v >= 25) return '😟';
  return '😱';
}

function MarketBar({ market, fg }: { market: GlobalMarket | null; fg: FearGreed | null }) {
  if (!market && !fg) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs mb-8 px-1">
      {market && (
        <>
          <span className="text-slate-500">
            🌍 Marktkapitalisierung:{' '}
            <span className="text-white font-semibold">{fmt(market.total_market_cap_usd)}</span>
            {' '}<span className={pctColor(market.market_cap_change_24h)}>{fmtPct(market.market_cap_change_24h)}</span>
          </span>
          <span className="text-slate-500">
            ₿ BTC Dominanz: <span className="text-orange-300 font-semibold">{market.btc_dominance.toFixed(1)}%</span>
          </span>
          <span className="text-slate-500">
            Ξ ETH: <span className="text-blue-300 font-semibold">{market.eth_dominance.toFixed(1)}%</span>
          </span>
          <span className="text-slate-500">
            Aktive Coins: <span className="text-slate-300">{market.active_cryptocurrencies.toLocaleString()}</span>
          </span>
        </>
      )}
      {fg && (
        <span className="flex items-center gap-1.5 ml-auto bg-white/5 border border-white/10 px-3 py-1" style={{ borderRadius: 20 }}>
          <span>{fgEmoji(fg.value)}</span>
          <span className="text-slate-400">Fear & Greed:</span>
          <span className={`font-bold ${fgColor(fg.value)}`}>{fg.value}</span>
          <span className={fgColor(fg.value)}>{fg.label}</span>
        </span>
      )}
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ prices }: { prices: [number, number][] }) {
  if (prices.length < 2) return <div className="h-24 flex items-center justify-center text-slate-600 text-sm">Keine Chartdaten</div>;
  const vals = prices.map((p) => p[1]);
  const min = Math.min(...vals); const max = Math.max(...vals); const range = max - min || 1;
  const W = 600; const H = 96; const pad = 4;
  const tx = (i: number) => pad + (i / (vals.length - 1)) * (W - pad * 2);
  const ty = (v: number) => H - pad - ((v - min) / range) * (H - pad * 2);
  const line = vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${tx(i)},${ty(v)}`).join(' ');
  const area = `${line}L${tx(vals.length - 1)},${H}L${tx(0)},${H}Z`;
  const up = vals[vals.length - 1] >= vals[0];
  const col = up ? '#10B981' : '#EF4444';
  const gradId = `sg${up ? 'u' : 'd'}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'} />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={tx(vals.length - 1)} cy={ty(vals[vals.length - 1])} r="4" fill={col} />
    </svg>
  );
}

// ─── Mini components ──────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, color = 'text-white' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 p-4" style={{ borderRadius: 6 }}>
      <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function ChangeRow({ label, value, barMax = 200 }: { label: string; value: number | null | undefined; barMax?: number }) {
  const v = value ?? null;
  const col = pctColor(v); const width = v != null ? Math.min(Math.abs(v) / barMax * 100, 100) : 0;
  const barCol = (v ?? 0) >= 0 ? 'bg-emerald-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 text-sm w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/10" style={{ borderRadius: 2 }}>
        <div className={`h-full ${barCol} transition-all`} style={{ width: `${width}%`, borderRadius: 2 }} />
      </div>
      <span className={`text-sm font-semibold w-20 text-right ${col}`}>{fmtPct(v)}</span>
    </div>
  );
}

function SupplyBar({ circulating, max }: { circulating: number; max: number | null }) {
  const pct = max ? Math.min((circulating / max) * 100, 100) : 100;
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
        <span>Im Umlauf: {fmtNum(circulating)}</span>
        <span>{max ? `Max: ${fmtNum(max)}` : 'Kein Max-Angebot'}</span>
      </div>
      <div className="h-2 bg-white/10 w-full" style={{ borderRadius: 2 }}>
        <div className="h-full bg-gradient-to-r from-violet-500 to-purple-400" style={{ width: `${pct}%`, borderRadius: 2 }} />
      </div>
      <div className="flex justify-between text-xs mt-1.5">
        <span className="text-violet-400 font-semibold">{pct.toFixed(1)}% freigegeben</span>
        {max && <span className="text-slate-500">{fmtNum(max - circulating)} noch ausstehend</span>}
      </div>
    </div>
  );
}

function StatusBadge({ live }: { live: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1" style={{
      borderRadius: 4,
      background: live ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
      border: `1px solid ${live ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
      color: live ? '#6EE7B7' : '#FCA5A5',
    }}>
      <span className={`w-1.5 h-1.5 ${live ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} style={{ borderRadius: '50%' }} />
      {live ? 'LIVE' : 'INAKTIV'}
    </span>
  );
}

// ─── Value Proposition ────────────────────────────────────────────────────────

interface DashboardData { coin: CoinDetails; chart: MarketChart; defi: DefiLlamaProtocol | null; }

function ValueProp({ coin, cat, defi }: { coin: CoinDetails; cat: CategoryInfo; defi: DefiLlamaProtocol | null }) {
  const md = coin.market_data;
  const tvl = (defi?.tvl ?? 0) >= 1_000_000 ? defi!.tvl : undefined;
  const rev30 = tvl ? (defi?.revenue30d ?? defi?.revenue) : undefined;
  const pct1y = md.price_change_percentage_1y_in_currency?.usd;
  const hasBurn = coin.categories.join(' ').toLowerCase().includes('burn') ||
    (md.total_supply != null && md.max_supply != null && md.total_supply < md.max_supply * 0.99);
  const deflationary = md.max_supply == null && md.total_supply != null;

  const strengths: string[] = [];
  if (md.market_cap_rank && md.market_cap_rank <= 10)
    strengths.push(`Top-10 Krypto-Asset weltweit (Rang #${md.market_cap_rank})`);
  else if (md.market_cap_rank && md.market_cap_rank <= 50)
    strengths.push(`Unter den Top 50 nach Marktkapitalisierung (Rang #${md.market_cap_rank})`);
  else if (md.market_cap_rank && md.market_cap_rank <= 100)
    strengths.push(`Etabliert in den Top 100 (Rang #${md.market_cap_rank})`);
  if (coin.developer_data.commit_count_4_weeks > 50)
    strengths.push(`Sehr aktive Entwicklung: ${coin.developer_data.commit_count_4_weeks} Commits in den letzten 4 Wochen`);
  else if (coin.developer_data.commit_count_4_weeks > 10)
    strengths.push(`Aktive Entwicklung: ${coin.developer_data.commit_count_4_weeks} Commits in 4 Wochen`);
  if (tvl)
    strengths.push(`${fmt(tvl)} gesperrtes Kapital (TVL) — starkes Nutzervertrauen`);
  if (rev30 && rev30 > 0)
    strengths.push(`Generiert echte Einnahmen: ${fmt(rev30)} in 30 Tagen`);
  if (coin.community_data.twitter_followers > 500_000)
    strengths.push(`Massive Community: ${fmtNum(coin.community_data.twitter_followers)} X/Twitter-Follower`);
  else if (coin.community_data.twitter_followers > 100_000)
    strengths.push(`Große Community: ${fmtNum(coin.community_data.twitter_followers)} X/Twitter-Follower`);
  if (pct1y != null && pct1y > 50)
    strengths.push(`Starke Preis-Performance: +${pct1y.toFixed(0)}% im letzten Jahr`);
  if (hasBurn || deflationary)
    strengths.push('Deflationäres Token-Modell — Burns reduzieren das Angebot');
  if (coin.developer_data.stars > 5000)
    strengths.push(`Open Source mit großer Entwickler-Community: ${fmtNum(coin.developer_data.stars)} GitHub Stars`);

  const risks: string[] = [];
  if (!md.market_cap_rank || md.market_cap_rank > 100)
    risks.push('Außerhalb der Top 100 — erhöhtes Liquiditäts- und Ausfallrisiko');
  if (md.max_supply && md.circulating_supply < md.max_supply * 0.5)
    risks.push(`Noch ${((1 - md.circulating_supply / md.max_supply) * 100).toFixed(0)}% der Tokens ausstehend — mögliche Verwässerung des Preises`);
  if (coin.developer_data.commit_count_4_weeks === 0)
    risks.push('Keine aktuelle Entwickler-Aktivität nachweisbar');
  if (pct1y != null && pct1y < -50)
    risks.push(`Starker Wertverlust im letzten Jahr: ${pct1y.toFixed(0)}%`);
  if (!coin.genesis_date || new Date(coin.genesis_date).getFullYear() >= 2023)
    risks.push('Relativ junges Projekt — wenig historische Daten verfügbar');

  return (
    <div className="border border-white/10 p-6 bg-white/3" style={{ borderRadius: 10 }}>
      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-5 m-0 flex items-center gap-2">
        <Zap size={15} className="text-yellow-400" /> Mehrwert & Investitionsthese
      </h3>

      {/* Problem / Lösung */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-red-500/8 border border-red-500/20 p-4" style={{ borderRadius: 8 }}>
          <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <AlertTriangle size={12} /> Das Problem
          </div>
          <p className="text-slate-300 text-sm leading-relaxed m-0">{cat.problem}</p>
        </div>
        <div className="bg-emerald-500/8 border border-emerald-500/20 p-4" style={{ borderRadius: 8 }}>
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <CheckCircle size={12} /> Die Lösung
          </div>
          <p className="text-slate-300 text-sm leading-relaxed m-0">{cat.solution}</p>
        </div>
      </div>

      {/* Stärken & Risiken */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strengths.length > 0 && (
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Shield size={12} /> Stärken ({strengths.length})
            </div>
            <div className="space-y-2">
              {strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                  <span className="text-slate-300">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {risks.length > 0 && (
          <div>
            <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <AlertTriangle size={12} /> Risiken ({risks.length})
            </div>
            <div className="space-y-2">
              {risks.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-red-400 shrink-0 mt-0.5">⚠</span>
                  <span className="text-slate-300">{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Investors & Partnerships ─────────────────────────────────────────────────

function LogoTile({ name, domain, tooltip }: { name: string; domain: string; tooltip?: string }) {
  const [failed, setFailed] = useState(false);
  const short = name.split(' ')[0];
  return (
    <div className="group relative flex flex-col items-center gap-1.5" title={tooltip ?? name}>
      <div
        className="w-14 h-14 flex items-center justify-center bg-white p-1.5 border border-white/10 group-hover:border-white/40 transition-all group-hover:scale-105"
        style={{ borderRadius: 12 }}
      >
        {!failed ? (
          <img
            src={`https://logo.clearbit.com/${domain}`}
            alt={name}
            className="w-full h-full object-contain"
            style={{ borderRadius: 8 }}
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="text-slate-800 text-lg font-bold">{short[0]}</span>
        )}
      </div>
      <span className="text-slate-500 text-xs text-center leading-tight max-w-[56px] truncate">{short}</span>
      {tooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 hidden group-hover:block
          bg-slate-900 border border-white/20 text-slate-200 text-xs px-3 py-2 whitespace-nowrap max-w-[220px] whitespace-normal leading-snug"
          style={{ borderRadius: 6, boxShadow: '0 4px 24px rgba(0,0,0,0.6)' }}>
          <div className="font-semibold text-white mb-0.5">{name}</div>
          {tooltip}
        </div>
      )}
    </div>
  );
}

function InvestorsSection({ coinId }: { coinId: string }) {
  const meta = getProjectMeta(coinId);
  if (!meta) return null;

  const hasContent = meta.investors.length > 0 || meta.partnerships.length > 0 ||
    meta.physicalProducts.length > 0 || meta.note;

  if (!hasContent) return null;

  const statusColor = (s: string) =>
    s === 'live' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
    s === 'announced' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' :
    'text-slate-400 bg-slate-500/10 border-slate-500/30';
  const statusLabel = (s: string) =>
    s === 'live' ? 'Live' : s === 'announced' ? 'Angekündigt' : 'Eingestellt';

  // Collect all entities that have a logo domain (investors + partnerships)
  const logoItems: { name: string; domain: string; tooltip: string; tag: 'investor' | 'partner' }[] = [
    ...meta.investors.filter(i => i.domain).map(i => ({
      name: i.name, domain: i.domain!,
      tooltip: [i.round, i.amount].filter(Boolean).join(' · ') || i.name,
      tag: 'investor' as const,
    })),
    ...meta.partnerships.filter(p => p.domain).map(p => ({
      name: p.name, domain: p.domain!,
      tooltip: p.type,
      tag: 'partner' as const,
    })),
  ];

  return (
    <div className="border border-white/10 p-6 bg-white/3" style={{ borderRadius: 10 }}>
      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-1 m-0 flex items-center gap-2">
        🤝 Investoren, Kooperationen & Produkte
        {meta.totalFunding && (
          <span className="text-xs font-normal text-slate-500 normal-case tracking-normal ml-2">
            Gesamtfinanzierung: <span className="text-emerald-400 font-semibold">{meta.totalFunding}</span>
          </span>
        )}
      </h3>

      {meta.note && (
        <div className="mt-3 mb-2 text-xs text-slate-400 bg-blue-500/8 border border-blue-500/20 px-4 py-2.5" style={{ borderRadius: 6 }}>
          ℹ️ {meta.note}
        </div>
      )}

      {/* ── LOGO WALL ── */}
      {logoItems.length > 0 && (
        <div className="mt-4 mb-6">
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">
            {logoItems.length} bekannte Partner & Investoren — hover für Details
          </div>
          <div className="flex flex-wrap gap-3">
            {logoItems.map((item, i) => (
              <div key={i} className="relative">
                <LogoTile name={item.name} domain={item.domain} tooltip={item.tooltip} />
                {/* small tag badge */}
                <span
                  className="absolute -top-1 -right-1 text-[9px] font-bold px-1 leading-tight"
                  style={{
                    borderRadius: 3,
                    background: item.tag === 'investor' ? 'rgba(167,139,250,0.25)' : 'rgba(96,165,250,0.25)',
                    color: item.tag === 'investor' ? '#c4b5fd' : '#93c5fd',
                    border: `1px solid ${item.tag === 'investor' ? 'rgba(167,139,250,0.4)' : 'rgba(96,165,250,0.4)'}`,
                  }}
                >
                  {item.tag === 'investor' ? 'INV' : 'CO-OP'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DETAIL LISTS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Investors */}
        {meta.investors.length > 0 && (
          <div>
            <div className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              💼 Investoren ({meta.investors.length})
            </div>
            <div className="space-y-2">
              {meta.investors.map((inv, i) => (
                <div key={i} className="flex items-center justify-between gap-3 bg-white/4 px-3 py-2.5 border border-white/8" style={{ borderRadius: 6 }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    {inv.domain && (
                      <img
                        src={`https://logo.clearbit.com/${inv.domain}`}
                        alt={inv.name}
                        className="w-6 h-6 shrink-0 bg-white/10 object-contain"
                        style={{ borderRadius: 4 }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-white text-sm font-semibold truncate">{inv.name}</div>
                      {inv.round && <div className="text-slate-500 text-xs">{inv.round}</div>}
                    </div>
                  </div>
                  {inv.amount && (
                    <span className="text-emerald-400 text-sm font-bold shrink-0">{inv.amount}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Partnerships */}
        {meta.partnerships.length > 0 && (
          <div>
            <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              🔗 Kooperationen ({meta.partnerships.length})
            </div>
            <div className="space-y-2">
              {meta.partnerships.map((p, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-white/4 px-3 py-2.5 border border-white/8" style={{ borderRadius: 6 }}>
                  {p.domain && (
                    <img
                      src={`https://logo.clearbit.com/${p.domain}`}
                      alt={p.name}
                      className="w-6 h-6 shrink-0 bg-white/10 object-contain"
                      style={{ borderRadius: 4 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <div className="min-w-0">
                    <div className="text-white text-sm font-semibold">{p.name}</div>
                    <div className="text-slate-400 text-xs mt-0.5">{p.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Physical Products */}
      {meta.physicalProducts.length > 0 && (
        <div className="mt-6">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            📦 Physische Produkte ({meta.physicalProducts.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {meta.physicalProducts.map((prod, i) => (
              <div key={i} className="bg-amber-500/5 border border-amber-500/20 p-4" style={{ borderRadius: 8 }}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-white font-bold text-sm">{prod.name}</span>
                  <span className={`text-xs px-2 py-0.5 border font-semibold shrink-0 ${statusColor(prod.status)}`} style={{ borderRadius: 4 }}>
                    {statusLabel(prod.status)}{prod.year ? ` ${prod.year}` : ''}
                  </span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed m-0">{prod.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Top Movers (24h Gewinner / Verlierer) ──────────────────────────────────

function MiniSparkline({ data, width = 60, height = 18 }: { data?: number[]; width?: number; height?: number }) {
  if (!data || data.length < 2) return <div style={{ width, height }} className="shrink-0" />;
  const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');
  const up = data[data.length - 1] >= data[0];
  return (
    <svg width={width} height={height} className="shrink-0" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={up ? '#10B981' : '#EF4444'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function TopMovers({ onSelect }: { onSelect: (id: string) => void }) {
  const [coins, setCoins] = useState<TopCoin[]>([]);
  useEffect(() => { getTopCoins().then(setCoins).catch(() => {}); }, []);

  const withPct = coins.filter(c => isFinite(c.price_change_percentage_24h));
  if (withPct.length < 10) return null;
  const sorted = [...withPct].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
  const cols = [
    { title: 'Gewinner', emoji: '📈', list: sorted.slice(0, 5) },
    { title: 'Verlierer', emoji: '📉', list: sorted.slice(-5).reverse() },
  ];

  return (
    <div className="mt-6 border border-white/10 p-5 bg-white/3" style={{ borderRadius: 10 }}>
      <div className="text-slate-300 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">🔥 Top-Bewegungen · 24h</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {cols.map(col => (
          <div key={col.title}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2 text-slate-400">{col.emoji} {col.title}</div>
            <div className="space-y-1">
              {col.list.map(c => (
                <button key={c.id} onClick={() => onSelect(c.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-white/6 transition-colors text-left cursor-pointer bg-transparent border-none" style={{ borderRadius: 6 }}>
                  <img src={c.image} alt={c.name} className="w-5 h-5 shrink-0" style={{ borderRadius: '50%' }} />
                  <span className="text-white text-sm truncate flex-1 min-w-0">{c.name}</span>
                  <span className="hidden sm:block"><MiniSparkline data={c.sparkline_in_7d?.price} /></span>
                  <span className="text-slate-400 text-xs font-mono hidden md:block">{fmt(c.current_price)}</span>
                  <span className={`text-xs font-semibold w-16 text-right ${pctColor(c.price_change_percentage_24h)}`}>{fmtPct(c.price_change_percentage_24h)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Coin-Vergleich ──────────────────────────────────────────────────────────

function CoinPicker({ onPick, placeholder }: { onPick: (c: CoinSearchResult) => void; placeholder: string }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<CoinSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onQuery = (v: string) => {
    setQ(v);
    clearTimeout(timer.current);
    if (!v.trim()) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => { setResults(await searchCoins(v)); setOpen(true); }, 350);
  };
  return (
    <div className="relative flex-1">
      <input value={q} onChange={e => onQuery(e.target.value)} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 placeholder-slate-600 outline-none" style={{ borderRadius: 6 }} />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-40 overflow-y-auto" style={{ maxHeight: 240, borderRadius: 8, background: '#1a2035', border: '1px solid rgba(255,255,255,0.15)' }}>
          {results.map(r => (
            <button key={r.id} onClick={() => { onPick(r); setQ(r.name); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/8 text-left cursor-pointer">
              {r.thumb && <img src={r.thumb} alt={r.name} className="w-5 h-5" style={{ borderRadius: '50%' }} />}
              <span className="text-white text-sm">{r.name}</span>
              <span className="text-slate-500 text-xs uppercase">{r.symbol}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CompareTool({ onSelect }: { onSelect: (id: string) => void }) {
  const [a, setA] = useState<CoinSearchResult | null>(null);
  const [b, setB] = useState<CoinSearchResult | null>(null);
  const [data, setData] = useState<Record<string, TopCoin>>({});

  useEffect(() => {
    const ids = [a?.id, b?.id].filter(Boolean) as string[];
    if (ids.length < 2) return;
    getMarketsByIds(ids)
      .then(list => Object.fromEntries(list.map(c => [c.id, c])) as Record<string, TopCoin>)
      .then(setData).catch(() => {});
  }, [a, b]);

  const ca = a ? data[a.id] : undefined;
  const cb = b ? data[b.id] : undefined;

  const base12 = (c: TopCoin) => {
    const beta = rankBeta(c.market_cap_rank);
    const mid = portfolioProjection(beta).find(h => h.key === 'mid')!;
    return { base: (mid.mult.base - 1) * 100, bull: (mid.mult.bull - 1) * 100, bear: (mid.mult.bear - 1) * 100 };
  };

  type Row = { label: string; a: string; b: string; aWin?: boolean; bWin?: boolean; aCol?: string; bCol?: string };
  const rows: Row[] = [];
  if (ca && cb) {
    const liq = (c: TopCoin) => c.market_cap > 0 ? c.total_volume / c.market_cap : 0;
    rows.push({ label: 'Preis', a: fmt(ca.current_price), b: fmt(cb.current_price) });
    rows.push({ label: '24h', a: fmtPct(ca.price_change_percentage_24h), b: fmtPct(cb.price_change_percentage_24h),
      aCol: pctColor(ca.price_change_percentage_24h), bCol: pctColor(cb.price_change_percentage_24h),
      aWin: ca.price_change_percentage_24h > cb.price_change_percentage_24h, bWin: cb.price_change_percentage_24h > ca.price_change_percentage_24h });
    rows.push({ label: 'Marktkap.', a: fmt(ca.market_cap), b: fmt(cb.market_cap), aWin: ca.market_cap > cb.market_cap, bWin: cb.market_cap > ca.market_cap });
    rows.push({ label: 'Rang', a: `#${ca.market_cap_rank}`, b: `#${cb.market_cap_rank}`, aWin: ca.market_cap_rank < cb.market_cap_rank, bWin: cb.market_cap_rank < ca.market_cap_rank });
    rows.push({ label: 'Liquidität (Vol/MCap)', a: `${(liq(ca) * 100).toFixed(1)}%`, b: `${(liq(cb) * 100).toFixed(1)}%`, aWin: liq(ca) > liq(cb), bWin: liq(cb) > liq(ca) });
    const fa = base12(ca), fb = base12(cb);
    rows.push({ label: 'Prognose 12M (Basis)', a: `${fa.base >= 0 ? '+' : ''}${fa.base.toFixed(0)}%`, b: `${fb.base >= 0 ? '+' : ''}${fb.base.toFixed(0)}%`,
      aCol: pctColor(fa.base), bCol: pctColor(fb.base), aWin: fa.base > fb.base, bWin: fb.base > fa.base });
    rows.push({ label: 'Prognose 12M (Bulle)', a: `+${fa.bull.toFixed(0)}%`, b: `+${fb.bull.toFixed(0)}%`, aCol: 'text-emerald-300', bCol: 'text-emerald-300' });
  }

  const head = (c: TopCoin | undefined, pick: CoinSearchResult | null) => (
    <div className="flex items-center justify-center gap-2 min-h-[28px]">
      {c && <img src={c.image} alt="" className="w-6 h-6" style={{ borderRadius: '50%' }} />}
      <span className="text-white font-bold text-sm">{pick?.name ?? '—'}</span>
      {c && <span className="text-slate-500 text-xs uppercase">{c.symbol}</span>}
    </div>
  );

  return (
    <div className="mt-6 border border-white/10 p-5 bg-white/3" style={{ borderRadius: 10 }}>
      <div className="text-slate-300 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">⚖️ Coins vergleichen</div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <CoinPicker onPick={setA} placeholder="Erster Coin…" />
        <span className="self-center text-slate-600 text-xs hidden sm:block">vs</span>
        <CoinPicker onPick={setB} placeholder="Zweiter Coin…" />
      </div>

      {ca && cb ? (
        <div className="overflow-hidden border border-white/10" style={{ borderRadius: 8 }}>
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 px-4 py-3 bg-white/5 border-b border-white/10 items-center">
            <span className="text-xs text-slate-500 uppercase tracking-widest">Metrik</span>
            {head(ca, a)}
            {head(cb, b)}
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr] gap-2 px-4 py-2.5 border-b border-white/5 last:border-0 items-center">
              <span className="text-slate-400 text-xs">{r.label}</span>
              <span className={`text-center text-sm font-semibold ${r.aCol ?? 'text-white'}`}>{r.a}{r.aWin && <span className="text-emerald-400 ml-1">✓</span>}</span>
              <span className={`text-center text-sm font-semibold ${r.bCol ?? 'text-white'}`}>{r.b}{r.bWin && <span className="text-emerald-400 ml-1">✓</span>}</span>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 px-4 py-3 bg-white/4">
            <span></span>
            <button onClick={() => onSelect(ca.id)} className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer bg-transparent border-none">Voll-Analyse →</button>
            <button onClick={() => onSelect(cb.id)} className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer bg-transparent border-none">Voll-Analyse →</button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-slate-600 text-sm">Zwei Coins wählen, um Kennzahlen &amp; Prognose direkt zu vergleichen.</div>
      )}
    </div>
  );
}

// ─── Preis-Alerts ─────────────────────────────────────────────────────────────

interface Alert { coinId: string; symbol: string; name: string; image: string; target: number; dir: 'above' | 'below'; createdAt: number; }
const ALERTS_KEY = 'crypto-alerts';
function loadAlerts(): Alert[] { try { return JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]'); } catch { return []; } }
function saveAlerts(a: Alert[]) { try { localStorage.setItem(ALERTS_KEY, JSON.stringify(a)); } catch { /* */ } }

function AlertsPanel({ onSelect }: { onSelect: (id: string) => void }) {
  const [alerts, setAlerts] = useState<Alert[]>(loadAlerts);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [picked, setPicked] = useState<CoinSearchResult | null>(null);
  const [target, setTarget] = useState('');
  const [dir, setDir] = useState<'above' | 'below'>('above');
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const ids = [...new Set(alerts.map(a => a.coinId))];
    if (!ids.length) return;
    getMarketsByIds(ids)
      .then(list => Object.fromEntries(list.map(c => [c.id, c.current_price])) as Record<string, number>)
      .then(setPrices).catch(() => {});
  }, [alerts]);

  // Auslöser prüfen — reiner Seiteneffekt (Browser-Notification), kein setState.
  useEffect(() => {
    for (const a of alerts) {
      const p = prices[a.coinId];
      if (p == null) continue;
      const hit = a.dir === 'above' ? p >= a.target : p <= a.target;
      const k = `${a.coinId}|${a.dir}|${a.target}`;
      if (hit && !notifiedRef.current.has(k)) {
        notifiedRef.current.add(k);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try { new Notification(`🔔 ${a.name}`, { body: `${a.dir === 'above' ? 'über' : 'unter'} ${fmt(a.target)} — aktuell ${fmt(p)}` }); } catch { /* */ }
        }
      }
    }
  }, [prices, alerts]);

  const update = (next: Alert[]) => { setAlerts(next); saveAlerts(next); };
  const removeAlert = (i: number) => update(alerts.filter((_, idx) => idx !== i));
  const addAlert = () => {
    const t = parseFloat(target.replace(',', '.'));
    if (!picked || !isFinite(t) || t <= 0) return;
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') { try { Notification.requestPermission(); } catch { /* */ } }
    update([{ coinId: picked.id, symbol: picked.symbol.toUpperCase(), name: picked.name, image: picked.thumb, target: t, dir, createdAt: Date.now() }, ...alerts]);
    setPicked(null); setTarget('');
  };

  const isHit = (a: Alert) => { const p = prices[a.coinId]; return p != null && (a.dir === 'above' ? p >= a.target : p <= a.target); };

  return (
    <div className="mt-6 border border-white/10 p-5 bg-white/3" style={{ borderRadius: 10 }}>
      <div className="text-slate-300 text-xs uppercase tracking-widest mb-1 flex items-center gap-2">🔔 Preis-Alerts</div>
      <p className="text-xs text-slate-500 mb-4">Benachrichtigung, wenn ein Coin eine Schwelle erreicht — solange die App offen ist. Lokal gespeichert.</p>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1"><CoinPicker onPick={setPicked} placeholder={picked ? picked.name : 'Coin wählen…'} /></div>
        <select value={dir} onChange={e => setDir(e.target.value as 'above' | 'below')}
          className="bg-white/5 border border-white/10 text-white text-sm px-2 py-2 outline-none" style={{ borderRadius: 6, colorScheme: 'dark' }}>
          <option value="above">über</option>
          <option value="below">unter</option>
        </select>
        <input value={target} onChange={e => setTarget(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addAlert(); }}
          placeholder="Preis $" inputMode="decimal"
          className="w-full sm:w-28 bg-white/5 border border-white/10 text-white text-sm px-3 py-2 placeholder-slate-600 outline-none" style={{ borderRadius: 6 }} />
        <button onClick={addAlert} disabled={!picked || !target}
          className="px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          style={{ borderRadius: 6, background: 'rgba(96,165,250,0.18)', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.4)' }}>
          + Alarm
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-3 text-slate-600 text-sm">Noch keine Alerts.</div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a, i) => {
            const hit = isHit(a);
            const cur = prices[a.coinId];
            return (
              <div key={`${a.coinId}-${a.dir}-${a.target}-${i}`}
                className={`flex items-center gap-3 px-3 py-2.5 border ${hit ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-white/4 border-white/8'}`} style={{ borderRadius: 8 }}>
                <button onClick={() => onSelect(a.coinId)} className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer bg-transparent border-none p-0">
                  {a.image ? <img src={a.image} alt="" className="w-6 h-6 shrink-0" style={{ borderRadius: '50%' }} /> : <div className="w-6 h-6 shrink-0 bg-white/10" style={{ borderRadius: '50%' }} />}
                  <div className="min-w-0">
                    <div className="text-white text-sm font-semibold truncate">{a.name} <span className="text-slate-600 text-xs uppercase">{a.symbol}</span></div>
                    <div className="text-slate-500 text-xs">{a.dir === 'above' ? '▲ über' : '▼ unter'} {fmt(a.target)}{cur != null ? ` · aktuell ${fmt(cur)}` : ''}</div>
                  </div>
                </button>
                {hit && <span className="text-emerald-300 text-xs font-bold shrink-0">✅ ausgelöst</span>}
                <button onClick={() => removeAlert(i)} title="Entfernen" className="text-slate-600 hover:text-red-400 text-base cursor-pointer bg-transparent border-none px-1 shrink-0">✕</button>
              </div>
            );
          })}
        </div>
      )}
      {typeof Notification !== 'undefined' && Notification.permission === 'denied' && (
        <div className="mt-3 text-[11px] text-slate-600">ℹ️ Browser-Benachrichtigungen sind blockiert — Alerts erscheinen nur hier in der App (grün markiert).</div>
      )}
    </div>
  );
}

// ─── Top Coins Grid ───────────────────────────────────────────────────────────

function TopCoinsGrid({ onSelect, onPreAdd }: { onSelect: (id: string) => void; onPreAdd: (coin: TopCoin) => void }) {
  const [coins, setCoins] = useState<TopCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    getTopCoins()
      .then(setCoins)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const visible = filter.trim()
    ? coins.filter(c =>
        c.name.toLowerCase().includes(filter.toLowerCase()) ||
        c.symbol.toLowerCase().includes(filter.toLowerCase())
      )
    : coins;

  if (loading) return (
    <div className="text-center py-10 text-slate-500 text-sm">
      <div className="inline-block w-5 h-5 border-2 border-slate-600 border-t-blue-400 animate-spin mb-2" style={{ borderRadius: '50%' }} />
      <div>Top 200 werden geladen…</div>
    </div>
  );

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-slate-400 text-xs uppercase tracking-widest flex items-center gap-2">
          <BarChart2 size={13} /> Top {coins.length} nach Marktkapitalisierung
        </div>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filtern…"
          className="bg-white/5 border border-white/10 text-white text-sm px-3 py-1.5 placeholder-slate-600 outline-none w-36"
          style={{ borderRadius: 6 }}
        />
      </div>

      <div className="overflow-hidden border border-white/10" style={{ borderRadius: 8 }}>
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_90px_90px_90px] gap-2 px-4 py-2 bg-white/5 text-xs text-slate-500 uppercase tracking-widest border-b border-white/10">
          <span>#</span>
          <span>Name</span>
          <span className="text-right">Preis</span>
          <span className="text-right">24h</span>
          <span className="text-right hidden sm:block">MarktKap</span>
        </div>

        {/* Scrollable rows */}
        <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
          {visible.length === 0 && (
            <div className="text-center py-8 text-slate-600 text-sm">Keine Treffer</div>
          )}
          {visible.map(coin => {
            const pct = coin.price_change_percentage_24h;
            return (
              <button
                key={coin.id}
                onClick={() => { onPreAdd(coin); onSelect(coin.id); }}
                className="w-full grid grid-cols-[40px_1fr_90px_90px_90px] gap-2 px-4 py-2.5 hover:bg-white/6 transition-colors text-left border-b border-white/5 last:border-0 cursor-pointer"
              >
                <span className="text-slate-600 text-xs self-center">{coin.market_cap_rank}</span>
                <span className="flex items-center gap-2 min-w-0">
                  <img src={coin.image} alt={coin.name} className="w-6 h-6 shrink-0" style={{ borderRadius: '50%' }} />
                  <span className="text-white text-sm font-medium truncate">{coin.name}</span>
                  <span className="text-slate-600 text-xs uppercase hidden md:inline">{coin.symbol}</span>
                </span>
                <span className="text-right text-white text-sm self-center font-mono">{fmt(coin.current_price)}</span>
                <span className={`text-right text-sm self-center font-semibold ${pctColor(pct)}`}>{fmtPct(pct)}</span>
                <span className="text-right text-slate-400 text-xs self-center hidden sm:block">{fmt(coin.market_cap)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Search ───────────────────────────────────────────────────────────────────

function SearchBar({ onSelect }: { onSelect: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CoinSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value; setQuery(v);
    clearTimeout(timer.current);
    if (!v.trim()) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try { const r = await searchCoins(v); setResults(r); setOpen(true); }
      catch { /* rate limit */ }
      finally { setLoading(false); }
    }, 400);
  };

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-2xl mx-auto">
      <div className="flex items-center bg-white/8 border border-white/20 px-5 py-4 gap-3" style={{ borderRadius: 10 }}>
        <Search className="text-slate-400 shrink-0" size={20} />
        <input
          type="text" value={query} onChange={handleChange}
          placeholder="Token-Name oder Symbol eingeben… (z.B. Bitcoin, ETH, SUI)"
          className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-base"
        />
        {loading && <div className="w-4 h-4 border-2 border-slate-500 border-t-blue-400 animate-spin" style={{ borderRadius: '50%' }} />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden" style={{ borderRadius: 8, background: '#1a2035', border: '1px solid rgba(255,255,255,0.15)' }}>
          {results.map((r) => (
            <button key={r.id} onClick={() => { onSelect(r.id); setQuery(r.name); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/8 transition-colors text-left cursor-pointer">
              {r.thumb && <img src={r.thumb} alt={r.name} className="w-7 h-7" style={{ borderRadius: '50%' }} />}
              <div className="flex-1 min-w-0">
                <span className="text-white font-medium">{r.name}</span>
                <span className="text-slate-400 text-sm ml-2 uppercase">{r.symbol}</span>
              </div>
              {r.market_cap_rank && <span className="text-slate-500 text-xs shrink-0">#{r.market_cap_rank}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Advanced Indicators ────────────────────────────────────────────────────

function IndicatorTile({ label, value, hint, color = 'text-white', tip }: {
  label: string; value: string; hint?: string; color?: string; tip?: string;
}) {
  return (
    <div className="group relative bg-white/5 border border-white/10 p-3.5" style={{ borderRadius: 8 }} title={tip}>
      <div className="text-[11px] text-slate-500 uppercase tracking-widest mb-1 leading-tight">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      {hint && <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">{hint}</div>}
    </div>
  );
}

function IndicatorPanel({ ind, ctx }: { ind: Indicators; ctx: MarketContext | null }) {
  const mm = ind.mayerMultiple;
  const mmColor = mm == null ? 'text-slate-400' : mm > 2.4 ? 'text-red-400' : mm < 0.8 ? 'text-emerald-400' : 'text-slate-200';
  const rsi = ind.rsi14;
  const rsiColor = rsi == null ? 'text-slate-400' : rsi > 70 ? 'text-red-400' : rsi < 30 ? 'text-emerald-400' : 'text-slate-200';
  const volPct = ind.volatility != null ? ind.volatility * 100 : null;
  const volColor = volPct == null ? 'text-slate-400' : volPct > 120 ? 'text-red-400' : volPct > 70 ? 'text-yellow-400' : 'text-emerald-400';
  const sharpeColor = ind.sharpe == null ? 'text-slate-400' : ind.sharpe > 1 ? 'text-emerald-400' : ind.sharpe > 0 ? 'text-yellow-400' : 'text-red-400';
  const liqColor = ind.liquidityRegime.direction === 'expansion' ? 'text-emerald-400' : ind.liquidityRegime.direction === 'contraction' ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className="border border-white/10 p-6 bg-white/3" style={{ borderRadius: 10 }}>
      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-1 m-0 flex items-center gap-2">
        <Activity size={15} className="text-cyan-400" /> Erweiterte Indikatoren
      </h3>
      <p className="text-xs text-slate-500 mt-1 mb-4">Technische, Zyklus- & Liquiditäts-Signale — die Bausteine der Prognose unten.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <IndicatorTile
          label="Mayer Multiple" value={mm != null ? mm.toFixed(2) : '—'} color={mmColor}
          hint={mm == null ? 'zu wenig Historie' : mm > 2.4 ? 'überhitzt (>2.4)' : mm < 0.8 ? 'günstige Zone (<0.8)' : 'neutral'}
          tip="Preis ÷ 200-Tage-Durchschnitt. >2.4 = historisch überhitzt, <0.8 = historisch günstig." />
        <IndicatorTile
          label="RSI (14T)" value={rsi != null ? rsi.toFixed(0) : '—'} color={rsiColor}
          hint={rsi == null ? '—' : rsi > 70 ? 'überkauft' : rsi < 30 ? 'überverkauft' : 'neutral'}
          tip="Relative-Stärke-Index. >70 überkauft, <30 überverkauft." />
        <IndicatorTile
          label="Volatilität (annual.)" value={volPct != null ? `${volPct.toFixed(0)}%` : '—'} color={volColor}
          hint={volPct == null ? '—' : volPct > 120 ? 'sehr hoch' : volPct > 70 ? 'hoch' : 'moderat'}
          tip="Annualisierte Schwankungsbreite aus täglichen Renditen." />
        <IndicatorTile
          label="Sharpe (1J)" value={ind.sharpe != null ? ind.sharpe.toFixed(2) : '—'} color={sharpeColor}
          hint={ind.sharpe == null ? '—' : 'Rendite je Risiko'}
          tip="Risiko-adjustierte Rendite: (1J-Return − 4%) ÷ Volatilität. >1 ist gut." />
        <IndicatorTile
          label="Abstand zum ATH" value={`${ind.drawdownFromAth.toFixed(0)}%`}
          color={ind.drawdownFromAth > -10 ? 'text-emerald-400' : ind.drawdownFromAth > -35 ? 'text-slate-200' : ind.drawdownFromAth > -60 ? 'text-yellow-400' : 'text-amber-400'}
          hint={ind.drawdownFromAth > -10 ? 'nahe Hoch' : ind.drawdownFromAth > -35 ? 'moderat unter ATH' : ind.drawdownFromAth > -60 ? 'deutlich unter ATH' : 'tief im Drawdown'}
          tip="Wie weit unter dem Allzeithoch der Kurs aktuell liegt." />
        <IndicatorTile
          label="Max Drawdown (1J)" value={ind.maxDrawdown != null ? `${ind.maxDrawdown.toFixed(0)}%` : '—'}
          color="text-red-300" hint="größter Einbruch"
          tip="Größter Peak-to-Trough-Verlust der letzten 12 Monate." />
        <IndicatorTile
          label="Liquidität (Vol/MCap)" value={ind.volToMcap != null ? `${(ind.volToMcap * 100).toFixed(1)}%` : '—'}
          color={ind.volToMcap != null && ind.volToMcap > 0.1 ? 'text-emerald-400' : 'text-slate-200'}
          hint="Handelbarkeit" tip="24h-Volumen ÷ Marktkapitalisierung. Höher = liquider." />
        <IndicatorTile
          label="Verwässerung offen" value={`${ind.remainingDilution.toFixed(0)}%`}
          color={ind.remainingDilution > 60 ? 'text-red-400' : ind.remainingDilution > 25 ? 'text-yellow-400' : 'text-emerald-400'}
          hint={ind.remainingDilution > 60 ? 'hoher Druck' : ind.remainingDilution > 25 ? 'moderat' : 'gering'}
          tip="Anteil der maximalen Token-Menge, der noch nicht im Umlauf ist." />
      </div>

      {/* Cycle clock + liquidity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <div className="bg-white/5 border border-white/10 p-4" style={{ borderRadius: 8 }}>
          <div className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">⛏️ Halving-Zyklus</div>
          <div className="text-white font-bold text-base">{ind.cyclePhase.label}</div>
          <div className="text-xs text-slate-400 mt-1">{ind.cyclePhase.desc}</div>
          <div className="flex gap-4 mt-2 text-xs">
            <span className="text-slate-500">Seit Halving: <span className="text-slate-300 font-semibold">{ind.daysSinceHalving} T</span></span>
            <span className="text-slate-500">Nächstes: <span className="text-slate-300 font-semibold">in {ind.daysToNextHalving} T</span></span>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4" style={{ borderRadius: 8 }}>
          <div className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">🌊 Globale Liquidität</div>
          <div className={`font-bold text-base ${liqColor}`}>{ind.liquidityRegime.label}</div>
          <div className="text-xs text-slate-400 mt-1">{ind.liquidityRegime.desc}</div>
          <div className="text-[11px] text-slate-600 mt-2">Howell-Framework · ~65-Monats-Zyklus</div>
        </div>
        {ctx?.stablecoinChange30d != null && (
          <div className="bg-white/5 border border-white/10 p-4" style={{ borderRadius: 8 }}>
            <div className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">💵 Stablecoin-Liquidität</div>
            <div className={`font-bold text-base ${ctx.stablecoinChange30d > 1 ? 'text-emerald-400' : ctx.stablecoinChange30d < -1 ? 'text-red-400' : 'text-slate-200'}`}>
              {ctx.stablecoinChange30d >= 0 ? '+' : ''}{ctx.stablecoinChange30d.toFixed(1)}% <span className="text-xs text-slate-500">(30T)</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {ctx.stablecoinTotalUsd ? `Aggregiert ≈ ${fmt(ctx.stablecoinTotalUsd)}` : 'Marktweites „dry powder"'}
            </div>
            <div className="text-[11px] text-slate-600 mt-2">{ctx.stablecoinChange30d > 0 ? 'Frisches Kaufkapital strömt zu' : 'Liquidität verlässt den Markt'}</div>
          </div>
        )}
        {ctx?.btcPiCycleRatio != null && (
          <div className="bg-white/5 border border-white/10 p-4" style={{ borderRadius: 8 }}>
            <div className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">🥧 BTC Pi-Cycle</div>
            <div className={`font-bold text-base ${ctx.btcPiCycleRatio >= 0.85 ? 'text-red-400' : ctx.btcPiCycleRatio < 0.5 ? 'text-emerald-400' : 'text-slate-200'}`}>
              {ctx.btcPiCycleRatio.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {ctx.btcPiCycleRatio >= 1 ? 'Zyklus-Top-Zone' : ctx.btcPiCycleRatio >= 0.85 ? 'Nähe Top-Zone' : ctx.btcPiCycleRatio < 0.5 ? 'Frühe Zyklusphase' : 'Mittlere Phase'}
            </div>
            <div className="text-[11px] text-slate-600 mt-2">111T-MA ÷ (2 × 350T-MA) · ≥1 = Top</div>
          </div>
        )}
        {ctx?.m2Yoy != null && (
          <div className="bg-white/5 border border-white/10 p-4" style={{ borderRadius: 8 }}>
            <div className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">💴 Geldmenge M2 (YoY)</div>
            <div className={`font-bold text-base ${ctx.m2Yoy > 4 ? 'text-emerald-400' : ctx.m2Yoy < 1 ? 'text-red-400' : 'text-slate-200'}`}>
              {ctx.m2Yoy >= 0 ? '+' : ''}{ctx.m2Yoy.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">{ctx.m2Yoy > 4 ? 'Expansion — Rückenwind' : ctx.m2Yoy < 1 ? 'Stagnation — Gegenwind' : 'Moderat'}</div>
            <div className="text-[11px] text-slate-600 mt-2">FRED · echte Notenbankdaten</div>
          </div>
        )}
        {ctx?.dxyChange3m != null && (
          <div className="bg-white/5 border border-white/10 p-4" style={{ borderRadius: 8 }}>
            <div className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">💵 Dollar-Index (DXY, 3M)</div>
            <div className={`font-bold text-base ${ctx.dxyChange3m < -1 ? 'text-emerald-400' : ctx.dxyChange3m > 1 ? 'text-red-400' : 'text-slate-200'}`}>
              {ctx.dxyChange3m >= 0 ? '+' : ''}{ctx.dxyChange3m.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">{ctx.dxyChange3m < -1 ? 'Schwächerer Dollar — bullisch' : ctx.dxyChange3m > 1 ? 'Stärkerer Dollar — bärisch' : 'Seitwärts'}</div>
            <div className="text-[11px] text-slate-600 mt-2">FRED · invers zu Risiko-Assets</div>
          </div>
        )}
        {ctx?.netLiqChange3m != null && (
          <div className="bg-white/5 border border-white/10 p-4" style={{ borderRadius: 8 }}>
            <div className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">🏦 Net Liquidity (Fed)</div>
            <div className={`font-bold text-base ${ctx.netLiqChange3m > 1 ? 'text-emerald-400' : ctx.netLiqChange3m < -1 ? 'text-red-400' : 'text-slate-200'}`}>
              {ctx.netLiqChange3m >= 0 ? '+' : ''}{ctx.netLiqChange3m.toFixed(1)}% <span className="text-xs text-slate-500">(3M)</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">{ctx.netLiquidityUsd ? `≈ ${fmt(ctx.netLiquidityUsd)}` : 'WALCL − RRP − TGA'}</div>
            <div className="text-[11px] text-slate-600 mt-2">{ctx.netLiqChange3m > 1 ? 'Liquidität expandiert — Rückenwind' : ctx.netLiqChange3m < -1 ? 'Liquidität schrumpft — Gegenwind' : 'Stabil'}</div>
          </div>
        )}
        {ctx?.nasdaqChange3m != null && (
          <div className="bg-white/5 border border-white/10 p-4" style={{ borderRadius: 8 }}>
            <div className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">📉 Tech-/Risiko-Markt (Nasdaq, 3M)</div>
            <div className={`font-bold text-base ${ctx.nasdaqChange3m > 1 ? 'text-emerald-400' : ctx.nasdaqChange3m < -1 ? 'text-red-400' : 'text-slate-200'}`}>
              {ctx.nasdaqChange3m >= 0 ? '+' : ''}{ctx.nasdaqChange3m.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">{ctx.nasdaqChange3m > 1 ? 'Risk-on — Rückenwind' : ctx.nasdaqChange3m < -1 ? 'Risk-off — Gegenwind' : 'Seitwärts'}</div>
            <div className="text-[11px] text-slate-600 mt-2">Krypto ist hoch-korreliert · KI-/Tech-Blasenrisiko (Burry)</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Price Forecast ───────────────────────────────────────────────────────────

const SCENARIO_META: Record<Scenario, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  bear: { label: 'Bär', emoji: '🐻', color: 'text-red-300', bg: 'bg-red-500/8', border: 'border-red-500/25' },
  base: { label: 'Basis', emoji: '⚖️', color: 'text-blue-200', bg: 'bg-blue-500/8', border: 'border-blue-500/25' },
  bull: { label: 'Bulle', emoji: '🐂', color: 'text-emerald-300', bg: 'bg-emerald-500/8', border: 'border-emerald-500/25' },
};

function ForecastPanel({ forecast, symbol }: { forecast: Forecast; symbol: string }) {
  const scenarios: Scenario[] = ['bear', 'base', 'bull'];
  return (
    <div className="border border-violet-500/20 p-6 bg-gradient-to-br from-violet-600/8 to-indigo-600/5" style={{ borderRadius: 10 }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest m-0 flex items-center gap-2">
          🔮 Preis-Prognose — Szenarien
        </h3>
        <span className="text-xs px-2.5 py-1 border border-white/15 bg-white/5 text-slate-300" style={{ borderRadius: 20 }}>
          Konfidenz: <span className={forecast.confidence === 'Mittel' ? 'text-yellow-300 font-semibold' : 'text-orange-300 font-semibold'}>{forecast.confidence}</span>
        </span>
      </div>
      <p className="text-xs text-slate-400 mt-1 mb-5">
        Drei Szenarien je Zeithorizont — abgeleitet aus Marktzyklus, globaler Liquidität, Fundamentaldaten & Bewertung.
        <span className="text-slate-500"> Keine Garantie, keine Finanzberatung.</span>
      </p>

      {/* Horizon cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {forecast.horizons.map((h) => (
          <div key={h.key} className="bg-white/4 border border-white/10 p-4" style={{ borderRadius: 10 }}>
            <div className="text-center mb-3">
              <div className="text-white font-bold text-base">{h.label}</div>
              <div className="text-[11px] text-slate-500 uppercase tracking-widest">Zielkurs · {symbol}</div>
            </div>
            <div className="space-y-2">
              {scenarios.map((sc) => {
                const m = SCENARIO_META[sc];
                const ret = h.returns[sc];
                return (
                  <div key={sc} className={`flex items-center justify-between gap-2 px-3 py-2 border ${m.bg} ${m.border}`} style={{ borderRadius: 8 }}>
                    <span className={`text-xs font-bold ${m.color} flex items-center gap-1.5 w-16 shrink-0`}>
                      <span>{m.emoji}</span>{m.label}
                    </span>
                    <span className="text-white font-bold font-mono text-sm flex-1 text-right">{fmt(h.prices[sc])}</span>
                    <span className={`text-xs font-semibold w-20 text-right ${pctColor(ret)}`}>
                      {ret > 0 ? '+' : ''}{ret >= 1000 ? `${(ret / 100).toFixed(1)}x` : `${ret.toFixed(0)}%`}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-center text-[11px] text-slate-600">
              Basis-CAGR ≈ <span className="text-slate-400">{h.cagr.base.toFixed(0)}%/Jahr</span>
            </div>
          </div>
        ))}
      </div>

      {/* Drivers */}
      <div className="mt-5">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Was die Prognose treibt</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {forecast.drivers.map((d, i) => {
            const dot = d.impact === 'pos' ? 'bg-emerald-400' : d.impact === 'neg' ? 'bg-red-400' : 'bg-slate-500';
            return (
              <div key={i} className="flex items-start gap-2.5 bg-white/4 border border-white/8 px-3 py-2.5" style={{ borderRadius: 8 }}>
                <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${dot}`} style={{ borderRadius: '50%' }} />
                <div className="min-w-0">
                  <div className="text-slate-200 text-sm font-semibold">{d.label}</div>
                  <div className="text-slate-500 text-xs mt-0.5 leading-snug">{d.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 text-[11px] text-slate-500 bg-white/3 border border-white/8 px-4 py-3 leading-relaxed" style={{ borderRadius: 8 }}>
        {forecast.notes.map((n, i) => <div key={i}>• {n}</div>)}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashboardAlertWidget({ coin }: { coin: CoinDetails }) {
  const price = coin.market_data.current_price.usd;
  const [target, setTarget] = useState('');
  const [dir, setDir] = useState<'above' | 'below'>('above');
  const [saved, setSaved] = useState(false);

  const save = () => {
    const t = parseFloat(target.replace(',', '.'));
    if (!isFinite(t) || t <= 0) return;
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') { try { Notification.requestPermission(); } catch { /* */ } }
    const a: Alert = { coinId: coin.id, symbol: coin.symbol.toUpperCase(), name: coin.name, image: coin.image.thumb, target: t, dir, createdAt: Date.now() };
    saveAlerts([a, ...loadAlerts().filter(x => !(x.coinId === a.coinId && x.dir === a.dir && x.target === a.target))]);
    setSaved(true); setTarget(''); setTimeout(() => setSaved(false), 2600);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 bg-white/4 border border-white/8 px-4 py-3" style={{ borderRadius: 8 }}>
      <span className="text-sm text-slate-300 flex items-center gap-1.5">🔔 Preis-Alert</span>
      <select value={dir} onChange={e => setDir(e.target.value as 'above' | 'below')}
        className="bg-white/5 border border-white/10 text-white text-sm px-2 py-1.5 outline-none" style={{ borderRadius: 6, colorScheme: 'dark' }}>
        <option value="above">über</option>
        <option value="below">unter</option>
      </select>
      <input value={target} onChange={e => setTarget(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save(); }}
        placeholder={fmt(price)} inputMode="decimal"
        className="w-28 bg-white/5 border border-white/10 text-white text-sm px-3 py-1.5 placeholder-slate-600 outline-none" style={{ borderRadius: 6 }} />
      <button onClick={save} disabled={!target}
        className="px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        style={{ borderRadius: 6, background: 'rgba(96,165,250,0.18)', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.4)' }}>
        Setzen
      </button>
      {saved && <span className="text-emerald-300 text-xs font-semibold">✓ Alert gespeichert</span>}
      <span className="text-slate-600 text-xs ml-auto hidden sm:block">aktuell {fmt(price)}</span>
    </div>
  );
}

function Dashboard({ data, onBack, isWatched, onToggleWatch, market, fg, ctx }: {
  data: DashboardData; onBack: () => void;
  isWatched: boolean; onToggleWatch: (id: string) => void;
  market: GlobalMarket | null; fg: FearGreed | null; ctx: MarketContext | null;
}) {
  const { coin, chart, defi } = data;
  const md = coin.market_data;
  const cat = getCategoryInfo(coin.categories);
  const risk = getRiskLevel(coin);
  const desc = stripHtml(coin.description.en || '');
  const short = desc.slice(0, 320) + (desc.length > 320 ? '…' : '');
  const [showFull, setShowFull] = useState(false);
  const pct24 = md.price_change_percentage_24h;
  const pct30 = md.price_change_percentage_30d_in_currency?.usd;
  const pct7  = md.price_change_percentage_7d_in_currency?.usd;
  const pct1y = md.price_change_percentage_1y_in_currency?.usd;
  const hasBurn = coin.categories.join(' ').toLowerCase().includes('burn') ||
    (md.total_supply != null && md.max_supply != null && md.total_supply < md.max_supply * 0.99);
  const deflationary = md.max_supply == null && md.total_supply != null;
  const isLive = md.market_cap.usd > 0 && md.total_volume.usd > 0;
  const tvl   = (defi?.tvl ?? 0) >= 1_000_000 ? defi!.tvl : undefined;
  const rev30 = tvl ? (defi?.revenue30d ?? defi?.revenue) : undefined;
  const fees30 = tvl ? defi?.fees30d : undefined;
  const pfRatio = tvl && rev30 ? (md.market_cap.usd / (rev30 * 12)).toFixed(1) : null;
  const stars = risk.label === 'Niedrig' ? 5 : risk.label === 'Mittel' ? 3 : Math.max(1, Math.round(risk.score / 100 * 5));

  // Erweiterte Indikatoren & szenario-basierte Preisprognose
  const indicators = computeIndicators(coin, chart);
  const forecast = computeForecast(coin, indicators, defi, market, fg, ctx);

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors cursor-pointer bg-transparent border-none p-0">
        <ArrowLeft size={16} /> Zurück zur Übersicht
      </button>

      {/* Identity */}
      <div className={`relative overflow-hidden border border-white/10 p-6 bg-gradient-to-br ${cat.gradient}`} style={{ borderRadius: 10 }}>
        <div className="flex flex-col md:flex-row gap-4 md:items-start">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {coin.image.large && <img src={coin.image.large} alt={coin.name} className="w-16 h-16 shrink-0" style={{ borderRadius: '50%' }} />}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-white m-0">{coin.name}</h2>
                <span className="text-slate-400 text-lg uppercase font-mono">{coin.symbol}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-0.5 border ${cat.badge}`} style={{ borderRadius: 4 }}>
                  {cat.emoji} {cat.label}
                </span>
                {coin.categories.slice(0, 2).filter(c => !c.toLowerCase().includes(cat.label.toLowerCase())).map(c => (
                  <span key={c} className="text-xs px-2 py-0.5 bg-white/8 text-slate-300 border border-white/10" style={{ borderRadius: 4 }}>{c}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge live={isLive} />
            {md.market_cap_rank && (
              <span className="text-xs text-slate-300 bg-white/8 border border-white/10 px-3 py-1 font-mono" style={{ borderRadius: 4 }}>
                #{md.market_cap_rank} Global
              </span>
            )}
            <button
              onClick={() => onToggleWatch(coin.id)}
              title={isWatched ? 'Von Watchlist entfernen' : 'Zur Watchlist hinzufügen'}
              className="cursor-pointer bg-transparent border-none p-1 transition-colors hover:scale-110"
            >
              <Star size={20} fill={isWatched ? '#F59E0B' : 'none'} className={isWatched ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'} />
            </button>
          </div>
        </div>
        <div className="mt-5 border-t border-white/10 pt-4 space-y-3">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1.5">💡 Einfach erklärt</div>
            <p className="text-slate-200 text-sm leading-relaxed m-0">
              {showFull ? desc : short}
              {desc.length > 320 && (
                <button onClick={() => setShowFull(!showFull)} className="ml-1 text-blue-400 hover:text-blue-300 text-xs underline bg-transparent border-none cursor-pointer p-0">
                  {showFull ? 'Weniger' : 'Mehr'}
                </button>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div><span className="text-slate-500">🎯 Zielgruppe: </span><span className="text-slate-200">{cat.audience}</span></div>
            {coin.genesis_date && <div><span className="text-slate-500">📅 Am Markt seit: </span><span className="text-slate-200">{ago(coin.genesis_date)} ({new Date(coin.genesis_date).getFullYear()})</span></div>}
            {coin.links.homepage[0] && (
              <a href={coin.links.homepage[0]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                <Globe size={13} /> Website <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Schneller Preis-Alert von der Coin-Seite */}
      <DashboardAlertWidget coin={coin} />

      {/* Value Proposition */}
      <ValueProp coin={coin} cat={cat} defi={defi} />

      {/* 🔮 Price Forecast — Szenarien (headline feature) */}
      <ForecastPanel forecast={forecast} symbol={coin.symbol.toUpperCase()} />

      {/* 📡 Advanced Indicators */}
      <IndicatorPanel ind={indicators} ctx={ctx} />

      {/* Investors, Partnerships & Physical Products */}
      <InvestorsSection coinId={coin.id} />

      {/* 5 KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard label="💰 Preis" value={fmt(md.current_price.usd)} sub={fmtPct(pct24)} color={pctColor(pct24)} />
        <MetricCard label="📊 Marktkapitalisierung" value={fmt(md.market_cap.usd)} sub={`FDV: ${fmt(md.fully_diluted_valuation.usd || 0)}`} />
        <MetricCard label="🏆 Rang" value={md.market_cap_rank ? `#${md.market_cap_rank}` : '—'} sub="nach Marktkapitalisierung" />
        <MetricCard label="💹 24h Volumen" value={fmt(md.total_volume.usd)} sub={`${((md.total_volume.usd / (md.market_cap.usd || 1)) * 100).toFixed(1)}% der Marktkapitalisierung`} />
        <MetricCard label="📈 24h Hoch / Tief" value={fmt(md.high_24h.usd)} sub={`Tief: ${fmt(md.low_24h.usd)}`} />
      </div>

      {/* Performance + Token Economics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white/5 border border-white/10 p-5" style={{ borderRadius: 8 }}>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2 m-0">
            <TrendingUp size={15} className="text-blue-400" /> Preis-Performance (12 Monate)
          </h3>
          <div className="mb-4"><Sparkline prices={chart.prices} /></div>
          <div className="space-y-2.5">
            <ChangeRow label="24 Stunden" value={pct24} barMax={30} />
            <ChangeRow label="7 Tage"     value={pct7}  barMax={50} />
            <ChangeRow label="30 Tage"    value={pct30} barMax={100} />
            <ChangeRow label="1 Jahr"     value={pct1y} barMax={500} />
          </div>
          <div className="mt-4 pt-4 border-t border-white/8 grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-slate-500 mb-0.5">All-Time High</div>
              <div className="text-emerald-400 font-bold">{fmt(md.ath.usd)}</div>
              <div className="text-xs text-slate-500">{md.ath_date.usd?.slice(0, 10)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-0.5">All-Time Low</div>
              <div className="text-red-400 font-bold">{fmt(md.atl.usd)}</div>
              <div className="text-xs text-slate-500">{md.atl_date.usd?.slice(0, 10)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-5" style={{ borderRadius: 8 }}>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2 m-0">
            <Lock size={15} className="text-violet-400" /> Token-Ökonomie
          </h3>
          <SupplyBar circulating={md.circulating_supply} max={md.max_supply} />
          <div className="mt-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 flex items-center gap-1.5"><Flame size={13} className="text-orange-400" /> Token-Burns</span>
              <span className={deflationary || hasBurn ? 'text-orange-300 font-semibold' : 'text-slate-500'}>
                {deflationary ? 'Deflationär (kein Cap)' : hasBurn ? 'Ja — Burns aktiv' : 'Keine bekannten Burns'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Gesamt-Angebot</span>
              <span className="text-white">{md.total_supply ? fmtNum(md.total_supply) : '∞ / Unbegrenzt'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Max. Angebot</span>
              <span className="text-white">{md.max_supply ? fmtNum(md.max_supply) : '— (kein Limit)'}</span>
            </div>
            {md.max_supply && md.circulating_supply < md.max_supply && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1.5"><ChevronDown size={13} className="text-yellow-400" /> Noch freizugebende Tokens</span>
                <span className="text-yellow-300">{fmtNum(md.max_supply - md.circulating_supply)} ({((1 - md.circulating_supply / md.max_supply) * 100).toFixed(1)}%)</span>
              </div>
            )}
          </div>
          <div className="mt-5 pt-4 border-t border-white/8">
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">Entwickler-Aktivität (4 Wochen)</div>
            <div className="flex gap-4 flex-wrap text-sm">
              <div><span className="text-slate-400">Commits: </span><span className="text-white font-semibold">{coin.developer_data.commit_count_4_weeks || '—'}</span></div>
              <div><span className="text-slate-400">Stars: </span><span className="text-white font-semibold">{fmtNum(coin.developer_data.stars)}</span></div>
              <div><span className="text-slate-400">Contributors: </span><span className="text-white font-semibold">{fmtNum(coin.developer_data.pull_request_contributors)}</span></div>
            </div>
            {coin.links.repos_url?.github?.[0] && (
              <a href={coin.links.repos_url.github[0]} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1 text-slate-400 hover:text-white text-xs">
                <GitBranch size={12} /> GitHub <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Protocol Health + Community */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white/5 border border-white/10 p-5" style={{ borderRadius: 8 }}>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2 m-0">
            <BarChart2 size={15} className="text-amber-400" /> Protokoll-Gesundheit
          </h3>
          {tvl ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Total Value Locked (TVL)</span>
                <span className="text-amber-300 font-bold text-lg">{fmt(tvl)}</span>
              </div>
              {rev30 != null && <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Einnahmen (30 Tage)</span><span className="text-emerald-300 font-semibold">{fmt(rev30)}</span></div>}
              {fees30 != null && <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Gebühren (30 Tage)</span><span className="text-white font-semibold">{fmt(fees30)}</span></div>}
              {pfRatio && (
                <div className="flex justify-between items-center pt-2 border-t border-white/8">
                  <span className="text-slate-400 text-sm">P/E-Ratio (Preis/Jahreseinnahmen)</span>
                  <span className={`font-bold ${parseFloat(pfRatio) < 30 ? 'text-emerald-400' : parseFloat(pfRatio) < 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {pfRatio}x {parseFloat(pfRatio) < 30 ? '(günstig)' : parseFloat(pfRatio) < 80 ? '(mittel)' : '(teuer)'}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Rentabel</span>
                {rev30 && rev30 > 0
                  ? <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={14} /> Ja</span>
                  : <span className="text-slate-500">Keine Daten</span>}
              </div>
              {defi?.change_1m != null && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">TVL Wachstum (30T)</span>
                  <span className={pctColor(defi.change_1m)}>{fmtPct(defi.change_1m)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-slate-500 text-sm">Kein DeFiLlama-Datensatz verfügbar (kein DeFi-Protokoll oder TVL unter Messschwelle).</div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">24h Handelsvolumen</span><span className="text-white">{fmt(md.total_volume.usd)}</span></div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Community-Sentiment</span>
                <span className={coin.sentiment_votes_up_percentage > 60 ? 'text-emerald-400' : 'text-red-400'}>
                  {coin.sentiment_votes_up_percentage?.toFixed(0) ?? '—'}% positiv
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 p-5" style={{ borderRadius: 8 }}>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2 m-0">
            <Users size={15} className="text-blue-400" /> Community & Adoption
          </h3>
          <div className="space-y-3">
            {coin.community_data.twitter_followers > 0 && (
              <div className="flex items-center justify-between"><span className="text-slate-400 text-sm flex items-center gap-1.5"><MessageCircle size={13} /> Twitter/X Follower</span><span className="text-white font-semibold">{fmtNum(coin.community_data.twitter_followers)}</span></div>
            )}
            {coin.community_data.reddit_subscribers > 0 && (
              <div className="flex items-center justify-between"><span className="text-slate-400 text-sm">Reddit Mitglieder</span><span className="text-white font-semibold">{fmtNum(coin.community_data.reddit_subscribers)}</span></div>
            )}
            <div className="flex items-center justify-between"><span className="text-slate-400 text-sm">GitHub Stars</span><span className="text-white font-semibold">{fmtNum(coin.developer_data.stars) || '—'}</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-400 text-sm">GitHub Forks</span><span className="text-white font-semibold">{fmtNum(coin.developer_data.forks) || '—'}</span></div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/8 flex flex-wrap gap-3">
            {coin.links.twitter_screen_name && (
              <a href={`https://twitter.com/${coin.links.twitter_screen_name}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-colors">
                <MessageCircle size={12} /> @{coin.links.twitter_screen_name}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Verdict */}
      <div className="border border-white/10 p-6 bg-gradient-to-br from-slate-800/60 to-slate-900/60" style={{ borderRadius: 10 }}>
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-5 m-0">🎯 Bewertung & Fazit</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <div className="text-center">
            <div className="text-3xl mb-1">{'⭐'.repeat(stars)}{'☆'.repeat(5 - stars)}</div>
            <div className="text-xs text-slate-400">Gesamt-Score</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${risk.color}`}>{risk.label}</div>
            <div className="text-xs text-slate-400">Risiko</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${isLive ? 'text-emerald-400' : 'text-red-400'}`}>{isLive ? '✓ Live' : '✗ Inaktiv'}</div>
            <div className="text-xs text-slate-400">Status</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${tvl && rev30 && rev30 > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
              {tvl && rev30 && rev30 > 0 ? '✓ Ja' : '— N/A'}
            </div>
            <div className="text-xs text-slate-400">Rentabel</div>
          </div>
        </div>
        <div className="bg-white/5 border-l-4 p-4 text-slate-300 text-sm leading-relaxed"
          style={{ borderColor: risk.label === 'Niedrig' ? '#10B981' : risk.label === 'Mittel' ? '#F59E0B' : '#EF4444' }}>
          <strong className="text-white">{coin.name} ({coin.symbol.toUpperCase()})</strong> ist {cat.blurb}{' '}
          {md.market_cap_rank && md.market_cap_rank <= 20
            ? 'Als Top-20-Projekt gehört es zu den etabliertesten Krypto-Assets der Welt.'
            : md.market_cap_rank && md.market_cap_rank <= 100
            ? 'Mit einem Platz in den Top 100 hat es sich eine solide Marktposition aufgebaut.'
            : 'Es befindet sich außerhalb der Top 100 und birgt damit ein erhöhtes Investitionsrisiko.'
          }
          {tvl ? ` Das Protokoll verwaltet ${fmt(tvl)} an gesperrtem Kapital (TVL).` : ''}
          {pct1y != null ? ` Über die letzten 12 Monate hat der Token ${pct1y >= 0 ? 'um' : 'um'} ${Math.abs(pct1y).toFixed(0)}% ${pct1y >= 0 ? 'zugelegt' : 'verloren'}.` : ''}
        </div>
        <div className="mt-3 text-xs text-slate-500">
          ⚠️ Diese Analyse dient ausschließlich zu Informationszwecken und stellt keine Finanzberatung dar. Daten von CoinGecko & DeFiLlama.
        </div>
      </div>

      {/* Back button bottom */}
      <button onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors cursor-pointer bg-transparent border-none p-0 pb-4">
        <ArrowLeft size={14} /> Neue Analyse starten
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type State = { type: 'idle' } | { type: 'loading' } | { type: 'loaded'; data: DashboardData } | { type: 'error'; message: string; id?: string };

export default function CryptoPortfolio() {
  const [state, setState] = useState<State>({ type: 'idle' });
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const [watchlist, setWatchlist] = useState<string[]>(loadWatchlist);
  const [market, setMarket] = useState<GlobalMarket | null>(null);
  const [fg, setFg] = useState<FearGreed | null>(null);
  const [ctx, setCtx] = useState<MarketContext | null>(null);
  const currentIdRef = useRef<string>('');

  useEffect(() => {
    getGlobalMarket().then(setMarket);
    getFearGreed().then(setFg);
    getMarketContext().then(setCtx);
  }, []);

  const goHome = useCallback(() => {
    currentIdRef.current = '';
    setState({ type: 'idle' });
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);

  const toggleWatchlist = useCallback((id: string) => {
    setWatchlist(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [id, ...prev];
      saveWatchlist(next);
      return next;
    });
  }, []);

  const load = useCallback(async (id: string) => {
    currentIdRef.current = id;
    if (decodeURIComponent(window.location.hash.replace(/^#/, '')) !== id) {
      window.location.hash = encodeURIComponent(id);
    }
    setState({ type: 'loading' });
    try {
      const [coin, chart] = await Promise.all([getCoinDetails(id), getMarketChart(id)]);
      const defi = await getDefiLlamaData(coin.symbol, coin.name);
      setState({ type: 'loaded', data: { coin, chart, defi } });
      const cat = getCategoryInfo(coin.categories);
      const risk = getRiskLevel(coin);
      const entry: HistoryEntry = {
        id: coin.id, name: coin.name, symbol: coin.symbol.toUpperCase(),
        image: coin.image.thumb, price: coin.market_data.current_price.usd,
        pct24h: coin.market_data.price_change_percentage_24h ?? null,
        marketCap: coin.market_data.market_cap.usd,
        riskLabel: risk.label, riskColor: risk.color,
        categoryEmoji: cat.emoji, categoryLabel: cat.label, ts: Date.now(),
      };
      setHistory(prev => {
        const updated = [entry, ...prev.filter(h => h.id !== coin.id)].slice(0, 100);
        saveHistory(updated);
        return updated;
      });
    } catch (err) {
      setState({ type: 'error', message: err instanceof Error ? err.message : 'Unbekannter Fehler', id });
    }
  }, []);

  const preAddToHistory = useCallback((coin: TopCoin) => {
    setHistory(prev => {
      // don't overwrite an entry that already has full data (has a real categoryLabel)
      const existing = prev.find(h => h.id === coin.id);
      if (existing && existing.categoryLabel !== '—') return prev;
      const entry: HistoryEntry = existing
        ? { ...existing, ts: Date.now() }
        : {
            id: coin.id, name: coin.name, symbol: coin.symbol.toUpperCase(),
            image: coin.image, price: coin.current_price,
            pct24h: coin.price_change_percentage_24h ?? null,
            marketCap: coin.market_cap,
            riskLabel: '—', riskColor: 'text-slate-400',
            categoryEmoji: '💎', categoryLabel: '—', ts: Date.now(),
          };
      const updated = [entry, ...prev.filter(h => h.id !== coin.id)].slice(0, 100);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => { setHistory([]); saveHistory([]); }, []);

  // Deep-Linking: #coinId in der URL → teilbare/bookmarkbare Analyse + Browser-Zurück.
  useEffect(() => {
    const onHash = () => {
      const id = decodeURIComponent(window.location.hash.replace(/^#/, '')).trim();
      if (id && id !== currentIdRef.current) load(id);
      else if (!id && currentIdRef.current) goHome();
    };
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [load, goHome]);
  const loadedId = state.type === 'loaded' ? state.data.coin.id : '';

  return (
    <div className="min-h-screen" style={{ background: '#0A0F1E' }}>
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-xs text-slate-500 bg-white/5 border border-white/10 px-4 py-2 mb-4" style={{ borderRadius: 20 }}>
            <Activity size={12} className="text-emerald-400" />
            Echtzeit-Daten via CoinGecko & DeFiLlama — kein API-Key erforderlich
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 mt-0">
            {state.type === 'loaded'
              ? <button onClick={goHome} className="hover:text-slate-300 transition-colors cursor-pointer bg-transparent border-none p-0 text-3xl md:text-4xl font-bold text-white">Crypto Portfolio Analyse</button>
              : 'Crypto Portfolio Analyse'
            }
          </h1>
          <p className="text-slate-400 text-base m-0">Gib einen Token ein und erhalte sofort alle wichtigen KPIs — verständlich erklärt.</p>
        </div>

        {/* Global Market Bar */}
        <MarketBar market={market} fg={fg} />

        <SearchBar onSelect={load} />

        <div className="mt-8">
          {state.type === 'idle' && (
            <div>
              <MarketRegimeBanner market={market} fg={fg} ctx={ctx} />
              <PortfolioPanel onSelect={load} />
              <WatchlistPanel ids={watchlist} history={history} onSelect={load} />
              <AlertsPanel onSelect={load} />
              <TopMovers onSelect={load} />
              <CompareTool onSelect={load} />
              <HistoryPanel history={history} onSelect={load} onClear={clearHistory} />
              <TopCoinsGrid onSelect={load} onPreAdd={preAddToHistory} />
            </div>
          )}
          {state.type === 'loading' && (
            <div className="text-center py-20">
              <div className="inline-block w-10 h-10 border-2 border-slate-600 border-t-blue-400 animate-spin mb-4" style={{ borderRadius: '50%' }} />
              <div className="text-slate-400">Analysiere Token…</div>
              <div className="text-slate-600 text-sm mt-1">CoinGecko + DeFiLlama werden abgefragt</div>
            </div>
          )}
          {state.type === 'error' && (
            <div className="text-center py-16">
              <AlertTriangle className="mx-auto mb-3 text-red-400" size={40} />
              <div className="text-red-400 font-semibold mb-1">{state.message}</div>
              <div className="mt-5 flex items-center justify-center gap-3">
                {state.id && (
                  <button onClick={() => load(state.id!)}
                    className="px-4 py-2 text-sm font-semibold cursor-pointer transition-colors"
                    style={{ borderRadius: 6, background: 'rgba(96,165,250,0.18)', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.4)' }}>
                    🔄 Erneut versuchen
                  </button>
                )}
                <button onClick={goHome} className="text-slate-500 hover:text-white text-sm underline bg-transparent border-none cursor-pointer flex items-center gap-1.5">
                  <ArrowLeft size={14} /> Zurück zur Suche
                </button>
              </div>
            </div>
          )}
          {state.type === 'loaded' && (
            <Dashboard data={state.data} onBack={goHome} isWatched={watchlist.includes(loadedId)} onToggleWatch={toggleWatchlist} market={market} fg={fg} ctx={ctx} />
          )}
        </div>

        {/* Footer: Steuer-Brücke, Datenquellen & Disclaimer */}
        <footer className="mt-12 pt-6 border-t border-white/10 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>🔮 <span className="text-slate-400">CryptoAgent</span></span>
              <a href="https://tax.alpen-huettentouren.de" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">🧾 Krypto-Steuer berechnen →</a>
            </div>
            <span className="text-slate-600">Daten: CoinGecko · DeFiLlama · FRED · alternative.me</span>
          </div>
          <p className="mt-3 text-slate-600 leading-relaxed m-0">
            ⚠️ Keine Anlage- oder Steuerberatung. Alle Kennzahlen, Indikatoren und Prognosen dienen ausschließlich
            der Information. Krypto-Assets sind hochvolatil — Totalverlust ist möglich. Prognosen sind szenario-basiert
            und keine Garantie.
          </p>
        </footer>
      </div>
    </div>
  );
}
