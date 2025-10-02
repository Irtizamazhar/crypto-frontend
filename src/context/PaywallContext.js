// src/context/PaywallContext.jsx
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Shield, Bell, Zap, X, Check } from "lucide-react";

const PaywallContext = createContext(null);

// Safe hook (won’t crash if provider is missing)
export function usePaywall() {
  return useContext(PaywallContext) || { openPaywall: () => {}, closePaywall: () => {} };
}

export function PaywallProvider({ children }) {
  const [open, setOpen] = useState(false);

  const openPaywall = useCallback(() => setOpen(true), []);
  const closePaywall = useCallback(() => setOpen(false), []);

  const value = useMemo(() => ({ openPaywall, closePaywall }), [openPaywall, closePaywall]);

  return (
    <PaywallContext.Provider value={value}>
      {children}
      <PaywallModal open={open} onClose={closePaywall} />
    </PaywallContext.Provider>
  );
}

/* ----------------------- The actual modal UI ----------------------- */
function PaywallModal({ open, onClose }) {
  const nav = useNavigate();

  const goPlans = () => {
    onClose();
    nav("/plans");
  };

  const buyPro = () => {
    onClose();
    // adjust amount/plan if you change pricing
    nav("/payments?plan=pro&amount=10");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] grid place-items-center px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-900/80 backdrop-blur"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          {/* Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/20">
                  <Shield className="h-5 w-5 text-indigo-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Unlock Pro Alerts</h2>
                  <p className="text-sm text-slate-400">Create unlimited alerts with priority processing.</p>
                </div>
              </div>
              <button
                className="p-2 rounded-xl hover:bg-white/10 text-slate-300"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 grid md:grid-cols-2 gap-6">
              {/* Free vs Pro comparison */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
                <h3 className="text-slate-200 font-semibold">Free</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-400" />
                    2 alerts total
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-400" />
                    Real-time WebSocket monitoring
                  </li>
                </ul>
                <div className="pt-4">
                  <div className="text-3xl font-extrabold text-white">$0</div>
                  <div className="text-slate-400 text-sm">forever</div>
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 to-blue-600/20 p-5 space-y-4">
                <h3 className="text-white font-semibold">Pro</h3>
                <ul className="space-y-2 text-sm text-slate-100">
                  <li className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Unlimited alerts
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Priority alert processing
                  </li>
                </ul>
                <div className="pt-4">
                  <div className="text-3xl font-extrabold text-white">$10</div>
                  <div className="text-slate-200 text-sm">one-time (demo)</div>
                </div>

                <div className="pt-2 grid gap-2">
                  <button
                    onClick={buyPro}
                    className="w-full px-4 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                  >
                    Continue • $10
                  </button>
                  <button
                    onClick={goPlans}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/15 transition-colors"
                  >
                    View all plans
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15"
              >
                Not now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
