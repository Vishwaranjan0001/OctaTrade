// OctaTrade post-film sections (Papermint structure, OctaTrade content).
// Landing sections that follow the scroll reel. Each one is a React Bits component
// mounted into a static placeholder in index.html.
import { useEffect, useMemo, useRef, useState } from 'react';
import ScrollReveal from './reactbits/ScrollReveal/ScrollReveal.jsx';
import LogoLoop from './reactbits/LogoLoop/LogoLoop.jsx';
import ScrollStack, { ScrollStackItem } from './reactbits/ScrollStack/ScrollStack.jsx';
import MagicBento from './reactbits/MagicBento/MagicBento.jsx';
import DotGrid from './reactbits/DotGrid/DotGrid.jsx';
import CardSwap, { Card } from './reactbits/CardSwap/CardSwap.jsx';
import ElasticSlider from './reactbits/ElasticSlider/ElasticSlider.jsx';
import Counter from './reactbits/Counter/Counter.jsx';
import StarBorder from './reactbits/StarBorder/StarBorder.jsx';
import VariableProximity from './reactbits/VariableProximity/VariableProximity.jsx';

const cssVar = (name, fallback) => (getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback);
const MINT = cssVar('--accent', '#1f9e6e');      // brand accent
const INK = cssVar('--ink', '#141414');

/* ---------- Manifesto: ScrollReveal, colour-only highlight ---------- */
// Words stay sharp and readable in a light tint, and turn ink one by one as you
// scroll, an accent highlight passing over each word. No blur, no tilt: clients
// asked for "just change the colour of the existing text". The sweep ends when
// the block's bottom reaches 35% of the viewport, so it runs across the whole read
// ("bottom bottom" finishes the instant the paragraph is fully on screen).
export function Manifesto({ text }) {
  return (
    <ScrollReveal
      baseOpacity={0.3}
      enableBlur={false}
      baseRotation={0}
      stagger={0.06}
      highlightColor={MINT}
      containerClassName="manifesto-reveal"
      textClassName="manifesto-text"
      rotationEnd="bottom bottom"
      wordAnimationEnd="bottom 35%"
    >
      {text}
    </ScrollReveal>
  );
}

/* ---------- Markets strip: LogoLoop ---------- */
const MARKETS = [
  ['RELIANCE', 'Reliance Industries'], ['TCS', 'Tata Consultancy'], ['INFY', 'Infosys'], ['HDFCBANK', 'HDFC Bank'],
  ['ICICIBANK', 'ICICI Bank'], ['SBIN', 'State Bank of India'], ['ITC', 'ITC'], ['LT', 'Larsen & Toubro'],
  ['BHARTIARTL', 'Bharti Airtel'], ['MARUTI', 'Maruti Suzuki'], ['WIPRO', 'Wipro'], ['NIFTY 50', 'Benchmark'],
];
export function Markets() {
  const logos = useMemo(
    () =>
      MARKETS.map(([s, n], i) => ({
        title: `${s} ${n}`,
        node: (
          <span className="mkt-chip">
            <i style={{ background: i % 4 === 3 ? '#ef5b3f' : i % 5 === 2 ? '#f2c14e' : MINT }} />
            <b>{s}</b>
            <span>{n}</span>
          </span>
        ),
      })),
    []
  );
  return (
    <LogoLoop
      logos={logos}
      speed={60}
      direction="left"
      logoHeight={44}
      gap={18}
      pauseOnHover
      hoverSpeed={12}
      fadeOut
      fadeOutWidth={0.1}
      scaleOnHover
      scrollBoost={1.5}
      ariaLabel="NSE stocks you can paper trade"
    />
  );
}

