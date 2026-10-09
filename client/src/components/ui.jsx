import { motion, useReducedMotion } from "motion/react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  ...props
}) {
  const variants = {
    primary: "bg-brand-500 text-white shadow-[0_10px_30px_rgba(167,123,62,0.28)] hover:bg-brand-400",
    secondary: "border border-[var(--line)] bg-[var(--panel-muted)] text-[var(--text)] hover:border-brand-500/35 hover:bg-brand-500/8",
    ghost: "text-[var(--text-muted)] hover:bg-brand-500/10 hover:text-[var(--text)]",
    danger: "bg-red-500/12 text-red-500 hover:bg-red-500/20"
  };
  const sizes = {
    sm: "h-8 rounded-lg px-3 text-xs",
    md: "h-10 rounded-xl px-4 text-sm",
    lg: "h-12 rounded-xl px-5 text-sm",
    icon: "size-10 rounded-xl"
  };
  return <button
    className={cn(
      "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/55 disabled:pointer-events-none disabled:opacity-45",
      variants[variant],
      sizes[size],
      className
    )}
    disabled={disabled || loading}
    {...props}
  >
      {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {children}
    </button>;
}
function Card({ className, ...props }) {
  return <div
    className={cn(
      "panel rounded-2xl transition-colors duration-200",
      className
    )}
    {...props}
  />;
}
function Badge({ className, tone = "neutral", ...props }) {
  const tones = {
    neutral: "bg-[var(--panel-muted)] text-[var(--text-muted)]",
    positive: "bg-emerald-500/12 text-emerald-500",
    negative: "bg-red-500/12 text-red-500",
    warning: "bg-brand-500/12 text-brand-500",
    info: "bg-brand-500/12 text-brand-500"
  };
  return <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] uppercase",
      tones[tone],
      className
    )}
    {...props}
  />;
}
function Input({ className, ...props }) {
  return <input
    className={cn(
      "h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] px-3.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--text-muted)]/70 focus:border-brand-500/55 focus:ring-4 focus:ring-brand-500/8",
      className
    )}
    {...props}
  />;
}
function Skeleton({ className, ...props }) {
  return <div
    className={cn(
      "animate-pulse rounded-xl bg-[var(--panel-muted)]",
      className
    )}
    {...props}
  />;
}
function PageHeader({ eyebrow, title, description, actions }) {
  return <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
  >
      <div>
        {eyebrow ? <p className="mb-2 text-[11px] font-bold tracking-[0.18em] text-brand-500 uppercase">
            {eyebrow}
          </p> : null}
        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-[var(--text)] md:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
          {description}
        </p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </motion.div>;
}
function SectionHeader({ title, description, action }) {
  return <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold tracking-[-0.02em] text-[var(--text)]">
          {title}
        </h2>
        {description ? <p className="mt-1 text-xs text-[var(--text-muted)]">{description}</p> : null}
      </div>
      {action}
    </div>;
}
function MetricCard({
  label,
  value,
  delta,
  positive = true,
  icon,
  footer,
  animated = false,
  delay = 0
}) {
  const reduceMotion = useReducedMotion();
  return <motion.div
    initial={reduceMotion ? false : { opacity: 0, x: 0, y: 14 }}
    animate={{ opacity: 1, x: 0, y: 0 }}
    transition={reduceMotion ? { duration: 0 } : { delay, duration: 0.48, ease: "easeOut" }}
    whileHover={reduceMotion ? undefined : { y: -2 }}
    className={cn("panel relative min-h-40 overflow-hidden rounded-2xl p-5 md:p-6", animated && "metric-card-themed")}
  >
      {animated ? <div
        aria-hidden="true"
        className="metric-card-effects"
      /> : null}
      <div className={cn("absolute -top-12 -right-12 size-28 rounded-full blur-2xl", animated ? "metric-card-corner-glow" : "bg-brand-500/8")} />
      <div className="relative flex items-center justify-between">
        <p className="text-base font-semibold tracking-[-0.02em] text-[var(--text-muted)] md:text-[17px]">{label}</p>
        <span className={cn("grid size-9 place-items-center rounded-xl", animated ? "metric-card-themed-icon" : "bg-brand-500/10 text-brand-500")}>
          {icon}
        </span>
      </div>
      <p className="number-tabular relative mt-6 text-[1.7rem] leading-none font-semibold tracking-[-0.05em] text-[var(--text)] md:text-[2rem]">
        {value}
      </p>
      <div className="relative mt-4 flex min-h-5 items-center justify-between gap-3">
        {delta ? <span className={cn("text-sm font-semibold", positive ? "text-emerald-500" : "text-red-500")}>
            {delta}
          </span> : <span />}
        {footer}
      </div>
    </motion.div>;
}
function EmptyState({ icon, title, description, action }) {
  return <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 grid size-11 place-items-center rounded-xl bg-brand-500/10 text-brand-500">
        {icon}
      </div>
      <h3 className="font-semibold text-[var(--text)]">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-[var(--text-muted)]">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>;
}
export {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  MetricCard,
  PageHeader,
  SectionHeader,
  Skeleton
};
