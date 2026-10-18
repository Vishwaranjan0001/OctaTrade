/* =====================================================
   OctaTrade — scroll choreography
   Architecture from the Royal Pop demo (video-to-website skill).
   Media: frames/ from the Flow clip when present, otherwise
   an optional procedural scene (js/scene.js exposing window.PaperScene).

   Performance notes
   - One master ScrollTrigger drives everything (frames, sections,
     marquee, overlay, chart shift) instead of one trigger per piece.
   - Drawing happens once per tick on the same gsap.ticker Lenis uses.
   - Canvas backing store is capped (source frames are 1280px wide).
   - Frames are decoded during preload, never mid-scroll.
   ===================================================== */

gsap.registerPlugin(ScrollTrigger);

let FRAME_EXT = "jpg";
const FRAME_PATH = (i) => `frames/frame_${String(i + 1).padStart(4, "0")}.${FRAME_EXT}`;
// Four-act film (32s). It finishes just as the closing CTA arrives (~89% of the reel).
const FRAME_SPEED = 1.12;
const IMAGE_SCALE = 0.86;
const MAX_BACKING_WIDTH = 1920;

let FRAME_COUNT = 0;
let frames = [];
let bgColor = "#ebe7da";
let mode = "scene";
let scene = null;
let scrollContainer, canvas, ctx, canvasWrap, heroSection;

let progress = 0;            // master scroll progress 0..1
let drawnKey = null;         // what is currently on the canvas
let copySide = 0;            // +1 copy on the left (chart goes right), -1 copy on the right
let activeCopy = 0;          // 0..1, how much side copy is on screen
let activeCta = 0;           // 0..1, the closing CTA (phones park the chart under it)

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = () => window.innerWidth <= 768;

if ("scrollRestoration" in history) history.scrollRestoration = "manual";

/* -----------------------------------------------------
   Lenis smooth scroll
   ----------------------------------------------------- */
const lenis = new Lenis({
  duration: reduceMotion ? 0.6 : 1.15,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 0.9,
  touchMultiplier: 1.4,
});
window.lenis = lenis;
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* -----------------------------------------------------
   Boot
   ----------------------------------------------------- */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  scrollContainer = document.getElementById("scroll-container");
  canvas = document.getElementById("canvas");
  canvasWrap = document.querySelector(".canvas-wrap");
  heroSection = document.querySelector(".hero-standalone");

  initNavJumps();

  FRAME_COUNT = await readManifest();
  if (FRAME_COUNT > 0) {
    mode = "frames";
    ctx = canvas.getContext("2d", { alpha: false });
    sizeCanvas();
    await preloadFrames();
  } else {
    // Fallback: a procedural scene if js/scene.js is present, otherwise just the background
    scene = window.PaperScene ? PaperScene.create(canvas) : { resize() {}, draw() {} };
    await fakeLoad();
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (mode === "frames") sizeCanvas(); else scene.resize();
      drawnKey = null;
      lay = null;
    }, 120);
  });

  hideLoader();
  window.dispatchEvent(new CustomEvent("pm:ready"));

  initHeroTransition();
  initSections();
  initMaster();
  initHeaderMode();
  gsap.ticker.add(tick);
  ScrollTrigger.refresh();
}

async function readManifest() {
  try {
    const res = await fetch("frames/manifest.json", { cache: "no-store" });
    if (!res.ok) return 0;
    const data = await res.json();
    if (data.ext) FRAME_EXT = data.ext;
    return Number(data.count) || 0;
  } catch (e) {
    return 0;
  }
}

/* -----------------------------------------------------
   Canvas sizing (frames mode): capped backing store
   ----------------------------------------------------- */
function sizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth, h = window.innerHeight;
  const k = Math.min(dpr, MAX_BACKING_WIDTH / w);
  canvas.width = Math.round(w * k);
  canvas.height = Math.round(h * k);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
}

/* -----------------------------------------------------
   Preloader
   ----------------------------------------------------- */
function setLoader(pct) {
  document.getElementById("loader-bar-fill").style.width = pct + "%";
  document.getElementById("loader-percent").textContent = pct + "%";
}

function fakeLoad() {
  return new Promise((resolve) => {
    const obj = { v: 0 };
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    gsap.to(obj, {
      v: 100, duration: 0.9, ease: "power2.inOut",
      onUpdate: () => setLoader(Math.round(obj.v)),
      onComplete: () => fontsReady.then(resolve),
    });
  });
}