/* ---------- How it works: ScrollStack ---------- */
const STEPS = [
  { k: '01', t: 'Create an account', d: 'A name, an email and a password of eight or more characters. You stay signed in with a signed token.', tag: 'Free' },
  { k: '02', t: 'Start with ₹1,00,000', d: 'Your wallet opens with one lakh of practice money, and you can deposit more. None of it is real money.', tag: '₹0 real money' },
  { k: '03', t: 'Place a market order', d: 'Buy or sell any NSE symbol in whole shares. The order joins a queue and a worker fills it at the live price.', tag: 'Live NSE prices' },
  { k: '04', t: 'Watch it settle', d: 'The status moves from pending to completed on your screen over a live socket, and your holdings and P/L refresh.', tag: 'Realtime' },
];
export function HowItWorks() {
  return (
    <ScrollStack
      useWindowScroll
      smoothScroll={false}
      itemDistance={90}
      itemStackDistance={28}
      stackPosition="18%"
      itemScale={0.04}
      baseScale={0.86}
      dimAmount={0.12}
      blurAmount={0}
      holdDistance={160}
    >
      {STEPS.map((s, i) => (
        <ScrollStackItem key={s.k} itemClassName={`step-card step-card--${i}`}>
          <div className="step-top">
            <span className="step-k">{s.k}</span>
            <span className="step-tag">{s.tag}</span>
          </div>
          <h3>{s.t}</h3>
          <p>{s.d}</p>
          <StepArt i={i} />
        </ScrollStackItem>
      ))}
    </ScrollStack>
  );
}
function StepArt({ i }) {
  // tiny line drawings, one per step
  const paths = [
    'M10 70h60M20 70V30h40v40M30 30V18h20v12',
    'M8 60c20-30 40 10 64-28M60 32h12v12',
    'M10 60l14-14 12 8 16-22 14 10 16-18',
    'M12 64h56M22 64V44M40 64V32M58 64V20',
  ];
  return (
    <svg className="step-art" viewBox="0 0 90 80" aria-hidden="true">
      <path d={paths[i]} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- Features: MagicBento on a DotGrid ---------- */
const OrdersVisual = () => (
  <div className="bento-orders">
    {[['Pending', 'Queued'], ['Processing', 'Worker 2'], ['Completed', 'Filled'], ['Rejected', 'No funds']].map(([a, b]) => (
      <div key={a}><span>{a}</span><em className={a === 'Completed' ? 'up' : ''}>{b}</em></div>
    ))}
  </div>
);
const LockVisual = () => (
  <ol className="bento-league">
    {[['Order A', 'holds lock'], ['Order B', 'waits'], ['Deposit', 'waits']].map(([n, r], i) => (
      <li key={n} className={i === 0 ? 'me' : ''}><b>{i + 1}</b><span>{n}</span><em>{r}</em></li>
    ))}
  </ol>
);
const SchedulerVisual = () => (
  <div className="bento-replay">
    <span className="rp-date">Priority · FCFS · Round robin</span>
    <div className="rp-bar"><i /><i /><i /><i /><i className="hide" /><i className="hide" /><i className="hide" /></div>
    <span className="rp-hint">1 pick in 3 goes round robin</span>
  </div>
);
export function Features() {
  const items = [
    { title: 'Live paper portfolio', description: 'Holdings valued at live prices, measured against the Nifty 50.', visual: 'analytics', colSpan: 2, rowSpan: 2 },
    { title: 'Order lifecycle', description: 'Every order shows where it is, and why.', visual: <OrdersVisual /> },
    { title: 'Per-user lock', description: 'One wallet change at a time, never two.', visual: <LockVisual /> },
    { title: 'Fair scheduler', description: 'Priority with aging, so nobody waits forever.', visual: <SchedulerVisual />, colSpan: 2 },
  ];
  return (
    <MagicBento
      items={items}
      columns={4}
      rowHeight={210}
      gap={14}
      radius={22}
      theme="light"
      glowColor="31, 158, 110"
      enableBorderGlow
      enableSpotlight
      spotlightRadius={320}
      enableStars
      particleCount={14}
      enableTilt={false}
      enableMagnetism
      clickEffect
    />
  );
}
export function Dots() {
  return (
    <DotGrid
      dotSize={4}
      gap={22}
      baseColor="#d6cfbd"
      activeColor={MINT}
      proximity={130}
      shockRadius={260}
      shockStrength={4}
      glow={0.2}
      fade={0.35}
    />
  );
}

/* ---------- Risk calculator: ElasticSlider + Counter ---------- */
export function RiskCalc() {
  const [risk, setRisk] = useState(1);
  const account = 100000; // ₹1,00,000 practice wallet
  const perTrade = (account * risk) / 100;
  const streak = Math.floor(Math.log(0.5) / Math.log(1 - risk / 100));
  return (
    <div className="risk">
      <div className="risk-controls">
        <label className="risk-label" id="risk-label">Risk per trade</label>
        <ElasticSlider
          defaultValue={1}
          startingValue={0.5}
          maxValue={10}
          isStepped
          stepSize={0.5}
          onChange={(v) => setRisk(Math.max(0.5, Number(v) || 0.5))}
          leftIcon={<span className="risk-icon">0.5%</span>}
          rightIcon={<span className="risk-icon">10%</span>}
          formatValue={(v) => `${Number(v).toFixed(1)}%`}
          rangeColor={MINT}
          thumbColor="#ffffff"
          ariaLabel="Risk per trade, percent of account"
        />
      </div>
      <div className="risk-out">
        <div>
          <span className="risk-k">Max loss per trade</span>
          <Counter value={perTrade} prefix="₹" decimals={0} fontSize={56} fontWeight={800} textColor={INK} />
        </div>
        <div>
          <span className="risk-k">Losing trades in a row to halve the account</span>
          <Counter value={streak} decimals={0} fontSize={56} fontWeight={800} textColor={risk > 4 ? '#d9472b' : MINT} />
        </div>
      </div>
    </div>
  );
}

/* ---------- App preview: CardSwap ---------- */
// Auto flip: the next card comes forward every 1 s on its own (delay 1000; the
// component floors it at 400 ms). speed 2.2 makes each swap settle inside that
// second; at speed 1 a swap outlasts a short delay and the cards pile up.
// pauseOnHover lets a visitor stop the deck to read a card.
export function AppPreview() {
  const [w, setW] = useState(() => Math.min(440, window.innerWidth - 48));
  useEffect(() => {
    const on = () => setW(Math.min(440, window.innerWidth - 48));
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return (
    <CardSwap width={w} height={Math.round(w * 0.72)} cardDistance={46} verticalDistance={54} delay={1000} speed={2.2} theme="light" pauseOnHover>
      <Card className="pv-card">
        <div className="pv-head"><span>Wallet</span><em>Example</em></div>
        <div className="pv-big">₹1,00,000.00</div>
        <div className="pv-sub">Available · ₹0.00 reserved</div>
        <svg viewBox="0 0 300 80" className="pv-spark" aria-hidden="true"><path d="M0 62 30 58 55 64 80 50 105 54 130 40 160 44 185 30 210 34 240 20 270 24 300 8" fill="none" stroke={MINT} strokeWidth="3" strokeLinejoin="round" /></svg>
      </Card>
      <Card className="pv-card">
        <div className="pv-head"><span>Order ticket</span><em>Market</em></div>
        <div className="pv-row"><b>TCS.NS</b><span>Buy · Market</span></div>
        <div className="pv-row"><span>Qty 10</span><span>at live price</span></div>
        <div className="pv-btn">Place paper order</div>
      </Card>
      <Card className="pv-card">
        <div className="pv-head"><span>Order status</span><em>Live</em></div>
        <ol className="pv-board"><li><b>1</b> Pending <em>queued</em></li><li className="me"><b>2</b> Processing <em>worker</em></li><li><b>3</b> Completed <em>filled</em></li></ol>
      </Card>
      <Card className="pv-card">
        <div className="pv-head"><span>Holdings</span><em>Example</em></div>
        <div className="pv-lesson">INFY · 12 shares, valued at the live price, with your P/L beside it.</div>
        <div className="pv-progress"><i /></div>
      </Card>
    </CardSwap>
  );
}

/* ---------- Final CTA: StarBorder ---------- */
export function FinalCta({ href = '#', label = 'Get started →' }) {
  return (
    <StarBorder
      as="a"
      href={href}
      className="final-star"
      theme="light"
      color={MINT}
      trailColor="#3ddc97"
      duration={3.2}
      thickness={1.6}
      radius={999}
      stars={2}
      glow={0.5}
      backgroundColor={INK}
      textColor="#f4f1ea"
    >
      {label}
    </StarBorder>
  );
}

/* ---------- Footer wordmark: VariableProximity (Fraunces is a variable font) ---------- */
export function Wordmark({ label = 'Brand' }) {
  const ref = useRef(null);
  return (
    <div ref={ref} className="wordmark-wrap">
      <VariableProximity
        label={label}
        className="wordmark"
        containerRef={ref}
        fromFontVariationSettings="'wght' 300, 'SOFT' 0, 'opsz' 144"
        toFontVariationSettings="'wght' 900, 'SOFT' 100, 'opsz' 144"
        radius={220}
        falloff="gaussian"
        smoothing={0.18}
        fromColor="#141414"
        toColor={MINT}
      />
    </div>
  );
}
