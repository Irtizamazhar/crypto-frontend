// src/pages/Trade.js
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchCoin, fetchKlines, fetchNews, fetchMarketData } from "../services/api";
import { SMA, RSI, MACD, signalScore } from "../services/indicators";
import { BarChart3, Newspaper, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import TradeTab from "./TradeTab";
import NewsTab from "./NewsTab";
import AnalysisTab from "./AnalysisTab";

/* -------- Fallback: read any market cache to get basic coin info by id -------- */
function readAnyMarketCachedById(id) {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("market_cache_"));
    for (const k of keys) {
      const payload = JSON.parse(localStorage.getItem(k) || "{}");
      const arr = payload?.data || [];
      const hit = Array.isArray(arr) ? arr.find((x) => x.id === id) : null;
      if (hit) {
        return {
          id: hit.id,
          name: hit.name,
          symbol: hit.symbol,
          image: hit.image ? { large: hit.image } : undefined,
          market_data: { current_price: { usd: Number(hit._priceConv ?? hit.priceUsdt ?? 0) } },
          market_cap_rank: hit.rank,
          description: { en: "" },
          changePercent24Hr: hit.changePercent24Hr ?? 0,
        };
      }
    }
  } catch {}
  return null;
}

/* ===== Icon helpers (robust fallbacks for ALL coins) ===== */

// Some coins have a different CDN ticker than your data
const ICON_SYMBOL_ALIASES = {
  holo: "hot",        // HOLO → HOT
  // Add more if needed: 'hedera-hashgraph': 'hbar', 'mina-protocol': 'mina', ...
};

