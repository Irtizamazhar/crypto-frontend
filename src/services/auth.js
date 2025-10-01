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

  // Accepts URL (or "" to clear)
  async updateProfile({ name, avatar }) {
    return appReq("/auth/update-profile", { method: "PATCH", body: JSON.stringify({ name, avatar }) });
  },

  async changePassword({ currentPassword, newPassword }) {
    return appReq("/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
  },

  async forgotPassword(email) {
    return appReq("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
  },

  async magicLogin(token) {
    const res = await fetch(`${APP_API}/auth/magic-login?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    if (data?.token) setToken(data.token);
    return data;
  },

  // NEW: upload file -> returns { url }
  async uploadAvatar(file) {
    const fd = new FormData();
    fd.append("avatar", file);
    const t = getToken();
    const res = await fetch(`${APP_API}/auth/upload-avatar`, {
      method: "POST",
      headers: t ? { Authorization: `Bearer ${t}` } : {},
      body: fd,
    });
    if (!res.ok) throw new Error((await res.json())?.message || "Upload failed");
    return res.json(); // { url }
  },

  googleUrl: `${APP_API}/auth/google`,
  facebookUrl: `${APP_API}/auth/facebook`,
  appleUrl: `${APP_API}/auth/apple`,
};

export const WalletAPI = {
  async getTrc20Wallet() { return appReq("/wallet/trc20"); },
  async getBalance() { return appReq("/wallet/balance"); },
  async listDeposits() { return appReq("/deposits"); },
  async purchase({ amount_usdt, item_code }) {
    return appReq("/wallet/purchase", { method: "POST", body: JSON.stringify({ amount_usdt, item_code }) });
  }
};
