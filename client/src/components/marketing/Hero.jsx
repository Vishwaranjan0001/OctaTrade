import { Link } from "react-router-dom";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowDownRight, ArrowRight, ShieldCheck } from "lucide-react";

import { Button } from "../ui/Button.jsx";
import { SceneHost } from "../scene/SceneHost.jsx";
import { useScrollTo } from "../SmoothScrollProvider.jsx";

/*
  HERO COMPOSITION
  ------------------------------------------------------------------
  Deliberately not "headline left, product screenshot right".

  The 3D market object is the compositional centre, bleeding past the top and
  right edges. The headline is set as three diagonally staggered lines that
  cross in front of the rings, so the typography and the object occupy the same
  space rather than sitting in separate columns. Around the object sit the real
  API surfaces as small mono readouts — labels only, never invented figures.
  A drawn path runs from the headline down to the primary action, so the eye is
  led to the call to action rather than having to find it.

  Parallax is zoom-and-scale and runs entirely on motion values: the scene
  layer drifts slowly and scales up, the headline rises faster, the readouts
  scale subtly, and the whole composition recedes as it leaves. No React state
  is touched while scrolling.
*/

export function Hero() {
  const sectionRef = useRef(null);
  const scrollTo = useScrollTo();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  /* Background: slow drift, slight zoom toward the viewer. */
  const sceneY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 1.14]);
  const sceneOpacity = useTransform(scrollYProgress, [0, 0.75, 1], [1, 0.55, 0.18]);

  /* Middle: the headline moves faster than the scene. */
  const headlineY = useTransform(scrollYProgress, [0, 1], ["0%", "-32%"]);
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.6, 0.95], [1, 0.85, 0]);

  /* Foreground: readouts recede slightly, reinforcing depth. */
  const readoutY = useTransform(scrollYProgress, [0, 1], ["0%", "-52%"]);
  const readoutScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);

  return (
    <section className="ot-hero" ref={sectionRef} aria-labelledby="hero-title">
      {/* Restrained coordinate grid, painted once. */}
      <div className="ot-hero__grid ot-grid-bg" aria-hidden="true" />

      {/* Layer 1 — the financial object. */}
      <motion.div
        className="ot-hero__scene"
        style={{ y: sceneY, scale: sceneScale, opacity: sceneOpacity }}
        aria-hidden="true"
      >
        <SceneHost />
      </motion.div>

      <div className="ot-hero__inner ot-shell">
        {/* Layer 2 — typography crossing the object. */}
        <motion.div className="ot-hero__type" style={{ y: headlineY, opacity: headlineOpacity }}>
          <p className="ot-hero__eyebrow ot-label">
            <ShieldCheck size={12} aria-hidden="true" />
            Paper-trading terminal
            <span className="ot-hero__eyebrow-sep" aria-hidden="true" />
            Virtual INR
          </p>

          <h1 className="ot-hero__title ot-display" id="hero-title">
            {/* The three lines stagger to the right, running diagonally across
                the rings behind them. */}
            <span className="ot-hero__line ot-hero__line--1">Real quotes.</span>
            <span className="ot-hero__line ot-hero__line--2">Virtual capital.</span>
            <span className="ot-hero__line ot-hero__line--3">
              The whole <em>order lifecycle</em>.
            </span>
          </h1>

          <p className="ot-hero__lede">
            OctaTrade is a paper-trading terminal for Indian equities. Place market
            orders against live prices, watch funds reserve and settle through a
            paise-exact wallet ledger, and follow exactly how a position forms —
            with none of your own money at risk.
          </p>

          <div className="ot-hero__actions">
            <Button
              as={Link}
              to="/register"
              size="lg"
              iconRight={<ArrowRight size={16} aria-hidden="true" />}
            >
              Open a paper account
            </Button>
            <Button as={Link} to="/login" variant="secondary" size="lg">
              Log in
            </Button>
          </div>

          <p className="ot-hero__fine">
            No payment details. No real money can enter or leave an OctaTrade
            account.
          </p>
        </motion.div>

        {/* Layer 3 — the API surfaces placed around the object. Labels only:
            there are no prices or balances here to invent. */}
        <motion.ul
          className="ot-hero__readouts"
          style={{ y: readoutY, scale: readoutScale }}
          aria-label="Platform surfaces"
        >
          <li className="ot-hero__readout ot-hero__readout--a">
            <span className="ot-hero__readout-key ot-label">Latest quote</span>
            <span className="ot-hero__readout-val">Live, per symbol</span>
          </li>
          <li className="ot-hero__readout ot-hero__readout--b">
            <span className="ot-hero__readout-key ot-label">Order lifecycle</span>
            <span className="ot-hero__readout-val">Accepted → reserved → filled</span>
          </li>
          <li className="ot-hero__readout ot-hero__readout--c">
            <span className="ot-hero__readout-key ot-label">Wallet ledger</span>
            <span className="ot-hero__readout-val">Integer paise, no rounding drift</span>
          </li>
          <li className="ot-hero__readout ot-hero__readout--d">
            <span className="ot-hero__readout-key ot-label">Portfolio</span>
            <span className="ot-hero__readout-val">Cost basis and allocation</span>
          </li>
        </motion.ul>

        {/* The guiding path: follows octagon diagonals from the headline toward
            the primary action. */}
        <svg className="ot-hero__path" viewBox="0 0 400 300" aria-hidden="true" focusable="false">
          <polyline
            points="8,18 132,18 210,96 210,206 268,264 392,264"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.4"
          />
          <polyline
            className="ot-hero__path-runner"
            points="8,18 132,18 210,96 210,206 268,264 392,264"
            fill="none"
            stroke="var(--cyan-300)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="210" cy="96" r="2.6" fill="var(--accent)" />
          <circle cx="210" cy="206" r="2.6" fill="var(--accent)" />
        </svg>

        <button type="button" className="ot-hero__scroll" onClick={() => scrollTo("#positioning", { offset: -72 })}>
          <span className="ot-label">What it does</span>
          <ArrowDownRight size={14} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
