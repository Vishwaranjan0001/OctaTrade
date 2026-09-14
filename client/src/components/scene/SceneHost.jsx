import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { ScenePoster } from "./ScenePoster.jsx";
import { useMotionPreference } from "../../hooks/useMotionPreference.js";
import { usePageVisibility } from "../../hooks/usePageVisibility.js";
import { useIsMobile } from "../../hooks/useMediaQuery.js";

/* Three.js and the R3F runtime are the heaviest dependency in the project.
   They are loaded on demand, only for users who will actually see motion. */
const FinancialScene = lazy(() => import("./FinancialScene.jsx"));

/**
 * SceneHost — decides whether the 3D scene loads and whether it runs.
 *
 * Purpose : hold every rule that keeps the hero cheap:
 *             - reduced motion (OS or the pause control) never loads WebGL at
 *               all; it renders the static SVG poster instead
 *             - the scene is only imported once it is close to the viewport
 *             - frames are only advanced while it is actually on screen and the
 *               tab is visible
 *             - small screens get the reduced-quality tier
 * Input   : none.
 * Output  : the canvas or the poster, inside a fixed-ratio box so neither
 *           causes layout shift.
 */
export function SceneHost() {
  const { animationsEnabled } = useMotionPreference();
  const isVisible = usePageVisibility();
  const isMobile = useIsMobile();

  const containerRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!animationsEnabled) return undefined;

    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      /* No observer support: load it and let it run. */
      setShouldLoad(true);
      setInView(true);
      return undefined;
    }

    /* Begin loading slightly before the scene scrolls into view so it does not
       pop in, but never during the initial critical render. */
    const loadObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          loadObserver.disconnect();
        }
      },
      { rootMargin: "300px 0px" }
    );

    /* A separate, tighter observer controls whether frames are advanced. */
    const runObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setInView(Boolean(entry?.isIntersecting));
      },
      { threshold: 0.04 }
    );

    loadObserver.observe(node);
    runObserver.observe(node);

    return () => {
      loadObserver.disconnect();
      runObserver.disconnect();
    };
  }, [animationsEnabled]);

  return (
    <div className="ot-scene" ref={containerRef}>
      {!animationsEnabled ? (
        <ScenePoster />
      ) : shouldLoad ? (
        /* The poster is the Suspense fallback, so the composition is present
           from the first paint and is simply replaced by the live scene. */
        <Suspense fallback={<ScenePoster />}>
          <FinancialScene
            active={inView && isVisible}
            quality={isMobile ? "low" : "high"}
          />
        </Suspense>
      ) : (
        <ScenePoster />
      )}
    </div>
  );
}
