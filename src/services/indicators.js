// src/services/indicators.js
export function SMA(values, period) {
  if (!Array.isArray(values) || values.length < period) return [];
  const out = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out.push(sum / period);
    else out.push(null);
  }
  return out;
}

export function EMA(values, period) {
  if (!Array.isArray(values) || values.length === 0) return [];
  const k = 2 / (period + 1);
  const out = [];
  let ema = values[0];
  for (let i = 0; i < values.length; i++) {
    ema = i === 0 ? values[0] : values[i] * k + ema * (1 - k);
    out.push(ema);
  }
  return out;
}

export function RSI(values, period = 14) {
  if (values.length < period + 1) return values.map(() => null);
  const gains = [], losses = [];
  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    gains.push(Math.max(0, diff));
    losses.push(Math.max(0, -diff));
  }
  let avgGain = gains.slice(0, period).reduce((a,b)=>a+b,0)/period;
  let avgLoss = losses.slice(0, period).reduce((a,b)=>a+b,0)/period;
  const out = Array(period).fill(null);
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / (avgLoss || 1e-9);
    const rsi = 100 - 100 / (1 + rs);
    out.push(rsi);
  }
  out.unshift(null); // align with prices length
  return out;
}

export function MACD(values, fast = 12, slow = 26, signal = 9) {
  const emaFast = EMA(values, fast);
  const emaSlow = EMA(values, slow);
  const macd = values.map((_, i) => (emaFast[i] ?? 0) - (emaSlow[i] ?? 0));
  const sig = EMA(macd.map(v => v ?? 0), signal);
  const hist = macd.map((v, i) => (v ?? 0) - (sig[i] ?? 0));
  return { macd, signal: sig, hist };
}

// Simple confidence score: trend + momentum
export function signalScore({ smaFast, smaSlow, rsi, macdHist }) {
  const last = (arr) => arr?.length ? arr[arr.length - 1] : null;
  const f = last(smaFast), s = last(smaSlow), r = last(rsi), h = last(macdHist);
  let score = 50;
  if (f != null && s != null) score += f > s ? 15 : -15;
  if (r != null) {
    if (r > 55 && r < 70) score += 10;
    if (r >= 70) score -= 5; // overbought
    if (r < 45 && r > 30) score -= 10;
    if (r <= 30) score += 5;  // oversold bounce
  }
  if (h != null) score += h > 0 ? 10 : -10;
  return Math.max(0, Math.min(100, Math.round(score)));
}
