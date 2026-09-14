import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { cancelFrame, frame } from "motion";
import * as THREE from "three";

import { octagonLinePositions, octagonPerimeterPoint } from "./geometry.js";

/*
  THE OCTATRADE HERO SCENE
  ------------------------------------------------------------------
  A futuristic financial environment, not a decorative abstract. Every element
  means something:

    market rings     - concentric octagonal tori: the eight sides of the market.
                       Each ring turns at its own rate, the outer ones slowest,
                       like order books of increasing depth.
    order flow       - particles travelling the ring perimeters, representing
                       orders moving around the book toward execution.
    price wave       - a GPU-displaced lattice below the rings: an abstract
                       price surface, layered front-to-back as depth levels.
    depth layers     - receding octagon outlines: market depth seen edge-on.
    market core      - a metallic octahedron (eight faces) at the centre: the
                       point of execution the whole composition orbits.

  PERFORMANCE CONTRACT (see SmoothScrollProvider for the full rationale)
    - The Canvas uses frameloop="never". Nothing renders unless FrameDriver
      calls advance(), and FrameDriver is registered on Motion's frame loop.
      The app therefore has exactly ONE requestAnimationFrame.
    - `active === false` stops advancing entirely: off-screen, hidden tab, or
      motion paused all cost zero frames.
    - Reduced motion renders a single still frame and then stops.
    - Pixel ratio is capped; particle counts and lattice resolution drop on
      small devices.
    - Animation reads from a mutable pointer ref; no React state is touched per
      frame.
*/

const QUALITY = {
  low: { dpr: [1, 1.2], particles: 130, lattice: [34, 12], rings: 2, shadows: false },
  high: { dpr: [1, 1.75], particles: 340, lattice: [68, 24], rings: 3, shadows: false }
};

/**
 * FrameDriver — advances the renderer from Motion's frame loop.
 *
 * Purpose : keep the WebGL scene inside the app's single rAF loop so scroll
 *           transforms and 3D motion resolve in the same frame.
 * Input   : active (whether to keep advancing), still (render one frame only).
 * Output  : null — side effect only.
 */
function FrameDriver({ active, still }) {
  const advance = useThree((state) => state.advance);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (still) {
      /* One frame, then nothing. The scene is a static image. */
      advance(performance.now());
      invalidate();
      return undefined;
    }

    if (!active) return undefined;

    const tick = ({ timestamp }) => advance(timestamp);
    frame.update(tick, true);
    return () => cancelFrame(tick);
  }, [active, still, advance, invalidate]);

  return null;
}

/**
 * MarketRings — the concentric octagonal rings.
 * Input  : count, pointer ref, still.
 * Output : a group of metallic ring meshes.
 */
