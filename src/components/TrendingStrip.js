import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import SmartImg from "./SmartImg";
import { fmt as fmtNum, pct as fmtPct } from "../utils/format";
import { ChevronLeft, ChevronRight } from "lucide-react";

function pickPct(c) {
  const val =
    c.changePercent24Hr ??
    c.price_change_percentage_24h_in_currency ??
    c.pct ??
    0;
  return Number(val);
}

function pickPrice(c) {
  return c._priceConv ?? c.priceUsdt ?? c.current_price ?? undefined;
}

function useSparkPath(values = [], width = 90, height = 24) {
  return useMemo(() => {
    if (!values || values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const stepX = width / (values.length - 1);
    let d = "";
    values.forEach((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / span) * height;
      d += i ? ` L ${x.toFixed(2)} ${y.toFixed(2)}` : `M ${x.toFixed(2)} ${y.toFixed(2)}`;
    });
    return d;
  }, [values, width, height]);
}

function Chip({ c }) {
  const p = pickPct(c);
  const price = pickPrice(c);
  const pos = Number(p) >= 0;
  const d = useSparkPath(c._spark7d, 90, 24);

  return (
    <Link
      to={`/coin/${c.id}`}
      title={c.name}
      className={[
        "group min-w-[180px] md:min-w-[212px] px-3 py-3 rounded-xl",
        "bg-white/[0.03] border border-white/10",
        "hover:border-white/20 hover:bg-white/[0.06]",
        "transition-all duration-200 ease-out",
        "relative overflow-hidden",
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none absolute inset-0 rounded-xl ring-1 transition-opacity",
          pos ? "ring-emerald-500/20" : "ring-rose-500/20",
          "opacity-0 group-hover:opacity-100",
        ].join(" ")}
      />
      <div className="flex items-center gap-2">
        <SmartImg symbol={c.symbol} alt="" className="h-5 w-5 rounded-full shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{c.name}</div>
          <div className="text-[11px] text-slate-400">{String(c.symbol ?? "").toUpperCase()}</div>
        </div>
        <span
          className={[
            "text-[11px] px-2 py-0.5 rounded-full shrink-0",
            pos ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400",
          ].join(" ")}
        >
          {fmtPct(p)}
        </span>
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="text-sm text-slate-300">{price !== undefined ? fmtNum(price) : "—"}</div>
        {d ? (
          <svg width="90" height="24" viewBox="0 0 90 24" className="opacity-80">
            <path d={d} fill="none" stroke={pos ? "rgb(34 197 94)" : "rgb(244 63 94)"} strokeWidth="2" />
          </svg>
        ) : (
          <div className="h-4 w-24 rounded bg-white/5" />
        )}
      </div>

      <div className="mt-2 h-[2px] w-0 group-hover:w-full transition-all duration-300 bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-indigo-400 rounded-full" />
    </Link>
  );
}

function SkeletonChip() {
  return (
    <div className="min-w-[180px] md:min-w-[212px] px-3 py-3 rounded-xl bg-white/[0.03] border border-white/10">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded-full bg-white/10" />
        <div className="flex-1">
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="h-2 w-14 rounded bg-white/5 mt-1" />
        </div>
        <div className="h-4 w-10 rounded-full bg-white/10" />
      </div>
      <div className="mt-3 h-4 w-28 rounded bg-white/10" />
    </div>
  );
}

export default function TrendingStrip({ items = [], loading = false }) {
  const scrollerRef = useRef(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);
  const dragging = useRef({ active: false, startX: 0, scrollX: 0 });

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanL(scrollLeft > 6);
    setCanR(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => updateArrows();
    el.addEventListener("scroll", onScroll, { passive: true });
    const obs = new ResizeObserver(updateArrows);
    obs.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      obs.disconnect();
    };
  }, [updateArrows]);

  // Drag-to-scroll (desktop)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const down = (e) => {
      dragging.current = {
        active: true,
        startX: e.pageX ?? e.touches?.[0]?.pageX ?? 0,
        scrollX: el.scrollLeft,
      };
      el.classList.add("cursor-grabbing");
    };
    const move = (e) => {
      if (!dragging.current.active) return;
      const x = e.pageX ?? e.touches?.[0]?.pageX ?? 0;
      el.scrollLeft = dragging.current.scrollX - (x - dragging.current.startX);
    };
    const up = () => {
      dragging.current.active = false;
      el.classList.remove("cursor-grabbing");
    };

    el.addEventListener("mousedown", down);
    el.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    el.addEventListener("touchstart", down, { passive: true });
    el.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", up);

    return () => {
      el.removeEventListener("mousedown", down);
      el.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      el.removeEventListener("touchstart", down);
      el.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, []);

  const scrollBy = (dx) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dx, behavior: "smooth" });
  };

  const chips = useMemo(() => {
    if (loading) return Array.from({ length: 8 }).map((_, i) => <SkeletonChip key={`sk-${i}`} />);
    return items.map((it, idx) => {
      const c = it?.item || it;
      if (!c) return null;
      return <Chip key={`${c.id}-${idx}`} c={c} />;
    });
  }, [items, loading]);

  return (
    <section className="relative">
      {/* Title row */}
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-slate-300 tracking-wide">Trending Markets</h3>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">live 24h</span>
      </div>

      <div className="relative glass p-3 rounded-2xl">
        {/* Horizontal list (scrollbar hidden) */}
        <ul
          ref={scrollerRef}
          id="tscroll"
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory select-none cursor-grab"
          style={{ overscrollBehaviorX: "contain", WebkitOverflowScrolling: "touch" }}
        >
          {chips}
        </ul>

        {/* Scoped scrollbar hide (WebKit + Firefox + old Edge) */}
        <style>{`
          #tscroll { -ms-overflow-style: none; scrollbar-width: none; }
          #tscroll::-webkit-scrollbar { display: none; height: 0; }
        `}</style>

        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-3 left-0 w-10 bg-gradient-to-r from-slate-900/60 to-transparent rounded-l-2xl" />
        <div className="pointer-events-none absolute inset-y-3 right-0 w-10 bg-gradient-to-l from-slate-900/60 to-transparent rounded-r-2xl" />

        {/* Arrow controls */}
        <button
          onClick={() => scrollBy(-260)}
          disabled={!canL}
          aria-label="Scroll left"
          className={[
            "absolute left-1 top-1/2 -translate-y-1/2 grid place-items-center h-8 w-8 rounded-full",
            "bg-white/10 backdrop-blur hover:bg-white/20 border border-white/20",
            "transition disabled:opacity-40 disabled:pointer-events-none",
          ].join(" ")}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => scrollBy(260)}
          disabled={!canR}
          aria-label="Scroll right"
          className={[
            "absolute right-1 top-1/2 -translate-y-1/2 grid place-items-center h-8 w-8 rounded-full",
            "bg-white/10 backdrop-blur hover:bg-white/20 border border-white/20",
            "transition disabled:opacity-40 disabled:pointer-events-none",
          ].join(" ")}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </section>
  );
}
