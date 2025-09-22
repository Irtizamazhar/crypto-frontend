// src/pages/Signals.js
import React, { useEffect, useState } from "react";
import { fetchMarket, fetchKlines } from "../services/api";
import { SMA, RSI, MACD, signalScore } from "../services/indicators";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, BellPlus } from "lucide-react"; // ✅ fixed imports
import AlertModal from "../components/AlertModal";
import SmartImg from "../components/SmartImg";
import { fmt, pct } from "../utils/format";

export default function Signals() {
  const [coins, setCoins] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCoin, setModalCoin] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const base = await fetchMarket({ page: 1, per_page: 50 }); // top 50
      const enriched = [];
      for (const c of base) {
        try {
          const closes = await fetchKlines(
            `${String(c.symbol).toUpperCase()}USDT`,
            "1h",
            300
          );
          if (closes.length < 50) continue;
          const smaFast = SMA(closes, 20);
          const smaSlow = SMA(closes, 50);
          const rsi = RSI(closes, 14);
          const { hist } = MACD(closes);
          const score = signalScore({
            smaFast,
            smaSlow,
            rsi,
            macdHist: hist,
          });

          const last = closes[closes.length - 1];
          const prev = closes[closes.length - 2];
          const mom = last - prev;

          enriched.push({
            base: c,
            score,
            trendUp: (smaFast.at(-1) ?? 0) > (smaSlow.at(-1) ?? 0),
            rsi: rsi.at(-1),
            macdHist: hist.at(-1),
            last,
            mom,
          });
        } catch {
          /* skip errors per coin */
        }
      }
      if (!alive) return;
      setCoins(base);
      setRows(enriched.sort((a, b) => b.score - a.score));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">
            Signals & Confidence
          </h1>
          <p className="text-slate-400 text-sm">
            Simple technical signals (SMA/RSI/MACD) + a combined score (0–100).
            Educational only—NOT financial advice.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="glass p-6 text-slate-400">Computing signals…</div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <div className="grid grid-cols-12 px-4 py-2 text-xs text-slate-400 border-b border-white/10">
            <div className="col-span-4">Coin</div>
            <div className="col-span-2">Score</div>
            <div className="col-span-2">Trend</div>
            <div className="col-span-2">RSI</div>
            <div className="col-span-2 text-right">Action</div>
          </div>
          {rows.map((r) => {
            const p =
              r.base.changePercent24Hr ??
              r.base.price_change_percentage_24h ??
              0;
            return (
              <div
                key={r.base.id}
                className="grid grid-cols-12 px-4 py-3 border-b border-white/5 items-center"
              >
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <SmartImg
                    symbol={r.base.symbol}
                    className="h-6 w-6 rounded-full"
                  />
                  <div className="truncate">
                    <Link
                      to={`/coin/${r.base.id}`}
                      className="font-medium hover:underline"
                    >
                      {r.base.name}
                    </Link>
                    <div
                      className={`text-xs ${
                        p >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {pct(p)}
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="w-28 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400"
                      style={{ width: `${r.score}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {r.score}/100
                  </div>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  {r.trendUp ? (
                    <TrendingUp className="text-emerald-400" />
                  ) : (
                    <TrendingDown className="text-rose-400" />
                  )}
                  <span className="text-sm">
                    {r.trendUp ? "Up" : "Down"}
                  </span>
                </div>
                <div className="col-span-2 text-sm">
                  {Math.round(r.rsi ?? 0)}
                </div>
                <div className="col-span-2 text-right">
                  <button
                    className="btn-ghost text-xs inline-flex items-center gap-1"
                    onClick={() =>
                      setModalCoin({
                        id: r.base.id,
                        symbol: r.base.symbol,
                        name: r.base.name,
                      })
                    }
                  >
                    <BellPlus className="h-4 w-4" /> Alert
                  </button>
                  <Link
                    to={`/backtest/${r.base.id}`}
                    className="btn-ghost text-xs ml-2"
                  >
                    Backtest
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-[11px] text-slate-500">
        This is educational analytics only. Markets are risky. Do your own
        research.
      </div>

      <AlertModal
        open={!!modalCoin}
        onClose={() => setModalCoin(null)}
        coin={modalCoin || undefined}
      />
    </div>
  );
}