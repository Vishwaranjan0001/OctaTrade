import assert from "node:assert/strict";
import test from "node:test";
import { cleanCandles } from "./chart-data.js";

test("invalid candles are dropped and duplicate timestamps are replaced", () => {
  const candles = cleanCandles([
    { time: "2026-09-15", open: 100, high: 110, low: 90, close: 105, volume: 10 },
    { time: "2026-09-14", open: 90, high: 100, low: 80, close: 95, volume: 8 },
    { time: "2026-09-15", open: 105, high: 112, low: 101, close: 109, volume: 12 },
    { time: "invalid", open: 1, high: 2, low: 1, close: 2 },
    { time: "2026-09-16", open: 100, high: 99, low: 90, close: 98 }
  ]);

  assert.deepEqual(candles.map((item) => item.time), ["2026-09-14", "2026-09-15"]);
  assert.equal(candles[1].close, 109);
});

test("missing or invalid volume is safely normalized", () => {
  const candles = cleanCandles([
    { time: "2026-09-14", open: 100, high: 105, low: 95, close: 102 },
    { time: "2026-09-15", open: 102, high: 106, low: 100, close: 104, volume: -10 }
  ]);

  assert.deepEqual(candles.map((item) => item.volume), [0, 0]);
});
