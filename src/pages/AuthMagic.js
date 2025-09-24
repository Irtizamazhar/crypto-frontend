import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AuthAPI } from "../services/auth";
import { useAuth } from "../context/AuthContext";

export default function AuthMagic() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { setUser } = useAuth();
  const [state, setState] = useState("processing"); // processing | ok | err
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) { setState("err"); setMsg("Missing token"); return; }
    (async () => {
      try {
        const { token: t, user } = await AuthAPI.magicLogin(token);
        if (!t || !user) throw new Error("Invalid token");
        localStorage.setItem("token", t);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
        setState("ok");
        setTimeout(() => nav("/profile", { replace: true }), 900);
      } catch (e) {
        setState("err");
        setMsg("Link expired or invalid. Please request a new one.");
      }
    })();
  }, [params, nav, setUser]);

  return (
    <div className="min-h-[50vh] grid place-items-center p-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        {state === "processing" && <div>Signing you in…</div>}
        {state === "ok" && <div className="text-emerald-400">Signed in! Redirecting to Profile…</div>}
        {state === "err" && <div className="text-rose-400">{msg}</div>}
      </div>
    </div>
  );
}
