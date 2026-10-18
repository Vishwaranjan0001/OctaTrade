import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import CircularCarousel from './reactbits/CircularCarousel/CircularCarousel.jsx';

const SCREENS = [
  { id: 'markets', title: 'Market watch', subtitle: 'Stock search and watchlists', heading: 'Build your market watchlist.', description: 'Find NSE stocks by symbol, save the names you want to follow and check their latest available quotes in one place.', href: 'app.html#markets', action: 'Explore markets', alt: 'OctaTrade market watch with stock search and saved NSE securities' },
  { id: 'research', title: 'Stock research', subtitle: 'Price history and stock details', heading: 'Get context before you trade.', description: 'Open a stock to explore its price history, review key quote details and move to a practice trade when you are ready.', href: 'app.html#stock/TCS.NS', action: 'Explore a stock', alt: 'OctaTrade stock detail screen with a TCS price history chart' },
  { id: 'trading', title: 'Paper trading', subtitle: 'A place to practise your strategy', heading: 'Put your trading ideas to work.', description: 'Start with ₹1,00,000 in virtual funds. Choose your position size and practise buying or selling whole shares with a simulated market trade.', href: 'app.html#trade', action: 'Start paper trading', alt: 'OctaTrade paper trading terminal with candlesticks and volume' },
  { id: 'portfolio', title: 'Your portfolio', subtitle: 'Holdings and profit and loss', heading: 'Keep your holdings in view.', description: 'See what you own, how much you invested and the current value of each position. Review your unrealised profit or loss as your portfolio changes.', href: 'app.html#portfolio', action: 'View your portfolio', alt: 'OctaTrade portfolio showing current holdings and profit and loss' },
  { id: 'analytics', title: 'Portfolio analytics', subtitle: 'Returns, allocation and exposure', heading: 'Understand your portfolio.', description: 'Compare your holdings with the Nifty 50, review concentrated positions and track the cash available for future trades.', href: 'app.html#analytics', action: 'Explore analytics', alt: 'OctaTrade analytics showing a benchmark comparison and allocation' },
  { id: 'history', title: 'Trade history', subtitle: 'Every practice trade, recorded', heading: 'Review the decisions you made.', description: 'Find your simulated buys and sells, filter by trade status and open the details of a trade. Keep a clear record of your practice.', href: 'app.html#orders', action: 'View trade history', alt: 'OctaTrade trade history with buy and sell records and status filters' },
];
const ITEMS = SCREENS.map((screen) => ({ ...screen, src: `images/tour/${screen.id}-desktop.jpg` }));
const Arrow = ({ reverse = false }) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={reverse ? { transform: 'rotate(180deg)' } : undefined}><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;

export default function FeatureTour() {
  const carousel = useRef(null);
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(true);
  const reduceMotion = useReducedMotion();
  const screen = SCREENS[selected];
  const rotating = playing && !reduceMotion;
  const choose = (index) => { setPlaying(false); carousel.current?.goTo(index); };
  const move = (direction) => { setPlaying(false); carousel.current?.[direction](); };

  return (
    <div className="feature-carousel">
      <div className="workspace-carousel"
        onPointerDownCapture={() => setPlaying(false)}
        onKeyDownCapture={() => setPlaying(false)}
        onWheelCapture={(event) => { if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) setPlaying(false); }}>
        <CircularCarousel ref={carousel} items={ITEMS} preset="cylinder" intro="rise"
          cardWidth={520} aspectRatio={1.42} gap={42} tilt={-8} perspective={2400}
          autoplay={rotating ? 'step' : 'off'} interval={6} speed={10}
          captions={false} fadeColor="#e3ded2" depthFade={0.45} innerShade={0.18}
          cornerRadius={8} parallax={0.12} stretch={0.08} momentum={0.25}
          onChange={setSelected} ariaLabel="Explore six OctaTrade screens. Use left and right arrow keys to browse." />
      </div>
      <div className="carousel-toolbar">
        <p>Drag to explore, or choose a screen below.</p>
        <div className="carousel-controls" role="group" aria-label="Carousel controls">
          <button type="button" onClick={() => move('previous')} aria-label="Previous screen"><Arrow reverse /></button>
          <button className="carousel-play" type="button" disabled={!!reduceMotion}
            onClick={() => setPlaying((value) => !value)}
            aria-label={reduceMotion ? 'Automatic rotation disabled by reduced motion preference' : rotating ? 'Pause rotation' : 'Play rotation'}>
            {rotating ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={() => move('next')} aria-label="Next screen"><Arrow /></button>
        </div>
      </div>
      <div className="carousel-screen-nav" role="group" aria-label="Choose an OctaTrade screen">
        {SCREENS.map((item, index) => <button key={item.id} type="button" aria-pressed={selected === index} onClick={() => choose(index)}>{item.title}</button>)}
      </div>
      <motion.div key={screen.id} className="carousel-details"
        initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <h3>{screen.heading}</h3>
        <div><p>{screen.description}</p><a className="tour-action" href={screen.href}>{screen.action}<Arrow /></a></div>
      </motion.div>
      <p className="tour-caption">Actual OctaTrade screens from a demo account. Balances and trades are examples. Market data may be delayed.</p>
    </div>
  );
}
