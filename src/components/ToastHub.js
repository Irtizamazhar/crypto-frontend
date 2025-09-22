import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((t) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [{ id, ...t }, ...prev]);
    setTimeout(() => {
      setToasts((prev) => prev.filter(x => x.id !== id));
    }, 4000);
  }, []);
  const api = useMemo(() => ({ push }), [push]);
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed z-[100] top-16 right-4 space-y-2 w-[90vw] max-w-sm">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass p-3 rounded-xl shadow-lg"
            >
              <div className="font-semibold">{t.title}</div>
              {t.body && <div className="text-sm text-slate-300">{t.body}</div>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
