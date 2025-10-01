// src/pages/PaperTap.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { PaperAPI } from "../services/paper";

// ✅ CRA/public image reference (no imports from public/)
const COIN_IMG = `${process.env.PUBLIC_URL || ""}/images/coin-logo.png`;

const K_POINTS = "paper_points_v2";
const K_LASTTAP = "paper_last_v2";
const K_COMBO = "paper_combo_v2";
const K_LAST_DAY = "paper_last_day_v2";
const K_TAPS = "paper_taps_v2";

const EARN_PER_TAP_CENTS = 1; // 0.01 PAPER
const COOLDOWN_MS = 1000;
const COMBO_WINDOW_MS = 3500;
const COMBO_MAX_X = 3;
const DAILY_BONUS_CENTS = 100;
const OFFLINE_RATE_CPH = 8;
const OFFLINE_CAP_CENTS = 50;
const FLUSH_INTERVAL_MS = 2500;
const RAIN_POLL_MS = 2500;

const now = () => Date.now();
const readInt = (k, d = 0) => {
  const n = Number(localStorage.getItem(k));
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : d;
};
const writeInt = (k, v) => { try { localStorage.setItem(k, String(Math.max(0, Math.floor(v)))); } catch {} };
const readTs = (k) => Number(localStorage.getItem(k)) || 0;
const writeTs = (k, ts) => { try { localStorage.setItem(k, String(ts)); } catch {} };
const formatPAPER = (cents) => (cents / 100).toFixed(2);
const dayStr = (d = new Date()) => new Date(d).toDateString();

function useConfetti() {
  const [bursts, setBursts] = useState([]);
  const idRef = useRef(0);
  const burst = (emoji = "🪙") => {
    const id = ++idRef.current;
    const items = Array.from({ length: 12 }).map((_, i) => ({
      id: `${id}-${i}`,
      x: (Math.random() - 0.5) * 160,
      y: -Math.random() * 60 - 40,
      r: (Math.random() - 0.5) * 60,
      s: 0.8 + Math.random() * 0.8,
      type: emoji,
    }));
    setBursts((b) => [...b, ...items]);
    setTimeout(() => setBursts((b) => b.filter((p) => !String(p.id).startsWith(String(id)))), 900);
  };
  return { bursts, burst };
}

