// DepthCard: a card that tilts in 3D toward the cursor, with layered depth and a moving glare.
// Written for OctaTrade (not React Bits Pro). Children marked with data-depth="N" float N px
// above the card face. Pointer input only; touch devices get a gentle tilt as the card scrolls in,
// and reduced-motion users get a flat card.
import { useEffect, useRef } from 'react';
import './DepthCard.css';

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

export default function DepthCard({ children, className = '', maxTilt = 11, glare = 0.35, as: Tag = 'div', ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion()) return undefined;
    const state = { x: 0, y: 0, tx: 0, ty: 0, gx: 50, gy: 50, tgx: 50, tgy: 50, on: 0, ton: 0 };
    let raf = 0;

    const paint = () => {
      raf = 0;
      const k = 0.14;
      state.x += (state.tx - state.x) * k;
      state.y += (state.ty - state.y) * k;
      state.gx += (state.tgx - state.gx) * k;
      state.gy += (state.tgy - state.gy) * k;
      state.on += (state.ton - state.on) * k;
      el.style.setProperty('--rx', `${state.y.toFixed(2)}deg`);
      el.style.setProperty('--ry', `${state.x.toFixed(2)}deg`);
      el.style.setProperty('--tilt-x', state.x.toFixed(2));   // unitless copies for shadows and parallax
      el.style.setProperty('--tilt-y', state.y.toFixed(2));
      el.style.setProperty('--gx', `${state.gx.toFixed(1)}%`);
      el.style.setProperty('--gy', `${state.gy.toFixed(1)}%`);
      el.style.setProperty('--glare', (state.on * glare).toFixed(3));
      el.style.setProperty('--lift', state.on.toFixed(3));
      const moving = Math.abs(state.tx - state.x) + Math.abs(state.ty - state.y) + Math.abs(state.ton - state.on) > 0.01;
      if (moving) raf = requestAnimationFrame(paint);
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(paint); };

    const aim = (clientX, clientY) => {
      const r = el.getBoundingClientRect();
      const px = Math.min(Math.max((clientX - r.left) / r.width, 0), 1);
      const py = Math.min(Math.max((clientY - r.top) / r.height, 0), 1);
      state.tx = (px - 0.5) * 2 * maxTilt;
      state.ty = -(py - 0.5) * 2 * maxTilt;
      state.tgx = px * 100;
      state.tgy = py * 100;
      wake();
    };
    const settle = () => { state.tx = 0; state.ty = 0; state.ton = 0; wake(); };

    const onMove = (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') { state.ton = 1; aim(e.clientX, e.clientY); } };
    const onLeave = () => settle();
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);

    // Touch screens: tilt once as the card arrives, then settle.
    let io;
    if (!finePointer() && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          state.tx = maxTilt * 0.55; state.ty = maxTilt * 0.35; state.tgx = 80; state.tgy = 20; state.ton = 0.6; wake();
          setTimeout(settle, 650);
          io.unobserve(entry.target);
        });
      }, { threshold: 0.6 });
      io.observe(el);
    }

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [maxTilt, glare]);

  return (
    <Tag ref={ref} className={`depth-card ${className}`.trim()} {...rest}>
      <div className="depth-card__body">
        {children}
        <span className="depth-card__glare" aria-hidden="true" />
      </div>
    </Tag>
  );
}
