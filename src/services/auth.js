// src/services/auth.js
import { APP_API, appReq, setToken, getToken } from "./api";

export const AuthAPI = {
  async register({ name, email, password }) {
    const data = await appReq("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
    if (data?.token) setToken(data.token);
    return data;
  },
  async login({ email, password }) {
    const data = await appReq("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    if (data?.token) setToken(data.token);
    return data;
  },
  async me(tokenOverride) {
    const t = tokenOverride || getToken();
    return fetch(`${APP_API}/auth/me`, { headers: t ? { Authorization: `Bearer ${t}` } : {} }).then(r => r.json());
  },
  async updateProfile({ name }) {
    return appReq("/auth/update-profile", { method: "PATCH", body: JSON.stringify({ name }) });
  },
  async changePassword({ currentPassword, newPassword }) {
    return appReq("/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
  },

  // ✅ NEW
  async forgotPassword(email) {
    return appReq("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
  },
  async magicLogin(token) {
    const res = await fetch(`${APP_API}/auth/magic-login?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    if (data?.token) setToken(data.token);
    return data;
  },

  googleUrl: `${APP_API}/auth/google`,
  facebookUrl: `${APP_API}/auth/facebook`,
  appleUrl: `${APP_API}/auth/apple`,
};
