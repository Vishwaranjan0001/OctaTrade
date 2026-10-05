import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, ChartPie, CircleDotDashed, Search, SlidersHorizontal } from "lucide-react";

const modes = [
  { id: "discover", label: "Discover", icon: Search, heading: "Search and study", detail: "Start with an exchange symbol and request the latest available quote." },
  { id: "order", label: "Order", icon: SlidersHorizontal, heading: "Shape the paper order", detail: "Make the trade mechanics explicit before submitting anything." },
  { id: "portfolio", label: "Portfolio", icon: ChartPie, heading: "Understand the outcome", detail: "Review holdings, allocation and order state as connected information." }
];

function PreviewPanel({ active }) {
  if (active === "discover") {
    return (
      <div className="preview-panel preview-discover">
        <div className="preview-search"><Search aria-hidden="true" /><span>Search exchange symbols</span><kbd>⌘ K</kbd></div>
        <div className="preview-quote-layout">
          <div><span className="preview-label">Selected security</span><strong>Choose an instrument</strong></div>
          <div><span className="preview-label">Market response</span><strong>Latest quote</strong></div>
        </div>
        <div className="preview-wave" aria-label="Decorative abstract price-wave geometry"><span /><span /><span /><span /><span /><span /><span /></div>
        <div className="preview-note">Historical data unavailable until a security is selected</div>
      </div>
    );
  }

  if (active === "order") {
    return (
      <div className="preview-panel preview-order">
        <div className="order-route"><span>IDEA</span><i /><span>REVIEW</span><i /><span>SUBMIT</span></div>
        <div className="order-fields">
          <div><span className="preview-label">Side</span><strong>Choose buy or sell</strong></div>
          <div><span className="preview-label">Quantity</span><strong>Set in workspace</strong></div>
          <div><span className="preview-label">Order type</span><strong>Paper market order</strong></div>
        </div>
        <button type="button" tabIndex="-1" aria-hidden="true">Review paper order <ArrowUpRight /></button>
      </div>
    );
  }

  return (
    <div className="preview-panel preview-portfolio">
      <div className="allocation-map" aria-hidden="true"><span className="allocation-core">Portfolio<br />API</span><i /><i /><i /></div>
      <div className="portfolio-signals">
        <div><CircleDotDashed aria-hidden="true" /><span><b>Account holdings</b><small>Position source</small></span></div>
        <div><CircleDotDashed aria-hidden="true" /><span><b>Allocation view</b><small>Portfolio structure</small></span></div>
        <div><CircleDotDashed aria-hidden="true" /><span><b>Order lifecycle</b><small>Execution context</small></span></div>
      </div>
    </div>
  );
}

export function WorkflowPreview({ animated = true }) {
  const [active, setActive] = useState(modes[0].id);
  const selected = modes.find((mode) => mode.id === active);

  return (
    <div className="workflow-console">
      <div className="workflow-rail" role="tablist" aria-label="Product workflow preview">
        {modes.map((mode, index) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              type="button"
              role="tab"
              id={`workflow-tab-${mode.id}`}
              aria-selected={active === mode.id}
              aria-controls="workflow-panel"
              onClick={() => setActive(mode.id)}
            >
              <span>0{index + 1}</span><Icon aria-hidden="true" /><b>{mode.label}</b>
            </button>
          );
        })}
      </div>

      <div className="workflow-main">
        <div className="workflow-titlebar"><span>OCTATRADE / PAPER WORKSPACE</span><span>AUTHENTICATION PROTECTED</span></div>
        <div className="workflow-context">
          <p>Active workflow</p>
          <h3>{selected.heading}</h3>
          <span>{selected.detail}</span>
        </div>
        <div id="workflow-panel" role="tabpanel" aria-labelledby={`workflow-tab-${active}`} className="workflow-panel-shell">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={animated ? { opacity: 0, x: 18, scale: 0.985 } : false}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={animated ? { opacity: 0, x: -14, scale: 0.99 } : { opacity: 0 }}
              transition={{ duration: animated ? 0.28 : 0 }}
            >
              <PreviewPanel active={active} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
