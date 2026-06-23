# Milk Road / MR Macro — Interview-Partner, KPIs & Indikatoren

> Recherche-Grundlage für den Forecast-Agent. Stand: Juni 2026.
> Quellen: milkroad.com/podcast, milkroad.com/analysts, Capital Wars (Substack),
> CryptoQuant, Glassnode, Real Vision, Bitwise.

## 1. Milk Road interne Analysten (PRO)

| Person | Rolle | Was sie liefern | KPIs / Reports |
|---|---|---|---|
| **John Gillen** | Host *Milk Road Macro*, Ex-BlackRock | Makro-Framework, langfristige Krypto-Wertschöpfung | Liquidität, Marktstruktur, „Big Picture"-Reports |
| **Kyle** (Kyle Reidhead) | Co-Owner & Head of Research PRO | Markt-Setups, ETH-vs-BTC-Dynamik, Frühphasen-Investments | Wochen-Research, Portfolio-Calls |
| **Martin (m0xt)** | PRO-Analyst, Ex-Futures-Trader | Onchain + Fundamentaldaten, „Investing in public" | Research- & Investment-Reports, Onchain-Modelle |
| **Melvin** | Equity-Analyst (AI/Tech) | Value-Investing, AI-Aktien | Fundamental-Reports |
| **Vincent** | AI-PRO-Researcher | AI-Ökonomie, Unternehmen der AI-Wertschöpfung | Deep-Dives |

## 2. Wiederkehrende Gäste & ihre Spezial-Indikatoren

| Person | Firma / Quelle | Spezialität | Konkrete KPIs / Reports |
|---|---|---|---|
| **Michael Howell** | CrossBorder Capital / *Capital Wars* | Globale Liquidität — „Godfather of Global Liquidity" | **Global Liquidity Index** (~90 Länder); ~65-Monats-Liquiditätszyklus; Liquidität führt BTC ~13 Wochen voraus; Fiskaldominanz |
| **Julio Moreno** | CryptoQuant (Head of Research) | Onchain-Regime-Analyse | MVRV, SOPR, Exchange-Flows, Realized Price, 200-Tage-MA, Spot-Demand, Profit-Taking, Miner-Daten |
| **Willy Woo** | Glassnode / Swissblock | Onchain-Bewertung | NVT-Ratio, aktive Adressen, Realized Cap, Onchain-Momentum |
| **Matt Crosby** | Bitcoin Magazine Pro | BTC-Preis-Action / Onchain-TA | MVRV Z-Score, Pi-Cycle-Top, 200-Wochen-MA-Heatmap |
| **Raoul Pal** | Real Vision / Global Macro Investor | Adoptionskurve, Liquiditätsmodell | GMI-Liquiditätsmodell, „Banana Zone", Total3, Metcalfe-Adoption |
| **Jamie Coutts** | Real Vision (ex-Bloomberg) | Liquiditätsregime, Netzwerk-Wert | Globale Liquidität, Energy Value, Network Value |
| **James Seyffart** | Bloomberg Intelligence | ETF-Analyse | ETF-Flows, Genehmigungs-Wahrscheinlichkeiten, AUM |
| **Matt Hougan / Ryan Rasmussen** | Bitwise (CIO / Head of Research) | Institutionelle Adoption, Bewertung | ETF-Flows, Stablecoin-Wachstum, Bewertungsmodelle |
| **David Duong** | Coinbase Institutional | Quartals-Outlook | Institutionelle Kapitalflüsse, ETH-Bewertung |
| **Michael Nadeau** | The DeFi Report | Onchain-Zyklen & Bewertung | Liquidität, Marktzyklen, Protokoll-Umsätze, P/S-Ratios |
| **Scott Melker** | Wolf of All Streets | Technische Analyse | Chartmuster, Leverage/Funding, Markt-Psychologie |
| **Arthur Hayes** | Maelstrom | Makro-Liquidität & Geldpolitik | Fed-Politik, RRP/TGA-Liquidität, Geopolitik |
| **Milton Berg** | Milton Berg Advisors | Technische Zyklus-Signale | 30.000+ proprietäre Indikatoren, Buy/Sell-Klimaxe |
| **Jordi Visser** | Makro-Stratege | AI- & Rohstoff-getriebene Makro-Transition | Makro-Regime |
| **Michael Saylor** | Strategy (MicroStrategy) | BTC-Treasury-Strategie | Corporate-Holdings, BTC-Yield |
| **Jake Chervinsky** | Variant | Regulierung | CLARITY Act, Policy-Impact |
| **Alex Thorn** | Galaxy Digital | Research / Regulierung | Stablecoin-Regulierung, institutionelle Katalysatoren |

