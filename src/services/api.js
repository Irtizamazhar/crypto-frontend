// src/services/api.js

// --- API base ---------------------------------------------------------------
export const APP_API =
  (process.env.REACT_APP_API_URL?.replace(/\/$/, "")) || "http://localhost:4000";

function buildUrl(path) {
  return `${APP_API}${path.startsWith("/") ? path : `/${path}`}`;
}

// --- auth token helpers -----------------------------------------------------
export const TOKEN_KEY = "token";

export function getToken() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    // In case someone saved with quotes, strip them:
    return token ? token.replace(/^"+|"+$/g, "") : "";
  } catch {
    return "";
  }
}

export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, String(token));
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("user");
  } catch {}
}

// --- response parsing helpers ----------------------------------------------
async function parseMaybeJson(res) {
  const contentType = res.headers.get("content-type") || "";
  // 204 / No Content or empty body – return {}
  if (res.status === 204) return {};
  if (!contentType) {
    // Some servers may not set content-type for empty responses
    try {
      const txt = await res.text();
      if (!txt) return {};
      // If body isn't empty but no content-type, try JSON first
      try {
        return JSON.parse(txt);
      } catch {
        return { message: txt };
      }
    } catch {
      return {};
    }
  }

  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      // bad json or empty body
      return {};
    }
  }

  // Non-JSON — read small preview and raise a helpful error upstream
  const text = await res.text();
  const preview = (text || "").slice(0, 200);
  const err = new Error(
    `Unexpected response type: ${contentType}. Preview: ${preview}`
  );
  err.__rawText = preview;
  err.__contentType = contentType;
  err.__status = res.status;
  throw err;
}

