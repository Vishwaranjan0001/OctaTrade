import { useEffect } from "react";
import { useUiStore } from "../store/uiStore.js";
import { useMediaQuery } from "./useMediaQuery.js";

/**
 * The single authority on whether animation is allowed to run.
 *
 * Purpose : combine the OS `prefers-reduced-motion` setting with the
 *           in-product pause-motion control so that every animated surface
 *           (Lenis, Motion, the WebGL scene, the carousel autoplay) asks one
 *           question instead of each deciding for itself.
 * Input   : none — reads the media query and the ui store.
 * Output  : { animationsEnabled, prefersReducedMotion, motionEnabled, toggleMotion }
 *
 * Side effect: mirrors the result onto <html data-motion="on|off"> so CSS
 * transitions can be disabled by the same switch.
 */
export function useMotionPreference() {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const motionEnabled = useUiStore((state) => state.motionEnabled);
  const toggleMotion = useUiStore((state) => state.toggleMotion);

  const animationsEnabled = motionEnabled && !prefersReducedMotion;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.motion = animationsEnabled ? "on" : "off";
  }, [animationsEnabled]);

  return { animationsEnabled, prefersReducedMotion, motionEnabled, toggleMotion };
}
