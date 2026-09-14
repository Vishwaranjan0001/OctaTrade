import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { SectionIndex } from "../ui/Panel.jsx";
import { octagonVertices } from "../scene/geometry.js";

/*
  SCROLLYTELLING — three stages, one transforming object.
  ------------------------------------------------------------------
  The brief requires the active visual to TRANSFORM between stages rather than
  showing three separate cards. So this is a single SVG composition whose parts
  are driven continuously by scroll progress:

    stage 1 (search)   the octagon is whole, with a reticle and a scanning line
                       locking onto a symbol
    stage 2 (order)    the octagon splits along its vertical axis into a buy and
                       a sell half, a quantity bar fills, and a reserve arc
                       sweeps as funds are held
    stage 3 (review)   the same octagon divides into eight allocation wedges that
                       spread apart, while an order-lifecycle rail completes

  Every parameter is a motion value derived from scrollYProgress, so the object
  is genuinely mid-transformation between stages. React state is written only
  when the stage index crosses a boundary — never per frame.
*/

const STAGES = [
  {
    index: "01",
    title: "Find and understand a security",
    body:
      "Enter a symbol and OctaTrade resolves it against the live market, returning the last traded price and its currency. Nothing is cached and no placeholder price is ever shown — if the feed cannot answer, the interface says so.",
    caption: "Symbol resolved · latest quote"
  },
  {
    index: "02",
    title: "Review and place a paper order",
    body:
      "Choose a side and a quantity. The ticket prices the order from the live quote, checks it against your actual buying power or holdings, and shows the balance you would be left with — then asks you to confirm before anything is sent.",
    caption: "Order reviewed · funds reserved"
  },
  {
    index: "03",
    title: "Review holdings, orders and allocation",
    body:
      "Once the order settles, the position appears with its average cost, the wallet ledger records the movement, and allocation updates. The whole chain is inspectable, from the order record to the paise that moved.",
    caption: "Position formed · allocation updated"
  }
];

/** Octagon geometry shared by every stage of the visual. */
const RADIUS = 118;
const VERTICES = octagonVertices(RADIUS);
const CENTRE = 160;

const polygonPoints = VERTICES.map(([x, y]) => `${(CENTRE + x).toFixed(2)},${(CENTRE + y).toFixed(2)}`).join(" ");

/* One wedge per octagon side, with the outward normal it spreads along. */
const WEDGES = VERTICES.map((vertex, index) => {
  const next = VERTICES[(index + 1) % VERTICES.length];
  const midX = (vertex[0] + next[0]) / 2;
  const midY = (vertex[1] + next[1]) / 2;
  const length = Math.hypot(midX, midY) || 1;

  return {
    index,
    points: [
      `${CENTRE},${CENTRE}`,
      `${(CENTRE + vertex[0]).toFixed(2)},${(CENTRE + vertex[1]).toFixed(2)}`,
      `${(CENTRE + next[0]).toFixed(2)},${(CENTRE + next[1]).toFixed(2)}`
    ].join(" "),
    dirX: midX / length,
    dirY: midY / length
  };
});

/**
 * Scrolly — the three-stage sequence.
 * Input  : none.
 * Output : the scrollytelling section.
 */
