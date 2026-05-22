import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, ExternalLink, Twitter, Github, TrendingUp,
  Flame, Lock, Users, BarChart2, AlertTriangle, CheckCircle,
  Globe, ChevronDown,
} from 'lucide-react';
import {
  searchCoins, getCoinDetails, getMarketChart, getDefiLlamaData,
  type CoinSearchResult, type CoinDetails, type MarketChart, type DefiLlamaProtocol,
} from '../services/cryptoApi';

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

interface CategoryInfo {
  label: string; gradient: string; badge: string;
  audience: string; emoji: string; blurb: string;
}

function getCategoryInfo(categories: string[]): CategoryInfo {
  const c = categories.map((x) => x.toLowerCase()).join(' ');
  // L1 / L2 checked first — win over any ecosystem sub-tags
  if (c.includes('layer 1') || c.includes('smart contract platform') || c.includes('proof of work') || c.includes('proof of stake')) return {
    label: 'Layer-1 Blockchain', gradient: 'from-blue-600/30 to-sky-600/20', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    audience: 'Entwickler, Unternehmen & alle die dezentrale Apps nutzen', emoji: '🌐',
    blurb: 'Eine eigenständige Blockchain, auf der Entwickler dezentrale Anwendungen (dApps) und Smart Contracts erstellen können.',
  };
  if (c.includes('layer 2') || c.includes('rollup') || categories.some(cat => /^layer.?2$/i.test(cat) || /^optimism$/i.test(cat) || /^arbitrum$/i.test(cat))) return {
    label: 'Layer-2 Skalierung', gradient: 'from-violet-600/30 to-purple-600/20', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    audience: 'Nutzer, die günstigere & schnellere Transaktionen wollen', emoji: '⚡',
    blurb: 'Layer-2 baut auf einer bestehenden Blockchain auf und macht Transaktionen dramatisch günstiger und schneller.',
  };
  if (c.includes('oracle')) return {
    label: 'Blockchain-Oracle', gradient: 'from-blue-600/30 to-indigo-600/20', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    audience: 'Entwickler, die reale Daten in Blockchains einbinden', emoji: '🔮',
    blurb: 'Oracles verbinden Blockchains mit der realen Welt — sie liefern verlässliche Preis-, Wetter- und andere Echtdaten für Smart Contracts.',
  };
  if (c.includes('meme')) return {
    label: 'Meme-Coin', gradient: 'from-pink-600/30 to-rose-600/20', badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    audience: 'Spekulanten & Community-Mitglieder', emoji: '🎭',
    blurb: 'Ein Meme-Coin basiert primär auf Community-Hype und Viral-Marketing, nicht auf technologischem Nutzen.',
  };
  if (c.includes('gaming') || c.includes('play-to-earn')) return {
    label: 'Blockchain-Gaming', gradient: 'from-green-600/30 to-teal-600/20', badge: 'bg-green-500/20 text-green-300 border-green-500/30',
    audience: 'Gamer, die digitale Assets wirklich besitzen wollen', emoji: '🎮',
    blurb: 'Ein Gaming-Token ermöglicht echtes Eigentum an In-Game-Items und Belohnungen in Blockchain-Spielen.',
  };
  if (c.includes('nft')) return {
    label: 'NFT & Digitale Kunst', gradient: 'from-orange-600/30 to-yellow-600/20', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    audience: 'Kreative, Sammler & Künstler', emoji: '🎨',
    blurb: 'NFT-Plattformen ermöglichen den Kauf, Verkauf und die Erstellung einzigartiger digitaler Kunstwerke und Sammlerstücke.',
  };
  if (c.includes('decentralized exchange') || c.includes('automated market')) return {
    label: 'Dezentrale Börse', gradient: 'from-cyan-600/30 to-blue-600/20', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    audience: 'Trader und DeFi-Nutzer', emoji: '🔄',
    blurb: 'Eine dezentrale Börse (DEX) ermöglicht den direkten Handel von Krypto-Assets ohne zentrale Kontrollinstanz.',
  };
  if (c.includes('defi') || c.includes('lending') || c.includes('stablecoin') || c.includes('yield')) return {
    label: 'Decentralized Finance', gradient: 'from-yellow-600/30 to-amber-600/20', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    audience: 'Nutzer ohne Bankzugang & erfahrene DeFi-Anleger', emoji: '🏦',
    blurb: 'DeFi-Protokolle ersetzen traditionelle Finanzdienstleistungen (Kredite, Zinsen, Handel) durch transparente Smart Contracts.',
  };
  if (c.includes('privacy') || c.includes('zero knowledge')) return {
    label: 'Privacy & ZK', gradient: 'from-gray-600/30 to-slate-600/20', badge: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    audience: 'Datenschutz-bewusste Nutzer & Entwickler', emoji: '🔒',
    blurb: 'Privacy-Protokolle schützen Transaktionsdaten und ermöglichen anonyme oder vertrauliche Zahlungen.',
  };
  if (c.includes('exchange') || c.includes('derivatives')) return {
    label: 'Krypto-Börse', gradient: 'from-cyan-600/30 to-blue-600/20', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    audience: 'Trader, die Krypto-Assets kaufen und verkaufen wollen', emoji: '🏛️',
    blurb: 'Ein Börsen-Token berechtigt zu reduzierten Handelsgebühren und Governance-Rechten auf der jeweiligen Krypto-Handelsplattform.',
  };
  return {
    label: 'Krypto-Token', gradient: 'from-slate-600/30 to-slate-700/20', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    audience: 'Crypto-Investoren & Technologie-Interessierte', emoji: '💎',
    blurb: 'Ein dezentralisiertes digitales Asset auf der Blockchain mit spezifischen Nutzungsanwendungen im jeweiligen Ökosystem.',
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

// ─── Search ───────────────────────────────────────────────────────────────────

function SearchBar({ onSelect }: { onSelect: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CoinSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

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
          placeholder="Token-Name oder Symbol eingeben… (z.B. Bitcoin, ETH, Uniswap)"
          className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-base"
        />
        {loading && <div className="w-4 h-4 border-2 border-slate-500 border-t-blue-400 animate-spin" style={{ borderRadius: '50%' }} />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden" style={{ borderRadius: 8, background: '#1a2035', border: '1px solid rgba(255,255,255,0.15)' }}>
          {results.map((r) => (
            <button key={r.id} onClick={() => { onSelect(r.id); setQuery(r.name); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/8 transition-colors text-left">
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

// ─── Dashboard ────────────────────────────────────────────────────────────────

interface DashboardData { coin: CoinDetails; chart: MarketChart; defi: DefiLlamaProtocol | null; }

function Dashboard({ data }: { data: DashboardData }) {
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

  return (
    <div className="space-y-5">
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
            <ChangeRow label="30 Tage"    value={pct30} barMax={100} />
            <ChangeRow label="7 Tage"     value={pct7}  barMax={50} />
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
                <Github size={12} /> GitHub <ExternalLink size={10} />
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
              <div className="flex items-center justify-between"><span className="text-slate-400 text-sm flex items-center gap-1.5"><Twitter size={13} /> Twitter/X Follower</span><span className="text-white font-semibold">{fmtNum(coin.community_data.twitter_followers)}</span></div>
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
                <Twitter size={12} /> @{coin.links.twitter_screen_name}
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
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type State = { type: 'idle' } | { type: 'loading' } | { type: 'loaded'; data: DashboardData } | { type: 'error'; message: string };

export default function CryptoPortfolio() {
  const [state, setState] = useState<State>({ type: 'idle' });

  const load = useCallback(async (id: string) => {
    setState({ type: 'loading' });
    try {
      const [coin, chart] = await Promise.all([getCoinDetails(id), getMarketChart(id)]);
      const defi = await getDefiLlamaData(coin.symbol, coin.name);
      setState({ type: 'loaded', data: { coin, chart, defi } });
    } catch (err) {
      setState({ type: 'error', message: err instanceof Error ? err.message : 'Unbekannter Fehler' });
    }
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#0A0F1E' }}>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs text-slate-500 bg-white/5 border border-white/10 px-4 py-2 mb-4" style={{ borderRadius: 20 }}>
            <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse" style={{ borderRadius: '50%' }} />
            Echtzeit-Daten via CoinGecko & DeFiLlama — kein API-Key erforderlich
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 mt-0">Crypto Portfolio Analyse</h1>
          <p className="text-slate-400 text-base m-0">Gib einen Token ein und erhalte sofort alle wichtigen KPIs — verständlich erklärt.</p>
        </div>

        <SearchBar onSelect={load} />

        <div className="mt-8">
          {state.type === 'idle' && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-slate-500 mb-6">Suche nach Bitcoin, Ethereum, Solana, Uniswap…</div>
              <div className="flex flex-wrap justify-center gap-2">
                {['bitcoin', 'ethereum', 'solana', 'uniswap', 'chainlink', 'aave'].map(id => (
                  <button key={id} onClick={() => load(id)}
                    className="px-4 py-2 bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-sm transition-colors capitalize cursor-pointer"
                    style={{ borderRadius: 6, background: 'rgba(255,255,255,0.05)' }}>
                    {id.charAt(0).toUpperCase() + id.slice(1)}
                  </button>
                ))}
              </div>
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
              <div className="text-red-400 font-semibold">{state.message}</div>
              <button onClick={() => setState({ type: 'idle' })}
                className="mt-4 text-slate-500 hover:text-white text-sm underline bg-transparent border-none cursor-pointer">
                Zurück zur Suche
              </button>
            </div>
          )}
          {state.type === 'loaded' && <Dashboard data={state.data} />}
        </div>
      </div>
    </div>
  );
}
