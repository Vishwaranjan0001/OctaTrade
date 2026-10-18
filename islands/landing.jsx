// OctaTrade landing islands (Papermint structure, OctaTrade content).
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { useEffect, useState } from 'react';
import SplitText from './reactbits/SplitText/SplitText.jsx';
import ScrollVelocity from './reactbits/ScrollVelocity/ScrollVelocity.jsx';
import CountUp from './reactbits/CountUp/CountUp.jsx';
import Magnet from './reactbits/Magnet/Magnet.jsx';
import TearTicket from './reactbits/TearTicket/TearTicket.jsx';
import Spark from './shared/Spark.jsx';
import { Manifesto, Markets, HowItWorks, Features, Dots, RiskCalc, AppPreview, FinalCta, Wordmark } from './sections.jsx';

window.PM_ISLANDS = true;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- ticker: real quotes from the OctaTrade backend (/api/quotes) ---------- */
// No invented prices: if the backend is not running, the tape shows names only.
const SYMBOLS = [
  ['RELIANCE.NS', 'Reliance'], ['TCS.NS', 'TCS'], ['INFY.NS', 'Infosys'], ['HDFCBANK.NS', 'HDFC Bank'],
  ['ICICIBANK.NS', 'ICICI Bank'], ['SBIN.NS', 'SBI'], ['ITC.NS', 'ITC'], ['LT.NS', 'L&T'],
  ['BHARTIARTL.NS', 'Airtel'], ['WIPRO.NS', 'Wipro'], ['^NSEI', 'Nifty 50'],
];
let quotes = SYMBOLS.map(([s, n]) => ({ s, n, p: null }));
const listeners = new Set();
async function loadQuotes() {
  const next = await Promise.all(
    quotes.map(async (q) => {
      try {
        const r = await fetch(`/api/quotes/${encodeURIComponent(q.s)}`);
        if (!r.ok) return q;
        const d = await r.json();
        return typeof d.price === 'number' ? { ...q, p: d.price } : q;
      } catch {
        return q;
      }
    })
  );
  quotes = next;
  listeners.forEach((fn) => fn(quotes));
}
loadQuotes();
if (!reduce) setInterval(loadQuotes, 30000);
function useQuotes() {
  const [q, setQ] = useState(quotes);
  useEffect(() => {
    listeners.add(setQ);
    return () => listeners.delete(setQ);
  }, []);
  return q;
}
const money = (v) => v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const short = (s) => s.replace('.NS', '').replace('^NSEI', 'NIFTY 50');

/* ---------- Hero heading: SplitText, after the loader ---------- */
// Text comes from the static <h1> markup, so index.html stays the single source of copy.
function readText(el, sel, fallback) {
  const node = el && el.querySelector(sel);
  return (node && node.textContent.trim()) || fallback;
}
function readLink(id, fallbackHref, fallbackText) {
  const a = document.querySelector(`#${id} a`);
  return { href: (a && a.getAttribute('href')) || fallbackHref, text: (a && a.textContent.trim()) || fallbackText };
}

function HeroHeading({ line1, line2 }) {
  const [ready, setReady] = useState(() => document.getElementById('loader')?.classList.contains('hidden'));
  const [second, setSecond] = useState(false);
  useEffect(() => {
    if (ready) return;
    const on = () => setReady(true);
    window.addEventListener('pm:ready', on, { once: true });
    return () => window.removeEventListener('pm:ready', on);
  }, [ready]);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setSecond(true), 380);
    return () => clearTimeout(t);
  }, [ready]);

  // No per-letter masks: Fraunces glyphs overhang their boxes and masks clip them
  const common = { splitType: 'chars', delay: 32, duration: 1.05, effect: 'rise', trigger: 'load', textAlign: 'left', mask: false, tag: 'span' };
  return (
    <>
      {ready ? (
        <SplitText {...common} text={line1} className="hh-line" />
      ) : (
        <span className="hh-line" style={{ visibility: 'hidden' }}>{line1}</span>
      )}
      {second ? (
        <SplitText {...common} text={line2} className="hh-line hero-accent" />
      ) : (
        <span className="hh-line hero-accent" style={{ visibility: 'hidden' }}>{line2}</span>
      )}
    </>
  );
}

