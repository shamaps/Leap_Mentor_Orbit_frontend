// src/components/admin/common/UserGrowthChart.jsx
import { useMemo, useState } from "react";
import PropTypes from "prop-types";

const smoothPath = (points, w, h, min, max) => {
  if (points.length < 2) return "";
  const range = max - min || 1;

  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map((v) => h - ((v - min) / range) * (h * 0.8) - h * 0.1);

  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const cpx1 = xs[i] + (xs[i + 1] - xs[i]) / 3;
    const cpx2 = xs[i + 1] - (xs[i + 1] - xs[i]) / 3;
    d += ` C ${cpx1} ${ys[i]}, ${cpx2} ${ys[i + 1]}, ${xs[i + 1]} ${ys[i + 1]}`;
  }
  return { line: d, xs, ys };
};

const RANGES = ["7D", "30D", "90D"];
const Y_TICKS = 4;

const UserGrowthChart = ({ data = [] }) => {
  const [range, setRange] = useState("30D");
  const [hovered, setHovered] = useState(null);

  const LABEL_W = 38;
  const W = 700;
  const CHART_W = W - LABEL_W;
  const H = 160;

  const sliced = useMemo(() => {
    const dayCount = range === "7D" ? 7 : range === "30D" ? 30 : 90;
    return data.length ? data.slice(-dayCount) : [];
  }, [data, range]);

  if (!sliced.length)
    return (
      <div
        className="rounded-2xl p-6"
        style={{ background: "#ffffff", border: "1px solid #e8eaf0" }}
      >
        <p className="text-sm text-slate-400 text-center py-10">
          No growth data yet.
        </p>
      </div>
    );

  const values = sliced.map((d) => d.count);

  // ✅ ONE consistent scale used for BOTH the line and Y-axis labels
  const scaleMin = 0;
  const scaleMax =
    Math.max(...values) <= 0 ? 10 : Math.ceil(Math.max(...values) * 1.2);

  const result = smoothPath(values, CHART_W, H, scaleMin, scaleMax);
  if (!result) return null;

  const { line, xs, ys } = result;
  const area = `${line} L ${xs[xs.length - 1]} ${H} L ${xs[0]} ${H} Z`;

  // ✅ Y-axis ticks use the exact same scaleMin/scaleMax as the line
  const yTicks = Array.from({ length: Y_TICKS }, (_, i) => {
    const fraction = i / (Y_TICKS - 1);
    const value = Math.round(scaleMin + fraction * (scaleMax - scaleMin));
    const yPos = H - fraction * (H * 0.8) - H * 0.1;
    return { value, yPos };
  });

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "#ffffff", border: "1px solid #e8eaf0" }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3
            className="text-sm font-700 text-slate-800"
            style={{ fontWeight: 700 }}
          >
            User Growth
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            New registrations over time
          </p>
        </div>
        <div
          className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: "#f1f5f9" }}
        >
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-3 py-1.5 rounded-lg text-xs font-600 transition-all"
              style={{
                fontWeight: 600,
                background: range === r ? "#ffffff" : "transparent",
                color: range === r ? "#1e40af" : "#94a3b8",
                boxShadow: range === r ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="relative" style={{ overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: 160 }}
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>

          {yTicks.map(({ value, yPos }, i) => (
            <g key={i}>
              <line
                x1={LABEL_W}
                y1={yPos}
                x2={W}
                y2={yPos}
                stroke="#e8eaf0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={LABEL_W - 6}
                y={yPos + 4}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="9"
                fontFamily="'DM Mono', monospace"
              >
                {value}
              </text>
            </g>
          ))}

          <g transform={`translate(${LABEL_W}, 0)`}>
            <path d={area} fill="url(#areaGrad)" />
            <path
              d={line}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {xs.map((x, i) => (
              <g key={i}>
                <rect
                  x={x - 10}
                  y={0}
                  width={20}
                  height={H}
                  fill="transparent"
                  onMouseEnter={() => setHovered(i)}
                />
                {hovered === i && (
                  <>
                    <line
                      x1={x}
                      y1={0}
                      x2={x}
                      y2={H}
                      stroke="#2563eb"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      opacity="0.5"
                    />
                    <circle
                      cx={x}
                      cy={ys[i]}
                      r="5"
                      fill="#2563eb"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <g
                      transform={`translate(${Math.min(x, CHART_W - 80)}, ${Math.max(ys[i] - 36, 4)})`}
                    >
                      <rect
                        x="0"
                        y="0"
                        width="75"
                        height="28"
                        rx="6"
                        fill="#1e293b"
                      />
                      <text
                        x="8"
                        y="11"
                        fill="white"
                        fontSize="9"
                        fontFamily="DM Mono, monospace"
                        fontWeight="500"
                      >
                        {sliced[i]?.label || `Day ${i + 1}`}
                      </text>
                      <text
                        x="8"
                        y="22"
                        fill="#93c5fd"
                        fontSize="10"
                        fontFamily="DM Mono, monospace"
                        fontWeight="500"
                      >
                        {values[i]} users
                      </text>
                    </g>
                  </>
                )}
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div
        className="flex justify-between mt-2"
        style={{ paddingLeft: LABEL_W, paddingRight: 4 }}
      >
        {sliced
          .filter(
            (_, i) =>
              i % Math.ceil(sliced.length / 6) === 0 || i === sliced.length - 1,
          )
          .map((d, i) => (
            <span
              key={i}
              className="text-[10px] text-slate-500"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {d.label}
            </span>
          ))}
      </div>
    </div>
  );
};
UserGrowthChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      count: PropTypes.number,
      label: PropTypes.string,
    }),
  ),
};
export default UserGrowthChart;
