/**
 * Higgs field background.
 *
 * Renders a complex scalar field phi = (phi1, phi2) sitting in the Higgs
 * potential  V(phi) = -mu^2 |phi|^2 + lambda |phi|^4.
 *
 * Because mu^2 > 0 the origin is a local maximum, and the minima form a
 * circle ("the brim of the Mexican hat") at |phi| = v = sqrt(mu^2 / 2 lambda).
 * The field settles somewhere on that circle, which picks a phase and breaks
 * the symmetry. Quanta crossing the condensate couple to it with strength g
 * and pick up mass m = g * v -- here that shows up as drag: strongly coupled
 * particles get heavy and slow, weakly coupled ones stay fast and light.
 *
 * Three layers, cheapest first:
 *   1. the field amplitude, integrated on a coarse lattice and blitted up
 *   2. the vacuum manifold (the brim) with its phase marker
 *   3. quanta acquiring mass as they cross
 */

const TAU = Math.PI * 2;

// Potential parameters, in arbitrary units chosen to look right.
const MU2 = 1.0;
const LAMBDA = 0.5;
const VEV = Math.sqrt(MU2 / (2 * LAMBDA)); // |phi| at the minimum

// Lattice resolution. Small on purpose: it is scaled up and blurred, so the
// per-frame cost stays near-constant regardless of viewport size.
const LATTICE_W = 112;
const LATTICE_H = 64;

// Gamma < 1 lifts the mid-range so the field texture survives the veil the
// page lays over this canvas.
const GAMMA = 0.78;

const PALETTE = {
  // [r, g, b] stops sampled by field amplitude, low -> high.
  void: [6, 10, 18],
  trough: [12, 38, 52],
  brim: [24, 132, 122],
  crest: [86, 226, 180],
  spark: [186, 255, 226],
};

function mix(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function rampColor(t) {
  if (t < 0.28) return mix(PALETTE.void, PALETTE.trough, t / 0.28);
  if (t < 0.6) return mix(PALETTE.trough, PALETTE.brim, (t - 0.28) / 0.32);
  if (t < 0.85) return mix(PALETTE.brim, PALETTE.crest, (t - 0.6) / 0.25);
  return mix(PALETTE.crest, PALETTE.spark, (t - 0.85) / 0.15);
}

/**
 * The ramp baked into a 256-entry table, with the gamma lift folded in.
 * Sampling this per lattice point costs one index instead of a Math.pow and
 * three array allocations.
 */
const RAMP_LUT = (() => {
  const lut = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const [r, g, b] = rampColor(Math.pow(i / 255, GAMMA));
    lut[i * 3] = r;
    lut[i * 3 + 1] = g;
    lut[i * 3 + 2] = b;
  }
  return lut;
})();

/** Excitations of the field: each is a wave packet travelling over the vacuum. */
function makeModes(count) {
  const modes = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * TAU + Math.random() * 0.8;
    modes.push({
      kx: Math.cos(angle) * (1.4 + Math.random() * 2.6),
      ky: Math.sin(angle) * (1.4 + Math.random() * 2.6),
      omega: 0.22 + Math.random() * 0.5,
      phase: Math.random() * TAU,
      amp: 0.35 + Math.random() * 0.5,
    });
  }
  return modes;
}

/**
 * A quantum crossing the field. Its coupling g to the condensate fixes the
 * mass it picks up, m = g * v, which in turn fixes how much the field slows
 * it down and how brightly it renders.
 */
function makeQuantum(width, height) {
  const coupling = 0.12 + Math.random() * 0.88;
  const mass = coupling * VEV;
  const speed = (34 + Math.random() * 78) / (1 + mass * 2.6);
  const angle = Math.random() * TAU;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    coupling,
    mass,
    radius: 0.7 + mass * 2.4,
    life: Math.random(),
    decay: 0.03 + Math.random() * 0.06,
  };
}

