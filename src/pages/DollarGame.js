import React, { useEffect, useMemo, useState } from "react";
import { fmt } from "../utils/format";

const STORE_KEY = "lottery_entries";
const BAL_KEY = "lottery_balance";

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || [];
  } catch {
    return [];
  }
}
function saveEntries(arr) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(arr));
  } catch {}
}

function loadBal() {
  const v = Number(localStorage.getItem(BAL_KEY));
  return Number.isFinite(v) ? v : 10; // start with $10 demo credits
}
function saveBal(v) {
  try {
    localStorage.setItem(BAL_KEY, String(v));
  } catch {}
}

export default function DollarGame() {
  const [entries, setEntries] = useState(loadEntries());
  const [bal, setBal] = useState(loadBal());
  const [drawing, setDrawing] = useState(false);

  // check if there’s a current round
  const currentRound = useMemo(() => {
    if (!entries.length) return null;
    const open = entries.find((e) => !e.resolved);
    return open || null;
  }, [entries]);

  const pool = currentRound
    ? currentRound.players.length
    : 0;

  // join game (stake $1)
  const join = () => {
    if (bal < 1) return;
    let round = currentRound;
    if (!round) {
      round = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        resolvesAt: Date.now() + 24 * 60 * 60 * 1000,
        players: [],
        resolved: false,
        winner: null,
      };
    }
    const player = { id: crypto.randomUUID(), name: "You" }; // in real app, use account/userId
    round.players.push(player);

    const next = currentRound
      ? entries.map((r) => (r.id === round.id ? round : r))
      : [round, ...entries];
    setEntries(next);
    saveEntries(next);

    const nb = bal - 1;
    setBal(nb);
    saveBal(nb);
  };

  // resolve round if time has passed
  const resolve = (round) => {
    if (round.resolved || Date.now() < round.resolvesAt) return;
    if (!round.players.length) return;

    const winnerIndex = Math.floor(Math.random() * round.players.length);
    const winner = round.players[winnerIndex];
    const payout = round.players.length; // winner takes whole pool

    const updated = {
      ...round,
      resolved: true,
      winner,
      payout,
    };
    const next = entries.map((r) => (r.id === round.id ? updated : r));
    setEntries(next);
    saveEntries(next);

    // if you’re the winner, add balance
    if (winner.name === "You") {
      const nb = bal + payout;
      setBal(nb);
      saveBal(nb);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (currentRound && !currentRound.resolved) {
        resolve(currentRound);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [currentRound, entries, bal]);

  const resolvedRounds = entries.filter((e) => e.resolved);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-4xl font-black tracking-tight">$1 Lottery Game</h1>
        <div className="glass p-3 rounded-xl text-right">
          <div className="text-xs text-slate-400">Your Balance</div>
          <div className="text-lg font-semibold">${fmt(bal)}</div>
          <button
            className="btn-ghost text-xs mt-1"
            onClick={() => {
              const nb = bal + 1;
              setBal(nb);
              saveBal(nb);
            }}
          >
            + $1 faucet
          </button>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl text-center space-y-3">
        <div className="text-sm text-slate-400">Current Pool</div>
        <div className="text-5xl font-extrabold">${pool}</div>
        {currentRound && (
          <div className="text-[11px] text-slate-500">
            Ends at {new Date(currentRound.resolvesAt).toLocaleString()}
          </div>
        )}
        <button
          className="btn-primary mt-4"
          disabled={bal < 1}
          onClick={join}
        >
          Join for $1
        </button>
      </div>

      <div className="glass p-4 rounded-2xl">
        <div className="font-semibold mb-2">Past Rounds</div>
        {!resolvedRounds.length && (
          <div className="text-slate-400 text-sm">No past rounds yet.</div>
        )}
        {resolvedRounds.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0"
          >
            <div className="text-sm">
              Round {r.id.slice(0, 5)} · Pool ${r.payout}
            </div>
            <div
              className={`text-sm ${
                r.winner?.name === "You"
                  ? "text-emerald-400"
                  : "text-slate-400"
              }`}
            >
              Winner: {r.winner?.name}
            </div>
          </div>
        ))}
      </div>

      <div className="text-[11px] text-slate-500">
        Educational demo only. LocalStorage keeps balance and rounds. Not real money.
      </div>
    </div>
  );
}
