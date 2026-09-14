import { useEffect, useRef, useState } from "react";
import { sanitiseCandles } from "../../lib/ohlc.js";
import { DataUnavailable } from "../ui/States.jsx";
import { readChartTheme, withAlpha } from "./chartTheme.js";
import { useResolvedTheme } from "../ThemeProvider.jsx";

/**
 * CandleChart — real OHLC candles and volume.
 *
 * Purpose : render genuine historical market data with TradingView Lightweight
 *           Charts. It renders ONLY what it is given: when the series is empty
 *           it shows an explicit "not available" state rather than generating
 *           candles so the panel looks complete.
 * Input   : candles (raw array, any accepted shape), symbol, currency,
 *           height, and an optional `unavailableMessage` override.
 * Output  : the chart element, or a DataUnavailable panel.
 *
 * Implementation notes
 *   - The library is imported dynamically so it stays out of the initial bundle.
 *   - Data passes through sanitiseCandles(): invalid bars are rejected, times
 *     sorted and de-duplicated.
 *   - Volume uses its own price scale pinned to the lower 22% of the pane, so
 *     it never distorts the price axis.
 *   - A ResizeObserver keeps the canvas exactly as wide as its container, which
 *     is what prevents horizontal overflow on mobile.
 *   - TradingView attribution is required by the library licence and is
 *     rendered below the chart; do not remove it.
 */
export function CandleChart({
  candles,
  symbol,
  currency = "INR",
  height = 380,
  unavailableTitle = "Historical market data is not available yet",
  unavailableDescription = "Connect a historical-price endpoint to display this chart. OctaTrade's quote API returns the latest price only, so no candle series can be drawn.",
  unavailableRequirement = "GET /api/history/:symbol returning OHLC candles"
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const theme = useResolvedTheme();
  const [failed, setFailed] = useState(null);

  const result = sanitiseCandles(candles);
  const hasData = result.candles.length > 0;

  useEffect(() => {
    if (!hasData) return undefined;

    const container = containerRef.current;
    if (!container) return undefined;

    let disposed = false;
    let chart = null;
    let resizeObserver = null;

    (async () => {
      try {
        const lib = await import("lightweight-charts");
        if (disposed) return;

        const palette = readChartTheme(theme);

        chart = lib.createChart(container, {
          height,
          layout: {
            background: { type: lib.ColorType.Solid, color: "transparent" },
            textColor: palette.text,
            fontFamily:
              'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace',
            fontSize: 11,
            attributionLogo: false
          },
          grid: {
            vertLines: { color: palette.grid },
            horzLines: { color: palette.grid }
          },
          rightPriceScale: {
            borderColor: palette.border,
            scaleMargins: { top: 0.08, bottom: 0.26 }
          },
          timeScale: {
            borderColor: palette.border,
            timeVisible: true,
            secondsVisible: false
          },
          crosshair: {
            mode: lib.CrosshairMode.Normal,
            vertLine: { color: palette.accent, width: 1, style: 3, labelBackgroundColor: palette.accent },
            horzLine: { color: palette.accent, width: 1, style: 3, labelBackgroundColor: palette.accent }
          },
          localization: {
            locale: "en-IN",
            /* Axis and crosshair labels use the security's own currency. */
            priceFormatter: (price) => {
              try {
                return new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: currency || "INR",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }).format(price);
              } catch {
                return price.toFixed(2);
              }
            }
          },
          handleScale: { axisPressedMouseMove: { time: true, price: false } },
          autoSize: false
        });

        chartRef.current = chart;

        const candleSeries = chart.addSeries(lib.CandlestickSeries, {
          upColor: palette.up,
          downColor: palette.down,
          borderUpColor: palette.up,
          borderDownColor: palette.down,
          wickUpColor: palette.up,
          wickDownColor: palette.down,
          priceLineColor: palette.accent
        });

        candleSeries.setData(result.candles);

        if (result.hasVolume) {
          /* Separate, unnamed price scale: volume gets its own axis pinned to
             the bottom band and never rescales the price series. */
          const volumeSeries = chart.addSeries(lib.HistogramSeries, {
            priceScaleId: "volume",
            priceFormat: { type: "volume" },
            lastValueVisible: false,
            priceLineVisible: false
          });

          volumeSeries.setData(
            result.volumes.map((entry) => ({
              time: entry.time,
              value: entry.value,
              color: entry.isUp
                ? withAlpha(palette.up, 0.5)
                : withAlpha(palette.down, 0.5)
            }))
          );

          chart.priceScale("volume").applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
            borderVisible: false
          });
        }

        chart.timeScale().fitContent();

        /* Keep the canvas exactly as wide as the container. */
        resizeObserver = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (!entry || !chart) return;
          const width = Math.floor(entry.contentRect.width);
          if (width > 0) chart.applyOptions({ width });
        });
        resizeObserver.observe(container);
        chart.applyOptions({ width: Math.floor(container.clientWidth) });
      } catch (error) {
        if (!disposed) setFailed(error);
      }
    })();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      chart?.remove();
      chartRef.current = null;
    };
    /* `candles` is re-sanitised each render; depend on a stable signature so a
       re-render with identical data does not tear down the chart. */
  }, [hasData, height, theme, currency, candleSignature(result.candles)]);

  if (!hasData) {
    return (
      <DataUnavailable
        title={unavailableTitle}
        description={unavailableDescription}
        requirement={unavailableRequirement}
      />
    );
  }

  if (failed) {
    return (
      <DataUnavailable
        title="Chart could not be initialised"
        description="The charting library failed to load in this browser."
      />
    );
  }

  return (
    <figure className="ot-chart">
      <div
        className="ot-chart__canvas"
        ref={containerRef}
        style={{ height }}
        role="img"
        aria-label={buildChartDescription(symbol, result)}
        data-lenis-prevent
      />
      <figcaption className="ot-chart__caption">
        <span className="ot-label">
          {result.candles.length} bars
          {result.rejected > 0 ? ` · ${result.rejected} invalid rejected` : ""}
          {result.duplicates > 0 ? ` · ${result.duplicates} duplicate merged` : ""}
        </span>
        {/* TradingView attribution — required by the Lightweight Charts licence. */}
        <a
          className="ot-chart__attribution"
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Charts by TradingView
        </a>
      </figcaption>
    </figure>
  );
}

/** Cheap stable signature so the effect only re-runs when data really changes. */
function candleSignature(candles) {
  if (candles.length === 0) return "0";
  const first = candles[0];
  const last = candles[candles.length - 1];
  return `${candles.length}:${first.time}:${last.time}:${last.close}`;
}

/**
 * Builds the accessible description for the chart image.
 * Purpose: a canvas is opaque to screen readers, so the series is summarised
 * in text — range, bar count and first/last close.
 */
function buildChartDescription(symbol, result) {
  const { candles } = result;
  if (candles.length === 0) return "No chart data";

  const first = candles[0];
  const last = candles[candles.length - 1];
  const lows = candles.map((candle) => candle.low);
  const highs = candles.map((candle) => candle.high);

  const format = (value) => value.toFixed(2);
  const date = (seconds) => new Date(seconds * 1000).toISOString().slice(0, 10);

  return [
    `Candlestick chart for ${symbol || "the selected security"}.`,
    `${candles.length} bars from ${date(first.time)} to ${date(last.time)}.`,
    `Opening ${format(first.open)}, latest close ${format(last.close)}.`,
    `Range ${format(Math.min(...lows))} to ${format(Math.max(...highs))}.`
  ].join(" ");
}
