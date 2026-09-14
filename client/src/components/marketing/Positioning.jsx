import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Check, Minus } from "lucide-react";
import { SectionIndex } from "../ui/Panel.jsx";

/*
  What the simulator models, and what it deliberately does not.

  A paper-trading product earns trust by being explicit about the edges of its
  simulation. Stating the omissions plainly is more useful — and more honest —
  than a list of feature claims.
*/
const MODELS = [
  "Live last-traded price for any supported symbol",
  "Market order validation against real buying power",
  "Wallet reservation, debit and credit in integer paise",
  "Average-cost position building across repeat buys",
  "Portfolio allocation and unrealised profit or loss",
  "Bearer-token sessions over protected endpoints"
];

const OMITS = [
  "Bid-ask spread, slippage and market impact",
  "Partial fills and order-queue priority",
  "Brokerage, STT, stamp duty and exchange fees",
  "Limit, stop-loss and bracket order types",
  "Corporate actions, dividends and splits",
  "Intraday and historical price series"
];

/**
 * Positioning — what OctaTrade is.
 *
 * Purpose : state the product's purpose in an editorial register, then draw the
 *           boundary of the simulation explicitly. The asymmetric two-column
 *           ledger gives the section a different rhythm from the hero.
 * Input   : none.
 * Output  : the positioning section.
 */
export function Positioning() {
  const ref = useRef(null);
  /* once: true — the reveal happens a single time and never re-triggers on
     scroll direction changes, which is what makes repeated passes feel calm. */
  const inView = useInView(ref, { once: true, margin: "-12% 0px -12% 0px" });

  return (
    <section className="ot-section ot-position" id="positioning" ref={ref}>
      <div className="ot-shell">
        <SectionIndex index="01" title="Positioning" />

        <div className="ot-position__top">
          <motion.h2
            className="ot-position__statement ot-display"
            initial={{ opacity: 0, y: 26 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            A trading account behaves differently once money is committed. The
            point of paper trading is to learn that behaviour
            <em> before</em> it costs anything.
          </motion.h2>

          <motion.div
            className="ot-position__aside"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="ot-prose">
              OctaTrade prices every order from the live market, then settles it
              against a virtual wallet held in integer paise. Balances reserve,
              debit and credit exactly as they would on a real desk, so the
              mechanics you learn here transfer.
            </p>
            <p className="ot-prose">
              It is a simulator, and it says so. The list on the right is the
              honest boundary of what it reproduces.
            </p>
          </motion.div>
        </div>

        {/* The capability ledger: two asymmetric columns divided by a rule. */}
        <div className="ot-ledger">
          <motion.div
            className="ot-ledger__col"
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 className="ot-ledger__head ot-label">What OctaTrade models</h3>
            <ul className="ot-ledger__list">
              {MODELS.map((item) => (
                <li className="ot-ledger__row is-yes" key={item}>
                  <Check size={14} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="ot-ledger__col"
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.6, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 className="ot-ledger__head ot-label">What it does not simulate</h3>
            <ul className="ot-ledger__list">
              {OMITS.map((item) => (
                <li className="ot-ledger__row is-no" key={item}>
                  <Minus size={14} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
