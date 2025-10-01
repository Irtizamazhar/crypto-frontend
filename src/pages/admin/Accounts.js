// src/pages/admin/Accounts.js
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

function Section({ title, actions, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5">{children}</div>
    </section>
  );
}

export default function Accounts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const j = await AdminAPI.getAdminAccounts();
      setData(j || {});
    } catch (e) {
      setMsg(e.message || "Failed to load account data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Platform Balance" value={data?.platform_balance ? `${Number(data.platform_balance).toLocaleString()} USDT` : "—"} sub="Total platform holdings" />
        <Kpi label="Total Deposits" value={data?.total_deposits ? `${Number(data.total_deposits).toLocaleString()} USDT` : "—"} sub="All-time deposit volume" />
        <Kpi label="Total Withdrawals" value={data?.total_withdrawals ? `${Number(data.total_withdrawals).toLocaleString()} USDT` : "—"} sub="All-time withdrawal volume" />
        <Kpi label="Net Revenue" value={data?.net_revenue ? `${Number(data.net_revenue).toLocaleString()} USDT` : "—"} sub="Fees collected" />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Section
          title="Recent Platform Transactions"
          actions={<button onClick={load} className="text-sm px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10">Refresh</button>}
        >
          <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="text-slate-400 text-sm">Loading…</div>
            ) : data?.recent_transactions?.length ? (
              data.recent_transactions.map((tx, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <div>
                    <div className="text-sm">{tx.type}</div>
                    <div className="text-xs text-slate-400">{tx.ref_type}</div>
                  </div>
                  <div className={`text-sm ${tx.delta_usdt >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {tx.delta_usdt >= 0 ? '+' : ''}{Number(tx.delta_usdt).toLocaleString()} USDT
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-sm">No recent transactions</div>
            )}
          </div>
        </Section>

        <Section
          title="Wallet Statistics"
          actions={
            <button
              onClick={async () => {
                try { await AdminAPI.refreshHotWallet(); await load(); }
                catch (e) { setMsg(e.message || "Refresh failed"); }
              }}
              className="text-sm px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
            >
              Refresh Wallet
            </button>
          }
        >
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Hot Wallet Address:</span>
              <span className="font-mono text-xs">{data?.hot_wallet_address || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hot Wallet Balance:</span>
              <span>{data?.hot_wallet_balance ? `${Number(data.hot_wallet_balance).toLocaleString()} USDT` : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pending Withdrawals:</span>
              <span>{data?.pending_withdrawals_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pending Deposits:</span>
              <span>{data?.pending_deposits_count || 0}</span>
            </div>
          </div>
        </Section>
      </div>

      {msg && <div className="p-3 text-xs text-amber-200 border border-white/10">{msg}</div>}
    </div>
  );
}
