'use client';

import { C } from './_shared';

// ─── ISOMETRIC PROJECTION ────────────────────────────────────────────────────
// x = right along floor, z = depth into screen, y = height

function p(x: number, y: number, z: number): [number, number] {
  return [x * 0.866 - z * 0.866, x * 0.5 + z * 0.5 - y];
}

// ─── 3D BUBBLE CHART ─────────────────────────────────────────────────────────

export function Chart3DBubble() {
  const W = 420;
  const H = 300;
  const ox = W / 2;
  const oy = H * 0.72;
  const sc = 1.1;

  // Bubbles: [xPos 0-100, height 0-100, zPos 0-100, radius, color]
  const data: [number, number, number, number, string][] = [
    [20, 75, 25, 11, '#818CF8'],
    [45, 85, 15, 14, '#6366F1'],
    [70, 60, 40, 10, '#38BDF8'],
    [30, 45, 60, 12, '#34D399'],
    [55, 90, 30, 16, '#A78BFA'],
    [80, 50, 55, 9, '#818CF8'],
    [15, 30, 75, 13, '#FBBF24'],
    [60, 70, 20, 11, '#38BDF8'],
    [40, 55, 45, 10, '#34D399'],
    [85, 40, 65, 8, '#F87171'],
    [25, 65, 35, 15, '#6366F1'],
    [50, 35, 70, 9, '#A78BFA'],
  ];

  const gridSize = 100;

  // Transform data point to SVG coords
  function pt(x: number, y: number, z: number): [number, number] {
    const [px, py] = p(x, y, z);
    return [ox + px * sc, oy + py * sc];
  }
  function floorPt(x: number, z: number): [number, number] {
    return pt(x, 0, z);
  }

  const colors = ['818CF8', '6366F1', '38BDF8', '34D399', 'A78BFA', 'FBBF24', 'F87171'];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
      <defs>
        {colors.map((c) => (
          <radialGradient key={c} id={`b3d-${c}`} cx="35%" cy="30%">
            <stop offset="0%" stopColor={`#${c}`} stopOpacity="1" />
            <stop offset="60%" stopColor={`#${c}`} stopOpacity="0.6" />
            <stop offset="100%" stopColor={`#${c}`} stopOpacity="0.15" />
          </radialGradient>
        ))}
        <filter id="glow3d">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feComposite in="SourceGraphic" in2="b" operator="over" />
        </filter>
      </defs>

      {/* Floor grid */}
      <g opacity="0.5">
        {[0, 25, 50, 75, 100].map((v) => {
          const [x1, y1] = floorPt(v, 0);
          const [x2, y2] = floorPt(v, gridSize);
          return (
            <line key={`gx${v}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(99,102,241,0.08)" strokeWidth="0.5" />
          );
        })}
        {[0, 25, 50, 75, 100].map((v) => {
          const [x1, y1] = floorPt(0, v);
          const [x2, y2] = floorPt(gridSize, v);
          return (
            <line key={`gz${v}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(99,102,241,0.08)" strokeWidth="0.5" />
          );
        })}
      </g>

      {/* Axes */}
      {(() => {
        const [ax, ay] = floorPt(0, 0);
        const [bx, by] = floorPt(gridSize, 0);
        const [cx2, cy2] = floorPt(0, gridSize);
        const [dx, dy] = pt(0, 100, 0);
        return (
          <g>
            <line x1={ax} y1={ay} x2={bx} y2={by} stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
            <line x1={ax} y1={ay} x2={cx2} y2={cy2} stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
            <line x1={ax} y1={ay} x2={dx} y2={dy} stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
            {/* Tick marks on Y */}
            {[25, 50, 75, 100].map((v) => {
              const [tx, ty] = pt(0, v, 0);
              return (
                <g key={v}>
                  <line x1={tx - 3} y1={ty} x2={tx + 3} y2={ty} stroke="rgba(99,102,241,0.15)" strokeWidth="0.5" />
                  <text
                    x={tx - 8}
                    y={ty + 3}
                    fill={C.text3}
                    fontSize="7"
                    textAnchor="end"
                    fontFamily="ui-monospace, SFMono-Regular, monospace"
                  >
                    {v * 5}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })()}

      {/* Bubbles — sorted back-to-front */}
      {[...data]
        .sort((a, b) => b[0] + b[2] - (a[0] + a[2]))
        .map(([bx, by, bz, r, color], i) => {
          const [sx, sy] = pt(bx, by, bz);
          const [fx, fy] = floorPt(bx, bz);
          const hex = color.replace('#', '');
          return (
            <g
              key={i}
              style={{
                animation: 'scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
                animationDelay: `${0.2 + i * 0.05}s`,
              }}
            >
              {/* Floor shadow */}
              <ellipse cx={fx} cy={fy} rx={r * 0.7} ry={r * 0.25} fill={`${color}12`} />
              {/* Stem line */}
              <line x1={sx} y1={sy} x2={fx} y2={fy} stroke={`${color}18`} strokeWidth="0.5" strokeDasharray="2,3" />
              {/* Glow layer */}
              <circle cx={sx} cy={sy} r={r * 1.5} fill={`${color}08`} />
              {/* Bubble */}
              <circle cx={sx} cy={sy} r={r} fill={`url(#b3d-${hex})`} />
              {/* Specular highlight */}
              <circle cx={sx - r * 0.25} cy={sy - r * 0.25} r={r * 0.2} fill="rgba(255,255,255,0.35)" />
            </g>
          );
        })}
    </svg>
  );
}

// ─── 3D AREA / SURFACE CHART ─────────────────────────────────────────────────

export function Chart3DArea() {
  const W = 420;
  const H = 280;
  const ox = W / 2;
  const oy = H * 0.62;
  const sc = 1.0;

  const months = ['Okt', 'Nov', 'Dez', 'Jan', 'Feb', 'Mär', 'Apr'];
  const layers = [
    { color: '#6366F1', data: [40, 55, 70, 60, 80, 95, 85] },
    { color: '#818CF8', data: [30, 42, 55, 48, 62, 72, 65] },
    { color: '#A5B4FC', data: [20, 30, 40, 35, 45, 52, 48] },
    { color: '#38BDF8', data: [12, 18, 25, 22, 30, 35, 32] },
  ];

  const xLen = 120;
  const zLen = 70;

  function pt2(x: number, y: number, z: number): [number, number] {
    const [px, py] = p(x, y, z);
    return [ox + px * sc, oy + py * sc];
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
      <defs>
        {layers.map((l, i) => (
          <linearGradient key={i} id={`sf-${i}`} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor={l.color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={l.color} stopOpacity="0.08" />
          </linearGradient>
        ))}
        <filter id="line-glow3d">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {/* Floor grid */}
      <g opacity="0.4">
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
          const x = f * xLen;
          const [x1, y1] = pt2(x, 0, 0);
          const [x2, y2] = pt2(x, 0, zLen);
          return (
            <line key={`x${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(99,102,241,0.07)" strokeWidth="0.5" />
          );
        })}
        {[0, 0.33, 0.67, 1].map((f, i) => {
          const z = f * zLen;
          const [x1, y1] = pt2(0, 0, z);
          const [x2, y2] = pt2(xLen, 0, z);
          return (
            <line key={`z${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(99,102,241,0.07)" strokeWidth="0.5" />
          );
        })}
      </g>

      {/* Axes */}
      {(() => {
        const [ax, ay] = pt2(0, 0, 0);
        const [bx, by] = pt2(xLen, 0, 0);
        const [cxx, cyy] = pt2(0, 0, zLen);
        const [dx, dy] = pt2(0, 100, 0);
        return (
          <g>
            <line x1={ax} y1={ay} x2={bx} y2={by} stroke="rgba(99,102,241,0.18)" strokeWidth="0.8" />
            <line x1={ax} y1={ay} x2={cxx} y2={cyy} stroke="rgba(99,102,241,0.18)" strokeWidth="0.8" />
            <line x1={ax} y1={ay} x2={dx} y2={dy} stroke="rgba(99,102,241,0.18)" strokeWidth="0.8" />
          </g>
        );
      })()}

      {/* Surface layers — render back to front */}
      {[...layers].reverse().map((layer, li) => {
        const zPos = (li / Math.max(layers.length - 1, 1)) * zLen;
        const n = layer.data.length;

        // Top edge points
        const top = layer.data.map((v, i) => pt2((i / (n - 1)) * xLen, v, zPos));
        // Bottom edge points (floor)
        const bot = layer.data.map((_, i) => pt2((i / (n - 1)) * xLen, 0, zPos));

        const topD = top.map((pp, i) => `${i === 0 ? 'M' : 'L'}${pp[0].toFixed(1)},${pp[1].toFixed(1)}`).join(' ');
        const botD = [...bot]
          .reverse()
          .map((pp) => `L${pp[0].toFixed(1)},${pp[1].toFixed(1)}`)
          .join(' ');

        const realIdx = layers.length - 1 - li;

        return (
          <g
            key={li}
            style={{
              animation: 'fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
              animationDelay: `${0.2 + li * 0.1}s`,
            }}
          >
            {/* Filled area */}
            <path d={`${topD} ${botD} Z`} fill={`url(#sf-${realIdx})`} />
            {/* Glow line behind */}
            <path d={topD} fill="none" stroke={layer.color} strokeWidth="3" opacity="0.15" filter="url(#line-glow3d)" />
            {/* Crisp top line */}
            <path
              d={topD}
              fill="none"
              stroke={layer.color}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
            {/* Data dots on top line */}
            {top.map((pp, di) => (
              <circle key={di} cx={pp[0]} cy={pp[1]} r="2" fill={layer.color} opacity="0.8" />
            ))}
          </g>
        );
      })}

      {/* Y-axis labels */}
      {[25, 50, 75, 100].map((v) => {
        const [tx, ty] = pt2(0, v, 0);
        return (
          <text
            key={v}
            x={tx - 8}
            y={ty + 3}
            fill={C.text3}
            fontSize="7"
            textAnchor="end"
            fontFamily="ui-monospace, SFMono-Regular, monospace"
          >
            €{v}k
          </text>
        );
      })}

      {/* X-axis labels (months) */}
      {months.map((m, i) => {
        const [mx, my] = pt2((i / (months.length - 1)) * xLen, 0, 0);
        return (
          <text key={m} x={mx} y={my + 14} fill={C.text3} fontSize="7" textAnchor="middle" fontFamily="system-ui">
            {m}
          </text>
        );
      })}
    </svg>
  );
}
