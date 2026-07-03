// src/components/admin/common/MentorIndustryChart.jsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

const PALETTE = [
  "#2563eb",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#db2777",
  "#65a30d",
  "#0284c7",
  "#9333ea",
  "#ea580c",
  "#16a34a",
];

// ── Generate clean Y-axis ticks (industry standard) ──────────
// Always whole numbers, max 5 ticks, nicely rounded
const getYAxisTicks = (maxVal) => {
  if (maxVal === 0) return [0];

  // Nice step sizes: 1, 2, 5, 10, 20, 25, 50, 100 ...
  const rawStep = maxVal / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const niceSteps = [1, 2, 5, 10];
  const step =
    niceSteps.map((s) => s * magnitude).find((s) => s >= rawStep) ||
    magnitude * 10;

  const niceMax = Math.ceil(maxVal / step) * step;
  const ticks = [];
  for (let t = 0; t <= niceMax; t += step) ticks.push(t);
  return ticks;
};

// ── Custom Tooltip ────────────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { industry, count, pct } = payload[0].payload;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "8px 12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#1e293b",
          marginBottom: 2,
        }}
      >
        {industry}
      </p>
      <p
        style={{
          fontSize: 10,
          color: "#64748b",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {count} mentor{count !== 1 ? "s" : ""} · {pct}%
      </p>
    </div>
  );
};

// ── Custom X-Axis Tick (rotated to prevent overlap) ───────────
const CustomXTick = ({ x, y, payload }) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill="#64748b"
        fontSize={11}
        fontFamily="'DM Sans', sans-serif"
        fontWeight={500}
        transform="rotate(-35)"
      >
        {payload.value}
      </text>
    </g>
  );
};

// ══════════════════════════════════════════════════════════════
const MentorIndustryChart = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div
        className="rounded-2xl flex flex-col items-center justify-center py-16 gap-2"
        style={{ background: "#fff", border: "1px solid #e8eaf0" }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M3 9h18M9 21V9" />
        </svg>
        <p className="text-sm text-slate-400">
          No industry data available yet.
        </p>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);
  const maxCount = Math.max(...data.map((d) => d.count));
  const yTicks = getYAxisTicks(maxCount);
  const yMax = yTicks[yTicks.length - 1];

  const chartData = data.map((item) => ({
    ...item,
    pct: ((item.count / total) * 100).toFixed(1),
  }));

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "#fff", border: "1px solid #e8eaf0" }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-slate-800" style={{ fontWeight: 700 }}>
            Mentor Industry Distribution
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {total} mentor{total !== 1 ? "s" : ""} across {data.length} industr
            {data.length !== 1 ? "ies" : "y"}
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 max-w-[220px] justify-end">
          {chartData.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: PALETTE[i % PALETTE.length] }}
              />
              <span className="text-[10px] text-slate-500 leading-none">
                {item.industry}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chart ── */}
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 16, left: -10, bottom: 60 }}
          barSize={chartData.length <= 3 ? 52 : chartData.length <= 6 ? 36 : 24}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="#f1f5f9"
          />
          <XAxis
            dataKey="industry"
            tick={<CustomXTick />}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
            interval={0}
            padding={{ left: 20, right: 20 }}
          />
          <YAxis
            allowDecimals={false}
            ticks={yTicks}
            domain={[0, yMax]}
            tick={{
              fontSize: 10,
              fill: "#94a3b8",
              fontFamily: "'DM Mono', monospace",
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "#f8fafc", radius: 6 }}
          />
          <Bar dataKey="count" radius={[5, 5, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
            <LabelList
              dataKey="count"
              position="top"
              style={{
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "'DM Mono', monospace",
                fill: "#475569",
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MentorIndustryChart;
