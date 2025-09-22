// src/services/_core.js
const API_BASE =
  process.env.REACT_APP_API?.replace(/\/+$/, "") || "http://localhost:4000";

export async function api(path, { token, method = "GET", body } = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || res.statusText);
  try { return JSON.parse(text); } catch { return text; }
}
