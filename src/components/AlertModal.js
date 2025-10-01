import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlerts } from "../context/AlertsContext";
import SmartImg from "./SmartImg";
import { X, Bell, DollarSign, TrendingUp, BarChart3, ChevronDown } from "lucide-react";

export default function AlertModal({ open, onClose, coin }) {
  const { addAlert, ensurePermission } = useAlerts();
  const [type, setType] = useState("price"); // price | pct24h | vol24h
  const [op, setOp] = useState(">");
  const [value, setValue] = useState("");

  useEffect(() => { 
    if (open) ensurePermission(); 
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
    if (!valid || !coin) return;
    const v = Number(value);
    await addAlert({
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      type, op, value: v,
    });
    onClose?.();
  };

  const getConditionDescription = () => {
    if (!value) return "Enter threshold value to preview condition";
    
    const typeLabels = {
      price: "Price reaches",
      pct24h: "24h % Change reaches", 
      vol24h: "24h Volume reaches"
    };
    
    const operatorLabels = {
      ">": "above",
      "<": "below"
    };
    
    return `${typeLabels[type]} ${operatorLabels[op]} $${Number(value).toLocaleString()}`;
  };

  const getTypeIcon = (alertType) => {
    const icons = {
      price: DollarSign,
      pct24h: TrendingUp,
      vol24h: BarChart3
    };
    return icons[alertType] || DollarSign;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="alert-modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Bell className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 id="alert-modal-title" className="text-lg font-semibold text-white">
                    Create Alert
                  </h3>
                  {coin && (
                    <div className="flex items-center gap-2 mt-1">
                      <SmartImg 
                        symbol={coin.symbol} 
                        alt={coin.name} 
                        className="h-4 w-4 rounded-full" 
                      />
                      <span className="text-sm text-slate-300">
                        {coin.name} ({(coin.symbol || "").toUpperCase()})
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={submit} className="p-6 space-y-6">
              {/* Alert Type and Condition */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {/* Alert Type */}
                  <div className="col-span-2 relative">
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      ALERT TYPE
                    </label>
                    <div className="relative">
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none cursor-pointer"
                      >
                        <option value="price">Price (USDT)</option>
                        <option value="pct24h">24h % Change</option>
                        <option value="vol24h">24h Volume (USDT)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Operator */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      CONDITION
                    </label>
                    <div className="relative">
                      <select
                        value={op}
                        onChange={(e) => setOp(e.target.value)}
                        className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none cursor-pointer"
                      >
                        <option value=">">&gt; Above</option>
                        <option value="<">&lt; Below</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Condition Preview */}
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <p className="text-xs text-slate-400 font-medium">CONDITION PREVIEW</p>
                  <p className="text-sm text-white font-medium mt-1">
                    {getConditionDescription()}
                  </p>
                </div>
              </div>

              {/* Threshold Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Threshold Value
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-medium">$</span>
                  </div>
                  <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    inputMode="decimal"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    className="w-full bg-slate-700/50 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Enter the threshold value in USDT. You'll be notified when the condition is met.
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-blue-500/20 rounded-lg mt-0.5">
                    <Bell className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-300 mb-1">
                      Real-time Monitoring
                    </p>
                    <p className="text-xs text-blue-300/80">
                      Alerts evaluate in real-time via Binance WebSocket. Browser notifications require permission and an active tab.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!valid}
                  className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/25"
                >
                  Create Alert
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}