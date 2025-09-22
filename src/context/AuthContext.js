import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthAPI } from "../services/auth";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    AuthAPI.me(token).then((data) => {
      if (data.user) setUser(data.user);
    }).catch(() => {
      setToken("");
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    });
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { token: t, user: u } = await AuthAPI.login({ email, password });
      setToken(t); setUser(u);
      localStorage.setItem("token", t);
      localStorage.setItem("user", JSON.stringify(u));
      return u;
    } finally { setLoading(false); }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const { token: t, user: u } = await AuthAPI.register({ name, email, password });
      setToken(t); setUser(u);
      localStorage.setItem("token", t);
      localStorage.setItem("user", JSON.stringify(u));
      return u;
    } finally { setLoading(false); }
  };

  const logout = () => {
    setToken(""); setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthCtx.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
