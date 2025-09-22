// src/pages/PaperTap.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";            // to know if user is logged in
import { PaperAPI } from "../services/paper";                // wallet/claim/earn endpoints

/** ─────────────────────────────────────────────────────────
 *  Storage Keys (local fallback)
 *  ───────────────────────────────────────────────────────── */
const K_POINTS   = "paper_points_v2";   // integer cents (100 = 1.00)
const K_LASTTAP  = "paper_last_v2";
const K_COMBO    = "paper_combo_v2";
const K_LAST_DAY = "paper_last_day_v2";
const K_TAPS     = "paper_taps_v2";

/** ─────────────────────────────────────────────────────────
 *  Config
 *  ───────────────────────────────────────────────────────── */
const EARN_PER_TAP_CENTS = 1;         // 0.01 PAPER per tap (client)
const COOLDOWN_MS        = 1000;
const COMBO_WINDOW_MS    = 3500;
const COMBO_MAX_X        = 3;
const DAILY_BONUS_CENTS  = 100;       // +1.00 PAPER (client display)
const OFFLINE_RATE_CPH   = 8;         // tiny offline accrual
const OFFLINE_CAP_CENTS  = 50;        // max 0.50 PAPER offline
const FLUSH_INTERVAL_MS  = 2500;      // batch sending taps to API

/** ─────────────────────────────────────────────────────────
 *  Utils
 *  ───────────────────────────────────────────────────────── */
const now = () => Date.now();
const readInt = (k, d = 0) => {
  const n = Number(localStorage.getItem(k));
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : d;
};
const writeInt = (k, v) => {
  try { localStorage.setItem(k, String(Math.max(0, Math.floor(v)))); } catch {}
};
const readTs = (k) => Number(localStorage.getItem(k)) || 0;
const writeTs = (k, ts) => { try { localStorage.setItem(k, String(ts)); } catch {} };
const formatPAPER = (cents) => (cents / 100).toFixed(2);

const levelFromCents = (cents) => Math.floor(cents / 1000); // client-side visual only
const levelProgress  = (cents) => (cents % 1000) / 1000;

// midnight compare for daily
const dayStr = (d = new Date()) => new Date(d).toDateString();

/** Tiny emoji confetti */
function useConfetti() {
  const [bursts, setBursts] = useState([]);
  const idRef = useRef(0);
  const burst = () => {
    const id = ++idRef.current;
    const items = Array.from({ length: 10 }).map((_, i) => ({
      id: `${id}-${i}`,
      x: (Math.random() - 0.5) * 160,
      y: -Math.random() * 60 - 40,
      r: (Math.random() - 0.5) * 60,
      s: 0.8 + Math.random() * 0.8,
      type: Math.random() < 0.5 ? "📄" : "🧻",
    }));
    setBursts((b) => [...b, ...items]);
    setTimeout(() => {
      setBursts((b) => b.filter((p) => !String(p.id).startsWith(String(id))));
    }, 900);
  };
  return { bursts, burst };
}

