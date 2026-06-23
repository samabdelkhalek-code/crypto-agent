// ─────────────────────────────────────────────────────────────────────────────
//  forecast.ts — Transparentes, szenario-basiertes Prognose- & Indikator-Modul
//
//  WICHTIG: Dies ist KEINE Wahrsagerei. Krypto-Preise sind nicht deterministisch
//  vorhersagbar. Dieses Modul berechnet *Szenarien* (Bär / Basis / Bulle) aus
//  nachvollziehbaren, dokumentierten Annahmen — Marktzyklus, globale Liquidität,
//  Fundamentaldaten, Verwässerung und Bewertung. Jeder Treiber wird offengelegt.
//  Inspiriert von Frameworks der Milk-Road-/MR-Macro-Gäste (Michael Howell:
//  globale Liquidität / 65-Monats-Zyklus; CryptoQuant/Glassnode: On-Chain;
//  Raoul Pal: Adoptionskurve; Bitwise: Bewertungsmodelle).
// ─────────────────────────────────────────────────────────────────────────────

import type {
  CoinDetails, MarketChart, DefiLlamaProtocol, GlobalMarket, FearGreed, MarketContext,
} from './cryptoApi';

// ─── Technische & Zyklus-Indikatoren ────────────────────────────────────────

export interface Indicators {
  ma200: number | null;          // 200-Tage gleitender Durchschnitt (USD)
  mayerMultiple: number | null;  // Preis / 200T-SMA  (Klassiker: >2.4 heiß, <0.8 günstig)
  volatility: number | null;     // annualisierte Volatilität (aus Tages-Log-Returns)
  maxDrawdown: number | null;    // tiefster Peak-to-Trough im Fenster (negativ, %)
  drawdownFromAth: number;       // aktueller Abstand zum ATH (negativ, %)
  rsi14: number | null;          // Relative-Stärke-Index (14T, 0–100)
  sharpe: number | null;         // (1J-Return − rf) / annualisierte Vol
  return1y: number | null;       // 1-Jahres-Return aus der Kurve (%)
  remainingDilution: number;     // (max − umlauf) / umlauf  (potenzielle Verwässerung, %)
  daysSinceHalving: number;
  daysToNextHalving: number;
  cyclePhase: CyclePhase;
  liquidityRegime: LiquidityRegime;
  liquidityBias: number;         // annualisierter Bias aus dem 65-Monats-Liquiditätszyklus
  volToMcap: number | null;      // Liquidität: 24h-Volumen / Marktkap.
}

export interface CyclePhase {
  label: string;
  desc: string;
  // Bias auf die kurz-/mittelfristige Markterwartung (annualisiert)
  nearBias: number;
  midBias: number;
}

export interface LiquidityRegime {
  label: string;
  desc: string;
  direction: 'expansion' | 'contraction' | 'neutral';
}

// Bitcoin-Halvings (UTC, approximativ) — Anker für die Zyklus-Uhr
const HALVINGS = [
  new Date('2012-11-28'), new Date('2016-07-09'),
  new Date('2020-05-11'), new Date('2024-04-20'),
];
const NEXT_HALVING = new Date('2028-04-20');
const DAY = 86_400_000;

// Michael Howells globaler Liquiditätszyklus ~65 Monate. Letztes Hoch ≈ Q3 2025.
const LIQ_PERIOD_MONTHS = 65;
const LIQ_LAST_PEAK = new Date('2025-09-01');

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + (b.getDate() - a.getDate()) / 30.44;
}

