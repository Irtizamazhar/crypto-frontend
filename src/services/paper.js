// src/services/paper.js
import { APP_API, getToken } from "./api";

/**
 * Internal: do an authenticated fetch. If no token, don't hit the server.
 */
async function authedFetch(path, options = {}) {
  const token = typeof getToken === "function" ? getToken() : null;
  if (!token) {
    // No token → behave like guest; don't call the server.
    return {
      ok: false,
      status: 401,
      json: async () => ({ message: "Unauthorized" }),
    };
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${APP_API}${path}`, { ...options, headers });
  return res;
}

export const PaperAPI = {
  /**
   * GET /paper/wallet
   * returns: { paper, fiatUsd, streak, lastClaimAt, tapCount?, userLevel? }
   */
  async wallet() {
    const token = typeof getToken === "function" ? getToken() : null;
    if (!token) {
      // Guest defaults
      return { paper: 0, fiatUsd: 0, streak: 0, lastClaimAt: null };
    }
    const res = await authedFetch("/paper/wallet", { method: "GET" });
    if (!res.ok) {
      if (res.status === 401) {
        return { paper: 0, fiatUsd: 0, streak: 0, lastClaimAt: null };
      }
      throw new Error(`wallet failed (${res.status})`);
    }
    return res.json();
  },

  /**
   * POST /paper/claim-daily
   * returns: { paper, streak, reward, lastClaimAt }
   */
  async claimDaily() {
    const token = typeof getToken === "function" ? getToken() : null;
    if (!token) {
      // Guest: do nothing on server; caller should handle local fallback
      return { paper: 0, streak: 0, reward: 0, lastClaimAt: null };
    }
    const res = await authedFetch("/paper/claim-daily", { method: "POST", body: JSON.stringify({}) });
    if (!res.ok) {
      if (res.status === 401) return { paper: 0, streak: 0, reward: 0, lastClaimAt: null };
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.message || `claimDaily failed (${res.status})`);
    }
    return res.json();
  },

  /**
   * POST /paper/earn
   * body: { type: string, amount: number, note?: string }
   * returns: { paper }
   */
  async earn({ type = "manual", amount = 0, note = "" } = {}) {
    const token = typeof getToken === "function" ? getToken() : null;
    if (!token) return { paper: 0 }; // guest: ignore
    const res = await authedFetch("/paper/earn", {
      method: "POST",
      body: JSON.stringify({ type, amount, note }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.message || `earn failed (${res.status})`);
    }
    return res.json();
  },

  /**
   * POST /paper/tap
   * body: { paperAmount?: number }
   * returns: { tapCount, userLevel, paper }
   */
  async tap({ paperAmount = 0 } = {}) {
    const token = typeof getToken === "function" ? getToken() : null;
    if (!token) return { tapCount: 0, userLevel: 0, paper: 0 };
    const res = await authedFetch("/paper/tap", {
      method: "POST",
      body: JSON.stringify({ paperAmount }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.message || `tap failed (${res.status})`);
    }
    return res.json();
  },

  /**
   * GET /paper/history?page=1&limit=20
   * returns: { items, page, limit, total }
   */
  async history({ page = 1, limit = 20 } = {}) {
    const token = typeof getToken === "function" ? getToken() : null;
    if (!token) return { items: [], page: 1, limit, total: 0 };
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) }).toString();
    const res = await authedFetch(`/paper/history?${qs}`, { method: "GET" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.message || `history failed (${res.status})`);
    }
    return res.json();
  },
};
