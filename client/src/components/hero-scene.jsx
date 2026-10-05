import { useEffect, useRef } from "react";
import { cancelFrame, frame } from "motion/react";

export function HeroScene({ animated = false }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    let disposed = false;
    let cleanup;

    import("three").then((THREE) => {
      if (disposed || !host) return;

      const compact = window.matchMedia("(max-width: 700px)").matches;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: !compact,
          powerPreference: "low-power"
        });
      } catch {
        host.dataset.webgl = "unavailable";
        return;
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, compact ? 1 : 1.4));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.setAttribute("role", "presentation");
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
      camera.position.set(0, 0.15, compact ? 15 : 13.5);

      const instrument = new THREE.Group();
      scene.add(instrument);

      scene.add(new THREE.HemisphereLight(0xd8f4ff, 0x07121d, 2.2));
      const keyLight = new THREE.DirectionalLight(0xf4fbff, 5.5);
      keyLight.position.set(-4, 6, 7);
      scene.add(keyLight);
      const cyanLight = new THREE.PointLight(0x45d7ff, 18, 20, 2);
      cyanLight.position.set(4, 0, 4);
      scene.add(cyanLight);
      const violetLight = new THREE.PointLight(0x796fff, 4, 14, 2);
      violetLight.position.set(-4, -3, 3);
      scene.add(violetLight);

      const metal = new THREE.MeshStandardMaterial({ color: 0x9cabb7, metalness: 0.88, roughness: 0.2 });
      const darkMetal = new THREE.MeshStandardMaterial({ color: 0x263746, metalness: 0.78, roughness: 0.3 });
      const cyan = new THREE.MeshStandardMaterial({ color: 0x75e6ff, emissive: 0x0d5970, emissiveIntensity: 1.2, metalness: 0.35, roughness: 0.26 });
      const glass = new THREE.MeshPhysicalMaterial({
        color: 0x9de9ff,
        metalness: 0.08,
        roughness: 0.12,
        transmission: 0.62,
        transparent: true,
        opacity: 0.72,
        thickness: 1.3,
        clearcoat: 1
      });

      const mainRing = new THREE.Mesh(new THREE.TorusGeometry(3.45, compact ? 0.13 : 0.18, 18, compact ? 72 : 112), metal);
      mainRing.rotation.set(0.92, -0.2, -0.28);
      instrument.add(mainRing);

      const orbitalRing = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.045, 10, compact ? 64 : 96), cyan);
      orbitalRing.rotation.set(1.2, 0.55, 0.15);
      instrument.add(orbitalRing);

      const marketCore = new THREE.Mesh(new THREE.IcosahedronGeometry(compact ? 1.12 : 1.42, 2), glass);
      const coreWire = new THREE.LineSegments(
        new THREE.EdgesGeometry(marketCore.geometry, 20),
        new THREE.LineBasicMaterial({ color: 0xb8f3ff, transparent: true, opacity: 0.28 })
      );
      marketCore.add(coreWire);
      instrument.add(marketCore);

      const candleGroup = new THREE.Group();
      const candleCount = compact ? 6 : 11;
      const bodyGeometry = new THREE.BoxGeometry(0.22, 1, 0.22);
      const wickGeometry = new THREE.CylinderGeometry(0.018, 0.018, 1, 6);
      for (let index = 0; index < candleCount; index += 1) {
        const angle = (index / candleCount) * Math.PI * 2;
        const height = 0.48 + ((index * 7) % 5) * 0.16;
        const candle = new THREE.Group();
        const body = new THREE.Mesh(bodyGeometry, index % 3 === 0 ? cyan : darkMetal);
        body.scale.y = height;
        const wick = new THREE.Mesh(wickGeometry, metal);
        wick.scale.y = height + 0.6;
        candle.add(wick, body);
        candle.position.set(Math.cos(angle) * 3.05, Math.sin(angle) * 1.25, Math.sin(angle) * 1.6);
        candle.rotation.z = angle + Math.PI / 2;
        candleGroup.add(candle);
      }
      candleGroup.rotation.set(0.1, 0.2, -0.08);
      instrument.add(candleGroup);

      const pathMaterial = new THREE.MeshBasicMaterial({ color: 0x5cdfff, transparent: true, opacity: 0.38 });
      [
        [new THREE.Vector3(-4.4, -1.6, -0.5), new THREE.Vector3(-2.2, 1.9, 0.7), new THREE.Vector3(0.3, 0.4, 2), new THREE.Vector3(4.2, 1.5, 0)],
        [new THREE.Vector3(-3.8, 2.1, -1.2), new THREE.Vector3(-1.6, -0.4, 1.6), new THREE.Vector3(1.8, -1.5, 1.1), new THREE.Vector3(4.3, -0.5, -0.8)]
      ].forEach((points) => {
        const curve = new THREE.CatmullRomCurve3(points);
        instrument.add(new THREE.Mesh(new THREE.TubeGeometry(curve, compact ? 34 : 52, 0.018, 6, false), pathMaterial));
      });

      const particleCount = compact ? 28 : 72;
      const particlePositions = new Float32Array(particleCount * 3);
      for (let index = 0; index < particleCount; index += 1) {
        const angle = index * 2.399;
        const radius = 1.8 + (index % 9) * 0.35;
        particlePositions[index * 3] = Math.cos(angle) * radius;
        particlePositions[index * 3 + 1] = Math.sin(angle * 1.7) * 2.4;
        particlePositions[index * 3 + 2] = Math.sin(angle) * radius * 0.55;
      }
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
      const particleMaterial = new THREE.PointsMaterial({ color: 0xb7efff, size: compact ? 0.045 : 0.06, transparent: true, opacity: 0.72 });
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      instrument.add(particles);

      const grid = new THREE.GridHelper(compact ? 11 : 14, compact ? 12 : 20, 0x24516a, 0x173044);
      grid.position.set(0, -3.35, -1.6);
      grid.material.transparent = true;
      grid.material.opacity = 0.25;
      scene.add(grid);

      const pointer = { x: 0, y: 0 };
      const target = { x: 0, y: 0 };
      let visible = false;
      let running = false;
      let elapsed = 0;
      let lastTimestamp = 0;

      const render = ({ timestamp } = { timestamp: performance.now() }) => {
        const delta = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.05) : 0;
        lastTimestamp = timestamp;
        if (animated) elapsed += delta;
        pointer.x += (target.x - pointer.x) * 0.045;
        pointer.y += (target.y - pointer.y) * 0.045;
        instrument.rotation.y = -0.18 + pointer.x * 0.16 + elapsed * 0.035;
        instrument.rotation.x = 0.03 + pointer.y * 0.1;
        instrument.position.y = Math.sin(elapsed * 0.42) * 0.1;
        mainRing.rotation.z = -0.28 + elapsed * 0.065;
        orbitalRing.rotation.z = 0.15 - elapsed * 0.095;
        marketCore.rotation.set(elapsed * 0.045, elapsed * 0.08, elapsed * 0.035);
        candleGroup.rotation.y = 0.2 - elapsed * 0.028;
        particles.rotation.y = elapsed * 0.025;
        renderer.render(scene, camera);
      };

      const syncPlayback = () => {
        const shouldRun = animated && visible && !document.hidden;
        host.dataset.playback = shouldRun ? "active" : "paused";
        if (shouldRun && !running) {
          lastTimestamp = 0;
          frame.update(render, true);
          running = true;
        } else if (!shouldRun && running) {
          cancelFrame(render);
          running = false;
        }
        if (!shouldRun) render();
      };

      const resize = () => {
        const { width, height } = host.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        instrument.scale.setScalar(compact ? 0.82 : Math.min(1.15, Math.max(0.9, width / 1200)));
        instrument.position.x = compact ? 0.8 : Math.min(2.25, width * 0.0017);
        render();
      };

      const handlePointer = (event) => {
        target.x = (event.clientX / window.innerWidth - 0.5) * 2;
        target.y = (event.clientY / window.innerHeight - 0.5) * -2;
      };

      const resizeObserver = new ResizeObserver(resize);
      const intersectionObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        syncPlayback();
      }, { rootMargin: "120px" });

      resizeObserver.observe(host);
      intersectionObserver.observe(host);
      window.addEventListener("pointermove", handlePointer, { passive: true });
      document.addEventListener("visibilitychange", syncPlayback);
      resize();

      cleanup = () => {
        cancelFrame(render);
        resizeObserver.disconnect();
        intersectionObserver.disconnect();
        window.removeEventListener("pointermove", handlePointer);
        document.removeEventListener("visibilitychange", syncPlayback);
        scene.traverse((object) => {
          object.geometry?.dispose?.();
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material?.dispose?.();
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
    }).catch(() => {
      if (host) host.dataset.webgl = "unavailable";
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [animated]);

  return <div ref={hostRef} className="hero-market-scene" aria-hidden="true" />;
}
