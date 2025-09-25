// src/components/CoinIcon.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  buildIconCandidates,
  getCachedIconKey,
  getCachedIconUrl,
  setCachedIconUrl,
} from "../utils/coinIcons";
import { motion } from "framer-motion";


export default function CoinIcon({
  coin,         
  symbol,         
  size = 40,
  className = "",
  rounded = "2xl", // Tailwind radius size
}) {
  const key = useMemo(() => getCachedIconKey(coin, symbol), [coin, symbol]);

  const candidates = useMemo(() => {
    const list = buildIconCandidates(coin, symbol);
    const cached = getCachedIconUrl(key);
    // put cached hit first
    return cached ? [cached, ...list.filter((u) => u !== cached)] : list;
  }, [coin, symbol, key]);

  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true); // loader state
  useEffect(() => setIdx(0), [candidates.join("|")]);

  const sym = String(coin?.symbol || "").toUpperCase();
  const src = candidates[idx];

  // Show loader until image is fetched
  const onLoad = () => {
    setCachedIconUrl(key, src);
    setLoading(false); // Hide loader when image is loaded
  };

  // On error, try the next candidate
  const onError = () => {
    if (idx < candidates.length - 1) {
      setIdx((i) => i + 1);
    } else {
      setLoading(false); // Hide loader if no valid icon is found
    }
  };

  if (loading) {
    return (
      <div
        className={`flex justify-center items-center bg-white/10 rounded-${rounded} ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <div className="loader"></div> {/* You can customize this loader */}
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={`rounded-${rounded} bg-white/10 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  return (
    <motion.img
      key={src}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25 }}
      src={src}
      alt={sym}
      className={`h-16 w-16 rounded-${rounded} shadow-lg object-contain ${className}`}
      style={{ width: size, height: size }}
      loading="lazy"
      decoding="async"
      onLoad={onLoad}
      onError={onError}
    />
  );
}
