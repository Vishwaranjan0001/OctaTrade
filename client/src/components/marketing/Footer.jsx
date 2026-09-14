import { Link } from "react-router-dom";
import { Logo } from "../ui/Logo.jsx";
import { useScrollTo } from "../SmoothScrollProvider.jsx";

/*
  A dense link matrix in the terminal voice rather than four columns of marketing
  links. Only real destinations appear: routes that exist and endpoints that
  exist. No social accounts, press pages or careers links are invented.
*/
const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Positioning", section: "positioning" },
      { label: "Capability", section: "capability" },
      { label: "Surfaces", section: "surfaces" },
      { label: "Workflow", section: "workflow" },
      { label: "Paper trading", section: "safety" }
    ]
  },
  {
    heading: "Account",
    links: [
      { label: "Open an account", to: "/register" },
      { label: "Log in", to: "/login" }
    ]
  },
  {
    heading: "API surface",
    items: [
      "GET /api/quotes/:symbol",
      "GET /api/wallet",
      "GET /api/portfolio",
      "GET /api/orders",
      "GET /api/auth/me"
    ]
  }
];

/**
 * Footer — the site footer.
 * Input  : none.
 * Output : the footer element.
 */
export function Footer() {
  const scrollTo = useScrollTo();
  const year = new Date().getFullYear();

  return (
    <footer className="ot-footer">
      <div className="ot-shell">
        <div className="ot-footer__top">
          <div className="ot-footer__brand">
            <Logo size={26} />
            <p className="ot-footer__tagline">
              A paper-trading terminal for Indian equities. Live prices, virtual
              capital, complete order lifecycle.
            </p>
          </div>

          <div className="ot-footer__cols">
            {COLUMNS.map((column) => (
              <div className="ot-footer__col" key={column.heading}>
                <h2 className="ot-footer__heading ot-label">{column.heading}</h2>
                <ul>
                  {(column.links || []).map((link) => (
                    <li key={link.label}>
                      {link.to ? (
                        <Link className="ot-footer__link" to={link.to}>
                          {link.label}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="ot-footer__link"
                          onClick={() => scrollTo(`#${link.section}`, { offset: -72 })}
                        >
                          {link.label}
                        </button>
                      )}
                    </li>
                  ))}
                  {(column.items || []).map((item) => (
                    <li key={item}>
                      <code className="ot-footer__code ot-mono">{item}</code>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="ot-footer__bottom">
          <p className="ot-footer__legal">
            © {year} OctaTrade. An educational paper-trading simulator — not a
            broker, and not investment advice.
          </p>
          <p className="ot-footer__legal">
            Market data is provided by a third-party source and may be delayed.
          </p>
        </div>
      </div>
    </footer>
  );
}
