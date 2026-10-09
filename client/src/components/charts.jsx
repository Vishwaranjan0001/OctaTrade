import { useEffect, useId, useMemo, useRef } from "react";
import { Area, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CandlestickSeries, ColorType, createChart, HistogramSeries, LineSeries } from "lightweight-charts";
import { cn } from "@/lib/utils";
import { formatCompact, formatCurrency, formatCurrencyFromPaise } from "@/lib/format";
import { cleanCandles } from "@/lib/chart-data";
import { useAppStore } from "@/store/app-store";
export { Sparkline } from "@/components/sparkline";

const tickStyle = { fill: "var(--text-muted)", fontSize: 10 };
const EMPTY = [];

// Candle size for each history range (TradingChart needs it to format times).
export const RANGE_INTERVALS = { "1D": "5m", "1W": "30m", "1M": "1D", "1Y": "1D" };

export function RangePicker({ range, onChange }) {
  return <div className="flex gap-1 rounded-xl bg-[var(--panel-muted)] p-1">
    {Object.keys(RANGE_INTERVALS).map((option) => <button
      key={option}
      type="button"
      onClick={() => onChange(option)}
      className={cn("h-7 rounded-lg px-3 text-[10px] font-semibold transition", range === option ? "bg-[var(--panel-solid)] text-brand-500 shadow-sm" : "text-[var(--text-muted)]")}
    >
      {option}
    </button>)}
  </div>;
}

// Purpose: explain missing chart data. Input: message. Output: accessible panel.
// File: components/charts.jsx.
function ChartEmpty({ message = "Historical data is not available yet." }) {
  return <div className="chart-empty" role="status"><span className="text-2xl text-[var(--text-muted)]">↗</span><p>{message}</p></div>;
}

// Purpose: display both series at a selected date. Inputs: chart tooltip props.
// Output: theme-aware tooltip. File: components/charts.jsx.
function ValueTooltip({ active, payload, label, normalized = false }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip">
    <p className="mb-2 text-[10px] text-[var(--text-muted)]">{payload[0]?.payload?.date ?? label}</p>
    {payload.map((entry) => <div key={entry.dataKey} className="mt-1 flex items-center justify-between gap-6 text-xs"><span className="flex items-center gap-2"><i className="size-2 rounded-full" style={{ background: entry.color }} />{entry.name}</span><strong className="number-tabular">{normalized ? `₹${Number(entry.value).toFixed(3)}` : formatCurrency(entry.value, 0)}</strong></div>)}
  </div>;
}

// Purpose: plot a portfolio and comparison on the same labelled axes.
// Inputs: dated rupee data, normalized display choice. Output: chart or empty state.
// File: components/charts.jsx.
export function PortfolioChart({ data = EMPTY, normalized = false }) {
  const fillId = useId().replace(/:/g, "");
  const points = useMemo(() => {
    const valid = data.filter((point) => Number.isFinite(point.value));
    const firstValue = valid[0]?.value;
    const firstBenchmark = valid[0]?.benchmark;
    return valid.map((point) => ({
      ...point,
      value: normalized && firstValue ? point.value / firstValue : point.value,
      benchmark: Number.isFinite(point.benchmark) ? normalized && firstBenchmark ? point.benchmark / firstBenchmark : point.benchmark : undefined
    }));
  }, [data, normalized]);
  const values = points.flatMap((point) => [point.value, point.benchmark]).filter(Number.isFinite);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const padding = Math.max((max - min) * 0.16, Math.abs(max) * 0.002, normalized ? 0.001 : 1);
  if (points.length < 2) return <ChartEmpty />;
  return <div className="chart-frame h-[290px] md:h-[350px]" role="img" aria-label={normalized ? "Growth of one rupee over time, compared with a benchmark" : "Portfolio value in rupees over time"}>
    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={60}>
      <ComposedChart data={points} margin={{ top: 20, right: 10, bottom: 8, left: 0 }}>
        <defs><linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#c69b60" stopOpacity=".25" /><stop offset="1" stopColor="#c69b60" stopOpacity="0" /></linearGradient></defs>
        <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 5" />
        <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} minTickGap={44} tickMargin={12} interval="preserveStartEnd" />
        <YAxis domain={[min - padding, max + padding]} tick={tickStyle} tickFormatter={(value) => normalized ? `₹${value.toFixed(3)}` : `₹${formatCompact(value)}`} axisLine={false} tickLine={false} width={66} tickCount={5} />
        <Tooltip content={<ValueTooltip normalized={normalized} />} cursor={{ stroke: "#8c857a", strokeDasharray: "4 4" }} isAnimationActive={false} />
        <Area name="Portfolio" type="linear" dataKey="value" stroke="#c69b60" strokeWidth={2.3} fill={`url(#${fillId})`} baseValue={min - padding} dot={false} isAnimationActive={false} activeDot={{ r: 4, stroke: "var(--panel-solid)", strokeWidth: 2 }} />
        <Line name="Benchmark" type="linear" dataKey="benchmark" stroke="#a67c40" strokeWidth={1.6} strokeDasharray="5 4" dot={false} isAnimationActive={false} connectNulls={false} />
      </ComposedChart>
    </ResponsiveContainer>
  </div>;
}

