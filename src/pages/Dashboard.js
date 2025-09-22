import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale } from "chart.js";
import { fmt } from "../utils/format";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale);

const WALLET_KEY = "usd_wallet_v1";
const POS_KEY = "usd_positions_v1";

function readWallet() {
  const n = Number(localStorage.getItem(WALLET_KEY));
  return Number.isFinite(n) ? n : 1000;
}
function readPositions() {
  try {
    return JSON.parse(localStorage.getItem(POS_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function Dashboard() {
  const [wallet, setWallet] = useState(readWallet());
  const [positions, setPositions] = useState(readPositions());

  useEffect(() => {
    const i = setInterval(() => {
      setWallet(readWallet());
      setPositions(readPositions());
    }, 2000);
    return () => clearInterval(i);
  }, []);

  const hist = positions.filter((p) => p.settled).slice(-20);
  const pnl = hist.reduce((acc, p) => acc + ((p.payout || 0) - p.amount), 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">Your Dashboard</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass p-4 rounded-xl">
          <div className="text-slate-400 text-sm">Balance</div>
          <div className="text-2xl font-bold">${fmt(wallet)}</div>
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="text-slate-400 text-sm">PnL</div>
          <div className={`text-2xl font-bold ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {pnl >= 0 ? "+" : ""}
            {fmt(pnl)}
          </div>
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="text-slate-400 text-sm">Trades</div>
          <div className="text-2xl font-bold">{positions.length}</div>
        </div>
      </div>

      {/* Chart */}
      {hist.length > 0 && (
        <div className="glass p-4 rounded-xl">
          <h2 className="font-semibold mb-3">Recent Wallet History</h2>
          <Line
            data={{
              labels: hist.map((p) => new Date(p.settledTs).toLocaleDateString()),
              datasets: [
                {
                  label: "Payout",
                  data: hist.map((p) => p.payout || 0),
                  borderColor: "rgb(34,197,94)",
                },
              ],
            }}
          />
        </div>
      )}
    </div>
  );
}
