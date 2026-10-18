// OctaTrade app islands. js/desk.js owns data and routing; these React Bits widgets render the
// moving parts. desk.js sends data with window.__pmUI[id] + a `pm:ui` event { id, data };
// each widget is mounted on an element with data-rb="<type>" (and data-id where it needs data).
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as LightweightCharts from 'lightweight-charts';
import Counter from './reactbits/Counter/Counter.jsx';
import SwipeToast from './reactbits/SwipeToast/SwipeToast.jsx';
import SpotlightCard from './reactbits/SpotlightCard/SpotlightCard.jsx';
import AnimatedList from './reactbits/AnimatedList/AnimatedList.jsx';
import BlurText from './reactbits/BlurText/BlurText.jsx';
import ScrollVelocity from './reactbits/ScrollVelocity/ScrollVelocity.jsx';
import ShinyText from './reactbits/ShinyText/ShinyText.jsx';
import GlareHover from './reactbits/GlareHover/GlareHover.jsx';
import ElasticSlider from './reactbits/ElasticSlider/ElasticSlider.jsx';
import HoldButton from './reactbits/HoldButton/HoldButton.jsx';
import DotGrid from './reactbits/DotGrid/DotGrid.jsx';
import Spark from './shared/Spark.jsx';

// TradingView lightweight-charts for js/desk.js (one bundled copy, no extra script tag)
window.LightweightCharts = LightweightCharts;
window.PM_HOME = true;

/* ---------- data bus + theme ---------- */
const bus = (window.__pmUI = window.__pmUI || {});
function useUI(id) {
  const [d, setD] = useState(() => bus[id]);
  useEffect(() => {
    const on = (e) => { if (e.detail.id === id) setD(e.detail.data); };
    window.addEventListener('pm:ui', on);
    setD(bus[id]);
    return () => window.removeEventListener('pm:ui', on);
  }, [id]);
  return d;
}
const themeNow = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
function useTheme() {
  const [t, setT] = useState(themeNow);
  useEffect(() => {
    const on = () => setT(themeNow());
    window.addEventListener('pm:theme', on);
    return () => window.removeEventListener('pm:theme', on);
  }, []);
  return t;
}
const C = {
  light: { accent: '#1f9e6e', accentInk: '#136b4a', red: '#d9472b', ink: '#141414', card: '#fbf9f4', dots: '#d6cfbd', glare: '#ffffff' },
  dark: { accent: '#3ddc97', accentInk: '#3ddc97', red: '#ff7a5c', ink: '#f1eee6', card: '#1a1d1b', dots: '#2a2f2c', glare: '#3ddc97' },
};
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Num: rolling digits sized to the surrounding text ---------- */
function useFontSize(ref, fallback) {
  const [fs, setFs] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => { const v = parseFloat(getComputedStyle(el).fontSize); if (v && Math.abs(v - fs) > 0.5) setFs(v); };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return fs;
}
function Num({ d, fallback = 28 }) {
  const ref = useRef(null);
  const fs = useFontSize(ref, fallback);
  if (!d) return <span ref={ref}>—</span>;
  if (d.text != null) return <span ref={ref}>{d.text}</span>;
  return (
    <span ref={ref} className="num-wrap" aria-label={d.label || undefined}>
      <Counter value={d.value} prefix={d.prefix} suffix={d.suffix} decimals={d.decimals ?? 2} locale="en-IN"
        fontSize={fs} fontWeight="inherit" textColor="inherit" intro={false} duration={0.8} />
    </span>
  );
}

/* ---------- metric card: SpotlightCard + Counter ---------- */
function Metric({ id, label, sub0 }) {
  const d = useUI(id);
  const theme = useTheme();
  const c = C[theme];
  return (
    <SpotlightCard theme={theme} className="card metric" spotlightColor={theme === 'dark' ? 'rgba(61,220,151,0.22)' : 'rgba(31,158,110,0.2)'}
      intensity={0.18} spotlightSize={260} borderGlow={0.5}>
      <span>{label}</span>
      <b className={d?.tone || ''} style={d?.tone ? { color: d.tone === 'up' ? c.accentInk : c.red } : undefined}><Num d={d} /></b>
      <small>{d?.sub ?? sub0}</small>
    </SpotlightCard>
  );
}

/* ---------- live price: Counter with an up/down flash ---------- */
function Price({ id }) {
  const d = useUI(id);
  const [flash, setFlash] = useState('');
  const prev = useRef(null);
  useEffect(() => {
    if (!d || d.value == null) return;
    if (prev.current != null && d.value !== prev.current) {
      setFlash(d.value > prev.current ? 'tick-up' : 'tick-down');
      const t = setTimeout(() => setFlash(''), 900);
      prev.current = d.value;
      return () => clearTimeout(t);
    }
    prev.current = d.value;
  }, [d && d.value]);
  return <span className={`price-live ${flash}`}><Num d={d} fallback={34} /></span>;
}