function computeLiquidity(now: Date): { regime: LiquidityRegime; bias: number } {
  const m = ((monthsBetween(LIQ_LAST_PEAK, now) % LIQ_PERIOD_MONTHS) + LIQ_PERIOD_MONTHS) % LIQ_PERIOD_MONTHS;
  // dL/dt ∝ −sin(2π·m/period): direkt nach dem Hoch fällt die Liquidität (negativer Bias),
  // nach dem Tief (m≈32.5) steigt sie wieder (positiver Bias).
  const bias = -Math.sin((2 * Math.PI * m) / LIQ_PERIOD_MONTHS) * 0.13;
  let regime: LiquidityRegime;
  if (bias > 0.02) regime = { label: 'Expansion', desc: 'Globale Liquidität steigt (Rückenwind für Risiko-Assets)', direction: 'expansion' };
  else if (bias < -0.02) regime = { label: 'Kontraktion', desc: 'Globale Liquidität sinkt — Howells ~65-Monats-Zyklus im Abschwung (Gegenwind)', direction: 'contraction' };
  else regime = { label: 'Wendepunkt', desc: 'Liquiditätszyklus nahe Hoch oder Tief — Trendwechsel wahrscheinlich', direction: 'neutral' };
  return { regime, bias };
}

function computeCyclePhase(daysSinceHalving: number): CyclePhase {
  // Historisch toppte BTC ~525–550 Tage nach dem Halving, danach Bär-Phase.
  if (daysSinceHalving < 180) return {
    label: 'Akkumulation', desc: 'Frühe Phase nach dem Halving — historisch Aufbau vor dem Hauptanstieg.',
    nearBias: 0.05, midBias: 0.18,
  };
  if (daysSinceHalving < 480) return {
    label: 'Bull-Hauptphase', desc: 'Historisch die stärkste Zyklus-Phase (≈6–16 Monate nach Halving).',
    nearBias: 0.12, midBias: 0.15,
  };
  if (daysSinceHalving < 620) return {
    label: 'Spätzyklus / Top-Region', desc: 'Historische Top-Zone — erhöhtes Korrekturrisiko, Gewinnmitnahmen.',
    nearBias: -0.05, midBias: -0.08,
  };
  if (daysSinceHalving < 900) return {
    label: 'Bär / Abkühlung', desc: 'Nach der Top-Region — historisch Korrektur & Bodenbildung.',
    nearBias: -0.10, midBias: 0.02,
  };
  return {
    label: 'Bodenbildung / Vor-Halving', desc: 'Spätes Zyklustief — historisch Aufbau vor dem nächsten Halving.',
    nearBias: 0.04, midBias: 0.14,
  };
}

// RSI(14) aus täglichen Schlusskursen
function computeRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const ch = closes[i] - closes[i - 1];
    if (ch >= 0) gains += ch; else losses -= ch;
  }
  const avgGain = gains / period, avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function computeIndicators(coin: CoinDetails, chart: MarketChart): Indicators {
  const md = coin.market_data;
  const now = new Date();
  const closes = chart.prices.map((p) => p[1]).filter((v) => isFinite(v) && v > 0);

  // 200-Tage-SMA & Mayer Multiple
  let ma200: number | null = null;
  if (closes.length >= 200) {
    const last200 = closes.slice(-200);
    ma200 = last200.reduce((a, b) => a + b, 0) / last200.length;
  }
  const price = md.current_price.usd;
  const mayerMultiple = ma200 ? price / ma200 : null;

  // Annualisierte Volatilität aus täglichen Log-Returns
  let volatility: number | null = null;
  if (closes.length > 30) {
    const rets: number[] = [];
    for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length;
    volatility = Math.sqrt(variance) * Math.sqrt(365);
  }

  // Max Drawdown im Fenster
  let maxDrawdown: number | null = null;
  if (closes.length > 2) {
    let peak = closes[0], mdd = 0;
    for (const c of closes) { if (c > peak) peak = c; const dd = (c - peak) / peak; if (dd < mdd) mdd = dd; }
    maxDrawdown = mdd * 100;
  }

  const drawdownFromAth = md.ath.usd > 0 ? ((price - md.ath.usd) / md.ath.usd) * 100 : 0;
  const rsi14 = computeRSI(closes);
  const return1y = closes.length > 2 ? ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100 : (md.price_change_percentage_1y_in_currency?.usd ?? null);
  const sharpe = volatility && return1y != null ? (return1y / 100 - 0.04) / volatility : null;

  const remainingDilution = md.max_supply && md.circulating_supply
    ? ((md.max_supply - md.circulating_supply) / md.circulating_supply) * 100 : 0;

  const lastHalving = HALVINGS[HALVINGS.length - 1];
  const daysSinceHalving = Math.floor((now.getTime() - lastHalving.getTime()) / DAY);
  const daysToNextHalving = Math.max(0, Math.floor((NEXT_HALVING.getTime() - now.getTime()) / DAY));

  const { regime, bias } = computeLiquidity(now);
  const volToMcap = md.market_cap.usd > 0 ? md.total_volume.usd / md.market_cap.usd : null;

  return {
    ma200, mayerMultiple, volatility, maxDrawdown, drawdownFromAth, rsi14, sharpe, return1y,
    remainingDilution, daysSinceHalving, daysToNextHalving,
    cyclePhase: computeCyclePhase(daysSinceHalving),
    liquidityRegime: regime, liquidityBias: bias, volToMcap,
  };
}

