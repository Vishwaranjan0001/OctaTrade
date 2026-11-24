// OctaTrade landing islands (Papermint structure, OctaTrade content).
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { useEffect, useState } from 'react';
import SplitText from './reactbits/SplitText/SplitText.jsx';
import ScrollVelocity from './reactbits/ScrollVelocity/ScrollVelocity.jsx';
import CountUp from './reactbits/CountUp/CountUp.jsx';
import Magnet from './reactbits/Magnet/Magnet.jsx';
import SpotlightCard from './reactbits/SpotlightCard/SpotlightCard.jsx';
import Counter from './reactbits/Counter/Counter.jsx';
import Spark from './shared/Spark.jsx';
import Voucher from './Voucher.jsx';
import CoinTrail from './CoinTrail.jsx';
import CandleScape from './CandleScape.jsx';
import Rupee3D from './Rupee3D.jsx';
import { Manifesto, Markets, HowItWorks, Features, RiskCalc, AppPreview, FinalCta, Wordmark } from './sections.jsx';

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

/* ---------- Hero order flow: phone -> line -> folder -> "Order confirmed" ---------- */
// A small looping motion graphic above the hero text. The phone buzzes, the order travels
// along the line to the order folder, the folder pops, and a confirmation card rises out.
// One 7 s CSS timeline drives every part (css/style.css, .of-*). Starts after the loader.
function HeroOrderFlow() {
  const [on, setOn] = useState(() => document.getElementById('loader')?.classList.contains('hidden'));
  useEffect(() => {
    if (on) return;
    const go = () => setOn(true);
    window.addEventListener('pm:ready', go, { once: true });
    return () => window.removeEventListener('pm:ready', go);
  }, [on]);
  const route = 'M84 64 C 230 14, 430 112, 624 86';
  return (
    <div className={`of${on ? ' is-on' : ''}`}>
      <svg viewBox="0 0 900 120" preserveAspectRatio="xMinYMid meet" aria-hidden="true">
        <defs>
          <filter id="of-shadow" x="-20%" y="-40%" width="140%" height="200%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#141414" floodOpacity="0.16" />
          </filter>
        </defs>

        {/* phone */}
        <g className="of-phone">
          <path className="of-buzz of-buzz-l" d="M10 52 q -7 12 0 24 M2 46 q -10 18 0 36" />
          <path className="of-buzz of-buzz-r" d="M74 52 q 7 12 0 24 M82 46 q 10 18 0 36" />
          <rect x="20" y="20" width="44" height="88" rx="9" className="of-phone-body" />
          <rect x="24" y="27" width="36" height="74" rx="5" className="of-phone-screen" />
          <rect x="35" y="23" width="14" height="2.6" rx="1.3" className="of-phone-notch" />
          <polyline points="27,62 33,58 38,60 44,50 49,53 57,42" className="of-phone-chart" />
          <rect x="28" y="84" width="28" height="11" rx="5.5" className="of-phone-buy" />
          <text x="42" y="92.2" textAnchor="middle" className="of-phone-buy-text">BUY</text>
        </g>

        {/* route */}
        <path d={route} className="of-track" />
        <path d={route} pathLength="1" className="of-line" />
        <path d={route} pathLength="1" className="of-spark" />

        {/* exchange: glow behind, the card that rises from behind the roof, then the building */}
        <ellipse cx="680" cy="84" rx="74" ry="34" className="of-glow" />
        <g className="of-card" filter="url(#of-shadow)">
          <rect x="598" y="1" width="166" height="44" rx="11" className="of-card-bg" />
          <circle cx="620" cy="23" r="10" className="of-card-tick-bg" />
          <path d="M615.5 23.5 l3.2 3.2 l6 -6.8" pathLength="1" className="of-card-tick" />
          <text x="638" y="20" className="of-card-title">Order confirmed</text>
          <text x="638" y="35" className="of-card-sub">BUY 5 TCS, filled</text>
        </g>
        <g className="of-bldg">
          <rect x="638" y="71" width="84" height="27" className="of-bldg-inside" />
          <polygon points="630,65 680,48 730,65" className="of-bldg-stone" />
          <circle cx="680" cy="59" r="3.6" className="of-bldg-emblem" />
          <rect x="632" y="65" width="96" height="7" rx="1" className="of-bldg-stone" />
          {[640, 658, 676, 694, 712].map((x) => (
            <rect key={x} x={x} y="72" width="8" height="26" className="of-bldg-stone" />
          ))}
          <rect x="632" y="98" width="96" height="6" rx="1" className="of-bldg-stone" />
          <rect x="625" y="104" width="110" height="7" rx="1.5" className="of-bldg-stone" />
        </g>
      </svg>
    </div>
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
// 1-month daily closes from /api/quotes/:symbol/history, fetched once per symbol.
const PREVIEW_SYMBOLS = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS'];
const historyCache = {};
function useHistory(symbol) {
  const [closes, setCloses] = useState(historyCache[symbol] || null);
  useEffect(() => {
    if (historyCache[symbol]) return;
    let alive = true;
    fetch(`/api/quotes/${encodeURIComponent(symbol)}/history?range=1M`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list = d && Array.isArray(d.candles) ? d.candles.map((c) => c.close).filter((v) => typeof v === 'number') : [];
        if (list.length < 2) return;
        historyCache[symbol] = list;
        if (alive) setCloses(list);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [symbol]);
  return closes;
}

// Change over the month: latest price against the first close in the history.
function monthChange(closes, price) {
  if (!closes || closes.length < 2) return null;
  const last = price != null ? price : closes[closes.length - 1];
  return ((last - closes[0]) / closes[0]) * 100;
}

function Sparkline({ closes, up, width, height, fill }) {
  if (!closes) return <span className="mp-spark mp-spark-empty" style={{ width, height }} />;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const pts = closes.map((v, i) => [
    (i / (closes.length - 1)) * width,
    height - 2 - ((v - min) / span) * (height - 4),
  ]);
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const color = up ? 'var(--accent)' : 'var(--accent-2)';
  const gradId = `mp-grad-${up ? 'up' : 'down'}`;
  return (
    <svg className="mp-spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {fill && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`0,${height} ${line} ${width},${height}`} fill={`url(#${gradId})`} />
        </>
      )}
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.6" fill={color} />
    </svg>
  );
}

function ChangeBadge({ value }) {
  if (value == null) return <span className="mp-badge mp-badge-flat">1M</span>;
  const up = value >= 0;
  return (
    <span className={`mp-badge ${up ? 'mp-badge-up' : 'mp-badge-down'}`}>
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

function Price({ value, size, prefix = '₹' }) {
  if (value == null) return <span className="mp-price-empty">—</span>;
  return (
    <Counter
      value={value}
      locale="en-IN"
      decimals={2}
      prefix={prefix}
      fontSize={size}
      duration={0.8}
      stagger={0.03}
      intro={!reduce}
      motionBlur={!reduce}
    />
  );
}

function PreviewRow({ quote }) {
  const closes = useHistory(quote.s);
  const change = monthChange(closes, quote.p);
  return (
    <a className="mp-row" href={`app.html#stock/${encodeURIComponent(quote.s)}`}>
      <span className="mp-row-name"><b>{short(quote.s)}</b><small>{quote.n}</small></span>
      <Sparkline closes={closes} up={change == null || change >= 0} width={64} height={26} />
      <span className="mp-row-price">
        <Price value={quote.p} size={15} />
        <ChangeBadge value={change} />
      </span>
    </a>
  );
}

function MarketPreview() {
  const quotes = useQuotes();
  const nifty = quotes.find((q) => q.s === '^NSEI');
  const niftyCloses = useHistory('^NSEI');
  const niftyChange = monthChange(niftyCloses, nifty && nifty.p);
  const rows = PREVIEW_SYMBOLS.map((s) => quotes.find((q) => q.s === s)).filter(Boolean);
  return (
    <SpotlightCard
      className="market-preview"
      theme="light"
      spotlightColor="#1f9e6e"
      intensity={0.22}
      spotlightSize={280}
      borderGlow={0.9}
      grain={0.05}
      style={{ '--spotlight-card-surface': 'var(--card)' }}
    >
      <div className="market-preview-head">
        <span className="mp-live"><i aria-hidden="true" />Market watch</span>
        <span>NSE</span>
      </div>

      <div className="mp-index">
        <div className="mp-index-top">
          <span className="mp-index-name">NIFTY 50</span>
          <ChangeBadge value={niftyChange} />
        </div>
        <div className="mp-index-price"><Price value={nifty && nifty.p} size={34} prefix="" /></div>
        <Sparkline closes={niftyCloses} up={niftyChange == null || niftyChange >= 0} width={300} height={56} fill />
        <span className="mp-index-range">Past month</span>
      </div>

      <div className="market-preview-list">
        {rows.map((q) => <PreviewRow key={q.s} quote={q} />)}
      </div>
      <p>Latest available quotes · May be delayed</p>
      <a className="market-preview-cta" href="app.html#watchlist">Build your watchlist <span aria-hidden="true">↗</span></a>
    </SpotlightCard>
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

/* ---------- Coin trails for the film sections (CoinTrail.jsx) ---------- */
// "See the whole picture": the coin climbs a portfolio-value line past each holding.
// Share counts and cash are an example; holding values use the live quotes when the backend is up.
const EXAMPLE_CASH = 40000;
const EXAMPLE_HOLDINGS = [
  ['TCS.NS', 'TCS', 5],
  ['INFY.NS', 'Infosys', 8],
  ['RELIANCE.NS', 'Reliance', 6],
];
const PORTFOLIO_PATH =
  'M18 186 C 70 184, 92 148, 138 154 S 206 180, 246 140 S 318 118, 352 126 S 418 86, 458 96 S 520 72, 542 68';
const rupees0 = (v) => `₹${Math.round(v).toLocaleString('en-IN')}`;

function PictureTrail() {
  const q = useQuotes();
  const priced = EXAMPLE_HOLDINGS.map(([s, name, shares]) => {
    const quote = q.find((x) => x.s === s);
    return { name, shares, value: quote && quote.p != null ? quote.p * shares : null };
  });
  const allPriced = priced.every((h) => h.value != null);
  const total = allPriced ? EXAMPLE_CASH + priced.reduce((sum, h) => sum + h.value, 0) : null;
  const holdingSub = (h) => `${h.shares} shares${h.value != null ? `, ${rupees0(h.value)}` : ''}`;
  const stops = [
    { at: 0.1, title: 'Cash', sub: `${rupees0(EXAMPLE_CASH)} ready to trade`, side: 'down', align: 'start' },
    { at: 0.36, title: priced[0].name, sub: holdingSub(priced[0]), side: 'up' },
    { at: 0.6, title: priced[1].name, sub: holdingSub(priced[1]), side: 'down' },
    { at: 0.8, title: priced[2].name, sub: holdingSub(priced[2]), side: 'up' },
    { at: 1, title: 'Your whole picture', sub: total != null ? rupees0(total) : 'Cash plus holdings', side: 'down', align: 'end' },
  ];
  return <CoinTrail path={PORTFOLIO_PATH} stops={stops} label="An example portfolio drawn as a rising line: cash, TCS, Infosys and Reliance add up to the total" />;
}

// "Put your ideas to work": the coin follows one practice trade from idea to fill.
const IDEAS_PATH =
  'M18 178 C 86 182, 104 112, 170 116 S 250 192, 320 166 S 384 82, 452 90 S 520 128, 542 108';
const IDEA_STOPS = [
  { at: 0.08, title: 'Pick a stock', sub: 'Live NSE price', side: 'up', align: 'start' },
  { at: 0.4, title: 'Set your size', sub: 'Whole shares', side: 'down' },
  { at: 0.68, title: 'Place the order', sub: 'Market, limit or stop-loss', side: 'up' },
  { at: 1, title: 'Filled', sub: 'Wallet and holdings update', side: 'down', align: 'end' },
];
function IdeasTrail() {
  return <CoinTrail path={IDEAS_PATH} stops={IDEA_STOPS} finale label="One practice trade: pick a stock, set your size, place the order, filled" />;
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
  mount('rb-pulse', <HeroOrderFlow />);
  // Always mounted; css/style.css hides it at 900px and below, so resizing works both ways.
  mount('rb-ticket', <Rupee3D />);
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
  mount('rb-voucher', <Voucher />);
  mount('rb-scape', <CandleScape />);
  mount('rb-trail-picture', <PictureTrail />);
  mount('rb-trail-ideas', <IdeasTrail />);

  // after the film
  const manifesto = document.querySelector('#rb-manifesto .manifesto-text');
  mount('rb-manifesto', <Manifesto text={(manifesto && manifesto.textContent.trim()) || ''} />);
  mount('rb-markets', <Markets />);
  mount('rb-how', <HowItWorks />);
  mount('rb-feature-tour', <Features />);
  mount('rb-risk', <RiskCalc />);
  mount('rb-cards', <AppPreview />);
  const finalCta = readLink('rb-final', '#', 'Get started →');
  const wordmark = document.querySelector('#rb-wordmark .wordmark');
  mount('rb-final', <FinalCta href={finalCta.href} label={finalCta.text} />);
  mount('rb-wordmark', <Wordmark label={(wordmark && wordmark.textContent.trim()) || 'Brand'} />);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
