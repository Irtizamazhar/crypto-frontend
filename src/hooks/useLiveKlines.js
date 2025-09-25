import { useEffect, useRef, useState } from "react";
import { fetchKlinesOHLC, openKlineStream } from "../services/api";

export function useLiveKlines(symbol = "BTCUSDT", interval = "1m", limit = 300) {
  const [candles, setCandles] = useState([]);
  const stopRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const hist = await fetchKlinesOHLC(symbol, interval, limit);
        if (!alive) return;
        let local = hist.map(k => ({
          time: k.openTime,
          open: k.open, high: k.high, low: k.low, close: k.close, volume: k.volume,
        }));
        setCandles(local);

        stopRef.current = openKlineStream(symbol, interval, (k) => {
          local = [...local];
          const time = k.openTime;
          const last = local[local.length - 1];

          if (!last || last.time !== time) {
            local.push({ time, open: k.open, high: k.high, low: k.low, close: k.close, volume: k.volume });
            if (local.length > limit) local.shift();
          } else {
            last.open = k.open;
            last.high = Math.max(last.high, k.high);
            last.low  = Math.min(last.low,  k.low);
            last.close = k.close;
            last.volume = k.volume;
          }
          setCandles(local);
        });
      } catch (e) {
        console.error("useLiveKlines error", e);
      }
    })();

    return () => { alive = false; stopRef.current && stopRef.current(); stopRef.current = null; };
  }, [symbol, interval, limit]);

  return candles;
}