/* ---------- Ticker tape: ScrollVelocity (speeds up with scroll) ---------- */
function Tape() {
  const q = useQuotes();
  const row = (
    <span className="tape-row">
      {q.map((x) => (
        <span className="tape-item" key={x.s}>
          <b>{short(x.s)}</b>
          {x.p != null ? <span>₹{money(x.p)}</span> : <span>{x.n}</span>}
        </span>
      ))}
    </span>
  );
  return (
    <ScrollVelocity
      texts={[row]}
      velocity={28}
      numCopies={3}
      damping={50}
      stiffness={400}
      velocityMapping={{ input: [0, 1000], output: [0, 4] }}
      parallaxClassName="tape-parallax"
      scrollerClassName="tape-scroller"
      fadeEdges
    />
  );
}

/* ---------- Market preview: quotes from the same feed as the trading desk ---------- */
function MarketPreview() {
  const quotes = useQuotes();
  return (
    <div className="market-preview">
      <div className="market-preview-head"><span>Market watch</span><span>NSE</span></div>
      <h2>Your next idea<br />starts here.</h2>
      <div className="market-preview-list">
        {quotes.slice(0, 3).map((q) => (
          <a key={q.s} href={`app.html#stock/${encodeURIComponent(q.s)}`}>
            <span><b>{short(q.s)}</b><small>{q.n}</small></span>
            <span className="market-preview-price">{q.p != null ? `₹${money(q.p)}` : 'View stock →'}</span>
          </a>
        ))}
      </div>
      <p>Latest available quotes · May be delayed</p>
      <a className="market-preview-cta" href="app.html#watchlist">Build your watchlist <span aria-hidden="true">↗</span></a>
    </div>
  );
}

/* ---------- Stats: CountUp, started by the scroll reel ---------- */
let statsStarted = false;
window.addEventListener('pm:stats', () => {
  statsStarted = true;
});
function Stat({ to, decimals, separator }) {
  const [go, setGo] = useState(statsStarted);
  useEffect(() => {
    if (go) return;
    const on = () => setGo(true);
    window.addEventListener('pm:stats', on, { once: true });
    return () => window.removeEventListener('pm:stats', on);
  }, [go]);
  return (
    <CountUp
      to={to}
      from={0}
      duration={1.8}
      decimals={decimals}
      separator={separator || ''}
      trigger="load"
      startWhen={go}
      className="stat-count"
    />
  );
}

/* ---------- Buttons: Magnet ---------- */
function MagnetLink({ className, href, children }) {
  return (
    <Magnet padding={70} magnetStrength={3.2} wrapperClassName="magnet-wrap">
      <a className={className} href={href}>{children}</a>
    </Magnet>
  );
}

/* ---------- Mount ---------- */
function mount(target, node) {
  const el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) return;
  const root = createRoot(el);
  flushSync(() => root.render(node));
}

function boot() {
  const h1 = document.getElementById('rb-hero-heading');
  const line1 = readText(h1, '.hh-line:not(.hero-accent)', 'Your headline');
  const line2 = readText(h1, '.hero-accent', 'goes here.');
  const heroCta = readLink('rb-hero-cta', '#', 'Get started');
  const endCta = readLink('rb-cta', '#', 'Get started →');
  mount('rb-hero-heading', <HeroHeading line1={line1} line2={line2} />);
  mount('rb-tape', <Tape />);
  if (window.innerWidth > 900) mount('rb-ticket', <MarketPreview />);
  mount('rb-hero-cta', <MagnetLink className="btn btn-ink" href={heroCta.href}>{heroCta.text}</MagnetLink>);
  mount('rb-cta', <MagnetLink className="cta-button" href={endCta.href}>{endCta.text}</MagnetLink>);
  document.querySelectorAll('.stat-number[data-count]').forEach((el) =>
    mount(
      el,
      <Stat
        to={Number(el.dataset.count)}
        decimals={el.dataset.decimals ? Number(el.dataset.decimals) : undefined}
        separator={el.dataset.separator}
      />
    )
  );
  mount('rb-spark', <Spark />);

  // after the film
  const manifesto = document.querySelector('#rb-manifesto .manifesto-text');
  mount('rb-manifesto', <Manifesto text={(manifesto && manifesto.textContent.trim()) || ''} />);
  mount('rb-markets', <Markets />);
  mount('rb-how', <HowItWorks />);
  mount('rb-dots', <Dots />);
  mount('rb-bento', <Features />);
  mount('rb-risk', <RiskCalc />);
  mount('rb-cards', <AppPreview />);
  const finalCta = readLink('rb-final', '#', 'Get started →');
  const wordmark = document.querySelector('#rb-wordmark .wordmark');
  mount('rb-final', <FinalCta href={finalCta.href} label={finalCta.text} />);
  mount('rb-wordmark', <Wordmark label={(wordmark && wordmark.textContent.trim()) || 'Brand'} />);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
