import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { Menu, Pause, Play, X } from "lucide-react";

import { Logo } from "../ui/Logo.jsx";
import { Button } from "../ui/Button.jsx";
import { useScrollTo } from "../SmoothScrollProvider.jsx";
import { useMotionPreference } from "../../hooks/useMotionPreference.js";

const SECTIONS = [
  { id: "positioning", label: "Product" },
  { id: "capability", label: "Capability" },
  { id: "surfaces", label: "Surfaces" },
  { id: "workflow", label: "Workflow" },
  { id: "safety", label: "Paper trading" }
];

/**
 * Nav — the marketing navigation.
 *
 * Purpose : a thin, technical bar in the terminal voice. It condenses on scroll
 *           (border and background only — never height, which would reflow the
 *           page) and drives Lenis-powered anchor scrolling.
 * Input   : none.
 * Output  : the site header, plus a mobile sheet.
 */
export function Nav() {
  const [condensed, setCondensed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollTo = useScrollTo();
  const { scrollY } = useScroll();
  const { motionEnabled, toggleMotion, prefersReducedMotion } = useMotionPreference();

  /* Scroll state is read from a motion value and only committed to React when
     it crosses the threshold, so scrolling does not re-render on every frame. */
  useMotionValueEvent(scrollY, "change", (value) => {
    const next = value > 24;
    setCondensed((current) => (current === next ? current : next));
  });

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  /** Scrolls to a section and closes the mobile sheet. */
  function goTo(id) {
    setMenuOpen(false);
    scrollTo(`#${id}`, { offset: -72 });
  }

  return (
    <>
      <header className={`ot-nav ${condensed ? "is-condensed" : ""}`}>
        <div className="ot-nav__inner">
          <Link to="/" className="ot-nav__brand" aria-label="OctaTrade home">
            <Logo size={24} />
          </Link>

          <nav className="ot-nav__links" aria-label="Sections">
            {SECTIONS.map((section) => (
              <button
                type="button"
                key={section.id}
                className="ot-nav__link"
                onClick={() => goTo(section.id)}
              >
                {section.label}
              </button>
            ))}
          </nav>

          <div className="ot-nav__actions">
            <button
              type="button"
              className="ot-nav__motion"
              onClick={toggleMotion}
              aria-pressed={!motionEnabled}
              title={
                prefersReducedMotion
                  ? "Your system already requests reduced motion"
                  : motionEnabled
                    ? "Pause interface motion"
                    : "Resume interface motion"
              }
            >
              {motionEnabled ? (
                <Pause size={14} aria-hidden="true" />
              ) : (
                <Play size={14} aria-hidden="true" />
              )}
              <span className="ot-sr">
                {motionEnabled ? "Pause interface motion" : "Resume interface motion"}
              </span>
            </button>

            <Button as={Link} to="/login" variant="ghost" size="sm" className="ot-nav__login">
              Log in
            </Button>
            <Button as={Link} to="/register" size="sm">
              Open account
            </Button>

            <button
              type="button"
              className="ot-nav__burger"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="ot-nav-sheet" role="dialog" aria-modal="true" aria-label="Menu">
          <motion.div
            className="ot-nav-sheet__panel"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="ot-nav-sheet__head">
              <Logo size={22} />
              <button
                type="button"
                className="ot-nav-sheet__close"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <nav className="ot-nav-sheet__links" aria-label="Sections">
              {SECTIONS.map((section) => (
                <button
                  type="button"
                  key={section.id}
                  className="ot-nav-sheet__link"
                  onClick={() => goTo(section.id)}
                >
                  <span className="ot-label">{String(SECTIONS.indexOf(section) + 1).padStart(2, "0")}</span>
                  {section.label}
                </button>
              ))}
            </nav>

            <div className="ot-nav-sheet__actions">
              <Button as={Link} to="/register" block size="lg">
                Open account
              </Button>
              <Button as={Link} to="/login" variant="secondary" block size="lg">
                Log in
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </>
  );
}
