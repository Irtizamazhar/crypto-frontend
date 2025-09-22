import React, { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line } from "recharts";

export default function TrendSparkline({
  data = [],
  positive = true,
  width = 96,
  height = 28,
}) {
  const points = useMemo(
    () => (Array.isArray(data) ? data : []).map((y, i) => ({ i, y })),
    [data]
  );

  if (points.length < 2) {
    return <div style={{ width, height }} className="rounded bg-white/5" />;
  }

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <Line
            type="monotone"
            dataKey="y"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}     
            stroke={positive ? "#22c55e" : "#ef4444"}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