export default function PaperTap() {
  const { user } = useAuth(); // if undefined ⇒ not logged in (we’ll still work locally)
  const isAuthed = !!user;

  // Client state (cents for precision)
  const [points, setPoints]       = useState(() => readInt(K_POINTS, 0));
  const [cooldown, setCooldown]   = useState(0);
  const [comboX, setComboX]       = useState(() => readInt(K_COMBO, 1) || 1);
  const [canDaily, setCanDaily]   = useState(false);
  const [totalTaps, setTotalTaps] = useState(() => readInt(K_TAPS, 0));

  // Server state overlays (when logged in)
  const [srvLoading, setSrvLoading] = useState(false);
  const [srvError, setSrvError]     = useState("");
  const [tapCount, setTapCount]     = useState(0);
  const [level, setLevel]           = useState(0);       // server-computed level
  const [srvStreak, setSrvStreak]   = useState(0);
  const [lastClaimAt, setLastClaimAt] = useState(null);

  // Pending batch to send to API (integer cents)
  const pendingCentsRef = useRef(0);
  const flushTimerRef   = useRef(null);

  const lastTapRef   = useRef(readTs(K_LASTTAP));
  const cdRafRef     = useRef(null);
  const comboTimerRef= useRef(null);
  const { bursts, burst } = useConfetti();

  /** Load wallet from API on mount / when auth changes */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isAuthed) {
        // local fallback: daily available?
        const lastDay = localStorage.getItem(K_LAST_DAY) || "";
        setCanDaily(lastDay !== dayStr());
        return;
      }
      setSrvLoading(true);
      setSrvError("");
      try {
        const w = await PaperAPI.wallet(); // { paper, fiatUsd, streak, lastClaimAt, tapCount?, userLevel? }
        if (cancelled) return;
        setPoints((w.paper ?? 0) * 100);
        writeInt(K_POINTS, (w.paper ?? 0) * 100);

        setSrvStreak(w.streak ?? 0);
        setLastClaimAt(w.lastClaimAt || null);
        setCanDaily((w.lastClaimAt ? dayStr(w.lastClaimAt) : "") !== dayStr());

        if (typeof w.tapCount === "number") setTapCount(w.tapCount);
        if (typeof w.userLevel === "number") setLevel(w.userLevel);
      } catch (e) {
        if (cancelled) return;
        setSrvError(e?.message || "Failed to load wallet");
        // still show local
        const lastDay = localStorage.getItem(K_LAST_DAY) || "";
        setCanDaily(lastDay !== dayStr());
      } finally {
        if (!cancelled) setSrvLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthed]);

  /** Offline tiny accrual on mount (local only visual if not authed; if authed we include in first earn flush) */
  useEffect(() => {
    const last = lastTapRef.current || readTs(K_LASTTAP);
    if (last > 0) {
      const hrs = Math.max(0, (now() - last) / 3600000);
      const earned = Math.min(OFFLINE_CAP_CENTS, Math.floor(hrs * OFFLINE_RATE_CPH));
      if (earned > 0) {
        const next = points + earned;
        setPoints(next);
        writeInt(K_POINTS, next);
        // queue to API (as earn type "offline")
        pendingCentsRef.current += earned;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Cooldown loop */
  useEffect(() => {
    const tick = () => {
      const last = lastTapRef.current;
      if (!last) { setCooldown(0); return; }
      const elapsed = now() - last;
      const left = Math.max(0, COOLDOWN_MS - elapsed);
      const pct = Math.min(100, Math.round((left / COOLDOWN_MS) * 100));
      setCooldown(pct);
      cdRafRef.current = left > 0 ? requestAnimationFrame(tick) : null;
    };
    cdRafRef.current = requestAnimationFrame(tick);
    return () => { if (cdRafRef.current) cancelAnimationFrame(cdRafRef.current); };
  }, []);

  /** Batch flush pending earnings to API (when logged in) */
  useEffect(() => {
    if (!isAuthed) return;
    flushTimerRef.current = setInterval(async () => {
      const cents = pendingCentsRef.current;
      if (cents <= 0) return;

      // convert cents -> PAPER units, keep any fractional remainder in buffer
      const paper = cents / 100;
      pendingCentsRef.current = 0; // optimistic reset; on error we’ll restore

      try {
        await PaperAPI.earn({ type: "tap", amount: paper, note: "TapTap earn batch" });
        // server will compute tapCount/userLevel from tap controller; update tap count estimate locally
        setTapCount((t) => t + Math.round((paper * 100) / EARN_PER_TAP_CENTS)); // approximate taps sent
      } catch (e) {
        // if error, put it back so we try again later
        pendingCentsRef.current += cents;
        setSrvError(e?.message || "Sync failed — retrying…");
      }
    }, FLUSH_INTERVAL_MS);
    return () => clearInterval(flushTimerRef.current);
  }, [isAuthed]);

  // server level: if we have it, we use it; else use client visual level
  const visualLevel = useMemo(() => {
    if (isAuthed && typeof level === "number" && level >= 0) return level;
    return levelFromCents(points);
  }, [isAuthed, level, points]);

  const progress = useMemo(() => levelProgress(points), [points]);
  const earnNowCents = EARN_PER_TAP_CENTS * Math.min(COMBO_MAX_X, comboX);

  const doTap = () => {
    if (cooldown > 0) return;

    // combo
    const diff = now() - lastTapRef.current;
    const nextCombo = diff <= COMBO_WINDOW_MS
      ? Math.min(COMBO_MAX_X, (readInt(K_COMBO, comboX) || comboX) + 1)
      : 1;

    // credit local
    const add = EARN_PER_TAP_CENTS * nextCombo;
    const nextPoints = points + add;
    setPoints(nextPoints);
    writeInt(K_POINTS, nextPoints);

    // taps
    const nt = totalTaps + 1;
    setTotalTaps(nt);
    writeInt(K_TAPS, nt);

    // queue to server
    pendingCentsRef.current += add;

    // update combo + timers
    setComboX(nextCombo);
    writeInt(K_COMBO, nextCombo);

    lastTapRef.current = now();
    writeTs(K_LASTTAP, lastTapRef.current);

    if (cdRafRef.current) cancelAnimationFrame(cdRafRef.current);
    const loop = () => {
      const elapsed = now() - lastTapRef.current;
      const left = Math.max(0, COOLDOWN_MS - elapsed);
      const pct = Math.min(100, Math.round((left / COOLDOWN_MS) * 100));
      setCooldown(pct);
      cdRafRef.current = left > 0 ? requestAnimationFrame(loop) : null;
    };
    cdRafRef.current = requestAnimationFrame(loop);

    // combo decay after window
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => {
      setComboX(1);
      writeInt(K_COMBO, 1);
    }, COMBO_WINDOW_MS + 50);

    // confetti
    burst();
  };

  const claimDaily = async () => {
    // local fallback for guests
    if (!isAuthed) {
      const today = dayStr();
      if (localStorage.getItem(K_LAST_DAY) === today) return;
      const next = points + DAILY_BONUS_CENTS;
      setPoints(next);
      writeInt(K_POINTS, next);
      localStorage.setItem(K_LAST_DAY, today);
      setCanDaily(false);
      burst();
      return;
    }

    // server flow
    setSrvError("");
    try {
      const r = await PaperAPI.claimDaily(); // { paper, streak, reward, lastClaimAt }
      setPoints((r.paper ?? 0) * 100);
      writeInt(K_POINTS, (r.paper ?? 0) * 100);
      setSrvStreak(r.streak ?? 0);
      setLastClaimAt(r.lastClaimAt || new Date().toISOString());
      setCanDaily(false);
      burst();
    } catch (e) {
      setSrvError(e?.message || "Failed to claim daily");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      {/* banner for auth/sync */}
      {srvError && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-200 p-3 text-sm">
          {srvError}
        </div>
      )}
      {!isAuthed && (
        <div className="rounded-xl border border-white/10 bg-white/5 text-slate-300 p-3 text-sm">
          Not signed in — progress is stored locally. <span className="opacity-75">Log in to sync Paper to your account.</span>
        </div>
      )}
      {isAuthed && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200 p-3 text-sm">
          Synced to your account {srvLoading ? "…" : ""} {typeof tapCount === "number" ? `• ${tapCount.toLocaleString()} taps` : ""}
          {typeof visualLevel === "number" ? ` • Level ${visualLevel}` : ""}
          {typeof srvStreak === "number" ? ` • Streak ${srvStreak}` : ""}
        </div>
      )}

      {/* Title */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            PAPER{" "}
            <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
              Tap
            </span>
          </h1>
          <p className="text-slate-400 text-sm">
            Tap to earn <span className="text-slate-200 font-medium">0.01 PAPER</span> per tap.
            Keep a <span className="text-slate-200 font-medium">combo</span> for up to 3× rewards.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Level</div>
          <div className="text-2xl font-bold">{visualLevel}</div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="relative glass rounded-2xl p-6 overflow-hidden">
        {/* Level progress (client visual) */}
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-gradient-to-r from-sky-400 via-cyan-400 to-sky-400"
            style={{ width: `${Math.round(progress * 100)}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(progress * 100)}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4 items-center">
          {/* Balance */}
          <div className="order-2 sm:order-1 text-center sm:text-left">
            <div className="text-sm text-slate-400">Your PAPER</div>
            <div className="text-5xl font-extrabold tracking-tight">
              {formatPAPER(points)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {totalTaps.toLocaleString()} taps • combo up to {COMBO_MAX_X}×
            </div>
          </div>

          {/* Big Tap Button */}
          <div className="order-1 sm:order-2 relative grid place-items-center">
            <motion.button
              onClick={doTap}
              disabled={cooldown > 0}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow:
                  cooldown > 0
                    ? "0 0 0px rgba(56,189,248,0)"
                    : [
                        "0 0 16px rgba(56,189,248,.4)",
                        "0 0 28px rgba(56,189,248,.7)",
                        "0 0 16px rgba(56,189,248,.4)",
                      ],
              }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className={`relative rounded-full px-10 py-10 text-xl font-bold
                ${cooldown > 0 ? "bg-slate-800 text-slate-300" : "bg-gradient-to-br from-sky-500 to-cyan-500 text-white"} 
                border border-white/10`}
              title={cooldown > 0 ? "Cooling…" : "Tap to earn"}
            >
              {cooldown > 0 ? "Cooling…" : `+${formatPAPER(earnNowCents)} PAPER`}
              {/* cooldown ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
                <circle cx="50" cy="50" r="46" stroke="rgba(255,255,255,.15)" strokeWidth="4" fill="none" />
                <motion.circle
                  cx="50" cy="50" r="46" stroke="rgba(56,189,248,.9)" strokeWidth="4" fill="none"
                  strokeDasharray="289"
                  strokeDashoffset={cooldown ? (289 * (cooldown / 100)) : 289}
                  transition={{ type: "tween", duration: 0.15 }}
                />
              </svg>
            </motion.button>

            {/* Combo badge */}
            <AnimatePresence>
              {comboX > 1 && (
                <motion.div
                  key={`combo-${comboX}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute -bottom-3 text-xs px-2 py-1 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30"
                >
                  Combo x{comboX}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Daily + Info */}
          <div className="order-3 text-center sm:text-right space-y-2">
            <button
              onClick={claimDaily}
              disabled={!canDaily}
              className={`px-4 py-2 rounded-lg text-sm border
                ${canDaily
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                  : "bg-white/5 text-slate-400 border-white/10 cursor-not-allowed"}`}
              title={canDaily ? "Claim your daily +1.00" : "Come back tomorrow!"}
            >
              🎁 Daily +{formatPAPER(DAILY_BONUS_CENTS)}
            </button>
            <div className="text-[11px] text-slate-500">
              1s cooldown • tiny offline reward • levels every 10 PAPER (visual)
            </div>
          </div>
        </div>

        {/* Confetti layer */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {bursts.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
              animate={{ opacity: [1, 0.9, 0], x: p.x, y: p.y, rotate: p.r, scale: p.s }}
              transition={{ duration: 0.9, ease: "easeOut" }}  
              className="absolute left-1/2 top-1/2"
              style={{ translateX: "-50%", translateY: "-50%" }}
            >
              <div className="text-xl">{p.type}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="text-[11px] text-slate-500 text-center">
        {isAuthed ? "Synced to your account." : "LocalStorage only — clearing site data will remove points."}
      </div>
    </div>
  );
}