// ─── Fundamental-Score (0–100) ──────────────────────────────────────────────

export function fundamentalScore(coin: CoinDetails, defi: DefiLlamaProtocol | null, ind: Indicators): number {
  const md = coin.market_data;
  let s = 0;
  const rank = md.market_cap_rank ?? 999;
  if (rank <= 10) s += 25; else if (rank <= 50) s += 18; else if (rank <= 100) s += 10; else s += 3;

  const commits = coin.developer_data.commit_count_4_weeks ?? 0;
  if (commits > 50) s += 15; else if (commits > 10) s += 9; else if (commits > 0) s += 3;

  const tvl = (defi?.tvl ?? 0);
  const rev = defi?.revenue30d ?? defi?.revenue ?? 0;
  if (tvl >= 1e6 && rev > 0) s += 18; else if (tvl >= 1e6) s += 9;

  const r1 = ind.return1y;
  if (r1 != null) { if (r1 > 50) s += 8; else if (r1 > 0) s += 4; else if (r1 < -60) s -= 6; }

  const tw = coin.community_data.twitter_followers ?? 0;
  if (tw > 500_000) s += 8; else if (tw > 100_000) s += 4;

  if (ind.remainingDilution < 10) s += 10; else if (ind.remainingDilution < 40) s += 5; else if (ind.remainingDilution > 80) s -= 8;

  if (coin.genesis_date) {
    const yrs = (Date.now() - new Date(coin.genesis_date).getTime()) / (365.25 * DAY);
    if (yrs >= 5) s += 10; else if (yrs >= 2) s += 5;
  }

  // Bewertungs-Sicherheitsmarge: tief unter ATH bei guten Fundamentaldaten = Erholungspotenzial
  if (ind.drawdownFromAth < -70 && rank <= 100) s += 4;

  return Math.max(0, Math.min(100, s));
}

// ─── Beta (Aggressivität ggü. dem Gesamtmarkt) ──────────────────────────────

function coinBeta(coin: CoinDetails): { beta: number; label: string } {
  const cats = coin.categories.join(' ').toLowerCase();
  if (cats.includes('stablecoin')) return { beta: 0.03, label: 'Stablecoin (≈ wertstabil)' };
  const rank = coin.market_data.market_cap_rank ?? 999;
  let beta: number, label: string;
  if (coin.id === 'bitcoin') { beta = 0.85; label = 'BTC — Markt-Anker'; }
  else if (coin.id === 'ethereum') { beta = 1.0; label = 'ETH — Leitwährung Altcoins'; }
  else if (rank <= 10) { beta = 1.2; label = 'Large-Cap'; }
  else if (rank <= 25) { beta = 1.4; label = 'Large/Mid-Cap'; }
  else if (rank <= 50) { beta = 1.65; label = 'Mid-Cap'; }
  else if (rank <= 100) { beta = 1.9; label = 'Small-Cap'; }
  else { beta = 2.3; label = 'Micro-Cap (hohes Beta)'; }
  if (cats.includes('meme')) { beta += 0.6; label = 'Meme (extrem hohes Beta)'; }
  return { beta, label };
}

// ─── Forecast ───────────────────────────────────────────────────────────────

export type Scenario = 'bear' | 'base' | 'bull';

