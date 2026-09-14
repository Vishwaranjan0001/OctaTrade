import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { KeyRound, Lock, ServerCog, WalletMinimal } from "lucide-react";
import { SectionIndex } from "../ui/Panel.jsx";

/*
  The trust section, and the one deliberate inversion in the page.

  Everything else on the landing page is dark. This section flips to the cold
  "paper" palette, which changes the reading rhythm completely and marks the
  moment the product stops selling and starts explaining. The facts here are all
  verifiable in the codebase — nothing is a claim.
*/
const FACTS = [
  {
    icon: WalletMinimal,
    title: "No real money, by construction",
    body:
      "There is no payment integration and no withdrawal path. Wallet balances are virtual INR created when the account is opened, so there is nothing to lose and nothing to steal."
  },
  {
    icon: Lock,
    title: "Passwords are never stored",
    body:
      "Registration hashes your password with bcrypt before it reaches the database. The plain value is never written to disk and never held in the browser."
  },
  {
    icon: KeyRound,
    title: "Every account endpoint is protected",
    body:
      "Wallet, portfolio and order routes require a bearer token. When a token expires the interface returns you to sign-in instead of showing stale data."
  },
  {
    icon: ServerCog,
    title: "Exact money arithmetic",
    body:
      "Balances and prices are stored as integer paise, not floating-point rupees. Reservations and settlements reconcile to the paisa with no rounding drift."
  }
];

/**
 * Safety — what "paper trading" actually means here.
 *
 * Purpose : answer the two questions a new user has — is my money at risk, and
 *           is my account safe — with specifics rather than reassurance. The
 *           light palette gives the page its strongest rhythm change.
 * Input   : none.
 * Output  : the section.
 */
export function Safety() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    /* data-theme="light" scopes the inverted palette to this section only. */
    <section className="ot-section ot-safety" id="safety" ref={ref} data-theme="light">
      <div className="ot-shell">
        <SectionIndex index="06" title="Paper trading" tone="muted" />

        <div className="ot-safety__top">
          <motion.h2
            className="ot-safety__title ot-display"
            initial={{ opacity: 0, y: 22 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            Simulated positions. Real mechanics. Nothing at stake.
          </motion.h2>

          <p className="ot-safety__lede">
            OctaTrade exists so the first time you misjudge a position size, it
            costs you nothing but the lesson.
          </p>
        </div>

        <div className="ot-safety__grid">
          {FACTS.map((fact, index) => {
            const Icon = fact.icon;
            return (
              <motion.article
                className="ot-safety__item"
                key={fact.title}
                initial={{ opacity: 0, y: 18 }}
                animate={inView ? { opacity: 1, y: 0 } : undefined}
                transition={{
                  duration: 0.55,
                  delay: 0.08 * index,
                  ease: [0.22, 1, 0.36, 1]
                }}
              >
                <span className="ot-safety__icon" aria-hidden="true">
                  <Icon size={17} strokeWidth={1.7} />
                </span>
                <h3 className="ot-h4">{fact.title}</h3>
                <p className="ot-safety__body">{fact.body}</p>
              </motion.article>
            );
          })}
        </div>

        <p className="ot-safety__disclaimer">
          OctaTrade is an educational simulator. It is not a broker, it does not
          execute on any exchange, and nothing in it constitutes investment
          advice. Prices are supplied by a third-party market-data provider and
          may be delayed or unavailable.
        </p>
      </div>
    </section>
  );
}
