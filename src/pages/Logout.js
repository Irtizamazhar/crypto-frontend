import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
export default function Logout() {
  const { logout } = useAuth();
  useEffect(() => { logout(); window.location.href = "/"; }, [logout]);
  return <div className="min-h-screen grid place-items-center">Signing out…</div>;
}
