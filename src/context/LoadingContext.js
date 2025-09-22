import React, { createContext, useContext, useMemo, useState } from "react";

const LoadingCtx = createContext(null);

export function LoadingProvider({ children }) {
  const [count, setCount] = useState(0);

  const api = useMemo(() => ({
    start: () => setCount((c) => c + 1),
    stop: () => setCount((c) => Math.max(0, c - 1)),
    isLoading: () => count > 0,
    _count: count,
  }), [count]);

  return <LoadingCtx.Provider value={api}>{children}</LoadingCtx.Provider>;
}

export function useLoading() {
  const ctx = useContext(LoadingCtx);
  if (!ctx) throw new Error("useLoading must be used inside <LoadingProvider>");
  return ctx;
}
