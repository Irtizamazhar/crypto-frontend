import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlerts } from "../context/AlertsContext";

export default function AlertModal({ open, onClose, coin }) {
  const { addAlert, ensurePermission } = useAlerts();
  const [type, setType] = useState("price");   // price | pct24h | vol24h
  const [op, setOp]     = useState(">");
  const [value, setValue] = useState("");

  useEffect(() => { if (open) ensurePermission(); }, [open, ensurePermission]);

  const submit = (e) => {
    e.preventDefault();
    const v = Number(value);
    if (!coin || !Number.isFinite(v)) return;
    addAlert({
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      type, op, value: v
    });
    onClose?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            className="relative glass rounded-2xl p-5 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold mb-3">Create alert · {coin?.name} ({coin?.symbol?.toUpperCase()})</h3>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <select value={type} onChange={e=>setType(e.target.value)} className="col-span-2 bg-slate-900/80 border border-white/10 rounded-lg px-3 py-2">
                  <option value="price">Price (USDT)</option>
                  <option value="pct24h">24h % Change</option>
                  <option value="vol24h">24h Volume (USDT)</option>
                </select>
                <select value={op} onChange={e=>setOp(e.target.value)} className="bg-slate-900/80 border border-white/10 rounded-lg px-3 py-2">
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                </select>
              </div>
              <input
                value={value}
                onChange={e=>setValue(e.target.value)}
                type="number"
                step="any"
                placeholder="Value"
                className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-3 py-2"
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
              <p className="text-[11px] text-slate-400">
                Alerts are evaluated in real-time via Binance mini-ticker. Browser notifications require permission & active browser.
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
