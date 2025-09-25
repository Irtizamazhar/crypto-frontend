import React from "react";
import { fmt} from "../utils/format";

export default function ResolvedList({ hist }) {
  return (
    <section className="space-y-2 mt-6">
      <div className="text-sm font-semibold">Recent Resolved</div>
      <div className="glass rounded-xl overflow-hidden">
        <div className="grid grid-cols-6 px-3 py-2 text-xs text-slate-400 border-b border-white/10">
          <div>Side</div>
          <div>Amount</div>
          <div>Entry</div>
          <div>Exit</div>
          <div>Result</div>
          <div>Payout</div>
        </div>
        {hist.map((p) => (
          <div key={p.id} className="grid grid-cols-6 px-3 py-2 border-b border-white/5 text-sm">
            <div className={p.side === "UP" ? "text-emerald-300" : "text-rose-300"}>{p.side}</div>
            <div>${fmt(p.amount)}</div>
            <div>${fmt(p.entry)}</div>
            <div>${fmt(p.exit)}</div>
            <div className={p.result === "WIN" ? "text-emerald-400" : "text-rose-400"}>{p.result}</div>
            <div>${fmt(p.payout || 0)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
