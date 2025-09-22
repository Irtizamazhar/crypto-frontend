// src/components/LotteryWidget.jsx
import React, { useEffect, useState } from "react";
import { joinLottery, fetchCurrentRound, fetchPastRounds } from "../services/lottery";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function LotteryWidget() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [fiatUsd, setFiatUsd] = useState(null);
  const [pool, setPool] = useState(0);
  const [currentRound, setCurrentRound] = useState(null);
  const [entries,   setEntries]   = useState([]);
  const [past, setPast] = useState([]);

  const load = async () => {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const cur = await fetchCurrentRound(token);
      setCurrentRound(cur.round || null);
      setEntries(cur.entries || []);
      setPool(cur.pool || 0);

      const prv = await fetchPastRounds(token, 20);
      setPast(prv.rounds || []);
    } catch (e) {
      setError(e?.message || "Failed to load lottery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const join = async () => {
    if (!token || joining) return;
    setJoining(true); setError("");
    try {
      const r = await joinLottery(token);
      setFiatUsd(r.fiatUsd);
      setPool(r.pool || 0);
      setCurrentRound(r.round || null);
      // refresh list
      load();
    } catch (e) {
      setError(e?.message || "Join failed");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">💵 $1 Daily Lottery</h2>
        {fiatUsd !== null && (
          <div className="text-xs text-slate-400">Your Balance: <span className="text-slate-200">${Number(fiatUsd).toFixed(2)}</span></div>
        )}
      </div>

      {error && <div className="text-rose-300 text-sm">{error}</div>}

      <div className="rounded-xl border border-white/10 p-4 bg-white/5">
        <div className="text-slate-400 text-sm">Current Pool</div>
        <div className="text-4xl font-extrabold mt-1">${pool}</div>
        <div className="text-[11px] text-slate-500 mt-1">
          {currentRound
            ? <>Ends at {new Date(currentRound.resolvesAt).toLocaleString()}</>
            : <>A new round will open automatically</>}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          className="mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 disabled:opacity-60"
          onClick={join}
          disabled={joining || !token}
        >
          {joining ? "Joining..." : "Join for $1"}
        </motion.button>
      </div>

      <div>
        <div className="font-semibold mb-2">🏆 Recent Winners</div>
        {!loading && (!past || past.length === 0) && (
          <div className="text-slate-400 text-sm">No past rounds yet.</div>
        )}
        <div className="space-y-2">
          {past.map(r => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-sm">
                Round #{r.id} · Pool ${r.payout}
              </div>
              <div className="text-sm">
                {r.winner
                  ? <span className="text-emerald-300">Winner: {r.winner.name || `User ${r.winner.id}`}</span>
                  : <span className="text-slate-400">Pending</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