export interface HorizonForecast {
  key: string;
  label: string;
  years: number;
  prices: Record<Scenario, number>;
  returns: Record<Scenario, number>; // Gesamt-% ggü. heute
  cagr: Record<Scenario, number>;    // annualisiert %
}

export interface ForecastDriver {
  label: string;
  detail: string;
  impact: 'pos' | 'neg' | 'neutral';
}

export interface Forecast {
  horizons: HorizonForecast[];
  drivers: ForecastDriver[];
  confidence: 'Niedrig' | 'Mittel';
  fundamental: number;
  betaLabel: string;
  isStable: boolean;
  notes: string[];
}

// Markt-Basisannahmen (annualisierte Renditen für ein „Beta-1"-Asset) — bewusst
// konservativ & offengelegt; sie spiegeln den breiten Krypto-Markt wider.
const MARKET: Record<string, Record<Scenario, number>> = {
  near:  { bear: -0.55, base: 0.08, bull: 0.85 },  // 3–6 Monate (annualisiert)
  mid:   { bear: -0.45, base: 0.22, bull: 1.05 },  // 12 Monate
  long:  { bear: -0.10, base: 0.18, bull: 0.42 },  // 3–5 Jahre (annualisiert, mean-reverting)
};

const HORIZONS = [
  { key: 'near', label: '3–6 Monate', years: 0.42, regime: 'near' as const },
  { key: 'mid',  label: '12 Monate',  years: 1.0,  regime: 'mid' as const },
  { key: 'long', label: '3–5 Jahre',  years: 4.0,  regime: 'long' as const },
];

// Sicherheits-Deckel für den Bull-Multiplikator über 4 Jahre nach Marktgröße
// (Gesetz der großen Zahlen — Mega-Caps können nicht 50x machen).
function bullCap(mcap: number, years: number): number {
  let cap4y: number;
  if (mcap > 500e9) cap4y = 5;
  else if (mcap > 100e9) cap4y = 8;
  else if (mcap > 10e9) cap4y = 15;
  else if (mcap > 1e9) cap4y = 30;
  else cap4y = 60;
  return Math.pow(cap4y, years / 4);
}

