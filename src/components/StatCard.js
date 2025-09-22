import React from "react";

/**
 * Props:
 * - label: string
 * - value: string | number (already formatted or raw)
 * - prefix/suffix: optional strings for value (e.g., "$","%")
 * - sub: small caption
 * - trend: "up" | "down" | "neutral" (affects sub color)
 * - delta: number (shows a small colored badge like +2.4%)
 * - icon: ReactNode (optional icon to show on the right)
 * - loading: boolean (renders a light skeleton)
 * - tooltip: string (title attribute on the card)
 * - className: extra classes
 * - formatter: (val)=>string (optional final value formatter)
 */
export default function StatCard({
  label,
  value,
  prefix = "",
  suffix = "",
  sub,
  trend = "neutral",
  delta,
  icon,
  loading = false,
  tooltip,
  className = "",
  formatter,
}) {
  const trendColor =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
      ? "text-rose-400"
      : "text-slate-400";

  const deltaColor =
    typeof delta === "number"
      ? delta > 0
        ? "bg-emerald-500/15 text-emerald-300"
        : delta < 0
        ? "bg-rose-500/15 text-rose-300"
        : "bg-slate-500/15 text-slate-300"
      : "";

  const finalValue =
    formatter && value !== undefined && value !== null
      ? formatter(value)
      : value ?? "—";

  return (
    <div
      className={`glass p-4 rounded-2xl flex items-start justify-between ${className}`}
      title={tooltip}
    >
      <div>
        <div className="text-slate-400 text-xs">{label}</div>

        {/* Value or skeleton */}
        {loading ? (
          <div className="mt-2 h-6 w-28 rounded bg-white/10 animate-pulse" />
        ) : (
          <div className="text-xl md:text-2xl font-semibold mt-1">
            {prefix}
            {finalValue}
            {suffix}
          </div>
        )}

        {/* Sub + delta */}
        <div className="mt-1 flex items-center gap-2">
          {sub && <div className={`text-xs ${trendColor}`}>{sub}</div>}
          {typeof delta === "number" && (
            <span className={`text-[11px] px-1.5 py-0.5 rounded ${deltaColor}`}>
              {delta > 0 ? "+" : ""}
              {delta.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {icon && <div className="opacity-80 ml-3">{icon}</div>}
    </div>
  );
}
