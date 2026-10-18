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
  { k: '01', t: 'Make room to practise.', d: 'Create a free account and start with ₹1,00,000 in virtual funds. Your real money stays out of it.', tag: 'Your account' },
  { k: '02', t: 'Find your focus.', d: 'Explore NSE stocks, study price charts and save the names you want to follow to your watchlist.', tag: 'Your watchlist' },
  { k: '03', t: 'Put an idea to work.', d: 'Choose a stock and a quantity, then practise buying or selling with a simulated market trade.', tag: 'Your first trade' },
  { k: '04', t: 'Review your results.', d: 'Track profit and loss, compare your holdings with the Nifty 50 and review past trades. Use what you learn to refine your approach.', tag: 'Your progress' },
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
const WatchlistVisual = () => (
  <div className="practice-visual">
    <span className="preview-note">Watchlist preview</span>
    {[['RELIANCE', 'Reliance Industries'], ['TCS', 'Tata Consultancy'], ['INFY', 'Infosys']].map(([symbol, name]) => (
      <div className="practice-row" key={symbol}><b>{symbol}</b><span>{name}</span></div>
    ))}
  </div>
);
const PortfolioVisual = () => (
  <div className="practice-visual portfolio-preview">
    <span className="preview-note">Illustrative portfolio</span>
    <div className="portfolio-total">₹1,02,450<span>Holdings value</span></div>
    <div className="practice-row"><span>Invested</span><b>₹1,00,000</b></div>
    <div className="practice-row"><span>Unrealised P/L</span><b className="preview-gain">+₹2,450</b></div>
    <div className="practice-row"><span>Return on holdings</span><b className="preview-gain">+2.45%</b></div>
    <p className="preview-note">Track each position alongside your total.</p>
  </div>
);
const ChartVisual = () => (
  <div className="practice-visual">
    <span className="preview-note">Price history</span>
    <div className="chart-ranges"><span>1D</span><span>1W</span><span>1M</span><span>1Y</span></div>
    <p className="preview-note">Candlesticks and volume</p>
  </div>
);
const ReviewVisual = () => (
  <div className="practice-visual">
    <div className="practice-row"><b>Performance</b><span>Nifty 50 comparison</span></div>
    <div className="practice-row"><b>Allocation</b><span>Position concentration</span></div>
    <div className="practice-row"><b>Cash buffer</b><span>Room for your next trade</span></div>
  </div>
);
export function Features() {
  const items = [
    { title: 'Know where you stand.', description: 'See your holdings, invested value and unrealised profit or loss together.', visual: <PortfolioVisual />, colSpan: 2, rowSpan: 2 },
    { title: 'A watchlist of your own.', description: 'Keep the stocks you follow within reach.', visual: <WatchlistVisual /> },
    { title: 'Put price in context.', description: 'Explore four chart ranges, from one day to one year.', visual: <ChartVisual /> },
    { title: 'Make time to review.', description: 'Look beyond a single trade with portfolio analytics and a Nifty 50 comparison.', visual: <ReviewVisual />, colSpan: 2 },
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
        <label className="risk-label" id="risk-label">Hypothetical loss per trade</label>
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
          ariaLabel="Hypothetical loss per trade, percent of account"
        />
      </div>
      <div className="risk-out">
        <div>
          <span className="risk-k">Hypothetical loss per trade</span>
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
        <div className="pv-head"><span>Watchlist</span><em>Preview</em></div>
        <div className="pv-row"><b>RELIANCE</b><span>Reliance Industries</span></div>
        <div className="pv-row"><b>TCS</b><span>Tata Consultancy</span></div>
        <div className="pv-row"><b>INFY</b><span>Infosys</span></div>
      </Card>
      <Card className="pv-card">
        <div className="pv-head"><span>Portfolio</span><em>Example</em></div>
        <div className="pv-big">₹1,02,450</div>
        <div className="pv-row"><span>Invested</span><b>₹1,00,000</b></div>
        <div className="pv-row"><span>Unrealised P/L</span><b className="preview-gain">+₹2,450</b></div>
      </Card>
      <Card className="pv-card">
        <div className="pv-head"><span>Analytics</span><em>Preview</em></div>
        <div className="pv-lesson">Returns. Allocation. Perspective.</div>
        <div className="pv-sub">Review your holdings against the Nifty 50 and see how your capital is allocated.</div>
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
