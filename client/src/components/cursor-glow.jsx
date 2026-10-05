import { useEffect, useRef, useState } from "react";

const interactiveSelector = "a, button, [role='button'], [role='tab'], input, select, textarea, label, .depth-carousel, .infinite-menu__canvas";

// Purpose: gold pointer that replaces the system cursor, plus a soft halo that trails it.
// Input: none. Output: fixed, click-through overlay moved with transforms only.
// The dot tracks the pointer exactly; the halo eases behind it in a rAF loop that
// stops once it has caught up. File: components/cursor-glow.jsx.
export function CursorGlow() {
  const haloRef = useRef(null);
  const dotRef = useRef(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    const update = () => setEnabled(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    // Hides the system cursor (see .has-cursor-glow in index.css) only while this is mounted.
    document.documentElement.classList.add("has-cursor-glow");

    const halo = haloRef.current;
    const dot = dotRef.current;
    const target = { x: -400, y: -400 };
    const haloPos = { x: -400, y: -400 };
    let frame = 0;
    let idleTimer = 0;
    let inside = false;
    let active = false;

    const tick = () => {
      haloPos.x += (target.x - haloPos.x) * 0.16;
      haloPos.y += (target.y - haloPos.y) * 0.16;
      halo.style.transform = `translate3d(${haloPos.x}px, ${haloPos.y}px, 0)`;
      const settled = Math.abs(target.x - haloPos.x) < 0.3 && Math.abs(target.y - haloPos.y) < 0.3;
      frame = settled ? 0 : requestAnimationFrame(tick);
    };

    const onMove = (event) => {
      target.x = event.clientX;
      target.y = event.clientY;
      dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;

      if (!inside) {
        inside = true;
        haloPos.x = target.x;
        haloPos.y = target.y;
        dot.classList.add("is-visible");
      }
      halo.classList.add("is-visible");

      const overInteractive = Boolean(event.target.closest?.(interactiveSelector));
      if (overInteractive !== active) {
        active = overInteractive;
        dot.classList.toggle("is-active", active);
      }

      if (!frame) frame = requestAnimationFrame(tick);
      clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => halo.classList.remove("is-visible"), 900);
    };

    const hide = () => {
      inside = false;
      dot.classList.remove("is-visible");
      halo.classList.remove("is-visible");
    };
    const onDown = () => dot.classList.add("is-pressed");
    const onUp = () => dot.classList.remove("is-pressed");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    return () => {
      document.documentElement.classList.remove("has-cursor-glow");
      cancelAnimationFrame(frame);
      clearTimeout(idleTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="cursor-glow" aria-hidden="true">
      <div ref={haloRef} className="cursor-glow-halo" />
      <div ref={dotRef} className="cursor-glow-dot" />
    </div>
  );
}