export function computeForecast(
  coin: CoinDetails,
  ind: Indicators,
  defi: DefiLlamaProtocol | null,
  _market: GlobalMarket | null,
  fg: FearGreed | null,
  ctx: MarketContext | null,
): Forecast {
  const md = coin.market_data;
  const price = md.current_price.usd;
  const mcap = md.market_cap.usd;
  const { beta, label: betaLabel } = coinBeta(coin);
  const fund = fundamentalScore(coin, defi, ind);
  const tilt = (fund - 50) / 50; // −1 … +1
  const cats = coin.categories.join(' ').toLowerCase();
  const isStable = cats.includes('stablecoin');

  // Stablecoins: Preisprognose ≈ Peg
  if (isStable) {
    const flat = (): HorizonForecast['prices'] => ({ bear: price * 0.97, base: price, bull: price * 1.01 });
    return {
      isStable: true,
      betaLabel, fundamental: fund, confidence: 'Mittel',
      horizons: HORIZONS.map((h) => {
        const prices = flat();
        return {
          key: h.key, label: h.label, years: h.years, prices,
          returns: { bear: -3, base: 0, bull: 1 },
          cagr: { bear: -3, base: 0, bull: 1 },
        };
      }),
      drivers: [{ label: 'Stablecoin', detail: 'An eine Fiat-Währung gekoppelt — Kurs bleibt nahe Peg. Hauptrisiko ist ein De-Peg.', impact: 'neutral' }],
      notes: ['Stablecoins sind an einen Referenzwert (meist USD) gebunden; eine Preisprognose ist nur im De-Peg-Risiko sinnvoll.'],
    };
  }

  // Kontrarian-Bias aus Fear & Greed (nur kurzfristig stark, mittelfristig halb)
  const fgVal = fg?.value ?? 50;
  const fgBiasNear = ((45 - fgVal) / 100) * 0.6;
  const fgBiasMid = fgBiasNear * 0.4;

  // Verwässerungs-Drag (annualisiert): je mehr Tokens noch ausstehen, desto stärker
  // bremst künftige Emission den Preis. Gedeckelt bei ~6 %/Jahr.
  const dilutionDragAnnual = Math.min(ind.remainingDilution / 100, 0.9) * 0.06;

  // Stablecoin-Liquidität ("dry powder"): steigende aggregierte Stablecoin-Marktkap.
  // = frisches Kaufkapital am Seitenrand → bullisch (Howell/Bitwise-Logik).
  const stableChg = ctx?.stablecoinChange30d ?? null;
  const stableBias = stableChg != null ? Math.max(-0.10, Math.min(0.10, (stableChg / 100) * 1.0)) : 0;

  // BTC Pi-Cycle: marktweites Zyklus-Top-Signal. ≥1 = historische Top-Zone (Gegenwind +
  // gedeckelter Bull-Case); <0.5 = frühe Zyklusphase (Rückenwind).
  const pi = ctx?.btcPiCycleRatio ?? null;
  const piBias = pi == null ? 0 : pi >= 1.0 ? -0.10 : pi >= 0.85 ? -0.04 : pi < 0.5 ? 0.06 : 0;
  const piBullCapFactor = pi != null && pi >= 1.0 ? 0.6 : pi != null && pi >= 0.85 ? 0.8 : 1;

  // Effektiver Liquiditäts-Bias: echte Makro-Daten (DXY+M2) überstimmen das datumsbasierte
  // Howell-Zyklusmodell, wenn vorhanden (60 % real / 40 % Zyklus); sonst nur Zyklusmodell.
  const effLiqBias = ctx?.macroLiquidityBias != null
    ? 0.6 * ctx.macroLiquidityBias + 0.4 * ind.liquidityBias
    : ind.liquidityBias;

  const horizons: HorizonForecast[] = HORIZONS.map((h) => {
    const m = MARKET[h.regime];
    const prices = {} as Record<Scenario, number>;
    const returns = {} as Record<Scenario, number>;
    const cagr = {} as Record<Scenario, number>;

    (['bear', 'base', 'bull'] as Scenario[]).forEach((sc) => {
      let marketAnnual = m[sc];

      // Zyklus- & Liquiditäts-Bias auf kurz-/mittelfristige Horizonte
      if (h.regime === 'near') marketAnnual += ind.cyclePhase.nearBias + effLiqBias + fgBiasNear + stableBias + piBias;
      else if (h.regime === 'mid') marketAnnual += ind.cyclePhase.midBias + effLiqBias * 0.6 + fgBiasMid + stableBias * 0.5 + piBias * 0.6;
      // Langfrist: Zyklen mitteln sich heraus — nur leichter Liquiditäts-Resteinfluss
      else marketAnnual += effLiqBias * 0.15;

      // In Log-Raum skalieren (stabiler bei großen Bewegungen)
      const mLog = Math.log(1 + Math.max(marketAnnual, -0.92));
      let cLog = mLog * beta;

      // Fundamental-Tilt: gute Fundamentaldaten heben Basis/Bull & federn Bär ab
      cLog += tilt * (sc === 'bear' ? 0.10 : 0.16);

      // Verwässerungs-Drag
      cLog -= dilutionDragAnnual;

      const annual = Math.exp(cLog) - 1;

      // Gesamt-Multiplikator über den Horizont
      let mult = Math.pow(1 + annual, h.years);

      // Sicherheits-Deckel (Bull) & Boden (Bär)
      if (sc === 'bull') {
        mult = Math.min(mult, bullCap(mcap, h.years));
        // Nahe einem Zyklus-Top wird der kurz-/mittelfristige Bull-Case gedämpft.
        if (h.regime !== 'long') mult *= piBullCapFactor;
      }
      if (sc === 'bear') mult = Math.max(mult, mcap > 10e9 ? 0.12 : 0.04);

      const target = price * mult;
      prices[sc] = target;
      returns[sc] = (mult - 1) * 100;
      cagr[sc] = (Math.pow(mult, 1 / h.years) - 1) * 100;
    });

    // Monotonie sicherstellen: bear ≤ base ≤ bull …
    if (prices.base < prices.bear) prices.base = prices.bear;
    if (prices.bull < prices.base) prices.bull = prices.base * 1.05;
    // … und %/CAGR aus den FINALEN Preisen neu ableiten, damit Anzeige konsistent bleibt.
    (['bear', 'base', 'bull'] as Scenario[]).forEach((sc) => {
      const mult = prices[sc] / price;
      returns[sc] = (mult - 1) * 100;
      cagr[sc] = (Math.pow(mult, 1 / h.years) - 1) * 100;
    });

    return { key: h.key, label: h.label, years: h.years, prices, returns, cagr };
  });

  // Treiber offenlegen
  const drivers: ForecastDriver[] = [];
  drivers.push({
    label: `Marktzyklus: ${ind.cyclePhase.label}`,
    detail: `${ind.daysSinceHalving} Tage seit dem letzten Halving. ${ind.cyclePhase.desc}`,
    impact: ind.cyclePhase.nearBias > 0 ? 'pos' : ind.cyclePhase.nearBias < 0 ? 'neg' : 'neutral',
  });
  drivers.push({
    label: `Globale Liquidität: ${ind.liquidityRegime.label}`,
    detail: ind.liquidityRegime.desc + ' (Howell-Framework, ~65-Monats-Zyklus).',
    impact: ind.liquidityRegime.direction === 'expansion' ? 'pos' : ind.liquidityRegime.direction === 'contraction' ? 'neg' : 'neutral',
  });
  if (ctx?.macroLiquidityBias != null) {
    const parts: string[] = [];
    if (ctx.m2Yoy != null) parts.push(`M2 ${ctx.m2Yoy >= 0 ? '+' : ''}${ctx.m2Yoy.toFixed(1)}% YoY`);
    if (ctx.dxyChange3m != null) parts.push(`DXY ${ctx.dxyChange3m >= 0 ? '+' : ''}${ctx.dxyChange3m.toFixed(1)}% (3M)`);
    if (ctx.netLiqChange3m != null) parts.push(`Net Liq ${ctx.netLiqChange3m >= 0 ? '+' : ''}${ctx.netLiqChange3m.toFixed(1)}% (3M)`);
    if (ctx.nasdaqChange3m != null) parts.push(`Nasdaq ${ctx.nasdaqChange3m >= 0 ? '+' : ''}${ctx.nasdaqChange3m.toFixed(1)}% (3M)`);
    drivers.push({
      label: `Makro-Liquidität (FRED): ${parts.join(' · ')}`,
      detail: ctx.macroLiquidityBias > 0.01
        ? 'Echte Notenbankdaten: expandierende Geldmenge / schwächerer Dollar — Rückenwind.'
        : ctx.macroLiquidityBias < -0.01
        ? 'Echte Notenbankdaten: knappere Geldmenge / stärkerer Dollar — Gegenwind.'
        : 'Echte Notenbankdaten: neutral.',
      impact: ctx.macroLiquidityBias > 0.01 ? 'pos' : ctx.macroLiquidityBias < -0.01 ? 'neg' : 'neutral',
    });
  }
  if (fg) drivers.push({
    label: `Fear & Greed: ${fg.value} (${fg.label})`,
    detail: fgVal < 35 ? 'Extreme Angst — historisch kontrarian bullish für die nächsten Monate.'
      : fgVal > 70 ? 'Gier — kurzfristig erhöhtes Rücksetzer-Risiko.'
      : 'Neutrales Sentiment.',
    impact: fgVal < 35 ? 'pos' : fgVal > 70 ? 'neg' : 'neutral',
  });
  if (stableChg != null) drivers.push({
    label: `Stablecoin-Liquidität: ${stableChg >= 0 ? '+' : ''}${stableChg.toFixed(1)}% (30T)`,
    detail: ctx?.stablecoinTotalUsd
      ? `Aggregierte Stablecoin-Marktkap. ≈ $${(ctx.stablecoinTotalUsd / 1e9).toFixed(0)}B. ${stableChg > 0 ? 'Wachsendes „dry powder" — Rückenwind.' : 'Schrumpfende Liquidität — Gegenwind.'}`
      : 'Liquiditäts-Momentum des Stablecoin-Marktes.',
    impact: stableChg > 1 ? 'pos' : stableChg < -1 ? 'neg' : 'neutral',
  });
  if (pi != null) drivers.push({
    label: `BTC Pi-Cycle: ${pi.toFixed(2)}`,
    detail: pi >= 1.0 ? 'Historische Zyklus-Top-Zone — erhöhtes Risiko, Bull-Case gedämpft.'
      : pi >= 0.85 ? 'Annäherung an die Top-Zone — Vorsicht.'
      : pi < 0.5 ? 'Frühe Zyklusphase — historisch viel Aufwärtspotenzial.'
      : 'Mittlere Zyklusphase — neutral.',
    impact: pi >= 0.85 ? 'neg' : pi < 0.5 ? 'pos' : 'neutral',
  });
  drivers.push({
    label: `Fundamental-Score: ${fund}/100`,
    detail: fund >= 65 ? 'Starke Fundamentaldaten (Rang, Entwicklung, Umsatz, Verwässerung).'
      : fund >= 40 ? 'Solide, aber gemischte Fundamentaldaten.' : 'Schwache Fundamentaldaten — höheres Risiko.',
    impact: fund >= 65 ? 'pos' : fund >= 40 ? 'neutral' : 'neg',
  });
  drivers.push({
    label: `Profil: ${betaLabel}`,
    detail: `Beta ≈ ${beta.toFixed(2)} — verstärkt Marktbewegungen ${beta > 1.5 ? 'stark' : beta > 1 ? 'moderat' : 'gedämpft'}.`,
    impact: 'neutral',
  });
  if (ind.remainingDilution > 40) drivers.push({
    label: `Verwässerung: ${ind.remainingDilution.toFixed(0)}% offen`,
    detail: 'Viele Tokens noch nicht im Umlauf — künftige Freisetzungen bremsen den Preis.',
    impact: 'neg',
  });
  if (ind.mayerMultiple != null) drivers.push({
    label: `Mayer Multiple: ${ind.mayerMultiple.toFixed(2)}`,
    detail: ind.mayerMultiple > 2.4 ? 'Preis weit über 200T-Schnitt — überhitzt.'
      : ind.mayerMultiple < 0.8 ? 'Preis unter 200T-Schnitt — historisch günstige Zone.'
      : 'Preis nahe 200T-Schnitt — neutral.',
    impact: ind.mayerMultiple > 2.4 ? 'neg' : ind.mayerMultiple < 0.8 ? 'pos' : 'neutral',
  });

  // Konfidenz: bewusst nur „Niedrig"/„Mittel" — Krypto ist nicht zuverlässig prognostizierbar
  const rank = md.market_cap_rank ?? 999;
  const hasHistory = (ind.return1y != null) && ind.ma200 != null;
  const confidence: Forecast['confidence'] = rank <= 50 && hasHistory ? 'Mittel' : 'Niedrig';

  const notes = [
    'Szenarien aus Marktzyklus, globaler Liquidität, Fundamentaldaten, Verwässerung & Bewertung — keine Garantie.',
    'Annahmen sind konservativ kalibriert und im Code offengelegt (forecast.ts → MARKET).',
    'Keine Finanzberatung. Krypto ist hochvolatil; Totalverlust ist möglich.',
  ];

  return { horizons, drivers, confidence, fundamental: fund, betaLabel, isStable: false, notes };
}

