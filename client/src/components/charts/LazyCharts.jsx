import { Suspense, lazy } from "react";
import { Skeleton } from "../ui/States.jsx";

/*
  Chart libraries behind explicit dynamic-import boundaries.

  Recharts (~385 kB) and Lightweight Charts (~194 kB) are only needed on the
  surfaces that actually draw. Relying on build-time chunk grouping alone proved
  fragile: a single shared helper hoisted into the recharts chunk was enough to
  create a static edge from the entry, which dragged the whole library onto
  routes with no charts. A real dynamic import cannot be collapsed that way.

  Each wrapper reserves the chart's final height while the chunk arrives, so the
  surrounding layout does not shift when it lands.
*/

const AllocationDonutImpl = lazy(() =>
  import("./AllocationDonut.jsx").then((m) => ({ default: m.AllocationDonut }))
);

const PortfolioSeriesChartImpl = lazy(() =>
  import("./PortfolioSeriesChart.jsx").then((m) => ({ default: m.PortfolioSeriesChart }))
);

const CandleChartImpl = lazy(() =>
  import("./CandleChart.jsx").then((m) => ({ default: m.CandleChart }))
);

/** Height-reserving placeholder so the chart's arrival causes no layout shift. */
function ChartFallback({ height, label }) {
  return (
    <div style={{ height }} role="status" aria-busy="true">
      <span className="ot-sr">{label}</span>
      <Skeleton height={height} />
    </div>
  );
}

export function AllocationDonut(props) {
  return (
    <Suspense fallback={<ChartFallback height={props.height ?? 260} label="Loading allocation chart" />}>
      <AllocationDonutImpl {...props} />
    </Suspense>
  );
}

export function PortfolioSeriesChart(props) {
  return (
    <Suspense fallback={<ChartFallback height={props.height ?? 260} label="Loading portfolio chart" />}>
      <PortfolioSeriesChartImpl {...props} />
    </Suspense>
  );
}

export function CandleChart(props) {
  return (
    <Suspense fallback={<ChartFallback height={props.height ?? 380} label="Loading price chart" />}>
      <CandleChartImpl {...props} />
    </Suspense>
  );
}
