import Lenis from "lenis";
import { cancelFrame, frame } from "motion";
import { createContext, useContext, useEffect, useRef, useState } from "react";

/*
  SMOOTHNESS ARCHITECTURE — read before changing anything in this file.

  The requirement is that the interface never jitters. The usual cause of
  jitter in a Lenis + Motion + Three.js app is three independent
  requestAnimationFrame loops fighting over the same frame: each one reads and
  writes layout at a slightly different point, so scroll-linked transforms
  lag behind the smoothed scroll position by a variable amount.

  This app therefore runs EXACTLY ONE rAF loop — Motion's frame scheduler:

    1. Lenis is constructed with `autoRaf: false` so it never starts its own
       loop, and is ticked here from `frame.update(..., true)`.
    2. Motion's own animations and `useScroll` transforms already run inside
       that same scheduler, so they resolve in the same frame as the scroll
       position that produced them.
    3. The WebGL scene (see FinancialScene) uses R3F `frameloop="demand"` and
       is advanced from the same scheduler, so it cannot add a second loop
       either.

  Consequences to preserve:
    - Never call `lenis.start()`/`stop()` from a scroll handler.
    - Never update React state on scroll; use motion values (see useScroll).
    - Internal scroll containers (tables, dialogs, chart panes) opt out of
      smoothing with `data-lenis-prevent`, so native touch scrolling inside
      them stays untouched.
*/

const SmoothScrollContext = createContext(null);

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

export function SmoothScrollProvider({ children, enabled = true }) {
  const [lenis, setLenis] = useState(null);
  const lenisRef = useRef(null);

  useEffect(() => {
    /* Reduced motion (OS or in-product control): no smoothing layer at all.
       Native scrolling is the accessible, jank-free default. */
    if (!enabled) {
      setLenis(null);
      return undefined;
    }

    const instance = new Lenis({
      autoRaf: false,
      // Lerp-based smoothing: frame-rate independent and cheaper than the
      // duration+easing mode, which overshoots on high-refresh displays.
      lerp: 0.1,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      // Touch devices keep their native scrolling: hijacking it is the main
      // source of "sticky" feeling scroll on mobile.
      syncTouch: false,
      smoothWheel: true,
      overscroll: false,
      anchors: false,
      prevent: (node) =>
        node.hasAttribute?.("data-lenis-prevent") ||
        node.closest?.("[data-lenis-prevent]") !== null
    });

    lenisRef.current = instance;
    setLenis(instance);

    const tick = ({ timestamp }) => instance.raf(timestamp);
    /* keepAlive = true: stay registered even when no other animation runs. */
    frame.update(tick, true);

    return () => {
      cancelFrame(tick);
      instance.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, [enabled]);

  return (
    <SmoothScrollContext.Provider value={lenis}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

/**
 * Scrolls to a target, using Lenis when it is active and falling back to the
 * platform scroller when motion is reduced.
 *
 * Purpose : anchor navigation from the marketing nav and "back to top".
 * Input   : CSS selector or element, plus an optional pixel offset.
 * Output  : void.
 */
export function useScrollTo() {
  const lenis = useSmoothScroll();

  return (target, { offset = 0 } = {}) => {
    const node =
      typeof target === "string" ? document.querySelector(target) : target;
    if (!node) return;

    if (lenis) {
      lenis.scrollTo(node, { offset, duration: 1.1 });
      return;
    }

    const top = node.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior: "auto" });
  };
}

/**
 * Resets scroll position on route change. Purpose: a client-side navigation
 * must land at the top of the new page, and Lenis has to be told explicitly
 * because it owns the scroll position.
 */
export function useScrollReset(key) {
  const lenis = useSmoothScroll();

  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [key, lenis]);
}