/* ---------- feeds: AnimatedList ---------- */
function Feed({ id, empty }) {
  const d = useUI(id);
  const theme = useTheme();
  const items = (d && d.items) || [];
  if (!items.length) return <p className="feed-empty">{(d && d.empty) || empty}</p>;
  return (
    <AnimatedList
      key={theme}
      items={items}
      theme={theme}
      accentColor={C[theme].accent}
      width="100%"
      maxHeight={d.maxHeight || 420}
      gap={6}
      radius={14}
      frame={false}
      animation="pop"
      stagger={0.04}
      showGradients
      selectOnHover
      enableArrowNavigation
      onItemSelect={(it) => { if (it && it.href) location.hash = it.href; }}
      renderItem={(it) => (
        <div className="al-row">
          <span className={`al-ico ${it.kind || ''}`} aria-hidden="true">{it.icon}</span>
          <span className="al-text"><b>{it.title}</b><small>{it.description}</small></span>
          <span className="al-meta">{it.meta}{it.status ? <span className={`status ${it.status}`}>{it.status}</span> : null}</span>
        </div>
      )}
    />
  );
}

/* ---------- page titles: BlurText, replayed on every visit ---------- */
function Title({ id, text0, view }) {
  const d = useUI(id || '__none');
  const [n, setN] = useState(0);
  useEffect(() => {
    const on = (e) => { if (e.detail.view === view) setN((x) => x + 1); };
    window.addEventListener('pm:route', on);
    return () => window.removeEventListener('pm:route', on);
  }, [view]);
  const text = (d && d.text) || text0;
  if (reduce) return text;
  return <BlurText key={n + text} text={text} trigger="load" animateBy="words" delay={60} stepDuration={0.32} blur={8} distance={18} direction="top" className="blur-title" />;
}

/* ---------- topbar ticker: ScrollVelocity with live watchlist prices ---------- */
function Ticker() {
  const d = useUI('ticker');
  const items = (d && d.items) || [];
  if (!items.length) return null;
  const row = (
    <span className="tk-row">
      {items.map((x) => (
        <a className="tk-item" key={x.s} href={`#stock/${encodeURIComponent(x.s)}`}>
          <b>{x.label}</b>
          <span>{x.price}</span>
          {x.dir ? <em className={x.dir === 'up' ? 'up' : 'down'}>{x.dir === 'up' ? '▲' : '▼'}</em> : null}
        </a>
      ))}
    </span>
  );
  return (
    <ScrollVelocity texts={[row]} velocity={22} numCopies={4} damping={50} stiffness={400}
      velocityMapping={{ input: [0, 1000], output: [0, 3] }} parallaxClassName="tk-parallax" scrollerClassName="tk-scroller" fadeEdges />
  );
}

/* ---------- live pills: ShinyText ---------- */
function Shiny({ text }) {
  const theme = useTheme();
  return <ShinyText text={text} color={C[theme].accentInk} shineColor={theme === 'dark' ? '#ffffff' : '#7ff0bd'} speed={2.6} shineWidth={34} />;
}

/* ---------- markets tiles: GlareHover ---------- */
const STAR = (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
);
function Tiles() {
  const d = useUI('mk-tiles');
  const theme = useTheme();
  const items = (d && d.items) || [];
  if (!items.length) return <p className="feed-empty">{(d && d.empty) || 'Loading…'}</p>;
  return (
    <div className="tiles">
      {items.map((t) => (
        <GlareHover key={t.s} className="tile-glare" background="transparent" borderRadius="16px" glareColor={C[theme].glare}
          glareOpacity={theme === 'dark' ? 0.18 : 0.55} glareSize={240} transitionDuration={700}>
          <div className="tile">
            <div className="tile-top">
              <span className="sym-badge">{t.badge}</span>
              <span><b>{t.s}</b><small>{t.sub}</small></span>
              <button className="star" type="button" aria-pressed="true" aria-label={`Remove ${t.s} from watchlist`} data-unwatch={t.s}>{STAR}</button>
            </div>
            <div className="tile-price"><Price id={`tile:${t.s}`} /></div>
            <div className="tile-actions"><a href={`#stock/${encodeURIComponent(t.s)}`}>Details</a><a href={`#trade/${encodeURIComponent(t.s)}`}>Trade →</a></div>
          </div>
        </GlareHover>
      ))}
    </div>
  );
}

