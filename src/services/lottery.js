// src/services/lottery.js
import { api } from "./_core";

function qs(params = {}) {
  const entries = Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "");
  return entries.length ? `?${new URLSearchParams(Object.fromEntries(entries)).toString()}` : "";
}

// User
export async function fetchCurrentRound(token) {
  return api(`/api/lottery/current`, { token });
}
export async function joinLottery(token) {
  return api(`/api/lottery/join`, { token, method: "POST" });
}
export async function fetchRounds(token, opts = {}) {
  return api(`/api/lottery/rounds${qs(opts)}`, { token });
}
export async function fetchPastRounds(token, limit = 50) {
  return fetchRounds(token, { resolved: 1, limit });
}
export async function fetchRoundParticipants(token, roundId) {
  return api(`/api/lottery/rounds/${encodeURIComponent(roundId)}/participants`, { token });
}

// Admin
export async function adminListRounds(token, opts = {}) {
  return api(`/api/lottery/rounds${qs(opts)}`, { token });
}
export async function adminRoundEntries(token, roundId) {
  return fetchRoundParticipants(token, roundId);
}
export async function adminResolve(token, roundId, { winnerUserId }) {
  return api(`/api/lottery/rounds/${encodeURIComponent(roundId)}/resolve`, {
    token,
    method: "POST",
    body: { winnerUserId },
  });
}