## 3. Im Agent umgesetzte Indikatoren (aus freien Daten)

Berechnet aus CoinGecko (365-Tage-Kurve) + DeFiLlama + alternative.me:

- **Mayer Multiple** (Preis ÷ 200-Tage-SMA) — Über-/Unterbewertung
- **RSI (14T)** — überkauft/überverkauft
- **Annualisierte Volatilität** — aus täglichen Log-Returns
- **Max Drawdown (1J)** & **Abstand zum ATH**
- **Sharpe-Ratio (1J)** — risiko-adjustierte Rendite
- **Liquidität** (24h-Volumen ÷ Marktkap.)
- **Verwässerung** (offener Anteil der Max-Supply)
- **Halving-Zyklus-Uhr** (Tage seit / bis Halving → Zyklusphase)
- **Globaler Liquiditätszyklus** (Howell-65-Monats-Modell, datumsbasiert)
- **Fear & Greed** (kontrarian)
- **Stablecoin-Aggregat-Liquidität** ✅ neu — DeFiLlama `stablecoincharts/all`, Total + 30T-Veränderung ("dry powder")
- **BTC Pi-Cycle** ✅ neu — 111T-MA ÷ (2 × 350T-MA) aus der BTC-Kurve; ≥1 = Top-Zone, <0.5 = frühe Phase

## 4. Empfohlene weitere Indikatoren (teils API-Key nötig)

| Indikator | Aussage | Quelle |
|---|---|---|
| **MVRV (Z-Score)** | Markt- vs. Realized-Value — Top/Bottom-Signal | Glassnode / CryptoQuant (Key) |
| **SOPR** | Realisieren Halter Gewinn/Verlust? | Glassnode / CryptoQuant |
| **Realized Price / Realized Cap** | Aggregierter Einstandspreis = Boden-Anker | Glassnode |
| **Exchange Net-Flows** | Akkumulation vs. Verkaufsdruck | CryptoQuant |
| **Spot-ETF-Flows** | Institutionelle Nachfrage (BTC/ETH) | Farside / SoSoValue |
| **Stablecoin-Marktkap. (Aggregat)** | „Trockenes Pulver" / Liquiditätsproxy | DeFiLlama (frei!) |
| **NUPL** | Aggregierter unrealisierter Gewinn/Verlust | Glassnode |
| **Puell Multiple** | Miner-Einnahmen-Stress | Glassnode (frei berechenbar) |
| **Pi-Cycle-Top** | Zyklus-Top-Timing (111DMA × 2 vs 350DMA) | aus Kurve berechenbar |
| **BTC-Dominanz-Trend** | Alt-Season-Rotation | CoinGecko (frei) |
| **Funding Rates / Open Interest** | Hebel & Liquidationsrisiko | Coinglass / Börsen-APIs |
| **DXY & US10Y** | Makro-Gegenwind/Rückenwind | FRED (frei) |
| **Global M2 / Net Liquidity** | Howells These direkt | FRED + Zentralbanken |
| **Metcalfe / aktive Adressen** | Netzwerk-Fundamentalwert | Glassnode / Artemis |
| **P/F- & P/S-Ratio** | Bewertung umsatzstarker Protokolle | DeFiLlama (frei!) |

**Status:** Stablecoin-Aggregat ✅, Pi-Cycle ✅ und **FRED-Makro (DXY + M2 +
Net Liquidity) ✅** sind eingebaut (Juni 2026). Noch offen ohne Key: P/S-Ratios
(DeFiLlama), Puell-Multiple.

**FRED (DXY / M2 / Net Liquidity):** war clientseitig CORS-blockiert — jetzt über
einen **Cloudflare Worker** (`worker/`) gelöst, der `fredgraph.csv` mit CORS
weiterreicht. Die App lädt darüber **DXY (3M-Trend)**, **M2 (YoY)** und **Fed Net
Liquidity** = WALCL − RRP − TGA (3M-Trend; ⚠️ Einheiten: WALCL/TGA in Mio., RRP in
Mrd. → ×1000). Aus den vorhandenen Signalen wird der **Mittelwert** als
Makro-Liquiditäts-Bias gebildet (verfeinert statt aufzublähen) und 60 % davon mit
dem datumsbasierten Howell-Zyklusmodell (40 %) gemischt. Aktivierung: Worker
deployen + `VITE_FRED_PROXY` in `.env` (siehe `worker/README.md`). Ohne Worker:
sauberer Fallback aufs Zyklusmodell. Validierung Juni 2026 (echte Daten): M2
**+5,4 % YoY**, Net Liquidity **≈ $5,76 T (+2,9 % / 3M)** → expansiver Bias.
