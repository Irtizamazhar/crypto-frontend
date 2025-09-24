import React, { useState } from "react";
import { AuthAPI } from "../services/auth";
import { Link } from "react-router-dom";

export default function AuthForgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setMsg(""); setBusy(true);
    try {
      const res = await AuthAPI.forgotPassword(email);
      setSent(true);
      if (res?.devLink) setDevLink(res.devLink);
      setMsg("If an account exists, a sign-in link has been sent.");
    } catch (e) {
      setErr(e?.message || "Failed to send link");
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold">Forgot password</h1>
        <p className="text-sm text-slate-400 mt-1">
          We’ll email you a magic sign-in link. After you’re in, change your password on <b>Profile</b>.
        </p>

        {msg && <div className="mt-3 text-sm text-emerald-400">{msg}</div>}
        {err && <div className="mt-3 text-sm text-rose-400">{err}</div>}

        {!sent && (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs text-slate-400">Email</label>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
                type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required
              />
            </div>
            <button
              className="w-full px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
              disabled={busy}
            >
              {busy ? "Sending…" : "Send sign-in link"}
            </button>
          </form>
        )}

        {devLink && (
          <div className="mt-4 text-xs text-slate-400">
            <div className="mb-1 font-medium text-slate-300">Dev link (local only):</div>
            <a className="text-indigo-300 break-all underline" href={devLink}>{devLink}</a>
          </div>
        )}

        <div className="mt-6 text-sm">
          <Link className="text-indigo-300 hover:underline" to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