// ─── Marktlage-Ampel (aggregiertes Forward-Signal, coin-unabhängig) ──────────

export interface MarketRegime {
  label: string;
  emoji: string;           // 🟢 / 🟡 / 🟠 / 🔴
  bias: number;            // aggregierter annualisierter Forward-Bias
  drivers: { label: string; impact: 'pos' | 'neg' | 'neutral' }[];
}

export function computeMarketRegime(fg: FearGreed | null, ctx: MarketContext | null): MarketRegime {
  const now = new Date();
  const daysSinceHalving = Math.floor((now.getTime() - HALVINGS[HALVINGS.length - 1].getTime()) / DAY);
  const phase = computeCyclePhase(daysSinceHalving);
  const liq = computeLiquidity(now);
  const fgVal = fg?.value ?? 50;
  const fgContrarian = ((45 - fgVal) / 100) * 0.3; // kontrarian: Angst = positiv für die Zukunft
  const liqBias = ctx?.macroLiquidityBias != null ? 0.5 * ctx.macroLiquidityBias + 0.5 * liq.bias : liq.bias;
  const bias = phase.midBias + liqBias + fgContrarian;

  const drivers: MarketRegime['drivers'] = [
    { label: `Zyklus: ${phase.label}`, impact: phase.midBias > 0.02 ? 'pos' : phase.midBias < -0.02 ? 'neg' : 'neutral' },
    { label: `Liquidität: ${liq.regime.label}`, impact: liq.bias > 0.02 ? 'pos' : liq.bias < -0.02 ? 'neg' : 'neutral' },
  ];
  if (fg) drivers.push({ label: `Fear & Greed ${fg.value}`, impact: fgVal < 35 ? 'pos' : fgVal > 70 ? 'neg' : 'neutral' });
  if (ctx?.nasdaqChange3m != null) drivers.push({ label: `Nasdaq ${ctx.nasdaqChange3m >= 0 ? '+' : ''}${ctx.nasdaqChange3m.toFixed(0)}% (3M)`, impact: ctx.nasdaqChange3m > 1 ? 'pos' : ctx.nasdaqChange3m < -1 ? 'neg' : 'neutral' });

  let label: string, emoji: string;
  if (bias > 0.08) { label = 'Rückenwind · Risk-on'; emoji = '🟢'; }
  else if (bias > 0.02) { label = 'Leicht positiv'; emoji = '🟢'; }
  else if (bias >= -0.02) { label = 'Neutral · gemischt'; emoji = '🟡'; }
  else if (bias >= -0.08) { label = 'Gegenwind · Vorsicht'; emoji = '🟠'; }
  else { label = 'Risk-off · defensiv'; emoji = '🔴'; }

  return { label, emoji, bias, drivers };
}

