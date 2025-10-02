import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlerts } from "../context/AlertsContext";
import { usePaywall } from "../context/PaywallContext";
import { fetchMarket } from "../services/api";
import SmartImg from "../components/SmartImg";
import {
  Bell, BellOff, Plus, Trash2, ToggleRight, ToggleLeft, Search,
  Filter, X, ChevronDown, ChevronUp, Settings, BarChart3,
  TrendingUp, DollarSign, AlertCircle, Zap, Target
} from "lucide-react";

/* ---------------------------- Enhanced UI Components ---------------------------- */
function TypeBadge({ type }) {
  const map = {
    price:  { label: "Price", icon: DollarSign, color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/15" },
    pct24h: { label: "24h %", icon: TrendingUp, color: "from-emerald-500 to-green-500", bg: "bg-emerald-500/15" },
    vol24h: { label: "24h Vol", icon: BarChart3, color: "from-amber-500 to-orange-500", bg: "bg-amber-500/15" },
  };
  const t = map[type] || map.price;
  const IconComponent = t.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${t.bg} text-white`}>
      <IconComponent className="h-3 w-3" />
      {t.label}
    </span>
  );
}

function FilterPill({ children, onClear, active = false }) {
  return (
    <span className={`inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl border transition-all ${
      active 
        ? "bg-blue-500/20 border-blue-500/30 text-blue-300" 
        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
    }`}>
      {children}
      {onClear && (
        <button 
          className="p-0.5 opacity-70 hover:opacity-100 transition-opacity rounded" 
          onClick={onClear}
          aria-label="Clear filter"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
}

function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmText = "Delete", danger = true }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center px-4"
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative glass rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full ${danger ? "bg-rose-500/20" : "bg-blue-500/20"}`}>
                <AlertCircle className={`h-5 w-5 ${danger ? "text-rose-400" : "text-blue-400"}`} />
              </div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            
            <p className="text-slate-300 text-sm mb-6">{description}</p>
            
            <div className="flex justify-end gap-3">
              <button 
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  danger 
                    ? "bg-rose-500 hover:bg-rose-600 text-white" 
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
                onClick={() => { onConfirm(); onClose(); }}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------- Enhanced Coin Picker ---------------------------- */
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
    <div className="relative w-[280px]">
      <button
        type="button"
        className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 justify-between hover:border-white/20 transition-all duration-200"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3 truncate">
          {value ? (
            <SmartImg symbol={value.symbol} alt="" className="h-6 w-6 rounded-full ring-2 ring-white/10" />
          ) : (
            <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
              <Search className="h-3 w-3 opacity-60" />
            </div>
          )}
          <span className="truncate text-sm font-medium">
            {value ? `${value.name} (${(value.symbol || "").toUpperCase()})` : "Select coin"}
          </span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 opacity-70" /> : <ChevronDown className="h-4 w-4 opacity-70" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute z-40 mt-2 w-full rounded-xl glass p-3 border border-white/10 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-white/5 rounded-lg">
              <Search className="h-4 w-4 opacity-60" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search coin name or symbol…"
                className="bg-transparent outline-none text-sm w-full placeholder-slate-400"
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-auto">
              {filtered.length === 0 ? (
                <div className="text-sm text-slate-400 px-3 py-4 text-center">No coins found</div>
              ) : filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => pick(c)}
                  className="w-full px-3 py-3 rounded-lg hover:bg-white/5 text-left flex items-center gap-3 transition-colors group"
                >
                  <SmartImg symbol={c.symbol} alt="" className="h-5 w-5 rounded-full ring-1 ring-white/10 group-hover:ring-white/20" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {c.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{(c.symbol || "").toUpperCase()}</span>
                      {Number.isFinite(c.priceUsdt) ? (
                        <span className="text-xs text-emerald-400">
                          ${(c.priceUsdt || 0).toFixed(c.priceUsdt >= 1 ? 2 : 6)}
                        </span>
                      ) : null}
                    </div>
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

/* ---------------------------- Enhanced Alert Modal ---------------------------- */
function EnhancedAlertModal({ open, onClose, coin }) {
  const { addAlert, ensurePermission } = useAlerts();
  const [type, setType] = useState("price");
  const [op, setOp] = useState(">");
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { 
    if (open) {
      ensurePermission();
      setIsSubmitting(false);
    }
  }, [open, ensurePermission]);
  
  useEffect(() => { 
    setValue(""); 
  }, [coin?.id]);

  const valid = useMemo(() => {
    const v = Number(value);
    return coin && Number.isFinite(v) && v > 0;
  }, [coin, value]);

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || !coin || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const v = Number(value);
      await addAlert({
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        type, op, value: v,
      });
      onClose?.();
    } catch (error) {
      console.error('Failed to create alert:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConditionDescription = () => {
    if (!value) return "Set your threshold value to see the alert condition";
    
    const typeLabels = {
      price: "Price",
      pct24h: "24h Change", 
      vol24h: "24h Volume"
    };
    
    const operatorLabels = {
      ">": "rises above",
      "<": "falls below"
    };
    
    const formattedValue = type === "pct24h" ? 
      `${value}%` : 
      `$${Number(value).toLocaleString()}`;
    
    return `Alert when ${typeLabels[type]} ${operatorLabels[op]} ${formattedValue}`;
  };

  const getTypeConfig = (alertType) => {
    const configs = {
      price: {
        icon: DollarSign,
        label: "Price",
        description: "Monitor price movements",
        gradient: "from-blue-500 to-cyan-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20"
      },
      pct24h: {
        icon: TrendingUp,
        label: "24h Change",
        description: "Track percentage changes",
        gradient: "from-emerald-500 to-green-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20"
      },
      vol24h: {
        icon: BarChart3,
        label: "24h Volume",
        description: "Monitor trading volume",
        gradient: "from-amber-500 to-orange-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20"
      }
    };
    return configs[alertType] || configs.price;
  };

  const currentTypeConfig = getTypeConfig(type);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="alert-modal-title"
          >
            <div className="relative p-7 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${currentTypeConfig.bg} border ${currentTypeConfig.border}`}>
                    <currentTypeConfig.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 id="alert-modal-title" className="text-2xl font-bold text-white">
                      Create Smart Alert
                    </h1>
                    {coin && (
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5">
                          <SmartImg 
                            symbol={coin.symbol} 
                            alt={coin.name} 
                            className="h-4 w-4 rounded-full" 
                          />
                          <span className="text-sm font-medium text-slate-200">
                            {coin.name}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {(coin.symbol || "").toUpperCase()}
                          </span>
                        </div>
                        {coin.priceUsdt && (
                          <span className="text-sm font-semibold text-emerald-400">
                            ${coin.priceUsdt.toLocaleString(undefined, { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: coin.priceUsdt < 1 ? 6 : 2 
                            })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 text-slate-400 hover:text-white hover:rotate-90"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={submit} className="p-7 space-y-6">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-300">
                      Alert Type
                    </label>
                    <div className="relative">
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full bg-slate-700/60 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20 transition-all duration-200 outline-none appearance-none cursor-pointer hover:border-white/25"
                      >
                        <option value="price">Price Alert</option>
                        <option value="pct24h">24h % Change</option>
                        <option value="vol24h">24h Volume</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-300">
                      Condition
                    </label>
                    <div className="relative">
                      <select
                        value={op}
                        onChange={(e) => setOp(e.target.value)}
                        className="w-full bg-slate-700/60 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20 transition-all duration-200 outline-none appearance-none cursor-pointer hover:border-white/25"
                      >
                        <option value=">">Rises Above</option>
                        <option value="<">Falls Below</option>
                      </select>
                      <Target className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${currentTypeConfig.border} ${currentTypeConfig.bg} backdrop-blur-sm`}>
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-white" />
                    <div>
                      <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">ALERT CONDITION</p>
                      <p className="text-sm font-medium text-white mt-1">
                        {getConditionDescription()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-300">
                  Threshold Value
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-semibold">
                      {type === "pct24h" ? "%" : "$"}
                    </span>
                  </div>
                  <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    inputMode="decimal"
                    type="number"
                    step="any"
                    placeholder={type === "pct24h" ? "0.00" : "0.00"}
                    className="w-full bg-slate-700/60 border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20 transition-all duration-200 outline-none group-hover:border-white/25"
                    required
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <div className="h-5 w-px bg-white/10 mr-3"></div>
                    <span className="text-xs font-medium text-slate-400 uppercase">
                      {type === "price" ? "USDT" : type === "pct24h" ? "Percent" : "Volume"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Current {type === "price" ? "price" : type === "pct24h" ? "24h change" : "24h volume"} tracking for {(coin?.symbol || "").toUpperCase()}
                </p>
              </div>

              <div className="bg-slate-700/40 border border-slate-600/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                    <AlertCircle className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-200">
                      Real-time Monitoring Active
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your alert will monitor live market data via WebSocket connection. 
                      Notifications will trigger instantly when conditions are met. 
                      Ensure browser notifications are enabled for desktop alerts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-7 py-3 text-sm font-semibold text-slate-400 hover:text-white transition-all duration-200 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!valid || isSubmitting}
                  className={`px-7 py-3 text-sm font-semibold text-white rounded-xl transition-all duration-200 shadow-lg ${
                    !valid || isSubmitting 
                      ? "bg-slate-600 cursor-not-allowed opacity-50" 
                      : `bg-gradient-to-r ${currentTypeConfig.gradient} hover:shadow-xl hover:scale-105`
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Create Alert
                    </div>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------- Main Alerts Page ---------------------------- */
export default function AlertsPage() {
  const {
    alerts, updateAlert, removeAlert, clearAll, muted, toggleMute, ensurePermission, /* NEW: */ limits,
  } = useAlerts();
  const { openPaywall } = usePaywall();

  const [coins, setCoins] = useState([]);
  const [loadingCoins, setLoadingCoins] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredAlerts = useMemo(() => {
    const toTs = (d) => {
      try { return d ? new Date(d).getTime() : 0; } catch { return 0; }
    };
    const base = [...alerts].sort((a, b) => {
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
      return toTs(b.createdAt) - toTs(a.createdAt);
    });
    return base.filter(a => {
      if (typeFilter && a.type !== typeFilter) return false;
      if (stateFilter === "enabled" && !a.enabled) return false;
      if (stateFilter === "disabled" && a.enabled) return false;
      if (searchQuery) {
        const s = searchQuery.toLowerCase();
        const name = (a.name || "").toLowerCase();
        const sym = (a.symbol || "").toLowerCase();
        if (!name.includes(s) && !sym.includes(s)) return false;
      }
      return true;
    });
  }, [alerts, typeFilter, stateFilter, searchQuery]);

  const counts = useMemo(() => ({
    all: alerts.length,
    enabled: alerts.filter(a => a.enabled).length,
    disabled: alerts.filter(a => !a.enabled).length,
  }), [alerts]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key || "").toLowerCase() === "n" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setModalOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onNewAlert = useCallback(async () => {
    await ensurePermission();
    setModalOpen(true);
  }, [ensurePermission]);

  const AlertRow = ({ alert }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    return (
      <>
        <motion.div
          layout
          className="glass p-4 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <SmartImg symbol={alert.symbol} alt="" className="h-10 w-10 rounded-full ring-2 ring-white/10" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-semibold text-white truncate">
                  {alert.name}
                </h4>
                <span className="text-sm text-slate-400 font-mono">
                  {(alert.symbol || "").toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <TypeBadge type={alert.type} />
                <span className="text-sm font-mono text-slate-300">
                  {alert.op} ${alert.value}
                </span>
                {alert.createdAt && (
                  <span className="text-xs text-slate-500">
                    Created {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className={`p-2 rounded-lg transition-all ${
                  alert.enabled 
                    ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" 
                    : "bg-slate-500/20 text-slate-400 hover:bg-slate-500/30"
                }`}
                onClick={() => updateAlert(alert.id, { enabled: !alert.enabled })}
                title={alert.enabled ? "Disable alert" : "Enable alert"}
              >
                {alert.enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
              </button>

              <button 
                className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete alert"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>

        <ConfirmDialog
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => removeAlert(alert.id)}
          title="Delete Alert"
          description="Are you sure you want to delete this alert? This action cannot be undone."
        />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8">
      <div className="mx-auto max-w-6xl px-4 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Smart Alerts
              </h1>
              <p className="text-slate-400 text-lg mt-2 max-w-2xl">
                Create real-time alerts for price movements, percentage changes, and trading volume. 
                Get instant notifications when your conditions are met.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <FilterPill active>
                <Bell className="h-4 w-4" />
                {counts.all} Total Alerts
              </FilterPill>
              <FilterPill>
                <TrendingUp className="h-4 w-4" />
                {counts.enabled} Active
              </FilterPill>
              <FilterPill>
                Press <kbd className="px-2 py-1 bg-white/10 rounded text-xs font-mono">N</kbd> to create
              </FilterPill>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-300">
                Plan: <b>{(limits?.plan || "free").toUpperCase()}</b> • Alerts: {limits?.used ?? 0}/{limits?.max ?? 2}
              </span>
              {limits?.plan !== "pro" && limits?.used >= (limits?.max ?? 2) && (
                <button onClick={openPaywall} className="px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  Unlock Pro
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                  muted 
                    ? "bg-slate-500/20 border-slate-500/30 text-slate-400" 
                    : "bg-amber-500/20 border-amber-500/30 text-amber-400"
                }`}
                onClick={toggleMute}
                title={muted ? "Unmute notifications" : "Mute notifications"}
              >
                {muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                {muted ? "Muted" : "Mute"}
              </button>

              <button 
                className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl hover:bg-rose-500/30 transition-all"
                onClick={() => setShowConfirmClear(true)}
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Quick Create Section */}
        <div className="glass p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-4 flex-wrap">
            <CoinPicker coins={coins} value={selectedCoin} onChange={setSelectedCoin} />
            <button
              className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onNewAlert}
              disabled={!selectedCoin || loadingCoins}
            >
              <Plus className="h-5 w-5" />
              Create New Alert
            </button>
            {loadingCoins && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Loading coin list...
              </div>
            )}
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <Filter className="h-4 w-4 opacity-60" />
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="bg-transparent outline-none text-sm font-medium text-white"
            >
              <option value="all">All Alerts ({counts.all})</option>
              <option value="enabled">Active Only ({counts.enabled})</option>
              <option value="disabled">Inactive Only ({counts.disabled})</option>
            </select>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <Settings className="h-4 w-4 opacity-60" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent outline-none text-sm font-medium text-white"
            >
              <option value="">All Types</option>
              <option value="price">Price Alerts</option>
              <option value="pct24h">% Change Alerts</option>
              <option value="vol24h">Volume Alerts</option>
            </select>
          </div>

          <div className="flex-1 min-w-[300px]">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <Search className="h-4 w-4 opacity-60" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alerts by name or symbol…"
                className="bg-transparent outline-none text-sm w-full placeholder-slate-400 text-white"
              />
              {searchQuery && (
                <button 
                  className="opacity-70 hover:opacity-100 transition-opacity p-1"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {(typeFilter || searchQuery || stateFilter !== "all") && (
            <FilterPill 
              active 
              onClear={() => { setTypeFilter(""); setSearchQuery(""); setStateFilter("all"); }}
            >
              Clear Filters
            </FilterPill>
          )}
        </div>

        {/* Alerts List */}
        {filteredAlerts.length === 0 ? (
          <div className="glass p-12 rounded-2xl border border-white/10 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <Bell className="h-12 w-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-semibold text-slate-300">
                {alerts.length === 0 ? "No Alerts Created" : "No Matching Alerts"}
              </h3>
              <p className="text-slate-500 text-sm">
                {alerts.length === 0 
                  ? "Get started by creating your first price alert. Select a coin above and click 'Create New Alert'."
                  : "Try adjusting your filters or search to see more alerts."
                }
              </p>
              {limits?.plan !== "pro" && (
                <button onClick={openPaywall} className="mt-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  Unlock Pro
                </button>
              )}
            </div>
          </div>
        ) : (
          <motion.div layout className="grid gap-3">
            {filteredAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </motion.div>
        )}

        {/* Modals */}
        <EnhancedAlertModal open={modalOpen} onClose={() => setModalOpen(false)} coin={selectedCoin} />
        
        <ConfirmDialog
          open={showConfirmClear}
          onClose={() => setShowConfirmClear(false)}
          onConfirm={clearAll}
          title="Clear All Alerts"
          description="This will permanently delete all your alerts. This action cannot be undone."
          confirmText="Clear All"
        />
      </div>
    </div>
  );
}
