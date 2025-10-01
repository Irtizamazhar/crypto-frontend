import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthAPI, WalletAPI, getToken, clearToken } from "../services/api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken() || "");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize auth state on app start
  useEffect(() => {
    const initAuth = async () => {
      const currentToken = getToken();
      if (currentToken) {
        try {
          const data = await AuthAPI.me();
          if (data?.user) {
            setUser(data.user);
            localStorage.setItem("user", JSON.stringify(data.user));
            setTokenState(currentToken);
          } else {
            clearToken();
            setUser(null);
            setTokenState("");
          }
        } catch (error) {
          console.error("❌ Auth initialization failed:", error);
          clearToken();
          setUser(null);
          setTokenState("");
        }
      }
      setInitialized(true);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // AuthAPI.login persists the token via services/api
      const { token: newToken, user: userData } = await AuthAPI.login({ email, password });
      setTokenState(newToken || getToken() || "");
      setUser(userData || null);
      if (userData) localStorage.setItem("user", JSON.stringify(userData));
      return userData;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      // AuthAPI.register persists the token via services/api
      const { token: newToken, user: userData, address } = await AuthAPI.register({ name, email, password });
      setTokenState(newToken || getToken() || "");
      setUser(userData || null);
      if (userData) localStorage.setItem("user", JSON.stringify(userData));
      return { user: userData, address };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setTokenState("");
    setUser(null);
    clearToken();
  };

  const refreshMe = async () => {
    try {
      const data = await AuthAPI.me();
      if (data?.user) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        return data.user;
      }
      // If the token is invalid, force logout
      logout();
      return null;
    } catch (error) {
      logout();
      throw error;
    }
  };

  const getTrc20Wallet = async () => {
    if (!token) throw new Error("Not authenticated");
    try {
      const data = await WalletAPI.getTrc20Wallet();
      return data;
    } catch (error) {
      console.error("Error fetching TRC20 wallet:", error);
      throw error;
    }
  };

  const value = {
    token,
    user,
    loading,
    initialized,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    refreshMe,
    setUser,
    getTrc20Wallet,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
