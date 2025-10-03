import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  fetchMarket, fetchKlines, convertFromUsdt, sanitizeCurrency,
  fetchGlobalFromMarket, getUsdtToCurrencyFactor, openMiniTickerStream,
} from "../services/api";
import { PaperAPI } from "../services/paper";
import CoinCard from "../components/CoinCard";
import SkeletonCard from "../components/SkeletonCard";
import FiltersBar from "../components/FiltersBar";
import TickerBar from "../components/TickerBar";
import StatCard from "../components/StatCard";
import TopMovers from "../components/TopMovers";
import TrendingStrip from "../components/TrendingStrip";
import { useLoading } from "../context/LoadingContext";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import Wallets from "../components/Wallets";
import { useSearchParams, useNavigate } from "react-router-dom";

/* helpers */
const fmtPaper = (v) => `${Number(v || 0).toLocaleString()} P`;
const API_PAGE_SIZE   = 30;
const CACHE_TTL_MS    = 15 * 60 * 1000;
const AUTO_REFRESH_MS = 60 * 1000;
const DEFAULT_SHOW    = { market: 9, marketStep: 9, trending: 10 };

function cacheKey(cur) { return `market_cache_${cur}`; }
function readCache(cur) {
  try { const raw = localStorage.getItem(cacheKey(cur)); if (!raw) return null;
    const obj = JSON.parse(raw); if (!obj || Date.now() - obj.ts > CACHE_TTL_MS) return null; return obj.data || null; } catch { return null; }
}
function writeCache(cur, data) { try { localStorage.setItem(cacheKey(cur), JSON.stringify({ ts: Date.now(), data })); } catch {} }

/* pretty card */
const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

function FancyActionCard({ to, title, subtitle, badge, icon, tone = "indigo" }) {
  const toneMap = {
    indigo: "from-indigo-500/40 to-fuchsia-500/40 border-indigo-400/30",
    cyan:   "from-cyan-500/40 to-blue-500/40 border-cyan-400/30",
    amber:  "from-amber-500/40 to-rose-500/40 border-amber-400/30",
    emerald:"from-emerald-500/40 to-teal-500/40 border-emerald-400/30",
    violet: "from-violet-500/40 to-pink-500/40 border-violet-400/30",
  }[tone];

  return (
    <a
      href={to}
      className={`group ${shimmer} rounded-2xl p-[1px] bg-gradient-to-br ${toneMap} border`}
      style={{ boxShadow: "0 1px 40px rgba(99,102,241,0.07)" }}
    >
      <div className="rounded-2xl h-full w-full bg-slate-900/70 p-5 backdrop-blur-md transition group-hover:bg-slate-900/60">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/5 flex items-center justify-center text-xl">{icon}</div>
            <div>
              <div className="text-base md:text-lg font-semibold">{title}</div>
              <p className="text-xs md:text-sm text-slate-400">{subtitle}</p>
            </div>
          </div>
          {badge && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 border border-white/10 text-slate-200">
              {badge}
            </span>
          )}
        </div>
        <div className="mt-3 text-[11px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">Tap to open →</div>
      </div>
    </a>
  );
}