// Make any URL safe for https pages
function normalizeUrl(u = "") {
  if (typeof u !== "string") return "";
  let url = u.trim();
  if (!url) return "";
  if (url.startsWith("ipfs://")) {
    url = "https://ipfs.io/ipfs/" + url.slice(7).replace(/^ipfs\//, "");
  } else if (url.startsWith("//")) {
    url = "https:" + url;
  } else if (url.startsWith("http://")) {
    url = "https://" + url.slice(7);
  }
  return url;
}

// Simple SVG fallback (first letter)
function svgFallbackData(sym) {
  const letter = (sym || "?").toUpperCase().slice(0, 1);
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
      <rect width='100%' height='100%' rx='12' fill='#0f172a'/>
      <text x='50%' y='58%' font-family='Inter,system-ui' font-size='28' text-anchor='middle' fill='#94a3b8'>${letter}</text>
    </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// Build a list of candidate icon URLs for a coin
function buildIconCandidates(coin) {
  if (!coin) return [];
  const set = new Set();

  // 1) Try fields from the coin object
  const img = coin.image;
  if (typeof img === "string") set.add(normalizeUrl(img));
  else if (img && typeof img === "object") {
    ["large", "small", "thumb", "url", "href"].forEach((k) => {
      if (img[k]) set.add(normalizeUrl(img[k]));
    });
  }
  ["logo", "icon", "imageUrl", "logoUrl"].forEach((k) => {
    if (coin[k]) set.add(normalizeUrl(coin[k]));
  });

  // 2) Try known symbol-based CDNs
  const raw = String(coin.symbol || "").toLowerCase();
  const sym = ICON_SYMBOL_ALIASES[raw] || raw;
  if (sym) {
    set.add(`https://assets.coincap.io/assets/icons/${sym}@2x.png`);
    set.add(`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${sym}.png`);
    set.add(`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/black/${sym}.png`);
    set.add(`https://cryptoicons.org/api/icon/${sym}/200`);
  }

  return [...set].filter(Boolean);
}

// Cache successful URL per coin symbol/id so lists are instant later
const okCache = new Map(); // key → url
function cacheKey(coin) {
  const s = String(coin?.symbol || "").toLowerCase();
  const i = String(coin?.id || "").toLowerCase();
  return s || i || "";
}

function HeaderIcon({ coin, size = 64, className = "" }) {
  const key = cacheKey(coin);
  const candidates = useMemo(() => {
    const list = buildIconCandidates(coin);
    const cached = okCache.get(key);
    return cached ? [cached, ...list.filter((u) => u !== cached)] : list;
  }, [coin, key]);

  const [idx, setIdx] = useState(0);
  useEffect(() => setIdx(0), [candidates.join("|")]);

  const sym = String(coin?.symbol || "").toUpperCase();
  const src = candidates[idx];

  if (!src) {
    return (
      <div
        className={`rounded-2xl bg-white/10 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  return (
    <motion.img
      key={src}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25 }}
      src={src}
      alt={sym}
      className={`h-16 w-16 rounded-2xl shadow-lg object-contain ${className}`}
      style={{ width: size, height: size }}
      loading="lazy"
      decoding="async"
      onLoad={() => okCache.set(key, src)}
      onError={(e) => {
        // if last candidate failed, show letter fallback
        if (idx >= candidates.length - 1) {
          e.currentTarget.onerror = null;
          e.currentTarget.src = svgFallbackData(sym);
          return;
        }
        setIdx((i) => i + 1);
      }}
    />
  );
}

/* ===================== Page ===================== */
export default function Trade() {
  const { id } = useParams();

  // state
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closes, setCloses] = useState([]); // close-only for indicators
  const [news, setNews] = useState([]);
  const [marketData, setMarketData] = useState(null);
  const [activeTab, setActiveTab] = useState("chart");

  // fetch data (runs every time id changes)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        let c = null;
        try { c = await fetchCoin(id); } catch {}
        if (!c) c = readAnyMarketCachedById(id);
        if (!alive) return;
        setCoin(c);

        const sym = String(c?.symbol || "").toUpperCase();
        if (sym) {
          try {
            const [klinesData, newsData, mkt] = await Promise.all([
              fetchKlines(`${sym}USDT`, "1h", 300),
              fetchNews(sym, c?.name),
              fetchMarketData(sym),
            ]);
            if (!alive) return;
            setCloses(klinesData || []);
            setNews(Array.isArray(newsData) ? newsData : []);
            setMarketData(mkt || null);
          } catch (err) {
            console.error("Trade fetch error:", err);
            setCloses([]); setNews([]); setMarketData(null);
          }
        } else {
          setCloses([]); setNews([]); setMarketData(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  // ----- derive values -----
  const symbol = String(coin?.symbol || "").toUpperCase();
  const md = coin?.market_data || {};

  const ch24 = md.price_change_percentage_24h ?? coin?.changePercent24Hr ?? 0;
  const pos24 = ch24 >= 0;

  const price =
    md.current_price?.usd ??
    coin?.priceUsdt ??
    (Array.isArray(closes) && closes.length ? closes[closes.length - 1] : 0);

  const oneHrChangePct = useMemo(() => {
    if (!closes || closes.length < 2) return 0;
    const a = closes[closes.length - 2];
    const b = closes[closes.length - 1];
    if (!a || !b) return 0;
    return ((b - a) / a) * 100;
  }, [closes]);

  const marketCap =
    md.market_cap?.usd ?? md.market_cap ?? marketData?.market_cap ?? null;

  const vol24 =
    md.total_volume?.usd ?? md.total_volume ?? marketData?.total_volume ?? null;

  const dayRange = useMemo(() => {
    const high = md.high_24h?.usd ?? md.high_24h ?? marketData?.high_24h ?? null;
    const low  = md.low_24h?.usd  ?? md.low_24h  ?? marketData?.low_24h  ?? null;
    if (!high || !low || !price) return null;
    const pctFromLow = ((price - low) / low) * 100;
    const pctFromHigh = ((price - high) / high) * 100;
    return { high, low, pctFromLow, pctFromHigh };
  }, [md.high_24h, md.low_24h, price, marketData]);

  const turnoverPct = marketCap && vol24 ? (vol24 / marketCap) * 100 : null;

  const volSignal = useMemo(() => {
    if (!closes || closes.length < 24) return null;
    const items = closes.slice(-24);
    const mean = items.reduce((a, b) => a + b, 0) / items.length;
    if (!mean) return null;
    const variance = items.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / items.length;
    const std = Math.sqrt(variance);
    return { std, volPct: (std / mean) * 100 };
  }, [closes]);

  const signals = useMemo(() => {
    if (!closes || closes.length < 60) return null;
    const smaFast = SMA(closes, 20);
    const smaSlow = SMA(closes, 50);
    const rsi = RSI(closes, 14);
    const { hist } = MACD(closes);
    const score = signalScore({ smaFast, smaSlow, rsi, macdHist: hist });
    const trendUp = (smaFast.at(-1) ?? 0) > (smaSlow.at(-1) ?? 0);
    const rsiVal = rsi.at(-1) ?? 0;

    const reasons = [];
    if (Math.abs(ch24) >= 5) reasons.push(`strong ${ch24 > 0 ? "upward" : "downward"} momentum (${ch24.toFixed(1)}% in 24h)`);
    if (typeof oneHrChangePct === "number" && Math.abs(oneHrChangePct) >= 0.7) {
      reasons.push(`${oneHrChangePct > 0 ? "positive" : "negative"} 1h impulse (${oneHrChangePct.toFixed(1)}%)`);
    }
    if (trendUp) reasons.push("fast SMA crossed above slow (bullish)");
    if (rsiVal >= 70) reasons.push("RSI overbought — pullback risk");
    if (rsiVal <= 30) reasons.push("RSI oversold — bounce risk");
    if (turnoverPct && turnoverPct > 5) reasons.push(`elevated turnover (vol/mcap ≈ ${turnoverPct.toFixed(1)}%)`);
    if (volSignal?.volPct && volSignal.volPct > 3) reasons.push(`intraday volatility picked up (~${volSignal.volPct.toFixed(1)}% σ)`);

    const prediction =
      score >= 65
        ? "Bias: mild UP next 24–48h if momentum continues."
        : score <= 35
        ? "Bias: mild DOWN — momentum weak."
        : "Neutral: mixed signals — consider waiting for confirmation.";

    return { score, trendUp, rsi: Math.round(rsiVal), reasons, prediction };
  }, [closes, ch24, oneHrChangePct, turnoverPct, volSignal?.volPct]);

  const pos24Class = ch24 >= 0 ? "text-emerald-400" : "text-rose-400";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <HeaderIcon coin={coin} size={64} />
        <div>
          <h1 className="text-3xl font-bold">
            {coin?.name || "Loading…"} {symbol ? <span className="text-slate-400 text-xl">({symbol})</span> : null}
          </h1>
          {coin?.market_cap_rank ? <div className="text-sm text-slate-400">Rank #{coin.market_cap_rank}</div> : null}
          <div className="text-sm text-slate-400 mt-1">
            24h: <span className={pos24Class}>{ch24 >= 0 ? `+${(ch24 ?? 0).toFixed?.(2) ?? ch24}%` : `${(ch24 ?? 0).toFixed?.(2) ?? ch24}%`}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button className={`px-4 py-2 text-sm font-medium ${activeTab === "chart" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-slate-400"}`} onClick={() => setActiveTab("chart")}>
          <BarChart3 size={16} className="inline mr-2" /> Chart
        </button>
        <button className={`px-4 py-2 text-sm font-medium ${activeTab === "news" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-slate-400"}`} onClick={() => setActiveTab("news")}>
          <Newspaper size={16} className="inline mr-2" /> News
        </button>
        <button className={`px-4 py-2 text-sm font-medium ${activeTab === "analysis" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-slate-400"}`} onClick={() => setActiveTab("analysis")}>
          <Activity size={16} className="inline mr-2" /> Analysis
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "chart" && (
          <TradeTab
            key="chart-tab"
            coin={coin}
            price={price}
            ch24={ch24}
            pos24={pos24}
            marketCap={marketCap}
            vol24={vol24}
            loading={loading}
          />
        )}
        {activeTab === "news" && (
          <NewsTab key="news-tab" coin={coin || { name: "…" }} news={news} />
        )}
        {activeTab === "analysis" && (
          <AnalysisTab
            key="analysis-tab"
            coin={coin || { name: "…" }}
            signals={signals}
            dayRange={dayRange}
            marketCap={marketCap}
            vol24={vol24}
            news={news}
          />
        )}
      </AnimatePresence>

      {(!coin || loading) && (
        <div className="text-slate-400 text-sm">Loading market data…</div>
      )}

      <style>{`
        .glass{background:rgba(30,41,59,.5);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.1)}
        .btn-ghost{background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:4px 8px;border-radius:8px;transition:all .2s}
        .btn-ghost:hover{background:rgba(255,255,255,.08);color:#e2e8f0}
      `}</style>
    </div>
  );
}
