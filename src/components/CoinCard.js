import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star, BellPlus, Copy, ExternalLink } from "lucide-react";
import TrendSparkline from "./TrendSparkline";
import { fmt, pct } from "../utils/format";
import { Link } from "react-router-dom";
import { useWatchlist } from "../context/WatchlistContext";
import SmartImg from "./SmartImg";
import AlertModal from "./AlertModal"; // ← requires Alerts feature. Comment out if not using.

export default function CoinCard({ c }) {
  const { ids, toggle } = useWatchlist();

  const price = c._priceConv ?? c.priceUsdt;
  const vol24 = c._volConv ?? c.volumeUsd24Hr ?? c.volumeQuote24h;
  const p24 = c.changePercent24Hr ?? 0;
  const positive = Number(p24) >= 0;
  const inWatchlist = ids.includes(c.id);

  const [showAlert, setShowAlert] = useState(false);
  const symbolU = String(c.symbol || "").toUpperCase();

  const copySymbol = async () => {
    try {
      await navigator.clipboard.writeText(symbolU);
    } catch {
      // no-op
    }
  };

  const binanceUrl = `https://www.binance.com/en/trade/${symbolU}_USDT?type=spot`;

  return (
    <motion.div
      whileHover={{ translateY: -4 }}
      transition={{ type: "spring", stiffness: 250, damping: 20 }}
      className="relative group rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-white/20"
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity ring-1 ring-white/10" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <SmartImg symbol={c.symbol} alt="" className="h-8 w-8 rounded-full shrink-0" />
          <div className="min-w-0">
            {/* Go to Trade page for full info & dollar bets */}
            <Link to={`/trade/${c.id}`} className="font-semibold hover:underline truncate">
              {c.name}
            </Link>
            <div className="text-xs text-slate-400">{symbolU}</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAlert(true)}
            title="Create alert"
            className="rounded-lg px-2 py-1 text-sm text-slate-300 hover:text-slate-100 transition"
          >
            <BellPlus className="h-5 w-5" />
          </button>

          <button
            onClick={() => toggle(c.id)}
            title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            className={`rounded-lg px-2 py-1 text-sm transition ${
              inWatchlist ? "text-yellow-400" : "text-slate-300 hover:text-slate-100"
            }`}
          >
            <Star className="h-5 w-5" fill={inWatchlist ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Price + Sparkline */}
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <div
            className="text-2xl font-bold"
            style={{ fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' }}
            title={String(price ?? "")}
          >
            {fmt(price)}
          </div>

          <div
            className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              positive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            }`}
            title="24h change"
          >
            {pct(p24)}
          </div>
        </div>

        {Array.isArray(c._spark7d) && c._spark7d.length > 1 ? (
          <TrendSparkline data={c._spark7d} positive={positive} />
        ) : (
          <div className="h-8 w-[110px] rounded bg-white/5" />
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
        {Number.isFinite(c._mcConv ?? c.marketCapUsd) && (
          <div className="truncate">
            Market Cap: <span className="text-slate-200">{fmt(c._mcConv ?? c.marketCapUsd, 2)}</span>
          </div>
        )}
        <div className="truncate">
          Volume 24h: <span className="text-slate-200">{fmt(vol24, 2)}</span>
        </div>
      </div>

      {/* Actions row */}
      <div className="mt-3 flex items-center gap-2">
        <button onClick={copySymbol} className="btn-ghost text-xs inline-flex items-center gap-1" title="Copy symbol">
          <Copy className="h-4 w-4" /> Copy
        </button>
        <a
          href={binanceUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost text-xs inline-flex items-center gap-1"
          title="Open on Binance"
        >
          <ExternalLink className="h-4 w-4" /> Binance
        </a>
      </div>

      <AlertModal
        open={showAlert}
        onClose={() => setShowAlert(false)}
        coin={{ id: c.id, symbol: c.symbol, name: c.name }}
      />
    </motion.div>
  );
}
