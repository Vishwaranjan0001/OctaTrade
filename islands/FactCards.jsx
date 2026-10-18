// "Good to know": the OctaTrade facts as tilting depth cards (DepthCard.jsx).
// Four cards: one row on desktop, two by two on tablets, a swipeable row on phones. Text lives in facts.js.
import DepthCard from './DepthCard.jsx';
import { FACTS } from './facts.js';

const Octa = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);
const Arrow = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function FactCards() {
  return (
    <div className="fact-tour">
      <ul className="fact-bento" aria-label="Facts about OctaTrade">
        {FACTS.map((f, i) => (
          <DepthCard as="li" key={f.id} className="fact-slot">
            <div className={`fact-face fact-face--${f.theme}`} data-depth="10">
              <span className="fact-orb" aria-hidden="true" />
            </div>
            <div className="fact-top" data-depth="30">
              <span className="fact-label">{f.label}</span>
              <span className="fact-mark"><Octa /></span>
            </div>
            <b className="fact-figure" data-depth="60">{f.figure}</b>
            <p className="fact-text" data-depth="45">{f.text}</p>
            <span className="fact-index" data-depth="20" aria-hidden="true">{String(i + 1).padStart(2, '0')} / {String(FACTS.length).padStart(2, '0')}</span>
          </DepthCard>
        ))}
      </ul>
      <div className="fact-foot">
        <a className="fact-link" href="app.html"><span>Start practising</span><Arrow /></a>
        <p className="fact-hint"><span className="hint-pointer">Move your cursor over a card to tilt it.</span><span className="hint-touch">Swipe to see all four.</span></p>
      </div>
    </div>
  );
}
