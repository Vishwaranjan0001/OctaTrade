// Purpose: validate candles before passing them to the canvas chart.
// Input: OHLC points. Output: ordered, unique, finite candles. File: this file.
export function cleanCandles(data = []) {
  const unique = new Map();
  for (const point of data) {
    const validTime = typeof point.time === "number" ? Number.isFinite(point.time) && point.time > 0 : typeof point.time === "string" && /^\d{4}-\d{2}-\d{2}$/.test(point.time) && Number.isFinite(Date.parse(point.time));
    if (!validTime || ![point.open, point.high, point.low, point.close].every(Number.isFinite)) continue;
    if (point.low <= 0 || point.high < Math.max(point.open, point.close) || point.low > Math.min(point.open, point.close) || point.high < point.low) continue;
    unique.set(point.time, { ...point, volume: Number.isFinite(point.volume) && point.volume >= 0 ? point.volume : 0 });
  }
  return [...unique.values()].sort((a, b) => (typeof a.time === "number" ? a.time : Date.parse(a.time) / 1000) - (typeof b.time === "number" ? b.time : Date.parse(b.time) / 1000));
}
