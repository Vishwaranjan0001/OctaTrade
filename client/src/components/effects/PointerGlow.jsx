import { Suspense, lazy } from "react";
import { useMotionPreference } from "../../hooks/useMotionPreference.js";
import { useIsTouch } from "../../hooks/useMediaQuery.js";

/*
  `ogl` is a second WebGL runtime on top of three.js, so it is imported on
  demand. Nobody who will not see the effect — reduced motion, or a touch
  device — downloads it.
*/
const GlowCursor = lazy(() => import("./GlowCursor.jsx"));

/**
 * PointerGlow — the gate in front of the cursor effect.
 *
 * Purpose : hold every rule about when the glow may run, so the surfaces that
 *           use it just render <PointerGlow /> and get correct behaviour:
 *             - OS reduced-motion or the in-product pause control: never loads
 *             - coarse pointer (touch): never loads, there is no cursor to trail
 *           Tab visibility and idle fade are handled inside GlowCursor itself.
 * Input   : none.
 * Output  : the overlay, or null.
 *
 * The tuning below is deliberately quieter than the component's defaults. This
 * is a trading product whose personality is calm and technical; the effect
 * should register at the edge of attention, not compete with the content. The
 * trail runs from the interface's cyan accent into its rationed violet, which
 * is the same pairing used for "live" and "reserved" states elsewhere.
 */
export function PointerGlow() {
  const { animationsEnabled } = useMotionPreference();
  const isTouch = useIsTouch();

  if (!animationsEnabled || isTouch) return null;

  return (
    <Suspense fallback={null}>
      <GlowCursor
        color="#6FE7F5"
        secondaryColor="#8878EE"
        trailLength={32}
        trailWidth={6}
        trailTaper={0.85}
        followSpeed={0.18}
        glowIntensity={1.6}
        glowSpread={1.15}
        hotspot={0.55}
        brightness={1.15}
        opacity={0.9}
        pulseSpeed={0.9}
        noiseStrength={0.03}
        idleFade
        idleTimeout={650}
        fadeDuration={850}
        /*
          Normal compositing, not "screen".

          The overlay is position: fixed with a z-index, so it forms its own
          stacking context. Inside it, mix-blend-mode: screen blends against an
          empty backdrop rather than the page, which reduces to ordinary
          compositing — the screen-over-page effect never happens. "screen" also
          selects the shader's additive path, which is tuned for screen blending
          and comes out dimmer when composited normally. Measured on the same
          pointer path: 6,413 lit pixels with "normal", 3,662 with "screen".
        */
        blendMode="normal"
        /* The hero already holds a WebGL context; this shader is fullscreen and
           loops 63 times per pixel, so its resolution is capped harder than the
           component's own default. */
        maxDevicePixelRatio={1.25}
      />
    </Suspense>
  );
}