function preloadFrames() {
  frames = new Array(FRAME_COUNT);
  let loaded = 0;
  const attempt = (i) => {
    const img = new Image();
    img.decoding = "async";
    img.src = FRAME_PATH(i);
    // decode() guarantees the bitmap is ready before scrolling hits it
    return (img.decode ? img.decode() : new Promise((r, j) => { img.onload = r; img.onerror = j; })).then(() => img);
  };
  const loadOne = async (i) => {
    for (let tries = 0; tries < 4; tries++) {
      try {
        const img = await attempt(i);
        frames[i] = img;
        if (i === 0) bgColor = sampleBgColor(img);
        break;
      } catch (e) {
        await new Promise((r) => setTimeout(r, 250 * (tries + 1)));   // busy server: back off and retry
      }
    }
    loaded++;
    setLoader(Math.round((loaded / FRAME_COUNT) * 100));
  };

  // first frames fast, the rest in modest parallel batches
  const first = [];
  for (let i = 0; i < Math.min(8, FRAME_COUNT); i++) first.push(loadOne(i));
  return Promise.all(first).then(async () => {
    for (let i = 8; i < FRAME_COUNT; i += 16) {
      const batch = [];
      for (let j = i; j < Math.min(i + 16, FRAME_COUNT); j++) batch.push(loadOne(j));
      await Promise.all(batch);
    }
  });
}

function sampleBgColor(img) {
  try {
    const c = document.createElement("canvas");
    c.width = 16; c.height = 16;
    const cx = c.getContext("2d");
    cx.drawImage(img, 0, 0, 16, 16);
    const d = cx.getImageData(0, 0, 16, 16).data;
    let r = 0, g = 0, b = 0, n = 0;
    const sample = (x, y) => { const k = (y * 16 + x) * 4; r += d[k]; g += d[k + 1]; b += d[k + 2]; n++; };
    for (let x = 0; x < 16; x++) { sample(x, 0); sample(x, 15); }
    for (let y = 1; y < 15; y++) { sample(0, y); sample(15, y); }
    return `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`;
  } catch (e) {
    return "#ebe7da";
  }
}

function hideLoader() {
  document.getElementById("loader").classList.add("hidden");
}

/* -----------------------------------------------------
   Renderers
   ----------------------------------------------------- */
// The chart occupies roughly this part of each Flow frame (measured on the clip)
const CHART_BOX = { w: 0.9, h: 0.62 };

// Base "padded cover" scale, as in the Royal Pop renderer
function baseScale(img) {
  return Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight) * IMAGE_SCALE;
}

// Where the frame should sit: full and centered when no copy is on screen,
// fitted into the free half (desktop) or the top band (phone) when copy is.
function layoutTarget(img) {
  const W = canvas.width, H = canvas.height;
  const b = baseScale(img);
  const chartW = img.naturalWidth * b * CHART_BOX.w;
  const chartH = img.naturalHeight * b * CHART_BOX.h;
  if (isMobile()) {
    const fitW = Math.min(1, (W * 0.94) / chartW);
    if (activeCta > 0.01) {
      const fitCta = Math.min(fitW, (H * 0.2) / chartH);
      return { cx: W / 2, cy: H * (0.5 + 0.36 * activeCta), s: 1 + (fitCta - 1) * Math.max(activeCta, 0.35) };
    }
    const fitH = Math.min(1, (H * 0.36) / chartH);
    const s = 1 + (Math.min(fitW, fitH) - 1) * Math.max(activeCopy, 0.35);
    return { cx: W / 2, cy: H * (0.5 - 0.2 * activeCopy), s };
  }
  const free = W * 0.52;                                   // the half without text
  const fit = Math.min(1, free / chartW, (H * 0.7) / chartH);
  const s = 1 + (fit - 1) * activeCopy;
  return { cx: W / 2 + copySide * W * 0.245, cy: H * (0.5 + 0.02 * activeCopy), s };
}

let lay = null;
function drawFrame(index) {
  const img = frames[index];
  if (!img) return;
  const cw = canvas.width, ch = canvas.height;
  const s = baseScale(img) * lay.s;
  const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
  const dx = lay.cx - dw / 2, dy = lay.cy - dh / 2;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
  featherEdges(dx, dy, dw, dh);
}

