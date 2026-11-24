// Hero: a polished gold 3D ₹ that turns slowly, floats, and tilts toward the cursor (Three.js).
//
// What makes it read as real metal:
// - The shape is the true ₹ glyph from Noto Sans ExtraBold (Google, SIL OFL; extracted by
//   extract-rupee.mjs into rupeeGlyph.js), extruded with a small rounded chamfer so every
//   edge catches a thin line of light.
// - The material is physically based gold: metalness 1 and the measured gold reflectance
//   (linear 1.0, 0.766, 0.336). Metal has no diffuse colour, so all of its look comes from reflections.
// - The reflections come from a tiny photo studio built in code: a dark room with bright
//   softbox panels ("light cards"), prefiltered with PMREM. That gives the crisp highlight bands
//   you see on product photos instead of the flat, plastic look of plain lights.
import { useEffect, useRef } from 'react';
import {
  WebGLRenderer, Scene, PerspectiveCamera, DirectionalLight, ShapePath, ExtrudeGeometry,
  MeshPhysicalMaterial, MeshBasicMaterial, Mesh, Group, PlaneGeometry, ShadowMaterial, PMREMGenerator,
  SRGBColorSpace, NeutralToneMapping, VSMShadowMap, Color, BackSide, BoxGeometry, Shape, CanvasTexture,
  RepeatWrapping, NoColorSpace, ShaderMaterial, AdditiveBlending, LessEqualDepth,
  LatheGeometry, Vector2, TorusGeometry, InstancedMesh, Object3D,
} from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// Real studio for the reflections: "Studio Small 09" by Poly Haven (CC0), 1k HDR, 1.6 MB.
// Until it has loaded, the code-built studio below lights the gold.
const STUDIO_HDR = 'images/studio/studio_small_09_1k.hdr';
const GLYPH_HEIGHT = 2.9;   // scene units
const DISC_RADIUS = 1.5;
const DISC_HEIGHT = 0.18;
import { RUPEE_GLYPH } from './rupeeGlyph.js';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const GOLD = new Color().setRGB(1.0, 0.766, 0.336); // measured gold F0, linear

function buildGlyph() {
  const path = new ShapePath();
  for (const c of RUPEE_GLYPH) {
    if (c.t === 'M') path.moveTo(c.x, c.y);
    else if (c.t === 'L') path.lineTo(c.x, c.y);
    else if (c.t === 'Q') path.quadraticCurveTo(c.x1, c.y1, c.x, c.y);
    else if (c.t === 'C') path.bezierCurveTo(c.x1, c.y1, c.x2, c.y2, c.x, c.y);
  }
  // Each outline of the glyph becomes its own solid shape. (The ₹ has no holes; letting
  // toShapes() guess from winding order drops the diagonal leg as if it were a hole.)
  const shapes = path.subPaths.map((sub) => {
    const s = new Shape();
    s.curves.push(...sub.curves);
    s.autoClose = true;
    return s;
  });

  // Size the depth and bevel from the glyph's own height so the proportions stay right.
  let minY = Infinity;
  let maxY = -Infinity;
  for (const c of RUPEE_GLYPH) if ('y' in c) { minY = Math.min(minY, c.y); maxY = Math.max(maxY, c.y); }
  const h = maxY - minY;
  const geometry = new ExtrudeGeometry(shapes, {
    depth: h * 0.2,
    curveSegments: 40,
    bevelEnabled: true,
    bevelThickness: h * 0.035,
    bevelSize: h * 0.022,
    bevelSegments: 4, // a rounded chamfer: soft but still crisp in the light
  });
  geometry.computeBoundingBox();
  const b = geometry.boundingBox;
  geometry.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, -(b.min.z + b.max.z) / 2);
  geometry.scale(GLYPH_HEIGHT / h, GLYPH_HEIGHT / h, GLYPH_HEIGHT / h);
  geometry.computeVertexNormals();
  return geometry;
}

// A dark photo studio with bright softboxes. Values above 1 make them HDR, so the
// reflections on the gold stay bright after tone mapping.
function buildStudio() {
  const studio = new Scene();
  const room = new Mesh(new BoxGeometry(30, 20, 30), new MeshBasicMaterial({ color: 0x24201b, side: BackSide }));
  studio.add(room);

  // Big gradient softbox behind the camera: bright at the top, falling to dark at the bottom.
  // Flat faces mirror it, so they show a rich bright-to-deep gold sweep instead of one flat tone.
  const g = document.createElement('canvas');
  g.width = 4;
  g.height = 256;
  const ctx = g.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.45, '#d8d2c8');
  grad.addColorStop(0.75, '#4a4540');
  grad.addColorStop(1, '#141210');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 256);
  const sweep = new CanvasTexture(g);
  sweep.colorSpace = SRGBColorSpace;
  const front = new Mesh(
    new PlaneGeometry(18, 12),
    new MeshBasicMaterial({ map: sweep, color: new Color(1, 0.97, 0.92).multiplyScalar(1.9), toneMapped: false })
  );
  front.position.set(0, 1.5, 11);
  front.lookAt(0, 0, 0);
  studio.add(front);
  const card = (w, h, rgb, power, x, y, z, lookY = 0) => {
    const m = new Mesh(
      new PlaneGeometry(w, h),
      new MeshBasicMaterial({ color: new Color(...rgb).multiplyScalar(power), toneMapped: false })
    );
    m.position.set(x, y, z);
    m.lookAt(0, lookY, 0);
    studio.add(m);
  };
  card(12, 4, [1, 1, 1], 3.2, 0, 9, 1);              // overhead softbox
  card(1.6, 12, [1, 0.97, 0.92], 7, -8, 1, 3);       // tall strip, front left: the main highlight band
  card(1.2, 12, [1, 0.93, 0.82], 5, 8, 2, -2);       // tall strip, right: rim light on the far edges
  card(6, 2.5, [1, 0.82, 0.55], 2.6, 3, 6, -9, 2);   // warm back card: golden glints on the bevels
  card(14, 3, [0.32, 0.3, 0.28], 1, 0, -6, 4, -2);   // dim floor bounce
  return studio;
}

