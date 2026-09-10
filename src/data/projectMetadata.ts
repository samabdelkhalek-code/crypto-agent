export interface Investor {
  name: string;
  amount?: string;
  round?: string;
  domain?: string;
}

export interface Partnership {
  name: string;
  type: string;
  domain?: string;
}

export interface PhysicalProduct {
  name: string;
  description: string;
  status: 'live' | 'announced' | 'discontinued';
  year?: number;
}

export interface ProjectMeta {
  investors: Investor[];
  partnerships: Partnership[];
  physicalProducts: PhysicalProduct[];
  totalFunding?: string;
  note?: string;
}

const metadata: Record<string, ProjectMeta> = {

  bitcoin: {
    investors: [],
    partnerships: [
      { name: 'BlackRock', type: 'Bitcoin ETF (iShares Bitcoin Trust)', domain: 'blackrock.com' },
      { name: 'Fidelity', type: 'Bitcoin ETF & Custody', domain: 'fidelity.com' },
      { name: 'MicroStrategy', type: 'Größter Unternehmens-Holder (>200.000 BTC)', domain: 'microstrategy.com' },
      { name: 'Tesla', type: 'Institutioneller Investor', domain: 'tesla.com' },
      { name: 'El Salvador', type: 'Gesetzliches Zahlungsmittel', domain: 'gob.sv' },
      { name: 'Lightning Labs', type: 'Layer-2 Entwicklung', domain: 'lightning.engineering' },
    ],
    physicalProducts: [
      { name: 'Ledger Hardware Wallet', description: 'Dediziertes Bitcoin-Hardwarewallet, meistverkauft weltweit', status: 'live', year: 2014 },
      { name: 'Trezor', description: 'Open-Source Hardware Wallet, erstes seiner Art', status: 'live', year: 2013 },
      { name: 'Bitcoin Mining ASICs (Bitmain, MicroBT)', description: 'Spezialisierte Mining-Hardware für Bitcoin Proof-of-Work', status: 'live' },
    ],
    note: 'Bitcoin hat keine klassischen VC-Investoren — es wurde als dezentrales Open-Source-Projekt lanciert.',
  },

  ethereum: {
    investors: [
      { name: 'ConsenSys', amount: 'strategisch', round: 'Gründer-Investment', domain: 'consensys.io' },
      { name: 'Grayscale', amount: '>$10B AUM', round: 'Institutionell', domain: 'grayscale.com' },
    ],
    partnerships: [
      { name: 'Microsoft', type: 'Azure Blockchain-Dienste & Ethereum-Integration', domain: 'microsoft.com' },
      { name: 'JPMorgan', type: 'Onyx / Quorum — Enterprise Ethereum', domain: 'jpmorgan.com' },
      { name: 'Samsung', type: 'Galaxy Blockchain & Ethereum Wallet', domain: 'samsung.com' },
      { name: 'Amazon Web Services', type: 'Ethereum Nodes via AWS', domain: 'aws.amazon.com' },
      { name: 'Google Cloud', type: 'Blockchain Node Engine für Ethereum', domain: 'cloud.google.com' },
      { name: 'Visa', type: 'USDC-Abwicklung auf Ethereum', domain: 'visa.com' },
      { name: 'Mastercard', type: 'NFT & Crypto Zahlungsinfrastruktur', domain: 'mastercard.com' },
      { name: 'PayPal', type: 'ETH kaufen & senden', domain: 'paypal.com' },
      { name: 'Deutsche Bank', type: 'Ethereum-basierte Tokenisierung', domain: 'deutsche-bank.de' },
    ],
    physicalProducts: [],
    note: 'Ethereum wurde per ICO (2014, $18M) finanziert — kein klassisches VC.',
  },

  solana: {
    totalFunding: '~$335M',
    investors: [
      { name: 'a16z (Andreessen Horowitz)', amount: '$314M', round: 'Series A & B', domain: 'a16z.com' },
      { name: 'Multicoin Capital', amount: 'früher Investor', round: 'Seed', domain: 'multicoin.capital' },
      { name: 'Jump Crypto', amount: 'strategisch', domain: 'jumpcrypto.com' },
      { name: 'Polychain Capital', amount: 'strategisch', domain: 'polychain.capital' },
      { name: 'Coinbase Ventures', round: 'strategisch', domain: 'coinbase.com' },
      { name: 'Alameda Research', round: 'früher Investor (insolvent)' },
    ],
    partnerships: [
      { name: 'Visa', type: 'Zahlungsabwicklung auf Solana', domain: 'visa.com' },
      { name: 'Shopify', type: 'Payments-Integration', domain: 'shopify.com' },
      { name: 'Google Cloud', type: 'Validator & Infrastruktur-Partner', domain: 'cloud.google.com' },
      { name: 'NVIDIA', type: 'GPU-Computing & AI-Integration', domain: 'nvidia.com' },
      { name: 'Deutsche Telekom', type: 'Validator-Node Betrieb', domain: 'telekom.com' },
      { name: 'Stripe', type: 'USDC-Zahlungen auf Solana', domain: 'stripe.com' },
      { name: 'PayPal', type: 'PYUSD Stablecoin auf Solana', domain: 'paypal.com' },
    ],
    physicalProducts: [
      { name: 'Solana Saga', description: 'Android-Smartphone mit integrierter Crypto Wallet, Seed Vault & dApp Store. Preis: $599. 20.000 Einheiten sold out.', status: 'live', year: 2023 },
      { name: 'Solana Seeker', description: 'Nachfolger des Saga — leistungsfähiger, günstigerer Preis, breite Distribution geplant.', status: 'announced', year: 2025 },
    ],
  },

  sui: {
    totalFunding: '~$300M',
    investors: [
      { name: 'a16z (Andreessen Horowitz)', amount: '$300M', round: 'Series B', domain: 'a16z.com' },
      { name: 'Binance Labs', round: 'strategisch', domain: 'binance.com' },
      { name: 'Coinbase Ventures', round: 'strategisch', domain: 'coinbase.com' },
      { name: 'Jump Crypto', round: 'strategisch', domain: 'jumpcrypto.com' },
      { name: 'Lightspeed Venture Partners', round: 'Series A', domain: 'lsvp.com' },
      { name: 'FTX Ventures', round: 'früh (insolvent)' },
    ],
    partnerships: [
      { name: 'Google Cloud', type: 'Validator & Cloud-Infrastruktur', domain: 'cloud.google.com' },
      { name: 'AWS', type: 'Node-Infrastruktur', domain: 'aws.amazon.com' },
      { name: 'Alibaba Cloud', type: 'Asia-Infrastruktur', domain: 'alibabacloud.com' },
      { name: 'ByteDance', type: 'Gaming-Integration', domain: 'bytedance.com' },
    ],
    physicalProducts: [
      { name: 'Sui Gaming Console', description: 'Dedizierte Blockchain-Spielkonsole von Mysten Labs-Partnern. Fokus auf Web3-Games nativ auf Sui. Ähnlich Switch-Formfaktor.', status: 'announced', year: 2025 },
    ],
  },

  ripple: {
    totalFunding: '~$293M',
    investors: [
      { name: 'a16z (Andreessen Horowitz)', round: 'Series B', domain: 'a16z.com' },
      { name: 'Google Ventures', round: 'Series C', domain: 'gv.com' },
      { name: 'IDG Capital', round: 'Series B', domain: 'idgcapital.com' },
      { name: 'Accenture', round: 'strategisch', domain: 'accenture.com' },
      { name: 'SBI Holdings', amount: 'strategisch', round: 'Japan-Partner', domain: 'sbigroup.co.jp' },
    ],
    partnerships: [
      { name: 'Bank of America', type: 'RippleNet-Zahlungsnetzwerk', domain: 'bankofamerica.com' },
      { name: 'Santander', type: 'One Pay FX — grenzüberschreitende Zahlungen', domain: 'santander.com' },
      { name: 'American Express', type: 'Internationale Überweisungen', domain: 'americanexpress.com' },
      { name: 'MoneyGram', type: 'Remittance-Partner', domain: 'moneygram.com' },
      { name: 'HSBC', type: 'Tokenisierung von Anleihen', domain: 'hsbc.com' },
    ],
    physicalProducts: [],
  },

  cardano: {
    totalFunding: '~$62M (ICO)',
    investors: [
      { name: 'IOHK (Input Output)', amount: 'Gründungs-Unternehmen', round: 'Entwicklungspartner' },
      { name: 'Emurgo', round: 'Kommerzieller Arm' },
      { name: 'Cardano Foundation', round: 'Non-Profit Governance' },
    ],
    partnerships: [
      { name: 'Äthiopisches Bildungsministerium', type: 'Blockchain-Zertifikate für 5 Mio. Schüler' },
      { name: 'World Mobile', type: 'Telekommunikation für unversorgte Regionen Afrikas' },
      { name: 'New Balance', type: 'Produktauthentifizierung via Blockchain' },
      { name: 'Dish Network', type: 'Blockchain-basierte Subscriber-Lösung' },
    ],
    physicalProducts: [],
  },

  'avalanche-2': {
    totalFunding: '~$230M',
    investors: [
      { name: 'Polychain Capital', round: 'Series A', domain: 'polychain.capital' },
      { name: 'a16z (Andreessen Horowitz)', round: 'Series A', domain: 'a16z.com' },
      { name: 'Bain Capital Ventures', amount: '$230M', round: 'Series B', domain: 'baincapitalventures.com' },
      { name: 'Galaxy Digital', round: 'strategisch', domain: 'galaxydigital.io' },
      { name: 'Coinbase Ventures', round: 'strategisch', domain: 'coinbase.com' },
    ],
    partnerships: [
      { name: 'Deloitte', type: 'Regierungsanwendungen & Close As You Go', domain: 'deloitte.com' },
      { name: 'Amazon Web Services', type: 'Cloud-Infrastruktur & Marketplace', domain: 'aws.amazon.com' },
      { name: 'T-Mobile', type: 'Blockchain-Integration', domain: 't-mobile.com' },
      { name: 'Alibaba Cloud', type: 'Node-Infrastruktur', domain: 'alibabacloud.com' },
      { name: 'KPMG', type: 'Enterprise-Blockchain', domain: 'kpmg.com' },
    ],
    physicalProducts: [],
  },

  polkadot: {
    totalFunding: '~$200M (ICO + Auction)',
    investors: [
      { name: 'Placeholder VC', round: 'früher Investor' },
      { name: 'Polychain Capital', round: 'früher Investor' },
      { name: 'Web3 Foundation', round: 'Gründungsorganisation' },
    ],
    partnerships: [
      { name: 'Acala Network', type: 'DeFi Hub Parachain' },
      { name: 'Moonbeam', type: 'Ethereum-kompatible Parachain' },
      { name: 'Astar Network', type: 'Multi-VM Parachain' },
    ],
    physicalProducts: [],
  },

  chainlink: {
    totalFunding: '~$32M',
    investors: [
      { name: 'Framework Ventures', round: 'strategisch', domain: 'framework.ventures' },
      { name: 'Hashed', round: 'strategisch', domain: 'hashed.com' },
      { name: 'Blockchange Ventures', round: 'strategisch' },
    ],
    partnerships: [
      { name: 'Google Cloud', type: 'BigQuery-Daten via Chainlink Oracles', domain: 'cloud.google.com' },
      { name: 'SWIFT', type: 'Cross-Chain Interoperability Protocol (CCIP)', domain: 'swift.com' },
      { name: 'Amazon Web Services', type: 'AWS-Daten als Oracle-Quellen', domain: 'aws.amazon.com' },
      { name: 'AccuWeather', type: 'Wetterdaten on-chain', domain: 'accuweather.com' },
      { name: 'Associated Press', type: 'Nachrichtendaten on-chain', domain: 'ap.org' },
      { name: 'Deutsche Telekom', type: 'Chainlink Node Operator', domain: 'telekom.com' },
      { name: 'Vodafone', type: 'IoT-Daten via Chainlink', domain: 'vodafone.com' },
      { name: 'Telefónica', type: 'Telekommunikations-Daten', domain: 'telefonica.com' },
      { name: 'FedEx', type: 'Supply-Chain-Daten on-chain', domain: 'fedex.com' },
    ],
    physicalProducts: [],
  },

  uniswap: {
    totalFunding: '~$176M',
    investors: [
      { name: 'a16z (Andreessen Horowitz)', amount: '$11M', round: 'Series A' },
      { name: 'Paradigm', amount: '$165M', round: 'Series B' },
      { name: 'Union Square Ventures', round: 'Series A' },
      { name: 'Variant Fund', round: 'Series A' },
      { name: 'Polychain Capital', round: 'strategisch' },
    ],
    partnerships: [
      { name: 'Coinbase', type: 'Integration in Coinbase Wallet' },
      { name: 'MetaMask', type: 'Standard DEX-Aggregator' },
    ],
    physicalProducts: [],
  },

  aave: {
    totalFunding: '~$25M',
    investors: [
      { name: 'Framework Ventures', round: 'strategisch' },
      { name: 'ParaFi Capital', round: 'strategisch' },
      { name: 'Blockchain Capital', round: 'strategisch' },
      { name: 'Standard Crypto', round: 'strategisch' },
      { name: 'Defiance Capital', round: 'strategisch' },
    ],
    partnerships: [
      { name: 'Centrifuge', type: 'Real World Assets (RWA) Lending' },
      { name: 'Lens Protocol', type: 'Social Media DeFi-Integration' },
      { name: 'Maker', type: 'DAI Integration als Collateral' },
    ],
    physicalProducts: [],
  },

  'matic-network': {
    totalFunding: '~$450M',
    investors: [
      { name: 'Sequoia Capital India', amount: 'strategisch', round: 'Series B', domain: 'sequoiacap.com' },
      { name: 'SoftBank', amount: 'strategisch', domain: 'softbank.com' },
      { name: 'Tiger Global', round: 'Series B', domain: 'tigerglobal.com' },
      { name: 'a16z (Andreessen Horowitz)', amount: '$450M', round: 'Series B', domain: 'a16z.com' },
      { name: 'Animoca Brands', round: 'strategisch', domain: 'animocabrands.com' },
    ],
    partnerships: [
      { name: 'Disney', type: 'Disney Accelerator — NFT & Metaverse', domain: 'disney.com' },
      { name: 'Starbucks', type: 'Starbucks Odyssey Loyalty NFT-Programm', domain: 'starbucks.com' },
      { name: 'Nike', type: '.SWOOSH NFT-Plattform', domain: 'nike.com' },
      { name: 'Reddit', type: 'Community Points & Collectible Avatars', domain: 'reddit.com' },
      { name: 'Meta', type: 'NFT-Display auf Instagram', domain: 'meta.com' },
      { name: 'DraftKings', type: 'NFT-Marktplatz', domain: 'draftkings.com' },
      { name: 'Prada', type: 'Luxus-NFT-Kollektion', domain: 'prada.com' },
    ],
    physicalProducts: [],
  },

  'near': {
    totalFunding: '~$500M',
    investors: [
      { name: 'a16z (Andreessen Horowitz)', amount: 'strategisch', round: 'Series A & B' },
      { name: 'Pantera Capital', round: 'strategisch' },
      { name: 'Tiger Global', amount: '$350M', round: 'Series B' },
      { name: 'Coinbase Ventures', round: 'strategisch' },
      { name: 'Electric Capital', round: 'strategisch' },
      { name: 'Dragonfly Capital', round: 'strategisch' },
    ],
    partnerships: [
      { name: 'Google Cloud', type: 'Infrastruktur & Startup-Programm' },
      { name: 'Alibaba Cloud', type: 'Asien-Expansion' },
    ],
    physicalProducts: [],
  },

  'internet-computer': {
    totalFunding: '~$121M',
    investors: [
      { name: 'a16z (Andreessen Horowitz)', amount: '$121M', round: 'Series A' },
      { name: 'Polychain Capital', round: 'strategisch' },
      { name: 'SV Angel', round: 'strategisch' },
      { name: 'Scalar Capital', round: 'strategisch' },
    ],
    partnerships: [
      { name: 'DFINITY Foundation', type: 'Entwicklungs- & Forschungsorganisation' },
    ],
    physicalProducts: [],
  },

  aptos: {
    totalFunding: '~$400M',
    investors: [
      { name: 'a16z (Andreessen Horowitz)', amount: '$200M', round: 'Series A' },
      { name: 'Multicoin Capital', round: 'Series A' },
      { name: 'Binance Labs', round: 'strategisch' },
      { name: 'Coinbase Ventures', round: 'strategisch' },
      { name: 'FTX Ventures', round: 'früh (insolvent)' },
      { name: 'Jump Crypto', round: 'strategisch' },
    ],
    partnerships: [
      { name: 'Microsoft', type: 'Azure AI & Blockchain-Integration' },
      { name: 'Google Cloud', type: 'Node-Infrastruktur & Data' },
      { name: 'Coinbase', type: 'Custodial & Wallet-Support' },
    ],
    physicalProducts: [],
  },

  arbitrum: {
    totalFunding: '~$120M',
    investors: [
      { name: 'Lightspeed Venture Partners', amount: '$120M', round: 'Series B' },
      { name: 'Polychain Capital', round: 'Series B' },
      { name: 'Ribbit Capital', round: 'Series B' },
      { name: 'Redpoint Ventures', round: 'Series B' },
      { name: 'Pantera Capital', round: 'strategisch' },
    ],
    partnerships: [
      { name: 'Coinbase', type: 'Base-Netzwerk läuft auf OP Stack (Konkurrenz aber Referenz)' },
      { name: 'Google Cloud', type: 'Validator & Infrastructure' },
    ],
    physicalProducts: [],
  },

  optimism: {
    totalFunding: '~$178M',
    investors: [
      { name: 'a16z (Andreessen Horowitz)', amount: '$150M', round: 'Series B' },
      { name: 'Paradigm', amount: '$150M', round: 'Series B' },
      { name: 'Coinbase', round: 'strategisch — Base auf OP Stack' },
    ],
    partnerships: [
      { name: 'Coinbase', type: 'Base L2 gebaut auf OP Stack — wichtigste Partnerschaft' },
      { name: 'Worldcoin', type: 'World Chain auf OP Stack' },
    ],
    physicalProducts: [],
  },

  'the-graph': {
    totalFunding: '~$25M',
    investors: [
      { name: 'Multicoin Capital', round: 'strategisch' },
      { name: 'Tiger Global', round: 'strategisch' },
      { name: 'Framework Ventures', round: 'strategisch' },
      { name: 'Coinbase Ventures', round: 'strategisch' },
    ],
    partnerships: [
      { name: 'Uniswap', type: 'Indexierung aller Uniswap-Daten' },
      { name: 'Aave', type: 'DeFi-Datenindexierung' },
      { name: 'Decentraland', type: 'NFT & Metaverse-Daten' },
    ],
    physicalProducts: [],
  },

  filecoin: {
    totalFunding: '~$257M (ICO)',
    investors: [
      { name: 'a16z (Andreessen Horowitz)', round: 'strategisch' },
      { name: 'Sequoia Capital', round: 'ICO-Investor' },
      { name: 'Union Square Ventures', round: 'ICO-Investor' },
      { name: 'Y Combinator', round: 'früher Investor in Protocol Labs' },
      { name: 'Winklevoss Capital', round: 'ICO-Investor' },
    ],
    partnerships: [
      { name: 'Internet Archive', type: 'Langzeit-Datenspeicherung auf Filecoin' },
      { name: 'MIT', type: 'Forschungskooperation' },
      { name: 'UC Berkeley', type: 'Akademische Partnerschaft' },
    ],
    physicalProducts: [],
  },

  helium: {
    totalFunding: '~$364M',
    investors: [
      { name: 'Multicoin Capital', amount: '$111M', round: 'Series D' },
      { name: 'a16z (Andreessen Horowitz)', round: 'Series C & D' },
      { name: 'Union Square Ventures', round: 'Series C' },
      { name: 'Google Ventures', round: 'Series B' },
      { name: 'Deutsche Telekom', round: 'strategisch' },
      { name: 'Qualcomm Ventures', round: 'strategisch' },
    ],
    partnerships: [
      { name: 'Deutsche Telekom', type: 'Netzwerk-Expansion Europa' },
      { name: 'Dish Network', type: 'MVNO auf Helium 5G' },
    ],
    physicalProducts: [
      { name: 'Helium Hotspot (LoRaWAN)', description: 'Dezentrales IoT-Netzwerkgerät. Nutzer hosten Hotspots und verdienen HNT-Token als Belohnung. Über 1 Mio. Hotspots weltweit deployed.', status: 'live', year: 2019 },
      { name: 'Helium 5G Radio', description: 'CBRS-basiertes 5G-Funkgerät für dezentrales Mobilfunknetz. Kompatibel mit Standard-Smartphones.', status: 'live', year: 2022 },
    ],
  },

  'worldcoin-wld': {
    totalFunding: '~$250M',
    investors: [
      { name: 'a16z (Andreessen Horowitz)', amount: '$100M', round: 'Series C' },
      { name: 'Bain Capital Crypto', round: 'Series C' },
      { name: 'Reid Hoffman (LinkedIn-Gründer)', round: 'strategisch' },
      { name: 'Khosla Ventures', round: 'Series A' },
      { name: 'Sam Altman (OpenAI CEO)', round: 'Mitgründer' },
    ],
    partnerships: [
      { name: 'Match Group (Tinder)', type: 'Altersverifikation via World ID' },
      { name: 'Shopify', type: 'Human-Verification für E-Commerce' },
    ],
    physicalProducts: [
      { name: 'Orb (Biometric Scanner)', description: 'Iris-Scan-Gerät zur eindeutigen Verifikation menschlicher Identität. Erstellt "World ID" — Proof of Personhood. In 50+ Ländern im Einsatz.', status: 'live', year: 2023 },
      { name: 'Orb Mini', description: 'Kompaktere Version des Orbs für breitere Distribution und niedrigere Kosten.', status: 'announced', year: 2025 },
    ],
  },

  'render-token': {
    totalFunding: 'unbekannt (Community-funded)',
    investors: [
      { name: 'Multicoin Capital', round: 'strategisch' },
      { name: 'Electric Capital', round: 'strategisch' },
    ],
    partnerships: [
      { name: 'NVIDIA', type: 'GPU-Computing-Partner — OTOY nutzt NVIDIA-GPUs' },
      { name: 'Apple', type: 'OctaneRender läuft nativ auf Apple M-Chips' },
      { name: 'Autodesk', type: 'Plugin-Integration' },
      { name: 'Adobe', type: 'Creative-Cloud-Kompatibilität' },
    ],
    physicalProducts: [],
  },

  'injective-protocol': {
    totalFunding: '~$40M',
    investors: [
      { name: 'Binance Labs', amount: '$40M', round: 'Series A' },
      { name: 'Pantera Capital', round: 'strategisch' },
      { name: 'Mark Cuban', round: 'strategisch' },
      { name: 'Jump Crypto', round: 'strategisch' },
    ],
    partnerships: [
      { name: 'Google Cloud', type: 'Infrastruktur & Node-Betrieb' },
      { name: 'Deutsche Telekom', type: 'Validator-Node' },
    ],
    physicalProducts: [],
  },

  celestia: {
    totalFunding: '~$55M',
    investors: [
      { name: 'Bain Capital Crypto', amount: '$55M', round: 'Series A' },
      { name: 'Polychain Capital', round: 'Series A' },
      { name: 'Placeholder VC', round: 'strategisch' },
      { name: 'Galaxy Digital', round: 'strategisch' },
      { name: 'Delphi Digital', round: 'strategisch' },
    ],
    partnerships: [],
    physicalProducts: [],
  },

  'immutable-x': {
    totalFunding: '~$200M',
    investors: [
      { name: 'a16z (Andreessen Horowitz)', amount: '$200M', round: 'Series C' },
      { name: 'Animoca Brands', round: 'strategisch' },
      { name: 'King River Capital', round: 'Series C' },
    ],
    partnerships: [
      { name: 'GameStop', type: 'NFT-Marktplatz-Partnerschaft' },
      { name: 'TikTok', type: 'Creator NFT-Programm' },
      { name: 'VaynerMedia', type: 'NFT-Marketing' },
    ],
    physicalProducts: [],
  },

  'sei-network': {
    totalFunding: '~$30M',
    investors: [
      { name: 'Multicoin Capital', round: 'Series A' },
      { name: 'Coinbase Ventures', round: 'strategisch' },
      { name: 'Jump Crypto', round: 'strategisch' },
      { name: 'OKX Ventures', round: 'strategisch' },
    ],
    partnerships: [],
    physicalProducts: [],
  },

  ton: {
    totalFunding: '$1.7B (ursprünglicher Telegram ICO)',
    investors: [
      { name: 'Telegram', round: 'Gründungs-Backer (ursprünglich)' },
    ],
    partnerships: [
      { name: 'Telegram', type: 'Nativ in Telegram integriert — 900M+ Nutzer-Zugang' },
      { name: 'Toncoin Foundation', type: 'Governance' },
    ],
    physicalProducts: [],
    note: 'TON wurde ursprünglich von Telegram entwickelt, nach SEC-Verfahren von der Community übernommen.',
  },

  dogecoin: {
    investors: [],
    partnerships: [
      { name: 'Dallas Mavericks (NBA)', type: 'Zahlungsmittel für Tickets & Merchandise' },
      { name: 'AMC Theaters', type: 'Akzeptiert DOGE als Zahlungsmittel' },
      { name: 'Tesla', type: 'Merchandise-Käufe mit DOGE möglich' },
      { name: 'X (Twitter)', type: 'Elon Musk nutzt DOGE prominent — Integrationsgerüchte' },
    ],
    physicalProducts: [],
    note: 'Dogecoin wurde 2013 als Meme ohne Investoren gestartet. Wert basiert auf Community & Celebrity-Endorsements.',
  },

  'shiba-inu': {
    investors: [],
    partnerships: [
      { name: 'Coinbase', type: 'Listing & Verwahrung' },
      { name: 'Binance', type: 'Listing' },
    ],
    physicalProducts: [],
  },

  'stacks': {
    totalFunding: '~$75M',
    investors: [
      { name: 'Union Square Ventures', round: 'strategisch' },
      { name: 'Y Combinator', round: 'früher Investor' },
      { name: 'Digital Currency Group', round: 'strategisch' },
    ],
    partnerships: [
      { name: 'Hiro Systems', type: 'Entwicklungsumgebung für Bitcoin-Apps' },
    ],
    physicalProducts: [],
  },

  'hyperliquid': {
    investors: [],
    partnerships: [],
    physicalProducts: [],
    note: 'Hyperliquid ist vollständig selbstfinanziert — bewusst kein VC-Funding, um maximale Dezentralisierung zu gewährleisten. Das Team behielt 100% des Projekts und airdroppte Token direkt an die Community.',
  },

  cosmos: {
    totalFunding: '~$17M (ICO)',
    investors: [
      { name: 'Interchain Foundation', round: 'Gründungsorganisation' },
      { name: 'Tendermint Inc.', round: 'Kernentwickler' },
    ],
    partnerships: [
      { name: 'Binance', type: 'BNB Chain basiert auf Cosmos SDK' },
      { name: 'Cronos (Crypto.com)', type: 'Cosmos-basierte Chain' },
    ],
    physicalProducts: [],
  },

  vechain: {
    totalFunding: '~$20M',
    investors: [
      { name: 'Breyer Capital', round: 'strategisch', domain: 'breyercapital.com' },
      { name: 'IDG Capital', round: 'strategisch', domain: 'idgcapital.com' },
    ],
    partnerships: [
      { name: 'BMW', type: 'Fahrzeug-Datenverfolgung auf VeChain', domain: 'bmw.com' },
      { name: 'LVMH', type: 'Luxusgüter-Authentifizierung', domain: 'lvmh.com' },
      { name: 'Walmart', type: 'Lebensmittel-Rückverfolgbarkeit (China)', domain: 'walmart.com' },
      { name: 'H&M', type: 'Supply-Chain-Transparenz', domain: 'hm.com' },
      { name: 'DNV', type: 'Zertifizierungen auf Blockchain', domain: 'dnv.com' },
      { name: 'PwC', type: 'Audit & Beratungspartner', domain: 'pwc.com' },
    ],
    physicalProducts: [],
  },

  stellar: {
    totalFunding: '~$3M + Stripe-Investment',
    investors: [
      { name: 'Stripe', amount: '$3M', round: 'früher Investor' },
      { name: 'Stellar Development Foundation', round: 'Non-Profit Governance' },
    ],
    partnerships: [
      { name: 'IBM', type: 'World Wire — Internationale Zahlungen via Stellar' },
      { name: 'Deloitte', type: 'Digital Banking-Plattform' },
      { name: 'Franklin Templeton', type: 'Tokenisierter Geldmarktfonds auf Stellar' },
    ],
    physicalProducts: [],
  },

  tron: {
    totalFunding: '~$70M (ICO)',
    investors: [],
    partnerships: [
      { name: 'Samsung', type: 'TronLink Wallet auf Samsung Blockchain Keystore' },
      { name: 'Opera Browser', type: 'Integrierte TRON Wallet' },
    ],
    physicalProducts: [],
  },

  'mantle': {
    totalFunding: 'Treasury: >$2.5B (BitDAO)',
    investors: [
      { name: 'Bybit', round: 'Hauptfinanzier via BitDAO' },
      { name: 'Peter Thiel', round: 'BitDAO Backer' },
      { name: 'Alan Howard', round: 'BitDAO Backer' },
      { name: 'Dragonfly Capital', round: 'strategisch' },
    ],
    partnerships: [],
    physicalProducts: [],
  },

  'bittensor': {
    investors: [
      { name: 'Digital Currency Group', amount: '~500.000 TAO (~2,4% Supply)', round: 'Größter Holder', domain: 'dcg.co' },
      { name: 'Polychain Capital', round: 'Früher Backer', domain: 'polychain.capital' },
      { name: 'Dao5', round: 'Früher Backer', domain: 'dao5.io' },
    ],
    partnerships: [
      { name: 'Grayscale', type: 'Grayscale Bittensor Trust → geplanter Spot-TAO-ETF (NYSE Arca)', domain: 'grayscale.com' },
      { name: 'Yuma (DCG)', type: 'DCG-Tochter zur Förderung von Bittensor-Subnets + institutioneller TAO-Fonds', domain: 'dcg.co' },
    ],
    physicalProducts: [],
    note: 'Bittensor (TAO) ist ein dezentrales Netzwerk für Machine-Learning-Subnets (Opentensor Foundation). Kein klassisches VC-Funding — Bitcoin-ähnliches Modell mit 21 Mio. Max-Supply und Halving. Frühe Backer (DCG, Polychain, Dao5) akkumulierten über den Markt und betreiben Validatoren.',
  },

  'hedera-hashgraph': {
    investors: [],
    partnerships: [
      { name: 'Google', type: 'Governing-Council-Mitglied', domain: 'google.com' },
      { name: 'IBM', type: 'Governing-Council-Mitglied', domain: 'ibm.com' },
      { name: 'Boeing', type: 'Governing-Council-Mitglied', domain: 'boeing.com' },
      { name: 'LG Electronics', type: 'Governing-Council-Mitglied', domain: 'lg.com' },
      { name: 'Deutsche Telekom', type: 'Governing-Council-Mitglied', domain: 'telekom.com' },
      { name: 'Dell Technologies', type: 'Governing-Council-Mitglied', domain: 'dell.com' },
      { name: 'Standard Bank', type: 'Governing-Council-Mitglied', domain: 'standardbank.com' },
    ],
    physicalProducts: [],
    note: 'Hedera wird von einem Governing Council aus bis zu 39 Großunternehmen & Institutionen (2025: 31 Mitglieder) mit gleichem Stimmrecht und Amtszeitbegrenzung gesteuert — kein klassisches VC-Funding.',
  },

  'crypto-com-chain': {
    investors: [],
    partnerships: [
      { name: 'Visa', type: 'Crypto.com Visa-Karte', domain: 'visa.com' },
      { name: 'Formula 1', type: 'Globaler Partner bis 2030 (Miami-GP-Titel)', domain: 'formula1.com' },
      { name: 'UEFA Champions League', type: 'Exklusiver Krypto-Partner', domain: 'uefa.com' },
      { name: 'UFC', type: 'Offizieller Partner', domain: 'ufc.com' },
      { name: 'Paris Saint-Germain', type: 'Offizieller Partner', domain: 'psg.fr' },
      { name: 'Crypto.com Arena (LA Lakers)', type: 'Namensrechte ($700M, 20 Jahre)', domain: 'crypto.com' },
    ],
    physicalProducts: [],
    note: 'CRO ist der Token der Crypto.com-Chain (Cronos). Crypto.com ist für sein umfangreiches Sport-Sponsoring bekannt (F1, UFC, UEFA, PSG, NBA 76ers).',
  },

  'the-sandbox': {
    totalFunding: '~$93M (SoftBank-geführt, 2021)',
    investors: [
      { name: 'SoftBank Vision Fund 2', amount: '$93M', round: 'Lead (2021)', domain: 'softbank.jp' },
      { name: 'Animoca Brands', round: 'Muttergesellschaft', domain: 'animocabrands.com' },
      { name: 'Samsung Next', round: 'strategisch', domain: 'samsung.com' },
      { name: 'LG Technology Ventures', round: 'strategisch', domain: 'lg.com' },
    ],
    partnerships: [
      { name: 'Adidas', type: 'Metaverse-LAND & Kollektion', domain: 'adidas.com' },
      { name: 'Gucci', type: 'Gucci Vault Land', domain: 'gucci.com' },
      { name: 'HSBC', type: 'Erster globaler Finanzdienstleister im Metaverse', domain: 'hsbc.com' },
      { name: 'Ubisoft', type: 'Gaming-Partner', domain: 'ubisoft.com' },
      { name: 'Warner Music Group', type: 'Musik-Themenwelt', domain: 'wmg.com' },
    ],
    physicalProducts: [],
    note: 'Tochter von Animoca Brands. Über 400 Marken-Partner im offenen Metaverse.',
  },

  'chiliz': {
    investors: [],
    partnerships: [
      { name: 'FC Barcelona', type: 'Offizielles Fan-Token', domain: 'fcbarcelona.com' },
      { name: 'Paris Saint-Germain', type: 'Offizielles Fan-Token', domain: 'psg.fr' },
      { name: 'Juventus', type: 'Offizielles Fan-Token', domain: 'juventus.com' },
      { name: 'Manchester City', type: 'Offizielles Fan-Token', domain: 'mancity.com' },
      { name: 'Atlético de Madrid', type: 'Offizielles Fan-Token', domain: 'atleticodemadrid.com' },
      { name: 'UFC', type: 'Offizielles Fan-Token', domain: 'ufc.com' },
    ],
    physicalProducts: [],
    note: 'Chiliz ist die Layer-1 für Sport & Entertainment und betreibt die Fan-Token-Plattform Socios.com — 170+ Sportpartner, >$700M an Partner ausgeschüttet.',
  },

  'ondo-finance': {
    totalFunding: '~$20M (Series A, 2022)',
    investors: [
      { name: 'Founders Fund', round: 'Series-A-Lead', domain: 'foundersfund.com' },
      { name: 'Pantera Capital', round: 'Series-A-Lead', domain: 'panteracapital.com' },
      { name: 'Coinbase Ventures', round: 'strategisch', domain: 'coinbase.com' },
      { name: 'Tiger Global', round: 'strategisch', domain: 'tigerglobal.com' },
    ],
    partnerships: [
      { name: 'BlackRock', type: 'OUSG durch BlackRocks BUIDL besichert (größter Halter)', domain: 'blackrock.com' },
      { name: 'Securitize', type: 'Tokenisierungs-Partner', domain: 'securitize.io' },
    ],
    physicalProducts: [],
    note: 'Von Ex-Goldman-Sachs-Tradern gegründeter RWA-Leader. Wurde erster großer Krypto-Kunde von BlackRocks tokenisiertem Treasury-Fonds BUIDL.',
  },

  'eigenlayer': {
    totalFunding: '~$150M+ (Series A + B)',
    investors: [
      { name: 'a16z crypto', amount: '$100M', round: 'Series B (2024)', domain: 'a16z.com' },
      { name: 'Blockchain Capital', amount: '$50M', round: 'Series-A-Lead', domain: 'blockchain.capital' },
      { name: 'Polychain Capital', round: 'strategisch', domain: 'polychain.capital' },
    ],
    partnerships: [],
    physicalProducts: [],
    note: 'Eigen Labs (Gründer Sreeram Kannan) ist Kategorie-König des Ethereum-Restaking. a16z war alleiniger Investor der $100M-Series-B.',
  },

  'lido-dao': {
    totalFunding: '~$145M (2021–2022)',
    investors: [
      { name: 'Paradigm', amount: '$51M', round: 'Lead (2021)', domain: 'paradigm.xyz' },
      { name: 'a16z crypto', amount: '$70M', round: '2022', domain: 'a16z.com' },
      { name: 'Dragonfly', amount: '$24M', round: 'Treasury (2022)', domain: 'dragonfly.xyz' },
      { name: 'Coinbase Ventures', round: 'strategisch', domain: 'coinbase.com' },
    ],
    partnerships: [],
    physicalProducts: [],
    note: 'Größtes Liquid-Staking-Protokoll für ETH. Weitere frühe Backer: Jump, Delphi Digital, DCG.',
  },

  'maker': {
    investors: [
      { name: 'a16z crypto', amount: '$15M (6% MKR)', round: '2018', domain: 'a16z.com' },
      { name: 'Paradigm', round: '2019 (Asien-Expansion)', domain: 'paradigm.xyz' },
      { name: 'Dragonfly', round: '2019 (Asien-Expansion)', domain: 'dragonfly.xyz' },
    ],
    partnerships: [
      { name: 'Spark', type: 'RWA-Tokenisierung im Sky-Ökosystem', domain: 'spark.fi' },
    ],
    physicalProducts: [],
    note: 'MakerDAO (2024 zu „Sky" umbenannt, MKR→SKY) steht hinter dem DAI-Stablecoin. Die frühen VCs a16z, Paradigm & Dragonfly haben ihre MKR-Bestände inzwischen komplett verkauft („de-VC-ing").',
  },

  'starknet': {
    totalFunding: '~$287M (bis Series D, $8 Mrd. Bewertung)',
    investors: [
      { name: 'Paradigm', round: 'Series A/B-Lead', domain: 'paradigm.xyz' },
      { name: 'Sequoia Capital', round: 'Series-C-Lead', domain: 'sequoiacap.com' },
      { name: 'Coatue', round: 'Series-D-Lead', domain: 'coatue.com' },
      { name: 'Founders Fund', round: 'Series C', domain: 'foundersfund.com' },
      { name: 'Coinbase Ventures', round: 'Series A', domain: 'coinbase.com' },
    ],
    partnerships: [],
    physicalProducts: [],
    note: 'StarkWare (hinter Starknet) sammelte ~$287M ein und erreichte 2022 eine Bewertung von $8 Mrd. ZK-Rollup-Pionier (STARK-Proofs).',
  },

  'tezos': {
    totalFunding: '~$232M (ICO 2017)',
    investors: [
      { name: 'Tezos Foundation', round: 'Stiftung / ICO 2017', domain: 'tezos.foundation' },
    ],
    partnerships: [
      { name: 'Manchester United', type: 'Trainings-Trikot-Sponsor (~£20M/Jahr)', domain: 'manutd.com' },
      { name: 'McLaren Racing', type: 'NFT-Plattform (F1)', domain: 'mclaren.com' },
      { name: 'Société Générale', type: 'CBDC-Experimente (Forge)', domain: 'societegenerale.com' },
      { name: 'Ubisoft', type: 'Validator (Baker) & NFTs', domain: 'ubisoft.com' },
    ],
    physicalProducts: [],
    note: 'Tezos finanzierte sich 2017 per ICO ($232M an einem Tag). Self-Amending-PoS-Chain mit On-Chain-Governance.',
  },

  'algorand': {
    investors: [],
    partnerships: [
      { name: 'FIFA', type: 'Offizieller Blockchain-Partner (WM 2022)', domain: 'fifa.com' },
    ],
    physicalProducts: [],
    note: 'Von Turing-Preisträger & MIT-Professor Silvio Micali gegründet (Pure Proof-of-Stake, 2019). Das FIFA-Sponsoring von 2022 wurde später auf „technische Entwicklung" reduziert.',
  },

  'litecoin': {
    investors: [],
    partnerships: [
      { name: 'Miami Dolphins', type: 'Offizielle Kryptowährung (NFL)', domain: 'miamidolphins.com' },
      { name: 'UFC', type: 'Awareness-Sponsoring (2018)', domain: 'ufc.com' },
      { name: 'Flexa', type: 'LTC-Zahlungen via SPEDN', domain: 'flexa.network' },
    ],
    physicalProducts: [],
    note: 'Litecoin wurde 2011 von Charlie Lee als faire Open-Source-Abspaltung von Bitcoin gestartet — kein ICO, kein Premine, kein VC. Betreut von der Litecoin Foundation.',
  },
};

export function getProjectMeta(coinId: string): ProjectMeta | null {
  return metadata[coinId] ?? null;
}
