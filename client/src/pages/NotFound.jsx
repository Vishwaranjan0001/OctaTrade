import { Link } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";
import { useEffect } from "react";

import { Button } from "../components/ui/Button.jsx";
import { Logo } from "../components/ui/Logo.jsx";
import { useAuthStore } from "../store/authStore.js";

/**
 * NotFound — the 404 page.
 *
 * Purpose : a route that does not exist should still feel like the product and
 *           offer a real way back. The destination adapts to whether a session
 *           exists, so a signed-in user is returned to their workspace.
 * Input   : none.
 * Output  : the 404 page.
 */
export default function NotFound() {
  const hasSession = useAuthStore((state) => state.hasSession);

  useEffect(() => {
    document.title = "Page not found — OctaTrade";
  }, []);

  return (
    <main className="ot-notfound" id="main">
      <div className="ot-notfound__inner">
        <Logo size={28} />

        {/* An octagon with one side opened: the visual note that a path is
            missing. Static, no animation. */}
        <svg
          className="ot-notfound__art"
          viewBox="0 0 220 220"
          aria-hidden="true"
          focusable="false"
        >
          <polygon
            points="74,14 146,14 206,74 206,146 146,206 74,206 14,146 14,74"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.22"
          />
          <polyline
            points="146,14 206,74 206,146"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="7 9"
          />
          <line x1="110" y1="74" x2="110" y2="146" stroke="currentColor" strokeWidth="1" opacity="0.18" />
          <line x1="74" y1="110" x2="146" y2="110" stroke="currentColor" strokeWidth="1" opacity="0.18" />
        </svg>

        <p className="ot-label ot-notfound__code">Error 404</p>
        <h1 className="ot-notfound__title ot-display">This route does not exist</h1>
        <p className="ot-notfound__body">
          The page you asked for is not part of OctaTrade. If you followed a link
          to a security or an order, check the symbol or identifier — they are
          case-sensitive.
        </p>

        <div className="ot-notfound__actions">
          <Button
            as={Link}
            to={hasSession ? "/dashboard" : "/"}
            iconLeft={<ArrowLeft size={15} aria-hidden="true" />}
          >
            {hasSession ? "Back to dashboard" : "Back to OctaTrade"}
          </Button>
          {hasSession ? (
            <Button
              as={Link}
              to="/markets"
              variant="secondary"
              iconLeft={<Compass size={15} aria-hidden="true" />}
            >
              Find a security
            </Button>
          ) : (
            <Button as={Link} to="/login" variant="secondary">
              Sign in
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
