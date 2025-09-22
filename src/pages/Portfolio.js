// src/pages/Portfolio.js
import React from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { fmt } from "../utils/format";

export default function Portfolio(){
  const { cash, positions, equity, history, reset } = usePortfolio();
  const pl = positions.reduce((a,p)=> a + (p.last - p.avg) * p.qty, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">Paper Trading</h1>
          <p className="text-slate-400 text-sm">Practice with virtual USDT. Learn before you risk real money.</p>
        </div>
        <button className="btn-ghost text-rose-300" onClick={reset}>Reset</button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="glass p-4 rounded-2xl"><div className="text-slate-400 text-sm">Cash</div><div className="text-2xl font-bold">{fmt(cash)}</div></div>
        <div className="glass p-4 rounded-2xl"><div className="text-slate-400 text-sm">Equity</div><div className="text-2xl font-bold">{fmt(equity)}</div></div>
        <div className="glass p-4 rounded-2xl"><div className="text-slate-400 text-sm">P/L (Unrealized)</div><div className={`text-2xl font-bold ${pl>=0?"text-emerald-400":"text-rose-400"}`}>{fmt(pl)}</div></div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-4 py-2 text-xs text-slate-400 border-b border-white/10">Positions</div>
        {positions.length === 0 ? (
          <div className="p-4 text-slate-400 text-sm">No positions yet. Use “Trade (Paper)” on a coin card or detail page.</div>
        ) : positions.map(p => (
          <div key={p.id} className="px-4 py-3 border-b border-white/5 text-sm flex items-center justify-between">
            <div>{p.name} <span className="text-slate-400">({p.symbol})</span></div>
            <div className="text-right">
              <div>Qty: {p.qty}</div>
              <div className="text-slate-400">Avg: {fmt(p.avg)} · Last: {fmt(p.last || p.avg)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-4 py-2 text-xs text-slate-400 border-b border-white/10">History</div>
        {history.length === 0 ? (
          <div className="p-4 text-slate-400 text-sm">No trades yet.</div>
        ) : history.map(h => (
          <div key={h.ts} className="px-4 py-3 border-b border-white/5 text-sm flex items-center justify-between">
            <div>{new Date(h.ts).toLocaleString()}</div>
            <div className={`font-medium ${h.side==="BUY"?"text-emerald-400":"text-rose-400"}`}>{h.side}</div>
            <div>{h.symbol}</div>
            <div>Qty {h.qty}</div>
            <div>Price {h.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
