import React, { useState } from "react";
import { RefreshCw, SlidersHorizontal } from "lucide-react";

/**
 * Compact, non-intrusive filter controls:
 * - Desktop (md+): right-aligned pill toolbar so it doesn't occupy the full width.
 * - Mobile: floating button (bottom-right) opens a small sheet with the same controls.
 */
export default function FiltersBar({
  vsCurrency, setVsCurrency,
  view, setView,
  onRefresh,
}) {
  const [open, setOpen] = useState(false);

  const ViewButton = ({ v, label }) => (
    <button
      onClick={() => setView(v)}
      className={[
        "px-3 py-1.5 rounded-lg text-sm transition",
        view === v ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10"
      ].join(" ")}
    >
      {label}
    </button>
  );

  const CurrencySelect = (
    <label className="inline-flex items-center gap-2">
      <span className="text-slate-400 text-sm hidden sm:inline">Currency</span>
      <select
        value={vsCurrency}
        onChange={(e) => setVsCurrency(e.target.value)}
        className="bg-slate-900/80 text-slate-100 border border-white/10 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 text-sm"
      >
        <option value="usd">USD</option>
        <option value="eur">EUR</option>
      </select>
    </label>
  );

  const Views = (
    <div className="flex items-center gap-1">
      <ViewButton v="market"  label="Market" />
      <ViewButton v="gainers" label="Gainers (24h)" />
      <ViewButton v="losers"  label="Losers (24h)" />
    </div>
  );

  const RefreshBtn = onRefresh ? (
    <button
      onClick={onRefresh}
      className="rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 transition"
      title="Refresh"
    >
      <RefreshCw className="h-4 w-4" />
    </button>
  ) : null;

  return (
    <>
      {/* DESKTOP: right-aligned floating pill */}
      <div className="hidden md:block relative">
        <div className="flex justify-end">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur px-3 py-2 flex items-center gap-3">
            {CurrencySelect}
            <div className="h-5 w-px bg-white/10" />
            {Views}
            {RefreshBtn && <div className="h-5 w-px bg-white/10" />}
            {RefreshBtn}
          </div>
        </div>
      </div>

      {/* MOBILE: floating action button + sheet */}
      <div className="md:hidden">
        {/* FAB */}
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-40 rounded-full p-3 bg-white/10 backdrop-blur border border-white/15 text-slate-100 shadow-lg active:scale-95 transition"
          aria-label="Open filters"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>

        {/* Sheet */}
        {open && (
          <>
            {/* dim backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-200">Filters</div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-sm text-slate-300 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10"
                >
                  Done
                </button>
              </div>

              <div className="flex items-center justify-between">
                {CurrencySelect}
                {RefreshBtn}
              </div>

              <div className="flex items-center gap-2">
                {Views}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
