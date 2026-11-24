// A gold ₹ coin that rolls along a price-line path as the page scrolls down (vertical scroll).
// The line draws itself behind the coin, and each stop's label pops in as the coin reaches it,
// so by the end of the section the whole route is on screen. Clicking a stop bursts it into coins.
//
// The section is a fixed overlay shown for a slice of the scroll reel (data-enter / data-leave,
// in % of #scroll-container), so progress here = how far the reel is through that slice.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

const VB_W = 560;
const VB_H = 260;
const COIN_R = 15;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Reel progress (0..1) of #scroll-container, the same measure app.js uses for the sections.
function reelProgress() {
  const c = document.getElementById('scroll-container');
  if (!c) return 0;
  const span = c.offsetHeight - window.innerHeight;
  return span > 0 ? clamp01((window.scrollY - c.offsetTop) / span) : 0;
}

// Local progress through this section's visible window (fades take ~3% at each end).
function useSectionProgress(ref) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const section = ref.current && ref.current.closest('.scroll-section');
    if (!section) return;
    const enter = parseFloat(section.dataset.enter) / 100 + 0.01;
    const leave = parseFloat(section.dataset.leave) / 100 - 0.02;
    let current = 0;
    let target = 0;
    let raf = 0;
    const step = () => {
      current += (target - current) * 0.14; // ease toward the scroll position, like a camera follow
      if (Math.abs(target - current) < 0.0008) current = target;
      setProgress(current);
      raf = current === target ? 0 : requestAnimationFrame(step);
    };
    const onScroll = () => {
      target = clamp01((reelProgress() - enter) / (leave - enter));
      if (reduce) {
        current = target;
        setProgress(target);
      } else if (!raf) {
        raf = requestAnimationFrame(step);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ref]);
  return progress;
}

function Coin({ spin }) {
  return (
    <g className="ct-coin">
      <ellipse cx="0" cy={COIN_R + 5} rx={COIN_R * 0.9} ry="3" className="ct-coin-shadow" />
      <g transform={`rotate(${spin})`}>
        <circle r={COIN_R} className="ct-coin-face" />
        <circle r={COIN_R - 3.5} className="ct-coin-ring" />
        <text y="5.5" textAnchor="middle" className="ct-coin-mark">₹</text>
      </g>
    </g>
  );
}

let burstId = 0;
function makeBurst(x, y, count = 12) {
  return Array.from({ length: count }, () => ({
    id: ++burstId,
    x,
    y,
    dx: (Math.random() - 0.5) * 150,
    up: 50 + Math.random() * 70,
    fall: 40 + Math.random() * 40,
    turn: (Math.random() - 0.5) * 540,
    delay: Math.random() * 0.08,
  }));
}

export default function CoinTrail({ path, stops, finale = false, label }) {
  const rootRef = useRef(null);
  const pathRef = useRef(null);
  const [geom, setGeom] = useState(null); // { len, points: [{x, y}] for each stop }
  const [bits, setBits] = useState([]);
  const finaleDone = useRef(false);
  const p = useSectionProgress(rootRef);

  useLayoutEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    setGeom({ len, points: stops.map((s) => el.getPointAtLength(s.at * len)) });
  }, [path, stops]);

  const burst = (x, y) => {
    if (reduce) return;
    const fresh = makeBurst(x, y);
    setBits((b) => [...b, ...fresh]);
    setTimeout(() => setBits((b) => b.filter((bit) => !fresh.includes(bit))), 1400);
  };

  // Coin position, heading and roll for the current progress.
  let coin = null;
  if (geom && pathRef.current) {
    const d = p * geom.len;
    const a = pathRef.current.getPointAtLength(d);
    const b = pathRef.current.getPointAtLength(Math.min(geom.len, d + 1));
    const heading = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    coin = { x: a.x, y: a.y, heading, spin: (d / COIN_R) * (180 / Math.PI) };
  }

  useEffect(() => {
    if (!finale || !geom || finaleDone.current || p < 0.995) return;
    finaleDone.current = true;
    const end = geom.points[geom.points.length - 1];
    burst(end.x, end.y);
  });

  return (
    <div ref={rootRef} className="coin-trail" role="img" aria-label={label}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="ct-svg">
        <path d={path} className="ct-track" />
        <path
          ref={pathRef}
          d={path}
          className="ct-line"
          style={geom ? { strokeDasharray: geom.len, strokeDashoffset: geom.len * (1 - p) } : { opacity: 0 }}
        />
        {geom &&
          stops.map((s, i) => {
            const pt = geom.points[i];
            const reached = p >= s.at - 0.005;
            return (
              <g
                key={s.title}
                className={`ct-stop${reached ? ' is-on' : ''}`}
                transform={`translate(${pt.x} ${pt.y})`}
                role="button"
                tabIndex={reached ? 0 : -1}
                aria-label={`${s.title}: burst into coins`}
                onClick={() => burst(pt.x, pt.y)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    burst(pt.x, pt.y);
                  }
                }}
              >
                <circle r="16" className="ct-hit" />
                <circle r="6.5" className="ct-dot" />
              </g>
            );
          })}
        {coin && (
          <g transform={`translate(${coin.x} ${coin.y - COIN_R - 2}) rotate(${coin.heading * 0.35})`}>
            <Coin spin={coin.spin} />
          </g>
        )}
        {bits.map((bit) => (
          <motion.g
            key={bit.id}
            initial={{ x: bit.x, y: bit.y, opacity: 1, rotate: 0, scale: 0.6 }}
            animate={{
              x: bit.x + bit.dx,
              y: [bit.y, bit.y - bit.up, bit.y + bit.fall],
              opacity: [1, 1, 0],
              rotate: bit.turn,
              scale: 1,
            }}
            transition={{ duration: 1.15, delay: bit.delay, ease: 'easeOut', times: [0, 0.4, 1] }}
          >
            <circle r="5" className="ct-bit" />
          </motion.g>
        ))}
      </svg>

      {geom &&
        stops.map((s, i) => {
          const pt = geom.points[i];
          const reached = p >= s.at - 0.005;
          return (
            <div
              key={s.title}
              className={`ct-label ct-${s.side || 'up'} ct-align-${s.align || 'center'}${reached ? ' is-on' : ''}`}
              style={{ left: `${(pt.x / VB_W) * 100}%`, top: `${(pt.y / VB_H) * 100}%` }}
              aria-hidden={!reached}
            >
              <b>{s.title}</b>
              {s.sub ? <span>{s.sub}</span> : null}
            </div>
          );
        })}
    </div>
  );
}
