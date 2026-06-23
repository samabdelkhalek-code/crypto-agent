/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Basis-URL des FRED-Proxy (Cloudflare Worker), z. B. https://…workers.dev. Leer = Feature aus. */
  readonly VITE_FRED_PROXY?: string;
  /** Basis-URL des CoinGecko-Proxy (Cloudflare Worker mit Edge-Cache). Leer = direkter Zugriff. */
  readonly VITE_CG_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
