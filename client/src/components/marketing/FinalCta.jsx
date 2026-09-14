import { Link } from "react-router-dom";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";

import { Button } from "../ui/Button.jsx";
import { octagonVertices } from "../scene/geometry.js";

/**
 * FinalCta — the closing call to action.
 *
 * Purpose : the last section, composed as a convergence: octagon rings contract
 *           toward the centre as the section is scrolled into place, and the
 *           action sits at the convergence point. Scroll-linked scale only, so
 *           it costs nothing.
 * Input   : none.
 * Output  : the section.
 */
export function FinalCta() {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"]
  });

  /* Rings contract and settle as the section arrives. */
  const ringScale = useTransform(scrollYProgress, [0, 1], [1.22, 1]);
  const ringOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [0, 0.7, 1]);
  const contentY = useTransform(scrollYProgress, [0, 1], [28, 0]);

  const polygon = (radius) =>
    octagonVertices(radius)
      .map(([x, y]) => `${(200 + x).toFixed(1)},${(200 + y).toFixed(1)}`)
      .join(" ");

  return (
    <section className="ot-section ot-final" ref={ref} aria-labelledby="final-title">
      <motion.svg
        className="ot-final__art"
        viewBox="0 0 400 400"
        style={{ scale: ringScale, opacity: ringOpacity }}
        aria-hidden="true"
        focusable="false"
      >
        {[186, 150, 114, 78, 42].map((radius, index) => (
          <polygon
            key={radius}
            points={polygon(radius)}
            fill="none"
            stroke={index === 2 ? "var(--accent)" : "currentColor"}
            strokeWidth={index === 2 ? 1.5 : 1}
            opacity={index === 2 ? 0.85 : 0.16}
          />
        ))}
      </motion.svg>

      <motion.div className="ot-shell ot-final__inner" style={{ y: contentY }}>
        <p className="ot-label ot-final__eyebrow">Open an account</p>
        <h2 className="ot-final__title ot-display" id="final-title">
          Start with the mechanics.
          <br />
          The conviction comes later.
        </h2>
        <p className="ot-final__lede">
          Registration takes a name, an email and a password. Your wallet is
          funded with virtual INR immediately, and you can place your first paper
          order straight away.
        </p>

        <div className="ot-final__actions">
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

        <p className="ot-final__fine">
          No payment details required · Virtual funds only · Simulated execution
        </p>
      </motion.div>
    </section>
  );
}
