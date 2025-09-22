// src/pages/admin/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AdminAPI } from "../../services/admin";
import { motion } from "framer-motion";
import { Search, Users, CreditCard, Coins, Settings, ShieldCheck, ArrowRight } from "lucide-react";

function Kpi({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value ?? "—"}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function TabButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm border transition
      ${active ? "bg-white/10 border-white/15" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
    >
      {icon}
      {label}
    </button>
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

/* ---------- Users Table ---------- */
function UsersTable() {
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
        total: data?.total || (Array.isArray(data?.items) ? data.items.length : 0),
      });
    } catch (e) {
      setMsg(e.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  async function changeRole(u, role) {
    try {
      await AdminAPI.setRole(u.id, role);
      await load();
    } catch (e) {
      setMsg(e.message || "Failed to update role.");
    }
  }
  async function changeStatus(u, status) {
    try {
      await AdminAPI.setStatus(u.id, status);
      await load();
    } catch (e) {
      setMsg(e.message || "Failed to update status.");
    }
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
              <th className="text-left px-3 py-2">Role</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-4 text-slate-400" colSpan={5}>Loading…</td></tr>
            ) : rows.length ? (
              rows.map((u) => (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="px-3 py-2">{u.name || "—"}</td>
                  <td className="px-3 py-2">{u.email}</td>
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
                      <button
                        onClick={() => changeStatus(u, "active")}
                        className="text-xs px-2 py-1 rounded border border-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20"
                      >
                        Unban
                      </button>
                    ) : (
                      <button
                        onClick={() => changeStatus(u, "banned")}
                        className="text-xs px-2 py-1 rounded border border-rose-400/30 bg-rose-500/10 hover:bg-rose-500/20"
                      >
                        Ban
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td className="px-3 py-4 text-slate-400" colSpan={5}>No users</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-3 text-xs text-slate-400">
        <div>Total: {meta.total}</div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-2 py-1 rounded bg-white/5 border border-white/10 disabled:opacity-40"
          >
            Prev
          </button>
          <span>Page {meta.page} / {meta.pages}</span>
          <button
            disabled={page >= meta.pages}
            onClick={() => setPage((p) => p + 1)}
            className="px-2 py-1 rounded bg-white/5 border border-white/10 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {msg && <div className="p-3 text-amber-300 text-xs border-t border-white/10">{msg}</div>}
    </Section>
  );
}

/* ---------- Payments Table ---------- */
function PaymentsTable() {
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
      const data = await AdminAPI.getPayments({ page, q });
      setRows(Array.isArray(data?.items) ? data.items : []);
      setMeta({
        page: data?.page || 1,
        pages: data?.pages || 1,
        total: data?.total || (Array.isArray(data?.items) ? data.items.length : 0),
      });
    } catch (e) {
      setMsg(e.message || "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  return (
    <Section
      title="Payments"
      actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5" size={16} />
            <input
              className="pl-8 pr-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-sm"
              placeholder="Search ref/user…"
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
              <th className="text-left px-3 py-2">Ref</th>
              <th className="text-left px-3 py-2">User</th>
              <th className="text-left px-3 py-2">Amount</th>
              <th className="text-left px-3 py-2">Currency</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-4 text-slate-400" colSpan={6}>Loading…</td></tr>
            ) : rows.length ? (
              rows.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-3 py-2">{p.reference || p.id}</td>
                  <td className="px-3 py-2">{p.user?.email || "—"}</td>
                  <td className="px-3 py-2">{Number(p.amount || 0).toLocaleString()}</td>
                  <td className="px-3 py-2">{(p.currency || "USD").toUpperCase()}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded border ${
                      p.status === "paid"
                        ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-200"
                        : p.status === "failed"
                        ? "bg-rose-500/10 border-rose-400/30 text-rose-200"
                        : "bg-amber-500/10 border-amber-400/30 text-amber-200"
                    }`}>
                      {String(p.status || "pending").toLowerCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td className="px-3 py-4 text-slate-400" colSpan={6}>No payments</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-3 text-xs text-slate-400">
        <div>Total: {meta.total}</div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-2 py-1 rounded bg-white/5 border border-white/10 disabled:opacity-40"
          >
            Prev
          </button>
          <span>Page {meta.page} / {meta.pages}</span>
          <button
            disabled={page >= meta.pages}
            onClick={() => setPage((p) => p + 1)}
            className="px-2 py-1 rounded bg-white/5 border border-white/10 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {msg && <div className="p-3 text-amber-300 text-xs border-t border-white/10">{msg}</div>}
    </Section>
  );
}

/* ---------- Earn Paper Settings ---------- */
function EarnPaperSettings() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    daily_reward_base: 1,    // base reward
    daily_reward_cap: 3,     // max per claim
    streak_step: 3,          // every 3 days reward++
    tap_reward: 1,           // TapTap per action
    referral_bonus: 5,       // optional
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const j = await AdminAPI.getPaperSettings();
        if (j) setForm({ ...form, ...j });
      } catch (e) {
        setMsg("Using defaults (load failed).");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, []);

  async function onSave() {
    setMsg("");
    try {
      await AdminAPI.savePaperSettings(form);
      setMsg("Saved.");
    } catch (e) {
      setMsg(e.message || "Save failed.");
    }
  }

  return (
    <Section
      title="Earn Paper — Settings"
      actions={
        <button onClick={onSave} className="text-sm px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10">
          Save
        </button>
      }
    >
      <div className="p-4 grid sm:grid-cols-2 gap-3">
        {loading ? (
          <div className="text-slate-400 text-sm">Loading…</div>
        ) : (
          <>
            <div>
              <label className="text-xs text-slate-400">Daily Reward (base)</label>
              <input
                type="number"
                className="mt-1 w-full px-3 py-2 rounded bg-slate-900 border border-white/10"
                value={form.daily_reward_base}
                onChange={(e) => setForm({ ...form, daily_reward_base: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Daily Reward Cap</label>
              <input
                type="number"
                className="mt-1 w-full px-3 py-2 rounded bg-slate-900 border border-white/10"
                value={form.daily_reward_cap}
                onChange={(e) => setForm({ ...form, daily_reward_cap: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Streak Step (days)</label>
              <input
                type="number"
                className="mt-1 w-full px-3 py-2 rounded bg-slate-900 border border-white/10"
                value={form.streak_step}
                onChange={(e) => setForm({ ...form, streak_step: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">TapTap Reward</label>
              <input
                type="number"
                className="mt-1 w-full px-3 py-2 rounded bg-slate-900 border border-white/10"
                value={form.tap_reward}
                onChange={(e) => setForm({ ...form, tap_reward: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Referral Bonus</label>
              <input
                type="number"
                className="mt-1 w-full px-3 py-2 rounded bg-slate-900 border border-white/10"
                value={form.referral_bonus}
                onChange={(e) => setForm({ ...form, referral_bonus: Number(e.target.value) })}
              />
            </div>
          </>
        )}
      </div>
      {msg && <div className="p-3 text-xs text-amber-200 border-t border-white/10">{msg}</div>}
    </Section>
  );
}

/* ---------- Overview ---------- */
function Overview() {
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
          This overview expects backend endpoints to aggregate metrics. If they don’t exist yet, you’ll see blanks.
        </p>
      </div>

      {msg && <div className="p-3 text-xs text-amber-200 border border-white/10">{msg}</div>}
    </div>
  );
}

/* ---------- Main Admin Dashboard ---------- */
export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-white/10 bg-slate-900/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 grid place-items-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="text-lg font-bold">Admin Dashboard</div>
              <div className="text-xs text-slate-400 -mt-0.5">CryptoSense • Manage users, payments & paper</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TabButton
              icon={<Users size={16} />}
              label="Overview"
              active={tab === "overview"}
              onClick={() => setTab("overview")}
            />
            <TabButton
              icon={<Users size={16} />}
              label="Users"
              active={tab === "users"}
              onClick={() => setTab("users")}
            />
            <TabButton
              icon={<CreditCard size={16} />}
              label="Payments"
              active={tab === "payments"}
              onClick={() => setTab("payments")}
            />
            <TabButton
              icon={<Coins size={16} />}
              label="Earn Paper"
              active={tab === "paper"}
              onClick={() => setTab("paper")}
            />
            <TabButton
              icon={<Settings size={16} />}
              label="Settings"
              active={tab === "settings"}
              onClick={() => setTab("settings")}
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {tab === "overview" && <Overview />}
        {tab === "users" && <UsersTable />}
        {tab === "payments" && <PaymentsTable />}
        {tab === "paper" && <EarnPaperSettings />}
        {tab === "settings" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold">General Settings</div>
            <p className="text-sm text-slate-400 mt-1">
              Add general admin settings here later (e.g., maintenance mode, feature flags).
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
