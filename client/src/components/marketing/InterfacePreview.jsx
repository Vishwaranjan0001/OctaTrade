import { useState } from "react";
import { motion } from "motion/react";
import { SectionIndex } from "../ui/Panel.jsx";
import { StatusMark, SideMark } from "../ui/Status.jsx";
import { EM_DASH } from "../../lib/format.js";

/*
  An interactive preview of the real interface, built from the same components
  the product uses.

  Rule: no figure is invented. Balance, price and P&L positions carry an em dash
  and are explicitly labelled as loading from the signed-in account. What the
  preview does show truthfully is STRUCTURE — which columns exist, what the
  order lifecycle looks like, how an unavailable chart is presented.
*/

const TABS = [
  { id: "terminal", label: "Terminal", api: "Quotes · Orders · Wallet" },
  { id: "portfolio", label: "Portfolio", api: "Portfolio · Quotes" },
  { id: "ledger", label: "Wallet ledger", api: "Wallet transactions" }
];

/**
 * InterfacePreview — a real, interactive look at the workspace.
 *
 * Purpose : the section a sceptical visitor uses to judge whether the product is
 *           real. Tabs switch between three authentic surface layouts rendered
 *           with the product's own primitives.
 * Input   : none.
 * Output  : the preview section.
 */
export function InterfacePreview() {
  const [tab, setTab] = useState("terminal");

  return (
    <section className="ot-section ot-preview" id="preview">
      <div className="ot-shell">
        <SectionIndex index="05" title="Interface" />

        <div className="ot-preview__head">
          <h2 className="ot-h2 ot-display">The actual interface, not a rendering.</h2>
          <p className="ot-lede">
            These are the real layouts, built from the same components as the
            product. Figures are blank because they belong to your account —
            OctaTrade does not display sample balances.
          </p>
        </div>

        <div className="ot-preview__frame">
          {/* Window chrome, in the terminal voice. */}
          <div className="ot-preview__chrome">
            <div className="ot-preview__tabs" role="tablist" aria-label="Interface previews">
              {TABS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  id={`preview-tab-${entry.id}`}
                  aria-selected={tab === entry.id}
                  aria-controls={`preview-panel-${entry.id}`}
                  className={`ot-preview__tab ${tab === entry.id ? "is-active" : ""}`}
                  onClick={() => setTab(entry.id)}
                >
                  {entry.label}
                </button>
              ))}
            </div>
            <span className="ot-preview__api ot-mono">
              {TABS.find((entry) => entry.id === tab)?.api}
            </span>
          </div>

          <div
            className="ot-preview__body"
            role="tabpanel"
            id={`preview-panel-${tab}`}
            aria-labelledby={`preview-tab-${tab}`}
          >
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {tab === "terminal" ? <TerminalPreview /> : null}
              {tab === "portfolio" ? <PortfolioPreview /> : null}
              {tab === "ledger" ? <LedgerPreview /> : null}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** The terminal layout: instrument, chart placeholder and order ticket. */
