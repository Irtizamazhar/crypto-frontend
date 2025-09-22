import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const nav = useNavigate();
  const { login, logout, loading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const user = await login(form.email, form.password); // uses /auth/login
      const role = String(user?.role || "").toLowerCase();
      if (role !== "admin") {
        // signed in but not an admin → sign back out of app context
        logout();
        throw new Error("This account is not an admin.");
      }
      // ✅ OK: route into admin dashboard
      nav("/admin", { replace: true });
    } catch (e) {
      setErr(e.message || "Admin sign-in failed");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold mb-2">Admin Sign in</h1>
        <p className="text-sm text-slate-400 mb-4">Use your admin credentials to continue.</p>

        {err && (
          <div className="mb-3 rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-sm text-rose-200">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400">Admin Email</label>
            <input
              className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 mt-1"
              placeholder="email@company.com"
              type="email"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Password</label>
            <input
              className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 mt-1"
              placeholder="••••••••"
              type="password"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              required
            />
          </div>

          <button
            className="w-full py-2 rounded bg-gradient-to-r from-orange-500 to-rose-500 text-white font-medium hover:opacity-95 disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Signing in…" : "Sign in to Admin"}
          </button>
        </form>

        <div className="mt-4 text-sm text-slate-400">
          Not an admin?{" "}
          <Link to="/login" className="text-indigo-300 hover:text-indigo-200 underline">
            Go back
          </Link>
        </div>
      </div>
    </div>
  );
}
