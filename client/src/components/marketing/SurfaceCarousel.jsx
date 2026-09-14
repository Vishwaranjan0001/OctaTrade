import { useEffect, useMemo, useRef, useState } from "react";
import SlickModule from "react-slick";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { SectionIndex } from "../ui/Panel.jsx";
import { SURFACES } from "./surfaceData.js";
import { useMotionPreference } from "../../hooks/useMotionPreference.js";
import { usePageVisibility } from "../../hooks/usePageVisibility.js";

/*
  react-slick is CommonJS and its module.exports is `{ default: Slider }`, so
  depending on the interop path the default import can arrive as the namespace
  object rather than the component — which React rejects with "Element type is
  invalid ... got: object". Normalising here keeps it working in both the
  pre-bundled dev server and the Rolldown production build.
*/
const Slider = SlickModule?.default ?? SlickModule;

/**
 * SurfaceCard — a structural preview of one workspace surface.
 *
 * Purpose : let a visitor see how a surface is laid out before signing up,
 *           without showing any figure that would have to be invented. Value
 *           positions carry an em dash and the card states which API fills them.
 * Input   : surface (from SURFACES), index.
 * Output  : the card markup.
 */
function SurfaceCard({ surface, index }) {
  return (
    <article className="ot-surface" aria-labelledby={`surface-${surface.id}`}>
      <header className="ot-surface__head">
        <span className="ot-surface__index ot-label">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="ot-h4" id={`surface-${surface.id}`}>
          {surface.label}
        </h3>
      </header>

      {/* The preview frame: chrome plus the surface's real row structure. */}
      <div className="ot-surface__frame">
        <div className="ot-surface__chrome" aria-hidden="true">
          <span className="ot-surface__dot" />
          <span className="ot-surface__chrome-title ot-mono">
            octatrade / {surface.id}
          </span>
        </div>

        <dl className="ot-surface__rows">
          {surface.rows.map((row) => (
            <div className="ot-surface__row" key={row.key}>
              <dt className="ot-surface__key">{row.key}</dt>
              <dd className="ot-surface__val ot-mono">{row.value}</dd>
            </div>
          ))}
        </dl>

        <p className="ot-surface__note ot-label">Values load from your account</p>
      </div>

      <p className="ot-surface__summary">{surface.summary}</p>
      <p className="ot-surface__api ot-mono">{surface.api}</p>
    </article>
  );
}

/**
 * SurfaceCarousel — browse the product's surfaces.
 *
 * Purpose : the one carousel in the product, and it earns its place: eight
 *           surfaces is too many to show at once and the reader benefits from
 *           stepping through them. React Slick provides the track, swipe
 *           handling and keyboard support.
 * Input   : none.
 * Output  : the carousel section.
 *
 * Motion rules: autoplay only runs when interface motion is enabled AND the tab
 * is visible; it stops on hover or focus so it never moves under a reader.
 */
export function SurfaceCarousel() {
  const sliderRef = useRef(null);
  const [active, setActive] = useState(0);
  const { animationsEnabled } = useMotionPreference();
  const isVisible = usePageVisibility();

  const autoplay = animationsEnabled && isVisible;

  const settings = useMemo(
    () => ({
      dots: false,
      arrows: false,
      infinite: true,
      speed: animationsEnabled ? 620 : 0,
      cssEase: "cubic-bezier(0.22, 1, 0.36, 1)",
      slidesToShow: 3,
      slidesToScroll: 1,
      swipeToSlide: true,
      /* Vertical page scrolling must always win over horizontal dragging. */
      touchThreshold: 12,
      autoplay,
      autoplaySpeed: 4200,
      pauseOnHover: true,
      pauseOnFocus: true,
      accessibility: true,
      beforeChange: (_current, next) => setActive(next),
      responsive: [
        { breakpoint: 1280, settings: { slidesToShow: 2.4 } },
        { breakpoint: 1024, settings: { slidesToShow: 2 } },
        { breakpoint: 760, settings: { slidesToShow: 1.35 } },
        { breakpoint: 520, settings: { slidesToShow: 1.08 } }
      ]
    }),
    [autoplay, animationsEnabled]
  );

  /* Slick caches autoplay state internally, so toggling it needs the API. */
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    if (autoplay) slider.slickPlay?.();
    else slider.slickPause?.();
  }, [autoplay]);

  return (
    <section className="ot-section ot-surfaces" id="surfaces">
      <div className="ot-shell">
        <SectionIndex index="03" title="Surfaces" />

        <div className="ot-surfaces__head">
          <h2 className="ot-h2 ot-display">
            Eight surfaces, one account.
          </h2>
          <p className="ot-lede">
            The workspace is organised around the question you are asking, not
            the table the data sits in. Step through to see how each surface is
            laid out.
          </p>

          <div className="ot-surfaces__controls">
            <button
              type="button"
              className="ot-carousel-btn"
              onClick={() => sliderRef.current?.slickPrev()}
              aria-label="Previous surface"
            >
              <ArrowLeft size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="ot-carousel-btn"
              onClick={() => sliderRef.current?.slickNext()}
              aria-label="Next surface"
            >
              <ArrowRight size={15} aria-hidden="true" />
            </button>
            <span className="ot-surfaces__counter ot-mono" aria-live="polite">
              {String(active + 1).padStart(2, "0")} / {String(SURFACES.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* Full-bleed track: the carousel escapes the shell so slides run to the
          right edge, which is what signals there is more to see. */}
      <div className="ot-surfaces__track">
        <Slider ref={sliderRef} {...settings}>
          {SURFACES.map((surface, index) => (
            <div className="ot-surfaces__slide" key={surface.id}>
              <SurfaceCard surface={surface} index={index} />
            </div>
          ))}
        </Slider>
      </div>

      <div className="ot-shell">
        {/* Dots double as a labelled surface picker. */}
        <ul className="ot-surfaces__dots" aria-label="Choose a surface">
          {SURFACES.map((surface, index) => (
            <li key={surface.id}>
              <button
                type="button"
                className={`ot-surfaces__dot ${index === active ? "is-active" : ""}`}
                onClick={() => sliderRef.current?.slickGoTo(index)}
                aria-current={index === active ? "true" : undefined}
              >
                {surface.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
