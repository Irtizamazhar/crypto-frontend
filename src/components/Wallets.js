import React, { useState } from "react";

export default function Wallets({
  isAuthed,
  paper = 0,
  usdtBalance = 0, // Changed from fiatUsd to usdtBalance
  streak = 0,
  claimedToday = false,
  claiming = false,
  claimDaily,
  fmtPaper,
  trc20Address,
}) {
  const [copied, setCopied] = useState(false);

  // Move the conditional return AFTER all hooks
  if (!isAuthed) return null;

  const formatPaper = fmtPaper || ((v) => `${Number(v || 0).toLocaleString()} P`);

  const handleCopyAddress = async () => {
    if (!trc20Address || trc20Address === "Address not available") return;
    
    try {
      await navigator.clipboard.writeText(trc20Address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {/* Daily Reward */}
      <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-4 backdrop-blur-md">
        <div className="absolute right-3 -top-2 text-[10px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
          Earn Paper
        </div>
        <div className="text-sm">
          <div className="font-semibold">Daily Reward</div>
          <div className="text-slate-400 text-xs">
            Streak: <span className="text-slate-200">{streak} day(s)</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Paper Wallet: <span className="text-slate-200">{formatPaper(paper)}</span>
          </div>
          <button
            onClick={claimDaily}
            disabled={claimedToday || claiming}
            className={`rounded-xl px-3 py-2 text-sm transition shadow-sm ${
              !claimedToday && !claiming
                ? "bg-emerald-600/80 hover:bg-emerald-600 text-white"
                : "bg-white/5 text-slate-400 cursor-not-allowed"
            }`}
          >
            {claiming ? "Claiming..." : (!claimedToday ? "Claim +1 P" : "Come back tomorrow")}
          </button>
        </div>
      </div>

      {/* Wallets */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-4 backdrop-blur-md">
        <div className="text-sm font-semibold mb-2">Wallets</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* USDT Balance (On-chain) */}
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <div className="text-slate-400 text-xs">USDT (TRC20)</div>
            <div className="mt-1 text-lg font-semibold">{Number(usdtBalance).toLocaleString()} USDT</div>
          </div>
          {/* Paper Balance */}
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <div className="text-slate-400 text-xs">Paper</div>
            <div className="mt-1 text-lg font-semibold">{formatPaper(paper)}</div>
          </div>
        </div>

        {/* TRC20 Address for Deposit */}
        <div className="mt-4">
          <div className="text-sm font-semibold text-slate-400 mb-2">Deposit Address (TRC20)</div>
          <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-3">
            <div className="flex-1">
              <div className="text-sm font-mono text-slate-200 break-all">
                {trc20Address || "Address not available"}
              </div>
            </div>
            <button
              onClick={handleCopyAddress}
              disabled={!trc20Address || trc20Address === "Address not available"}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                copied 
                  ? "bg-green-600 text-white" 
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              } disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-3 text-[11px] text-slate-400">
          Paper is earned in-app. USDT is on-chain balance for deposit/withdraw.
        </div>
      </div>
    </div>
  );
}