import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Purpose : give charts a reliable pixel size without reading layout on every
 *           frame. TradingView and Recharts both need explicit resize
 *           handling to avoid mobile overflow.
 * Input   : none.
 * Output  : [ref, { width, height }] — attach ref to the measured element.
 */
export function useElementSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const elementRef = useRef(null);
  const frameRef = useRef(0);

  const ref = useCallback((node) => {
    elementRef.current = node;
  }, []);

  useEffect(() => {
    const node = elementRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      // Coalesce bursts of resize notifications into one state update.
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const box = entry.contentRect;
        setSize((current) =>
          Math.round(current.width) === Math.round(box.width) &&
          Math.round(current.height) === Math.round(box.height)
            ? current
            : { width: box.width, height: box.height }
        );
      });
    });

    observer.observe(node);
    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
    };
  }, []);

  return [ref, size];
}
