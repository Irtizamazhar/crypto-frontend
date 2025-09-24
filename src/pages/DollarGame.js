// src/pages/DollarGame.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fmt } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import { fetchCurrentRound, joinLottery, fetchPastRounds } from "../services/lottery";

/** Small helper to turn server errors into nice strings */
function normalizeError(err) {
  if (!err) return "Something went wrong.";
  const m = String(err.message || err);
  try {
    const j = JSON.parse(m);
    if (j && j.message) return j.message;
  } catch {}
  return m;
}

function CenterModal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <div className="text-lg font-bold text-white">{title}</div>
        </div>
        <div className="p-6 text-sm text-slate-200">{children}</div>
        <div className="p-6 pt-0 flex justify-end gap-3">
          <button
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-all duration-200 font-medium"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DollarGame() {
  const { token } = useAuth();
  const nav = useNavigate();

  const [entries, setEntries] = useState([]);
  const [bal, setBal] = useState(0);
  const [currentRound, setCurrentRound] = useState(null);
  const [pastRounds, setPastRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const [errorBar, setErrorBar] = useState("");          // subtle top error (non-balance errors)
  const [insuffOpen, setInsuffOpen] = useState(false);   // modal for insufficient funds

  const pool = useMemo(() => (currentRound ? Number(currentRound.pool || 0) : 0), [currentRound]);

  async function load() {
    if (!token) return;
    setLoading(true);
    setErrorBar("");
    try {
      // { round, entries, pool, fiatUsd }
      const cur = await fetchCurrentRound(token);
      setCurrentRound(cur.round || null);
      setEntries(cur.entries || []);
      setBal(Number(cur.fiatUsd || 0));
      const past = await fetchPastRounds(token, 50);
      setPastRounds(past.rounds || []);
    } catch (e) {
      setErrorBar(normalizeError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

  const doJoin = async () => {
    if (!token || joining) return;
    setJoining(true);
    setErrorBar("");
    try {
      const r = await joinLottery(token);
      setBal(Number(r.fiatUsd || 0));
      setCurrentRound(r.round || null);
      // friendly toast style feedback
      try {
        window?.dispatchEvent?.(new CustomEvent("toast", { detail: { type: "success", text: "You're in! Good luck 🍀" } }));
      } catch {}
      await load();
    } catch (e) {
      const msg = normalizeError(e);
      // Special case: insufficient balance → show modal
      if (/insufficient/i.test(msg)) {
        setInsuffOpen(true);
      } else {
        setErrorBar(msg);
      }
    } finally {
      setJoining(false);
    }
  };

  const timeUntilEnd = currentRound ? new Date(currentRound.resolvesAt) - new Date() : 0;
  const hoursUntilEnd = Math.max(0, Math.floor(timeUntilEnd / (1000 * 60 * 60)));
  const minutesUntilEnd = Math.max(0, Math.floor((timeUntilEnd % (1000 * 60 * 60)) / (1000 * 60)));

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8">
        <div className="mx-auto max-w-4xl px-4 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                $1 Lottery Game
              </h1>
              <p className="text-slate-400 mt-2">Join the pool for a chance to win big!</p>
            </div>
            <div className="glass p-4 rounded-2xl text-right min-w-[160px] backdrop-blur-sm border border-white/10">
              <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Your Balance</div>
              <div className="text-2xl font-bold text-white mt-1">${fmt(bal)}</div>
            </div>
          </div>

          {/* Error Alert */}
          {errorBar && (
            <div className="rounded-2xl border border-rose-400/30 bg-gradient-to-r from-rose-500/10 to-rose-600/10 p-4 text-sm text-rose-200 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {errorBar}
              </div>
            </div>
          )}

          {/* Main Pool Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 p-8 text-center backdrop-blur-sm border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
            <div className="relative z-10 space-y-4">
              <div className="text-sm uppercase tracking-widest text-slate-300 font-semibold">Current Pool</div>
              <div className="text-6xl md:text-7xl font-black bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                ${pool}
              </div>
              
              {currentRound && (
                <div className="flex items-center justify-center gap-4 text-slate-300">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">
                      {hoursUntilEnd}h {minutesUntilEnd}m
                    </span>
                  </div>
                  <div className="text-sm">
                    Ends: {new Date(currentRound.resolvesAt).toLocaleDateString()}
                  </div>
                </div>
              )}

              <button
                className="relative mt-6 px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg hover:from-green-600 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg disabled:shadow-none"
                disabled={joining || !token || bal < 1}
                onClick={doJoin}
                title={!token ? "Sign in to play" : bal < 1 ? "Insufficient balance" : undefined}
              >
                {joining ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Joining...
                  </div>
                ) : (
                  "Join for $1 🎯"
                )}
              </button>

              {bal < 1 && token && (
                <div className="flex items-center justify-center gap-2 text-amber-300 mt-2 text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  You need at least $1 to join the lottery
                </div>
              )}
            </div>
          </div>

          {/* Past Rounds Section */}
          <div className="glass rounded-2xl p-6 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <h2 className="text-xl font-bold text-white">Past Rounds</h2>
            </div>

            {!loading && pastRounds.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <p>No past rounds yet. Be the first to join!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {pastRounds.map((r, index) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        #{r.id}
                      </div>
                      <div>
                        <div className="font-semibold text-white">Pool: ${r.payout}</div>
                        <div className="text-xs text-slate-400">
                          {new Date(r.resolvesAt || r.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${
                      r.winner?.name || r.winnerUserId ? "text-emerald-400" : "text-slate-400"
                    }`}>
                      {r.winner?.name || (r.winnerUserId ? `User ${r.winnerUserId}` : "No winner")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-400">
            <div className="text-center p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="font-semibold text-white mb-1">How it works</div>
              <p>Pay $1 to enter. Winner takes the entire pool when the round ends.</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="font-semibold text-white mb-1">Fair & Transparent</div>
              <p>Random selection ensures everyone has an equal chance to win.</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="font-semibold text-white mb-1">Instant Payout</div>
              <p>Winnings are automatically transferred to your wallet.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insufficient balance modal */}
      <CenterModal
        open={insuffOpen}
        title="Insufficient Balance"
        onClose={() => setInsuffOpen(false)}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="font-semibold text-amber-300">Additional funds required</div>
              <div className="text-amber-200/80 text-sm">You need at least $1 to join the lottery</div>
            </div>
          </div>
          
          <p className="text-slate-300">Add funds to your wallet to participate in the lottery and stand a chance to win the current pool!</p>
          
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setInsuffOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => { setInsuffOpen(false); nav("/portfolio"); }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-medium"
            >
              Go to Wallet
            </button>
          </div>
        </div>
      </CenterModal>
    </>
  );
}