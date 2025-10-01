// src/pages/admin/TapLeaderboard.js
import React, { useEffect, useState } from "react";
import { AdminAPI } from "../../services/admin";
import { AdminPaperAPI } from "../../services/paper";

export default function TapLeaderboard() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [err, setErr] = useState("");

  // rain controls
  const [amountPerGrab, setAmountPerGrab] = useState(0.25);
  const [totalDrops, setTotalDrops] = useState(100);
  const [durationSec, setDurationSec] = useState(60);
  const [toast, setToast] = useState("");

  const load = async (p = 1) => {
    setErr("");
    try {
      const j = await AdminAPI.getUsers({ page: p, q });
      setItems(j.items || []);
      setPage(j.page || 1);
      setPages(j.pages || 1);
    } catch (e) {
      setErr(e?.message || "Failed to load");
    }
  };

  useEffect(() => { load(1); /* eslint-disable-next-line */ }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tap Leaderboard</h1>
          <p className="text-sm text-slate-400">See users’ tap counts and PAPER.</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search name/email..." className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"/>
          <button className="btn-primary px-3 py-2 rounded-lg" onClick={() => load(1)}>Search</button>
        </div>
      </div>

      {/* Prize rain panel */}
      <div className="glass p-4 rounded-xl border border-white/10 space-y-3">
        <div className="font-semibold">Prize Rain</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="text-sm">Amount/Grab (PAPER)
            <input type="number" step="0.01" value={amountPerGrab} onChange={(e)=>setAmountPerGrab(Number(e.target.value))} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg"/>
          </label>
          <label className="text-sm">Total Drops
            <input type="number" step="1" value={totalDrops} onChange={(e)=>setTotalDrops(Number(e.target.value))} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg"/>
          </label>
          <label className="text-sm">Duration (sec)
            <input type="number" step="1" value={durationSec} onChange={(e)=>setDurationSec(Number(e.target.value))} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg"/>
          </label>
          <div className="flex items-end gap-2">
            <button className="btn-primary px-3 py-2 rounded-lg" onClick={async ()=>{
              setToast(""); try { await AdminPaperAPI.startRain({ amountPerGrab, totalDrops, durationSec }); setToast("Started!"); }
              catch(e){ setToast(e?.message || "Failed"); }
            }}>Start</button>
            <button className="btn-ghost px-3 py-2 rounded-lg" onClick={async ()=>{
              setToast(""); try { await AdminPaperAPI.stopRain(); setToast("Stopped."); }
              catch(e){ setToast(e?.message || "Failed"); }
            }}>Stop</button>
          </div>
        </div>
        {toast && <div className="text-xs text-emerald-300">{toast}</div>}
      </div>

      {err && <div className="text-rose-300 text-sm">{err}</div>}

      <div className="glass p-4 rounded-xl border border-white/10 overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="py-2">User</th>
              <th className="py-2">Email</th>
              <th className="py-2 text-right">Taps</th>
              <th className="py-2 text-right">PAPER</th>
              <th className="py-2">Role</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map(u => (
              <tr key={u.id} className="border-t border-white/5">
                <td className="py-2">{u.name}</td>
                <td className="py-2">{u.email}</td>
                <td className="py-2 text-right">{Number(u.tapCount || 0).toLocaleString()}</td>
                <td className="py-2 text-right">{Number(u.paper || 0).toFixed(2)}</td>
                <td className="py-2">{u.role}</td>
                <td className="py-2">{u.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end gap-2 mt-3">
          <button className="btn-ghost px-3 py-1 rounded" disabled={page<=1} onClick={()=>{ const p=page-1; setPage(p); load(p); }}>Prev</button>
          <div className="text-xs text-slate-400">Page {page} / {pages}</div>
          <button className="btn-ghost px-3 py-1 rounded" disabled={page>=pages} onClick={()=>{ const p=page+1; setPage(p); load(p); }}>Next</button>
        </div>
      </div>
    </div>
  );
}
