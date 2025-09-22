import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchCoin } from "../services/api";
import { fmt, pct } from "../utils/format";
import { motion } from "framer-motion";
import TrendSparkline from "../components/TrendSparkline";
import { useWatchlist } from "../context/WatchlistContext";
import { Star } from "lucide-react";

// paper trading
import { usePortfolio } from "../context/PortfolioContext";

export default function Coin() {
  const { id } = useParams();
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);
  const { ids, toggle } = useWatchlist();
  const { buy, sell, mark } = usePortfolio();

  // fetch coin
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetchCoin(id);
        setC(r);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // derive values FIRST (so the effect can live before early returns)
  const symbol = c?.symbol ? String(c.symbol).toUpperCase() : null;
  const curPrice = c?.market_data?.current_price?.usd ?? null;

  // keep portfolio marked with latest price (hook BEFORE any return)
  useEffect(() => {
    if (symbol && curPrice) {
      mark(symbol, Number(curPrice));
    }
  }, [symbol, curPrice, mark]);

  // now it’s safe to early-return
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 text-slate-400">
        Loading coin...
      </div>
    );
  }
  if (!c) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 text-slate-400">
        Coin not found.
      </div>
    );
  }

  const md = c.market_data || {};
  const pos24 = (md.price_change_percentage_24h || 0) >= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <div className="flex items-start gap-4">
        <img src={c.image?.large} alt="" className="h-16 w-16 rounded-2xl" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {c.name} <span className="text-slate-400 text-xl">({symbol})</span>
          </h1>
          <div className="text-sm text-slate-400">Rank #{c.market_cap_rank}</div>
        </div>
        <button
          onClick={() => toggle(c.id)}
          className={`btn-ghost ${ids.includes(c.id) ? "text-yellow-400" : "text-slate-300"}`}
        >
          <Star
            className="h-5 w-5"
            fill={ids.includes(c.id) ? "currentColor" : "none"}
          />{" "}
          Watch
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-5 grid md:grid-cols-3 gap-6"
      >
        <div className="md:col-span-2">
          <div className="text-4xl font-extrabold">
            ${curPrice?.toLocaleString?.()}
          </div>
          <div className={`mt-1 ${pos24 ? "text-green-400" : "text-red-400"}`}>
            {pct(md.price_change_percentage_24h)}
          </div>
          <div className="mt-4">
            <TrendSparkline
              data={c.market_data?.sparkline_7d?.price || []}
              positive={pos24}
            />
          </div>

          {/* quick paper trade */}
          <div className="mt-4 flex items-center gap-2">
            <button
              className="btn-ghost"
              onClick={() =>
                curPrice &&
                buy({ id: c.id, symbol: c.symbol, name: c.name }, Number(curPrice), 10)
              }
              title="Buy 10 (paper)"
            >
              Trade (Paper)
            </button>
            <button
              className="btn-ghost"
              onClick={() =>
                curPrice &&
                sell({ id: c.id, symbol: c.symbol, name: c.name }, Number(curPrice), 10)
              }
              title="Sell 10 (paper)"
            >
              Sell (Paper)
            </button>
            <Link to={`/backtest/${c.id}`} className="btn-ghost">
              Backtest
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="glass p-3">
            <div className="text-slate-400">Market Cap</div>
            <div className="text-lg font-semibold">${fmt(md.market_cap?.usd)}</div>
          </div>
          <div className="glass p-3">
            <div className="text-slate-400">24h Volume</div>
            <div className="text-lg font-semibold">${fmt(md.total_volume?.usd)}</div>
          </div>
          <div className="glass p-3">
            <div className="text-slate-400">Circulating</div>
            <div className="text-lg font-semibold">{fmt(md.circulating_supply)}</div>
          </div>
          <div className="glass p-3">
            <div className="text-slate-400">Max Supply</div>
            <div className="text-lg font-semibold">{fmt(md.max_supply)}</div>
          </div>
        </div>
      </motion.div>

      {c.description?.en && (
        <div className="prose prose-invert prose-headings:mt-0 max-w-none">
          <h2>About {c.name}</h2>
          <div
            dangerouslySetInnerHTML={{
              __html: c.description.en.substring(0, 2000),
            }}
          />
        </div>
      )}
    </div>
  );
}