function TerminalPreview() {
  return (
    <div className="ot-preview__terminal">
      <div className="ot-preview__col">
        <div className="ot-preview__panel">
          <p className="ot-label">Instrument</p>
          <p className="ot-preview__symbol ot-mono">TCS.NS</p>
          <div className="ot-preview__kv">
            <span>Latest quote</span>
            <span className="ot-mono">{EM_DASH}</span>
          </div>
          <div className="ot-preview__kv">
            <span>Currency</span>
            <span className="ot-mono">{EM_DASH}</span>
          </div>
        </div>

        {/* The honest chart state, exactly as the product shows it. */}
        <div className="ot-preview__panel ot-preview__chart">
          <p className="ot-label">Price history</p>
          <div className="ot-preview__chart-empty">
            <p className="ot-preview__chart-title">
              Historical market data is not available yet
            </p>
            <p className="ot-preview__chart-desc">
              Connect a historical-price endpoint to display candles and volume.
            </p>
          </div>
        </div>
      </div>

      <div className="ot-preview__col">
        <div className="ot-preview__panel">
          <p className="ot-label">Order ticket</p>
          <div className="ot-preview__sides">
            <span className="ot-preview__side is-buy">Buy</span>
            <span className="ot-preview__side">Sell</span>
          </div>
          <div className="ot-preview__kv">
            <span>Quantity</span>
            <span className="ot-mono">{EM_DASH}</span>
          </div>
          <div className="ot-preview__kv">
            <span>Estimated order value</span>
            <span className="ot-mono">{EM_DASH}</span>
          </div>
          <div className="ot-preview__kv">
            <span>Available balance</span>
            <span className="ot-mono">{EM_DASH}</span>
          </div>
          <div className="ot-preview__kv">
            <span>Estimated balance after</span>
            <span className="ot-mono">{EM_DASH}</span>
          </div>
          <p className="ot-preview__cta">Review buy order</p>
          <p className="ot-preview__note">
            Validated against your real buying power before it is sent.
          </p>
        </div>
      </div>
    </div>
  );
}

/** The portfolio layout: holdings columns and the allocation legend. */
function PortfolioPreview() {
  const columns = ["Symbol", "Qty", "Avg cost", "Invested", "Market value", "P&L"];

  return (
    <div className="ot-preview__table-wrap">
      <div className="ot-preview__table-head">
        {columns.map((column) => (
          <span className="ot-label" key={column}>
            {column}
          </span>
        ))}
      </div>
      {[0, 1, 2].map((row) => (
        <div className="ot-preview__table-row" key={row}>
          <span className="ot-mono ot-preview__muted">{EM_DASH}</span>
          <span className="ot-mono ot-preview__muted">{EM_DASH}</span>
          <span className="ot-mono ot-preview__muted">{EM_DASH}</span>
          <span className="ot-mono ot-preview__muted">{EM_DASH}</span>
          <span className="ot-mono ot-preview__muted">{EM_DASH}</span>
          <span className="ot-mono ot-preview__muted">{EM_DASH}</span>
        </div>
      ))}
      <p className="ot-preview__empty-note">
        Positions appear here after your first filled buy order. Allocation is
        calculated from live quotes at the moment the page loads.
      </p>
    </div>
  );
}

/** The ledger layout: wallet movement types and the lifecycle they belong to. */
function LedgerPreview() {
  const entries = [
    { type: "DEPOSIT", meaning: "Virtual funds credited to the wallet" },
    { type: "RESERVE", meaning: "Balance held while an order is working" },
    { type: "DEBIT", meaning: "Funds taken on a completed buy" },
    { type: "CREDIT", meaning: "Proceeds returned on a completed sell" },
    { type: "RELEASE", meaning: "Reservation returned when an order does not fill" }
  ];

  return (
    <div className="ot-preview__ledger">
      <div className="ot-preview__ledger-head">
        <span className="ot-label">Movement</span>
        <span className="ot-label">Meaning</span>
        <span className="ot-label">Amount</span>
      </div>
      {entries.map((entry) => (
        <div className="ot-preview__ledger-row" key={entry.type}>
          <StatusMark status={entry.type} />
          <span className="ot-preview__ledger-meaning">{entry.meaning}</span>
          <span className="ot-mono ot-preview__muted">{EM_DASH}</span>
        </div>
      ))}

      <div className="ot-preview__order-strip">
        <p className="ot-label">Order lifecycle</p>
        <div className="ot-preview__order-row">
          <SideMark side="BUY" />
          <StatusMark status="NEW" />
          <span className="ot-preview__arrow" aria-hidden="true">→</span>
          <StatusMark status="FILLED" />
          <span className="ot-preview__ledger-meaning">
            Every status change is recorded against the order.
          </span>
        </div>
      </div>
    </div>
  );
}
