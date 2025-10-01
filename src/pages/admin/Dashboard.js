// src/pages/admin/Dashboard.js
import React, { useEffect, useState } from "react";
import { BarChart3, Wallet, Users, CreditCard, Download, Upload, Coins, Settings, ShieldCheck, LayoutList } from "lucide-react";
import { Gift } from "lucide-react";
import Overview from "./Overview";
import Accounts from "./Accounts";
import UsersPage from "./Users";
import Payments from "./Payments";
import Withdrawals from "./Withdrawals";
import Deposits from "./Deposits";
import EarnPaper from "./EarnPaper";
import TapLeaderboard from "./TapLeaderboard";
import AdminLotteryPanel from "./AdminLotteryPanel";
import { AdminAPI } from "../../services/admin";

function TabButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm border transition
      ${active ? "bg-white/10 border-white/15" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [authMsg, setAuthMsg] = useState("");

  // Guard: ensure current user is admin
  useEffect(() => {
    (async () => {
      try {
        const j = await AdminAPI.me();
        const role = String(j?.user?.role || "").toLowerCase();
        if (role !== "admin") setAuthMsg("Unauthorized — admin only.");
      } catch (e) {
        setAuthMsg(e?.message || "Unauthorized");
      }
    })();
  }, []);

  const tabs = [
    { id: "overview", label: "Overview", icon: <BarChart3 size={16} /> },
    { id: "accounts", label: "Accounts", icon: <Wallet size={16} /> },
    { id: "tap", label: "Tap Leaderboard", icon: <LayoutList size={16} /> },
    { id: "lottery", label: "Lottery", icon: <Gift size={16} /> },
    { id: "users", label: "Users", icon: <Users size={16} /> },
    { id: "payments", label: "Payments", icon: <CreditCard size={16} /> },
    { id: "withdrawals", label: "Withdrawals", icon: <Download size={16} /> },
    { id: "deposits", label: "Deposits", icon: <Upload size={16} /> },
    { id: "paper", label: "Earn Paper", icon: <Coins size={16} /> },
    { id: "settings", label: "Settings", icon: <Settings size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-white/10 bg-slate-900/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 grid place-items-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="text-lg font-bold">Admin Dashboard</div>
              <div className="text-xs text-slate-400 -mt-0.5">CryptoSense • Manage users, payments & accounts</div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {tabs.map((tabItem) => (
              <TabButton
                key={tabItem.id}
                icon={tabItem.icon}
                label={tabItem.label}
                active={tab === tabItem.id}
                onClick={() => setTab(tabItem.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {authMsg && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-200 p-3 text-sm">
            {authMsg}
          </div>
        )}

        {!authMsg && (
          <>
            {tab === "overview" && <Overview />}
            {tab === "accounts" && <Accounts />}
            {tab === "tap" && <TapLeaderboard />}
            {tab === "lottery" && <AdminLotteryPanel />}
            {tab === "users" && <UsersPage />}
            {tab === "payments" && <Payments />}
            {tab === "withdrawals" && <Withdrawals />}
            {tab === "deposits" && <Deposits />}
            {tab === "paper" && <EarnPaper />}
            {tab === "settings" && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold">General Settings</div>
                <p className="text-sm text-slate-400 mt-1">
                  Add general admin settings here later (e.g., maintenance mode, feature flags).
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