function withDefaultHeaders(options = {}, token) {
  const baseHeaders = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const headers = { ...baseHeaders, ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return { ...options, headers, credentials: "include" };
}

// --- core request helpers ---------------------------------------------------
export async function appReq(path, options = {}) {
  const url = buildUrl(path);
  const token = getToken();

  try {
    const res = await fetch(url, withDefaultHeaders(options, token));
    const data = await parseMaybeJson(res);

    // auto-clear bad/expired tokens
    if (res.status === 401 || res.status === 403) {
      clearToken();
      const msg = data?.message || "Authentication failed";
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }

    if (!res.ok) {
      const msg = data?.message || `Request failed with status ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }

    return data;
  } catch (error) {
    console.error("API error:", url, error);
    throw error;
  }
}

export async function publicReq(path, options = {}) {
  const url = buildUrl(path);

  try {
    const res = await fetch(url, withDefaultHeaders(options));
    const data = await parseMaybeJson(res);

    if (!res.ok) {
      const msg = data?.message || `Request failed with status ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }

    return data;
  } catch (error) {
    console.error("Public API error:", url, error);
    throw error;
  }
}

// --- Auth API ---------------------------------------------------------------
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

  async me() {
    return appReq("/auth/me");
  },

  async updateProfile({ name }) {
    return appReq("/auth/update-profile", {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  },

  async changePassword({ currentPassword, newPassword }) {
    return appReq("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async forgotPassword(email) {
    return publicReq("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async magicLogin(token) {
    const data = await publicReq(
      `/auth/magic-login?token=${encodeURIComponent(token)}`
    );
    if (data?.token) setToken(data.token);
    return data;
  },

  googleUrl: `${APP_API}/auth/google`,
  facebookUrl: `${APP_API}/auth/facebook`,
  appleUrl: `${APP_API}/auth/apple`,
};

// --- Wallet API -------------------------------------------------------------
export const WalletAPI = {
  async getTrc20Wallet() {
    return appReq("/wallet/trc20");
  },

  async getBalance() {
    return appReq("/wallet/balance");
  },

  async listDeposits() {
    // if your backend route is /wallet/deposits adjust accordingly
    return appReq("/deposits");
  },

  async purchase({ amount_usdt, item_code }) {
    return appReq("/wallet/purchase", {
      method: "POST",
      body: JSON.stringify({ amount_usdt, item_code }),
    });
  },
};

// --- Alerts API (quota helpers here to avoid path mismatches) ---------------
export const AlertsAPI = {
  // Backend route provided in server/routes/alerts.js
  async limits() {
    // returns { plan, used, remaining } mapped on server
    return appReq("/api/alerts/limits");
  },

  async consume() {
    // increments the free quota counter on the server
    return appReq("/api/alerts/quota/consume", { method: "POST" });
  },

  // If you prefer keeping the CRUD here too, uncomment and use:
  // async list() { return appReq("/api/alerts"); },
  // async create(body) { return appReq("/api/alerts", { method: "POST", body: JSON.stringify(body) }); },
  // async update(id, patch) { return appReq(`/api/alerts/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) }); },
  // async remove(id) { return appReq(`/api/alerts/${encodeURIComponent(id)}`, { method: "DELETE" }); },
  // async clear() { return appReq(`/api/alerts/clear`, { method: "POST" }); },
};

// --- Binance proxy + utilities ---------------------------------------------
const PROXY = `${APP_API}/proxy/binance`;
const WS = "wss://stream.binance.com:9443/ws";
const SAFE_FIATS = ["usd", "eur"];

export function sanitizeCurrency(vs) {
  const v = String(vs || "").toLowerCase();
  return SAFE_FIATS.includes(v) ? v : "usd";
}

async function fetchWithTimeout(url, opts = {}, ms = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: opts.signal || ctrl.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function getJson(url, opts, { retry = 1 } = {}) {
  try {
    const res = await fetchWithTimeout(url, opts, 12000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    if (retry > 0) return getJson(url, opts, { retry: retry - 1 });
    throw e;
  }
}

let exchangeInfoCache = null;
let eurUsdtCache = { ts: 0, price: 1 };

export function iconFor(symbol) {
  const s = String(symbol || "").toLowerCase();
  return `https://cryptoicons.org/api/icon/${s}/64`;
}

export async function getExchangeInfo({ signal } = {}) {
  if (exchangeInfoCache) return exchangeInfoCache;
  exchangeInfoCache = await getJson(`${PROXY}/exchangeInfo`, { signal });
  return exchangeInfoCache;
}

async function getEURUSDT({ signal } = {}) {
  const now = Date.now();
  if (now - eurUsdtCache.ts < 5 * 60 * 1000 && eurUsdtCache.price) return eurUsdtCache.price;
  try {
    const j = await getJson(`${PROXY}/price?symbol=EURUSDT`, { signal });
    const p = Number(j.price) || 1;
    eurUsdtCache = { ts: now, price: p };
    return p;
  } catch {
    return 1;
  }
}

export async function convertFromUsdt(v, cur = "usd", { signal } = {}) {
  const c = sanitizeCurrency(cur);
  const n = Number(v) || 0;
  if (c === "usd") return n;
  if (c === "eur") {
    const eur = await getEURUSDT({ signal });
    return n / eur;
  }
  return n;
}

export async function getUsdtToCurrencyFactor(cur = "usd", { signal } = {}) {
  const c = sanitizeCurrency(cur);
  if (c === "usd") return 1;
  if (c === "eur") {
    const eur = await getEURUSDT({ signal });
    return 1 / eur;
  }
  return 1;
}

function normalizeTicker(t) {
  const base = t.symbol.replace(/USDT$/i, "");
  const priceUsdt = Number(t.lastPrice);
  const open = Number(t.openPrice);
  const pct = open ? ((priceUsdt - open) / open) * 100 : Number(t.priceChangePercent) || 0;
  return {
    id: base.toLowerCase(),
    name: base,
    symbol: base.toLowerCase(),
    image: iconFor(base),
    priceUsdt,
    changePercent24Hr: pct,
    volumeQuote24h: Number(t.quoteVolume),
    volumeUsd24Hr: Number(t.quoteVolume),
  };
}

export async function fetchMarket({ page = 1, per_page = 50, signal } = {}) {
  const tickers = await getJson(`${PROXY}/ticker24h`, { signal });
  const usdt = tickers.filter((t) => /USDT$/.test(t.symbol));
  const clean = usdt.filter((t) => !/(UPUSDT|DOWNUSDT|BULLUSDT|BEARUSDT|[0-9]SUSDT|[0-9]LUSDT)$/i.test(t.symbol));
  clean.sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume));
  const start = (page - 1) * per_page;
  const slice = clean.slice(start, start + per_page);
  return slice.map(normalizeTicker);
}

export async function searchCoins(query, { signal } = {}) {
  const info = await getExchangeInfo({ signal });
  const q = String(query || "").toLowerCase();
  const seen = new Set();
  const coins = [];
  for (const s of info.symbols || []) {
    if (!/USDT$/.test(s.symbol)) continue;
    const base = s.baseAsset || "";
    if (!base || seen.has(base)) continue;
    if (base.toLowerCase().includes(q)) {
      seen.add(base);
      coins.push({
        id: base.toLowerCase(),
        name: base,
        symbol: base.toUpperCase(),
        thumb: iconFor(base),
      });
      if (coins.length >= 10) break;
    }
  }
  return { coins };
}

export async function fetchCoin(id, { signal } = {}) {
  const sym = String(id || "").toUpperCase() + "USDT";
  const t = await getJson(`${PROXY}/ticker24hr?symbol=${encodeURIComponent(sym)}`, { signal });
  return normalizeTicker(t);
}

export async function fetchKlines(symbol = "BTCUSDT", interval = "1h", limit = 500, { signal } = {}) {
  const url = new URL(`${PROXY}/klines`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", String(limit));
  const r = await fetchWithTimeout(url.toString(), { signal }, 12000);
  if (!r.ok) throw new Error("Failed klines");
  const rows = await r.json();
  // close prices array (legacy)
  return rows.map((k) => Number(k[4]));
}

// OHLC helper
export async function fetchKlinesOHLC(symbol = "BTCUSDT", interval = "1m", limit = 300, { signal } = {}) {
  const url = new URL(`${PROXY}/klines`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", String(limit));
  const rows = await getJson(url.toString(), { signal });
  return rows.map(r => ({
    openTime: r[0],
    open: Number(r[1]),
    high: Number(r[2]),
    low: Number(r[3]),
    close: Number(r[4]),
    volume: Number(r[5]),
    closeTime: r[6],
  }));
}

export async function fetchCoinHistory7d(id, { signal } = {}) {
  const sym = String(id || "").toUpperCase() + "USDT";
  const url = new URL(`${PROXY}/klines`);
  url.searchParams.set("symbol", sym);
  url.searchParams.set("interval", "1h");
  url.searchParams.set("limit", "168");
  const arr = await getJson(url.toString(), { signal });
  return arr.map((c) => Number(c[4]));
}

export async function fetchGlobalFromMarket({ signal } = {}) {
  const tickers = await getJson(`${PROXY}/ticker24h`, { signal });
  const usdt = tickers.filter((t) => /USDT$/.test(t.symbol));
  let totalQuote = 0, btcQuote = 0;
  for (const t of usdt) {
    const qv = Number(t.quoteVolume) || 0;
    totalQuote += qv;
    if (t.symbol === "BTCUSDT") btcQuote += qv;
  }
  const bitcoinDominance = totalQuote > 0 ? (btcQuote / totalQuote) * 100 : 0;
  return { volumeUsd24Hr: totalQuote, bitcoinDominance };
}

// WebSocket streams
export function openKlineStream(symbol, interval, onKline) {
  let ws;
  const url = `${WS}/${String(symbol).toLowerCase()}@kline_${interval}`;
  ws = new WebSocket(url);
  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      const k = msg?.k;
      if (!k) return;
      onKline?.({
        openTime: k.t,
        open: Number(k.o),
        high: Number(k.h),
        low: Number(k.l),
        close: Number(k.c),
        volume: Number(k.v),
        closeTime: k.T,
        closed: !!k.x,
      });
    } catch {}
  };
  ws.onerror = () => { try { ws.close(); } catch {} };
  return () => { try { ws && ws.close(1000, "client-close"); } catch {} };
}

export function openMiniTickerStream(onUpdate) {
  let ws, alive = true, attempts = 0;
  const connect = () => {
    if (!alive) return;
    attempts++;
    ws = new WebSocket(`${WS}/!miniTicker@arr`);
    ws.onopen = () => { attempts = 0; };
    ws.onmessage = (ev) => {
      try {
        const arr = JSON.parse(ev.data);
        if (!Array.isArray(arr)) return;
        for (const t of arr) {
          const s = t.s;
          if (!/USDT$/.test(s)) continue;
          if (/(UPUSDT|DOWNUSDT|BULLUSDT|BEARUSDT|[0-9]SUSDT|[0-9]LUSDT)$/i.test(s)) continue;
          const base = s.replace(/USDT$/i, "");
          const close = Number(t.c) || 0;
          const open = Number(t.o) || 0;
          const pct = open ? ((close - open) / open) * 100 : 0;
          const quote = Number(t.q) || 0;
          onUpdate({
            id: base.toLowerCase(),
            priceUsdt: close,
            changePercent24Hr: pct,
            volumeQuote24h: quote,
            volumeUsd24Hr: quote,
          });
        }
      } catch {}
    };
    ws.onclose = () => {
      if (!alive) return;
      const delay = Math.min(15000, 1000 * Math.pow(2, attempts));
      setTimeout(connect, delay);
    };
    ws.onerror = () => { try { ws.close(); } catch {} };
  };
  connect();
  return () => { alive = false; try { ws && ws.close(); } catch {} };
}

// Market data + news (public)
export async function fetchMarketData(symbol) {
  try {
    const id = String(symbol || "").toLowerCase();
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
    );
    if (!res.ok) throw new Error(`fetchMarketData failed (${res.status})`);
    const data = await res.json();
    return {
      market_cap: data?.market_data?.market_cap?.usd ?? null,
      total_volume: data?.market_data?.total_volume?.usd ?? null,
      high_24h: data?.market_data?.high_24h?.usd ?? null,
      low_24h: data?.market_data?.low_24h?.usd ?? null,
    };
  } catch (e) {
    console.error("fetchMarketData error:", e);
    return null;
  }
}

export async function fetchNews(symbol, name) {
  try {
    const q = encodeURIComponent(name || symbol || "crypto");
    const res = await fetch(
      `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=${q}`
    );
    if (!res.ok) throw new Error(`fetchNews failed (${res.status})`);
    const payload = await res.json();
    const items = Array.isArray(payload?.Data) ? payload.Data : [];
    return items.map((n) => ({
      title: n.title,
      url: n.url,
      source: n.source,
      published_at: n.published_on ? new Date(n.published_on * 1000).toISOString() : new Date().toISOString(),
      description: n.body || "",
    }));
  } catch (e) {
    console.error("fetchNews error:", e);
    return [];
  }
}
