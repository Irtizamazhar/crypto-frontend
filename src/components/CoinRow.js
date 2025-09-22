import React from "react";
import { Link } from "react-router-dom";
import { useWatchlist } from "../context/WatchlistContext";
import { Star } from "lucide-react";
import { fmt, pct } from "../utils/format";
import SmartImg from "./SmartImg";

export default function CoinRow({ c }) {
  const { ids, toggle } = useWatchlist();
  const inWatchlist = ids.includes(c.id);

  const price = c._priceConv ?? c.priceUsdt;
  const vol24 = c._volConv ?? c.volumeUsd24Hr ?? c.volumeQuote24h;
  const p24 = c.changePercent24Hr ?? 0;
  const pos = Number(p24) >= 0;

  return (
    <div className="px-4 py-3 flex items-center gap-3 border-b border-white/5 last:border-b-0">
      <SmartImg symbol={c.symbol} alt="" className="h-6 w-6 rounded-full" />

      <div className="flex-1 min-w-0">
        <Link to={`/coin/${c.id}`} className="font-medium truncate hover:underline">
          {c.name} <span className="text-slate-400 text-xs">({String(c.symbol || "").toUpperCase()})</span>
        </Link>
        <div className="text-xs text-slate-400 truncate">Vol 24h {fmt(vol24)}</div>
      </div>

      <div className="text-right">
        <div
          className="text-sm font-semibold"
          style={{ fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' }}
          title={String(price ?? "")}
        >
          {fmt(price)}
        </div>
        <div className={`text-xs ${pos ? "text-emerald-400" : "text-rose-400"}`}>{pct(p24)}</div>
      </div>

      <button
        onClick={() => toggle(c.id)}
        className={`ml-1 rounded-lg px-2 py-1 text-sm transition ${
          inWatchlist ? "text-yellow-400" : "text-slate-300 hover:text-slate-100"
        }`}
        title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      >
        <Star className="h-4 w-4" fill={inWatchlist ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
