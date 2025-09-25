import React from "react";
import { fmt, } from "../utils/format";
import { Clock } from "lucide-react";

const timeLeft = (endTs) => Math.max(0, endTs - Date.now());
const prettyLeft = (ms) => {
  const s = Math.floor(ms / 1000),
    h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

export default function OpenPositions({ price, open }) {
  return (
    <section className="space-y-2 mt-6">
      <div className="text-sm font-semibold">Your Open Positions</div>
      {open.length === 0 ? (
        <div className="glass p-4 text-sm text-slate-400">No open positions for this coin.</div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="grid grid-cols-6 px-3 py-2 text-xs text-slate-400 border-b border-white/10">
            <div>Side</div>
            <div>Amount</div>
            <div>Entry</div>
            <div>Current</div>
            <div className="flex items-center gap-1"><Clock size={12} />Time Left</div>
            <div>Would Pay</div>
          </div>
          {open.map((p) => {
            const left = timeLeft(p.resolveTs);
            const wouldWin = (p.side === "UP" && price > p.entry) || (p.side === "DOWN" && price < p.entry);
            return (
              <div key={p.id} className="grid grid-cols-6 px-3 py-2 border-b border-white/5 text-sm items-center">
                <div className={p.side === "UP" ? "text-emerald-300" : "text-rose-300"}>{p.side}</div>
                <div>${fmt(p.amount)}</div>
                <div>${fmt(p.entry)}</div>
                <div>${fmt(price)}</div>
                <div>{prettyLeft(left)}</div>
                <div className={wouldWin ? "text-emerald-400" : "text-slate-400"}>{wouldWin ? `$${fmt(p.amount * 2)}` : "$0"}</div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
