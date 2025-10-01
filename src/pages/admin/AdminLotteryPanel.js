import React, { useEffect, useMemo, useState } from "react";
import { LotteryAPI } from "../../services/admin";
import { Wallet, Crown, RefreshCcw } from "lucide-react";

const TIERS = [1, 5, 10];

function TierTab({ tier, active, onClick }) {
  return (
    <button
      onClick={() => onClick(tier)}
      className={`px-3 py-1.5 rounded-xl text-sm border ${
        active ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 hover:bg-white/10"
      }`}
    >
      ${tier} game
    </button>
  );
}

export default function AdminLotteryPanel() {
  const [tier, setTier] = useState(1);
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState(null);
  const [entries, setEntries] = useState([]);
  const [pool, setPool] = useState(0);
  const [winner, setWinner] = useState(null);
  const [payout, setPayout] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const c = await LotteryAPI.current(tier);
      setRound(c.round);
      setEntries(c.entries || []);
      setPool(Number(c.pool || 0));
      setWinner(null);
      setPayout(String(c.pool || 0));
    } catch (e) {
      setMsg(e.message || "Failed to load current round.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tier]);

  const totalPlayers = useMemo(() => entries.length, [entries]);

  async function onResolve() {
    if (!round) return;
    if (!winner) { setMsg("Pick a winner."); return; }

    setMsg("");
    try {
      await LotteryAPI.resolveRound(round.id, {
        winnerUserId: winner,
        payout: Number(payout || pool || 0),
      });
      setMsg("Round resolved. Payout submitted. If the wallet signer is online, it’s already sent; otherwise it’s queued.");
      await load();
    } catch (e) {
      setMsg(e.message || "Resolve failed.");
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {TIERS.map(t => (
            <TierTab key={t} tier={t} active={tier===t} onClick={setTier} />
          ))}
        </div>
        <button
          onClick={load}
          className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center gap-2 text-sm"
          title="Refresh"
        >
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        {loading ? (
          <div className="text-slate-400 text-sm">Loading…</div>
        ) : round ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Current Round</div>
                <div className="font-semibold">#{round.id} • resolves {new Date(round.resolvesAt).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Pool</div>
                <div className="text-2xl font-bold flex items-center justify-end gap-2">
                  <Wallet size={18} /> {(pool).toFixed(2)} USDT
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left px-3 py-2">Winner?</th>
                    <th className="text-left px-3 py-2">User</th>
                    <th className="text-left px-3 py-2">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length ? entries.map((e) => (
                    <tr key={e.id} className="border-b border-white/5">
                      <td className="px-3 py-2"><input type="radio" name="winner" onChange={()=>setWinner(e.userId)} /></td>
                      <td className="px-3 py-2">{e.user?.name || "—"}</td>
                      <td className="px-3 py-2">{e.user?.email || "—"}</td>
                    </tr>
                  )) : (
                    <tr><td className="px-3 py-3 text-slate-400" colSpan={3}>No entries yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-end gap-3">
              <label className="text-sm">
                Payout (USDT)
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg"
                  value={payout}
                  onChange={(e)=>setPayout(e.target.value)}
                  placeholder={String(pool)}
                />
              </label>
              <button
                onClick={onResolve}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-2"
                disabled={!entries.length}
              >
                <Crown size={16}/> Resolve & Pay
              </button>
            </div>
          </>
        ) : (
          <div className="text-slate-400 text-sm">No round</div>
        )}
      </div>

      {msg && <div className="text-xs text-amber-200">{msg}</div>}
    </div>
  );
}
