// src/services/admin.js
import { APP_API, getToken } from "./api";

/** Build an absolute API URL safely (handles missing leading slash) */
function urlFor(path) {
  return `${APP_API}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Authenticated fetch that throws on non-2xx (with nicer admin messages) */
async function authed(path, options = {}) {
  const token = typeof getToken === "function" ? getToken() : null;
  if (!token) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  // Only set JSON content-type if we’re sending a non-GET with a plain body
  const isGet = !options.method || options.method.toUpperCase() === "GET";
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isGet && !headers.has("Content-Type") && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(urlFor(path), { ...options, headers });

  // 204 No Content safety
  if (res.status === 204) return null;

  // Try to parse JSON if available, otherwise fall back to text
  let data = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { data = await res.json(); } catch { data = null; }
  } else {
    try { data = await res.text(); } catch { data = null; }
  }

  if (!res.ok) {
    const message =
      res.status === 401 ? "Unauthorized" :
      res.status === 403 ? "Forbidden — admin only" :
      (data && data.message) || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  // Normalize to object for callers expecting JSON
  return data ?? {};
}

export const AdminAPI = {
  me: () => authed("/admin/auth/me"),

  // Overview + Accounts
  getOverview: () => authed("/admin/overview"),
  getAdminAccounts: () => authed("/admin/accounts"),
  refreshHotWallet: () => authed("/admin/accounts/refresh-wallet"),
  tronStatus: () => authed("/admin/tron-status"),

  // Users
  getUsers: ({ page = 1, q = "" } = {}) =>
    authed(`/admin/users?page=${page}&q=${encodeURIComponent(q)}`),
  setRole: (id, role) =>
    authed(`/admin/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
  setStatus: (id, status) =>
    authed(`/admin/users/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),

  // Payments
  getPayments: ({ page = 1, q = "" } = {}) =>
    authed(`/admin/payments?page=${page}&q=${encodeURIComponent(q)}`),

  // Withdrawals
  getWithdrawals: ({ page = 1, q = "", status = "all" } = {}) => {
    const qs = new URLSearchParams({ page, q, status });
    return authed(`/admin/withdrawals?${qs.toString()}`);
  },
  approveWithdrawal: (id) =>
    authed(`/admin/withdrawals/${id}/approve`, { method: "POST" }),
  rejectWithdrawal: (id, reason) =>
    authed(`/admin/withdrawals/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  // Deposits
  getDeposits: ({ page = 1, q = "", status = "all" } = {}) => {
    const qs = new URLSearchParams({ page, q, status });
    return authed(`/admin/deposits?${qs.toString()}`);
  },

  // Earn Paper settings
  getPaperSettings: () => authed("/admin/earn-paper"),
  savePaperSettings: (payload) =>
    authed("/admin/earn-paper", { method: "PUT", body: JSON.stringify(payload) }),
};

// ✅ Uses the correct `/api/lottery/*` base to match server/index.js
export const LotteryAPI = {
  current: (tier = 1) => authed(`/api/lottery/current?tier=${tier}`),

  // List rounds (same endpoint for user/admin; auth middleware restricts)
  rounds: ({ tier = 1, resolved = 0 } = {}) =>
    authed(`/api/lottery/rounds?tier=${tier}&resolved=${resolved}`),

  // Participants for a given round
  participants: (roundId) =>
    authed(`/api/lottery/rounds/${encodeURIComponent(roundId)}/participants`),

  // Resolve (admin-protected by middleware on the server)
  resolveRound: (roundId, { winnerUserId, payout }) =>
    authed(`/api/lottery/rounds/${encodeURIComponent(roundId)}/resolve`, {
      method: "POST",
      body: JSON.stringify({ winnerUserId, payout }),
    }),
};
