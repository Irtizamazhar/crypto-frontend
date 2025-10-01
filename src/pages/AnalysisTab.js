// src/pages/AnalysisTab.jsx
import React from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { fmt } from "../utils/format";

export default function AnalysisTab({ coin, signals, dayRange, marketCap, vol24, news }) {
  return (
    <motion.div
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
                <span className={signals.trendUp ? "text-emerald-400" : "text-rose-400"}>
                  {signals.trendUp ? "Bullish" : "Bearish"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">RSI Indicator</span>
                <span className={
                  signals.rsi > 70 ? "text-rose-400" :
                  signals.rsi < 30 ? "text-emerald-400" : "text-amber-400"
                }>
                  {signals.rsi} ({signals.rsi > 70 ? "Overbought" : signals.rsi < 30 ? "Oversold" : "Neutral"})
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Signal Strength</span>
                <span className={
                  signals.score >= 70 ? "text-emerald-400" :
                  signals.score <= 30 ? "text-rose-400" : "text-amber-400"
                }>
                  {signals.score}/100
                </span>
              </div>

              {!!signals.reasons?.length && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">Key Factors</h4>
                  <ul className="text-xs text-slate-400 space-y-1">
                    {signals.reasons.map((reason, i) => <li key={i}>• {reason}</li>)}
                  </ul>
                </div>
              )}

              {signals?.prediction && <div className="text-xs text-slate-400">{signals.prediction}</div>}
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
                  {news.slice(0, 2).map((n) => n.title).join(" · ").slice(0, 160)}…
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