export function Scrolly() {
  const sectionRef = useRef(null);
  const [stage, setStage] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });

  /* Stage index is committed to state only when it changes, so the copy
     swap costs one render per boundary instead of one per frame. */
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = value < 0.34 ? 0 : value < 0.67 ? 1 : 2;
    setStage((current) => (current === next ? current : next));
  });

  /* ---- Continuous transform parameters ---- */

  /* The whole object turns slowly through the sequence, tying the stages
     together as one movement. */
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 45]);
  const objectScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1.04, 0.98]);

  /* Stage 1: reticle and scan line. */
  const reticleOpacity = useTransform(scrollYProgress, [0, 0.08, 0.28], [1, 1, 0]);
  const scanY = useTransform(scrollYProgress, [0, 0.3], [CENTRE - RADIUS, CENTRE + RADIUS]);
  const scanOpacity = useTransform(scrollYProgress, [0, 0.06, 0.26, 0.3], [0, 0.9, 0.9, 0]);

  /* Stage 2: the octagon splits into buy and sell halves. */
  const splitGap = useTransform(scrollYProgress, [0.28, 0.48, 0.64, 0.72], [0, 24, 24, 0]);
  const splitNegative = useTransform(splitGap, (value) => -value);
  const ticketOpacity = useTransform(scrollYProgress, [0.3, 0.42, 0.6, 0.68], [0, 1, 1, 0]);
  /* The quantity bar fills, then the reserve arc sweeps. */
  const quantityFill = useTransform(scrollYProgress, [0.36, 0.54], [0, 1]);
  const reserveSweep = useTransform(scrollYProgress, [0.44, 0.62], [0, 1]);

  /* Stage 3: wedges spread into allocation, lifecycle rail completes. */
  const wedgeSpread = useTransform(scrollYProgress, [0.64, 0.86], [0, 1]);
  const wedgeOpacity = useTransform(scrollYProgress, [0.62, 0.72], [0, 1]);
  const shellOpacity = useTransform(scrollYProgress, [0.6, 0.74], [1, 0.18]);
  const railProgress = useTransform(scrollYProgress, [0.7, 0.96], [0, 1]);

  /* Derived SVG values. */
  const quantityWidth = useTransform(quantityFill, (value) => `${(value * 100).toFixed(1)}%`);
  const reserveDash = useTransform(reserveSweep, (value) => `${(value * 300).toFixed(1)} 300`);
  const railHeight = useTransform(railProgress, (value) => `${(value * 100).toFixed(1)}%`);
  const reserveWidth = useTransform(reserveSweep, (value) => `${(value * 100).toFixed(1)}%`);

  return (
    <section className="ot-section ot-scrolly" id="workflow" ref={sectionRef}>
      <div className="ot-shell">
        <SectionIndex index="04" title="Workflow" />
        <div className="ot-scrolly__intro">
          <h2 className="ot-h2 ot-display">From a symbol to a settled position.</h2>
          <p className="ot-lede">
            Three steps, and the same object carries you through all of them.
          </p>
        </div>
      </div>

      {/* The pinned stage. Sticky, not fixed: a fixed layer this large is a
          common cause of scroll jank. */}
      <div className="ot-scrolly__stage">
        <div className="ot-shell ot-scrolly__layout">
          {/* Stage rail */}
          <ol className="ot-scrolly__rail" aria-hidden="true">
            {STAGES.map((entry, index) => (
              <li
                className={`ot-scrolly__rail-item ${index === stage ? "is-active" : ""} ${index < stage ? "is-past" : ""}`}
                key={entry.index}
              >
                <span className="ot-mono">{entry.index}</span>
              </li>
            ))}
          </ol>

          {/* Copy column. Only the active stage is in the accessibility tree,
              and the change is announced politely. */}
          <div className="ot-scrolly__copy" aria-live="polite">
            {STAGES.map((entry, index) => (
              <div
                className={`ot-scrolly__copy-block ${index === stage ? "is-active" : ""}`}
                key={entry.index}
                aria-hidden={index === stage ? undefined : "true"}
              >
                <p className="ot-label ot-scrolly__step">Step {entry.index}</p>
                <h3 className="ot-h3">{entry.title}</h3>
                <p className="ot-prose">{entry.body}</p>
                <p className="ot-scrolly__caption ot-mono">{entry.caption}</p>
              </div>
            ))}
          </div>

          {/* The transforming object. */}
          <div className="ot-scrolly__visual">
            <motion.svg
              viewBox="0 0 320 320"
              className="ot-scrolly__svg"
              style={{ scale: objectScale }}
              role="img"
              aria-label={`Diagram illustrating step ${STAGES[stage].index}: ${STAGES[stage].title}`}
            >
              {/* Coordinate frame */}
              <g opacity="0.13" aria-hidden="true">
                <line x1={CENTRE} y1="14" x2={CENTRE} y2="306" stroke="currentColor" />
                <line x1="14" y1={CENTRE} x2="306" y2={CENTRE} stroke="currentColor" />
              </g>

              <motion.g style={{ rotate, originX: "160px", originY: "160px" }}>
                {/* Stage 3 — allocation wedges. Each spreads along its own
                    outward normal, so the octagon opens like a fan. */}
                <motion.g style={{ opacity: wedgeOpacity }}>
                  {WEDGES.map((wedge) => (
                    <WedgeShape key={wedge.index} wedge={wedge} spread={wedgeSpread} />
                  ))}
                </motion.g>

                {/* The shell: whole in stages 1-2, faded once it becomes wedges. */}
                <motion.g style={{ opacity: shellOpacity }}>
                  {/* Split halves: translate in opposite directions. */}
                  <motion.g style={{ x: splitNegative }}>
                    <polygon
                      points={polygonPoints}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      opacity="0.5"
                      clipPath="url(#ot-clip-left)"
                    />
                  </motion.g>
                  <motion.g style={{ x: splitGap }}>
                    <polygon
                      points={polygonPoints}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      opacity="0.5"
                      clipPath="url(#ot-clip-right)"
                    />
                  </motion.g>

                  {/* Inner ring, always present: the constant in the composition. */}
                  <polygon
                    points={octagonVertices(RADIUS * 0.52)
                      .map(([x, y]) => `${(CENTRE + x).toFixed(2)},${(CENTRE + y).toFixed(2)}`)
                      .join(" ")}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.2"
                    opacity="0.75"
                  />
                </motion.g>

                {/* Reserve arc: sweeps as funds are held against the order. */}
                <motion.circle
                  cx={CENTRE}
                  cy={CENTRE}
                  r={RADIUS * 0.78}
                  fill="none"
                  stroke="var(--reserved)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  style={{ strokeDasharray: reserveDash, opacity: ticketOpacity }}
                  transform={`rotate(-90 ${CENTRE} ${CENTRE})`}
                />
              </motion.g>

              {/* Clip paths for the split halves. */}
              <defs>
                <clipPath id="ot-clip-left">
                  <rect x="0" y="0" width={CENTRE} height="320" />
                </clipPath>
                <clipPath id="ot-clip-right">
                  <rect x={CENTRE} y="0" width={CENTRE} height="320" />
                </clipPath>
              </defs>

              {/* Stage 1 — reticle and scanning line. */}
              <motion.g style={{ opacity: reticleOpacity }}>
                <rect
                  x={CENTRE - 46}
                  y={CENTRE - 17}
                  width="92"
                  height="34"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1"
                  opacity="0.7"
                />
                {[
                  [CENTRE - 46, CENTRE - 17, 1, 1],
                  [CENTRE + 46, CENTRE - 17, -1, 1],
                  [CENTRE - 46, CENTRE + 17, 1, -1],
                  [CENTRE + 46, CENTRE + 17, -1, -1]
                ].map(([x, y, sx, sy]) => (
                  <path
                    key={`${x}-${y}`}
                    d={`M ${x} ${y + sy * 9} L ${x} ${y} L ${x + sx * 9} ${y}`}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2"
                  />
                ))}
              </motion.g>

              <motion.line
                x1={CENTRE - RADIUS}
                x2={CENTRE + RADIUS}
                stroke="var(--cyan-300)"
                strokeWidth="1.4"
                style={{ y: scanY, opacity: scanOpacity }}
                y1="0"
                y2="0"
              />

              {/* The core: present in every stage. */}
              <polygon
                points={`${CENTRE},${CENTRE - 13} ${CENTRE + 13},${CENTRE} ${CENTRE},${CENTRE + 13} ${CENTRE - 13},${CENTRE}`}
                fill="var(--accent)"
              />
            </motion.svg>

            {/* Stage 2 readout: quantity bar and reserve, in the terminal voice. */}
            <motion.div className="ot-scrolly__readout" style={{ opacity: ticketOpacity }}>
              <div className="ot-scrolly__readout-row">
                <span className="ot-label">Quantity</span>
                <div className="ot-scrolly__bar">
                  <motion.span className="ot-scrolly__bar-fill" style={{ width: quantityWidth }} />
                </div>
              </div>
              <div className="ot-scrolly__readout-row">
                <span className="ot-label">Funds reserved</span>
                <div className="ot-scrolly__bar">
                  <motion.span
                    className="ot-scrolly__bar-fill is-reserved"
                    style={{ width: reserveWidth }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Stage 3 readout: the lifecycle rail completing. */}
            <div className="ot-scrolly__lifecycle" aria-hidden="true">
              <div className="ot-scrolly__lifecycle-track">
                <motion.span className="ot-scrolly__lifecycle-fill" style={{ height: railHeight }} />
              </div>
              <ul className="ot-scrolly__lifecycle-labels">
                <li className="ot-label">Accepted</li>
                <li className="ot-label">Reserved</li>
                <li className="ot-label">Filled</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * WedgeShape — one allocation wedge.
 *
 * Purpose : isolate the per-wedge transform so each of the eight pieces can
 *           spread along its own outward normal from one shared progress value.
 * Input   : wedge (geometry + direction), spread (motion value 0..1).
 * Output  : an animated <polygon>.
 */
function WedgeShape({ wedge, spread }) {
  const distance = 26;
  const x = useTransform(spread, (value) => value * wedge.dirX * distance);
  const y = useTransform(spread, (value) => value * wedge.dirY * distance);

  /* Alternating emphasis so adjacent wedges stay distinguishable, echoing the
     allocation palette used by the real charts. */
  const isAccent = wedge.index % 3 === 0;

  return (
    <motion.polygon
      points={wedge.points}
      style={{ x, y }}
      fill={isAccent ? "var(--accent)" : "var(--steel-400)"}
      fillOpacity={isAccent ? 0.3 : 0.19}
      stroke={isAccent ? "var(--accent)" : "var(--steel-300)"}
      strokeWidth="1"
      strokeOpacity="0.6"
    />
  );
}
