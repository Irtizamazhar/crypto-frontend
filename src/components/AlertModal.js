import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlerts } from "../context/AlertsContext";
import SmartImg from "./SmartImg";

export default function AlertModal({ open, onClose, coin }) {
  const { addAlert, ensurePermission } = useAlerts();
  const [type, setType]   = useState("price"); // price | pct24h | vol24h
  const [op, setOp]       = useState(">");
  const [value, setValue] = useState("");

  useEffect(() => { if (open) ensurePermission(); }, [open, ensurePermission]);
  useEffect(() => { setValue(""); }, [coin && coin.id]);

  const valid = useMemo(() => {
    const v = Number(value);
    return coin && Number.isFinite(v);
  }, [coin, value]);

  const submit = (e) => {
    e.preventDefault();
    if (!valid || !coin) return;
    const v = Number(value);
    addAlert({
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      type, op, value: v,
    });
    onClose && onClose();
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
            className="relative glass rounded-2xl p-5 w-full max-w-md border border-white/10"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3 mb-3">
              {coin ? <SmartImg symbol={coin.symbol} alt="" className="h-6 w-6 rounded-full" /> : null}
              <h3 className="text-lg font-semibold">
                Create alert{coin ? ` · ${coin.name} (${(coin.symbol || "").toUpperCase()})` : ""}
              </h3>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="col-span-2 bg-slate-900/80 border border-white/10 rounded-lg px-3 py-2"
                >
                  <option value="price">Price (USDT)</option>
                  <option value="pct24h">24h % Change</option>
                  <option value="vol24h">24h Volume (USDT)</option>
                </select>
                <select
                  value={op}
                  onChange={(e) => setOp(e.target.value)}
                  className="bg-slate-900/80 border border-white/10 rounded-lg px-3 py-2"
                >
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">Threshold</label>
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  inputMode="decimal"
                  type="number"
                  step="any"
                  placeholder="Value"
                  className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-3 py-2 mt-1"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  When {type === "price" ? "price" : type === "pct24h" ? "24h % change" : "24h volume"} is {op} your value, you’ll get an alert.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary" disabled={!valid}>Create</button>
              </div>

              <p className="text-[11px] text-slate-400">
                Alerts evaluate in real-time via Binance mini-ticker. Browser notifications need permission & an active browser tab.
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
