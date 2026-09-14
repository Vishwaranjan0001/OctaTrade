import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { SectionIndex } from "../ui/Panel.jsx";

/*
  The platform's surfaces, written as a specification sheet rather than a grid
  of feature cards. Each row names the real endpoint and exactly what it
  returns, so nothing is promised that the API does not provide.
*/
const SPEC = [
  {
    group: "Market data",
    rows: [
      {
        name: "Latest quote",
        endpoint: "GET /api/quotes/:symbol",
        returns: "Symbol, last price, currency",
        note: "Any Yahoo Finance-compatible symbol, including .NS and .BO listings."
      },
      {
        name: "Historical series",
        endpoint: "Not available",
        returns: "—",
        note: "Candles and volume render once a history endpoint is connected.",
        absent: true
      }
    ]
  },
  {
    group: "Account",
    rows: [
      {
        name: "Wallet",
        endpoint: "GET /api/wallet",
        returns: "Available and reserved paise, currency",
        note: "Virtual INR. Opened with a starting balance on registration."
      },
      {
        name: "Deposit",
        endpoint: "POST /api/wallet/deposit",
        returns: "Updated wallet",
        note: "Accepts a positive integer amount in paise."
      },
      {
        name: "Ledger",
        endpoint: "GET /api/wallet/transactions",
        returns: "Deposits, reservations, debits and credits",
        note: "Every movement carries the balances that resulted from it."
      }
    ]
  },
  {
    group: "Trading",
    rows: [
      {
        name: "Place order",
        endpoint: "POST /api/orders",
        returns: "The created order and its status",
        note: "Market buy and sell, validated against buying power and holdings."
      },
      {
        name: "Order blotter",
        endpoint: "GET /api/orders",
        returns: "Every order on the account",
        note: "Status, execution price and settled value."
      },
      {
        name: "Single order",
        endpoint: "GET /api/orders/:orderId",
        returns: "One order in full",
        note: "Used by the lifecycle view."
      }
    ]
  },
  {
    group: "Portfolio",
    rows: [
      {
        name: "Holdings",
        endpoint: "GET /api/portfolio",
        returns: "Quantity and average cost per symbol",
        note: "Market value is derived in the client from live quotes."
      }
    ]
  },
  {
    group: "Identity",
    rows: [
      {
        name: "Register",
        endpoint: "POST /api/auth/register",
        returns: "The created account",
        note: "Passwords are stored only as bcrypt hashes."
      },
      {
        name: "Sign in",
        endpoint: "POST /api/auth/login",
        returns: "Bearer token and user",
        note: "The token authorises every protected endpoint."
      },
      {
        name: "Session",
        endpoint: "GET /api/auth/me",
        returns: "The signed-in account",
        note: "Used to verify a session before the workspace renders."
      }
    ]
  }
];

/**
 * Capability — the platform specification.
 *
 * Purpose : replace the usual feature-icon grid with a dense, readable spec
 *           sheet. It reads like documentation because that is the most
 *           credible way to describe a trading product's surface area.
 * Input   : none.
 * Output  : the capability section.
 */
export function Capability() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <section className="ot-section ot-capability" id="capability" ref={ref}>
      <div className="ot-shell">
        <SectionIndex index="02" title="Capability" />

        <div className="ot-capability__head">
          <h2 className="ot-h2 ot-display">
            Every surface, and precisely what it returns.
          </h2>
          <p className="ot-lede">
            OctaTrade's interface is built directly on these endpoints. Where a
            capability does not exist yet, the product says so rather than
            filling the space.
          </p>
        </div>

        <div className="ot-spec">
          {SPEC.map((group, groupIndex) => (
            <motion.div
              className="ot-spec__group"
              key={group.group}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : undefined}
              transition={{
                duration: 0.55,
                delay: 0.06 * groupIndex,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              <h3 className="ot-spec__group-name ot-label">{group.group}</h3>

              <div className="ot-spec__rows">
                {group.rows.map((row) => (
                  <div
                    className={`ot-spec__row ${row.absent ? "is-absent" : ""}`}
                    key={row.name}
                  >
                    <div className="ot-spec__cell ot-spec__cell--name">
                      <span className="ot-spec__name">{row.name}</span>
                      <code className="ot-spec__endpoint ot-mono">{row.endpoint}</code>
                    </div>
                    <div className="ot-spec__cell ot-spec__cell--returns ot-mono">
                      {row.returns}
                    </div>
                    <div className="ot-spec__cell ot-spec__cell--note">{row.note}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
