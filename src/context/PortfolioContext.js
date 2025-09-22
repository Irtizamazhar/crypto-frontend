// src/context/PortfolioContext.js
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

const Ctx = createContext(null);
export function usePortfolio(){ return useContext(Ctx); }

const START_BAL = 10000; // virtual USDT

export function PortfolioProvider({ children }) {
  const [cash, setCash] = useState(() => Number(localStorage.getItem("pt_cash")) || START_BAL);
  const [positions, setPositions] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pt_positions") || "[]"); } catch { return []; }
  });
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pt_history") || "[]"); } catch { return []; }
  });

  const persist = () => {
    localStorage.setItem("pt_cash", String(cash));
    localStorage.setItem("pt_positions", JSON.stringify(positions));
    localStorage.setItem("pt_history", JSON.stringify(history));
  };

  const mark = useCallback((sym, price) => {
    setPositions(ps => ps.map(p => p.symbol === sym ? { ...p, last: price } : p));
  }, []);

  const buy = useCallback((coin, price, qty) => {
    if (!price || !qty || qty <= 0) return;
    const cost = price * qty;
    if (cost > cash) return;
    setCash(c => c - cost);
    setPositions(ps => {
      const i = ps.findIndex(p => p.id === coin.id);
      if (i >= 0) {
        const p = ps[i];
        const newQty = p.qty + qty;
        const newAvg = (p.avg * p.qty + price * qty) / newQty;
        const next = [...ps];
        next[i] = { ...p, qty: newQty, avg: newAvg, last: price };
        return next;
      }
      return [...ps, { id: coin.id, symbol: coin.symbol.toUpperCase(), name: coin.name, qty, avg: price, last: price }];
    });
    setHistory(h => [{ ts: Date.now(), side: "BUY", price, qty, id: coin.id, symbol: coin.symbol.toUpperCase() }, ...h]);
  }, [cash]);

  const sell = useCallback((coin, price, qty) => {
    if (!price || !qty || qty <= 0) return;
    setPositions(ps => {
      const i = ps.findIndex(p => p.id === coin.id);
      if (i < 0 || ps[i].qty < qty) return ps;
      const proceeds = price * qty;
      setCash(c => c + proceeds);
      const next = [...ps];
      if (ps[i].qty === qty) next.splice(i, 1);
      else next[i] = { ...ps[i], qty: ps[i].qty - qty, last: price };
      return next;
    });
    setHistory(h => [{ ts: Date.now(), side: "SELL", price, qty, id: coin.id, symbol: coin.symbol.toUpperCase() }, ...h]);
  }, []);

  React.useEffect(persist, [cash, positions, history]);

  const equity = useMemo(() => {
    const posVal = positions.reduce((a,p)=> a + (p.last || p.avg) * p.qty, 0);
    return cash + posVal;
  }, [cash, positions]);

  return (
    <Ctx.Provider value={{ cash, positions, history, equity, buy, sell, mark, reset: () => {
      setCash(START_BAL); setPositions([]); setHistory([]);
    }}}>
      {children}
    </Ctx.Provider>
  );
}
