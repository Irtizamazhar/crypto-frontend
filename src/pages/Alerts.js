import React, { useEffect, useMemo, useState } from "react";
import { useAlerts } from "../context/AlertsContext";
import { fetchMarket } from "../services/api";
import AlertModal from "../components/AlertModal";
import SmartImg from "../components/SmartImg";
import { Bell, BellOff, Plus, Trash2, ToggleRight, ToggleLeft } from "lucide-react";

function TypeBadge({ type }) {
  const map = {
    price:  { label: "Price",   color: "bg-indigo-500/15 text-indigo-300" },
    pct24h: { label: "24h %",   color: "bg-emerald-500/15 text-emerald-300" },
    vol24h: { label: "24h Vol", color: "bg-amber-500/15 text-amber-300" },
  };
  const t = map[type] || map.price;
  return <span className={`text-[11px] px-2 py-0.5 rounded-full ${t.color}`}>{t.label}</span>;
}

export default function AlertsPage() {
  const { alerts, updateAlert, removeAlert, clearAll, muted, toggleMute, ensurePermission } = useAlerts();
  const [coins, setCoins] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const arr = await fetchMarket({ page: 1, per_page: 80 });
      if (!alive) return;
      setCoins(arr);
      setSelectedCoin(arr[0] ?? null);
    })();
    return () => { alive = false; };
  }, []);

  const byCreated = useMemo(() => [...alerts].sort((a,b) => b.createdAt - a.createdAt), [alerts]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">Smart Alerts</h1>
          <p className="text-slate-400 text-sm">
            Create instant alerts for price, 24h % move, and 24h volume (USDT pairs). In-app toasts + optional browser notifications.
          </p>
        </div>
        <button
          className={`btn-ghost flex items-center gap-2 ${muted ? "text-slate-400" : ""}`}
          onClick={toggleMute}
          title={muted ? "Unmute notifications" : "Mute notifications"}
        >
          {muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          {muted ? "Muted" : "Mute"}
        </button>
      </div>

      {/* Quick create */}
      <div className="glass p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="bg-slate-900/80 border border-white/10 rounded-lg px-3 py-2"
            value={selectedCoin?.id || ""}
            onChange={(e) => setSelectedCoin(coins.find(c => c.id === e.target.value))}
          >
            {coins.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.symbol?.toUpperCase()})</option>
            ))}
          </select>
          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={async () => { await ensurePermission(); setOpen(true); }}
            disabled={!selectedCoin}
          >
            <Plus className="h-4 w-4" /> New alert
          </button>
          <button className="btn-ghost text-rose-300" onClick={clearAll}>
            <Trash2 className="h-4 w-4" /> Clear all
          </button>
        </div>
      </div>

      {/* List */}
      {byCreated.length === 0 ? (
        <div className="glass p-6 rounded-xl text-slate-400 text-sm">
          No alerts yet. Create your first alert above.
        </div>
      ) : (
        <div className="space-y-2">
          {byCreated.map(a => (
            <div key={a.id} className="glass p-3 rounded-xl flex items-center gap-3">
              <SmartImg symbol={a.symbol} alt="" className="h-6 w-6 rounded-full" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{a.name} <span className="text-slate-400 text-xs">({a.symbol.toUpperCase()})</span></div>
                <div className="text-xs text-slate-400">
                  <TypeBadge type={a.type} /> · {a.op} {a.value}
                </div>
              </div>
              <button
                className="btn-ghost"
                onClick={() => updateAlert(a.id, { enabled: !a.enabled })}
                title={a.enabled ? "Disable" : "Enable"}
              >
                {a.enabled ? <ToggleRight className="h-5 w-5 text-emerald-400" /> : <ToggleLeft className="h-5 w-5 text-slate-400" />}
              </button>
              <button className="btn-ghost text-rose-300" onClick={() => removeAlert(a.id)} title="Delete">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AlertModal open={open} onClose={() => setOpen(false)} coin={selectedCoin} />
    </div>
  );
}
