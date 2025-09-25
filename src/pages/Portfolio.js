import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const PortfolioContext = createContext(null);
const LS_KEY = "paper_trade_v1";
const DEFAULT_CASH = 1000;

const computeEquity = (cash, positions) =>
  cash +
  positions.reduce((sum, p) => {
    const last = Number.isFinite(p.last) ? p.last : p.avg;
    return sum + last * p.qty;
  }, 0);

export function PortfolioProvider({ children }) {
  const [cash, setCash] = useState(DEFAULT_CASH);
  const [positions, setPositions] = useState([]);
  const [history, setHistory] = useState([]);

  // load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.cash != null) setCash(parsed.cash);
        if (Array.isArray(parsed.positions)) setPositions(parsed.positions);
        if (Array.isArray(parsed.history)) setHistory(parsed.history);
      }
    } catch {}
  }, []);

  // save
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ cash, positions, history }));
  }, [cash, positions, history]);

  const mark = useCallback((symbol, last) => {
    if (!symbol) return;
    setPositions((prev) =>
      prev.map((p) =>
        p.symbol.toUpperCase() === symbol.toUpperCase()
          ? { ...p, last: Number(last) }
          : p
      )
    );
  }, []);

  const buy = useCallback((asset, price, qty) => {
    price = Number(price);
    qty = Number(qty);
    if (!asset?.id || !Number.isFinite(price) || !Number.isFinite(qty) || qty <= 0) return;

    setCash((c) => c - price * qty);
    setPositions((prev) => {
      const i = prev.findIndex((p) => p.id === asset.id);
      if (i === -1) {
        return [
          ...prev,
          {
            id: asset.id,
            symbol: String(asset.symbol || "").toUpperCase(),
            name: asset.name || asset.id,
            qty,
            avg: price,
            last: price,
          },
        ];
      }
      const p = prev[i];
      const newQty = p.qty + qty;
      const newAvg = (p.avg * p.qty + price * qty) / newQty;
      const copy = prev.slice();
      copy[i] = { ...p, qty: newQty, avg: newAvg, last: price };
      return copy;
    });
    setHistory((h) => [
      ...h,
      { ts: Date.now(), side: "BUY", symbol: String(asset.symbol || "").toUpperCase(), qty, price },
    ]);
  }, []);

  const sell = useCallback((asset, price, qty) => {
    price = Number(price);
    qty = Number(qty);
    if (!asset?.id || !Number.isFinite(price) || !Number.isFinite(qty) || qty <= 0) return;

    setPositions((prev) => {
      const i = prev.findIndex((p) => p.id === asset.id);
      if (i === -1) return prev; // nothing to sell
      const p = prev[i];
      const newQty = Math.max(0, p.qty - qty);
      const copy = prev.slice();
      if (newQty === 0) copy.splice(i, 1);
      else copy[i] = { ...p, qty: newQty, last: price };
      return copy;
    });
    setCash((c) => c + price * qty);
    setHistory((h) => [
      ...h,
      { ts: Date.now(), side: "SELL", symbol: String(asset.symbol || "").toUpperCase(), qty, price },
    ]);
  }, []);

  const reset = useCallback(() => {
    setCash(DEFAULT_CASH);
    setPositions([]);
    setHistory([]);
    localStorage.removeItem(LS_KEY);
  }, []);

  const equity = useMemo(() => computeEquity(cash, positions), [cash, positions]);

  const value = useMemo(
    () => ({ cash, positions, equity, history, buy, sell, mark, reset }),
    [cash, positions, equity, history, buy, sell, mark, reset]
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

// Fallback that avoids crashes if provider is missing
const fallback = {
  cash: 0,
  positions: [],
  equity: 0,
  history: [],
  buy: () => {},
  sell: () => {},
  mark: () => {},
  reset: () => {},
  __missingProvider: true,
};

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (ctx == null) {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      console.warn("usePortfolio(): No <PortfolioProvider> found above in the tree.");
    }
    return fallback; // prevent destructure crash
  }
  return ctx;
}
