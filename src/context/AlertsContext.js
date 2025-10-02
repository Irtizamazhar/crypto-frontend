// src/context/AlertsContext.jsx
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState
} from "react";
import { openMiniTickerStream } from "../services/api";
import { useAuth } from "./AuthContext";
import {
  listAlerts, createAlert, updateAlertApi, deleteAlert, clearAlerts,
  alertsLimits, consumeQuota as consumeQuotaApi,   // 👈 NEW import
} from "../services/alerts";
import { usePaywall } from "./PaywallContext";

const AlertsContext = createContext(null);

export function AlertsProvider({ children, onToast }) {
  const { token } = useAuth();
  const { openPaywall } = usePaywall() || {};

  const [alerts, setAlerts] = useState([]);
  const [limits, setLimits] = useState({ plan: "free", used: 0, max: 2 });
  const [muted, setMuted] = useState(false);
  const tickMapRef = useRef(new Map());

  // --- helpers ---------------------------------------------------------------

  const normalizeLimits = useCallback((lim, rows) => {
    if (!lim) {
      return { plan: "free", used: (rows || []).length || 0, max: 2 };
    }
    if (typeof lim.max === "number") return lim;
    const plan = lim.plan || "free";
    const used = Number(lim.used ?? 0);
    const max = plan === "pro" ? Infinity : Number(lim.limit ?? 2);
    return { plan, used, max };
  }, []);

  const fetchLimits = useCallback(async (rows) => {
    try {
      const lim = await alertsLimits();
      const norm = normalizeLimits(lim, rows);
      setLimits(norm);
      return norm;
    } catch {
      const fallback = normalizeLimits(null, rows);
      setLimits(fallback);
      return fallback;
    }
  }, [normalizeLimits]);

  const load = useCallback(async () => {
    if (!token) {
      setAlerts([]);
      setLimits({ plan: "free", used: 0, max: 2 });
      return;
    }
    const { alerts: rows = [] } = await listAlerts();
    setAlerts(rows);
    await fetchLimits(rows);
  }, [token, fetchLimits]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ref = () => load();
    window.addEventListener("alerts:refresh", ref);
    return () => window.removeEventListener("alerts:refresh", ref);
  }, [load]);

  // Request browser notifications if needed
  const ensurePermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    try { return (await Notification.requestPermission()) === "granted"; }
    catch { return false; }
  }, []);

  // Small toast + system notification helper
  const notify = useCallback((title, body) => {
    if (muted) return;
    onToast?.({ title, body });
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      try { new Notification(title, { body }); } catch {}
    }
  }, [muted, onToast]);

  // --- SECURE: consume free quota before creating an alert -------------------
  const consumeQuota = useCallback(async () => {
    if (!token) throw Object.assign(new Error("Not authenticated"), { status: 401 });
    // ✅ Use API helper (targets the API base and attaches token)
    return consumeQuotaApi();
  }, [token]);

  // --- CRUD ------------------------------------------------------------------

  const addAlert = useCallback(async (a) => {
    if (!token) return;

    // client-side guard
    if (limits.plan === "free" && Number.isFinite(limits.max) && limits.used >= limits.max) {
      onToast?.({ type: "warning", title: "Free limit reached", message: "Upgrade to create more alerts." });
      openPaywall?.();
      throw Object.assign(new Error("Free limit reached"), { status: 403, code: "FREE_QUOTA_EXHAUSTED" });
    }

    try {
      // authoritative server check (prevents deletion loophole)
      await consumeQuota();

      // create
      const { alert } = await createAlert(a);
      setAlerts(prev => [alert, ...prev]);

      // refresh limits
      await fetchLimits();
      return alert;
    } catch (e) {
      const status = e?.status || 500;
      const code = e?.code;

      if (status === 403 && code === "FREE_QUOTA_EXHAUSTED") {
        onToast?.({ type: "warning", title: "Free limit reached", message: "Upgrade to create more alerts." });
        openPaywall?.();
      } else if (status === 402) {
        openPaywall?.();
      } else {
        onToast?.({ type: "error", title: "Error", message: e?.message || "Failed to create alert" });
      }
      throw e;
    }
  }, [token, limits, consumeQuota, fetchLimits, onToast, openPaywall]);

  const updateAlert = useCallback(async (id, patch) => {
    if (!token) return;
    const { alert } = await updateAlertApi(id, patch);
    setAlerts(prev => prev.map(x => x.id === alert.id ? alert : x));
    return alert;
  }, [token]);

  const removeAlert = useCallback(async (id) => {
    if (!token) return;
    await deleteAlert(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
    await fetchLimits();
  }, [token, fetchLimits]);

  const clearAll = useCallback(async () => {
    if (!token) return;
    await clearAlerts();
    setAlerts([]);
    await fetchLimits([]);
  }, [token, fetchLimits]);

  // --- Evaluation / streaming -------------------------------------------------
  const evalAlert = useCallback((a, tick) => {
    if (!a.enabled || !tick) return false;
    const price = Number(tick.priceUsdt) || 0;
    const pct24 = Number(tick.changePercent24Hr) || 0;
    const vol24 = Number(tick.volumeQuote24h) || Number(tick.volumeUsd24Hr) || 0;
    switch (a.type) {
      case "price":  return a.op === ">" ? price > a.value : price < a.value;
      case "pct24h": return a.op === ">" ? pct24 > a.value : pct24 < a.value;
      case "vol24h": return a.op === ">" ? vol24 > a.value : vol24 < a.value;
      default:       return false;
    }
  }, []);

  const cooldownRef = useRef(new Map()); // id->ts
  const COOLDOWN_MS = 60 * 1000;

  const priceFmt = (p)=>{const v=Number(p)||0;return v>=1?v.toFixed(2):v.toFixed(6)};
  const pctFmt   = (p)=>`${(Number(p)||0).toFixed(2)}%`;
  const numFmt   = (n)=>{const v=Number(n)||0;if(v>=1e12)return(v/1e12).toFixed(2)+"T";if(v>=1e9)return(v/1e9).toFixed(2)+"B";if(v>=1e6)return(v/1e6).toFixed(2)+"M";if(v>=1e3)return(v/1e3).toFixed(2)+"K";return v.toFixed(2)};

  const onTick = useCallback((tick) => {
    tickMapRef.current.set(tick.id, tick);
    if (!alerts.length) return;

    const now = Date.now();
    for (const a of alerts) {
      if (a.coinId !== tick.id || !a.enabled) continue;
      const last = cooldownRef.current.get(a.id) || 0;
      if (now - last < COOLDOWN_MS) continue;
      if (evalAlert(a, tick)) {
        cooldownRef.current.set(a.id, now);
        const title = `Alert: ${a.symbol.toUpperCase()}`;
        const detail =
          a.type === "price"  ? `price ${a.op} ${a.value} (now ${priceFmt(tick.priceUsdt)})` :
          a.type === "pct24h" ? `24h % ${a.op} ${a.value} (now ${pctFmt(tick.changePercent24Hr)})` :
                                `24h vol ${a.op} ${numFmt(a.value)} (now ${numFmt(tick.volumeQuote24h || tick.volumeUsd24Hr)})`;
        notify(title, detail);
      }
    }
  }, [alerts, evalAlert, notify]);

  useEffect(() => {
    const stop = openMiniTickerStream(onTick);
    return () => stop && stop();
  }, [onTick]);

  // --- context value ----------------------------------------------------------
  const value = useMemo(() => ({
    alerts,
    limits, // { plan, used, max }
    addAlert, updateAlert, removeAlert, clearAll,
    muted, toggleMute: () => setMuted(v => !v),
    ensurePermission,
    latestFor: (coinId) => tickMapRef.current.get(coinId),
  }), [alerts, limits, addAlert, updateAlert, removeAlert, clearAll, muted, ensurePermission]);

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

export function useAlerts() { return useContext(AlertsContext); }
