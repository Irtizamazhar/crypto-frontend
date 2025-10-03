// src/services/referral.js
import { APP_API, getToken } from "./api";

async function authedFetch(path, options = {}) {
  const token = typeof getToken === "function" ? getToken() : null;
  if (!token) throw new Error("Unauthorized");
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${APP_API}${path}`, { ...options, headers });
  return res;
}

export const ReferralAPI = {
  async mine() {
    const res = await authedFetch("/referral/mine");
    if (!res.ok) throw new Error("Failed to load referral");
    return res.json();
  },
};
