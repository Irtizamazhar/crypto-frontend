import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

/** --- helpers (local to component) --- */
const ICON_SYMBOL_ALIASES = {
  holo: "hot",
  // add aliases here if you hit odd tickers → CDN names
};

function normalizeUrl(u = "") {
  if (!u) return "";
  let url = String(u).trim();
  if (!url) return "";
  if (url.startsWith("ipfs://")) url = "https://ipfs.io/ipfs/" + url.slice(7).replace(/^ipfs\//, "");
  if (url.startsWith("//")) url = "https:" + url;
  if (url.startsWith("http://")) url = "https://" + url.slice(7);
  return url;
}

function svgFallback(sym = "?") {
  const letter = String(sym).toUpperCase().slice(0, 1) || "?";
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
      <rect width='100%' height='100%' rx='12' fill='#0f172a'/>
      <text x='50%' y='58%' font-family='Inter,system-ui' font-size='28' text-anchor='middle' fill='#94a3b8'>${letter}</text>
    </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function keyFrom(coin, symbol) {
  const s = String(coin?.symbol || symbol || "").toLowerCase();
  const i = String(coin?.id || "").toLowerCase();
  return s || i || "";
}

const okCache = new Map(); // key -> good URL

function buildIconCandidates(coin, symbol) {
  const set = new Set();

  // coin-provided images
  const img = coin?.image || coin?.thumb;
  if (typeof img === "string") set.add(normalizeUrl(img));
  else if (img && typeof img === "object") {
    ["large", "small", "thumb", "url", "href"].forEach(k => {
      if (img[k]) set.add(normalizeUrl(img[k]));
    });
  }
  ["logo", "icon", "imageUrl", "logoUrl"].forEach(k => {
    if (coin?.[k]) set.add(normalizeUrl(coin[k]));
  });

  // symbol-based CDNs
  const raw = String(coin?.symbol || symbol || "").toLowerCase();
  const sym = ICON_SYMBOL_ALIASES[raw] || raw;
  if (sym) {
    set.add(`https://assets.coincap.io/assets/icons/${sym}@2x.png`);
    set.add(`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${sym}.png`);
    set.add(`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/black/${sym}.png`);
    set.add(`https://cryptoicons.org/api/icon/${sym}/200`);
  }

  return [...set].filter(Boolean);
}

/** --- component --- */
export default function CoinIcon({
  coin,
  symbol,
  size = 40,
  className = "",
  rounded = "2xl", // e.g. "full" / "2xl"
}) {
  const cacheKey = useMemo(() => keyFrom(coin, symbol), [coin, symbol]);

  const candidates = useMemo(() => {
    const list = buildIconCandidates(coin, symbol);
    const cached = okCache.get(cacheKey);
    return cached ? [cached, ...list.filter(u => u !== cached)] : list;
  }, [coin, symbol, cacheKey]);

  const [idx, setIdx] = useState(0);
  useEffect(() => setIdx(0), [candidates.join("|")]);

  const sym = String(coin?.symbol || symbol || "").toUpperCase();
  const src = candidates[idx];

  const roundedClass = `rounded-${rounded}`;

  if (!src) {
    // nothing to try; show letter fallback right away
    return (
      <img
        src={svgFallback(sym)}
        alt={sym}
        className={`${roundedClass} object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`relative ${roundedClass} bg-white/10 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* image */}
      <motion.img
        key={src}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.22 }}
        src={src}
        alt={sym}
        className={`absolute inset-0 ${roundedClass} object-contain`}
        style={{ width: size, height: size }}
        loading="lazy"
        decoding="async"
        onLoad={() => okCache.set(cacheKey, src)}
        onError={(e) => {
          if (idx < candidates.length - 1) {
            setIdx(i => i + 1);
            return;
          }
          e.currentTarget.onerror = null;
          e.currentTarget.src = svgFallback(sym);
        }}
      />
    </div>
  );
}
