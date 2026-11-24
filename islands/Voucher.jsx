// "Virtual rupees" section: a practice-funds voucher you can tear off (React Bits TearTicket).
// It tilts with the cursor; dragging the green stub tears it away and claims the funds.
// The amount (React Bits Counter) rolls up the first time the section is on screen.
import { useEffect, useRef, useState } from 'react';
import TearTicket from './reactbits/TearTicket/TearTicket.jsx';
import Counter from './reactbits/Counter/Counter.jsx';

const START_FUNDS = 100000;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Banknote-style guilloché: a band of interlaced sine waves drawn behind the amount.
function Guilloche() {
  const W = 330;
  const H = 230;
  const lines = [];
  for (let k = 0; k < 9; k += 1) {
    const amp = 10 + k * 2.2;
    const phase = k * 0.7;
    let d = '';
    for (let x = 0; x <= W; x += 6) {
      const y = H * 0.55 + Math.sin(x / 26 + phase) * amp + Math.sin(x / 61 - phase) * 6;
      d += `${x === 0 ? 'M' : 'L'}${x},${y.toFixed(1)} `;
    }
    lines.push(<path key={k} d={d} />);
  }
  return (
    <svg className="vc-guilloche" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      {lines}
    </svg>
  );
}

function useSectionActive(ref) {
  const [active, setActive] = useState(reduce);
  useEffect(() => {
    if (active) return;
    const section = ref.current && ref.current.closest('.scroll-section');
    if (!section) return;
    const check = () => {
      if (section.classList.contains('is-active')) setActive(true);
    };
    const watch = new MutationObserver(check);
    watch.observe(section, { attributes: true, attributeFilter: ['class'] });
    check();
    return () => watch.disconnect();
  }, [active, ref]);
  return active;
}

export default function Voucher() {
  const ref = useRef(null);
  const seen = useSectionActive(ref);
  const [claimed, setClaimed] = useState(false);

  const stub = (
    <div className="vc-stub">
      <span className="vc-stub-text">{claimed ? 'Claimed' : 'Tear to claim'}</span>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M3 9h11m0 0-4-4m4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );

  return (
    <div ref={ref} className={`voucher${claimed ? ' is-claimed' : ''}`}>
      <TearTicket
        width={470}
        height={232}
        stubSize={124}
        radius={14}
        holes={11}
        holeSize={5}
        roughness={1.2}
        rotate={-3}
        tiltMax={10}
        tiltReach={320}
        background="#141414"
        stubBackground="#1f9e6e"
        color="#f4f1e8"
        borderColor="rgba(244, 241, 232, 0.14)"
        onTear={() => setClaimed(true)}
        ariaLabel="Tear off the stub to claim ₹1,00,000 in practice funds"
        stub={stub}
      >
        <div className="vc-body">
          <Guilloche />
          <span className="vc-watermark" aria-hidden="true">₹</span>
          <div className="vc-top">
            <span className="vc-brand">OctaTrade</span>
            <span>Practice funds</span>
          </div>
          <div className="vc-amount">
            <Counter
              value={seen ? START_FUNDS : 0}
              locale="en-IN"
              decimals={0}
              prefix="₹"
              fontSize={50}
              duration={1.1}
              stagger={0.05}
              intro={false}
              motionBlur={!reduce}
            />
          </div>
          <p className="vc-note">
            {claimed ? (
              <a href="app.html">Open your trading desk</a>
            ) : (
              'Not real money. Real NSE prices.'
            )}
          </p>
          <span className="vc-stamp" aria-hidden={!claimed}>Claimed</span>
        </div>
      </TearTicket>
    </div>
  );
}