// Wide soft edges so the clip melts into the page instead of reading as a box
function featherEdges(dx, dy, dw, dh) {
  if (!bgColor.startsWith("rgb(")) return;
  const clear = bgColor.replace("rgb(", "rgba(").replace(")", ", 0)");
  const fx = dw * 0.16, fy = dh * 0.2;
  const edge = (x0, y0, x1, y1, rx, ry, rw, rh) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, bgColor);
    g.addColorStop(1, clear);
    ctx.fillStyle = g;
    ctx.fillRect(rx, ry, rw, rh);
  };
  edge(dx, 0, dx + fx, 0, dx - 1, dy - 1, fx + 1, dh + 2);
  edge(dx + dw, 0, dx + dw - fx, 0, dx + dw - fx, dy - 1, fx + 1, dh + 2);
  edge(0, dy, 0, dy + fy, dx - 1, dy - 1, dw + 2, fy + 1);
  edge(0, dy + dh, 0, dy + dh - fy, dx - 1, dy + dh - fy, dw + 2, fy + 1);
}

/* -----------------------------------------------------
   One tick: draw at most once, ease the chart shift
   ----------------------------------------------------- */
function tick() {
  const accelerated = Math.min(progress * FRAME_SPEED, 1);
  if (mode === "frames") {
    const index = Math.min(Math.floor(accelerated * FRAME_COUNT), FRAME_COUNT - 1);
    const img = frames[index] || frames[0];
    if (!img) return;
    // ease the layout toward its target; redraw only when something moved
    const t = layoutTarget(img);
    const k = reduceMotion || !lay ? 1 : 0.09;
    if (!lay) lay = { ...t };
    const moved = Math.abs(t.cx - lay.cx) + Math.abs(t.cy - lay.cy) + Math.abs(t.s - lay.s) * 1000 > 0.3;
    if (moved) {
      lay.cx += (t.cx - lay.cx) * k;
      lay.cy += (t.cy - lay.cy) * k;
      lay.s += (t.s - lay.s) * k;
    }
    if (drawnKey !== index || moved) { drawFrame(index); drawnKey = index; }
  } else {
    const key = Math.round(accelerated * 2000);
    if (drawnKey !== key) { scene.draw(accelerated); drawnKey = key; }
    // procedural fallback keeps the simple CSS nudge away from the copy
    const tx = isMobile() ? 0 : copySide * 20, ty = isMobile() ? -14 * activeCopy : 0;
    canvas.style.transform = `translate3d(${tx}vw, ${ty}vh, 0) scale(${1 - 0.2 * activeCopy})`;
  }
}

/* -----------------------------------------------------
   Circle-wipe hero reveal (its own trigger: the hero)
   ----------------------------------------------------- */
function initHeroTransition() {
  canvasWrap.style.clipPath = "circle(0% at 50% 50%)";
  ScrollTrigger.create({
    trigger: heroSection,
    start: "top top",
    end: "bottom top",
    onUpdate: (self) => {
      const h = self.progress;
      heroSection.style.opacity = Math.max(0, 1 - Math.max(0, h - 0.55) / 0.45);
      const wipe = Math.min(1, h / 0.85);
      canvasWrap.style.clipPath = wipe >= 1 ? "none" : `circle(${(wipe * 90).toFixed(2)}% at 50% 62%)`;
    },
  });
}

/* -----------------------------------------------------
   Sections: build timelines once
   ----------------------------------------------------- */
const sections = [];

function windowOpacity(p, enter, leave, fade, peak) {
  if (p >= enter - fade && p <= enter) return peak * ((p - (enter - fade)) / fade);
  if (p > enter && p < leave) return peak;
  if (p >= leave && p <= leave + fade) return peak * (1 - (p - leave) / fade);
  return 0;
}