/* ---------- order quantity: ElasticSlider ---------- */
function Qty() {
  const d = useUI('qty');
  const theme = useTheme();
  if (!d || !d.max || d.max < 2) return null;
  const set = (v) => {
    const q = Math.max(1, Math.min(d.max, Math.round(Number(v) || 1)));
    const input = document.getElementById('o-qty');
    if (input && Number(input.value) !== q) {
      input.value = String(q);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };
  return (
    <div className="qty-slider">
      <ElasticSlider value={Math.min(d.value || 1, d.max)} startingValue={1} maxValue={d.max} isStepped stepSize={1}
        onChange={set} leftIcon={<span className="qs-icon">1</span>} rightIcon={<span className="qs-icon">{d.max}</span>}
        formatValue={(v) => `${Math.round(v)} sh`} rangeColor={d.side === 'SELL' ? C[theme].red : C[theme].accent}
        thumbColor="#ffffff" ariaLabel={d.side === 'SELL' ? 'Shares to sell' : 'Shares to buy'} />
      <small>{d.hint}</small>
    </div>
  );
}

/* ---------- hold to sell: HoldButton ---------- */
function Hold() {
  const d = useUI('hold') || {};
  const theme = useTheme();
  return (
    <HoldButton holdTime={900} resetAfter={1100} size="md" radius={999} backgroundColor={C[theme].red} fillColor={theme === 'dark' ? '#b8402a' : '#a1341e'}
      textColor="#ffffff" doneLabel="Sending…" disabled={!!d.disabled} onHold={() => window.dispatchEvent(new CustomEvent('pm:hold-sell'))} className="hold-sell">
      {d.label || 'Hold to sell'}
    </HoldButton>
  );
}

/* ---------- auth background: DotGrid ---------- */
function Dots() {
  const theme = useTheme();
  return <DotGrid key={theme} dotSize={4} gap={24} baseColor={C[theme].dots} activeColor={C[theme].accent} proximity={140} shockRadius={260} shockStrength={4} glow={0.2} fade={0.35} />;
}

/* ---------- toasts + balance (kept from the first version) ---------- */
function Balance() {
  const ref = useRef(null);
  const fs = useFontSize(ref, 44);
  const [value, setValue] = useState(0);
  useEffect(() => {
    const on = (e) => setValue(Number(e.detail.value) || 0);
    window.addEventListener('pm:pv', on);
    return () => window.removeEventListener('pm:pv', on);
  }, []);
  return <span ref={ref}><Counter value={value} prefix="₹" decimals={2} locale="en-IN" fontSize={fs} fontWeight={600} intro={false} /></span>;
}
const OkIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#3ddc97" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const ErrIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="#ff8a70" strokeWidth="2.4" strokeLinecap="round" /></svg>);
function Toasts() {
  const [t, setT] = useState(null);
  useEffect(() => {
    let n = 0;
    const on = (e) => setT({ ...e.detail, key: ++n });
    window.addEventListener('pm:toast', on);
    return () => window.removeEventListener('pm:toast', on);
  }, []);
  if (!t) return null;
  return (
    <SwipeToast key={t.key} title={t.title} description={t.description} icon={t.tag === 'err' ? <ErrIcon /> : <OkIcon />}
      background="#1b1d1c" color="#f4f1ea" fuseColor={t.tag === 'err' ? '#d9472b' : '#1f9e6e'}
      width={Math.min(356, window.innerWidth - 32)} duration={4200} onClose={() => setT(null)} />
  );
}

/* ---------- mount ---------- */
function mount(el, node) {
  if (!el) return;
  const root = createRoot(el);
  flushSync(() => root.render(node));
}
function boot() {
  const q = (s) => document.querySelectorAll(s);
  mount(document.getElementById('rb-balance'), <Balance />);
  mount(document.getElementById('toast-host'), <Toasts />);
  mount(document.getElementById('rb-spark'), <Spark />);
  q('[data-rb="metric"]').forEach((el) => mount(el, <Metric id={el.dataset.id} label={el.dataset.label} sub0={el.dataset.sub || ''} />));
  q('[data-rb="price"]').forEach((el) => mount(el, <Price id={el.dataset.id} />));
  q('[data-rb="feed"]').forEach((el) => mount(el, <Feed id={el.dataset.id} empty={el.dataset.empty || ''} />));
  q('[data-rb="title"]').forEach((el) => {
    const view = el.closest('.view')?.dataset.view;
    mount(el, <Title id={el.dataset.id} text0={el.textContent.trim()} view={view} />);
  });
  q('[data-rb="shiny"]').forEach((el) => mount(el, <Shiny text={el.textContent.trim()} />));
  mount(document.querySelector('[data-rb="ticker"]'), <Ticker />);
  mount(document.querySelector('[data-rb="tiles"]'), <Tiles />);
  mount(document.querySelector('[data-rb="dots"]'), <Dots />);
  // ticket widgets live in a <template>; desk.js clones it, then asks for these mounts
  const mountTicket = () => {
    mount(document.querySelector('[data-rb="qty"]:not([data-mounted])'), <Qty />);
    mount(document.querySelector('[data-rb="hold"]:not([data-mounted])'), <Hold />);
    q('[data-rb="qty"],[data-rb="hold"]').forEach((el) => (el.dataset.mounted = '1'));
  };
  window.addEventListener('pm:ticket', mountTicket);
  if (document.getElementById('ticket-card')) mountTicket();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
