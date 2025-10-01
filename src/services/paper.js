// src/services/paper.js
import { APP_API, getToken } from "./api";

/** Authed fetch helper (no call if no token) */
async function authedFetch(path, options = {}) {
  const token = typeof getToken === "function" ? getToken() : null;
  if (!token) {
    return { ok: false, status: 401, json: async () => ({ message: "Unauthorized" }) };
  }
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${APP_API}${path}`, { ...options, headers });
  return res;
}

// Shared impl so both `getRain()` and `rain()` work
async function _getRainImpl() {
  const token = getToken?.();
  if (!token) return { active: false };
  const res = await authedFetch("/paper/rain");
  if (!res.ok) return { active: false };
  return res.json();
}

export const PaperAPI = {
  /**
   * GET /paper/wallet
   * returns: { paper, fiatUsd, streak, lastClaimAt, tapCount?, userLevel? }
   */
  async wallet() {
    const token = getToken?.();
    if (!token) return { paper: 0, fiatUsd: 0, streak: 0, lastClaimAt: null };
    const res = await authedFetch("/paper/wallet");
    if (!res.ok) return { paper: 0, fiatUsd: 0, streak: 0, lastClaimAt: null };
    return res.json();
  },

  /**
   * POST /paper/claim-daily
   * returns: { paper, streak, reward, lastClaimAt }
   */
  async claimDaily() {
    const token = getToken?.();
    if (!token) return { paper: 0, streak: 0, reward: 0, lastClaimAt: null };
    const res = await authedFetch("/paper/claim-daily", { method: "POST", body: JSON.stringify({}) });
    if (!res.ok) {
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
    const token = getToken?.();
    if (!token) return { paper: 0 };
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
  async tap({ paperAmount = 0.01 } = {}) {
    const token = getToken?.();
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
   * POST /paper/tap-batch
   * body: { count: number, amount: number }
   * returns: { tapCount, userLevel, paper }
   */
  async tapBatch({ count = 0, amount = 0 } = {}) {
    const token = getToken?.();
    if (!token) return { tapCount: 0, userLevel: 0, paper: 0 };
    const res = await authedFetch("/paper/tap-batch", {
      method: "POST",
      body: JSON.stringify({ count, amount }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.message || `tapBatch failed (${res.status})`);
    }
    return res.json();
  },

  /**
   * GET /paper/history?page=1&limit=20
   * returns: { items, page, limit, total }
   */
  async history({ page = 1, limit = 20 } = {}) {
    const token = getToken?.();
    if (!token) return { items: [], page: 1, limit, total: 0 };
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) }).toString();
    const res = await authedFetch(`/paper/history?${qs}`);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.message || `history failed (${res.status})`);
    }
    return res.json();
  },

  // 🟡 Prize Rain (user)
  getRain: _getRainImpl, // preferred
  rain: _getRainImpl,    // alias for older UI calls

  async grabRain() {
    const token = getToken?.();
    if (!token) throw new Error("Login required");
    const res = await authedFetch("/paper/rain/grab", { method: "POST", body: JSON.stringify({}) });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.message || `grabRain failed (${res.status})`);
    }
    return res.json();
  },
};

// 🛡 Admin actions for Prize Rain
export const AdminPaperAPI = {
  async startRain({ amountPerGrab, totalDrops, durationSec }) {
    const res = await authedFetch("/admin/paper/rain/start", {
      method: "POST",
      body: JSON.stringify({ amountPerGrab, totalDrops, durationSec }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.message || `startRain failed (${res.status})`);
    }
    return res.json();
  },

  async stopRain() {
    const res = await authedFetch("/admin/paper/rain/stop", { method: "POST" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.message || `stopRain failed (${res.status})`);
    }
    return res.json();
  },
};
