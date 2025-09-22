import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchCoin, fetchKlines, fetchNews, fetchMarketData } from "../services/api";
import { SMA, RSI, MACD, signalScore } from "../services/indicators";
import TrendSparkline from "../components/TrendSparkline";
import { fmt, pct } from "../utils/format";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  BarChart3,
  Newspaper,
  Activity,
  ArrowUp,
  ArrowDown,
  Users,
  Volume2,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ---------------- Wallet + Positions (localStorage) ---------------- */
const WALLET_KEY = "usd_wallet_v1";
const POS_KEY = "usd_positions_v1"; // array of open + closed

const readWallet = () => {
  const n = Number(localStorage.getItem(WALLET_KEY));
  return Number.isFinite(n) ? n : 1000;
};
const writeWallet = (v) => {
  try {
    localStorage.setItem(WALLET_KEY, String(Math.max(0, Number(v) || 0)));
  } catch {}
};

const readPositions = () => {
  try {
    const arr = JSON.parse(localStorage.getItem(POS_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};
const writePositions = (arr) => {
  try {
    localStorage.setItem(POS_KEY, JSON.stringify(arr));
  } catch {}
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/* Fallback: read any market cache to get basic coin info by id */
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
          image: { large: hit.image },
          // Use USDT price as current USD proxy (market_data-like shape)
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

const timeLeft = (endTs) => Math.max(0, endTs - Date.now());
const prettyLeft = (ms) => {
  const s = Math.floor(ms / 1000),
    h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

/* ---------------- Component ---------------- */
export default function Trade() {
  const { id } = useParams();
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closes, setCloses] = useState([]);
  const [wallet, setWallet] = useState(readWallet());
  const [positions, setPositions] = useState(readPositions());
  const [placing, setPlacing] = useState(false);
  const [amt, setAmt] = useState(5);
  const [news, setNews] = useState([]);
  const [marketData, setMarketData] = useState(null);
  const [activeTab, setActiveTab] = useState("trade");

  const tickRef = useRef(null);

  /* Load coin + klines + marketData + news with robust fallback */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        let c = null;
        try {
          c = await fetchCoin(id);
        } catch {}
        if (!c) c = readAnyMarketCachedById(id);
        if (!alive) return;
        setCoin(c);

        const sym = String(c?.symbol || "").toUpperCase();
        if (sym) {
          try {
            // Load klines, news, and marketData in parallel
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
            console.error("Error fetching data:", err);
            setCloses([]);
            setNews([]);
            setMarketData(null);
          }
        } else {
          setCloses([]);
          setNews([]);
          setMarketData(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  /* Auto-resolve 24h positions */
  const autoResolve = useCallback(() => {
    if (!coin) return;
    const md = coin.market_data || {};
    const priceNow =
      md.current_price?.usd ??
      coin.priceUsdt ?? // from Binance normalizeTicker
      closes.at(-1) ??
      0;
    if (!priceNow) return;

    const now = Date.now();
    let changed = false;
    let payout = 0;

    const next = positions.map((p) => {
      if (p.settled || now < p.resolveTs) return p;
      const correct = (p.side === "UP" && priceNow > p.entry) || (p.side === "DOWN" && priceNow < p.entry);
      const pay = correct ? p.amount * 2 : 0; // escrowed earlier; only add payout on win
      payout += pay;
      changed = true;
      return { ...p, settled: true, result: correct ? "WIN" : "LOSE", exit: priceNow, payout: pay, settledTs: now };
    });

    if (changed) {
      if (payout !== 0) {
        const w = wallet + payout;
        setWallet(w);
        writeWallet(w);
      }
      setPositions(next);
      writePositions(next);
    }
  }, [positions, closes, coin, wallet]);

  useEffect(() => {
    tickRef.current && clearInterval(tickRef.current);
    tickRef.current = setInterval(autoResolve, 1000);
    return () => tickRef.current && clearInterval(tickRef.current);
  }, [autoResolve]);

  const symbol = String(coin?.symbol || "").toUpperCase();
  const md = coin?.market_data || {};

  // Use Binance % if CoinGecko % missing
  const ch24 = md.price_change_percentage_24h ?? coin?.changePercent24Hr ?? 0;
  const pos24 = ch24 >= 0;

  // Price: prefer market_data, then Binance priceUsdt, then last close
  const price =
    md.current_price?.usd ??
    coin?.priceUsdt ??
    (Array.isArray(closes) && closes.length ? closes[closes.length - 1] : 0);

  /* Quick stats */
  const oneHrChangePct = useMemo(() => {
    if (!closes || closes.length < 2) return 0;
    const a = closes[closes.length - 2];
    const b = closes[closes.length - 1];
    if (!a || !b) return 0;
    return ((b - a) / a) * 100;
  }, [closes]);

  const dayRange = useMemo(() => {
    const high =
      md.high_24h?.usd ??
      md.high_24h ??
      marketData?.high_24h?.usd ??
      marketData?.high_24h ??
      null;
    const low =
      md.low_24h?.usd ??
      md.low_24h ??
      marketData?.low_24h?.usd ??
      marketData?.low_24h ??
      null;
    if (!high || !low || !price) return null;
    const pctFromLow = ((price - low) / low) * 100;
    const pctFromHigh = ((price - high) / high) * 100;
    return { high, low, pctFromLow, pctFromHigh };
  }, [md.high_24h, md.low_24h, price, marketData]);

  const sevenDayPct = md.price_change_percentage_7d_in_currency?.usd ?? md.price_change_percentage_7d ?? null;
  const marketCap = md.market_cap?.usd ?? md.market_cap ?? marketData?.market_cap?.usd ?? marketData?.market_cap ?? null;
  const vol24 = md.total_volume?.usd ?? md.total_volume ?? marketData?.total_volume?.usd ?? marketData?.total_volume ?? null;
  const turnoverPct = marketCap && vol24 ? (vol24 / marketCap) * 100 : null;

  // Simple intraday “volatility”
  const volSignal = useMemo(() => {
    if (!closes || closes.length < 24) return null;
    const items = closes.slice(-24);
    const mean = items.reduce((a, b) => a + b, 0) / items.length;
    if (!mean) return null;
    const variance = items.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / items.length;
    const std = Math.sqrt(variance);
    return { std, volPct: (std / mean) * 100 };
  }, [closes]);

  /* Signals + story */
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

  /* Place position (escrow) */
  const openPosition = async (side) => {
    const a = Math.max(1, Math.floor(Number(amt) || 1));
    if (!price || wallet < a) {
      alert("Insufficient USD balance.");
      return;
    }
    setPlacing(true);
    try {
      const p = {
        id: `${Date.now()}`,
        coinId: coin.id,
        name: coin.name,
        symbol,
        side, // "UP" | "DOWN"
        amount: a, // escrowed
        entry: Number(price),
        startTs: Date.now(),
        resolveTs: Date.now() + ONE_DAY_MS,
        settled: false,
      };
      const w = wallet - a;
      const list = [p, ...positions];
      setWallet(w);
      writeWallet(w);
      setPositions(list);
      writePositions(list);
    } finally {
      setPlacing(false);
    }
  };

  const addFunds = (v) => {
    const n = wallet + v;
    setWallet(n);
    writeWallet(n);
  };

  const open = positions.filter((p) => !p.settled && p.coinId === coin?.id);
  const hist = positions.filter((p) => p.settled && p.coinId === coin?.id).slice(0, 10);

  if (loading)
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 text-slate-400 flex justify-center items-center h-64">
        <div className="animate-pulse text-lg">Loading market data...</div>
      </div>
    );

  if (!coin) return <div className="mx-auto max-w-7xl px-4 py-10 text-slate-400">Coin details unavailable.</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start gap-4">
        <div className="flex items-center gap-4">
          <motion.img
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            src={coin.image?.large}
            alt=""
            className="h-16 w-16 rounded-2xl shadow-lg"
          />
          <div>
            <h1 className="text-3xl font-bold">
              {coin.name} <span className="text-slate-400 text-xl">({symbol})</span>
            </h1>
            {coin.market_cap_rank && <div className="text-sm text-slate-400">Rank #{coin.market_cap_rank}</div>}
            <div className="text-sm text-slate-400 mt-1">
              24h:{" "}
              <span className={pos24 ? "text-emerald-400" : "text-rose-400"}>
                {ch24 >= 0 ? `+${ch24.toFixed?.(2) ?? ch24}%` : `${ch24.toFixed?.(2) ?? ch24}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Wallet */}
        <div className="glass rounded-xl p-3 text-right md:ml-auto">
          <div className="text-xs text-slate-400">USD Balance</div>
          <div className="text-lg font-semibold">${fmt(wallet)}</div>
          <div className="mt-2 flex items-center gap-2 justify-end">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} className="btn-ghost text-xs" onClick={() => addFunds(10)}>
              + $10
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} className="btn-ghost text-xs" onClick={() => addFunds(50)}>
              + $50
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} className="btn-ghost text-xs" onClick={() => addFunds(100)}>
              + $100
            </motion.button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "trade" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-slate-400"
          }`}
          onClick={() => setActiveTab("trade")}
        >
          <BarChart3 size={16} className="inline mr-2" /> Trade
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "news" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-slate-400"
          }`}
          onClick={() => setActiveTab("news")}
        >
          <Newspaper size={16} className="inline mr-2" /> News
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "analysis" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-slate-400"
          }`}
          onClick={() => setActiveTab("analysis")}
        >
          <Activity size={16} className="inline mr-2" /> Analysis
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "trade" && (
          <motion.div
            key="trade-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Price + Sparkline + Trade panel */}
            <div className="glass p-5 grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-extrabold">${Number(price).toLocaleString()}</div>
                  <div className={`text-lg ${pos24 ? "text-emerald-400" : "text-rose-400"}`}>
                    {pos24 ? <ArrowUp size={20} className="inline" /> : <ArrowDown size={20} className="inline" />} {pct(ch24)}
                  </div>
                </div>

                {(marketCap || vol24) && (
                  <div className="flex flex-wrap gap-4 mt-4 text-sm">
                    {vol24 != null && (
                      <div className="flex items-center">
                        <Volume2 size={16} className="text-slate-400 mr-1" />
                        <span className="text-slate-300">24h Vol:</span>
                        <span className="ml-1">${fmt(vol24)}</span>
                      </div>
                    )}
                    {marketCap != null && (
                      <div className="flex items-center">
                        <Users size={16} className="text-slate-400 mr-1" />
                        <span className="text-slate-300">Market Cap:</span>
                        <span className="ml-1">${fmt(marketCap)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 h-24">
                  <TrendSparkline data={coin.market_data?.sparkline_7d?.price || closes} positive={pos24} />
                </div>

                <div className="mt-5 glass p-4 rounded-xl">
                  <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <DollarSign size={16} /> Open Position (resolves in 24h)
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <button className="btn-ghost text-xs" onClick={() => setAmt(1)}>
                        $1
                      </button>
                      <button className="btn-ghost text-xs" onClick={() => setAmt(5)}>
                        $5
                      </button>
                      <button className="btn-ghost text-xs" onClick={() => setAmt(10)}>
                        $10
                      </button>
                    </div>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={amt}
                      onChange={(e) => setAmt(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm w-24"
                      aria-label="Amount (USD)"
                    />
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => openPosition("UP")}
                      disabled={placing || wallet < amt}
                      className="rounded-lg px-4 py-2 bg-emerald-600/80 hover:bg-emerald-600 text-white text-sm disabled:opacity-50"
                    >
                      <TrendingUp className="inline -mt-0.5 mr-1" size={16} /> Call UP
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => openPosition("DOWN")}
                      disabled={placing || wallet < amt}
                      className="rounded-lg px-4 py-2 bg-rose-600/80 hover:bg-rose-600 text-white text-sm disabled:opacity-50"
                    >
                      <TrendingDown className="inline -mt-0.5 mr-1" size={16} /> Call DOWN
                    </motion.button>
                    <div className="text-[11px] text-slate-500 ml-2">Win pays 2× stake; funds escrowed now. Automatic 24h resolution.</div>
                  </div>
                </div>
              </div>

              {/* Signals & Insights */}
              <div className="space-y-3">
                {/* Quick Stats */}
                {dayRange && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass p-3 rounded-xl">
                      <div className="text-xs text-slate-400">24h High</div>
                      <div className="text-sm font-semibold">${fmt(dayRange.high)}</div>
                      <div className="text-[11px] text-slate-500">From high: {dayRange.pctFromHigh?.toFixed(1)}%</div>
                    </div>
                    <div className="glass p-3 rounded-xl">
                      <div className="text-xs text-slate-400">24h Low</div>
                      <div className="text-sm font-semibold">${fmt(dayRange.low)}</div>
                      <div className="text-[11px] text-slate-500">From low: +{dayRange.pctFromLow?.toFixed(1)}%</div>
                    </div>
                  </div>
                )}

                <div className="glass p-3 rounded-xl">
                  <div className="text-sm font-semibold mb-1">Signal</div>
                  {!signals ? (
                    <div className="text-slate-400 text-sm">Not enough data yet.</div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        {signals.trendUp ? <TrendingUp className="text-emerald-400" /> : <TrendingDown className="text-rose-400" />}
                        <div className="text-sm">{signals.trendUp ? "Uptrend" : "Downtrend"}</div>
                      </div>
                      <div className="mt-2">
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-400" style={{ width: `${signals.score}%` }} />
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Score {signals.score}/100 · RSI {signals.rsi}</div>
                      </div>
                    </>
                  )}
                </div>

                <div className="glass p-3 rounded-xl">
                  <div className="text-sm font-semibold mb-1 flex items-center gap-1">
                    <Info size={14} /> Today’s Story
                  </div>
                  {signals?.reasons?.length ? (
                    <ul className="text-xs text-slate-300 list-disc ml-5 space-y-1">
                      {signals.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-slate-400">No major drivers detected today.</div>
                  )}
                  {signals?.prediction && <div className="text-xs text-slate-400 mt-2">{signals.prediction}</div>}
                </div>

                <div className="glass p-3 rounded-xl">
                  <div className="text-sm font-semibold mb-1">About {coin.name}</div>
                  {coin.description?.en ? (
                    <div className="text-xs text-slate-400 max-h-48 overflow-y-auto" dangerouslySetInnerHTML={{ __html: coin.description.en }} />
                  ) : (
                    <div className="text-xs text-slate-400">No description available.</div>
                  )}
                  <Link to={`/backtest/${coin.id}`} className="btn-ghost text-xs mt-2 inline-block">
                    Backtest
                  </Link>
                </div>

                <div className="text-[11px] text-slate-500">Educational analytics. Not financial advice.</div>
              </div>
            </div>

            {/* Open positions */}
            <section className="space-y-2 mt-6">
              <div className="text-sm font-semibold">Your Open Positions</div>
              {open.length === 0 ? (
                <div className="glass p-4 text-sm text-slate-400">No open positions for this coin.</div>
              ) : (
                <div className="glass rounded-xl overflow-hidden">
                  <div className="grid grid-cols-6 px-3 py-2 text-xs text-slate-400 border-b border-white/10">
                    <div>Side</div>
                    <div>Amount</div>
                    <div>Entry</div>
                    <div>Current</div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      Time Left
                    </div>
                    <div>Would Pay</div>
                  </div>
                  {open.map((p) => {
                    const left = timeLeft(p.resolveTs);
                    const wouldWin = (p.side === "UP" && price > p.entry) || (p.side === "DOWN" && price < p.entry);
                    return (
                      <div key={p.id} className="grid grid-cols-6 px-3 py-2 border-b border-white/5 text-sm items-center">
                        <div className={p.side === "UP" ? "text-emerald-300" : "text-rose-300"}>{p.side}</div>
                        <div>${fmt(p.amount)}</div>
                        <div>${fmt(p.entry)}</div>
                        <div>${fmt(price)}</div>
                        <div>{prettyLeft(left)}</div>
                        <div className={wouldWin ? "text-emerald-400" : "text-slate-400"}>{wouldWin ? `$${fmt(p.amount * 2)}` : "$0"}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Recent results */}
            {hist.length > 0 && (
              <section className="space-y-2 mt-6">
                <div className="text-sm font-semibold">Recent Resolved</div>
                <div className="glass rounded-xl overflow-hidden">
                  <div className="grid grid-cols-6 px-3 py-2 text-xs text-slate-400 border-b border-white/10">
                    <div>Side</div>
                    <div>Amount</div>
                    <div>Entry</div>
                    <div>Exit</div>
                    <div>Result</div>
                    <div>Payout</div>
                  </div>
                  {hist.map((p) => (
                    <div key={p.id} className="grid grid-cols-6 px-3 py-2 border-b border-white/5 text-sm">
                      <div className={p.side === "UP" ? "text-emerald-300" : "text-rose-300"}>{p.side}</div>
                      <div>${fmt(p.amount)}</div>
                      <div>${fmt(p.entry)}</div>
                      <div>${fmt(p.exit)}</div>
                      <div className={p.result === "WIN" ? "text-emerald-400" : "text-rose-400"}>{p.result}</div>
                      <div>${fmt(p.payout || 0)}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}

        {activeTab === "news" && (
          <motion.div
            key="news-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="glass p-5 rounded-xl"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Newspaper size={20} /> Latest News about {coin.name}
            </h2>

            {news.length === 0 ? (
              <div className="text-slate-400 text-center py-10">No recent news found for {coin.name}.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {news.slice(0, 6).map((item, index) => (
                  <motion.div
                    key={`${item.url}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass p-4 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
                    <p className="text-xs text-slate-400 mb-2">{item.description}</p>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>{item.source}</span>
                      <span>{new Date(item.published_at).toLocaleDateString()}</span>
                    </div>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-xs mt-2 inline-block">
                      Read more →
                    </a>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "analysis" && (
          <motion.div
            key="analysis-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="glass p-5 rounded-xl"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity size={20} /> Market Analysis for {coin.name}
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Price Movement Analysis</h3>
                {!signals ? (
                  <div className="text-slate-400">Not enough data for analysis.</div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Trend Direction</span>
                      <span className={signals.trendUp ? "text-emerald-400" : "text-rose-400"}>{signals.trendUp ? "Bullish" : "Bearish"}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">RSI Indicator</span>
                      <span
                        className={
                          signals.rsi > 70 ? "text-rose-400" : signals.rsi < 30 ? "text-emerald-400" : "text-amber-400"
                        }
                      >
                        {signals.rsi} ({signals.rsi > 70 ? "Overbought" : signals.rsi < 30 ? "Oversold" : "Neutral"})
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Signal Strength</span>
                      <span
                        className={
                          signals.score >= 70 ? "text-emerald-400" : signals.score <= 30 ? "text-rose-400" : "text-amber-400"
                        }
                      >
                        {signals.score}/100
                      </span>
                    </div>

                    {!!signals.reasons?.length && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-2">Key Factors</h4>
                        <ul className="text-xs text-slate-400 space-y-1">
                          {signals.reasons.map((reason, i) => (
                            <li key={i}>• {reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-3">Market Snapshot</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Bullish</span>
                      <span>Bearish</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: "100%",
                          background: `linear-gradient(90deg, rgba(52, 211, 153, .85) ${signals?.score || 50}%, rgba(248, 113, 113, .85) ${signals?.score || 50}%)`,
                        }}
                      />
                    </div>
                  </div>

                  {dayRange && (
                    <div className="flex justify-between text-sm">
                      <span>24h High: ${fmt(dayRange.high)}</span>
                      <span>24h Low: ${fmt(dayRange.low)}</span>
                    </div>
                  )}

                  {(marketCap || vol24) && (
                    <div className="flex justify-between text-sm">
                      <span>Market Cap: {marketCap != null ? `$${fmt(marketCap)}` : "—"}</span>
                      <span>24h Volume: {vol24 != null ? `$${fmt(vol24)}` : "—"}</span>
                    </div>
                  )}

                  {!!news?.length && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Recent Headlines</h4>
                      <p className="text-xs text-slate-400">
                        {news
                          .slice(0, 2)
                          .map((n) => n.title)
                          .join(" · ")
                          .slice(0, 160)}
                        …
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .glass {
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .btn-ghost {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          transition: all .2s;
        }
        .btn-ghost:hover {
          background: rgba(255,255,255,.08);
          color: #e2e8f0;
        }
      `}</style>
    </div>
  );
}
