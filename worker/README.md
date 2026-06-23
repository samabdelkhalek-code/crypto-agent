# FRED-Proxy (Cloudflare Worker)

Macht US-Notenbankdaten von [FRED](https://fred.stlouisfed.org/) im Browser nutzbar
(FRED setzt keine CORS-Header). Der Worker spricht die **FRED JSON-API**
(`api.stlouisfed.org`) serverseitig an, hängt deinen API-Key an, cached Erfolge am
Edge (6 h) und gibt JSON mit `Access-Control-Allow-Origin: *` zurück. Es sind nur
fest hinterlegte Series-IDs erlaubt (kein offener Proxy).

> Warum JSON-API statt `fredgraph.csv`? Die CSV ist fürs Chart-UI gedacht und zeitweise
> instabil (504/520). Die JSON-API ist für Programmzugriff gedacht und zuverlässig —
> braucht aber einen kostenlosen API-Key.

## 1. Kostenlosen FRED-API-Key holen (~1 Min)

1. Account anlegen / einloggen: <https://fredaccount.stlouisfed.org/login>
2. API-Key anfordern: <https://fredaccount.stlouisfed.org/apikeys> → „Request API Key".
   Du bekommst sofort einen 32-stelligen Key.

## 2. Worker deployen + Key als Secret setzen

```bash
export PATH="/Users/sam/.nvm/versions/node/v24.15.0/bin:$PATH"   # nvm-Node in den PATH
cd /Users/sam/Developer/CryptoAgent/worker

npx wrangler login                  # einmalig, Browser-Bestätigung im Cloudflare-Account
npx wrangler deploy                 # deployt fred-proxy.js
npx wrangler secret put FRED_API_KEY   # fragt den Key ab → einfügen, Enter (Eingabe ist verdeckt)
```

`secret put` löst automatisch ein Re-Deploy mit gesetztem Key aus. Die URL:

```
https://cryptoagent-fred-proxy.<dein-subdomain>.workers.dev
```

## 3. In der App aktivieren

`.env` im Projekt-Root (siehe `.env.example`):

```
VITE_FRED_PROXY=https://cryptoagent-fred-proxy.<dein-subdomain>.workers.dev
```

Dev-Server neu starten (`npm run dev`). Dann lädt die App automatisch **DXY**,
**M2-Geldmenge** und **Net Liquidity** und blendet die echten Liquiditäts-Kacheln ein —
ohne die Variable bleibt alles beim datumsbasierten Howell-Zyklusmodell (Fallback).

## Test

```bash
curl "https://cryptoagent-fred-proxy.<dein-subdomain>.workers.dev/?id=WM2NS" | head -c 200
```

Sollte JSON mit `"observations":[…]` liefern. Meldet er `FRED_API_KEY secret not set`,
fehlt noch Schritt 2 (`secret put`).

## Erlaubte Series-IDs

| ID | Bedeutung |
|----|-----------|
| `DTWEXBGS` | Nominal Broad U.S. Dollar Index (DXY-Proxy), täglich |
| `WM2NS` | M2-Geldmenge, wöchentlich |
| `M2SL` | M2-Geldmenge, monatlich (saisonbereinigt) |
| `WALCL` | Fed-Bilanzsumme |
| `RRPONTSYD` | Overnight Reverse Repo |
| `WTREGEN` | Treasury General Account |

Net Liquidity = `WALCL − RRPONTSYD×1000 − WTREGEN` (Einheiten: WALCL/TGA in Mio.,
RRP in Mrd.) — bereits in der App umgesetzt.
