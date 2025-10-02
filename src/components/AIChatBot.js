// src/components/AIChatBot.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, User, Loader2, ShieldCheck, Activity } from "lucide-react";
import { fetchCoin, fetchMarketData, fetchNews, fetchKlines, fetchMarket } from "../services/api";
import { useAlerts } from "../context/AlertsContext";
import { parseAlertIntent, extractSymbol } from "../lib/alertNLP";

/* ---------- Small utils ---------- */
const utcNow = () =>
  new Date().toLocaleString("en-GB", { hour12: false, timeZone: "UTC" }) + " UTC";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const pctNum = (n, d = 2) => `${(Number(n) || 0).toFixed(d)}%`;

/* ---------- Indicators ---------- */
const calculateRSI = (prices, period = 14) => {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = prices[prices.length - i] - prices[prices.length - i - 1];
    if (change >= 0) gains += change; else losses -= change;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateMACD = (prices) => {
  if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };
  const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / 12;
  const ema26 = prices.slice(-26).reduce((a, b) => a + b, 0) / 26;
  const macd = ema12 - ema26;
  const signal = macd; // simplified demo
  return { macd, signal, histogram: macd - signal };
};

/* ---------- Confidence & plan helpers ---------- */
function computeConfidence(analysis) {
  if (!analysis) return 50;
  let score = 30;
  if (analysis.trend.includes("bullish")) score += 15;
  if (analysis.trend === "strong-bullish") score += 10;
  if (analysis.trend.includes("bearish")) score += 5;
  if (analysis.rsi > 55 && analysis.rsi < 70) score += 8;
  if (analysis.macd.histogram > 0) score += 7;
  if (analysis.volatility < 6) score += 5;
  return clamp(score, 30, 85);
}

function buildPlan(symbol, a) {
  if (!a) return null;
  const bias =
    a.trend === "strong-bullish" ? "strong-bullish" :
    a.trend === "weak-bullish" ? "weak-bullish" :
    a.trend === "weak-bearish" ? "weak-bearish" : "strong-bearish";

  const entry = a.currentPrice;
  const invalid =
    bias.includes("bullish")
      ? Math.min(a.sma20 || entry * 0.992, entry * 0.985)
      : Math.max(a.sma20 || entry * 1.008, entry * 1.015);

  const step = Math.max(0.004, Math.min(0.02, (a.volatility || 3) / 300));
  const t1 = bias.includes("bullish") ? entry * (1 + step) : entry * (1 - step);
  const t2 = bias.includes("bullish") ? entry * (1 + step * 2.2) : entry * (1 - step * 2.2);

  return {
    symbol,
    timeframe: "1h",
    bias,
    entry: Number(entry),
    invalid: Number(invalid),
    targets: [Number(t1), Number(t2)],
    confidence: computeConfidence(a),
    volatility: a.volatility,
  };
}

