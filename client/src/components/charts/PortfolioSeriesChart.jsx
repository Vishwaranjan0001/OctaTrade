import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatDate, formatPaise, formatPaiseCompact } from "../../lib/format.js";
import { DataUnavailable } from "../ui/States.jsx";
import { readChartTheme } from "./chartTheme.js";
import { useResolvedTheme } from "../ThemeProvider.jsx";

/**
 * PortfolioSeriesChart — portfolio value over time.
 *
 * Purpose : plot the account's real value history. The OctaTrade API currently
 *           exposes no portfolio time series (holdings carry cost basis and a
 *           timestamp, not daily valuations), so with no data this renders the
 *           unavailable state. It does NOT synthesise a curve from the current
 *           value, which would fabricate performance history.
 * Input   : series [{ time, valuePaise }] — real points only.
 * Output  : a Recharts area chart, or the unavailable state.
 */
export function PortfolioSeriesChart({ series = [], height = 260 }) {
  const theme = useResolvedTheme();
  const palette = readChartTheme(theme);

  const points = (series || []).filter(
    (point) => point && Number.isFinite(point.valuePaise) && point.time
  );

  if (points.length < 2) {
    return (
      <DataUnavailable
        title="Portfolio history is not available yet"
        description="OctaTrade stores holdings as current cost basis, so there is no valuation history to plot. Connect a portfolio snapshot endpoint to chart value over time."
        requirement="GET /api/portfolio/history returning dated portfolio valuations"
      />
    );
  }

  return (
    <figure className="ot-chart">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="ot-portfolio-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.accent} stopOpacity={0.28} />
              <stop offset="100%" stopColor={palette.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={palette.grid} vertical={false} />
          <XAxis
            dataKey="time"
            tickFormatter={(value) => formatDate(value)}
            stroke={palette.textFaint}
            tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={{ stroke: palette.grid }}
            minTickGap={28}
          />
          <YAxis
            tickFormatter={(value) => formatPaiseCompact(value)}
            stroke={palette.textFaint}
            tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            width={66}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload;
              return (
                <div className="ot-chart-tip">
                  <p className="ot-chart-tip__title ot-mono">
                    {formatDate(point.time)}
                  </p>
                  <p className="ot-chart-tip__row">
                    <span>value</span>
                    <span className="ot-num">{formatPaise(point.valuePaise)}</span>
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="valuePaise"
            stroke={palette.accent}
            strokeWidth={1.6}
            fill="url(#ot-portfolio-fill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      <figcaption className="ot-sr">
        Portfolio value over time, {points.length} data points.
      </figcaption>
    </figure>
  );
}
