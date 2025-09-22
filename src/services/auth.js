// src/services/auth.js
import { APP_API, appReq, setToken, getToken } from "./api";

export const AuthAPI = {
  async register({ name, email, password }) {
    const data = await appReq("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    if (data?.token) setToken(data.token);
    return data;
  },

  async login({ email, password }) {
    const data = await appReq("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data?.token) setToken(data.token);
    return data;
  },

  async me(tokenOverride) {
    const t = tokenOverride || getToken();
    return fetch(`${APP_API}/auth/me`, {
      headers: t ? { Authorization: `Bearer ${t}` } : {},
    }).then((r) => r.json());
  },

  googleUrl: `${APP_API}/auth/google`,
  facebookUrl: `${APP_API}/auth/facebook`,
  appleUrl: `${APP_API}/auth/apple`,
};
