import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLiveKlines } from "../hooks/useLiveKlines";
import { SMA } from "../services/indicators";

const formatNum = (n) =>
  Number(n).toLocaleString(undefined, { maximumFractionDigits: 8 });

export default function LiveCandleChart({
  symbol = "BTCUSDT",
  interval = "1m",
  limit = 300,
  height = 420,
  maPeriods = [7, 25, 99],
}) {
  const ref = useRef(null);
  const [width, setWidth] = useState(800);
  const candles = useLiveKlines(symbol, interval, limit);

  // zoom & pan
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartOffset = useRef(0);

  // auto resize
  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const obs = new ResizeObserver(() => setWidth(el.clientWidth || 800));
    obs.observe(el);
    setWidth(el.clientWidth || 800);
    return () => obs.disconnect();
  }, []);

  // chart dimensions
  const priceArea = Math.round(height * 0.75);
  const volArea = height - priceArea - 18;
  const padTop = 12;
  const padRight = 12;
  const padLeft = 48;

  // visible candles
  const visibleCandles = Math.max(
    20,
    Math.floor((width - padLeft - padRight) / (6 / zoom))
  );
  let startIdx = Math.max(0, candles.length - visibleCandles - offset);
  let endIdx = candles.length - offset;
  if (endIdx <= startIdx) endIdx = startIdx + 1;
  const visible = candles.slice(startIdx, endIdx);

  // candle size
  const cw = Math.max(
    2,
    Math.floor((width - padLeft - padRight) / Math.max(20, visible.length))
  );
  const gap = Math.min(4, Math.max(1, Math.floor(cw * 0.25)));
  const body = Math.max(1, cw - gap);

  // stats
  const stats = useMemo(() => {
    if (!visible.length) return null;
    const min = Math.min(...visible.map((c) => c.low));
    const max = Math.max(...visible.map((c) => c.high));
    const volMax = Math.max(1, ...visible.map((c) => c.volume || 0));
    return { min, max, volMax };
  }, [visible]);

  const y = (v) => {
    if (!stats) return priceArea / 2;
    const { min, max } = stats;
    const span = max - min || 1;
    const t = (v - min) / span;
    return padTop + (1 - t) * (priceArea - padTop);
  };

  const volY = (v) => {
    if (!stats) return priceArea + volArea;
    const t = v / stats.volMax;
    return priceArea + (1 - t) * volArea;
  };

  // moving averages
  const maData = useMemo(() => {
    if (!candles.length) return [];
    const closes = candles.map((c) => c.close);
    return maPeriods.map((p) => ({
      p,
      arr: SMA(closes, p),
      color: p === 7 ? "#f59e0b" : p === 25 ? "#e879f9" : "#60a5fa",
      label: p === 7 ? "Short-term" : p === 25 ? "Mid-term" : "Long-term",
    }));
  }, [candles, maPeriods]);

  // crosshair
  const [hoverIdx, setHoverIdx] = useState(null);
  const onMoveCross = (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - box.left - padLeft;
    const idx = Math.min(visible.length - 1, Math.max(0, Math.floor(x / cw)));
    setHoverIdx(idx);
  };
  const onLeave = () => setHoverIdx(null);

  // ✅ Zoom on Shift instead of Ctrl
  const onWheel = (e) => {
    if (e.shiftKey) {
      e.preventDefault();
      const mouseX =
        e.clientX - ref.current.getBoundingClientRect().left - padLeft;
      const mouseIndex = startIdx + Math.floor(mouseX / cw);

      const newZoom = Math.max(
        0.5,
        Math.min(5, zoom * (e.deltaY > 0 ? 0.9 : 1.1))
      );

      const zoomRatio = newZoom / zoom;
      const newOffset = Math.max(
        0,
        offset + Math.floor((mouseIndex - startIdx) * (1 - zoomRatio))
      );

      setZoom(newZoom);
      setOffset(newOffset);
    } else {
      // normal scroll pans chart
      setOffset((o) => Math.max(0, o + (e.deltaY > 0 ? 5 : -5)));
    }
  };

  // ✅ drag pan
  const onMouseDown = (e) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartOffset.current = offset;
  };
  const onMouseMove = (e) => {
    if (isDragging.current) {
      const dx = e.clientX - dragStartX.current;
      const shift = Math.floor(dx / cw);
      setOffset(Math.max(0, dragStartOffset.current - shift));
    } else {
      onMoveCross(e);
    }
  };
  const onMouseUp = () => (isDragging.current = false);

  // grid
  const gridYs = useMemo(() => {
    if (!stats) return [];
    const ticks = 4;
    const arr = [];
    for (let i = 0; i <= ticks; i++) {
      const t = i / ticks;
      const v = stats.max - (stats.max - stats.min) * t;
      arr.push({ y: y(v), v });
    }
    return arr;
  }, [stats]);

  return (
    <div ref={ref} className="w-full select-none">
      <svg
        width={width}
        height={height}
        style={{
          display: "block",
          cursor: isDragging.current ? "grabbing" : "crosshair",
        }}
        onMouseMove={onMouseMove}
        onMouseLeave={onLeave}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >
        {/* bg */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="rgba(15,23,42,.35)"
        />

        {/* grid */}
        {gridYs.map((g, i) => (
          <g key={i}>
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={g.y}
              y2={g.y}
              stroke="rgba(255,255,255,.06)"
            />
            <text x={6} y={g.y + 4} fill="#94a3b8" fontSize="11">
              ${formatNum(g.v)}
            </text>
          </g>
        ))}

        {/* volume */}
        {visible.map((c, i) => {
          const x = padLeft + i * cw + Math.floor((cw - body) / 2);
          const y2 = volY(c.volume || 0);
          const up = c.close >= c.open;
          return (
            <rect
              key={`v-${i}`}
              x={x}
              width={body}
              y={y2}
              height={priceArea + volArea - y2}
              fill={up ? "rgba(34,197,94,.35)" : "rgba(244,63,94,.35)"}
            />
          );
        })}

        {/* candles */}
        {visible.map((c, i) => {
          const x = padLeft + i * cw + Math.floor(cw / 2);
          const open = y(c.open),
            close = y(c.close),
            high = y(c.high),
            low = y(c.low);
          const up = c.close >= c.open;
          return (
            <g key={i}>
              <line
                x1={x}
                x2={x}
                y1={high}
                y2={low}
                stroke={up ? "#22c55e" : "#f43f5e"}
                strokeWidth="1"
              />
              <rect
                x={padLeft + i * cw + Math.floor((cw - body) / 2)}
                width={body}
                y={Math.min(open, close)}
                height={Math.max(1, Math.abs(close - open))}
                fill={up ? "#22c55e" : "#f43f5e"}
                opacity="0.95"
                rx="2"
              />
            </g>
          );
        })}

        {/* MAs */}
        {maData.map((m) => {
          const path = [];
          for (let i = startIdx; i < endIdx; i++) {
            const val = m.arr[i];
            if (val == null) continue;
            const x = padLeft + (i - startIdx) * cw + Math.floor(cw / 2);
            path.push(`${path.length ? "L" : "M"} ${x} ${y(val)}`);
          }
          return (
            <path
              key={m.p}
              d={path.join(" ")}
              fill="none"
              stroke={m.color}
              strokeWidth="1.5"
              opacity="0.9"
            />
          );
        })}

        {/* crosshair */}
        {hoverIdx != null &&
          visible[hoverIdx] &&
          (() => {
            const c = visible[hoverIdx];
            const cx = padLeft + hoverIdx * cw + Math.floor(cw / 2);
            const up = c.close >= c.open;
            const ttX = Math.min(width - 220, Math.max(6, cx - 110));
            return (
              <g>
                <line
                  x1={cx}
                  x2={cx}
                  y1={padTop}
                  y2={priceArea + volArea}
                  stroke="rgba(148,163,184,.5)"
                  strokeDasharray="4 4"
                />
                <rect
                  x={ttX}
                  y={8}
                  rx="8"
                  ry="8"
                  width="208"
                  height="82"
                  fill="rgba(2,6,23,.85)"
                  stroke="rgba(255,255,255,.1)"
                />
                <text
                  x={ttX + 10}
                  y={28}
                  fill="#e2e8f0"
                  fontSize="12"
                >
                  {new Date(c.time).toLocaleString()}
                </text>
                <text
                  x={ttX + 10}
                  y={46}
                  fill="#94a3b8"
                  fontSize="12"
                >
                  O: ${formatNum(c.open)} H: ${formatNum(c.high)}
                </text>
                <text
                  x={ttX + 10}
                  y={64}
                  fill="#94a3b8"
                  fontSize="12"
                >
                  L: ${formatNum(c.low)} C: ${formatNum(c.close)}
                </text>
                <text
                  x={ttX + 10}
                  y={82}
                  fill={up ? "#22c55e" : "#f43f5e"}
                  fontSize="12"
                >
                  Δ: {((c.close - c.open) / c.open * 100).toFixed(2)}%
                </text>
              </g>
            );
          })()}
      </svg>

      {/* Legend */}
      <div className="flex gap-6 text-xs text-slate-400 mt-2">
        {maData.map((m) => {
          const latest = m.arr[m.arr.length - 1];
          return (
            <span key={m.p} className="inline-flex items-center gap-1">
              <span
                className="inline-block w-3 h-1.5 rounded"
                style={{ backgroundColor: m.color }}
              />
              {m.label} ({m.p}):{" "}
              {latest ? (
                <span className="text-slate-200">${formatNum(latest)}</span>
              ) : (
                "loading..."
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