export default function PaperTap() {
  const { user } = useAuth();
  const isAuthed = !!user;

  const [points, setPoints] = useState(() => readInt(K_POINTS, 0));
  const [cooldown, setCooldown] = useState(0);
  const [comboX, setComboX] = useState(() => readInt(K_COMBO, 1) || 1);
  const [canDaily, setCanDaily] = useState(false);
  const [totalTaps, setTotalTaps] = useState(() => readInt(K_TAPS, 0));

  const [srvLoading, setSrvLoading] = useState(false);
  const [srvError, setSrvError] = useState("");
  const [tapCount, setTapCount] = useState(0);
  const [level, setLevel] = useState(0);
  const [srvStreak, setSrvStreak] = useState(0);
  const [lastClaimAt, setLastClaimAt] = useState(null);

  // Prize Rain
  const [rain, setRain] = useState({ active: false });
  const [rainError, setRainError] = useState("");

  const pendingCentsRef = useRef(0);
  const pendingTapCountRef = useRef(0);
  const flushTimerRef = useRef(null);

  const lastTapRef = useRef(readTs(K_LASTTAP));
  const cdRafRef = useRef(null);
  const comboTimerRef = useRef(null);
  const { bursts, burst } = useConfetti();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isAuthed) {
        const lastDay = localStorage.getItem(K_LAST_DAY) || "";
        setCanDaily(lastDay !== dayStr());
        return;
      }
      setSrvLoading(true);
      setSrvError("");
      try {
        const w = await PaperAPI.wallet();
        if (cancelled) return;
        const paperCents = Math.round(Number(w.paper || 0) * 100);
        setPoints(paperCents);
        writeInt(K_POINTS, paperCents);
        setSrvStreak(w.streak ?? 0);
        setLastClaimAt(w.lastClaimAt || null);
        setCanDaily((w.lastClaimAt ? dayStr(w.lastClaimAt) : "") !== dayStr());
        setTapCount(Number(w.tapCount || 0));
        setLevel(Number(w.userLevel || 0));
      } catch (e) {
        if (cancelled) return;
        setSrvError(e?.message || "Failed to load wallet");
        const lastDay = localStorage.getItem(K_LAST_DAY) || "";
        setCanDaily(lastDay !== dayStr());
      } finally {
        if (!cancelled) setSrvLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthed]);

  // Offline tiny accrual
  useEffect(() => {
    const last = lastTapRef.current || readTs(K_LASTTAP);
    if (last > 0) {
      const hrs = Math.max(0, (Date.now() - last) / 3600000);
      const earned = Math.min(OFFLINE_CAP_CENTS, Math.floor(hrs * OFFLINE_RATE_CPH));
      if (earned > 0) {
        const next = points + earned;
        setPoints(next);
        writeInt(K_POINTS, next);
        pendingCentsRef.current += earned;
        pendingTapCountRef.current += Math.round(earned / EARN_PER_TAP_CENTS);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cooldown loop
  useEffect(() => {
    const tick = () => {
      const last = lastTapRef.current;
      if (!last) { setCooldown(0); return; }
      const elapsed = Date.now() - last;
      const left = Math.max(0, COOLDOWN_MS - elapsed);
      const pct = Math.min(100, Math.round((left / COOLDOWN_MS) * 100));
      setCooldown(pct);
      cdRafRef.current = left > 0 ? requestAnimationFrame(tick) : null;
    };
    cdRafRef.current = requestAnimationFrame(tick);
    return () => { if (cdRafRef.current) cancelAnimationFrame(cdRafRef.current); };
  }, []);

  // Flush exact taps to backend (tapBatch → exact count and amount)
  useEffect(() => {
    if (!isAuthed) return;
    flushTimerRef.current = setInterval(async () => {
      const cents = pendingCentsRef.current;
      const taps = pendingTapCountRef.current;
      if (cents <= 0 || taps <= 0) return;

      const amount = cents / 100; // PAPER
      pendingCentsRef.current = 0;
      pendingTapCountRef.current = 0;

      try {
        const r = await PaperAPI.tapBatch({ count: taps, amount });
        setTapCount(Number(r.tapCount || 0));
      } catch (e) {
        // restore if failed
        pendingCentsRef.current += cents;
        pendingTapCountRef.current += taps;
        setSrvError(e?.message || "Sync failed — retrying…");
      }
    }, FLUSH_INTERVAL_MS);
    return () => clearInterval(flushTimerRef.current);
  }, [isAuthed]);

  // Prize rain poll
  useEffect(() => {
    let alive = true;
    let timer;
    const poll = async () => {
      try {
        // ✅ was PaperAPI.rain(); should be getRain()
        const r = await PaperAPI.getRain();
        if (!alive) return;
        setRain(r);
      } catch {
        if (!alive) return;
        setRain({ active: false });
      } finally {
        if (alive) timer = setTimeout(poll, RAIN_POLL_MS);
      }
    };
    poll();
    return () => { alive = false; clearTimeout(timer); };
  }, []);

  const visualLevel = useMemo(() => {
    if (isAuthed && typeof level === "number" && level >= 0) return level;
    return Math.floor(points / 1000);
  }, [isAuthed, level, points]);

  const progress = useMemo(() => (points % 1000) / 1000, [points]);
  const earnNowCents = EARN_PER_TAP_CENTS * Math.min(COMBO_MAX_X, comboX);

  const doTap = () => {
    if (cooldown > 0) return;

    const diff = Date.now() - lastTapRef.current;
    const nextCombo = diff <= COMBO_WINDOW_MS ? Math.min(COMBO_MAX_X, (readInt(K_COMBO, comboX) || comboX) + 1) : 1;

    const add = EARN_PER_TAP_CENTS * nextCombo;
    const nextPoints = points + add;
    setPoints(nextPoints);
    writeInt(K_POINTS, nextPoints);

    const nt = totalTaps + 1;
    setTotalTaps(nt);
    writeInt(K_TAPS, nt);

    // queue to server (exact)
    pendingCentsRef.current += add;
    pendingTapCountRef.current += 1;

    setComboX(nextCombo);
    writeInt(K_COMBO, nextCombo);

    lastTapRef.current = Date.now();
    writeTs(K_LASTTAP, lastTapRef.current);

    if (cdRafRef.current) cancelAnimationFrame(cdRafRef.current);
    const loop = () => {
      const elapsed = Date.now() - lastTapRef.current;
      const left = Math.max(0, COOLDOWN_MS - elapsed);
      const pct = Math.min(100, Math.round((left / COOLDOWN_MS) * 100));
      setCooldown(pct);
      cdRafRef.current = left > 0 ? requestAnimationFrame(loop) : null;
    };
    cdRafRef.current = requestAnimationFrame(loop);

    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => { setComboX(1); writeInt(K_COMBO, 1); }, COMBO_WINDOW_MS + 50);

    burst("🪙");
  };

  const claimDaily = async () => {
    if (!isAuthed) {
      const today = dayStr();
      if (localStorage.getItem(K_LAST_DAY) === today) return;
      const next = points + DAILY_BONUS_CENTS;
      setPoints(next);
      writeInt(K_POINTS, next);
      localStorage.setItem(K_LAST_DAY, today);
      setCanDaily(false);
      burst("🎁");
      return;
    }

    setSrvError("");
    try {
      const r = await PaperAPI.claimDaily();
      const cents = Math.round(Number(r.paper || 0) * 100);
      setPoints(cents);
      writeInt(K_POINTS, cents);
      setSrvStreak(r.streak ?? 0);
      setLastClaimAt(r.lastClaimAt || new Date().toISOString());
      setCanDaily(false);
      burst("🎁");
    } catch (e) {
      setSrvError(e?.message || "Failed to claim daily");
    }
  };

  const onGrabRain = async () => {
    setRainError("");
    try {
      const r = await PaperAPI.grabRain();
      const cents = Math.round(Number(r.total || 0) * 100);
      setPoints(cents);
      writeInt(K_POINTS, cents);
      burst("🎉");
    } catch (e) {
      setRainError(e?.message || "Failed to grab");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      {srvError && <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-200 p-3 text-sm">{srvError}</div>}
      {!isAuthed && (
        <div className="rounded-xl border border-white/10 bg-white/5 text-slate-300 p-3 text-sm">
          Not signed in — progress is stored locally. <span className="opacity-75">Log in to sync Paper to your account.</span>
        </div>
      )}
      {isAuthed && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200 p-3 text-sm">
          Synced {srvLoading ? "…" : ""} • {tapCount.toLocaleString()} taps • Level {visualLevel} • Streak {srvStreak}
        </div>
      )}

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            PAPER <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">Tap</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Tap to earn <span className="text-slate-200 font-medium">0.01 PAPER</span> per tap. Keep a{" "}
            <span className="text-slate-200 font-medium">combo</span> for up to 3× rewards.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Level</div>
          <div className="text-2xl font-bold">{visualLevel}</div>
        </div>
      </div>

      <div className="relative glass rounded-2xl p-6 overflow-hidden">
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
          <div className="order-2 sm:order-1 text-center sm:text-left">
            <div className="text-sm text-slate-400">Your PAPER</div>
            <div className="text-5xl font-extrabold tracking-tight">{formatPAPER(points)}</div>
            <div className="text-xs text-slate-500 mt-1">{totalTaps.toLocaleString()} taps • combo up to {COMBO_MAX_X}×</div>
          </div>

          <div className="order-1 sm:order-2 relative grid place-items-center">
            <motion.button
              onClick={doTap}
              disabled={cooldown > 0}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow:
                  cooldown > 0
                    ? "0 0 0px rgba(56,189,248,0)"
                    : ["0 0 16px rgba(56,189,248,.4)", "0 0 28px rgba(56,189,248,.7)", "0 0 16px rgba(56,189,248,.4)"],
              }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className={`relative rounded-full px-10 py-10 text-xl font-bold ${
                cooldown > 0 ? "bg-slate-800 text-slate-300" : "bg-gradient-to-br from-sky-500 to-cyan-500 text-white"
              } border border-white/10`}
              title={cooldown > 0 ? "Cooling…" : "Tap to earn"}
            >
              <div className="flex items-center gap-3">
                <img
                  src={COIN_IMG}
                  alt="coin"
                  className="h-10 w-10 rounded-full"
                  onError={(e) => (e.currentTarget.src = "/images/coin-logo.png")}
                />
                {cooldown > 0 ? "Cooling…" : `+${formatPAPER(earnNowCents)} PAPER`}
              </div>
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
                <circle cx="50" cy="50" r="46" stroke="rgba(255,255,255,.15)" strokeWidth="4" fill="none" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="rgba(56,189,248,.9)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="289"
                  strokeDashoffset={cooldown ? 289 * (cooldown / 100) : 289}
                  transition={{ type: "tween", duration: 0.15 }}
                />
              </svg>
            </motion.button>

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

          <div className="order-3 text-center sm:text-right space-y-2">
            <button
              onClick={claimDaily}
              disabled={!canDaily}
              className={`px-4 py-2 rounded-lg text-sm border ${
                canDaily
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                  : "bg-white/5 text-slate-400 border-white/10 cursor-not-allowed"
              }`}
              title={canDaily ? "Claim your daily +1.00" : "Come back tomorrow!"}
            >
              🎁 Daily +{formatPAPER(DAILY_BONUS_CENTS)}
            </button>
            <div className="text-[11px] text-slate-500">1s cooldown • tiny offline reward • levels every 10 PAPER (visual)</div>
          </div>
        </div>

        {/* Prize Rain overlay */}
        <AnimatePresence>
          {rain.active && (
            <motion.div
              key="rain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0"
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <motion.img
                  key={i}
                  src={COIN_IMG}
                  onError={(e) => (e.currentTarget.src = "/images/coin-logo.png")}
                  className="absolute h-6 w-6"
                  style={{ left: `${(i * 37) % 100}%`, top: "-10%" }}
                  initial={{ y: -40, opacity: 0.8, rotate: 0 }}
                  animate={{ y: "120vh", rotate: 180 }}
                  transition={{ duration: 2.6 + (i % 10) * 0.15, repeat: Infinity, delay: (i % 12) * 0.2, ease: "linear" }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grab button */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            disabled={!rain.active}
            onClick={onGrabRain}
            className={`px-4 py-2 rounded-lg text-sm border ${
              rain.active
                ? "bg-amber-500/15 text-amber-200 border-amber-500/30 hover:bg-amber-500/25"
                : "bg-white/5 text-slate-400 border-white/10 cursor-not-allowed"
            }`}
          >
            {rain.active ? `Grab gift (+${(rain.amountPerGrab || 0).toFixed(2)} PAPER)` : "No prize rain"}
          </button>
          {rainError && <span className="text-xs text-rose-300">{rainError}</span>}
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
