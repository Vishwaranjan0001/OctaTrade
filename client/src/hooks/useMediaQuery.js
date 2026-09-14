import { useEffect, useState } from "react";

/**
 * Subscribes to a CSS media query.
 * Purpose : let JS-driven effects (scene quality, carousel behaviour) follow
 *           the same breakpoints as the stylesheet without duplicating values.
 * Input   : a media query string.
 * Output  : boolean, updated on change.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;

    const list = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);

    setMatches(list.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/* Named breakpoints matching the stylesheet. */
export const useIsMobile = () => useMediaQuery("(max-width: 719px)");
export const useIsTablet = () => useMediaQuery("(min-width: 720px) and (max-width: 1079px)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1080px)");
/* Coarse pointer => touch device: the 3D scene drops pointer parallax. */
export const useIsTouch = () => useMediaQuery("(pointer: coarse)");