export function startHiggsField(canvas, options = {}) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return () => {};

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const density = options.density ?? 1;

  // Offscreen lattice; ImageData is written directly then scaled onto the
  // visible canvas, which is what keeps this affordable on a laptop GPU.
  const lattice = document.createElement("canvas");
  lattice.width = LATTICE_W;
  lattice.height = LATTICE_H;
  const latticeCtx = lattice.getContext("2d");
  const image = latticeCtx.createImageData(LATTICE_W, LATTICE_H);

  const modes = makeModes(7);
  let quanta = [];
  let bubbles = []; // nucleation events: patches of broken symmetry expanding

  let width = 0;
  let height = 0;
  let dpr = 1;
  let running = true;
  let last = performance.now();
  let clock = 0;

  function resize() {
    // The field is an upscaled blur, so full retina resolution buys nothing
    // while quadrupling the pixels composited each frame. 1.25 keeps the
    // quanta and the manifold stroke crisp enough at a fraction of the cost.
    dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = Math.round(
      Math.min(150, (width * height) / 11000) * density
    );
    quanta = Array.from({ length: Math.max(24, target) }, () =>
      makeQuantum(width, height)
    );
  }

  /**
   * Field amplitude at an arbitrary point (u, v). drawField has its own
   * separable fast path for the lattice; this scalar form is what the quanta
   * sample, since they sit between lattice points.
   *
   * The modes give a displacement from the vacuum; the Mexican hat then pulls
   * that displacement back towards |phi| = v, so the bright band traces the
   * circle of minima rather than the centre.
   */
  function amplitudeAt(u, v, t) {
    let re = 0;
    let im = 0;
    for (let i = 0; i < modes.length; i++) {
      const m = modes[i];
      const theta = m.kx * u + m.ky * v - m.omega * t + m.phase;
      re += Math.cos(theta) * m.amp;
      im += Math.sin(theta) * m.amp;
    }
    re /= modes.length;
    im /= modes.length;

    // Radial coordinate in field space, biased so the vacuum manifold sits
    // where the field most often lands.
    let r = Math.hypot(re, im) * 1.9;

    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      const d = Math.hypot(u - b.u, v - b.v);
      const shell = Math.abs(d - b.radius);
      if (shell < b.thickness) {
        r += (1 - shell / b.thickness) * b.strength;
      }
    }

    // Distance from the brim -> brightness. On the brim the field is in its
    // true vacuum and glows; at the unstable origin it is dark.
    const offset = Math.abs(r - VEV);
    return Math.max(0, 1 - offset * 1.35);
  }

  // Each mode contributes cos(kx*u + ky*v - wt + ph), and that splits as
  //   cos(A + B) = cosA cosB - sinA sinB,  A = kx*u,  B = ky*v - wt + ph
  // so the u-dependent half is constant in time and can be tabulated once,
  // and the v-dependent half is one trig pair per row per mode. The inner
  // per-pixel loop then becomes multiply-add only.
  const nModes = modes.length;
  const colCos = new Float32Array(nModes * LATTICE_W);
  const colSin = new Float32Array(nModes * LATTICE_W);
  for (let m = 0; m < nModes; m++) {
    for (let x = 0; x < LATTICE_W; x++) {
      const a = modes[m].kx * ((x / LATTICE_W) * 5.6);
      colCos[m * LATTICE_W + x] = Math.cos(a);
      colSin[m * LATTICE_W + x] = Math.sin(a);
    }
  }
  const rowCos = new Float32Array(nModes);
  const rowSin = new Float32Array(nModes);

  function drawField(t) {
    const data = image.data;
    const invN = 1 / nModes;
    let p = 0;

    for (let y = 0; y < LATTICE_H; y++) {
      const v = (y / LATTICE_H) * 3.4;
      for (let m = 0; m < nModes; m++) {
        const mode = modes[m];
        const b = mode.ky * v - mode.omega * t + mode.phase;
        rowCos[m] = Math.cos(b) * mode.amp;
        rowSin[m] = Math.sin(b) * mode.amp;
      }

      for (let x = 0; x < LATTICE_W; x++) {
        let re = 0;
        let im = 0;
        for (let m = 0; m < nModes; m++) {
          const cu = colCos[m * LATTICE_W + x];
          const su = colSin[m * LATTICE_W + x];
          const cb = rowCos[m];
          const sb = rowSin[m];
          re += cu * cb - su * sb;
          im += su * cb + cu * sb;
        }
        re *= invN;
        im *= invN;

        let r = Math.hypot(re, im) * 1.9;

        for (let i = 0; i < bubbles.length; i++) {
          const bub = bubbles[i];
          const du = (x / LATTICE_W) * 5.6 - bub.u;
          const dv = v - bub.v;
          const shell = Math.abs(Math.sqrt(du * du + dv * dv) - bub.radius);
          if (shell < bub.thickness) {
            r += (1 - shell / bub.thickness) * bub.strength;
          }
        }

        const a = 1 - Math.abs(r - VEV) * 1.35;
        const idx = (a <= 0 ? 0 : a >= 1 ? 255 : (a * 255) | 0) * 3;
        data[p++] = RAMP_LUT[idx];
        data[p++] = RAMP_LUT[idx + 1];
        data[p++] = RAMP_LUT[idx + 2];
        data[p++] = 255;
      }
    }
    latticeCtx.putImageData(image, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.globalAlpha = 1;
    ctx.drawImage(lattice, 0, 0, width, height);
  }

  /** The circle of minima, drawn as the structure the whole scene sits in. */
  function drawVacuumManifold(t) {
    const cx = width * 0.5;
    const cy = height * 0.52;
    const radius = Math.min(width, height) * 0.3;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(86, 226, 180, 0.16)";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = "rgba(86, 226, 180, 0.07)";
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.34, 0, TAU);
    ctx.stroke();

    // The chosen phase: the field picked one point on the brim, and the
    // Goldstone mode lets it drift freely around it.
    const phase = t * 0.16;
    const px = cx + Math.cos(phase) * radius;
    const py = cy + Math.sin(phase) * radius;
    const glow = ctx.createRadialGradient(px, py, 0, px, py, radius * 0.42);
    glow.addColorStop(0, "rgba(140, 255, 214, 0.5)");
    glow.addColorStop(1, "rgba(140, 255, 214, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(px, py, radius * 0.42, 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  function stepQuanta(dt, t) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < quanta.length; i++) {
      const q = quanta[i];

      // Local field strength where the quantum currently is.
      const u = (q.x / Math.max(width, 1)) * 5.6;
      const v = (q.y / Math.max(height, 1)) * 3.4;
      const a = amplitudeAt(u, v, t);

      // Mass generation: coupling to a strong condensate costs momentum.
      const drag = 1 - Math.min(0.9, a * q.coupling * dt * 2.4);
      q.vx *= drag;
      q.vy *= drag;

      // ...and the field gradient nudges it, so paths bend around the brim.
      const gx = amplitudeAt(u + 0.08, v, t) - a;
      const gy = amplitudeAt(u, v + 0.08, t) - a;
      q.vx += gx * 520 * dt;
      q.vy += gy * 520 * dt;

      q.x += q.vx * dt;
      q.y += q.vy * dt;

      if (q.x < -20) q.x = width + 20;
      if (q.x > width + 20) q.x = -20;
      if (q.y < -20) q.y = height + 20;
      if (q.y > height + 20) q.y = -20;

      q.life -= q.decay * dt;
      if (q.life <= 0) {
        quanta[i] = makeQuantum(width, height);
        continue;
      }

      const r = q.radius * (0.7 + a * 0.9);
      const alpha = Math.min(0.85, 0.16 + a * 0.7) * Math.min(1, q.life * 4);

      ctx.fillStyle = `rgba(${Math.round(150 + a * 90)}, 255, ${Math.round(
        210 + a * 40
      )}, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(q.x, q.y, r, 0, TAU);
      ctx.fill();

      // Heavier quanta leave a visible wake through the condensate.
      if (q.mass > 0.4) {
        ctx.strokeStyle = `rgba(86, 226, 180, ${(alpha * 0.32).toFixed(3)})`;
        ctx.lineWidth = r * 0.6;
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(q.x - q.vx * 0.06, q.y - q.vy * 0.06);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function stepBubbles(dt) {
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.radius += b.speed * dt;
      b.strength *= 1 - dt * 0.42;
      if (b.strength < 0.02) bubbles.splice(i, 1);
    }
    // Nucleation is rare on purpose: it should read as an event, not texture.
    if (bubbles.length < 2 && Math.random() < dt * 0.22) {
      bubbles.push({
        u: Math.random() * 5.6,
        v: Math.random() * 3.4,
        radius: 0,
        speed: 0.9 + Math.random() * 0.7,
        thickness: 0.2,
        strength: 0.22 + Math.random() * 0.2,
      });
    }
  }

  function renderStatic() {
    drawField(4.2);
    drawVacuumManifold(4.2);
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock += dt;

    stepBubbles(dt);
    drawField(clock);
    drawVacuumManifold(clock);
    stepQuanta(dt, clock);

    requestAnimationFrame(loop);
  }

  function start() {
    if (reduceMotion.matches) {
      renderStatic();
      return;
    }
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
  }

  function onVisibility() {
    if (document.hidden) stop();
    else start();
  }

  const onResize = () => {
    resize();
    if (reduceMotion.matches) renderStatic();
  };

  resize();
  start();

  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVisibility);
  reduceMotion.addEventListener("change", onResize);

  return function destroy() {
    stop();
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibility);
    reduceMotion.removeEventListener("change", onResize);
  };
}
