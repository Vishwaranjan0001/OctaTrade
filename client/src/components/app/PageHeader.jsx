/**
 * PageHeader — the standard opening block of a workspace page.
 *
 * Purpose : states what the surface shows and which API it reads, so the
 *           product never implies data it does not have. `source` renders in
 *           the terminal voice next to the title.
 * Input   : title, lede, source, actions, children.
 * Output  : a header region.
 */
export function PageHeader({ title, lede, source, actions, children }) {
  return (
    <header className="ot-page-head">
      <div className="ot-page-head__main">
        <div className="ot-page-head__title-row">
          <h2 className="ot-page-head__title ot-display">{title}</h2>
          {source ? (
            <span className="ot-page-head__source ot-label" title="Data source">
              {source}
            </span>
          ) : null}
        </div>
        {lede ? <p className="ot-page-head__lede">{lede}</p> : null}
        {children}
      </div>
      {actions ? <div className="ot-page-head__actions">{actions}</div> : null}
    </header>
  );
}
