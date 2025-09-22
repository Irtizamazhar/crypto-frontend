import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { openMiniTickerStream } from "../services/api";

const LS_ALERTS = "smart_alerts_v1";
const LS_MUTED  = "smart_alerts_muted_v1";

const AlertsContext = createContext(null);

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function AlertsProvider({ children, onToast }) {
  const [alerts, setAlerts] = useState(() => load(LS_ALERTS, []));
  const [muted, setMuted]   = useState(() => !!load(LS_MUTED, false));
  const tickMapRef          = useRef(new Map()); // latest ticks by id

  // persist
  useEffect(() => save(LS_ALERTS, alerts), [alerts]);
  useEffect(() => save(LS_MUTED, muted), [muted]);

  // ask Notification permission lazily
  const ensurePermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    try {
      const p = await Notification.requestPermission();
      return p === "granted";
    } catch { return false; }
  }, []);

  const notify = useCallback(async (title, body) => {
    if (muted) return;
    onToast?.({ title, body });
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
  }, [muted, onToast]);

  const addAlert = useCallback((a) => {
    const id = `${a.coinId}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    setAlerts(prev => [{ ...a, id, enabled: true, createdAt: Date.now() }, ...prev]);
  }, []);

  const updateAlert = useCallback((id, patch) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setAlerts([]);
  }, []);

  const toggleMute = useCallback(() => setMuted(v => !v), []);

  // Evaluate alerts on incoming ticks
  const evalAlert = useCallback((a, tick) => {
    if (!a.enabled) return false;
    if (!tick) return false;
    // metrics derived from miniTicker
    const price = Number(tick.priceUsdt) || 0;
    const pct24 = Number(tick.changePercent24Hr) || 0;
    const vol24 = Number(tick.volumeQuote24h) || Number(tick.volumeUsd24Hr) || 0;

    switch (a.type) {
      case "price":
        return a.op === ">" ? price > a.value : price < a.value;
      case "pct24h":
        return a.op === ">" ? pct24 > a.value : pct24 < a.value;
      case "vol24h":
        return a.op === ">" ? vol24 > a.value : vol24 < a.value;
      default:
        return false;
    }
  }, []);

  // debounce so we don't spam multiple times per second
  const cooldownRef = useRef(new Map()); // id -> ts
  const COOLDOWN_MS = 60 * 1000;

  const onTick = useCallback((tick) => {
    tickMapRef.current.set(tick.id, tick);
    if (!alerts.length) return;

    const ts = Date.now();
    for (const a of alerts) {
      if (!a.enabled) continue;
      if (a.coinId !== tick.id) continue;

      const last = cooldownRef.current.get(a.id) || 0;
      if (ts - last < COOLDOWN_MS) continue;

      if (evalAlert(a, tick)) {
        cooldownRef.current.set(a.id, ts);
        notify(
          `Alert: ${a.symbol.toUpperCase()}`,
          a.type === "price"
            ? `Price ${a.op} ${a.value} USDT (now ${priceFmt(tick.priceUsdt)})`
            : a.type === "pct24h"
              ? `24h Change ${a.op} ${a.value}% (now ${pctFmt(tick.changePercent24Hr)})`
              : `24h Volume ${a.op} ${numFmt(a.value)} (now ${numFmt(tick.volumeQuote24h)})`
        );
      }
    }
  }, [alerts, evalAlert, notify]);

  useEffect(() => {
    const stop = openMiniTickerStream(onTick);
    return () => stop && stop();
  }, [onTick]);

  const value = useMemo(() => ({
    alerts, addAlert, updateAlert, removeAlert, clearAll,
    muted, toggleMute, ensurePermission,
    latestFor: (coinId) => tickMapRef.current.get(coinId)
  }), [alerts, addAlert, updateAlert, removeAlert, clearAll, muted, toggleMute, ensurePermission]);

  return (
    <AlertsContext.Provider value={value}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  return useContext(AlertsContext);
}

// small formatters (reuse your utils if you prefer)
function numFmt(n) {
  const v = Number(n) || 0;
  if (v >= 1e12) return (v/1e12).toFixed(2) + "T";
  if (v >= 1e9)  return (v/1e9).toFixed(2) + "B";
  if (v >= 1e6)  return (v/1e6).toFixed(2) + "M";
  if (v >= 1e3)  return (v/1e3).toFixed(2) + "K";
  return v.toFixed(2);
}
function pctFmt(p) {
  const v = Number(p) || 0;
  return `${v.toFixed(2)}%`;
}
function priceFmt(p) {
  const v = Number(p) || 0;
  return v >= 1 ? v.toFixed(2) : v.toFixed(6);
}
