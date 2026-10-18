import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const FEATURES = [
  {
    id: 'markets', label: 'Markets', summary: 'Stocks & watchlists',
    title: 'Find your market focus.',
    description: 'Look up NSE stocks and keep the names you follow in a personal watchlist. Open a stock to explore its price history before making a decision.',
    details: ['Search by NSE stock symbol', 'Save and manage your watchlist', 'Open stock details and price charts'],
    href: 'app.html#markets', action: 'Explore markets',
    alt: 'OctaTrade Markets screen with NSE stock search and watchlist quotes',
  },
  {
    id: 'trading', label: 'Paper trading', summary: 'Virtual funds. Real practice.',
    title: 'Try a trade. Keep the lesson.',
    description: 'Start with ₹1,00,000 in virtual funds. Choose a stock and a quantity, practise buying or selling, and follow each simulated trade in your order history.',
    details: ['Market buy and sell trades in whole shares', 'Candlesticks and volume across four timeframes', 'Add virtual funds whenever you need them'],
    href: 'app.html#trade', action: 'Start paper trading',
    alt: 'OctaTrade trading terminal with a TCS price chart and paper trading controls',
  },
  {
    id: 'portfolio', label: 'Portfolio', summary: 'Holdings & profit and loss',
    title: 'See where your money goes.',
    description: 'Keep track of what you own and how it is performing. Your portfolio brings invested value, current holdings and unrealised profit or loss into one view.',
    details: ['Review every holding and its profit or loss', 'Sort positions by value or performance', 'See how your holdings are allocated'],
    href: 'app.html#portfolio', action: 'View your portfolio',
    alt: 'OctaTrade portfolio screen showing holdings, profit and loss, and allocation',
  },
  {
    id: 'analytics', label: 'Analytics', summary: 'Returns & portfolio exposure',
    title: 'Understand your results.',
    description: 'Look beyond individual trades. Compare your holdings with the Nifty 50, review your largest positions and see how much of your account is held in cash.',
    details: ['Review holdings against a Nifty 50 benchmark', 'Identify concentrated positions', 'Track the cash available for future trades'],
    href: 'app.html#analytics', action: 'Explore your analytics',
    alt: 'OctaTrade analytics screen with a Nifty 50 comparison and portfolio concentration',
  },
];

export default function FeatureTour() {
  const [selected, setSelected] = useState(0);
  const tabs = useRef([]);
  const reduceMotion = useReducedMotion();
  const feature = FEATURES[selected];

  function navigate(event, index) {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % FEATURES.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + FEATURES.length) % FEATURES.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = FEATURES.length - 1;
    else return;
    event.preventDefault();
    setSelected(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className="feature-tour">
      <div className="tour-tabs" role="tablist" aria-label="Explore OctaTrade features">
        {FEATURES.map((item, index) => (
          <button
            key={item.id} ref={(node) => { tabs.current[index] = node; }}
            id={`tour-tab-${item.id}`} role="tab" type="button"
            aria-selected={selected === index} aria-controls="tour-panel"
            tabIndex={selected === index ? 0 : -1}
            onClick={() => setSelected(index)} onKeyDown={(event) => navigate(event, index)}
          >
            <span className="tour-tab-name">{item.label}</span>
            <span className="tour-tab-summary">{item.summary}</span>
          </button>
        ))}
      </div>

      <section id="tour-panel" role="tabpanel" aria-labelledby={`tour-tab-${feature.id}`} tabIndex={0} className="tour-panel">
        <motion.div
          key={feature.id} className="tour-content"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <div className="tour-copy">
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
            <ul>{feature.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
            <a className="tour-action" href={feature.href}>{feature.action}<span aria-hidden="true">↗</span></a>
          </div>
          <figure className="tour-preview" data-ui>
            <div className="tour-preview-bar"><span>OctaTrade <span aria-hidden="true">/</span> {feature.label}</span><span>App preview</span></div>
            <picture>
              <source media="(max-width: 600px)" srcSet={`images/tour/${feature.id}-mobile.jpg`} />
              <img src={`images/tour/${feature.id}-desktop.jpg`} alt={feature.alt} width="1136" height="770" loading="lazy" />
            </picture>
          </figure>
        </motion.div>
      </section>
      <p className="tour-caption">Actual OctaTrade screens from a demo account. Balances and trades are examples. Market data may be delayed.</p>
    </div>
  );
}
