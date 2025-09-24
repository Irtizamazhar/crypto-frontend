// src/pages/Alerts.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useAlerts } from "../context/AlertsContext";          // <-- fixed
import { fetchMarket } from "../services/api";                 // <-- fixed
import AlertModal from "../components/AlertModal";             // <-- fixed
import SmartImg from "../components/SmartImg";                 // <-- fixed
import {
  Bell, BellOff, Plus, Trash2, ToggleRight, ToggleLeft, Search,
  Filter, X, ChevronDown, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ---------------------------- small UI helpers ---------------------------- */
function TypeBadge({ type }) {
  const map = {
    price:  { label: "Price",   color: "bg-indigo-500/15 text-indigo-300" },
    pct24h: { label: "24h %",   color: "bg-emerald-500/15 text-emerald-300" },
    vol24h: { label: "24h Vol", color: "bg-amber-500/15 text-amber-300" },
  };
  const t = map[type] || map.price;
  return <span className={`text-[11px] px-2 py-0.5 rounded-full ${t.color}`}>{t.label}</span>;
}

function Pill({ children, onClear }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10">
      {children}
      {onClear && (
        <button className="p-0.5 opacity-70 hover:opacity-100" onClick={onClear} aria-label="Clear filter">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
}

function ConfirmPopover({ open, onClose, onConfirm, children, confirmText = "Delete", danger = true }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 2 }}
          className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl glass p-3 border border-white/10 shadow-lg"
        >
          <div className="text-sm text-slate-300">{children}</div>
          <div className="mt-3 flex justify-end gap-2">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button
              className={`${danger ? "text-rose-300" : ""} btn-ghost`}
              onClick={() => { onConfirm(); onClose(); }}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------- coin combobox ---------------------------- */
function CoinPicker({ coins, value, onChange }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return coins.slice(0, 50);
    return coins
      .filter(c =>
        (c.name || "").toLowerCase().includes(s) ||
        (c.symbol || "").toLowerCase().includes(s)
      )
      .slice(0, 50);
  }, [coins, q]);

  const pick = (c) => {
    onChange(c);
    setOpen(false);
    setQ("");
  };

  return (
    <div className="relative w-[260px]">
      <button
        type="button"
        className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2 justify-between"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2 truncate">
          {value ? <SmartImg symbol={value.symbol} alt="" className="h-5 w-5 rounded-full" /> : null}
          <span className="truncate">
            {value ? `${value.name} (${(value.symbol || "").toUpperCase()})` : "Select coin"}
          </span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 opacity-70" /> : <ChevronDown className="h-4 w-4 opacity-70" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            className="absolute z-40 mt-2 w-full rounded-xl glass p-2 border border-white/10 shadow-xl"
          >
            <div className="flex items-center gap-2 px-2 pb-2">
              <Search className="h-4 w-4 opacity-60" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search coin name or symbol…"
                className="bg-transparent outline-none text-sm w-full"
              />
            </div>
            <div className="max-h-64 overflow-auto">
              {filtered.length === 0 ? (
                <div className="text-xs text-slate-400 px-2 py-3">No matches.</div>
              ) : filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => pick(c)}
                  className="w-full px-3 py-2 rounded-lg hover:bg-white/5 text-left flex items-center gap-2"
                >
                  <SmartImg symbol={c.symbol} alt="" className="h-5 w-5 rounded-full" />
                  <div className="truncate">
                    <div className="text-sm font-medium truncate">
                      {c.name} <span className="text-slate-400">({(c.symbol || "").toUpperCase()})</span>
                    </div>
                    {c.price ? <div className="text-[11px] text-slate-400">${c.price}</div> : null}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------------------------------- page --------------------------------- */
export default function AlertsPage() {
  const {
    alerts, updateAlert, removeAlert, clearAll, muted, toggleMute, ensurePermission,
  } = useAlerts();

  const [coins, setCoins] = useState([]);
  const [loadingCoins, setLoadingCoins] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);

  // list controls
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [typeFilter, setTypeFilter] = useState(""); // "", "price", "pct24h", "vol24h"
  const [stateFilter, setStateFilter] = useState("all"); // all | enabled | disabled
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingCoins(true);
      try {
        const arr = await fetchMarket({ page: 1, per_page: 120 });
        if (!alive) return;
        setCoins(arr);
        setSelectedCoin(arr[0] ?? null);
      } finally {
        if (alive) setLoadingCoins(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // derived list
  const filteredAlerts = useMemo(() => {
    const base = [...alerts].sort((a, b) => {
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1; // enabled first
      return (b.createdAt ?? 0) - (a.createdAt ?? 0); // newest first
    });
    return base.filter(a => {
      if (typeFilter && a.type !== typeFilter) return false;
      if (stateFilter === "enabled" && !a.enabled) return false;
      if (stateFilter === "disabled" && a.enabled) return false;
      if (q) {
        const s = q.toLowerCase();
        const name = (a.name || "").toLowerCase();
        const sym = (a.symbol || "").toLowerCase();
        if (!name.includes(s) && !sym.includes(s)) return false;
      }
      return true;
    });
  }, [alerts, typeFilter, stateFilter, q]);

  const counts = useMemo(() => ({
    all: alerts.length,
    enabled: alerts.filter(a => a.enabled).length,
    disabled: alerts.filter(a => !a.enabled).length,
  }), [alerts]);

  // keyboard shortcut: N for new alert
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key || "").toLowerCase() === "n") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onNewAlert = useCallback(async () => {
    await ensurePermission();
    setOpen(true);
  }, [ensurePermission]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">Smart Alerts</h1>
          <p className="text-slate-400 text-sm">
            Create instant alerts for price, 24h % move, and 24h volume (USDT pairs). In-app toasts + optional browser notifications.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Pill>Press <span className="mx-1 rounded bg-white/10 px-1.5 py-0.5">N</span> to create</Pill>
            <Pill>Enabled first, then newest</Pill>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            className={`btn-ghost flex items-center gap-2 ${muted ? "text-slate-400" : ""}`}
            onClick={toggleMute}
            title={muted ? "Unmute notifications" : "Mute notifications"}
          >
            {muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {muted ? "Muted" : "Mute"}
          </button>

          <div className="relative">
            <button className="btn-ghost text-rose-300 flex items-center gap-2" onClick={() => setShowConfirmClear(v => !v)}>
              <Trash2 className="h-4 w-4" /> Clear all
            </button>
            <ConfirmPopover
              open={showConfirmClear}
              onClose={() => setShowConfirmClear(false)}
              onConfirm={clearAll}
            >
              This will permanently remove all alerts.
            </ConfirmPopover>
          </div>
        </div>
      </div>

      {/* quick create */}
      <div className="glass p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <CoinPicker coins={coins} value={selectedCoin} onChange={setSelectedCoin} />
          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={onNewAlert}
            disabled={!selectedCoin || loadingCoins}
          >
            <Plus className="h-4 w-4" /> New alert
          </button>
          {loadingCoins && (
            <span className="text-xs text-slate-400">Loading coin list…</span>
          )}
        </div>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <Filter className="h-4 w-4 opacity-60" />
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-transparent outline-none text-sm"
            title="State filter"
          >
            <option value="all">All ({counts.all})</option>
            <option value="enabled">Enabled ({counts.enabled})</option>
            <option value="disabled">Disabled ({counts.disabled})</option>
          </select>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-transparent outline-none text-sm"
            title="Type filter"
          >
            <option value="">Any type</option>
            <option value="price">Price</option>
            <option value="pct24h">24h %</option>
            <option value="vol24h">24h Volume</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 min-w-[220px]">
          <Search className="h-4 w-4 opacity-60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search alerts…"
            className="bg-transparent outline-none text-sm w-[180px]"
          />
          {q ? (
            <button className="opacity-70 hover:opacity-100" onClick={() => setQ("")} aria-label="Clear search">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {(typeFilter || q || stateFilter !== "all") && (
          <Pill onClear={() => { setTypeFilter(""); setQ(""); setStateFilter("all"); }}>
            Clear filters
          </Pill>
        )}
      </div>

      {/* list */}
      {filteredAlerts.length === 0 ? (
        <div className="glass p-8 rounded-xl text-slate-400 text-sm text-center">
          {alerts.length === 0
            ? "No alerts yet. Pick a coin and click New alert."
            : "No alerts match your filters/search."}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAlerts.map((a) => (
            <motion.div
              key={a.id}
              layout
              className="glass p-3 rounded-xl flex items-center gap-3 border border-white/10"
            >
              <SmartImg symbol={a.symbol} alt="" className="h-6 w-6 rounded-full" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {a.name} <span className="text-slate-400 text-xs">({(a.symbol || "").toUpperCase()})</span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <TypeBadge type={a.type} />
                  <span className="opacity-70">·</span>
                  <span className="tabular-nums">{a.op} {a.value}</span>
                  {a.createdAt ? (
                    <>
                      <span className="opacity-70">·</span>
                      <span className="opacity-70">created {new Date(a.createdAt).toLocaleString()}</span>
                    </>
                  ) : null}
                </div>
              </div>

              <button
                className="btn-ghost"
                onClick={() => updateAlert(a.id, { enabled: !a.enabled })}
                title={a.enabled ? "Disable" : "Enable"}
              >
                {a.enabled ? <ToggleRight className="h-5 w-5 text-emerald-400" /> : <ToggleLeft className="h-5 w-5 text-slate-400" />}
              </button>

              <RowDeleteButton onDelete={() => removeAlert(a.id)} />
            </motion.div>
          ))}
        </div>
      )}

      <AlertModal open={open} onClose={() => setOpen(false)} coin={selectedCoin} />
    </div>
  );
}

function RowDeleteButton({ onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button className="btn-ghost text-rose-300" onClick={() => setOpen(v => !v)} title="Delete">
        <Trash2 className="h-5 w-5" />
      </button>
      <ConfirmPopover
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
      >
        Delete this alert? This can’t be undone.
      </ConfirmPopover>
    </div>
  );
}
