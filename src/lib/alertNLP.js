// src/lib/alertNLP.js
const COIN_MAP = {
  bitcoin: "BTC", btc: "BTC", ethereum: "ETH", eth: "ETH", bnb: "BNB",
  solana: "SOL", sol: "SOL", cardano: "ADA", ada: "ADA",
  xrp: "XRP", ripple: "XRP", dogecoin: "DOGE", doge: "DOGE",
  polkadot: "DOT", dot: "DOT", shiba: "SHIB", shib: "SHIB",
  avax: "AVAX", avalanche: "AVAX", matic: "MATIC", polygon: "MATIC",
  link: "LINK", chainlink: "LINK", litecoin: "LTC", ltc: "LTC",
  uniswap: "UNI", uni: "UNI",
};

export function extractSymbol(text) {
  const m = text.match(/\b(bitcoin|btc|ethereum|eth|bnb|solana|sol|cardano|ada|xrp|ripple|dogecoin|doge|polkadot|dot|shiba|shib|avax|avalanche|matic|polygon|link|chainlink|litecoin|ltc|uniswap|uni)\b/i);
  if (!m) return null;
  const raw = m[0].toLowerCase();
  return COIN_MAP[raw] || raw.toUpperCase();
}

// returns { symbol, type, op, value } | null
export function parseAlertIntent(q) {
  const text = String(q || "").toLowerCase();
  if (!/(alert|notify|set alert|create alert)/i.test(text)) return null;

  const symbol = extractSymbol(text);
  if (!symbol) return null;

  // price
  // examples: above 65000, > 65000, below 2450, < 0.35
  const priceRegex = /(above|greater than|>|below|less than|<)\s*\$?\s*([0-9]+(?:\.[0-9]+)?)/i;

  // percent
  // examples: percent > 5, pct > 2.5, 24h % above 3
  const pctRegex =
    /(percent|pct|24h\s*%|percentage)\s*(above|greater than|>|below|less than|<)\s*([0-9]+(?:\.[0-9]+)?)/i;

  // volume
  // examples: vol above 10000000, volume < 5e6
  const volRegex =
    /(vol|volume)\s*(above|greater than|>|below|less than|<)\s*([0-9]+(?:\.[0-9]+)?)/i;

  if (pctRegex.test(text)) {
    const [, , opWord, v] = text.match(pctRegex);
    const op = (/>|above|greater than/.test(opWord)) ? ">" : "<";
    return { symbol, type: "pct24h", op, value: Number(v) };
  }

  if (volRegex.test(text)) {
    const [, , opWord, v] = text.match(volRegex);
    const op = (/>|above|greater than/.test(opWord)) ? ">" : "<";
    return { symbol, type: "vol24h", op, value: Number(v) };
  }

  const m = text.match(priceRegex);
  if (m) {
    const [, opWord, v] = m;
    const op = (/>|above|greater than/.test(opWord)) ? ">" : "<";
    return { symbol, type: "price", op, value: Number(v) };
  }

  // fallback: "alert when BTC crosses 62000"
  const cross = text.match(/cross(?:es)?\s*\$?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (cross) return { symbol, type: "price", op: ">", value: Number(cross[1]) };

  return null;
}
