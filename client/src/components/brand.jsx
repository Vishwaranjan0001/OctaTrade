import { useId } from "react";
import { cn } from "@/lib/utils";
const octagonPath = "M17 3.8h14L44.2 17v14L31 44.2H17L3.8 31V17L17 3.8Z";
function OctaMark({ className }) {
  const id = useId();
  const gradientId = `${id}-octa-gradient`;
  const shimmerId = `${id}-octa-shimmer`;
  const clipId = `${id}-octa-clip`;
  return <svg
    viewBox="0 0 48 48"
    fill="none"
    aria-hidden="true"
    className={cn("octa-mark size-9 shrink-0", className)}
  >
      <defs>
        <linearGradient id={gradientId} x1="8" y1="5" x2="40" y2="43">
          <stop stopColor="#f3dfb0" />
          <stop offset="1" stopColor="#a77b3e" />
        </linearGradient>
        <linearGradient id={shimmerId}>
          <stop stopColor="#fff8e5" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff8e5" stopOpacity="0.45" />
          <stop offset="1" stopColor="#fff8e5" stopOpacity="0" />
        </linearGradient>
        <clipPath id={clipId}>
          <path d={octagonPath} />
        </clipPath>
      </defs>
      <g className="octa-mark-emblem">
        <path d={octagonPath} fill={`url(#${gradientId})`} />
        <g clipPath={`url(#${clipId})`}>
          <g className="octa-mark-shimmer">
            <rect x="-24" y="0" width="14" height="48" fill={`url(#${shimmerId})`} transform="skewX(-20)" />
          </g>
        </g>
      </g>
      <path
    d="M16 28.5 21 23l4 3.7 7.5-9.2"
    stroke="#181918"
    strokeWidth="3.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
      <path d="M32.5 17.5v7" stroke="#181918" strokeWidth="3.2" strokeLinecap="round" />
    </svg>;
}
function Brand({ compact = false, className }) {
  return <div className={cn("flex items-center gap-2.5", className)}>
      <OctaMark />
      {!compact ? <div className="leading-none">
          <span className="brand-name text-lg font-bold tracking-[-0.045em]">
            Octa<span className="brand-trade text-brand-500">Trade</span>
          </span>
        </div> : null}
    </div>;
}
export {
  Brand,
  OctaMark
};