function initSections() {
  document.querySelectorAll(".scroll-section").forEach((section) => {
    const type = section.dataset.animation;
    const children = section.querySelectorAll(
      ".section-label, .section-heading, .section-body, .section-note, .cta-button, .stat"
    );
    const tl = gsap.timeline({ paused: true });
    const from = {
      "fade-up": { y: 50, opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out" },
      "slide-left": { x: -80, opacity: 0, stagger: 0.14, duration: 0.9, ease: "power3.out" },
      "slide-right": { x: 80, opacity: 0, stagger: 0.14, duration: 0.9, ease: "power3.out" },
      "scale-up": { scale: 0.85, opacity: 0, stagger: 0.12, duration: 1.0, ease: "power2.out" },
      "rotate-in": { y: 40, rotation: 3, opacity: 0, stagger: 0.1, duration: 0.9, ease: "power3.out" },
      "stagger-up": { y: 60, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power3.out" },
      "clip-reveal": { clipPath: "inset(100% 0 0 0)", opacity: 0, stagger: 0.15, duration: 1.2, ease: "power4.inOut" },
    }[type] || { y: 40, opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out" };
    tl.from(children, from);

    sections.push({
      el: section,
      tl,
      enter: parseFloat(section.dataset.enter) / 100,
      leave: parseFloat(section.dataset.leave) / 100,
      persist: section.dataset.persist === "true",
      side: section.classList.contains("align-left") ? 1 : section.classList.contains("align-right") ? -1 : 0,
      played: false,
      lastOpacity: -1,
    });
  });
}

/* -----------------------------------------------------
   Master trigger: one onUpdate for the whole reel
   ----------------------------------------------------- */
function initMaster() {
  const overlay = document.getElementById("dark-overlay");
  const marquee = document.querySelector(".marquee-wrap");
  const marqueeText = marquee.querySelector(".marquee-text");
  const mEnter = parseFloat(marquee.dataset.enter) / 100;
  const mLeave = parseFloat(marquee.dataset.leave) / 100;
  const stats = sections.find((s) => s.el.classList.contains("section-stats"));
  let statsFired = false;

  ScrollTrigger.create({
    trigger: scrollContainer,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      const p = self.progress;
      progress = p;

      // sections + chart shift away from whichever side holds text
      let sx = 0, active = 0;
      for (const s of sections) {
        let o = windowOpacity(p, s.enter, s.leave, 0.03, 1);
        if (s.persist && p >= s.leave) o = 1;
        if (Math.abs(o - s.lastOpacity) > 0.001) {
          s.el.style.opacity = o;
          s.el.classList.toggle("is-active", o > 0.5);
          s.lastOpacity = o;
        }
        if (p >= s.enter + 0.02 && !s.played) { s.tl.play(); s.played = true; }
        if (!s.persist && p < s.enter - 0.03 && s.played) { s.tl.reverse(); s.played = false; }
        sx += s.side * o;
        if (s.side) active = Math.max(active, o);
      }
      copySide = Math.max(-1, Math.min(1, sx));
      activeCopy = active;
      const cta = sections.find((x) => x.el.classList.contains("section-cta"));
      activeCta = cta ? Math.max(0, cta.lastOpacity) : 0;

      // dark overlay for stats
      if (stats) overlay.style.opacity = windowOpacity(p, stats.enter, stats.leave, 0.04, 0.92);
      if (stats && !statsFired && p >= stats.enter + 0.01) {
        statsFired = true;
        window.dispatchEvent(new CustomEvent("pm:stats"));
      }

      // marquee lives under the stats, never over section copy
      marquee.style.opacity = windowOpacity(p, mEnter, mLeave, 0.04, 1);
      marqueeText.style.transform = `translate3d(${(-25 * p * 4).toFixed(2)}%, 0, 0)`;
    },
  });
}

/* -----------------------------------------------------
   Header: solid paper bar once the curtain covers the film
   ----------------------------------------------------- */
function initHeaderMode() {
  const after = document.getElementById("after");
  const header = document.querySelector(".site-header");
  if (!after || !header) return;
  ScrollTrigger.create({
    trigger: after,
    start: "top 64px",
    onToggle: (self) => header.classList.toggle("header-solid", self.isActive),
    end: "max",
  });
}

/* -----------------------------------------------------
   Nav: smooth jumps through Lenis
   ----------------------------------------------------- */
function initNavJumps() {
  document.querySelectorAll("[data-scroll-to]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const f = parseFloat(a.dataset.scrollTo);
      const c = document.getElementById("scroll-container");
      const target = f === 0 ? 0 : c.offsetTop + f * (c.offsetHeight - window.innerHeight);
      lenis.scrollTo(target, { duration: 1.6 });
    });
  });
  // links to sections after the film
  document.querySelectorAll("[data-scroll-el]").forEach((a) => {
    a.addEventListener("click", (e) => {
      const el = document.getElementById(a.dataset.scrollEl);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -40, duration: 1.8 });
    });
  });
}
