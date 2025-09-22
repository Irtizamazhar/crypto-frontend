// src/components/AIChatBot.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, User, Loader2 } from "lucide-react";
import { fetchCoin, fetchMarketData, fetchNews, fetchKlines, fetchMarket } from "../services/api";

// Enhanced technical indicators
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
  const signal = macd; // simplified demo signal
  return { macd, signal, histogram: macd - signal };
};

export default function AIChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text:
        "Hello! I'm your advanced crypto trading assistant with predictive analytics. I can help with real-time market data, AI-powered predictions, sentiment analysis, and trading strategies. How can I assist you today? 🚀",
      timestamp: new Date(),
      type: "greeting",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [userName, setUserName] = useState(localStorage.getItem("chatbot_user_name") || "");
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (userName) localStorage.setItem("chatbot_user_name", userName); }, [userName]);

  const simulateTyping = async (callback, duration = 1000) => {
    setTyping(true);
    await new Promise((r) => setTimeout(r, duration + Math.random() * 500));
    setTyping(false);
    callback();
  };

  async function getTrendingCoins(limit = 5) {
    try {
      const marketData = await fetchMarket({ per_page: 100 });
      const scoredCoins = marketData.map((coin) => {
        const volumeScore = Math.log10(coin.volumeUsd24Hr + 1) * 0.4;
        const priceChangeScore = Math.abs(coin.changePercent24Hr) * 0.3;
        const momentumScore = coin.changePercent24Hr > 0 ? 0.3 : 0.1;
        return { ...coin, score: volumeScore + priceChangeScore + momentumScore };
      });
      return scoredCoins
        .filter((c) => c.changePercent24Hr > 1)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  async function analyzeMarketCondition(symbol) {
    try {
      const klines = await fetchKlines(`${symbol}USDT`, "1h", 100);
      if (klines.length < 50) return null;
      const currentPrice = klines[klines.length - 1];
      const prices24h = klines.slice(-24);
      const high24h = Math.max(...prices24h);
      const low24h = Math.min(...prices24h);
      const sma20 = klines.slice(-20).reduce((a, b) => a + b, 0) / 20;
      const sma50 = klines.slice(-50).reduce((a, b) => a + b, 0) / 50;
      const rsi = calculateRSI(klines);
      const macd = calculateMACD(klines);
      const volatility = ((high24h - low24h) / low24h) * 100;

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

  function generatePrediction(analysis, symbol) {
    if (!analysis) return "Not enough data for prediction.";
    const { trend, trendStrength, currentPrice, volatility, rsi } = analysis;
    const confidence = Math.min(85, trendStrength * 20 + 30);
    let predictionText = "", timeFrame = "", targetPrice = currentPrice;

    switch (trend) {
      case "strong-bullish":
        targetPrice = currentPrice * (1 + volatility * 0.002);
        timeFrame = "next 24-48 hours";
        predictionText = `📈 *BULLISH PREDICTION*\nExpect upward movement to $${targetPrice.toFixed(2)}`;
        break;
      case "weak-bullish":
        targetPrice = currentPrice * (1 + volatility * 0.001);
        timeFrame = "next 12-24 hours";
        predictionText = `↗️ *MILD BULLISH*\nPotential rise to $${targetPrice.toFixed(2)}`;
        break;
      case "weak-bearish":
        targetPrice = currentPrice * (1 - volatility * 0.001);
        timeFrame = "next 12-24 hours";
        predictionText = `↘️ *MILD BEARISH*\nPossible dip to $${targetPrice.toFixed(2)}`;
        break;
      case "strong-bearish":
        targetPrice = currentPrice * (1 - volatility * 0.002);
        timeFrame = "next 24-48 hours";
        predictionText = `📉 *BEARISH PREDICTION*\nExpect decline to $${targetPrice.toFixed(2)}`;
        break;
      default:
        break;
    }

    return `${predictionText} within ${timeFrame}.\n\nConfidence: ${confidence.toFixed(0)}% | RSI: ${rsi.toFixed(0)}\n\n⚠️ *Remember:* Predictions are probabilistic, not guarantees. Always use stop-losses.`;
  }

  function generateRecommendation(analysis, symbol) {
    if (!analysis) return "Not enough data for a reliable recommendation.";
    const { trend, volatility, currentPrice, sma20, rsi, macd } = analysis;
    let recommendation = `🎯 *${symbol} COMPREHENSIVE ANALYSIS:*\n\n`;
    recommendation += `• Current Price: $${currentPrice.toFixed(2)}\n`;
    recommendation += `• Trend: ${trend.replace("-", " ").toUpperCase()}\n`;
    recommendation += `• RSI: ${rsi.toFixed(0)} (${rsi > 70 ? "Overbought" : rsi < 30 ? "Oversold" : "Neutral"})\n`;
    recommendation += `• Volatility: ${volatility.toFixed(2)}%\n`;
    recommendation += `• MACD: ${macd.histogram > 0 ? "Bullish" : "Bearish"}\n\n`;

    if (trend === "strong-bullish" && rsi < 70) {
      recommendation += `💚 *STRONG BUY SIGNAL* 💚\nMultiple indicators align for upward movement.\nEntry: $${currentPrice.toFixed(2)}\nStop-loss: $${sma20.toFixed(2)}\nTarget: $${(currentPrice * 1.05).toFixed(2)} (+5%)\n`;
    } else if (trend === "weak-bullish") {
      recommendation += `🟡 *CAUTIOUS BUY* 🟡\nModerate bullish signals. Wait for confirmation.\nEntry above: $${(currentPrice * 1.01).toFixed(2)}\n`;
    } else if (trend === "weak-bearish") {
      recommendation += `🟠 *CAUTION ADVISED* 🟠\nBearish pressure building. Consider reducing exposure.\n`;
    } else if (trend === "strong-bearish") {
      recommendation += `🔴 *SELL/AVOID* 🔴\nStrong downward momentum. Wait for reversal signals.\n`;
    }

    if (rsi > 70) recommendation += `\n⚠️ RSI indicates OVERBOUGHT conditions - profit-taking may be wise.`;
    else if (rsi < 30) recommendation += `\n⚠️ RSI indicates OVERSOLD conditions - potential bounce opportunity.`;

    recommendation += `\n\n📊 *Prediction Outlook:*\n${generatePrediction(analysis, symbol)}`;
    recommendation += `\n\n⚡ *Trading Tip:* ${volatility > 5 ? "High volatility - use smaller position sizes." : "Normal market conditions."}`;
    return recommendation;
  }

  async function getMarketSentiment(symbol) {
    try {
      const news = await fetchNews(symbol, symbol);
      let sentimentScore = 50;
      if (news.length > 0) {
        const positive = ["up", "bull", "gain", "surge", "rally", "positive", "growth"];
        const negative = ["down", "bear", "drop", "crash", "fall", "negative", "loss"];
        news.forEach((n) => {
          const t = n.title.toLowerCase();
          positive.forEach((w) => { if (t.includes(w)) sentimentScore += 2; });
          negative.forEach((w) => { if (t.includes(w)) sentimentScore -= 2; });
        });
        sentimentScore = Math.max(0, Math.min(100, sentimentScore));
      }
      return sentimentScore;
    } catch {
      return 50;
    }
  }

  async function askAI(question) {
    const q = question.toLowerCase();
    const user = userName || "there";
    try {
      if (q.includes("how are you") || q.includes("how're you")) {
        return `I'm doing excellent, ${user}! 😊 My systems are fully operational and I'm analyzing market data in real-time. Ready to help you navigate the crypto markets!`;
      }
      if (q.includes("your name") || q.includes("who are you")) {
        return `I'm CryptoAlpha Pro, your advanced AI trading assistant! 🤖 I combine real-time market data with predictive analytics to help you make informed trading decisions.`;
      }
      if (q.includes("my name is") && !userName) {
        const m = q.match(/my name is (\w+)/i);
        if (m && m[1]) { const n = m[1]; setUserName(n); return `Wonderful to meet you, ${n}! 👋 I'll remember your name for our future conversations. How can I assist with your crypto journey today?`; }
      }
      if (q.includes("what should i call you")) return `You can call me CryptoAlpha! 🤖 I'm your 24/7 trading companion, always ready with market insights and analysis.`;
      if (q.includes("hello") || q.includes("hi") || q.includes("hey")) {
        return `Hello ${user}! 👋 I'm your advanced crypto trading assistant with predictive capabilities. I can help you with:\n• AI-powered price predictions 🔮\n• Real-time market analysis 📊\n• Trading signals & strategies 📈\n• Sentiment analysis 🎯\n• Portfolio optimization 💼\n\nWhat would you like to explore today?`;
      }
      if (q.includes("help") || q.includes("what can you do")) {
        return `🤖 *ADVANCED CAPABILITIES:*\n\n• *Predictive Analytics* - "Predict BTC price"\n• *Market Analysis* - "Analyze ETH technically"\n• *Trading Signals* - "Should I buy SOL now?"\n• *Trend Identification* - "What's hot right now?"\n• *Sentiment Analysis* - "Market sentiment for ADA"\n• *Risk Assessment* - "Volatility analysis"\n• *Portfolio Strategy* - "Diversification tips"\n\nTry: "Predict BTC next week" or "Analyze market sentiment"`;
      }
      if ((q.includes("predict") || q.includes("forecast") || q.includes("will") || q.includes("going to")) && !q.includes("how")) {
        const coinPattern = /(bitcoin|btc|ethereum|eth|bnb|solana|sol|cardano|ada|xrp|dogecoin|doge|polkadot|dot|shiba|shib|avax|matic|link)/i;
        const coinMatch = q.match(coinPattern);
        const coinSymbol = coinMatch ? coinMatch[0] : "BTC";
        const normalizedSymbol = coinSymbol === "bitcoin" ? "BTC" : coinSymbol === "ethereum" ? "ETH" : coinSymbol.toUpperCase();
        const analysis = await analyzeMarketCondition(normalizedSymbol);
        return generatePrediction(analysis, normalizedSymbol);
      }
      if (q.includes("sentiment") || q.includes("mood") || q.includes("feeling")) {
        const coinPattern = /(bitcoin|btc|ethereum|eth|bnb|solana|sol|cardano|ada|xrp|dogecoin|doge)/i;
        const coinMatch = q.match(coinPattern);
        const coinSymbol = coinMatch ? coinMatch[0] : "crypto";
        if (coinSymbol === "crypto") {
          const btc = await getMarketSentiment("BTC");
          const eth = await getMarketSentiment("ETH");
          return `🌡️ *Overall Market Sentiment:*\n\n• Bitcoin: ${btc}/100 ${btc > 60 ? "😊" : btc < 40 ? "😟" : "😐"}\n• Ethereum: ${eth}/100 ${eth > 60 ? "😊" : eth < 40 ? "😟" : "😐"}\n\nMarket is ${(btc + eth) / 2 > 60 ? "generally optimistic" : (btc + eth) / 2 < 40 ? "showing concern" : "in neutral territory"}.`;
        } else {
          const normalized = coinSymbol === "bitcoin" ? "BTC" : coinSymbol === "ethereum" ? "ETH" : coinSymbol.toUpperCase();
          const s = await getMarketSentiment(normalized);
          return `🌡️ *${normalized} Market Sentiment:* ${s}/100\n\n${s > 70 ? "😊 Very Bullish" : s > 60 ? "🙂 Bullish" : s > 40 ? "😐 Neutral" : s > 30 ? "🙁 Bearish" : "😟 Very Bearish"}\n\nBased on news and market data analysis.`;
        }
      }
      if (q.includes("trending") || q.includes("hot") || q.includes("best coins") || q.includes("what should i trade") || q.includes("opportunit")) {
        const trending = await getTrendingCoins(5);
        if (!trending.length) return "I couldn't fetch trending data right now. Please try again in a few moments.";
        let response = `🔥 *TOP TRENDING COINS - Real-time Analysis:*\n\n`;
        for (const [index, coin] of trending.entries()) {
          const emoji = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "•";
          const analysis = await analyzeMarketCondition(coin.symbol);
          const trendEmoji = analysis?.trend === "strong-bullish" ? "🚀" : analysis?.trend === "weak-bullish" ? "↗️" : analysis?.trend === "weak-bearish" ? "↘️" : "🔻";
          response += `${emoji} ${trendEmoji} *${coin.symbol.toUpperCase()}*: $${coin.priceUsdt.toFixed(2)} (+${coin.changePercent24Hr.toFixed(2)}%)\n`;
          response += `   Volume: $${(coin.volumeUsd24Hr / 1_000_000).toFixed(1)}M | Trend: ${analysis?.trend.replace("-", " ").toUpperCase()}\n\n`;
        }
        response += `💡 *AI INSIGHT:* These coins show strong momentum and volume. Consider:\n• Small position sizes due to high volatility\n• Setting tight stop-losses\n• Taking profits at 5-10% gains\n\nAlways verify with recent news!`;
        return response;
      }

      const coinPattern = /(bitcoin|btc|ethereum|eth|bnb|solana|sol|cardano|ada|xrp|ripple|dogecoin|doge|polkadot|dot|shiba|shib|avax|avalanche|matic|polygon|link|chainlink|litecoin|ltc|uniswap|uni)/i;
      const coinMatch = q.match(coinPattern);
      const coinSymbol = coinMatch ? coinMatch[0] : null;
      const map = {
        bitcoin: "BTC", btc: "BTC", ethereum: "ETH", eth: "ETH", bnb: "BNB",
        solana: "SOL", sol: "SOL", cardano: "ADA", ada: "ADA",
        xrp: "XRP", ripple: "XRP", dogecoin: "DOGE", doge: "DOGE",
        polkadot: "DOT", dot: "DOT", shiba: "SHIB", shib: "SHIB",
        avax: "AVAX", avalanche: "AVAX", matic: "MATIC", polygon: "MATIC",
        link: "LINK", chainlink: "LINK", litecoin: "LTC", ltc: "LTC",
        uniswap: "UNI", uni: "UNI",
      };
      const normalizedSymbol = coinSymbol ? (map[coinSymbol.toLowerCase()] || coinSymbol.toUpperCase()) : null;

      if ((q.includes("price") || q.includes("how much") || q.includes("value")) && normalizedSymbol) {
        try {
          const data = await fetchCoin(normalizedSymbol);
          const price = data.priceUsdt.toFixed(2);
          const change = data.changePercent24Hr.toFixed(2);
          const changeEmoji = change >= 0 ? "📈" : "📉";
          const analysis = await analyzeMarketCondition(normalizedSymbol);
          let response = `${changeEmoji} *${normalizedSymbol}*: $${price} (${change >= 0 ? "+" : ""}${change}%)\n\n`;
          response += `📊 *Quick Analysis:*\n`;
          response += `• Trend: ${analysis?.trend.replace("-", " ").toUpperCase()}\n`;
          response += `• Volatility: ${analysis?.volatility.toFixed(1)}%\n`;
          response += `• RSI: ${analysis?.rsi.toFixed(0)} ${analysis?.rsi > 70 ? "(Overbought)" : analysis?.rsi < 30 ? "(Oversold)" : ""}\n\n`;
          response += `💡 ${change >= 0 ? "Bullish momentum" : "Bearish pressure"} detected.`;
          return response;
        } catch {
          return `⚠️ Sorry, I couldn't fetch the price for ${normalizedSymbol} right now. Please try again later.`;
        }
      }

      if ((q.includes("market cap") || q.includes("volume") || q.includes("high") || q.includes("low")) && normalizedSymbol) {
        try {
          const marketData = await fetchMarketData(normalizedSymbol.toLowerCase());
          if (marketData) {
            return `📊 *${normalizedSymbol} Market Data:*\n• Market Cap: *$${(marketData.market_cap / 1e9).toFixed(2)}B*\n• 24h Volume: *$${(marketData.total_volume / 1e9).toFixed(2)}B*\n• 24h High: *$${marketData.high_24h?.toFixed(2) || "N/A"}*\n• 24h Low: *$${marketData.low_24h?.toFixed(2) || "N/A"}*`;
          }
          return `ℹ️ Market data for ${normalizedSymbol} is currently unavailable.`;
        } catch {
          return "⚠️ Sorry, I couldn't fetch market data right now.";
        }
      }

      if ((q.includes("should i") || q.includes("buy") || q.includes("sell") || q.includes("trade") || q.includes("analysis") || q.includes("analyze") || q.includes("prediction")) && normalizedSymbol) {
        const analysis = await analyzeMarketCondition(normalizedSymbol);
        return generateRecommendation(analysis, normalizedSymbol);
      }

      if ((q.includes("news") || q.includes("update") || q.includes("what's happening")) && normalizedSymbol) {
        try {
          const news = await fetchNews(normalizedSymbol, normalizedSymbol);
          if (news.length) {
            let response = `📰 *Latest ${normalizedSymbol} News:*\n\n`;
            news.slice(0, 3).forEach((item, i) => {
              response += `${i + 1}. ${item.title}\n   Source: ${item.source}\n   Read: ${item.url}\n\n`;
            });
            return response;
          }
          return `ℹ️ No recent news found for ${normalizedSymbol}. Check back later!`;
        } catch {
          return "⚠️ Sorry, I couldn't fetch news right now.";
        }
      }

      if (q.includes("market") && (q.includes("overview") || q.includes("summary") || q.includes("how is the market"))) {
        try {
          const btc = await fetchCoin("BTC");
          const eth = await fetchCoin("ETH");
          const trending = await getTrendingCoins(3);
          const btcSentiment = await getMarketSentiment("BTC");
          let response = `🌐 *MARKET OVERVIEW - Real-time Analysis:*\n\n`;
          response += `• *BTC:* $${btc.priceUsdt.toFixed(2)} (${btc.changePercent24Hr >= 0 ? "+" : ""}${btc.changePercent24Hr.toFixed(2)}%)\n`;
          response += `• *ETH:* $${eth.priceUsdt.toFixed(2)} (${eth.changePercent24Hr >= 0 ? "+" : ""}${eth.changePercent24Hr.toFixed(2)}%)\n`;
          response += `• *Market Sentiment:* ${btcSentiment}/100 ${btcSentiment > 60 ? "😊 Bullish" : btcSentiment < 40 ? "😟 Bearish" : "😐 Neutral"}\n\n`;
          if (trending.length > 0) {
            response += `🔥 *Top Performers:*\n`;
            trending.slice(0, 3).forEach((c) => { response += `• ${c.symbol.toUpperCase()}: +${c.changePercent24Hr.toFixed(2)}%\n`; });
          }
          response += `\n💡 *AI ASSESSMENT:* The market is ${btc.changePercent24Hr >= 0 ? "showing strength" : "under pressure"} with ${btcSentiment > 60 ? "positive" : "cautious"} sentiment.`;
          return response;
        } catch {
          return "⚠️ Sorry, I couldn't fetch market overview right now.";
        }
      }

      if (q.includes("risk") || q.includes("volatility") || q.includes("safe")) {
        return `⚠️ *RISK ASSESSMENT GUIDELINES:*\n\n• Cryptocurrencies are HIGHLY volatile (5-20% daily moves common)\n• Never invest more than you can afford to lose\n• Diversify across 3-5 different coins\n• Use stop-loss orders always\n• Consider: 70% BTC/ETH, 30% altcoins for beginners\n\nI can analyze specific coin volatility if you ask!`;
      }

      if (q.includes("thank") || q.includes("thanks") || q.includes("appreciate")) {
        return `You're very welcome ${user}! 😊 It's my pleasure to help you navigate these exciting markets. Remember: always do your own research and never invest based on single opinions!\n\nIs there anything else you'd like me to analyze?`;
      }

      if (normalizedSymbol) {
        return `I see you're asking about ${normalizedSymbol}. I can provide:\n• Advanced technical analysis\n• Price predictions\n• Trading signals\n• Sentiment analysis\n• Risk assessment\n\nTry: "Predict ${normalizedSymbol} price" or "Analyze ${normalizedSymbol} technically"`;
      }

      return `I want to make sure I understand you correctly. I'm your advanced AI trading assistant with these capabilities:\n\n• 🤖 Predictive analytics & forecasting\n• 📊 Advanced technical analysis\n• 🎯 Market sentiment tracking\n• ⚡ Real-time trading signals\n• 📰 News & social media analysis\n• 💼 Portfolio risk assessment\n\nTry asking about specific coins, predictions, or market conditions!`;
    } catch (e) {
      console.error("AI Error:", e);
      return "⚠️ Sorry, I'm experiencing technical difficulties. The markets are moving fast and my systems are working hard. Please try again in a moment.";
    }
  }

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { from: "user", text: input, timestamp: new Date() };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    setInput("");
    simulateTyping(async () => {
      const replyText = await askAI(input);
      const reply = { from: "bot", text: replyText, timestamp: new Date() };
      setMessages((m) => [...m, reply]);
      setLoading(false);
    }, 800);
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatMessage = (text) =>
    text
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

  const quickActions = [
    { label: "BTC Prediction", query: "Predict Bitcoin price next week", icon: "🔮" },
    { label: "Trending Coins", query: "What coins are trending now?", icon: "🔥" },
    { label: "ETH Analysis", query: "Technical analysis for Ethereum", icon: "📊" },
    { label: "Market Sentiment", query: "What's the market sentiment?", icon: "🌡️" },
    { label: "Risk Assessment", query: "How risky is crypto now?", icon: "⚠️" },
  ];

  return (
    <>
      {/* FAB – sits ABOVE the bottom nav (uses --mobile-dock-h on mobile) */}
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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-6 w-96 h-[500px] glass rounded-2xl flex flex-col overflow-hidden z-50 shadow-xl border border-slate-700/50"
            style={{
              bottom: "calc(var(--mobile-dock-h, 0px) + env(safe-area-inset-bottom) + 84px)",
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-center bg-gradient-to-r from-purple-800 to-blue-900 p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <span className="font-semibold text-white">CryptoAlpha Pro</span>
                  <div className="text-xs text-slate-300">AI Predictive Trading Assistant</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-slate-700 rounded-full transition-colors" aria-label="Close chat">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-900 to-slate-800">
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`flex gap-3 ${m.from === "bot" ? "justify-start" : "justify-end"}`}>
                  {m.from === "bot" && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                      <Bot size={16} className="text-white" />
                    </div>
                  )}

                  <div className={`max-w-[75%] rounded-2xl p-3 ${m.from === "bot" ? "bg-slate-800 text-slate-200 rounded-bl-none border-l-2 border-cyan-500" : "bg-blue-600 text-white rounded-br-none border-r-2 border-blue-400"}`}>
                    <div className="text-sm message-content" dangerouslySetInnerHTML={{ __html: formatMessage(m.text) }} />
                    <div className={`text-xs mt-1 ${m.from === "bot" ? "text-slate-400" : "text-blue-200"}`}>{formatTime(m.timestamp)}</div>
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
                  placeholder="Ask predictions, analysis, or market insights..."
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
                  {loading || typing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </motion.button>
              </div>

              <div className="flex flex-wrap gap-1">
                {[
                  { label: "BTC Prediction", query: "Predict Bitcoin price next week", icon: "🔮" },
                  { label: "Trending Coins", query: "What coins are trending now?", icon: "🔥" },
                  { label: "ETH Analysis", query: "Technical analysis for Ethereum", icon: "📊" },
                  { label: "Market Sentiment", query: "What's the market sentiment?", icon: "🌡️" },
                  { label: "Risk Assessment", query: "How risky is crypto now?", icon: "⚠️" },
                ].map((action, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setInput(action.query); setTimeout(() => send(), 100); }}
                    className="text-xs bg-slate-700 hover:bg-cyan-700 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>{action.icon}</span>
                    {action.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .glass { background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .overflow-y-auto::-webkit-scrollbar { width: 6px; }
        .overflow-y-auto::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); border-radius: 3px; }
        .overflow-y-auto::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #6366f1, #3b82f6); border-radius: 3px; }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #818cf8, #60a5fa); }
        .message-content { line-height: 1.5; }
        .message-content strong { font-weight: 600; }

        /* FAB offsets: keep it above the bottom dock and safe area on mobile */
        @media (max-width: 767px) {
          .chatbot-fab {
            bottom: calc(var(--mobile-dock-h, 0px) + env(safe-area-inset-bottom) + 12px);
          }
        }
        @media (min-width: 768px) {
          .chatbot-fab { bottom: 24px; }
        }
      `}</style>
    </>
  );
}
