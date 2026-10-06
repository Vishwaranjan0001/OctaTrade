import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";

const navigation = [
  ["Platform", "#platform"],
  ["Capabilities", "#capabilities"],
  ["Workflow", "#workflow"],
  ["Safety", "#safety"]
];

// Phones only: hide the bar while scrolling down, bring it back on scroll up or near the top.
function useHideOnScroll() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      if (y < 60) setHidden(false);
      else if (y > lastY + 4) setHidden(true);
      else if (y < lastY - 4) setHidden(false);
      lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const sync = () => {
      window.removeEventListener("scroll", onScroll);
      setHidden(false);
      if (query.matches) {
        lastY = window.scrollY;
        window.addEventListener("scroll", onScroll, { passive: true });
      }
    };

    sync();
    query.addEventListener("change", sync);
    return () => {
      cancelAnimationFrame(frame);
      query.removeEventListener("change", sync);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return hidden;
}

export function LandingNavigation() {
  const [open, setOpen] = useState(false);
  const hidden = useHideOnScroll();

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className={`landing-nav-shell${hidden && !open ? " is-hidden" : ""}${open ? " is-open" : ""}`}>
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
            <span className="nav-menu-icon" aria-hidden="true" />
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
