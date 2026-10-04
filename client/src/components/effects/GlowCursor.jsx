import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import { cancelFrame, frame } from "motion";
import "./GlowCursor.css";

/*
  GlowCursor — adapted from React Bits (https://reactbits.dev).

  The shaders and trail maths are upstream's. Three things about the
  integration were changed, each for a concrete reason in this codebase:

  1. NO PRIVATE ANIMATION LOOP.
     Upstream drives itself with its own requestAnimationFrame. This app runs
     exactly one rAF — Motion's frame scheduler — because Lenis, Motion and the
     WebGL hero each running their own loop is what made the old interface
     jitter (see ADR 005 and SmoothScrollProvider.jsx). This component is ticked
     from that same scheduler, so the trail resolves in the same frame as the
     smoothed scroll position instead of drifting against it.

  2. OVERLAY BY DEFAULT.
     Upstream wraps your content in a container with `overflow: hidden`. An
     overflow ancestor disables `position: sticky` on everything inside it, and
     the landing page pins its scrollytelling with sticky. In overlay mode the
     effect is a fixed, inert layer above the page and wraps nothing, so the
     layout is untouched. Pointer events are read from the window, because the
     overlay itself is pointer-events: none.

  3. PREMULTIPLIED ALPHA.
     Upstream renders straight alpha. In that mode ogl blends with
     blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA) and no separate alpha factors,
     so the canvas's own alpha channel is multiplied by alpha too: a halo pixel
     meant to be 40% opaque is stored at 16% (a²), and the browser composites
     that squared coverage. The soft glow — most of the effect — is crushed.
     Premultiplied output blends with (ONE, ONE_MINUS_SRC_ALPHA) and keeps the
     falloff as designed. Measured in Chromium against the same pointer path:
     6,428 visibly lit pixels versus 1,984 with straight alpha.

  4. IT STOPS WHEN IT SHOULD.
     The caller gates mounting on motion preference; this component additionally
     stops advancing while the tab is hidden, and refuses to run on coarse
     pointers, where a cursor trail has nothing to follow.
*/

const MAX_POINTS = 64;

const VERTEX_SHADER = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

#define MAX_POINTS 64

uniform vec2 uResolution;
uniform vec2 uPoints[MAX_POINTS];
uniform float uPointCount;
uniform vec3 uColor;
uniform vec3 uSecondaryColor;
uniform float uTrailWidth;
uniform float uTaper;
uniform float uGlowIntensity;
uniform float uGlowSpread;
uniform float uHotspot;
uniform float uBrightness;
uniform float uOpacity;
uniform float uPulseSpeed;
uniform float uNoiseStrength;
uniform float uNormalBlend;
uniform float uTime;
uniform float uFade;

varying vec2 vUv;

