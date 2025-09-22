import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const Ctx = createContext();
export const useWatchlist = () => useContext(Ctx);

export function WatchlistProvider({ children }) {
  const [ids, setIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("watchlist") || "[]"); } catch { return []; }
  });
  useEffect(() => localStorage.setItem("watchlist", JSON.stringify(ids)), [ids]);

  const value = useMemo(() => ({
    ids,
    toggle: (id) => setIds(x => x.includes(id) ? x.filter(i => i !== id) : [...x, id]),
    remove: (id) => setIds(x => x.filter(i => i !== id)),
    clear: () => setIds([])
  }), [ids]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
