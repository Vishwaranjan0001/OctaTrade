import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";

const navigation = [
  ["Platform", "#platform"],
  ["Capabilities", "#capabilities"],
  ["Workflow", "#workflow"],
  ["Safety", "#safety"]
];

export function LandingNavigation() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className="landing-nav-shell">
      <div className="landing-nav">
        <Link to="/" aria-label="OctaTrade home" className="landing-brand-link">
          OctaTrade
        </Link>

        <nav aria-label="Primary navigation" className="landing-nav-links">
          {navigation.map(([label, href]) => (
            <a key={href} href={href}>{label}</a>
          ))}
        </nav>

        <div className="landing-nav-actions">
          <Link to="/login" className="nav-login">Log in</Link>
          <Link to="/login?mode=register" className="nav-register">Create account</Link>
          <button
            type="button"
            className="nav-menu-button"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen((current) => !current)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="mobile-navigation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {navigation.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
            ))}
            <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
