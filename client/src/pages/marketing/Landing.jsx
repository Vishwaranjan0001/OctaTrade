import { useEffect } from "react";

import { Nav } from "../../components/marketing/Nav.jsx";
import { Hero } from "../../components/marketing/Hero.jsx";
import { Positioning } from "../../components/marketing/Positioning.jsx";
import { Capability } from "../../components/marketing/Capability.jsx";
import { SurfaceCarousel } from "../../components/marketing/SurfaceCarousel.jsx";
import { InterfacePreview } from "../../components/marketing/InterfacePreview.jsx";
import { Scrolly } from "../../components/marketing/Scrolly.jsx";
import { Safety } from "../../components/marketing/Safety.jsx";
import { FinalCta } from "../../components/marketing/FinalCta.jsx";
import { Footer } from "../../components/marketing/Footer.jsx";
import { ErrorBoundary } from "../../components/ErrorBoundary.jsx";

/*
  Landing page composition and its intended reading rhythm.

    hero        tall, dark, radial — the 3D market object
    positioning editorial statement, then a two-column honest ledger
    capability  dense specification sheet (slowest, most technical passage)
    surfaces    full-bleed horizontal carousel — the rhythm breaks sideways
    interface   one large interactive frame
    workflow    pinned scrollytelling, three stages, one transforming object
    safety      LIGHT inverted palette — the strongest rhythm change on the page
    final       convergence of rings onto the call to action
    footer      dense link matrix

  No two consecutive sections share a layout, a background treatment or a reveal
  direction, which is what stops the page reading as a stack of identical bands.
*/

/**
 * Landing — the marketing page.
 * Input  : none.
 * Output : the full page.
 */
export default function Landing() {
  useEffect(() => {
    document.title =
      "OctaTrade — Paper trading terminal for Indian equities";
  }, []);

  return (
    <>
      <Nav />
      <main id="main">
        {/* Each section is isolated: a fault in one (a third-party carousel, a
            WebGL context failure) must never blank the whole page. */}
        <ErrorBoundary label="The hero">
          <Hero />
        </ErrorBoundary>
        <ErrorBoundary label="The positioning section">
          <Positioning />
        </ErrorBoundary>
        <ErrorBoundary label="The capability section">
          <Capability />
        </ErrorBoundary>
        <ErrorBoundary label="The surfaces carousel">
          <SurfaceCarousel />
        </ErrorBoundary>
        <ErrorBoundary label="The interface preview">
          <InterfacePreview />
        </ErrorBoundary>
        <ErrorBoundary label="The workflow sequence">
          <Scrolly />
        </ErrorBoundary>
        <ErrorBoundary label="The paper-trading section">
          <Safety />
        </ErrorBoundary>
        <ErrorBoundary label="The closing section">
          <FinalCta />
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  );
}
