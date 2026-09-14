import { octagonVertices } from "./geometry.js";

/**
 * ScenePoster — the still alternative to the WebGL hero.
 *
 * Purpose : when motion is reduced (by OS preference or the in-product pause
 *           control) the scene must not animate. Rather than loading Three.js
 *           to render one static frame, this draws the same composition — market
 *           rings, depth layers and a price surface — as inline SVG. It costs no
 *           WebGL context, no shader compilation and no extra bytes.
 * Input   : none.
 * Output  : a decorative SVG with a fixed aspect ratio, so no layout shift.
 */
export function ScenePoster() {
  const centre = 260;

  /* The same ring radii the 3D scene uses, projected flat. */
  const rings = [
    { radius: 210, width: 1, opacity: 0.18, colour: "currentColor" },
    { radius: 152, width: 1.6, opacity: 0.34, colour: "currentColor" },
    { radius: 100, width: 1.4, opacity: 1, colour: "var(--accent)" }
  ];

  const depth = [
    { radius: 250, opacity: 0.1 },
    { radius: 288, opacity: 0.06 }
  ];

  /* A static price surface: rows of polylines with decreasing amplitude, the
     same two-wave shape the shader produces. */
  const waveRows = 7;
  const waveCols = 46;

  const rows = Array.from({ length: waveRows }, (_, row) => {
    const rowT = row / (waveRows - 1);
    const y = 392 + rowT * 74;
    const amplitude = 22 * (1 - rowT * 0.55);

    const points = Array.from({ length: waveCols }, (_, col) => {
      const colT = col / (waveCols - 1);
      const x = 26 + colT * 468;
      const primary = Math.sin(colT * 7 + rowT * 2.4);
      const secondary = Math.sin(colT * 17 + rowT * 1.1) * 0.35;
      return `${x.toFixed(1)},${(y - (primary + secondary) * amplitude).toFixed(1)}`;
    }).join(" ");

    return { points, opacity: (1 - rowT) * 0.42 + 0.05, rowT };
  });

  const polygon = (radius) =>
    octagonVertices(radius)
      .map(([x, y]) => `${(centre + x).toFixed(1)},${(centre + y).toFixed(1)}`)
      .join(" ");

  return (
    <svg
      className="ot-scene__poster"
      viewBox="0 0 520 500"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      {depth.map((layer) => (
        <polygon
          key={`depth-${layer.radius}`}
          points={polygon(layer.radius)}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity={layer.opacity}
        />
      ))}

      {rings.map((ring) => (
        <polygon
          key={`ring-${ring.radius}`}
          points={polygon(ring.radius)}
          fill="none"
          stroke={ring.colour}
          strokeWidth={ring.width}
          opacity={ring.opacity}
        />
      ))}

      {/* Order-flow marks: static dots on the ring perimeters. */}
      {rings.flatMap((ring) =>
        octagonVertices(ring.radius).map(([x, y], index) => (
          <circle
            key={`flow-${ring.radius}-${index}`}
            cx={centre + x}
            cy={centre + y}
            r={index % 3 === 0 ? 2.6 : 1.6}
            fill="var(--accent)"
            opacity={index % 3 === 0 ? 0.8 : 0.4}
          />
        ))
      )}

      {/* Coordinate axes through the core. */}
      <line x1={centre} y1="44" x2={centre} y2="476" stroke="currentColor" strokeWidth="1" opacity="0.07" />
      <line x1="44" y1={centre} x2="476" y2={centre} stroke="currentColor" strokeWidth="1" opacity="0.07" />

      {/* The market core. */}
      <polygon
        points={`${centre},${centre - 26} ${centre + 26},${centre} ${centre},${centre + 26} ${centre - 26},${centre}`}
        fill="var(--silver-100)"
        opacity="0.9"
      />

      {rows.map((row) => (
        <polyline
          key={`wave-${row.rowT}`}
          points={row.points}
          fill="none"
          stroke={row.rowT < 0.34 ? "var(--accent)" : "currentColor"}
          strokeWidth="1"
          opacity={row.opacity}
        />
      ))}
    </svg>
  );
}
