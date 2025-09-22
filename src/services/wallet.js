import { api } from "./_core";

export async function fetchFiatBalance(token) {
  return api("/api/usdt/balance", { token });
}

export async function requestWithdraw(token, { amount, note }) {
  return api("/api/usdt/withdraw", {
    token,
    method: "POST",
    body: { amount, note },
  });
}

export async function fetchFiatHistory(token, { page = 1, limit = 20 } = {}) {
  return api(`/api/usdt/history?page=${page}&limit=${limit}`, { token });
}
