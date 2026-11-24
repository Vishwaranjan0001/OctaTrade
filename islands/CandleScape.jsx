// "Find your next idea": a 3D candlestick chart (Three.js) of a real NSE stock.
// Scrolling down through the section morphs the chart from 1D to 1W, 1M and 1Y,
// moving the cursor orbits the camera, and the chips switch the stock.
// Data comes from the OctaTrade API: /api/quotes/:symbol/history?range=1D|1W|1M|1Y
import { useEffect, useRef, useState } from 'react';
import {
  WebGLRenderer, Scene, PerspectiveCamera, HemisphereLight, DirectionalLight,
  BoxGeometry, MeshStandardMaterial, MeshPhysicalMaterial, InstancedMesh, Object3D, Color,
  PlaneGeometry, ShadowMaterial, Mesh, VSMShadowMap, SRGBColorSpace, NeutralToneMapping,
  PMREMGenerator, Fog, GridHelper,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const RANGES = ['1D', '1W', '1M', '1Y'];
const RANGE_WORDS = { '1D': 'today', '1W': 'this week', '1M': 'this month', '1Y': 'this year' };
const SYMBOLS = [
  ['TCS.NS', 'TCS'],
  ['RELIANCE.NS', 'Reliance'],
  ['INFY.NS', 'Infosys'],
  ['HDFCBANK.NS', 'HDFC Bank'],
];
const MAX = 30;        // most candles drawn at once; longer ranges are grouped into 30 buckets
const SPAN = 9;        // chart width in scene units
const HEIGHT = 3.6;    // tallest price span in scene units
// Muted, deep tones: they read as lacquered material under the studio light, not as flat icons.
const UP = new Color('#0b5e41');
const DOWN = new Color('#8a3526');
const WICK = new Color('#2a2621');
const PAPER = new Color('#e3ded2'); // page background, used for the fog so the back fades into the page
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);

