import { cn } from "@/lib/utils";
function OctaMark({ className }) {
  return <svg
    viewBox="0 0 48 48"
    fill="none"
    aria-hidden="true"
    className={cn("size-9", className)}
  >
      <defs>
        <linearGradient id="octa-gradient" x1="8" y1="5" x2="40" y2="43">
          <stop stopColor="#f3dfb0" />
          <stop offset="1" stopColor="#a77b3e" />
        </linearGradient>
      </defs>
      <path
    d="M17 3.8h14L44.2 17v14L31 44.2H17L3.8 31V17L17 3.8Z"
    fill="url(#octa-gradient)"
  />
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
            Octa<span className="text-brand-500">Trade</span>
          </span>
          <span className="mt-1 block text-[8px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
            Paper markets
          </span>
        </div> : null}
    </div>;
}
export {
  Brand,
  OctaMark
};
