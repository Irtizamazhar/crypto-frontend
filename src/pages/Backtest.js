// src/pages/Backtest.js
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchCoin, fetchKlines } from "../services/api";
import { SMA } from "../services/indicators";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

function runBacktest(closes, fast=20, slow=50) {
  const smaF = SMA(closes, fast);
  const smaS = SMA(closes, slow);
  let pos = false, entry = 0;
  let equity = 1; // normalized
  const curve = [];
  for (let i = 0; i < closes.length; i++) {
    const c = closes[i];
    const buy = smaF[i] != null && smaS[i] != null && smaF[i] > smaS[i] && !pos;
    const sell = smaF[i] != null && smaS[i] != null && smaF[i] < smaS[i] && pos;
    if (buy) { pos = true; entry = c; }
    if (sell) { pos = false; equity *= c / entry; }
    curve.push({ i, equity: pos ? equity * (c / entry) : equity });
  }
  if (pos) equity *= closes.at(-1) / entry;
  const peak = Math.max(...curve.map(p => p.equity));
  const maxDD = Math.min(...curve.map(p => p.equity / peak)) - 1; // negative
  const trades = []; // (simple count)
  for (let i=1;i<closes.length;i++){
    if (smaF[i-1] <= smaS[i-1] && smaF[i] > smaS[i]) trades.push("BUY");
  }
  return { equity, maxDD, trades: trades.length, curve };
}

export default function Backtest(){
  const { id } = useParams();
  const [coin, setCoin] = useState(null);
  const [curve, setCurve] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(()=>{
    (async()=>{
      const c = await fetchCoin(id);
      setCoin(c);
      const closes = await fetchKlines(`${c.symbol.toUpperCase()}USDT`, "4h", 600);
      const { equity, maxDD, trades, curve } = runBacktest(closes);
      setCurve(curve.map((p, idx)=>({ x: idx, y: p.equity })));
      setStats({ equity, maxDD, trades, bars: closes.length });
    })();
  }, [id]);

  if (!coin || !stats) return <div className="mx-auto max-w-7xl px-4 py-10 text-slate-400">Loading…</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <h1 className="text-2xl md:text-4xl font-black tracking-tight">Backtest: {coin.name} ({coin.symbol.toUpperCase()})</h1>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="glass p-4 rounded-2xl">
          <div className="text-slate-400 text-sm">Final Equity (normalized)</div>
          <div className="text-2xl font-bold">{stats.equity.toFixed(2)}×</div>
        </div>
        <div className="glass p-4 rounded-2xl">
          <div className="text-slate-400 text-sm">Max Drawdown</div>
          <div className="text-2xl font-bold">{(stats.maxDD*100).toFixed(1)}%</div>
        </div>
        <div className="glass p-4 rounded-2xl">
          <div className="text-slate-400 text-sm">Trades</div>
          <div className="text-2xl font-bold">{stats.trades}</div>
        </div>
      </div>

      <div className="glass p-3 rounded-2xl">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curve}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="y" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="text-[11px] text-slate-500">Past performance from a simple moving-average crossover. Educational only; not a prediction or financial advice.</div>
    </div>
  );
}