// ─── Portfolio-Projektion (leichtgewichtig, ohne Coin-Details) ───────────────

// Beta aus Marktkap.-Rang — für die Portfolio-Hochrechnung ohne Detail-Fetch.
export function rankBeta(rank: number | null | undefined): number {
  if (rank == null) return 2.1;
  if (rank <= 2) return 0.9;
  if (rank <= 10) return 1.2;
  if (rank <= 25) return 1.4;
  if (rank <= 50) return 1.65;
  if (rank <= 100) return 1.9;
  return 2.2;
}

export interface PortfolioHorizon {
  key: string; label: string; years: number;
  mult: Record<Scenario, number>; // Faktor auf den heutigen Gesamtwert
}

// Szenario-Multiplikatoren für ein Portfolio mit gegebenem (wertgewichtetem) Beta.
export function portfolioProjection(beta: number): PortfolioHorizon[] {
  const cap: Record<string, number> = { near: 2.2, mid: 3.2, long: 8 }; // Bull-Deckel je Horizont
  return HORIZONS.map((h) => {
    const m = MARKET[h.regime];
    const mult = {} as Record<Scenario, number>;
    (['bear', 'base', 'bull'] as Scenario[]).forEach((sc) => {
      const annual = Math.exp(Math.log(1 + Math.max(m[sc], -0.92)) * beta) - 1;
      let x = Math.pow(1 + annual, h.years);
      if (sc === 'bull') x = Math.min(x, cap[h.key]);
      if (sc === 'bear') x = Math.max(x, 0.08);
      mult[sc] = x;
    });
    if (mult.base < mult.bear) mult.base = mult.bear;
    if (mult.bull < mult.base) mult.bull = mult.base * 1.05;
    return { key: h.key, label: h.label, years: h.years, mult };
  });
}
