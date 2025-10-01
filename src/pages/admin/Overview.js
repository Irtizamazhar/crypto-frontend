// src/pages/admin/Overview.js
import React, { useEffect, useState } from "react";
import { AdminAPI } from "../../services/admin";

function Kpi({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value ?? "—"}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function Overview() {
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const j = await AdminAPI.getOverview();
        setData(j || {});
      } catch (e) {
        setMsg(e.message || "Failed to load overview.");
      }
    })();
  }, []);

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Total Users" value={data?.users_total ?? "—"} sub="All registered accounts" />
        <Kpi label="Active (24h)" value={data?.users_active_24h ?? "—"} sub="Signed in last 24h" />
        <Kpi label="Payments (24h)" value={data?.payments_24h ?? "—"} sub="Completed" />
        <Kpi label="Earn Payouts (24h)" value={data?.paper_distributed_24h ?? "—"} sub="Paper awarded" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold">Notes</div>
        <p className="text-sm text-slate-400 mt-1">
          If backend metrics aren’t implemented you’ll see blanks here.
        </p>
      </div>

      {msg && <div className="p-3 text-xs text-amber-200 border border-white/10">{msg}</div>}
    </div>
  );
}