// Real metal is never perfectly smooth. This roughness map adds a faint horizontal brushed
// grain and a few hairline scratches; it only nudges how sharp the reflections are, so it reads
// as "cast and polished" up close without looking dirty. (Grey 179 ≈ 0.7 x the base roughness.)
function buildSurfaceMap() {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const rowGrain = Array.from({ length: size }, () => (rand() - 0.5) * 9); // faint brushed streaks
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const v = Math.max(0, Math.min(255, 179 + rowGrain[y] + (rand() - 0.5) * 8));
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  ctx.lineCap = 'round';
  for (let s = 0; s < 28; s += 1) { // hairline scratches: slightly rougher, so they show only in the light
    const x = rand() * size;
    const y = rand() * size;
    const a = (rand() - 0.5) * 0.9;
    const len = 20 + rand() * 80;
    ctx.strokeStyle = `rgba(255,255,255,${0.1 + rand() * 0.16})`;
    ctx.lineWidth = 0.6 + rand() * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = NoColorSpace; // data, not colour
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(1 / 320, 1 / 320); // the glyph's UVs are in font units (about 700 tall)
  return tex;
}

// A band of light that glides diagonally across the face every few seconds, like the
// shine pass in a jewellery advert. Drawn as an additive layer on the same geometry.
function buildShineMaterial() {
  return new ShaderMaterial({
    uniforms: {
      uPos: { value: -3 },
      uStrength: { value: 0 },
      uColor: { value: new Color(1, 0.94, 0.78) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vObj;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vObj = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uPos;
      uniform float uStrength;
      uniform vec3 uColor;
      varying vec3 vObj;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float d = vObj.x * 0.55 + vObj.y - uPos;          // distance from the diagonal band
        float band = exp(-d * d * 30.0);                   // slim, soft-edged stripe
        float facing = pow(clamp(dot(vNormal, vView), 0.0, 1.0), 1.4);
        float a = band * facing * uStrength;
        gl_FragColor = vec4(uColor, a);
      }`,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    depthFunc: LessEqualDepth,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
}

// The turntable the ₹ stands on: a black lacquer disc with a bevelled edge, a thin gold inlay
// ring and gold tick marks around the top (like a watch bezel), so you can see it turning.
// Its top face is at y = 0; the caller places it.
function buildDisc(lacquer, inlay) {
  const R = DISC_RADIUS;
  const H = DISC_HEIGHT;
  const e = 0.05; // bevel
  const profile = [
    new Vector2(0, 0),
    new Vector2(R - e, 0),
    new Vector2(R, -e),
    new Vector2(R, -H + e),
    new Vector2(R - e, -H),
    new Vector2(0, -H),
  ].reverse(); // bottom to top, so the normals face outward
  const disc = new Group();
  const body = new Mesh(new LatheGeometry(profile, 128), lacquer);
  body.castShadow = true;
  body.receiveShadow = true;
  disc.add(body);

  const ring = new Mesh(new TorusGeometry(R - 0.2, 0.014, 12, 160), inlay);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.004;
  disc.add(ring);

  const TICKS = 60;
  const ticks = new InstancedMesh(new BoxGeometry(1, 1, 1), inlay, TICKS);
  const d = new Object3D();
  for (let i = 0; i < TICKS; i += 1) {
    const a = (i / TICKS) * Math.PI * 2;
    const long = i % 5 === 0;
    d.position.set(Math.cos(a) * (R - 0.11), 0.006, Math.sin(a) * (R - 0.11));
    d.rotation.set(0, -a, 0);
    d.scale.set(long ? 0.11 : 0.06, 0.012, long ? 0.016 : 0.01);
    d.updateMatrix();
    ticks.setMatrixAt(i, d.matrix);
  }
  disc.add(ticks);
  return disc;
}

export default function Rupee3D() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = NeutralToneMapping; // keeps the gold hue instead of bleaching it to cream
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = VSMShadowMap;

    const scene = new Scene();
    const camera = new PerspectiveCamera(26, 0.8, 0.1, 50);
    camera.position.set(0, 1.7, 10); // a little above, so the top of the disc shows
    camera.lookAt(0, -0.15, 0);

    const pmrem = new PMREMGenerator(renderer);
    const studio = buildStudio();
    const envMap = pmrem.fromScene(studio, 0.015).texture;
    studio.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry.dispose();
      if (o.material.map) o.material.map.dispose();
      o.material.dispose();
    });

    // Only used for the soft contact shadow; the gold itself is lit by the studio reflections.
    const sun = new DirectionalLight(0xffffff, 0.6);
    sun.position.set(-1.5, 9, 3.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 20 });
    sun.shadow.radius = 14;
    sun.shadow.blurSamples = 24;
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    const geometry = buildGlyph();
    const surface = buildSurfaceMap();
    surface.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const gold = new MeshPhysicalMaterial({
      color: GOLD,
      metalness: 1,
      roughness: 0.25, // x the surface map (about 0.7) gives an average of about 0.17
      roughnessMap: surface,
      envMap, // set on the material too, so envMapIntensity applies
      envMapIntensity: 1.15,
    });
    const glyph = new Mesh(geometry, gold);
    glyph.castShadow = true;
    const shineMat = buildShineMaterial();
    const shine = new Mesh(geometry, shineMat);
    shine.renderOrder = 1;

    // Turntable: the disc and the ₹ on it turn together; the whole stand tilts toward the cursor.
    const lacquer = new MeshPhysicalMaterial({
      color: 0x161412, metalness: 0.25, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06,
      envMap, envMapIntensity: 1,
    });
    const inlay = new MeshPhysicalMaterial({ color: GOLD, metalness: 1, roughness: 0.2, envMap, envMapIntensity: 1.15 });
    const disc = buildDisc(lacquer, inlay);
    disc.position.y = -GLYPH_HEIGHT / 2 - 0.02; // the ₹ stands on the top face
    const turntable = new Group();
    turntable.add(disc, glyph, shine);
    const stand = new Group();
    stand.position.y = 0.12;
    stand.add(turntable);
    scene.add(stand);

    const floorY = stand.position.y + disc.position.y - DISC_HEIGHT;
    const floor = new Mesh(new PlaneGeometry(12, 12), new ShadowMaterial({ color: 0x3d2f14, opacity: 0.26 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = floorY - 0.002;
    floor.receiveShadow = true;
    scene.add(floor);

    // Swap in the real studio HDR once it has loaded.
    const envMaps = [envMap];
    let alive = true;
    new RGBELoader().load(STUDIO_HDR, (hdr) => {
      if (!alive) { hdr.dispose(); return; }
      const real = pmrem.fromEquirectangular(hdr).texture;
      hdr.dispose();
      envMaps.push(real);
      for (const m of [gold, lacquer, inlay]) {
        m.envMap = real;
        m.needsUpdate = true;
      }
      // Turned 180° so the studio's big softbox is behind the symbol: the face gets a
      // bright-to-deep gold sweep and the sides catch the side lights (chosen by comparing four angles).
      for (const m of [gold, inlay]) {
        m.envMapRotation.set(0, Math.PI, 0);
        m.envMapIntensity = 1.0;
      }
      renderer.toneMappingExposure = 0.95;
    });

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

    const pointer = { x: 0, y: 0 };
    const tilt = { x: 0, y: 0 };
    const onPointer = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointer);

    // Hovering the symbol eases the spin to a stop; leaving lets it pick up speed again.
    let hovering = false;
    const onEnter = () => { hovering = true; };
    const onLeave = () => { hovering = false; };
    canvas.addEventListener('pointerenter', onEnter);
    canvas.addEventListener('pointerleave', onLeave);

    const SPIN_SPEED = 0.5; // radians per second: about one turn every 12.5 seconds
    let raf = 0;
    let running = false;
    let spin = -0.45;
    let speed = SPIN_SPEED;
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      speed += ((hovering ? 0 : SPIN_SPEED) - speed) * Math.min(1, dt * 4);
      if (!reduce) spin += dt * speed;
      tilt.x += (pointer.y * 0.16 - tilt.x) * 0.05;
      tilt.y += (pointer.x * 0.3 - tilt.y) * 0.05;
      turntable.rotation.y = spin;
      stand.rotation.set(tilt.x * 0.6, tilt.y, 0);

      // shine: one pass every 5.5 s, taking 1.2 s to cross from lower left to upper right
      if (!reduce) {
        const phase = (now / 1000) % 5.5;
        const k = phase / 1.2;
        shineMat.uniforms.uPos.value = -2.8 + Math.min(k, 1) * 5.6;
        shineMat.uniforms.uStrength.value = k < 1 ? Math.sin(Math.PI * k) * 0.32 : 0;
      }
      renderer.render(scene, camera);
      if (running) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    io.observe(canvas);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('pointerenter', onEnter);
      canvas.removeEventListener('pointerleave', onLeave);
      alive = false;
      disc.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
      for (const x of [geometry, gold, lacquer, inlay, surface, shineMat, floor.geometry, floor.material, ...envMaps, pmrem]) x.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="rupee-3d" role="img" aria-label="A gold rupee symbol turning slowly" />;
}