// Purpose: display a position's weight. Input: Recharts tooltip props.
// Output: theme-aware allocation tooltip. File: components/charts.jsx.
function AllocationTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return <div className="chart-tooltip text-xs"><p className="text-[var(--text-muted)]">{point.name}</p><strong className="mt-1 block">{point.value.toFixed(1)}% of portfolio</strong></div>;
}

// Purpose: show allocation without overflowing narrow cards.
// Inputs: positive percentage weights and centre text. Output: responsive donut.
// File: components/charts.jsx.
export function AllocationChart({ data = EMPTY, centerLabel = "Invested", centerValue = "100%" }) {
  const valid = data.filter((point) => Number.isFinite(point.value) && point.value > 0);
  if (!valid.length) return <ChartEmpty message="No positions to display yet." />;
  return <div className="chart-frame relative h-60" role="img" aria-label={`Allocation: ${valid.map((point) => `${point.name} ${point.value.toFixed(1)} percent`).join(", ")}`}>
    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={60}>
      <PieChart><Pie data={valid} dataKey="value" nameKey="name" innerRadius="67%" outerRadius="87%" paddingAngle={valid.length > 1 ? 2 : 0} stroke="var(--panel-solid)" strokeWidth={2} isAnimationActive={false}>
        {valid.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
      </Pie><Tooltip content={<AllocationTooltip />} isAnimationActive={false} /></PieChart>
    </ResponsiveContainer>
    <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
      <span className="text-[9px] tracking-wider text-[var(--text-muted)] uppercase">{centerLabel}</span>
      <strong className="number-tabular mt-2 max-w-32 break-words text-base text-[var(--text)]">{centerValue}</strong>
    </div>
  </div>;
}

// Purpose: plot price candles or a closing-price line, with volume below.
// Inputs: valid OHLC data, type, interval, size classes. Output: owned canvas chart.
// File: components/charts.jsx.
export function TradingChart({ data = EMPTY, chartType = "Candles", timeframe = "1D", showVolume = true, className }) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const theme = useAppStore((state) => state.theme);
  const points = useMemo(() => cleanCandles(data), [data]);
  const intraday = !["1D", "1W"].includes(timeframe);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chart = createChart(container, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#a7aca8", fontFamily: "Inter, Segoe UI, sans-serif", fontSize: 11 },
      rightPriceScale: { borderVisible: false, minimumWidth: 72, scaleMargins: { top: 0.1, bottom: 0.28 } },
      timeScale: { borderVisible: false, rightOffset: 3, fixLeftEdge: true, secondsVisible: false },
      crosshair: { vertLine: { color: "#858b87", labelBackgroundColor: "#171917" }, horzLine: { color: "#858b87", labelBackgroundColor: "#171917" } },
      handleScroll: { vertTouchDrag: false, horzTouchDrag: true },
      localization: {
        locale: "en-IN",
        priceFormatter: (price) => formatCurrency(price),
        timeFormatter: (time) => {
          const date = typeof time === "number" ? new Date(time * 1000) : new Date(typeof time === "string" ? time : Date.UTC(time.year, time.month - 1, time.day));
          return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", ...(typeof time === "number" ? { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" } : { timeZone: "UTC" }) }).format(date);
        }
      }
    });
    const price = chart.addSeries(chartType === "Line" ? LineSeries : CandlestickSeries, chartType === "Line" ? { color: "#c69b60", lineWidth: 2, priceFormat: { type: "price", precision: 2, minMove: 0.01 } } : { upColor: "#c69b60", downColor: "#fb7185", borderVisible: false, wickUpColor: "#c69b60", wickDownColor: "#c69b60" });
    const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "", priceLineVisible: false, lastValueVisible: false });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0.02 } });
    instanceRef.current = { chart, price, volume };
    return () => { instanceRef.current = null; chart.remove(); };
  }, [chartType]);
  useEffect(() => {
    const current = instanceRef.current;
    if (!current) return;
    const dark = theme === "dark";
    current.chart.applyOptions({
      layout: { textColor: dark ? "#a7aca8" : "#6f7470" },
      grid: { vertLines: { color: dark ? "#292b29" : "#e1e3df" }, horzLines: { color: dark ? "#292b29" : "#e1e3df" } }
    });
  }, [theme, chartType]);
  useEffect(() => {
    const current = instanceRef.current;
    if (!current) return;
    current.volume.applyOptions({ visible: showVolume });
    current.chart.priceScale("right").applyOptions({ scaleMargins: { top: 0.1, bottom: showVolume ? 0.28 : 0.1 } });
  }, [showVolume, chartType]);
  useEffect(() => {
    const current = instanceRef.current;
    if (!current) return;
    current.price.setData(points.map((point) => chartType === "Line" ? { time: point.time, value: point.close } : { time: point.time, open: point.open, high: point.high, low: point.low, close: point.close }));
    current.volume.setData(points.map((point) => ({ time: point.time, value: point.volume, color: point.close >= point.open ? "rgba(198,155,96,.28)" : "rgba(251,113,133,.28)" })));
    current.chart.applyOptions({ timeScale: {
      timeVisible: intraday,
      tickMarkFormatter: intraday ? (time) => typeof time === "number" ? new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date(time * 1000)) : String(time) : undefined
    } });
    current.chart.timeScale().fitContent();
  }, [points, chartType, intraday]);
  return <div className="relative min-w-0">
    <div ref={containerRef} className={cn("trading-chart h-[440px] w-full", className)} role="img" aria-label={`${chartType} chart, ${timeframe} intervals. Prices in INR, ${showVolume ? "volume below" : "volume hidden"}. ${points.length} bars.`} />
    {!points.length && <div className="absolute inset-0 bg-[var(--panel-solid)]"><ChartEmpty message="No price history is available for this symbol." /></div>}
  </div>;
}

