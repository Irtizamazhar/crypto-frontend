// src/pages/admin/Users.js
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

export default function Users() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const data = await AdminAPI.getUsers({ page, q });
      setRows(Array.isArray(data?.items) ? data.items : []);
      setMeta({
        page: data?.page || 1,
        pages: data?.pages || 1,
        total: data?.total || 0,
      });
    } catch (e) {
      setMsg(e.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page]);

  async function changeRole(u, role) {
    try { await AdminAPI.setRole(u.id, role); await load(); }
    catch (e) { setMsg(e.message || "Failed to update role."); }
  }
  async function changeStatus(u, status) {
    try { await AdminAPI.setStatus(u.id, status); await load(); }
    catch (e) { setMsg(e.message || "Failed to update status."); }
  }

  return (
    <Section
      title="Users"
      actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5" size={16} />
            <input
              className="pl-8 pr-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-sm"
              placeholder="Search users…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
          </div>
          <button onClick={load} className="text-sm px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10">
            Refresh
          </button>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="text-left px-3 py-2">User</th>
              <th className="text-left px-3 py-2">Email</th>
              <th className="text-right px-3 py-2">Taps</th>
              <th className="text-right px-3 py-2">PAPER</th>
              <th className="text-left px-3 py-2">Role</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-4 text-slate-400" colSpan={7}>Loading…</td></tr>
            ) : rows.length ? (
              rows.map((u) => (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="px-3 py-2">{u.name || "—"}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2 text-right">{Number(u.tapCount || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{Number(u.paper || 0).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10">
                        {String(u.role || "user").toLowerCase()}
                      </span>
                      <select
                        className="bg-slate-900 border border-white/10 rounded p-1"
                        value={String(u.role || "user").toLowerCase()}
                        onChange={(e) => changeRole(u, e.target.value)}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded border
                      ${u.status === "banned" ? "bg-rose-500/10 border-rose-400/30 text-rose-200" : "bg-emerald-500/10 border-emerald-400/30 text-emerald-200"}`}>
                      {u.status === "banned" ? "banned" : "active"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {u.status === "banned" ? (
                      <button onClick={() => changeStatus(u, "active")} className="text-xs px-2 py-1 rounded border border-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20">
                        Unban
                      </button>
                    ) : (
                      <button onClick={() => changeStatus(u, "banned")} className="text-xs px-2 py-1 rounded border border-rose-400/30 bg-rose-500/10 hover:bg-rose-500/20">
                        Ban
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td className="px-3 py-4 text-slate-400" colSpan={7}>No users</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-3 text-xs text-slate-400">
        <div>Total: {meta.total}</div>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-2 py-1 rounded bg-white/5 border border-white/10 disabled:opacity-40">
            Prev
          </button>
        <span>Page {meta.page} / {meta.pages}</span>
          <button disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 rounded bg-white/5 border border-white/10 disabled:opacity-40">
            Next
          </button>
        </div>
      </div>

      {msg && <div className="p-3 text-amber-300 text-xs border-t border-white/10">{msg}</div>}
    </Section>
  );
}
