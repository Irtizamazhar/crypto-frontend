export const fmt = (n, d = 2, prefix = "$") => {
  const num = Number(n);
  if (!Number.isFinite(num)) return `${prefix}-`;
  const abs = Math.abs(num);
  const val =
    abs >= 1e12 ? (num / 1e12).toFixed(d) + "T" :
    abs >= 1e9  ? (num / 1e9 ).toFixed(d) + "B" :
    abs >= 1e6  ? (num / 1e6 ).toFixed(d) + "M" :
    abs >= 1e3  ? (num / 1e3 ).toFixed(d) + "K" :
    num.toLocaleString(undefined, { maximumFractionDigits: d });
  return `${prefix}${val}`;
};

export const pct = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0.00%";
  return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
};
