import { useMemo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { EM_DASH, formatPaise, formatPercent } from "../../lib/format.js";
import { EmptyState } from "../ui/States.jsx";
import { allocationColours } from "./chartTheme.js";
import { useResolvedTheme } from "../ThemeProvider.jsx";
import { PieChart as PieIcon } from "lucide-react";

/**
 * AllocationDonut — portfolio allocation by holding.
 *
 * Purpose : show how the account's capital is distributed across securities,
 *           using real figures only. Allocation is computed from market value
 *           when live quotes resolved, and from invested cost otherwise; the
 *           basis is always stated so the reader knows which they are seeing.
 * Input   : rows from usePortfolioValuation(), basis "market" | "cost".
 * Output  : a Recharts donut with a real legend and an accessible table
 *           summary, or an empty state when there is nothing to allocate.
 */
export function AllocationDonut({ rows = [], basis = "market", height = 260 }) {
  /* The ramp follows the active theme so slices keep contrast in both. */
  const palette = allocationColours(useResolvedTheme());

  const { slices, total, usedBasis } = useMemo(() => {
    /* Prefer market value, but only if every holding could be priced —
       a mixed basis would misrepresent the proportions. */
    const allPriced =
      rows.length > 0 && rows.every((row) => row.marketValuePaise !== null);

    const effectiveBasis = basis === "market" && allPriced ? "market" : "cost";

    const data = rows
      .map((row) => ({
        symbol: row.symbol,
        value:
          effectiveBasis === "market"
            ? row.marketValuePaise ?? 0
            : row.investedPaise ?? 0
      }))
      .filter((entry) => entry.value > 0)
      .sort((a, b) => b.value - a.value);

    const sum = data.reduce((acc, entry) => acc + entry.value, 0);

    return { slices: data, total: sum, usedBasis: effectiveBasis };
  }, [rows, basis]);

  if (slices.length === 0) {
    return (
      <EmptyState
        icon={PieIcon}
        compact
        title="No allocation to show"
        description="Allocation appears once the account holds at least one position."
      />
    );
  }

  const basisLabel =
    usedBasis === "market" ? "current market value" : "invested cost";

  return (
    <div className="ot-alloc">
      <div className="ot-alloc__chart">
        {/* ResponsiveContainer handles the resize; an explicit height prevents
            the layout shifting while it measures. */}
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="symbol"
              innerRadius="64%"
              outerRadius="84%"
              paddingAngle={1.5}
              stroke="var(--surface)"
              strokeWidth={1.5}
              isAnimationActive={false}
            >
              {slices.map((entry, index) => (
                <Cell
                  key={entry.symbol}
                  fill={palette[index % palette.length]}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const entry = payload[0];
                const share = total > 0 ? (entry.value / total) * 100 : null;
                return (
                  <div className="ot-chart-tip">
                    <p className="ot-chart-tip__title ot-mono">{entry.name}</p>
                    <p className="ot-chart-tip__row">
                      <span>{basisLabel}</span>
                      <span className="ot-num">{formatPaise(entry.value)}</span>
                    </p>
                    <p className="ot-chart-tip__row">
                      <span>share</span>
                      <span className="ot-num">{formatPercent(share)}</span>
                    </p>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={1}
              content={() => null}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* The legend doubles as the accessible representation of the chart. */}
      <ul className="ot-alloc__legend">
        {slices.map((entry, index) => {
          const share = total > 0 ? (entry.value / total) * 100 : null;
          return (
            <li className="ot-alloc__legend-row" key={entry.symbol}>
              <span
                className="ot-alloc__swatch"
                style={{
                  background: palette[index % palette.length]
                }}
                aria-hidden="true"
              />
              <span className="ot-alloc__legend-symbol ot-mono">{entry.symbol}</span>
              <span className="ot-alloc__legend-share ot-num">
                {share === null ? EM_DASH : formatPercent(share, { digits: 1 })}
              </span>
              <span className="ot-alloc__legend-value ot-num">
                {formatPaise(entry.value)}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="ot-alloc__basis ot-label">
        Allocation by {basisLabel}
        {usedBasis === "cost" && basis === "market"
          ? " — a live quote is missing for at least one holding"
          : ""}
      </p>
    </div>
  );
}