// Purpose: show dated daily P&L. Input: {date,value} entries in paise.
// Output: calendar cells with exact dates/values. File: components/charts.jsx.
export function ProfitHeatmap({ values = EMPTY }) {
  if (!values.length) return <ChartEmpty message="Daily P&L history is not available yet." />;
  const maximum = Math.max(...values.map((entry) => Math.abs(entry.value)), 1);
  return <div className="overflow-x-auto pb-2">
    <div className="mb-3 flex min-w-[420px] justify-between text-[10px] text-[var(--text-muted)]"><span>{values[0].date}</span><span>{values.at(-1).date}</span></div>
    <div className="grid min-w-[420px] grid-flow-col grid-rows-7 gap-1.5">
      {values.map(({ date, value }) => <div key={date} tabIndex={0} role="img" aria-label={`${date}: ${formatCurrencyFromPaise(value)}`} title={`${date}: ${formatCurrencyFromPaise(value)}`} className="aspect-square rounded-[4px] focus:outline-2 focus:outline-offset-2 focus:outline-brand-400" style={{ background: value === 0 ? "var(--panel-muted)" : `rgba(${value > 0 ? "16,185,129" : "244,63,94"},${0.2 + Math.abs(value) / maximum * 0.7})` }} />)}
    </div>
  </div>;
}
