// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthAPI } from "../services/auth";

export default function Profile() {
  const { user, refreshMe } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [pCurrent, setPCurrent] = useState("");
  const [pNew, setPNew] = useState("");
  const [pConfirm, setPConfirm] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => { if (!user) nav("/", { replace: true }); }, [user, nav]);
  useEffect(() => { if (user) setName(user.name || ""); }, [user]);
  if (!user) return null;

  async function saveProfile(e) {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!name.trim()) { setErr("Name is required."); return; }
    setSavingProfile(true);
    try {
      await AuthAPI.updateProfile({ name: name.trim() });
      await refreshMe();
      setMsg("Profile updated.");
    } catch (e) {
      setErr(e?.message || "Failed to update profile");
    } finally { setSavingProfile(false); }
  }

  async function changePassword(e) {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!pCurrent || !pNew) { setErr("Fill out all password fields."); return; }
    if (pNew !== pConfirm) { setErr("New passwords do not match."); return; }
    setSavingPass(true);
    try {
      await AuthAPI.changePassword({ currentPassword: pCurrent, newPassword: pNew });
      setMsg("Password changed.");
      setPCurrent(""); setPNew(""); setPConfirm("");
    } catch (e) {
      setErr(e?.message || "Failed to change password");
    } finally { setSavingPass(false); }
  }

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        {(msg || err) && (
          <div className={`mt-3 text-sm ${msg ? "text-emerald-400" : "text-rose-400"}`}>{msg || err}</div>
        )}

        <form onSubmit={saveProfile} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-400">Email</label>
            <div className="mt-1 px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10">{user.email}</div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="name" className="text-xs text-slate-400">Name</label>
            <input
              id="name"
              className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <button
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition disabled:opacity-60"
              disabled={savingProfile || !name.trim()}
            >
              {savingProfile ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold">Change Password</h2>
        <form onSubmit={changePassword} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-400">Current password</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none"
              type="password" value={pCurrent} onChange={(e)=>setPCurrent(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">New password</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none"
              type="password" value={pNew} onChange={(e)=>setPNew(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Confirm new password</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none"
              type="password" value={pConfirm} onChange={(e)=>setPConfirm(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition disabled:opacity-60"
              disabled={savingPass || !pCurrent || !pNew || pNew !== pConfirm}
            >
              {savingPass ? "Updating…" : "Change password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
