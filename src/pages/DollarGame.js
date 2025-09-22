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
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 shadow-xl">
        <div className="p-4 border-b border-white/10">
          <div className="text-base font-semibold">{title}</div>
        </div>
        <div className="p-4 text-sm text-slate-200">{children}</div>
        <div className="p-4 pt-0 flex justify-end gap-2">
          <button
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200"
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
        // Most projects already have a toast hub; if not, this is harmless.
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

  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">$1 Lottery Game</h1>
          <div className="glass p-3 rounded-xl text-right">
            <div className="text-xs text-slate-400">Your Balance</div>
            <div className="text-lg font-semibold">${fmt(bal)}</div>
          </div>
        </div>

        {errorBar && (
          <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 text-rose-200 p-3 text-sm">
            {errorBar}
          </div>
        )}

        <div className="glass p-6 rounded-2xl text-center space-y-3">
          <div className="text-sm text-slate-400">Current Pool</div>
          <div className="text-5xl font-extrabold">${pool}</div>
          {currentRound && (
            <div className="text-[11px] text-slate-500">
              Ends at {new Date(currentRound.resolvesAt).toLocaleString()}
            </div>
          )}
          <button
            className="btn-primary mt-4 disabled:opacity-60"
            disabled={joining || !token}
            onClick={doJoin}
            title={!token ? "Sign in to play" : undefined}
          >
            {joining ? "Joining…" : "Join for $1"}
          </button>
          {bal < 1 && token && (
            <div className="text-[11px] text-amber-300 mt-2">You need at least $1 to join.</div>
          )}
        </div>

        <div className="glass p-4 rounded-2xl">
          <div className="font-semibold mb-2">Past Rounds</div>
          {!loading && pastRounds.length === 0 && (
            <div className="text-slate-400 text-sm">No past rounds yet.</div>
          )}
          {pastRounds.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0"
            >
              <div className="text-sm">
                Round {r.id} · Pool ${r.payout}
              </div>
              <div
                className={`text-sm ${
                  r.winner?.name || r.winnerUserId ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                Winner: {r.winner?.name || (r.winnerUserId ? `User ${r.winnerUserId}` : "—")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insufficient balance modal */}
      <CenterModal
        open={insuffOpen}
        title="Insufficient balance"
        onClose={() => setInsuffOpen(false)}
      >
        <div className="space-y-3">
          <p>You need at least <span className="font-semibold">$1</span> in your wallet to join the lottery.</p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setInsuffOpen(false)}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={() => { setInsuffOpen(false); nav("/portfolio"); }}
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
            >
              Go to Wallet
            </button>
          </div>
        </div>
      </CenterModal>
    </>
  );
}
