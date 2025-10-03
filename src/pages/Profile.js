// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthAPI, APP_API } from "../services/api"; // ✅ use APP_API for upload path
import { Copy, Check, Upload, X } from "lucide-react";
import ReferralWidget from "../components/ReferralWidget";

export default function Profile() {
  const { user, refreshMe, getTrc20Wallet, token } = useAuth(); // ✅ pull wallet getter + token (auth guard)
  const nav = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || ""); // URL for preview
  const [avatarFile, setAvatarFile] = useState(null);

  // Wallet UI state
  const [address, setAddress] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletErr, setWalletErr] = useState("");
  const [copied, setCopied] = useState(false);

  // Password state
  const [pCurrent, setPCurrent] = useState("");
  const [pNew, setPNew] = useState("");
  const [pConfirm, setPConfirm] = useState("");

  // Form feedback
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) nav("/", { replace: true });
  }, [user, nav]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatarPreview(user.avatar || "");
      setAvatarFile(null);
    }
  }, [user]);

  // ✅ Fetch TRC20 wallet address (same flow as Home)
  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setWalletErr("");
      setWalletLoading(true);
      try {
        // Only call if authenticated
        if (!token) return;
        const w = await getTrc20Wallet(); // { address, trx, usdt }
        if (!mounted) return;
        setAddress(w?.address || "");
      } catch (e) {
        if (!mounted) return;
        setWalletErr(e?.message || "Failed to load wallet");
      } finally {
        if (mounted) setWalletLoading(false);
      }
    };

    run();
    return () => { mounted = false; };
  }, [getTrc20Wallet, token]);

  if (!user) return null;

  const onPickAvatar = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpeg|jpg|webp)$/i.test(f.type)) {
      setErr("Please choose a PNG, JPG or WEBP file.");
      return;
    }
    if (f.size > 3 * 1024 * 1024) {
      setErr("Please choose an image under 3 MB.");
      return;
    }
    setErr("");
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f)); // quick local preview
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(""); // will clear on save
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!name.trim()) { setErr("Name is required."); return; }

    setSavingProfile(true);
    try {
      let avatarUrl = avatarPreview;

      // ✅ Upload to /auth/upload-avatar using APP_API
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const res = await fetch(`${APP_API}/auth/upload-avatar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: formData,
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.message || "Upload failed");
        }
        const { url } = await res.json();
        avatarUrl = url;
        setAvatarPreview(url);
      }

      // If user removed avatar (no preview), send empty string to clear
      await AuthAPI.updateProfile({ name: name.trim(), avatar: avatarPreview ? avatarUrl : "" });
      await refreshMe();
      setMsg("Profile updated.");
      setAvatarFile(null);
    } catch (e) {
      setErr(e?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
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
    } finally {
      setSavingPass(false);
    }
  };

  const copyAddr = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-6">
      {/* Profile + Avatar */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        {(msg || err) && (
          <div className={`mt-3 text-sm ${msg ? "text-emerald-400" : "text-rose-400"}`}>{msg || err}</div>
        )}

        <form onSubmit={saveProfile} className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-400">Email</label>
            <div className="mt-1 px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10">{user.email}</div>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs text-slate-400">Avatar</label>
            <div className="mt-2 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-slate-900/60 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-slate-500">No image</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={onPickAvatar}
                  />
                </label>

                {avatarPreview && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              JPG, PNG, or WEBP • Max 3 MB • Square looks best (e.g., 512×512)
            </div>
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

          {/* TRC20 Wallet */}
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-400">TRC20 Wallet Address</label>
            <div className="mt-1 flex items-stretch gap-2">
              <div className="flex-1 px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 break-all">
                {walletLoading ? "Loading…" : (walletErr ? "—" : (address || "—"))}
              </div>
              <button
                type="button"
                onClick={copyAddr}
                disabled={!address || walletLoading || !!walletErr}
                className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-50"
                title="Copy"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {walletErr && (
              <div className="mt-1 text-[11px] text-rose-400">
                {walletErr}
              </div>
            )}
            <div className="mt-1 text-[11px] text-slate-400">
              Used for on-chain deposits/withdrawals and identity.
            </div>
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

      {/* 🔥 Referral block */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold">Invite & Earn</h2>
        <p className="text-slate-400 text-sm mt-1">
          Share your link. You get <b>+100 Paper</b> per signup. They get <b>+20 Paper</b>.
        </p>
        <div className="mt-4">
          <ReferralWidget />
        </div>
      </div>

      {/* Change password */}
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
