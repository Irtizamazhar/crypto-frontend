// src/pages/admin/Deposits.js
import React, { useEffect, useState } from "react";
import { AdminAPI } from "../../services/admin";
import { Search } from "lucide-react";

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

export default function Deposits() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const data = await AdminAPI.getDeposits({ page, q, status: statusFilter });
      setRows(Array.isArray(data?.items) ? data.items : []);
      setMeta({ page: data?.page || 1, pages: data?.pages || 1, total: data?.total || 0 });
    } catch (e) {
      setMsg(e.message || "Failed to load deposits.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, statusFilter]);

  const statusColors = {
    pending: "bg-amber-500/10 border-amber-400/30 text-amber-200",
    confirmed: "bg-blue-500/10 border-blue-400/30 text-blue-200",
    completed: "bg-emerald-500/10 border-emerald-400/30 text-emerald-200",
    failed: "bg-rose-500/10 border-rose-400/30 text-rose-200"
  };

  return (
    <Section
      title="Deposits"
      actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5" size={16} />
            <input
              className="pl-8 pr-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-sm"
              placeholder="Search user/address/tx…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
          </div>
          <select className="px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={load} className="text-sm px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10">Refresh</button>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="text-left px-3 py-2">ID</th>
              <th className="text-left px-3 py-2">User</th>
              <th className="text-left px-3 py-2">From Address</th>
              <th className="text-left px-3 py-2">Amount</th>
              <th className="text-left px-3 py-2">Confirmations</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">TX ID</th>
              <th className="text-left px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-4 text-slate-400" colSpan={8}>Loading…</td></tr>
            ) : rows.length ? (
              rows.map((d) => (
                <tr key={d.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-mono text-xs">#{d.id}</td>
                  <td className="px-3 py-2">
                    <div className="text-sm">{d.user?.name || "—"}</div>
                    <div className="text-xs text-slate-400">{d.user?.email}</div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{d.from_address}</td>
                  <td className="px-3 py-2">{Number(d.amount_usdt || 0).toLocaleString()} USDT</td>
                  <td className="px-3 py-2">{d.confirmations}/{d.max_confirmations || 20}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded border ${statusColors[d.status] || statusColors.pending}`}>
                      {String(d.status || "pending").toLowerCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {d.txid ? (
                      <a href={`https://tronscan.org/#/transaction/${d.txid}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 truncate block max-w-[120px]" title={d.txid}>
                        {d.txid.slice(0, 8)}...{d.txid.slice(-8)}
                      </a>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">{d.createdAt ? new Date(d.createdAt).toLocaleString() : "—"}</td>
                </tr>
              ))
            ) : (
              <tr><td className="px-3 py-4 text-slate-400" colSpan={8}>No deposits</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-3 text-xs text-slate-400">
        <div>Total: {meta.total}</div>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-2 py-1 rounded bg-white/5 border border-white/10 disabled:opacity-40">Prev</button>
          <span>Page {meta.page} / {meta.pages}</span>
          <button disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 rounded bg-white/5 border border-white/10 disabled:opacity-40">Next</button>
        </div>
      </div>

      {msg && <div className="p-3 text-amber-300 text-xs border-t border-white/10">{msg}</div>}
    </Section>
  );
}
