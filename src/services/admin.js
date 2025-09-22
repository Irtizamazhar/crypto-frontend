// Uses the same base + helper from src/services/api.js
import { APP_API, appReq } from "./api";

/**
 * Admin API with graceful fallback:
 * - login() tries /admin/auth/login; if 404, falls back to /auth/login,
 *   then enforces role === 'admin'.
 */
export const AdminAPI = {
  async login({ email, password }) {
    try {
      // First try a dedicated admin login route (if your backend has it)
      return await appReq("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    } catch (e) {
      // Fallback to normal auth when admin route is missing
      if (/404|Not Found|Cannot POST/i.test(e.message || "")) {
        const res = await appReq("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        const role = String(res?.user?.role || "").toLowerCase();
        if (role !== "admin") {
          const err = new Error("This account is not an admin.");
          err.code = "NOT_ADMIN";
          throw err;
        }
        return res;
      }
      throw e;
    }
  },

  // If your backend has /admin/auth/me it's used; else falls back to /auth/me and enforces admin
  async me() {
    try {
      return await appReq("/admin/auth/me");
    } catch (e) {
      if (/404|Not Found/i.test(e.message || "")) {
        const j = await appReq("/auth/me");
        const role = String(j?.user?.role || "").toLowerCase();
        if (role !== "admin") {
          const err = new Error("Not an admin.");
          err.code = "NOT_ADMIN";
          throw err;
        }
        return j;
      }
      throw e;
    }
  },

  // overview
  getOverview() {
    return appReq("/admin/overview");
  },

  // users
  getUsers({ page = 1, q = "" } = {}) {
    const url = new URL(`${APP_API}/admin/users`);
    url.searchParams.set("page", String(page));
    if (q) url.searchParams.set("q", q);
    return fetch(url.toString(), { credentials: "include" }).then((r) => r.json());
  },
  setRole(userId, role) {
    return appReq(`/admin/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  },
  setStatus(userId, status) {
    return appReq(`/admin/users/${userId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }), // "active" | "banned"
    });
  },

  // payments
  getPayments({ page = 1, q = "" } = {}) {
    const url = new URL(`${APP_API}/admin/payments`);
    url.searchParams.set("page", String(page));
    if (q) url.searchParams.set("q", q);
    return fetch(url.toString(), { credentials: "include" }).then((r) => r.json());
  },

  // earn-paper
  getPaperSettings() {
    return appReq("/admin/earn-paper");
  },
  savePaperSettings(payload) {
    return appReq("/admin/earn-paper", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};
