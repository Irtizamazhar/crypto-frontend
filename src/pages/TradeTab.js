// src/pages/TradeTab.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Users, Volume2, Timer } from "lucide-react";
import { fmt, pct } from "../utils/format";
import LiveCandleChart from "../components/LiveCandleChart";

export default function TradeTab({ coin, price, ch24, pos24, marketCap, vol24 }) {
  const [interval, setInterval] = useState("1m");
  const symbolUSDT = `${String(coin?.symbol || "BTC").toUpperCase()}USDT`;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
      <div className="glass p-5 rounded-xl">
        {/* header row */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-3xl font-extrabold">${Number(price).toLocaleString()}</div>
          <div className={`text-base ${pos24 ? "text-emerald-400" : "text-rose-400"}`}>
            {pos24 ? <ArrowUp size={16} className="inline" /> : <ArrowDown size={16} className="inline" />} {pct(ch24)}
          </div>
          <div className="hidden md:block text-slate-400">•</div>
          {vol24 != null && (
            <div className="flex items-center text-sm">
              <Volume2 size={16} className="text-slate-400 mr-1" />
              <span className="text-slate-300">24h Vol:</span>
              <span className="ml-1">${fmt(vol24)}</span>
            </div>
          )}
          {marketCap != null && (
            <div className="flex items-center text-sm">
              <Users size={16} className="text-slate-400 mr-1" />
              <span className="text-slate-300">Market Cap:</span>
              <span className="ml-1">${fmt(marketCap)}</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1 text-xs text-slate-400">
            <Timer size={14} /> Interval:
            {["1m","5m","15m","1h","4h","1d"].map(iv => (
              <button key={iv}
                onClick={() => setInterval(iv)}
                className={`px-2 py-1 rounded-md border border-white/10 ml-1 ${interval===iv?"bg-white/10 text-cyan-300":"hover:bg-white/5"}`}>
                {iv}
              </button>
            ))}
          </div>
        </div>

        {/* chart */}
        <div className="mt-4">
          <LiveCandleChart symbol={symbolUSDT} interval={interval} height={420} />
        </div>

        <div className="mt-3 text-[11px] text-slate-500">
          For analysis only. This app does not place real trades.
        </div>
      </div>
    </motion.div>
  );
}