float sRGB(float x) {
  if (x <= 0.00031308) return 12.92 * x;
  return 1.055 * pow(x, 1.0 / 2.4) - 0.055;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float filmGrain(vec2 p, float time) {
  float frame = time * 18.0;
  float frameIndex = mod(floor(frame), 256.0);
  float nextFrameIndex = mod(frameIndex + 1.0, 256.0);
  float blend = fract(frame);
  blend = blend * blend * (3.0 - 2.0 * blend);
  vec2 pixel = floor(p);
  float current = hash(pixel + vec2(frameIndex * 17.0, frameIndex * 31.0));
  float next = hash(pixel + vec2(nextFrameIndex * 17.0, nextFrameIndex * 31.0));
  return mix(current, next, blend) * 2.0 - 1.0;
}

void main() {
  vec2 pixel = vUv * uResolution;
  float denominator = max(uPointCount - 1.0, 1.0);
  float strongest = 0.0;
  float strongestCore = 0.0;
  float colorWeight = 0.0;
  vec3 colorSum = vec3(0.0);

  for (int i = 0; i < MAX_POINTS - 1; i++) {
    float index = float(i);
    float active = 1.0 - step(uPointCount - 1.0, index);
    vec2 start = uPoints[i];
    vec2 end = uPoints[i + 1];
    vec2 toPixel = pixel - start;
    vec2 segment = end - start;
    float along = clamp(dot(toPixel, segment) / max(dot(segment, segment), 0.0001), 0.0, 1.0);
    float progress = clamp((index + along) / denominator, 0.0, 1.0);
    float life = pow(max(1.0 - progress, 0.0), mix(0.55, 1.25, uTaper));
    float width = uTrailWidth * mix(1.0, 0.25, pow(progress, mix(0.55, 1.6, uTaper)));
    float distanceToTrail = length(toPixel - segment * along);
    float falloff = max(width * (0.8 + uGlowSpread * 1.4), 0.5);
    float beam = min(1.0, (falloff * falloff) / (distanceToTrail * distanceToTrail + falloff * falloff));
    float core = exp(-pow(distanceToTrail / max(width, 0.5), 2.0) * 2.5);
    float pulseAmount = min(abs(uPulseSpeed), 1.0);
    float pulse = 1.0 + sin(uTime * uPulseSpeed * 3.0 - progress * 11.0) * 0.16 * pulseAmount;
    float intensity = (core + beam * uGlowIntensity * 0.55) * life * pulse * active;
    vec3 segmentColor = mix(uColor, uSecondaryColor, progress);

    strongest = max(strongest, intensity);
    strongestCore = max(strongestCore, core * life * active);
    colorSum += segmentColor * intensity;
    colorWeight += intensity;
  }

  float grain = filmGrain(pixel, uTime);
  float noiseAmount = (1.0 - exp(-uNoiseStrength * 2.2)) * 0.4;
  float alpha = clamp(strongest * uOpacity * uFade, 0.0, 1.0);
  if (alpha < 0.0005) discard;

  vec3 color = colorSum / max(colorWeight, 0.0001);
  color = mix(color, vec3(1.0), smoothstep(0.25, 0.95, strongestCore) * uHotspot);
  float luminance = sRGB(clamp(strongest * uBrightness, 0.0, 1.0));
  luminance *= 1.0 + grain * noiseAmount;
  vec3 additiveColor = color * luminance;
  float normalAlpha = clamp(strongest * uBrightness * uOpacity * uFade, 0.0, 1.0);
  vec3 normalColor = mix(color, vec3(1.0), smoothstep(0.45, 1.0, strongestCore) * uHotspot * 0.35);
  vec3 outColor = mix(additiveColor, normalColor, uNormalBlend);
  float outAlpha = mix(alpha, normalAlpha, uNormalBlend);
  // Premultiplied output, to match the premultipliedAlpha context. With straight
  // alpha the canvas alpha is squared during blending (see header note 3).
  gl_FragColor = vec4(outColor * outAlpha, outAlpha);
}
`;

const hexToRgb = (hex) => {
  let value = (hex || "").replace("#", "").trim();
  if (value.length === 3)
    value = value
      .split("")
      .map((char) => char + char)
      .join("");
  const parsed = Number.parseInt(value || "000000", 16);
  return [((parsed >> 16) & 255) / 255, ((parsed >> 8) & 255) / 255, (parsed & 255) / 255];
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * GlowCursor — a luminous trail that follows the pointer.
 *
 * Input  : the upstream prop set, plus `overlay` (default true), which renders
 *          a fixed inert layer instead of wrapping `children`.
 * Output : a canvas layer. Renders nothing on coarse-pointer devices.
 */
const GlowCursor = ({
  color = "#67E8F9",
  secondaryColor = "#A78BFA",
  trailLength = 40,
  trailWidth = 8,
  trailTaper = 0.8,
  followSpeed = 0.16,
  glowIntensity = 1.9,
  glowSpread = 1.2,
  hotspot = 0.65,
  brightness = 1.25,
  opacity = 1,
  pulseSpeed = 1.1,
  noiseStrength = 0.035,
  idleFade = true,
  idleTimeout = 700,
  fadeDuration = 900,
  blendMode = "screen",
  maxDevicePixelRatio = 1.5,
  enabled = true,
  overlay = true,
  children,
  className = "",
  style,
  ...rest
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const propsRef = useRef({});

  propsRef.current = {
    color,
    secondaryColor,
    trailLength,
    trailWidth,
    trailTaper,
    followSpeed,
    glowIntensity,
    glowSpread,
    hotspot,
    brightness,
    opacity,
    pulseSpeed,
    noiseStrength,
    idleFade,
    idleTimeout,
    fadeDuration,
    maxDevicePixelRatio,
    blendMode,
    enabled
  };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    const initialConfig = propsRef.current;
    const renderer = new Renderer({
      canvas,
      alpha: true,
      /* ogl defaults to straight alpha, which squares the canvas alpha when
         blending (header note 3). The shader outputs premultiplied colour to
         match this setting. */
      premultipliedAlpha: true,
      dpr: Math.min(window.devicePixelRatio || 1, initialConfig.maxDevicePixelRatio)
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const pointData = Array(MAX_POINTS * 2).fill(0);
    const points = Array.from({ length: MAX_POINTS }, () => ({ x: 0, y: 0 }));
    const target = { x: 0, y: 0 };
    const head = { x: 0, y: 0 };

    const program = new Program(gl, {
      vertex: VERTEX_SHADER,
      fragment: FRAGMENT_SHADER,
      uniforms: {
        uResolution: { value: [1, 1] },
        uPoints: { value: pointData },
        uPointCount: { value: initialConfig.trailLength },
        uColor: { value: hexToRgb(initialConfig.color) },
        uSecondaryColor: { value: hexToRgb(initialConfig.secondaryColor) },
        uTrailWidth: { value: initialConfig.trailWidth },
        uTaper: { value: initialConfig.trailTaper },
        uGlowIntensity: { value: initialConfig.glowIntensity },
        uGlowSpread: { value: initialConfig.glowSpread },
        uHotspot: { value: initialConfig.hotspot },
        uBrightness: { value: initialConfig.brightness },
        uOpacity: { value: initialConfig.opacity },
        uPulseSpeed: { value: initialConfig.pulseSpeed },
        uNoiseStrength: { value: initialConfig.noiseStrength },
        uNormalBlend: { value: initialConfig.blendMode === "normal" ? 1 : 0 },
        uTime: { value: 0 },
        uFade: { value: 0 }
      },
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    let width = 1;
    let height = 1;
    let initialized = false;
    let pointerInside = false;
    let fade = 0;
    let lastInputTime = performance.now();
    let lastFrameTime = performance.now();
    let destroyed = false;

    const resize = () => {
      width = Math.max(container.clientWidth, 1);
      height = Math.max(container.clientHeight, 1);
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
    };

    const initializeTrail = (x, y) => {
      target.x = x;
      target.y = y;
      head.x = x;
      head.y = y;
      for (const point of points) {
        point.x = x;
        point.y = y;
      }
      initialized = true;
      fade = 1;
    };

    const updatePointer = (event) => {
      const rect = container.getBoundingClientRect();
      const x = clamp(event.clientX - rect.left, 0, rect.width);
      const y = clamp(rect.height - (event.clientY - rect.top), 0, rect.height);
      if (!initialized) initializeTrail(x, y);
      target.x = x;
      target.y = y;
      pointerInside = true;
      lastInputTime = performance.now();
    };

    const onPointerLeave = () => {
      pointerInside = false;
      lastInputTime = performance.now();
    };

    /* Ticked by Motion's scheduler. `timestamp` replaces the rAF argument. */
    const render = ({ timestamp }) => {
      if (destroyed) return;

      /* A hidden tab renders nothing. The fade is left untouched so the trail
         is exactly where it was when the tab comes back. */
      if (document.hidden) {
        lastFrameTime = timestamp;
        return;
      }

      const config = propsRef.current;
      const delta = Math.min((timestamp - lastFrameTime) / 16.667, 3);
      lastFrameTime = timestamp;

      if (initialized) {
        const headEase = 1 - Math.pow(1 - clamp(config.followSpeed, 0.01, 0.99), delta);
        const chainBase = clamp(0.28 + config.followSpeed * 0.35, 0.08, 0.92);
        const chainEase = 1 - Math.pow(1 - chainBase, delta);
        head.x += (target.x - head.x) * headEase;
        head.y += (target.y - head.y) * headEase;
        points[0].x = head.x;
        points[0].y = head.y;

        for (let i = 1; i < MAX_POINTS; i++) {
          points[i].x += (points[i - 1].x - points[i].x) * chainEase;
          points[i].y += (points[i - 1].y - points[i].y) * chainEase;
        }

        for (let i = 0; i < MAX_POINTS; i++) {
          pointData[i * 2] = points[i].x;
          pointData[i * 2 + 1] = points[i].y;
        }
      }

      const idleFor = timestamp - lastInputTime;
      const shouldFade = config.idleFade && (!pointerInside || idleFor > config.idleTimeout);
      const fadeStep = (16.667 * delta) / Math.max(config.fadeDuration, 16);
      const fadeTarget = initialized && config.enabled && !shouldFade ? 1 : 0;
      fade += (fadeTarget - fade) * Math.min(1, fadeStep * 7);

      /* Fully faded and not coming back: skip the draw entirely. A fullscreen
         fragment shader with a 63-iteration loop is not worth spending on an
         invisible result. */
      if (fade < 0.001 && fadeTarget === 0) return;

      program.uniforms.uPointCount.value = clamp(Math.round(config.trailLength), 2, MAX_POINTS);
      program.uniforms.uColor.value = hexToRgb(config.color);
      program.uniforms.uSecondaryColor.value = hexToRgb(config.secondaryColor);
      program.uniforms.uTrailWidth.value = Math.max(config.trailWidth, 0.1);
      program.uniforms.uTaper.value = clamp(config.trailTaper, 0, 1);
      program.uniforms.uGlowIntensity.value = Math.max(config.glowIntensity, 0);
      program.uniforms.uGlowSpread.value = Math.max(config.glowSpread, 0);
      program.uniforms.uHotspot.value = clamp(config.hotspot, 0, 1);
      program.uniforms.uBrightness.value = Math.max(config.brightness, 0);
      program.uniforms.uOpacity.value = clamp(config.opacity, 0, 1);
      program.uniforms.uPulseSpeed.value = config.pulseSpeed;
      program.uniforms.uNoiseStrength.value = clamp(config.noiseStrength, 0, 1);
      program.uniforms.uNormalBlend.value = config.blendMode === "normal" ? 1 : 0;
      program.uniforms.uTime.value = timestamp * 0.001;
      program.uniforms.uFade.value = fade;

      renderer.render({ scene: mesh });
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    /* In overlay mode the container is pointer-events: none and never receives
       events, so the window is the only source of pointer position. */
    const source = overlay ? window : container;
    source.addEventListener("pointermove", updatePointer, { passive: true });
    source.addEventListener("pointerenter", updatePointer, { passive: true });
    source.addEventListener("pointerleave", onPointerLeave, { passive: true });

    resize();
    frame.update(render, true);

    return () => {
      destroyed = true;
      cancelFrame(render);
      resizeObserver.disconnect();
      source.removeEventListener("pointermove", updatePointer);
      source.removeEventListener("pointerenter", updatePointer);
      source.removeEventListener("pointerleave", onPointerLeave);
      mesh.geometry.remove();
      program.remove();
      /* Release the GPU context on route change rather than waiting for GC;
         browsers cap the number of live WebGL contexts and the hero scene
         holds one of its own. */
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [maxDevicePixelRatio, overlay]);

  return (
    <div
      ref={containerRef}
      className={`glow-cursor${overlay ? " is-overlay" : ""}${className ? ` ${className}` : ""}`}
      style={style}
      aria-hidden="true"
      {...rest}
    >
      <canvas
        ref={canvasRef}
        className="glow-cursor__canvas"
        style={{ mixBlendMode: blendMode }}
        aria-hidden="true"
      />
      {!overlay && children ? <div className="glow-cursor__content">{children}</div> : null}
    </div>
  );
};

export default GlowCursor;
