// Small charts drawn with plain SVG, so the dashboard needs no extra library.
//
//   <LineChart points={[{ label: "01 Sep", value: 92 }]} max={100} suffix="%" />
//   <BarChart items={[{ label: "Class 1", value: 30 }]} />
//   <DonutChart items={[{ label: "Pending", value: 4, color: "#d97706" }]} />
//
// Hovering a point or bar shows its exact value.

const TEAL = "#0f766e";
const GRID = "#e2e8f0";
const TEXT = "#64748b";

function NoData({ children }) {
  return <p className="text-sm text-slate-400 py-8 text-center">{children || "Nothing to show yet."}</p>;
}

// Picks "nice" top values for the y axis.
function niceMax(value) {
  if (value <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function compact(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(Math.round(n));
}

export function LineChart({ points, max = 100, suffix = "", height = 200, color = TEAL }) {
  if (!points || points.length === 0) return <NoData />;

  const W = 600, H = height;
  const left = 36, right = 12, top = 12, bottom = 28;
  const innerW = W - left - right;
  const innerH = H - top - bottom;

  const x = function (i) {
    return points.length === 1 ? left + innerW / 2 : left + (i * innerW) / (points.length - 1);
  };
  const y = function (v) { return top + innerH - (Math.min(v, max) / max) * innerH; };

  const line = points.map(function (p, i) { return (i === 0 ? "M" : "L") + x(i) + " " + y(p.value); }).join(" ");
  const area = line + " L" + x(points.length - 1) + " " + (top + innerH) + " L" + x(0) + " " + (top + innerH) + " Z";

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(function (t) { return Math.round(max * t); });
  const every = Math.ceil(points.length / 7);

  return (
    <svg viewBox={"0 0 " + W + " " + H} className="w-full h-auto" role="img">
      {ticks.map(function (t) {
        return (
          <g key={t}>
            <line x1={left} x2={W - right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
            <text x={left - 6} y={y(t) + 3} textAnchor="end" fontSize="10" fill={TEXT}>{t}{suffix}</text>
          </g>
        );
      })}

      <path d={area} fill={color} opacity="0.10" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {points.map(function (p, i) {
        return (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.value)} r="4" fill="#fff" stroke={color} strokeWidth="2">
              <title>{p.label + ": " + p.value + suffix}</title>
            </circle>
            {i % every === 0 && (
              <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill={TEXT}>{p.label}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function BarChart({ items, color = TEAL, height = 200, format }) {
  if (!items || items.length === 0) return <NoData />;

  const show = format || compact;
  const W = Math.max(600, items.length * 64), H = height;
  const left = 36, right = 12, top = 18, bottom = 30;
  const innerW = W - left - right;
  const innerH = H - top - bottom;

  const top_ = niceMax(Math.max.apply(null, items.map(function (i) { return i.value; })));
  const slot = innerW / items.length;
  const barW = Math.min(44, slot * 0.6);
  const y = function (v) { return top + innerH - (v / top_) * innerH; };

  const ticks = [0, 0.5, 1].map(function (t) { return top_ * t; });

  return (
    <div className="overflow-x-auto">
      <svg viewBox={"0 0 " + W + " " + H} style={{ minWidth: Math.min(W, 520) }} className="w-full h-auto" role="img">
        {ticks.map(function (t) {
          return (
            <g key={t}>
              <line x1={left} x2={W - right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
              <text x={left - 6} y={y(t) + 3} textAnchor="end" fontSize="10" fill={TEXT}>{compact(t)}</text>
            </g>
          );
        })}

        {items.map(function (it, i) {
          const cx = left + slot * i + slot / 2;
          const h = Math.max(0, (it.value / top_) * innerH);
          const name = it.label.length > 10 ? it.label.slice(0, 9) + "..." : it.label;
          return (
            <g key={i}>
              <rect x={cx - barW / 2} y={top + innerH - h} width={barW} height={h} rx="4" fill={color}>
                <title>{it.label + ": " + it.value}</title>
              </rect>
              {it.value > 0 && (
                <text x={cx} y={top + innerH - h - 5} textAnchor="middle" fontSize="10" fontWeight="600" fill="#334155">{show(it.value)}</text>
              )}
              <text x={cx} y={H - 10} textAnchor="middle" fontSize="10" fill={TEXT}>{name}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function DonutChart({ items, size = 150 }) {
  const total = (items || []).reduce(function (s, i) { return s + i.value; }, 0);
  if (!items || total === 0) return <NoData />;

  const r = 52, c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <svg width={size} height={size} viewBox="0 0 140 140" role="img">
        <g transform="rotate(-90 70 70)">
          {items.filter(function (i) { return i.value > 0; }).map(function (it, idx) {
            const len = (it.value / total) * c;
            const dash = len + " " + (c - len);
            const node = (
              <circle key={idx} cx="70" cy="70" r={r} fill="none" stroke={it.color} strokeWidth="20"
                strokeDasharray={dash} strokeDashoffset={-offset}>
                <title>{it.label + ": " + it.value}</title>
              </circle>
            );
            offset += len;
            return node;
          })}
        </g>
        <text x="70" y="68" textAnchor="middle" fontSize="22" fontWeight="700" fill="#0f172a">{total}</text>
        <text x="70" y="84" textAnchor="middle" fontSize="9" fill={TEXT}>total</text>
      </svg>

      <ul className="text-sm space-y-1.5">
        {items.map(function (it) {
          return (
            <li key={it.label} className="flex items-center gap-2 text-slate-600">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: it.color }} />
              {it.label}
              <strong className="text-ink ml-1">{it.value}</strong>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
