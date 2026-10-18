import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries' }, { symbol: 'TCS', name: 'Tata Consultancy Services' },
  { symbol: 'INFY', name: 'Infosys' }, { symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { symbol: 'ITC', name: 'ITC' }, { symbol: 'WIPRO', name: 'Wipro' },
];
const RANGES = [
  { label: '1D', title: 'The day, in detail.', text: 'Follow intraday price moves and trading volume.' },
  { label: '1W', title: 'A week of perspective.', text: 'Review the week’s price action before your next decision.' },
  { label: '1M', title: 'Put recent moves in context.', text: 'Explore a month of price history, beyond the latest quote.' },
  { label: '1Y', title: 'Step back. See more.', text: 'Zoom out to a full year of price history.' },
];
const Arrow = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
function FeatureLink({ href, children, className = '' }) { return <a className={`feature-link ${className}`} href={href}>{children}<Arrow /></a>; }

function WatchlistFeature() {
  const [selected, setSelected] = useState(['RELIANCE', 'TCS']);
  const reduceMotion = useReducedMotion();
  const toggle = (symbol) => setSelected((list) => list.includes(symbol) ? list.filter((item) => item !== symbol) : [...list, symbol]);
  return (
    <article className="watchlist-feature">
      <h3>Keep your favourites close.</h3>
      <p>Build a watchlist around the NSE stocks you want to follow.</p>
      <div className="stock-picker" role="group" aria-label="Try a watchlist preview">
        {STOCKS.map((stock) => {
          const saved = selected.includes(stock.symbol);
          return <button type="button" key={stock.symbol} title={stock.name} aria-label={`${saved ? 'Remove' : 'Add'} ${stock.name} ${saved ? 'from' : 'to'} preview watchlist`} aria-pressed={saved} onClick={() => toggle(stock.symbol)}>
            <span>{stock.symbol}</span><svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              {saved ? <motion.path key="check" d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" initial={reduceMotion ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.18 }} /> : <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
            </svg>
          </button>;
        })}
      </div>
      <p className="feature-preview-note" aria-live="polite">Watchlist preview · {selected.length ? `${selected.length} ${selected.length === 1 ? 'stock' : 'stocks'} selected` : 'Choose a stock to start'}</p>
      <FeatureLink href="app.html#watchlist">Build your watchlist</FeatureLink>
    </article>
  );
}

function TimeframeFeature() {
  const [active, setActive] = useState(0);
  const buttons = useRef([]);
  const reduceMotion = useReducedMotion();
  const range = RANGES[active];
  const navigate = (event, index) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % RANGES.length;
    else if (event.key === 'ArrowLeft') next = (index + RANGES.length - 1) % RANGES.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = RANGES.length - 1;
    else return;
    event.preventDefault(); setActive(next); buttons.current[next]?.focus();
  };
  return (
    <article className="timeframe-feature">
      <h3>See beyond today.</h3>
      <p>Four chart timeframes. More context for your next idea.</p>
      <div className="timeframe-picker" role="tablist" aria-label="Explore chart timeframes">
        {RANGES.map((item, index) => <button key={item.label} ref={(node) => { buttons.current[index] = node; }} id={`feature-range-${item.label}`} type="button" role="tab" aria-selected={active === index} aria-controls="feature-range-detail" tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={(event) => navigate(event, index)}>
          {active === index && <motion.span className="timeframe-selection" layoutId="feature-timeframe-selection" transition={{ duration: reduceMotion ? 0 : 0.2 }} />}
          <span>{item.label}</span>
        </button>)}
      </div>
      <div id="feature-range-detail" className="timeframe-detail" role="tabpanel" aria-labelledby={`feature-range-${range.label}`}>
        <b>{range.title}</b><p>{range.text}</p>
      </div>
      <FeatureLink href="app.html#trade">Explore the charts</FeatureLink>
    </article>
  );
}

export default function FeatureTour() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="practice-features">
      <div className="practice-feature-grid">
        <article className="capital-feature">
          <div className="capital-copy">
            <h3>Space to experiment.</h3>
            <div className="practice-capital">₹1,00,000</div>
            <p className="capital-caption">Your virtual starting balance.</p>
            <p>Try an idea. Change your approach. Practise with virtual funds before putting real money on the line.</p>
          </div>
          <motion.img className="capital-art" src="images/feature-practice-capital.webp" alt="An emerald octagonal vault holding paper tokens, an illustration of virtual practice capital" width="1536" height="1024" loading="lazy" initial={reduceMotion ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} />
          <div className="capital-action"><FeatureLink href="app.html">Start practising</FeatureLink><span>Virtual funds only</span></div>
        </article>
        <div className="feature-side"><WatchlistFeature /><TimeframeFeature /></div>
      </div>
      <article className="review-feature">
        <h3>Keep the lesson.</h3>
        <div className="review-feature-links">
          <a href="app.html#portfolio"><span>Track your holdings<Arrow /></span><p>See invested value and unrealised profit or loss.</p></a>
          <a href="app.html#analytics"><span>Know your exposure<Arrow /></span><p>Review allocation and compare with the Nifty 50.</p></a>
          <a href="app.html#orders"><span>Look back. Learn more.<Arrow /></span><p>Revisit your simulated buys, sells and trade details.</p></a>
        </div>
      </article>
    </div>
  );
}
