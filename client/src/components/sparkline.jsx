import { useId } from "react";

// Purpose: show the shape of a small price series without a chart engine.
// Inputs: points, direction, height. Output: SVG. File: components/sparkline.jsx.
export function Sparkline({ points = [], positive = true, height = 34 }) {
  const id = useId().replace(/:/g, "");
  const values = points.filter(Number.isFinite);
  if (values.length < 2) return <span className="text-[10px] text-[var(--text-muted)]">No history</span>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const coordinates = values.map((value, index) => [3 + index / (values.length - 1) * 80, max === min ? height / 2 : 4 + (max - value) / span * (height - 8)]);
  const path = coordinates.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const color = positive ? "#c69b60" : "#f16d7a";
  return <svg width="86" height={height} viewBox={`0 0 86 ${height}`} className="shrink-0" aria-hidden="true">
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor={color} stopOpacity=".2" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
    <path d={`${path} L83,${height} L3,${height} Z`} fill={`url(#${id})`} />
    <path d={path} stroke={color} strokeWidth="1.8" fill="none" strokeLinejoin="round" strokeLinecap="round" />
  </svg>;
}