function MarketRings({ count, pointer, still }) {
  const group = useRef(null);

  /* Ring specs: radius, tube thickness, tilt, rotation speed, colour role.
     Outer rings are slower and darker — depth reads as distance. */
  const rings = useMemo(
    () =>
      [
        { radius: 3.05, tube: 0.035, speed: 0.026, colour: 0x5c7399, metalness: 0.95, roughness: 0.28 },
        { radius: 2.22, tube: 0.05, speed: -0.045, colour: 0x9fb4cd, metalness: 1, roughness: 0.18 },
        { radius: 1.48, tube: 0.028, speed: 0.072, colour: 0x33d2e6, metalness: 0.6, roughness: 0.22 }
      ].slice(0, count),
    [count]
  );

  const geometries = useMemo(
    () =>
      rings.map(
        (ring) =>
          /* tubularSegments = 8 makes the ring path an OCTAGON rather than a
             circle: the brand geometry, in three dimensions. */
          new THREE.TorusGeometry(ring.radius, ring.tube, 10, 8)
      ),
    [rings]
  );

  /* Geometries are created imperatively, so they must be disposed explicitly. */
  useEffect(() => () => geometries.forEach((geometry) => geometry.dispose()), [geometries]);

  useFrame((state, delta) => {
    if (!group.current || still) return;

    const clamped = Math.min(delta, 0.05);

    group.current.children.forEach((child, index) => {
      const spec = rings[index];
      if (spec) child.rotation.z += spec.speed * clamped;
    });

    /* Damped pointer parallax on the whole assembly. Lerping toward the target
       means a fast pointer flick never snaps the scene. */
    const target = pointer.current;
    group.current.rotation.x += ((-0.36 + target.y * 0.12) - group.current.rotation.x) * 0.045;
    group.current.rotation.y += (target.x * 0.16 - group.current.rotation.y) * 0.045;
  });

  return (
    <group ref={group} rotation={[-0.36, 0, 0]}>
      {rings.map((ring, index) => (
        <mesh key={ring.radius} geometry={geometries[index]}>
          <meshStandardMaterial
            color={ring.colour}
            metalness={ring.metalness}
            roughness={ring.roughness}
            envMapIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * OrderFlow — particles travelling the ring perimeters.
 * Input  : count, still.
 * Output : a THREE.Points cloud updated on the CPU (cheap: a few hundred points).
 */
function OrderFlow({ count, still }) {
  const pointsRef = useRef(null);

  /* Per-particle constants: which ring it rides, how fast, where it started. */
  const particles = useMemo(() => {
    const radii = [1.48, 2.22, 3.05];
    return Array.from({ length: count }, (_, index) => ({
      radius: radii[index % radii.length] + (Math.random() - 0.5) * 0.07,
      speed: (0.035 + Math.random() * 0.075) * (index % 2 === 0 ? 1 : -1),
      offset: Math.random(),
      z: (Math.random() - 0.5) * 0.22
    }));
  }, [count]);

  const positions = useMemo(() => new Float32Array(count * 3), [count]);

  /* Seed positions so the very first frame is already correct. */
  useMemo(() => {
    particles.forEach((particle, index) => {
      const [x, y] = octagonPerimeterPoint(particle.radius, particle.offset);
      positions[index * 3] = x;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = particle.z;
    });
  }, [particles, positions]);

  useFrame((state) => {
    if (!pointsRef.current || still) return;

    const time = state.clock.elapsedTime;
    const array = pointsRef.current.geometry.attributes.position.array;

    for (let index = 0; index < particles.length; index += 1) {
      const particle = particles[index];
      const [x, y] = octagonPerimeterPoint(
        particle.radius,
        particle.offset + time * particle.speed
      );
      array[index * 3] = x;
      array[index * 3 + 1] = y;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} rotation={[-0.36, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.038}
        color={0x6fe7f5}
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/*
  Price-wave lattice shaders. Displacement happens entirely on the GPU, so the
  surface animates at no CPU cost and cannot stutter with React work.
*/
const WAVE_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uAmplitude;
  attribute float aRow;
  attribute float aCol;
  varying float vRow;
  varying float vHeight;

  void main() {
    vRow = aRow;

    // Two superimposed waves of different wavelength: a price series rather
    // than a single clean sine.
    float primary = sin(aCol * 7.0 + uTime * 0.55 + aRow * 2.4);
    float secondary = sin(aCol * 17.0 - uTime * 0.32 + aRow * 1.1) * 0.35;

    // Rows further back move less and sit lower: depth levels behind the touch.
    float depthFade = 1.0 - aRow * 0.55;
    float height = (primary + secondary) * uAmplitude * depthFade;

    vHeight = height;

    vec3 displaced = position;
    displaced.y += height;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const WAVE_FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform vec3 uNearColour;
  uniform vec3 uFarColour;
  varying float vRow;
  varying float vHeight;

  void main() {
    // Front rows read cyan, back rows fade to steel: the accent marks the live
    // edge of the surface.
    vec3 colour = mix(uNearColour, uFarColour, vRow);

    // Crests brighten slightly, so the surface has readable structure.
    colour += vec3(0.12) * smoothstep(0.0, 0.5, vHeight);

    float alpha = (1.0 - vRow) * 0.5 + 0.06;
    gl_FragColor = vec4(colour, alpha);
  }
`;

/**
 * PriceWaveField — the abstract price surface below the rings.
 * Input  : segments [cols, rows], still.
 * Output : LineSegments whose vertices are displaced in the vertex shader.
 */
function PriceWaveField({ segments, still }) {
  const materialRef = useRef(null);

  const [cols, rows] = segments;

  /* Build row-wise line strips once. Each row is an independent price line. */
  const geometry = useMemo(() => {
    const width = 11;
    const depth = 5.2;

    const positions = [];
    const rowAttr = [];
    const colAttr = [];

    for (let row = 0; row < rows; row += 1) {
      const z = -depth * (row / (rows - 1));
      for (let col = 0; col < cols - 1; col += 1) {
        const x1 = -width / 2 + width * (col / (cols - 1));
        const x2 = -width / 2 + width * ((col + 1) / (cols - 1));

        positions.push(x1, 0, z, x2, 0, z);
        rowAttr.push(row / (rows - 1), row / (rows - 1));
        colAttr.push(col / (cols - 1), (col + 1) / (cols - 1));
      }
    }

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    buffer.setAttribute("aRow", new THREE.Float32BufferAttribute(rowAttr, 1));
    buffer.setAttribute("aCol", new THREE.Float32BufferAttribute(colAttr, 1));
    return buffer;
  }, [cols, rows]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: { value: 0.33 },
      uNearColour: { value: new THREE.Color(0x2aa9c4) },
      uFarColour: { value: new THREE.Color(0x2b3d5c) }
    }),
    []
  );

  useFrame((state) => {
    if (!materialRef.current || still) return;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <lineSegments geometry={geometry} position={[0, -2.3, 0.4]} rotation={[0.34, 0, 0]}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={WAVE_VERTEX}
        fragmentShader={WAVE_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </lineSegments>
  );
}

/**
 * DepthLayers — receding octagon outlines behind the rings.
 * Purpose: market depth seen as discrete levels, giving the composition its
 * layered financial depth without another lit mesh.
 */
function DepthLayers() {
  const layers = useMemo(
    () =>
      [
        { radius: 4.1, z: -2.4, opacity: 0.2 },
        { radius: 5.0, z: -3.6, opacity: 0.14 },
        { radius: 6.1, z: -5.0, opacity: 0.09 }
      ].map((layer) => ({ ...layer, positions: octagonLinePositions(layer.radius) })),
    []
  );

  return (
    <group rotation={[-0.36, 0, 0]}>
      {layers.map((layer) => (
        <lineLoop key={layer.radius} position={[0, 0, layer.z]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[layer.positions, 3]}
              count={layer.positions.length / 3}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={0x8b9dbb}
            transparent
            opacity={layer.opacity}
            depthWrite={false}
          />
        </lineLoop>
      ))}
    </group>
  );
}

/**
 * MarketCore — the octahedron at the centre of the composition.
 * Eight faces for "Octa"; it is the execution point everything orbits.
 */
function MarketCore({ still }) {
  const meshRef = useRef(null);

  useFrame((state, delta) => {
    if (!meshRef.current || still) return;
    const clamped = Math.min(delta, 0.05);
    meshRef.current.rotation.y += clamped * 0.32;
    meshRef.current.rotation.x += clamped * 0.11;
    /* A slow breath so the core never looks frozen. */
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.7) * 0.025;
    meshRef.current.scale.setScalar(pulse);
  });

  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[0.46, 0]} />
      <meshStandardMaterial
        color={0xdce4ef}
        metalness={1}
        roughness={0.14}
        emissive={0x0d4f5e}
        emissiveIntensity={0.35}
        flatShading
      />
    </mesh>
  );
}

/** Scene lighting: a cold key light, a cyan rim, and a violet counter-accent. */
function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.55} color={0x9fb4cd} />
      <directionalLight position={[4.5, 5.5, 4]} intensity={2.1} color={0xeaf2ff} />
      {/* Rim light picks out the octagon edges against the dark ground. */}
      <pointLight position={[-4.5, -1.5, 2.5]} intensity={22} color={0x33d2e6} distance={14} decay={2} />
      {/* The single, strictly rationed violet accent in the scene. */}
      <pointLight position={[3.2, -2.8, -2]} intensity={12} color={0x8878ee} distance={12} decay={2} />
    </>
  );
}

/**
 * FinancialScene — the exported canvas.
 *
 * Input :
 *   active  - advance frames (false when off-screen, tab hidden, or paused)
 *   still   - render a single frame and stop (reduced motion)
 *   quality - "low" | "high"
 * Output : the WebGL canvas element.
 */
export default function FinancialScene({ active = true, still = false, quality = "high" }) {
  const settings = QUALITY[quality] || QUALITY.high;

  /* Pointer target in normalised device coordinates. A ref, never state, so
     moving the pointer cannot trigger a React render. */
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (still) return undefined;

    /* Pointer parallax is a desktop affordance; on touch there is no hover and
       listening would only cost battery. */
    if (window.matchMedia("(pointer: coarse)").matches) return undefined;

    const onPointerMove = (event) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [still]);

  return (
    <Canvas
      /* Nothing renders unless FrameDriver advances the loop. */
      frameloop="never"
      dpr={settings.dpr}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        /* The hero sits on a dark ground; no need to preserve the buffer. */
        preserveDrawingBuffer: false
      }}
      camera={{ position: [0, 0.35, 7.4], fov: 42, near: 0.1, far: 40 }}
      /* The canvas is decorative: never intercept pointer or touch events, so
         scrolling over the hero on mobile stays native. */
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
      onCreated={({ gl }) => {
        gl.setClearAlpha(0);
      }}
    >
      <FrameDriver active={active} still={still} />
      <SceneLighting />
      <DepthLayers />
      <MarketRings count={settings.rings} pointer={pointer} still={still} />
      <OrderFlow count={settings.particles} still={still} />
      <PriceWaveField segments={settings.lattice} still={still} />
      <MarketCore still={still} />
    </Canvas>
  );
}
