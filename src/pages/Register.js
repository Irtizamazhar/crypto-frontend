import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthAPI } from "../services/auth";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaApple } from "react-icons/fa";

export default function Register() {
  const nav = useNavigate();
  const { register, loading } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await register(form.name, form.email, form.password);
      nav("/dashboard");
    } catch (e) {
      setErr(e.message || "Registration failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4">
      <div className="w-full max-w-md bg-slate-900/70 border border-white/10 p-8 rounded-2xl shadow-xl backdrop-blur">
        <h1 className="text-3xl font-extrabold text-center mb-6">Create Account</h1>
        <p className="text-center text-slate-400 mb-6">Join us and get started in seconds</p>

        {err && <div className="mb-4 text-red-400 text-sm text-center">{err}</div>}

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-semibold disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-2">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-slate-400">OR</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid gap-3">
          <a
            href={AuthAPI.googleUrl}
            className="flex items-center justify-center gap-2 py-2 rounded-lg bg-white text-slate-900 font-medium hover:bg-slate-200 transition"
          >
            <FcGoogle size={20} /> Continue with Google
          </a>
          <a
            href={AuthAPI.facebookUrl}
            className="flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            <FaFacebook size={20} /> Continue with Facebook
          </a>
          <a
            href={AuthAPI.appleUrl}
            className="flex items-center justify-center gap-2 py-2 rounded-lg bg-black text-white font-medium hover:bg-slate-800 transition"
          >
            <FaApple size={20} /> Continue with Apple
          </a>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
