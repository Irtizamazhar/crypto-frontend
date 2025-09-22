import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const { token, user } = useAuth();

  useEffect(() => {
    const tokenQ = sp.get("token");
    const err = sp.get("error");
    if (err) { alert("Social login failed: " + err); nav("/login"); return; }
    if (tokenQ) {
      localStorage.setItem("token", tokenQ);
      // force refresh by reloading; or fetch /auth/me and set user here.
      window.location.href = "/dashboard";
    } else if (token) {
      nav("/dashboard");
    } else {
      nav("/login");
    }
  }, [sp, nav, token, user]);

  return <div className="min-h-screen grid place-items-center">Finishing sign in…</div>;
}