/* ---------- Component ---------- */
export default function AIChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text:
        "Hello! I'm your crypto assistant with live market data and structured trade plans (bias, invalidation, targets). Ask me about any coin or say “trending”. 🚀",
      timestamp: new Date(),
      type: "greeting",
      meta: { source: "Welcome", at: utcNow() },
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [userName, setUserName] = useState(localStorage.getItem("chatbot_user_name") || "");
  const messagesEndRef = useRef(null);

  const { addAlert, limits } = useAlerts();

  /* ---------- Responsive behavior ---------- */
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
  );
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const onChange = (e) => setIsMobile(e.matches);
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  // Lock body scroll when panel is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : prev || "";
    return () => { document.body.style.overflow = prev || ""; };
  }, [open]);

  /* ---------- UI helpers ---------- */
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (userName) localStorage.setItem("chatbot_user_name", userName); }, [userName]);

  const simulateTyping = async (callback, duration = 800) => {
    setTyping(true);
    await new Promise((r) => setTimeout(r, duration + Math.random() * 500));
    setTyping(false);
    callback();
  };

  /* ---------- Data helpers ---------- */
  async function getTrendingCoins(limit = 5) {
    try {
      const marketData = await fetchMarket({ per_page: 100 });
      const scoredCoins = marketData.map((coin) => {
        const volumeScore = Math.log10((coin.volumeUsd24Hr || coin.volumeQuote24h || 0) + 1) * 0.4;
        const priceChangeScore = Math.abs(coin.changePercent24Hr || 0) * 0.3;
        const momentumScore = (coin.changePercent24Hr || 0) > 0 ? 0.3 : 0.1;
        return { ...coin, score: volumeScore + priceChangeScore + momentumScore };
      });
      return scoredCoins
        .filter((c) => (c.changePercent24Hr || 0) > 1)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  async function analyzeMarketCondition(symbol) {
    try {
      const klines = await fetchKlines(`${symbol}USDT`, "1h", 100);
      if (!Array.isArray(klines) || klines.length < 50) return null;
      const currentPrice = klines[klines.length - 1];
      const prices24h = klines.slice(-24);
      const high24h = Math.max(...prices24h);
      const low24h = Math.min(...prices24h);
      const sma20 = klines.slice(-20).reduce((a, b) => a + b, 0) / 20;
      const sma50 = klines.slice(-50).reduce((a, b) => a + b, 0) / 50;
      const rsi = calculateRSI(klines);
      const macd = calculateMACD(klines);
      const volatility = ((high24h - low24h) / Math.max(1e-9, low24h)) * 100;

      let trendStrength = 0;
      if (currentPrice > sma20) trendStrength += 1;
      if (sma20 > sma50) trendStrength += 1;
      if (rsi > 50) trendStrength += 0.5;
      if (macd.histogram > 0) trendStrength += 0.5;

      const trend =
        trendStrength >= 3 ? "strong-bullish" :
        trendStrength >= 2 ? "weak-bullish" :
        trendStrength >= 1 ? "weak-bearish" : "strong-bearish";

      return { currentPrice, high24h, low24h, sma20, sma50, rsi, macd, volatility, trend, trendStrength };
    } catch {
      return null;
    }
  }

  function formatPrediction(analysis, symbol) {
    if (!analysis) return "Not enough data for prediction.";
    const { trend, currentPrice, volatility, rsi } = analysis;
    const confidence = computeConfidence(analysis);
    let predictionText = "", timeFrame = "", targetPrice = currentPrice;

    switch (trend) {
      case "strong-bullish":
        targetPrice = currentPrice * (1 + (volatility || 5) * 0.002);
        timeFrame = "next 24–48 hours";
        predictionText = `📈 *BULLISH PREDICTION*\nExpect a push toward $${targetPrice.toFixed(2)}`;
        break;
      case "weak-bullish":
        targetPrice = currentPrice * (1 + (volatility || 5) * 0.001);
        timeFrame = "next 12–24 hours";
        predictionText = `↗️ *MILD BULLISH*\nPotential rise to $${targetPrice.toFixed(2)}`;
        break;
      case "weak-bearish":
        targetPrice = currentPrice * (1 - (volatility || 5) * 0.001);
        timeFrame = "next 12–24 hours";
        predictionText = `↘️ *MILD BEARISH*\nPossible dip to $${targetPrice.toFixed(2)}`;
        break;
      case "strong-bearish":
        targetPrice = currentPrice * (1 - (volatility || 5) * 0.002);
        timeFrame = "next 24–48 hours";
        predictionText = `📉 *BEARISH PREDICTION*\nExpect a fade toward $${targetPrice.toFixed(2)}`;
        break;
      default:
        break;
    }

    return `${predictionText} within ${timeFrame}.\n\nConfidence: ${confidence}% | RSI: ${analysis.rsi.toFixed(0)}\n\n⚠️ Educational outlook, not financial advice.`;
  }

  function formatRecommendation(analysis, symbol) {
    if (!analysis) return "Not enough data for a reliable recommendation.";
    const { trend, volatility, currentPrice, sma20, rsi, macd } = analysis;
    let recommendation = `🎯 *${symbol} ANALYSIS (1h):*\n\n`;
    recommendation += `• Price: $${currentPrice.toFixed(2)}\n`;
    recommendation += `• Trend: ${trend.replace("-", " ").toUpperCase()}\n`;
    recommendation += `• RSI: ${rsi.toFixed(0)} (${rsi > 70 ? "Overbought" : rsi < 30 ? "Oversold" : "Neutral"})\n`;
    recommendation += `• Volatility(24h): ${volatility.toFixed(2)}%\n`;
    recommendation += `• MACD: ${macd.histogram > 0 ? "Bullish" : "Bearish"}\n\n`;

    if (trend === "strong-bullish" && rsi < 70) {
      recommendation += `💚 *STRONG BUY CONDITIONS* (educational)\nEntry: $${currentPrice.toFixed(2)}\nInvalidation: $${sma20.toFixed(2)}\nTargets: $${(currentPrice * 1.02).toFixed(2)}, $${(currentPrice * 1.035).toFixed(2)}\n`;
    } else if (trend === "weak-bullish") {
      recommendation += `🟡 *CAUTIOUS BUY*\nPrefer confirmation above: $${(currentPrice * 1.01).toFixed(2)}\n`;
    } else if (trend === "weak-bearish") {
      recommendation += `🟠 *CAUTION*\nBearish pressure building. Reduce risk / wait for reversal.\n`;
    } else if (trend === "strong-bearish") {
      recommendation += `🔴 *AVOID / SELL BIASED*\nStrong down momentum. Wait for higher lows.\n`;
    }

    recommendation += `\n📊 *Prediction:* ${formatPrediction(analysis, symbol)}`;
    recommendation += `\n\n⚡ Tip: ${volatility > 6 ? "High volatility — reduce position size" : "Normal conditions."}`;
    return recommendation;
  }

  /* ---------- Conversation engine ---------- */
  async function askAI(question) {
    const q = (question || "").toLowerCase();
    const user = userName || "there";
    const stamp = { source: "Binance proxy + APIs", at: utcNow() };

    // 1) ALERT INTENT: "set alert BTC above 65000", "alert ETH percent > 5", "alert SOL volume below 5e6"
    const alertIntent = parseAlertIntent(q);
    if (alertIntent) {
      const symbol = alertIntent.symbol;
      // resolve minimal coin object for alert creation
      const coinId = (symbol || "").toLowerCase();
      const name = symbol;
      try {
        await addAlert({
          coinId,
          symbol,
          name,
          type: alertIntent.type,
          op: alertIntent.op,
          value: alertIntent.value,
        });
        return {
          text: `🔔 Alert created for *${symbol}*: ${alertIntent.type === "price" ? "price" : alertIntent.type === "pct24h" ? "24h %" : "24h volume"} ${alertIntent.op} ${alertIntent.value}`,
          meta: stamp,
        };
      } catch (e) {
        // AlertsContext handles 402 by opening paywall. Provide a clear chat text as well.
        const msg = e?.message || "Could not create alert";
        const upsell = (limits?.plan !== "pro" && limits?.used >= limits?.max)
          ? `\n\nYou’ve used your ${limits.max} free alerts. Upgrade to Pro for unlimited alerts — I’ve opened the upgrade panel.`
          : "";
        return { text: `⚠️ ${msg}${upsell}`, meta: stamp };
      }
    }

    try {
      if (q.includes("how are you")) {
        return { text: `I'm great, ${user}! Systems green and data live. How can I help?`, meta: stamp };
      }
      if (q.includes("your name") || q.includes("who are you")) {
        return { text: `I'm CryptoAlpha Pro — real-time crypto assistant with structured trade plans, confidence, invalidations & built-in alerts.`, meta: stamp };
      }
      if (q.includes("my name is") && !userName) {
        const m = q.match(/my name is ([a-z0-9_]+)/i);
        if (m && m[1]) { const n = m[1]; setUserName(n); }
        return { text: `Nice to meet you! I’ll tailor insights to your style.`, meta: stamp };
      }
      if (q.includes("help") || q.includes("what can you do")) {
        return {
          text:
            "I can: \n• Predictive outlooks 🔮\n• Structured trade plans (entry, invalidation, targets)\n• Trending coins & risk checks\n• Sentiment & quick news\n• Set live alerts from chat (try: “set alert BTC above 65000”)\n\nFree plan includes 2 alerts; upgrade to Pro for unlimited.",
          meta: stamp,
        };
      }

      // quick trending
      if (q.includes("trending") || q.includes("hot") || q.includes("what should i trade") || q.includes("opportunit")) {
        const trending = await getTrendingCoins(5);
        if (!trending.length) return { text: "I couldn’t fetch trending data. Try again soon.", meta: stamp };
        let response = `🔥 *Top Momentum (live)*\n\n`;
        for (const [i, coin] of trending.entries()) {
          const emoji = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "•";
          response += `${emoji} ${coin.symbol.toUpperCase()}: $${coin.priceUsdt.toFixed(2)} (${pctNum(coin.changePercent24Hr)})\n`;
        }
        response += `\nTip: Set alerts right from here. Example: “set alert ${trending[0].symbol} above ${trending[0].priceUsdt.toFixed(2)}”`;
        return { text: response, meta: stamp };
      }

      // coin detection
      const symbol = extractSymbol(q);

      if (symbol) {
        if (q.includes("predict") || q.includes("forecast")) {
          const a = await analyzeMarketCondition(symbol);
          const plan = buildPlan(symbol, a);
          return { text: formatPrediction(a, symbol), meta: { ...stamp, plan } };
        }

        if (q.includes("price") || q.includes("how much") || q.includes("value")) {
          try {
            const data = await fetchCoin(symbol);
            const change = data.changePercent24Hr;
            const emoji = change >= 0 ? "📈" : "📉";
            const a = await analyzeMarketCondition(symbol);
            const plan = buildPlan(symbol, a);
            const line1 = `${emoji} *${symbol}*: $${data.priceUsdt.toFixed(2)} (${change >= 0 ? "+" : ""}${change.toFixed(2)}%)`;
            const quick = a
              ? `\n• Trend: ${a.trend.replace("-", " ").toUpperCase()} | RSI ${a.rsi.toFixed(0)} | Vol ${a.volatility.toFixed(1)}%`
              : `\n• Snapshot loaded.`;
            return { text: `${line1}${quick}\n\n${formatPrediction(a, symbol)}`, meta: { ...stamp, plan } };
          } catch {
            return { text: `I couldn’t fetch the price for ${symbol} right now. Try again later.`, meta: stamp };
          }
        }

        if (q.includes("analysis") || q.includes("analyze") || q.includes("should i") || q.includes("buy") || q.includes("sell") || q.includes("trade")) {
          const a = await analyzeMarketCondition(symbol);
          const plan = buildPlan(symbol, a);
          return { text: formatRecommendation(a, symbol), meta: { ...stamp, plan } };
        }

        if (q.includes("news") || q.includes("update")) {
          try {
            const news = await fetchNews(symbol, symbol);
            if (!news.length) return { text: `No recent major headlines on ${symbol}.`, meta: stamp };
            let txt = `📰 *${symbol} — Latest Headlines:*\n\n`;
            news.slice(0, 3).forEach((n, i) => {
              txt += `${i + 1}. ${n.title}\n   Source: ${n.source}\n   Read: ${n.url}\n\n`;
            });
            return { text: txt, meta: stamp };
          } catch {
            return { text: "News fetch failed. Please try again.", meta: stamp };
          }
        }

        // default when symbol found
        return {
          text: `I can build a trade plan for ${symbol}: prediction, invalidation, and targets.\nTry “Predict ${symbol}” or “${symbol} analysis”.\n\nWant alerts? Say: “set alert ${symbol} above 1234”`,
          meta: stamp,
        };
      }

      // market overview
      if (q.includes("market") && (q.includes("overview") || q.includes("summary") || q.includes("how is the market"))) {
        try {
          const btc = await fetchCoin("BTC");
          const eth = await fetchCoin("ETH");
          const trending = await getTrendingCoins(3);
          let response = `🌐 *MARKET OVERVIEW (live)*\n\n`;
          response += `• BTC: $${btc.priceUsdt.toFixed(2)} (${btc.changePercent24Hr >= 0 ? "+" : ""}${btc.changePercent24Hr.toFixed(2)}%)\n`;
          response += `• ETH: $${eth.priceUsdt.toFixed(2)} (${eth.changePercent24Hr >= 0 ? "+" : ""}${eth.changePercent24Hr.toFixed(2)}%)\n`;
          if (trending.length > 0) {
            response += `\n🔥 *Top Performers:*\n`;
            trending.forEach((c) => { response += `• ${c.symbol.toUpperCase()}: +${(c.changePercent24Hr || 0).toFixed(2)}%\n`; });
          }
          response += `\nTip: Ask “set alert BTC above ${btc.priceUsdt.toFixed(2)}”`;
          return { text: response, meta: stamp };
        } catch {
          return { text: "I couldn’t fetch the overview. Try again shortly.", meta: stamp };
        }
      }

      // risk guidance
      if (q.includes("risk") || q.includes("volatility") || q.includes("safe")) {
        return {
          text:
            "⚠️ *Risk Basics:*\n• Crypto is highly volatile (5–20% daily swings)\n• Always use invalidations (stop-loss)\n• Position-size by volatility\n• Diversify 3–5 assets\n\nAsk a coin: “Analyze SOL”.",
          meta: stamp,
        };
      }

      if (q.includes("thanks") || q.includes("thank")) {
        return { text: `You’re welcome, ${user}! Want a plan for BTC or your favorite coin?`, meta: stamp };
      }

      // fallback
      return {
        text:
          "I create actionable, *structured* plans with entry, invalidation, targets + confidence. Ask about any coin (e.g., “Predict BTC”).\n\nI can also set alerts: “set alert ETH above 3500”. Free plan has 2 alerts; upgrade to Pro for unlimited.",
        meta: stamp,
      };
    } catch (e) {
      console.error("AI Error:", e);
      return { text: "⚠️ I hit an error. Please try again.", meta: stamp };
    }
  }

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { from: "user", text: input, timestamp: new Date() };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    setInput("");
    simulateTyping(async () => {
      const res = await askAI(input);
      const reply = typeof res === "string"
        ? { from: "bot", text: res, timestamp: new Date() }
        : { from: "bot", text: res.text, meta: res.meta, timestamp: new Date() };
      setMessages((m) => [...m, reply]);
      setLoading(false);
    }, 800);
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatMessage = (text) =>
    String(text || "")
      .replace(/\*(.*?)\*/g, '<strong class="font-bold text-cyan-300">$1</strong>')
      .replace(/\n/g, "<br />")
      .replace(/💚/g, '<span class="text-green-400">💚</span>')
      .replace(/🔴/g, '<span class="text-red-400">🔴</span>')
      .replace(/🟡/g, '<span class="text-yellow-400">🟡</span>')
      .replace(/🟠/g, '<span class="text-orange-400">🟠</span>')
      .replace(/🔥/g, '<span class="text-orange-500">🔥</span>')
      .replace(/📊/g, '<span class="text-blue-400">📊</span>')
      .replace(/📈/g, '<span class="text-green-400">📈</span>')
      .replace(/📉/g, '<span class="text-red-400">📉</span>')
      .replace(/🎯/g, '<span class="text-purple-400">🎯</span>')
      .replace(/⚡/g, '<span class="text-yellow-300">⚡</span>')
      .replace(/🤖/g, '<span class="text-cyan-400">🤖</span>')
      .replace(/🌡️/g, '<span class="text-red-300">🌡️</span>')
      .replace(/🌐/g, '<span class="text-blue-300">🌐</span>')
      .replace(/💡/g, '<span class="text-yellow-200">💡</span>')
      .replace(/🚀/g, '<span class="text-green-300">🚀</span>');

  function PlanCard({ plan }) {
    if (!plan) return null;
    const bull = plan.bias.includes("bullish");
    return (
      <div className="mt-2 rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-xs">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Activity className={`h-4 w-4 ${bull ? "text-emerald-400" : "text-rose-400"}`} />
            <span className="font-semibold">{plan.symbol} • {plan.timeframe}</span>
            <span className={`px-2 py-0.5 rounded-full ${bull ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>
              {plan.bias.replace("-", " ")}
            </span>
          </div>
          <span className="text-slate-400">Conf: {plan.confidence}%</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>Entry: <span className="text-slate-200">${plan.entry.toFixed(2)}</span></div>
          <div>Invalid: <span className="text-slate-200">${plan.invalid.toFixed(2)}</span></div>
          <div>Target 1: <span className="text-slate-200">${plan.targets[0].toFixed(2)}</span></div>
          <div>Target 2: <span className="text-slate-200">${plan.targets[1].toFixed(2)}</span></div>
        </div>
        <div className="mt-2 text-[11px] text-slate-400">
          Note: Educational plan. Use your own risk controls.
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {[
            { label: "Set alert @ invalidation", q: `set alert ${plan.symbol} below ${plan.invalid.toFixed(2)}` },
            { label: "Set alert @ T1", q: `set alert ${plan.symbol} above ${plan.targets[0].toFixed(2)}` },
            { label: "Explain risk", q: `Explain risk for ${plan.symbol} ${plan.timeframe} plan` },
          ].map((a, i) => (
            <button
              key={i}
              onClick={() => { setInput(a.q); setTimeout(() => send(), 50); }}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="chatbot-fab fixed right-6 z-50 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg text-white shadow-purple-500/30"
        onClick={() => setOpen(!open)}
        aria-label="Open AI Chat"
      >
        <Bot size={24} />
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full" />
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={isMobile ? { y: 40, opacity: 0 } : { y: 20, opacity: 0, scale: 0.95 }}
            animate={isMobile ? { y: 0, opacity: 1 } : { y: 0, opacity: 1, scale: 1 }}
            exit={isMobile ? { y: 40, opacity: 0 } : { y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className={[
              "fixed z-50 glass rounded-2xl flex flex-col overflow-hidden shadow-xl border border-slate-700/50",
              isMobile ? "left-0 right-0 mx-2 rounded-b-none rounded-t-2xl" : "right-6"
            ].join(" ")}
            style={
              isMobile
                ? { bottom: `calc(var(--mobile-dock-h, 0px) + env(safe-area-inset-bottom))`, maxHeight: "min(78vh, 720px)" }
                : { bottom: "24px", width: "420px", height: "520px" }
            }
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b border-slate-700 ${isMobile ? "bg-slate-900/90" : "bg-gradient-to-r from-purple-800 to-blue-900"}`}>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <span className="font-semibold text-white">CryptoAlpha Pro</span>
                  <div className="text-xs text-slate-300">Live insights • Structured plans • Alerts</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-slate-700 rounded-full transition-colors"
                aria-label="Close chat"
              >
                <X size={18} className="text-slate-300" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-900 to-slate-800">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-3 ${m.from === "bot" ? "justify-start" : "justify-end"}`}
                >
                  {m.from === "bot" && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                      <Bot size={16} className="text-white" />
                    </div>
                  )}

                  <div className={`max-w-[80%] md:max-w-[75%] rounded-2xl p-3 ${m.from === "bot" ? "bg-slate-800 text-slate-200 rounded-bl-none border-l-2 border-cyan-500" : "bg-blue-600 text-white rounded-br-none border-r-2 border-blue-400"}`}>
                    <div className="text-[13px] md:text-sm message-content" dangerouslySetInnerHTML={{ __html: formatMessage(m.text) }} />

                    {m.meta?.plan && <PlanCard plan={m.meta.plan} />}

                    {m.from === "bot" && (
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Data: {m.meta?.source || "API"}</span>
                        <span>•</span>
                        <span>{m.meta?.at || utcNow()}</span>
                      </div>
                    )}

                    <div className={`text-[11px] md:text-xs mt-1 ${m.from === "bot" ? "text-slate-400" : "text-blue-200"}`}>
                      {formatTime(m.timestamp)}
                    </div>
                  </div>

                  {m.from === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                </motion.div>
              ))}

              {typing && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-slate-800 text-slate-200 rounded-2xl rounded-bl-none p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-slate-800 border-t border-slate-700">
              <div className="flex gap-2 items-center mb-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 rounded-xl px-4 py-3 text-sm bg-slate-900 text-white placeholder-slate-500 border border-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="Ask predictions, analysis, or set alerts… e.g. set alert BTC above 65000"
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  disabled={loading || typing}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={send}
                  disabled={loading || typing || !input.trim()}
                  className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                  aria-label="Send message"
                >
                  {(loading || typing) ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </motion.button>
              </div>

              <div className="flex flex-wrap gap-1">
                {[
                  { label: "BTC Prediction", query: "Predict BTC", icon: "🔮" },
                  { label: "Trending Coins", query: "What coins are trending now?", icon: "🔥" },
                  { label: "ETH Analysis", query: "Analyze ETH", icon: "📊" },
                  { label: "Market Overview", query: "Market overview", icon: "🌐" },
                  { label: "Set Alert @ BTC 65k", query: "set alert BTC above 65000", icon: "🔔" },
                ].map((action, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setInput(action.query); setTimeout(() => send(), 80); }}
                    className="text-[11px] md:text-xs bg-slate-700 hover:bg-cyan-700 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>{action.icon}</span>
                    {action.label}
                  </motion.button>
                ))}
              </div>

              <div className="mt-2 text-[10.5px] text-slate-400">
                {limits?.plan !== "pro"
                  ? `Free plan: ${limits?.used || 0}/${limits?.max || 2} alerts used. Upgrade to Pro for unlimited.`
                  : "Pro plan active — unlimited alerts 🚀"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styles */}
      <style jsx>{`
        .glass { background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .overflow-y-auto::-webkit-scrollbar { width: 6px; }
        .overflow-y-auto::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); border-radius: 3px; }
        .overflow-y-auto::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #6366f1, #3b82f6); border-radius: 3px; }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #818cf8, #60a5fa); }
        .message-content { line-height: 1.5; }
        .message-content strong { font-weight: 600; }
        @media (max-width: 767px) { .chatbot-fab { bottom: calc(var(--mobile-dock-h, 0px) + env(safe-area-inset-bottom) + 12px); } }
        @media (min-width: 768px) { .chatbot-fab { bottom: 24px; } }
      `}</style>
    </>
  );
}
