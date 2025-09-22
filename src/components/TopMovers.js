import React, { useMemo } from "react";
import CoinCard from "./CoinCard";

/**
 * Props:
 * - list: array of coins (same shape you already use)
 * - mode: "gainers" | "losers"
 * - visible: number of cards to show (default 6)
 * - title: override section title (optional)
 * - onShowMore: if provided, renders a "Show more" button and calls this on click
 */
export default function TopMovers({
  list = [],
  mode = "gainers",
  visible = 6,
  title,
  onShowMore,
}) {
  const sorted = useMemo(() => {
    // Be robust to various API shapes:
    // - changePercent24Hr (your market list)
    // - price_change_percentage_24h_in_currency / price_change_percentage_24h (common alt names)
    const pickPct = (c) =>
      c.changePercent24Hr ??
      c.price_change_percentage_24h_in_currency ??
      c.price_change_percentage_24h ??
      0;

    const arr = [...list].sort((a, b) => {
      const A = pickPct(a);
      const B = pickPct(b);
      return mode === "gainers" ? B - A : A - B;
    });

    // Only slice here; how many to reveal is a component concern
    return arr.slice(0, Math.max(0, visible));
  }, [list, mode, visible]);

  if (!sorted.length) return null;

  const fallbackTitle =
    mode === "gainers" ? "Top Movers (24h)" : "Biggest Losers (24h)";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title || fallbackTitle}</h3>
        {onShowMore && (
          <button className="btn-ghost text-sm" onClick={onShowMore}>
            Show more
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((c) => (
          <CoinCard key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}