/* ---------- data ---------- */
const cache = {};
function loadSymbol(symbol) {
  if (!cache[symbol]) {
    cache[symbol] = Promise.all(
      RANGES.map((r) =>
        fetch(`/api/quotes/${encodeURIComponent(symbol)}/history?range=${r}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((d) => (d && Array.isArray(d.candles) ? group(d.candles) : []))
          .catch(() => [])
      )
    );
  }
  return cache[symbol];
}

// Merge candles into at most MAX buckets (first open, highest high, lowest low, last close).
function group(candles) {
  const list = candles.filter((c) => [c.open, c.high, c.low, c.close].every((v) => typeof v === 'number'));
  if (list.length <= MAX) return list;
  const out = [];
  for (let b = 0; b < MAX; b += 1) {
    const part = list.slice(Math.floor((b * list.length) / MAX), Math.floor(((b + 1) * list.length) / MAX));
    out.push({
      open: part[0].open,
      close: part[part.length - 1].close,
      high: Math.max(...part.map((c) => c.high)),
      low: Math.min(...part.map((c) => c.low)),
      volume: part.reduce((s, c) => s + (c.volume || 0), 0),
    });
  }
  return out;
}

// Scene-space shape of one range: per candle x, body, wick, volume, colour.
function shape(candles) {
  const n = candles.length;
  const lo = Math.min(...candles.map((c) => c.low));
  const hi = Math.max(...candles.map((c) => c.high));
  const vmax = Math.max(1, ...candles.map((c) => c.volume || 0));
  const y = (v) => ((v - lo) / (hi - lo || 1)) * HEIGHT;
  const w = Math.min(0.2, (SPAN / Math.max(n, 12)) * 0.62);
  return Array.from({ length: MAX }, (_, i) => {
    const c = candles[i];
    if (!c) return { x: SPAN / 2, b0: 0, b1: 0, w0: 0, w1: 0, width: 0, vol: 0, up: 1 };
    const x = n > 1 ? (i / (n - 1) - 0.5) * SPAN : 0;
    return {
      x,
      b0: y(Math.min(c.open, c.close)),
      b1: Math.max(y(Math.max(c.open, c.close)), y(Math.min(c.open, c.close)) + 0.03),
      w0: y(c.low),
      w1: y(c.high),
      width: w,
      vol: ((c.volume || 0) / vmax) * 1.1,
      up: c.close >= c.open ? 1 : 0,
    };
  });
}

const change = (candles) =>
  candles && candles.length > 1 ? ((candles[candles.length - 1].close - candles[0].open) / candles[0].open) * 100 : null;

/* ---------- scroll ---------- */
function reelProgress() {
  const c = document.getElementById('scroll-container');
  if (!c) return 0;
  const span = c.offsetHeight - window.innerHeight;
  return span > 0 ? clamp01((window.scrollY - c.offsetTop) / span) : 0;
}
function sectionWindow(section) {
  return {
    enter: parseFloat(section.dataset.enter) / 100 + 0.01,
    leave: parseFloat(section.dataset.leave) / 100 - 0.02,
  };
}

export default function CandleScape() {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const [symbol, setSymbol] = useState(SYMBOLS[0][0]);
  const [data, setData] = useState(null); // grouped candles for each range
  const [active, setActive] = useState(0); // index into RANGES
  const live = useRef({ data: null, f: 0 });

  useEffect(() => {
    let alive = true;
    loadSymbol(symbol).then((d) => {
      if (!alive) return;
      const ok = d.some((r) => r.length > 1);
      live.current.data = ok ? d.map(shape) : null;
      setData(ok ? d : null);
    });
    return () => { alive = false; };
  }, [symbol]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    const section = root.closest('.scroll-section');
    if (!canvas || !section) return;
    const win = sectionWindow(section);

    /* three.js scene: studio lighting, lacquered candles, soft shadows */
    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = NeutralToneMapping; // keeps the brand colours true and rolls off bright highlights
    renderer.toneMappingExposure = 0.86;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = VSMShadowMap; // blurred, soft-edged shadows
    const scene = new Scene();
    scene.fog = new Fog(PAPER, 11, 22); // the far end melts into the page colour
    const camera = new PerspectiveCamera(26, 2, 0.1, 100);

    // Image-based lighting: a neutral studio room gives every surface real reflections.
    const pmrem = new PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.95;

    scene.add(new HemisphereLight(0xfff8ec, 0xcfc6b2, 0.35));
    const key = new DirectionalLight(0xfff1dc, 1.9); // warm key light, upper left
    key.position.set(-5, 9, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -8, right: 8, top: 7, bottom: -5, near: 1, far: 30 });
    key.shadow.radius = 10;
    key.shadow.blurSamples = 20;
    key.shadow.bias = -0.0004;
    scene.add(key);
    const rim = new DirectionalLight(0xd9e8ff, 1.3); // cool rim from behind, separates the candles from the page
    rim.position.set(6, 5, -8);
    scene.add(rim);

    const floor = new Mesh(new PlaneGeometry(40, 20), new ShadowMaterial({ color: 0x3a3226, opacity: 0.2 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new GridHelper(24, 48, 0x8f8676, 0x8f8676); // faint price grid on the floor
    grid.material.transparent = true;
    grid.material.opacity = 0.13;
    grid.position.y = 0.002;
    scene.add(grid);

    const body = new RoundedBoxGeometry(1, 1, 1, 2, 0.04);
    body.translate(0, 0.5, 0); // grow upward from the base
    const stick = new BoxGeometry(1, 1, 1);
    stick.translate(0, 0.5, 0);
    const lacquer = new MeshPhysicalMaterial({ roughness: 0.24, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, specularIntensity: 1 });
    const wickMat = new MeshStandardMaterial({ color: WICK, roughness: 0.4 });
    const ghost = new MeshPhysicalMaterial({ roughness: 0.6, transparent: true, opacity: 0.13, depthWrite: false });
    const bodies = new InstancedMesh(body, lacquer, MAX);
    const wicks = new InstancedMesh(stick, wickMat, MAX);
    const volumes = new InstancedMesh(stick, ghost, MAX);
    bodies.castShadow = true;
    wicks.castShadow = true;
    scene.add(bodies, wicks, volumes);

    /* per-candle state, eased toward the scroll target every frame */
    const cur = Array.from({ length: MAX }, () => ({ x: 0, b0: 0, b1: 0, w0: 0, w1: 0, width: 0, vol: 0, up: 1 }));
    const tint = Array.from({ length: MAX }, () => UP.clone());
    const dummy = new Object3D();
    const pointer = { x: 0, y: 0 };
    const view = { yaw: -0.42, pitch: 0 };
    let raf = 0;
    let running = false;
    let t0 = performance.now();
    let born = null; // when the candles first rise up

    const target = (i) => {
      const d = live.current.data;
      if (!d) return null;
      const f = live.current.f;
      const a = Math.min(3, Math.floor(f));
      const b = Math.min(3, a + 1);
      // hold each range for a while, then morph to the next one
      const k = smooth(clamp01((f - a - 0.35) / 0.4));
      const A = d[a][i];
      const B = d[b][i];
      return {
        x: A.x + (B.x - A.x) * k, b0: A.b0 + (B.b0 - A.b0) * k, b1: A.b1 + (B.b1 - A.b1) * k,
        w0: A.w0 + (B.w0 - A.w0) * k, w1: A.w1 + (B.w1 - A.w1) * k,
        width: A.width + (B.width - A.width) * k, vol: A.vol + (B.vol - A.vol) * k,
        up: k < 0.5 ? A.up : B.up,
      };
    };

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const put = (mesh, i, x, y, z, sx, sy, sz) => {
      dummy.position.set(x, y, z);
      dummy.scale.set(Math.max(sx, 0.0001), Math.max(sy, 0.0001), Math.max(sz, 0.0001));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    };

    const frame = (now) => {
      const ease = reduce ? 1 : 0.11;
      if (born === null && live.current.data) born = now;
      for (let i = 0; i < MAX; i += 1) {
        const t = target(i);
        if (!t) continue;
        const c = cur[i];
        for (const k of ['x', 'b0', 'b1', 'w0', 'w1', 'width', 'vol']) c[k] += (t[k] - c[k]) * ease;
        tint[i].lerp(t.up ? UP : DOWN, reduce ? 1 : 0.15);

        // entrance: candles rise from the floor one after another, left to right
        const g = reduce ? 1 : smooth(clamp01((now - born - i * 22) / 650));
        const depth = c.width;
        put(bodies, i, c.x, c.b0 * g, 0, c.width, (c.b1 - c.b0) * g, depth);
        bodies.setColorAt(i, tint[i]);
        put(wicks, i, c.x, c.w0 * g, 0, 0.022, (c.w1 - c.w0) * g, 0.022);
        put(volumes, i, c.x, 0, -1.5, c.width * 0.9, c.vol * g, depth);
        volumes.setColorAt(i, tint[i]);
      }
      for (const m of [bodies, wicks, volumes]) {
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
      }

      // camera: rests a little from the left and above, orbits toward the cursor, sways slowly
      const idle = reduce ? 0 : Math.sin((now - t0) / 2600) * 0.08;
      view.yaw += (-0.42 + pointer.x * 0.4 + idle - view.yaw) * 0.06;
      view.pitch += (pointer.y * 0.16 - view.pitch) * 0.06;
      const r = 10.8;
      camera.position.set(Math.sin(view.yaw) * r, 4.6 + view.pitch * 6, Math.cos(view.yaw) * r);
      camera.lookAt(0, 1.45, -0.6);

      renderer.render(scene, camera);
      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      t0 = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    /* scroll -> which range */
    const onScroll = () => {
      const t = clamp01((reelProgress() - win.enter) / (win.leave - win.enter));
      live.current.f = t * 3;
      setActive(Math.min(3, Math.round(t * 3)));
    };
    const onPointer = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    // only draw while the section is on screen
    const watch = new MutationObserver(() => (section.classList.contains('is-active') ? start() : stop()));
    watch.observe(section, { attributes: true, attributeFilter: ['class'] });
    if (section.classList.contains('is-active')) start();

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointer);
    return () => {
      stop();
      watch.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointer);
      for (const x of [body, stick, lacquer, wickMat, ghost, floor.geometry, floor.material, grid.geometry, grid.material, envMap, pmrem]) x.dispose();
      renderer.dispose();
    };  }, []);

  // Clicking a range pill scrolls the page to the point where that range is shown.
  const jumpTo = (k) => {
    const section = rootRef.current && rootRef.current.closest('.scroll-section');
    const c = document.getElementById('scroll-container');
    if (!section || !c) return;
    const win = sectionWindow(section);
    const p = win.enter + (k / 3) * (win.leave - win.enter);
    const y = c.offsetTop + p * (c.offsetHeight - window.innerHeight);
    if (window.lenis) window.lenis.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const range = RANGES[active];
  const pct = data ? change(data[active]) : null;
  const name = SYMBOLS.find(([s]) => s === symbol)[1];

  return (
    <div ref={rootRef} className="candle-scape">
      <div className="cs-top">
        <div className="cs-chips" role="group" aria-label="Choose a stock">
          {SYMBOLS.map(([s, label]) => (
            <button key={s} type="button" className={s === symbol ? 'is-on' : ''} aria-pressed={s === symbol} onClick={() => setSymbol(s)}>
              {label}
            </button>
          ))}
        </div>
        {pct != null && (
          <span className={`cs-change ${pct >= 0 ? 'up' : 'down'}`}>
            {pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(2)}% {RANGE_WORDS[range]}
          </span>
        )}
      </div>

      <canvas ref={canvasRef} className="cs-canvas" aria-label={`3D candlestick chart of ${name}, ${range} view`} role="img" />
      {!data && <p className="cs-empty">The chart appears when the OctaTrade server is running.</p>}

      <div className="cs-ranges" role="group" aria-label="Chart range">
        <span className="cs-thumb" style={{ transform: `translateX(${active * 100}%)` }} aria-hidden="true" />
        {RANGES.map((r, k) => (
          <button key={r} type="button" className={k === active ? 'is-on' : ''} aria-pressed={k === active} onClick={() => jumpTo(k)}>
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
