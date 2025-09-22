import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!user) nav("/", { replace: true }); }, [user, nav]);
  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><div className="text-xs text-slate-400">Name</div><div className="mt-1">{user.name}</div></div>
          <div><div className="text-xs text-slate-400">Email</div><div className="mt-1">{user.email}</div></div>
          <div><div className="text-xs text-slate-400">Role</div><div className="mt-1">{user.role || "user"}</div></div>
        </div>
      </div>
    </div>
  );
}
