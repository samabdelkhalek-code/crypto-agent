export interface Investor {
  name: string;
  amount?: string;
  round?: string;
}

export interface Partnership {
  name: string;
  type: string;
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
      { name: 'BlackRock', type: 'Bitcoin ETF (iShares Bitcoin Trust)' },
      { name: 'Fidelity', type: 'Bitcoin ETF & Custody' },
      { name: 'MicroStrategy', type: 'Größter Unternehmens-Holder (>200.000 BTC)' },
      { name: 'Tesla', type: 'Institutioneller Investor' },
      { name: 'El Salvador', type: 'Gesetzliches Zahlungsmittel' },
      { name: 'Lightning Labs', type: 'Layer-2 Entwicklung' },
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
      { name: 'ConsenSys', amount: 'strategisch', round: 'Gründer-Investment' },
      { name: 'Grayscale', amount: '>$10B AUM', round: 'Institutionell' },
    ],
    partnerships: [
      { name: 'Microsoft', type: 'Azure Blockchain-Dienste & Ethereum-Integration' },
      { name: 'JPMorgan', type: 'Onyx / Quorum — Enterprise Ethereum' },
      { name: 'Samsung', type: 'Galaxy Blockchain & Ethereum Wallet' },
      { name: 'Amazon Web Services', type: 'Ethereum Nodes via AWS' },
      { name: 'Google Cloud', type: 'Blockchain Node Engine für Ethereum' },
      { name: 'Visa', type: 'USDC-Abwicklung auf Ethereum' },
      { name: 'Mastercard', type: 'NFT & Crypto Zahlungsinfrastruktur' },
      { name: 'PayPal', type: 'ETH kaufen & senden' },
      { name: 'Deutsche Bank', type: 'Ethereum-basierte Tokenisierung' },
    ],
    physicalProducts: [],
    note: 'Ethereum wurde per ICO (2014, $18M) finanziert — kein klassisches VC.',
  },

  solana: {
    totalFunding: '~$335M',
    investors: [
      { name: 'a16z (Andreessen Horowitz)', amount: '$314M', round: 'Series A & B' },
      { name: 'Multicoin Capital', amount: 'früher Investor', round: 'Seed' },
      { name: 'Jump Crypto', amount: 'strategisch' },
      { name: 'Polychain Capital', amount: 'strategisch' },
      { name: 'Coinbase Ventures', round: 'strategisch' },
      { name: 'Alameda Research', round: 'früher Investor (insolvent)' },
    ],
    partnerships: [
      { name: 'Visa', type: 'Zahlungsabwicklung auf Solana' },
      { name: 'Shopify', type: 'Payments-Integration' },
      { name: 'Google Cloud', type: 'Validator & Infrastruktur-Partner' },
      { name: 'NVIDIA', type: 'GPU-Computing & AI-Integration' },
      { name: 'Deutsche Telekom', type: 'Validator-Node Betrieb' },
      { name: 'Stripe', type: 'USDC-Zahlungen auf Solana' },
      { name: 'PayPal', type: 'PYUSD Stablecoin auf Solana' },
    ],
    physicalProducts: [
      { name: 'Solana Saga', description: 'Android-Smartphone mit integrierter Crypto Wallet, Seed Vault & dApp Store. Preis: $599. 20.000 Einheiten sold out.', status: 'live', year: 2023 },
      { name: 'Solana Seeker', description: 'Nachfolger des Saga — leistungsfähiger, günstigerer Preis, breite Distribution geplant.', status: 'announced', year: 2025 },
    ],
  },

  sui: {
    totalFunding: '~$300M',
    investors: [
      { name: 'a16z (Andreessen Horowitz)', amount: '$300M', round: 'Series B' },
      { name: 'Binance Labs', round: 'strategisch' },
      { name: 'Coinbase Ventures', round: 'strategisch' },
      { name: 'Jump Crypto', round: 'strategisch' },
      { name: 'Lightspeed Venture Partners', round: 'Series A' },
      { name: 'FTX Ventures', round: 'früh (insolvent)' },
    ],
    partnerships: [
      { name: 'Google Cloud', type: 'Validator & Cloud-Infrastruktur' },
      { name: 'AWS', type: 'Node-Infrastruktur' },
      { name: 'Alibaba Cloud', type: 'Asia-Infrastruktur' },
      { name: 'ByteDance', type: 'Gaming-Integration' },
    ],
    physicalProducts: [
      { name: 'Sui Gaming Console', description: 'Dedizierte Blockchain-Spielkonsole von Mysten Labs-Partnern. Fokus auf Web3-Games nativ auf Sui. Ähnlich Switch-Formfaktor.', status: 'announced', year: 2025 },
    ],
  },

  ripple: {
    totalFunding: '~$293M',
    investors: [
      { name: 'a16z (Andreessen Horowitz)', round: 'Series B' },
      { name: 'Google Ventures', round: 'Series C' },
      { name: 'IDG Capital', round: 'Series B' },
      { name: 'AME Cloud Ventures', round: 'Series B' },
      { name: 'Accenture', round: 'strategisch' },
      { name: 'SBI Holdings', amount: 'strategisch', round: 'Japan-Partner' },
    ],
    partnerships: [
      { name: 'Bank of America', type: 'RippleNet-Zahlungsnetzwerk' },
      { name: 'Santander', type: 'One Pay FX — grenzüberschreitende Zahlungen' },
      { name: 'American Express', type: 'Internationale Überweisungen' },
      { name: 'MoneyGram', type: 'Remittance-Partner (später beendet)' },
      { name: 'SBI Remit', type: 'Japan-USA Überweisungen' },
      { name: 'Tranglo', type: 'Südostasien Zahlungen' },
      { name: 'HSBC', type: 'Tokenisierung von Anleihen' },
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
      { name: 'Polychain Capital', round: 'Series A' },
      { name: 'a16z (Andreessen Horowitz)', round: 'Series A' },
      { name: 'Initialized Capital', round: 'Series A' },
      { name: 'Bain Capital Ventures', amount: '$230M', round: 'Series B' },
      { name: 'Galaxy Digital', round: 'strategisch' },
      { name: 'Coinbase Ventures', round: 'strategisch' },
    ],
    partnerships: [
      { name: 'Deloitte', type: 'Regierungsanwendungen & Close As You Go' },
      { name: 'Amazon Web Services', type: 'Cloud-Infrastruktur & Marketplace' },
      { name: 'T-Mobile', type: 'Blockchain-Integration' },
      { name: 'Alibaba Cloud', type: 'Node-Infrastruktur' },
      { name: 'KPMG', type: 'Enterprise-Blockchain' },
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
      { name: 'Framework Ventures', round: 'strategisch' },
      { name: 'Hashed', round: 'strategisch' },
      { name: 'Blockchange Ventures', round: 'strategisch' },
    ],
    partnerships: [
      { name: 'Google Cloud', type: 'BigQuery-Daten via Chainlink Oracles' },
      { name: 'SWIFT', type: 'Cross-Chain Interoperability Protocol (CCIP)' },
      { name: 'Amazon Web Services', type: 'AWS-Daten als Oracle-Quellen' },
      { name: 'AccuWeather', type: 'Wetterdaten on-chain' },
      { name: 'Associated Press', type: 'Nachrichtendaten on-chain' },
      { name: 'T-Systems (Deutsche Telekom)', type: 'Chainlink Node Operator' },
      { name: 'Vodafone', type: 'IoT-Daten via Chainlink' },
      { name: 'Telefónica', type: 'Telekommunikations-Daten' },
      { name: 'FedEx', type: 'Supply-Chain-Daten on-chain' },
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
      { name: 'Sequoia Capital India', amount: 'strategisch', round: 'Series B' },
      { name: 'SoftBank', amount: 'strategisch' },
      { name: 'Tiger Global', round: 'Series B' },
      { name: 'a16z (Andreessen Horowitz)', amount: '$450M', round: 'Series B' },
      { name: 'Animoca Brands', round: 'strategisch' },
    ],
    partnerships: [
      { name: 'Disney', type: 'Disney Accelerator — NFT & Metaverse' },
      { name: 'Starbucks', type: 'Starbucks Odyssey Loyalty NFT-Programm' },
      { name: 'Nike', type: '.SWOOSH NFT-Plattform' },
      { name: 'Reddit', type: 'Community Points & Collectible Avatars' },
      { name: 'Meta (Instagram)', type: 'NFT-Display auf Instagram' },
      { name: 'DraftKings', type: 'NFT-Marktplatz' },
      { name: 'Prada', type: 'Luxus-NFT-Kollektion' },
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
      { name: 'Breyer Capital (Jim Breyer)', round: 'strategisch' },
      { name: 'IDG Capital', round: 'strategisch' },
    ],
    partnerships: [
      { name: 'BMW', type: 'Fahrzeug-Datenverfolgung auf VeChain' },
      { name: 'LVMH', type: 'Luxusgüter-Authentifizierung' },
      { name: 'Walmart China', type: 'Lebensmittel-Rückverfolgbarkeit' },
      { name: 'H&M', type: 'Supply-Chain-Transparenz' },
      { name: 'DNV GL', type: 'Zertifizierungen auf Blockchain' },
      { name: 'PwC', type: 'Audit & Beratungspartner' },
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
};

export function getProjectMeta(coinId: string): ProjectMeta | null {
  return metadata[coinId] ?? null;
}
