// src/components/admin/AdminLotteryPanel.jsx
import React, { useEffect, useState } from "react";
import {
  adminListRounds,
  adminRoundEntries,
  adminResolve,
} from "../../services/lottery";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLotteryPanel() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rounds, setRounds] = useState([]);
  const [error, setError] = useState("");

  const [activeRound, setActiveRound] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [resolving, setResolving] = useState(false);
  const [success, setSuccess] = useState("");

  const isAdmin = user && String(user.role || "").toLowerCase() === "admin";

  const loadRounds = async () => {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const r = await adminListRounds(token, { limit: 50 });
      setRounds(r.rounds || []);
    } catch (e) {
      setError(e?.message || "Failed to load rounds");
    } finally {
      setLoading(false);
    }
  };

  const openRound = async (round) => {
    setActiveRound(round);
    setParticipants([]);
    setSuccess("");
    if (!token) return;
    try {
      const r = await adminRoundEntries(token, round.id);
      setParticipants(r.entries || []);
    } catch (e) {
      setError(e?.message || "Failed to load participants");
    }
  };

  const pickWinner = async (winnerUserId) => {
    if (!token || !activeRound || resolving) return;
    setResolving(true); setError(""); setSuccess("");
    try {
      const r = await adminResolve(token, activeRound.id, { winnerUserId });
      setSuccess(`Resolved! Winner UserID: ${r.winnerUserId}, Payout: $${r.payout}`);
      await loadRounds();
      const re = await adminRoundEntries(token, activeRound.id);
      setParticipants(re.entries || []);
    } catch (e) {
      setError(e?.message || "Failed to resolve");
    } finally {
      setResolving(false);
    }
  };

  useEffect(() => { loadRounds(); }, [token]);

  if (!isAdmin) return <div className="text-sm text-rose-300">Admin only.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">🎯 Lottery (Admin)</h2>
        <button onClick={loadRounds} className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm">
          Refresh
        </button>
      </div>

      {error && <div className="text-rose-300 text-sm">{error}</div>}
      {success && <div className="text-emerald-300 text-sm">{success}</div>}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-4">
          <div className="font-semibold mb-2">Latest Rounds</div>
          {loading && <div className="text-slate-400 text-sm">Loading…</div>}
          {!loading && rounds.length === 0 && <div className="text-slate-400 text-sm">No rounds yet.</div>}
          <div className="space-y-2">
            {rounds.map(r => (
              <button
                key={r.id}
                onClick={() => openRound(r)}
                className={`w-full text-left rounded-lg border px-3 py-2 transition
                ${activeRound?.id === r.id ? "border-indigo-400/40 bg-indigo-400/5" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Round #{r.id}</div>
                  <div className="text-xs text-slate-400">
                    {r.resolved ? "Resolved" : "Open"} · Pool ${r.payout || (r.entries?.length || 0)}
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  Ends: {new Date(r.resolvesAt).toLocaleString()}
                </div>
                {r.winner && (
                  <div className="text-[12px] mt-1 text-emerald-300">
                    Winner: {r.winner.name || `User ${r.winner.id}`}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <div className="font-semibold mb-2">Participants</div>
          {!activeRound && <div className="text-slate-400 text-sm">Select a round to view participants</div>}

          {activeRound && (
            <>
              <div className="text-xs text-slate-400 mb-2">
                Round #{activeRound.id} · {activeRound.resolved ? "Resolved" : "Open"} · Pool ${activeRound.payout || (activeRound.entries?.length || 0)}
              </div>

              <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                <AnimatePresence initial={false}>
                  {participants.map(p => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <div className="text-sm">
                        {p.user?.name || `User ${p.userId}`} <span className="text-slate-400">· id {p.userId}</span>
                      </div>
                      <button
                        className="text-xs rounded-lg px-2 py-1 bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60"
                        onClick={() => pickWinner(p.userId)}
                        disabled={resolving || activeRound.resolved}
                      >
                        Pick as Winner
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {!participants.length && <div className="text-slate-400 text-sm">No entries yet.</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