export default function Home() {
  const { user, token, getTrc20Wallet } = useAuth();
  const isAuthed = !!(user && token);

  const [list, setList]                 = useState([]);
  const [page, setPage]                 = useState(1);
  const [hasMore, setHasMore]           = useState(true);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [vsCurrency, setVsCurrency]     = useState("usd");
  const [view, setView]                 = useState("market");
  const [lastUpdated, setLastUpdated]   = useState(null);
  const [global, setGlobal]             = useState(null);
  const [globalVolConv, setGlobalVolConv] = useState(0);
  const [usdtFactor, setUsdtFactor]     = useState(1);

  // Paper/USDT Wallet State
  const [paper, setPaper]               = useState(0);
  const [usdtBalance, setUsdtBalance]   = useState(0);
  const [streak, setStreak]             = useState(0);
  const [lastClaimAt, setLastClaimAt]   = useState(null);
  const [canClaim, setCanClaim]         = useState(false);
  const [claiming, setClaiming]         = useState(false);

  // TRC20 Wallet State
  const [trc20Wallet, setTrc20Wallet]   = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);

  const [shownMarket, setShownMarket]   = useState(DEFAULT_SHOW.market);

  const abortRef      = useRef(null);
  const autoRef       = useRef(null);
  const stopSocketRef = useRef(null);
  const { start, stop } = useLoading();

  // Welcome Spin modal
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [showWelcomeSpin, setShowWelcomeSpin] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [spinError, setSpinError] = useState("");

  useEffect(() => {
    if (isAuthed && params.get("welcome") === "1") {
      setShowWelcomeSpin(true);
      // clean url
      const sp = new URLSearchParams(params);
      sp.delete("welcome");
      nav({ search: sp.toString() }, { replace: true });
    }
  }, [isAuthed, params, nav]);

  const doSpin = async () => {
    if (spinning) return;
    setSpinError("");
    setSpinning(true);
    try {
      const r = await PaperAPI.spin();
      setSpinResult(r?.reward || 0);
      setPaper((p) => Number(p || 0) + Number(r?.reward || 0));
    } catch (e) {
      setSpinError(e?.message || "Spin failed");
    } finally {
      setSpinning(false);
    }
  };

  // Fetch TRC20 Wallet and Paper Data
  useEffect(() => {
    let mounted = true;
    if (!isAuthed) {
      setPaper(0);
      setUsdtBalance(0);
      setStreak(0);
      setLastClaimAt(null);
      setCanClaim(false);
      setTrc20Wallet(null);
      return () => { mounted = false; };
    }

    (async () => {
      try {
        const w = await PaperAPI.wallet();
        if (!mounted) return;
        setPaper(Number(w.paper || 0));

        setWalletLoading(true);
        const trc20Data = await getTrc20Wallet();
        if (!mounted) return;

        setTrc20Wallet(trc20Data);
        setUsdtBalance(Number(trc20Data?.usdt || 0));

        setStreak(Number(w.streak || 0));
        const last = w.lastClaimAt ? new Date(w.lastClaimAt) : null;
        setLastClaimAt(last);
        const now = new Date();
        const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const lastUTC  = last ? Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate()) : null;
        setCanClaim(lastUTC !== todayUTC);
      } catch (error) {
        console.error("Error fetching wallet data:", error);
        if (!mounted) return;
        setTrc20Wallet({ address: "Address not available", trx: 0, usdt: 0, error: error.message });
        setUsdtBalance(0);
      } finally {
        if (mounted) setWalletLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [isAuthed, getTrc20Wallet]);

  const claimDaily = async () => {
    if (!isAuthed || !canClaim || claiming) return;
    setClaiming(true);
    try {
      const res = await PaperAPI.claimDaily();
      setPaper(res.paper || 0);
      setStreak(res.streak || 0);
      setLastClaimAt(res.lastClaimAt ? new Date(res.lastClaimAt) : null);
      setCanClaim(false);
    } finally { setClaiming(false); }
  };

  const decorate = async (arr, cur, { signal } = {}) => {
    const fac = await getUsdtToCurrencyFactor(cur, { signal });
    setUsdtFactor(fac);
    const withConv = await Promise.all(
      arr.map(async (c) => {
        const price = (Number(c.priceUsdt) || 0) * fac;
        const vol   = (Number(c.volumeUsd24Hr ?? c.volumeQuote24h) || 0) * fac;
        return { ...c, _priceConv: price, _volConv: vol, _mcConv: null };
      })
    );
    const top = withConv.slice(0, 6);
    const sparks = await Promise.all(
      top.map(async (c, i) => {
        try {
          const sym = `${String(c.symbol || c.id || "").toUpperCase()}USDT`;
          const prices = await fetchKlines(sym, "1h", 168, { signal });
          return { i, prices };
        } catch { return { i, prices: [] }; }
      })
    );
    const copy = [...withConv];
    for (const { i, prices } of sparks) copy[i] = { ...copy[i], _spark7d: prices };
    return copy;
  };

  const mergeFront = (old, fresh) => {
    const map = new Map();
    for (const c of fresh) map.set(c.id, c);
    for (const c of old) if (!map.has(c.id)) map.set(c.id, c);
    return Array.from(map.values());
  };

  const load = useCallback(
    async ({ reset = false, ensurePage1 = false } = {}) => {
      setLoading(true); start(); setError("");
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController(); abortRef.current = ctrl;
      const cur = sanitizeCurrency(vsCurrency);

      try {
        const pageToFetch = reset ? 1 : page;
        let marketPage = [];
        let tries = 0;
        while (tries < 3) {
          try {
            const r = await fetchMarket({ page: pageToFetch, per_page: API_PAGE_SIZE, signal: ctrl.signal });
            marketPage = r || [];
            break;
          } catch (e) { if (e.name === "AbortError") throw e; }
          tries++;
        }

        if (!Array.isArray(marketPage)) marketPage = [];
        setHasMore(marketPage.length >= API_PAGE_SIZE);

        const globalStats = await fetchGlobalFromMarket({ signal: ctrl.signal });
        const data = await decorate(marketPage, cur, { signal: ctrl.signal });

        setList((old) => {
          if (!data.length) {
            const cache = readCache(cur);
            if (cache && (!old || !old.length)) return cache;
            return old;
          }
          if (reset || ensurePage1) {
            const merged = mergeFront(reset ? [] : old, data);
            writeCache(cur, merged.slice(0, 90));
            return merged;
          }
          const next = [...old, ...data];
          writeCache(cur, next.slice(0, 90));
          return next;
        });

        setGlobal(globalStats);
        setLastUpdated(new Date());
      } catch (e) {
        if (e.name !== "AbortError") {
          const cache = readCache(cur);
          if (cache && cache.length) { setList(cache); setError("Live data failed — showing recent data."); }
          else setError(e.message || "Failed to load data");
        }
      } finally {
        setLoading(false); stop();
      }
    },
    [page, vsCurrency, start, stop]
  );

  useEffect(() => {
    if (stopSocketRef.current) stopSocketRef.current();
    stopSocketRef.current = openMiniTickerStream((tick) => {
      setList((old) => {
        if (!old || !old.length) return old;
        const fac = usdtFactor;
        let changed = false;
        const next = old.map((c) => {
          if (c.id !== tick.id) return c;
          changed = true;
          const priceUsdt = Number(tick.priceUsdt) || 0;
          const volUsdt   = Number(tick.volumeQuote24h) || 0;
          return {
            ...c,
            priceUsdt,
            changePercent24Hr: Number.isFinite(tick.changePercent24Hr) ? tick.changePercent24Hr : c.changePercent24Hr,
            volumeQuote24h: volUsdt, volumeUsd24Hr: volUsdt,
            _priceConv: priceUsdt * fac, _volConv: volUsdt * fac,
          };
        });
        return changed ? next : old;
      });
    });
    return () => { if (stopSocketRef.current) stopSocketRef.current(); stopSocketRef.current = null; };
  }, [usdtFactor, vsCurrency]);

  useEffect(() => {
    const cur = sanitizeCurrency(vsCurrency);
    const cache = readCache(cur);
    if (cache && cache.length) setList(cache);
  }, [vsCurrency]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cur = sanitizeCurrency(vsCurrency);
      const v   = await convertFromUsdt(global?.volumeUsd24Hr || 0, cur);
      if (!cancelled) setGlobalVolConv(v);
    })();
    return () => { cancelled = true; };
  }, [global, vsCurrency]);

  useEffect(() => { setPage(1); setHasMore(true); setShownMarket(DEFAULT_SHOW.market); }, [vsCurrency]);
  useEffect(() => { load({ reset: page === 1 && list.length === 0 }); }, [page, vsCurrency]);
  useEffect(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => { load({ ensurePage1: true, reset: false }); }, AUTO_REFRESH_MS);
    return () => clearInterval(autoRef.current);
  }, [load]);

  const display = useMemo(() => {
    if (view === "market") return list;
    const sorted = [...list].sort((a, b) => {
      const A = a.changePercent24Hr ?? 0; const B = b.changePercent24Hr ?? 0;
      return view === "gainers" ? B - A : A - B;
    });
    return sorted;
  }, [list, view]);

  const onRefresh = async () => { setPage(1); await load({ reset: true }); };
  const showMoreMarket = async () => {
    if (shownMarket + DEFAULT_SHOW.marketStep <= display.length) { setShownMarket(shownMarket + DEFAULT_SHOW.marketStep); return; }
    if (hasMore && !loading) { setPage((p) => p + 1); setShownMarket(shownMarket + DEFAULT_SHOW.marketStep); }
  };

  const cur = sanitizeCurrency(vsCurrency);
  const avgChange = list.length ? list.reduce((acc, c) => acc + (Number(c.changePercent24Hr) || 0), 0) / list.length : 0;
  const claimedToday = !canClaim;

  return (
    <div className="mx-auto max-w-7xl">
      <TickerBar items={list} vsCurrency={cur} />

      {/* Welcome Spin Modal (lightweight) */}
      {isAuthed && showWelcomeSpin && (
        <div className="fixed inset-0 z-[2000] bg-black/60 grid place-items-center p-4" onClick={() => setShowWelcomeSpin(false)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold">🎉 Welcome Spin</h3>
            <p className="text-sm text-slate-400 mt-1">Spin once to win bonus Paper coins.</p>
            <div className="mt-5 flex items-center gap-3">
              <button onClick={doSpin} disabled={spinning || spinResult !== null} className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50">
                {spinning ? "Spinning…" : (spinResult !== null ? "Done" : "Spin now")}
              </button>
              <button onClick={() => setShowWelcomeSpin(false)} className="px-4 py-2 rounded-xl bg-white/10 text-white">Close</button>
            </div>
            {spinError && <div className="mt-3 text-rose-300 text-sm">{spinError}</div>}
            {spinResult !== null && <div className="mt-3 text-emerald-300 font-semibold">You won +{spinResult} Paper!</div>}
          </div>
        </div>
      )}

      {/* Extra bottom padding so the global dock never overlaps content */}
      <div className="px-4 py-8 space-y-10 pb-[env(safe-area-inset-bottom)] md:pb-0">
        {/* HERO */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Pro Market Analyzer for{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">Every Coin</span>
          </h1>
          <p className="text-slate-400 max-w-2xl">
            Earn <span className="text-amber-300 font-semibold">Paper</span> via streaks, invites &amp; TapTap Paper. USDT wallet supports deposit/withdraw.
          </p>

          <Wallets
            isAuthed={isAuthed}
            paper={paper}
            usdtBalance={usdtBalance}
            streak={streak}
            claimedToday={claimedToday}
            claiming={claiming}
            claimDaily={claimDaily}
            fmtPaper={fmtPaper}
            trc20Address={trc20Wallet?.address}
          />

          {/* Refresh row */}
          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-4">
            <button onClick={onRefresh} className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition">Refresh</button>
            {lastUpdated && <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>}
          </div>
        </motion.section>

        {/* FILTERS */}
        <div className="hidden md:block sticky top-[64px] z-40">
          <FiltersBar
            vsCurrency={cur}
            setVsCurrency={setVsCurrency}
            view={view}
            setView={setView}
            onRefresh={onRefresh}
          />
        </div>

        {error && list.length > 0 && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 text-amber-200 p-3 text-sm">{error}</div>
        )}

        {/* GLOBAL CARDS */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label={`Total 24h Volume (${cur.toUpperCase()})`} value={globalVolConv ? globalVolConv.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"} sub="Across USDT pairs" />
          <StatCard label="BTC Dominance (by volume)" value={`${(global?.bitcoinDominance || 0).toFixed(2)}%`} sub="Share of USDT volume" />
          <StatCard label="Assets on Page" value={list.length ? list.length.toLocaleString() : "—"} />
          <StatCard label="Avg Change (24h)" value={`${avgChange.toFixed(2)}%`} sub="Across visible assets" />
        </section>

        {/* FEATURE HUB */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FancyActionCard to="/signals"   title="📡 Signals"        subtitle="Screeners & indicators for smart entries." badge="Pro"        tone="violet"  icon={<span>📈</span>} />
          <FancyActionCard to="/game"      title="$ Dollar Games"      subtitle="Daily micro-stakes challenge. Tap to play." badge="Hot"       tone="amber"   icon={<span>⚡</span>} />
          <FancyActionCard to="/paper"     title="📰 Earn Paper"     subtitle="TapTap Paper: notes, tips & community."    badge="New"       tone="cyan"    icon={<span>🪙</span>} />
          {isAuthed && <FancyActionCard to="/dashboard" title="📈 Dashboard" subtitle="Wallet, PnL & performance chart." tone="indigo" icon={<span>📊</span>} />}
          <FancyActionCard to="/alerts"    title="🔔 Smart Alerts"   subtitle="Notify on price/volume breakouts."        tone="violet"     icon={<span>🔍</span>} />
        </section>

        {/* TRENDING */}
        <TrendingStrip
          items={[...list]
            .sort((a, b) => (b.changePercent24Hr ?? 0) - (a.changePercent24Hr ?? 0))
            .slice(0, DEFAULT_SHOW.trending)
            .map((c) => ({ item: { id: c.id, name: c.name, symbol: c.symbol?.toUpperCase(), small: c.image, _spark7d: c._spark7d, _priceConv: c._priceConv, changePercent24Hr: c.changePercent24Hr } }))}
        />

        {/* TOP MOVERS */}
        <TopMovers list={list} mode="gainers" />
        <TopMovers list={list} mode="losers" />

        {/* MARKET GRID */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {view === "market" ? "Top Market" : view === "gainers" ? "Top Gainers (24h)" : "Top Losers (24h)"}
            </h2>
          </div>

          {loading && list.length === 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : display.length > 0 ? (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {display.slice(0, Math.min(DEFAULT_SHOW.market, display.length)).map((c, i) => (
                  <CoinCard key={c.id + i} c={c} />
                ))}
              </div>
              <div className="text-center">
                {(DEFAULT_SHOW.market < display.length || hasMore) ? (
                  <button onClick={showMoreMarket} className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition">
                    {loading ? "Loading…" : "Show more coins"}
                  </button>
                ) : <div className="text-slate-500 text-sm">You're up to date.</div>}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-slate-400">
              No data right now. <button className="underline" onClick={onRefresh}>Refresh</button>
            </div>
          )}
        </section>
      </div>

      <style>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}
