import React, { useMemo, useState } from "react";

// Build a sequence of icon URLs to try for a given symbol.
// We try a few popular CDNs before falling back to a generated avatar.
function sourcesFor(symbol) {
  const s = String(symbol || "").toLowerCase();

  // 1) cryptoicons (good coverage, many majors)
  const src1 = `https://cryptoicons.org/api/icon/${s}/64`;

  // 2) spothq/cryptocurrency-icons (GitHub raw, very broad coverage)
  const src2 = `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${s}.png`;

  // 3) staticcryptologos (mirrors many trading logos)
  const src3 = `https://staticcryptologos.com/cryptologos/${s}-logo.png`;

  // 4) generated avatar (always works)
  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    (symbol || "?").toUpperCase()
  )}&background=1f2937&color=ffffff&size=64&bold=true`;

  return [src1, src2, src3, avatar];
}

export default function SmartImg({ symbol, alt = "", className = "" }) {
  const list = useMemo(() => sourcesFor(symbol), [symbol]);
  const [idx, setIdx] = useState(0);

  const src = list[idx] || list[list.length - 1];

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setIdx((i) => Math.min(i + 1, list.length - 1))}
      loading="lazy"
      decoding="async"
    />
  );
}
