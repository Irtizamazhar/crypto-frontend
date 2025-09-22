import React, { useEffect, useMemo, useRef, useState } from "react";
import { fmt, pct } from "../utils/format";
import SmartImg from "./SmartImg";

/**
 * Smooth, infinite marquee ticker.
 * - Animates via CSS keyframes (no rAF jitters)
 * - Speed auto-scales with content width
 * - Pauses on hover
 */
export default function TickerBar({ items = [] }) {
  // keep it compact: first 60 assets
  const list = useMemo(() => items.slice(0, 60), [items]);
  const trackRef = useRef(null);
  const [duration, setDuration] = useState(30); // seconds

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    // The track contains TWO copies of the sequence.
    // We animate from 0 to -50% so the second copy takes over seamlessly.
    const measure = () => {
      // width of ONE sequence (half of the total since we render two copies)
      const singleWidth = el.scrollWidth / 2;
      // pixels per second target (bigger width -> longer duration)
      const pps = 80; // tweak for taste (60–120 looks good)
      const d = Math.max(18, Math.min(90, singleWidth / pps));
      setDuration(d);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", measure);
    };
  }, [list.length]);

  if (list.length === 0) return null;

  const row = (
    <>
      {list.map((c, i) => {
        const price = c._priceConv ?? c.priceUsdt;
        const p = c.changePercent24Hr ?? 0;
        const pos = Number(p) >= 0;
        return (
          <div key={`${c.id}-${i}`} className="inline-flex items-center gap-2">
            <SmartImg symbol={c.symbol} alt="" className="h-4 w-4 rounded-full" />
            <span className="font-medium">{String(c.symbol || "").toUpperCase()}</span>
            <span className="text-slate-400">{fmt(price)}</span>
            <span className={pos ? "text-green-400" : "text-red-400"}>{pct(p)}</span>
          </div>
        );
      })}
    </>
  );

  return (
    <div className="group overflow-hidden border-y border-white/10">
      <div className="relative py-2 text-sm text-slate-300">
        {/* Animated track (two copies for a perfect loop) */}
        <div
          ref={trackRef}
          className="flex gap-8 whitespace-nowrap will-change-transform"
          style={{
            animation: `marq ${duration}s linear infinite`,
            // pause on hover (nice UX)
            animationPlayState: "running",
          }}
        >
          {row}
          {row}
        </div>
      </div>

      <style>{`
        @keyframes marq {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        /* Pause animation when user hovers the whole bar */
        .group:hover > .relative > div[style] {
          animation-play-state: paused !important;
        }
      `}</style>
    </div>
  );
}
