/**
 * Panel / PanelHeader / SectionIndex — the structural containers.
 *
 * Purpose : the identity uses cut metal plates and hairline rules instead of
 *           repeated rounded cards. These components enforce that so no view
 *           reinvents a card style.
 * Input   : title, meta, actions, inset, flush, children.
 * Output  : semantic <section>/<header> markup with the octagon clip.
 */
export function Panel({
  as: Component = "section",
  inset = false,
  flush = false,
  className = "",
  children,
  ...rest
}) {
  return (
    <Component
      className={[
        "ot-panel-shell",
        inset ? "is-inset" : "",
        flush ? "is-flush" : "",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </Component>
  );
}

export function PanelHeader({ title, meta, actions, description, id }) {
  return (
    <header className="ot-panel-head">
      <div className="ot-panel-head__text">
        <div className="ot-panel-head__title-row">
          <h2 className="ot-h4" id={id}>
            {title}
          </h2>
          {meta ? <span className="ot-label ot-panel-head__meta">{meta}</span> : null}
        </div>
        {description ? (
          <p className="ot-panel-head__desc">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="ot-panel-head__actions">{actions}</div> : null}
    </header>
  );
}

export function PanelBody({ className = "", children, ...rest }) {
  return (
    <div className={`ot-panel-body ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

/** "03 / CAPABILITY" section marker used across the marketing page. */
export function SectionIndex({ index, title, tone = "accent" }) {
  return (
    <div className="ot-section-index">
      <span
        className="ot-section-index__num"
        style={tone === "muted" ? { color: "var(--text-faint)" } : undefined}
      >
        {index}
      </span>
      <span className="ot-section-index__title">{title}</span>
      <span className="ot-section-index__line" aria-hidden="true" />
    </div>
  );
}
