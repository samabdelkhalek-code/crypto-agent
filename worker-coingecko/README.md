# CoinGecko-Proxy (Cloudflare Worker)

Leitet CoinGecko-Aufrufe über einen Worker mit **Edge-Caching** — so wird CoinGecko
nur noch ~1× pro Endpoint pro Cache-Dauer getroffen (statt pro Besucher). Gegen das
harte Rate-Limit des schlüssellosen CoinGecko-APIs.

> **Wichtig:** Ohne Demo-Key bringt der Proxy wenig (CoinGeckos schlüsselloses Limit
> trifft die geteilten Cloudflare-IPs und wird oft mit 429 abgelehnt — dann ist der
> Direktabruf aus dem Browser sogar besser). Mit dem **kostenlosen Demo-Key** hat der
> Worker ein eigenes, hohes Kontingent → zusammen mit dem Cache praktisch unbegrenzt.

## 1. Kostenlosen CoinGecko-Demo-Key holen (~1 Min)

1. Account anlegen: <https://www.coingecko.com/en/api/pricing> → „Demo (Beta) – Free" → *Create Account*.
2. Im Dashboard <https://www.coingecko.com/en/developers/dashboard> → „+ Add New Key" → Key kopieren.

## 2. Worker deployen + Key als Secret setzen

```bash
export PATH="/Users/sam/.nvm/versions/node/v24.15.0/bin:$PATH"
cd /Users/sam/Developer/CryptoAgent/worker-coingecko

npx wrangler deploy                 # deployt coingecko-proxy.js
npx wrangler secret put CG_DEMO_KEY # fragt den Demo-Key ab → einfügen, Enter (verdeckt)
```

URL: `https://cryptoagent-cg-proxy.<dein-subdomain>.workers.dev`

## 3. In der App aktivieren

`.env` im Projekt-Root:

```
VITE_CG_PROXY=https://cryptoagent-cg-proxy.<dein-subdomain>.workers.dev
```

Dann neu bauen & deployen:

```bash
cd /Users/sam/Developer/CryptoAgent
npm run build && npx wrangler pages deploy dist --project-name cryptoagent --branch main --commit-dirty=true
```

Ohne `VITE_CG_PROXY` ruft die App CoinGecko direkt auf (Standard).

## Test

```bash
curl "https://cryptoagent-cg-proxy.<dein-subdomain>.workers.dev/api/v3/global" | head -c 120
```

Sollte JSON mit `"data":{…}` liefern (nicht `error_code:429/403`).

## Cache-Dauer

| Endpoint | TTL |
|---|---|
| `/coins/*/market_chart*` | 1 h |
| `/search*` | 10 min |
| markets, global, coin details | 90 s |
