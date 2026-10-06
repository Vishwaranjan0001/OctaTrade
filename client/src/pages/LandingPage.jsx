import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  cancelFrame,
  frame,
  motion,
  MotionConfig,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform
} from "motion/react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { CursorGlow } from "@/components/cursor-glow";
import { LandingNavigation } from "@/components/landing-navigation";
import ScrollStack, { ScrollStackItem } from "@/components/ScrollStack";
import ParticleText from "@/components/ParticleText";
import DepthCarousel from "@/components/DepthCarousel";
import CardSwap, { Card } from "@/components/CardSwap";
import InfiniteMenu from "@/components/InfiniteMenu";
import ScrollExpand from "@/components/ScrollExpand";
import FoldText from "@/components/FoldText";
import { createWorkspaceItems } from "@/lib/workspace-tiles";

const capabilityCards = [
  {
    index: "01",
    title: "Market research",
    copy: "Find securities and study current market context without leaving your decision flow.",
    meta: "QUOTE SEARCH / CONTEXT",
    points: ["Quote search by symbol", "Live price and daily change", "Stock detail view with charts"]
  },
  {
    index: "02",
    title: "Paper execution",
    copy: "Place simulated orders with the same deliberate review you would expect before real execution.",
    meta: "ORDER REVIEW / SIMULATION",
    points: ["Buy and sell with an order review", "Fills settle against your paper wallet", "Every order is simulated"]
  },
  {
    index: "03",
    title: "Portfolio context",
    copy: "See how each decision changes holdings, allocation, and the shape of your practice portfolio.",
    meta: "HOLDINGS / ALLOCATION",
    points: ["Holdings with live valuation", "Allocation across positions", "Cash and holdings side by side"]
  },
  {
    index: "04",
    title: "Decision history",
    copy: "Return to the reasoning behind past moves and turn activity into a repeatable learning loop.",
    meta: "ACTIVITY / REFLECTION",
    points: ["Full order history", "Wallet transaction log", "Activity timeline to review"]
  }
];

const workflowSteps = [
  ["01", "Observe", "Start with context", "Search the market, inspect the available data, and form a clear idea before acting.", ["Quote search", "Watchlist"]],
  ["02", "Test", "Commit to a decision", "Review the order mechanics and put the idea through a simulated execution path.", ["Order review", "Paper wallet"]],
  ["03", "Learn", "Read the outcome", "Connect the order to holdings and portfolio structure without confusing practice with performance.", ["Holdings", "Order history"]]
];

const trustItems = [
  ["Authenticated", "Private workspace routes remain protected behind account access.", ["Signed JWT session per account", "Workspace routes require login"]],
  ["Application-sourced", "Portfolio, wallet, and order context comes from the platform APIs.", ["Quotes from the market data service", "Wallet and orders from your account"]],
  ["Explicitly simulated", "Every order stays paper-only, with no real capital placed at risk.", ["Paper cash only, never real funds", "No broker or exchange connection"]]
];

const trustSlides = trustItems.map(([title, copy, points], itemIndex) => ({
  alt: title,
  content: (
    <article className="trust-card">
      <div className="trust-card-top">
        <span>0{itemIndex + 1}</span>
        <small>TRUST BOUNDARY</small>
      </div>
      <h3>{title}</h3>
      <p>{copy}</p>
      <ul className="card-points">
        {points.map((point) => <li key={point}>{point}</li>)}
      </ul>
      <i aria-hidden="true" />
    </article>
  )
}));

function useCompactLayout() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return compact;
}

// Reveal once: replaying every fade/slide as elements leave and re-enter made scrolling feel busy.
const revealViewport = { once: true, amount: 0.24 };
const revealTransition = { duration: 0.75, ease: [0.22, 1, 0.36, 1] };

function CapabilityCardContent({ card }) {
  return (
    <>
      <div className="after-card-top">
        <span>{card.index}</span>
        <small>{card.meta}</small>
      </div>
      <h3>{card.title}</h3>
      <div className="after-card-body">
        <p>{card.copy}</p>
        <ul className="card-points">
          {card.points.map((point) => <li key={point}>{point}</li>)}
        </ul>
      </div>
      <i aria-hidden="true" />
    </>
  );
}

// Play a video only while it is needed; pausing hidden ones keeps decoding to one or two streams
// and avoids the browser's own off-screen pause/resume, which shows up as a stall.
function syncVideoPlayback(video, shouldPlay) {
  if (!video) return;
  if (shouldPlay) {
    if (video.paused) void video.play().catch(() => {});
  } else if (!video.paused) {
    video.pause();
  }
}

function useLandingSmoothScroll(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.085,
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
      anchors: true
    });
    const advanceScroll = ({ timestamp }) => lenis.raf(timestamp);
    frame.update(advanceScroll, true);

    return () => {
      cancelFrame(advanceScroll);
      lenis.destroy();
    };
  }, [enabled]);
}

export function LandingPage() {
  const prefersReducedMotion = useReducedMotion();
  const pageMotionEnabled = !prefersReducedMotion;
  const compactLayout = useCompactLayout();
  const navigate = useNavigate();
  const workspaceItems = useMemo(() => createWorkspaceItems(), []);
  const primaryHref = "/login?mode=register";

  const heroRef = useRef(null);
  const afterHeroRef = useRef(null);
  const afterHeroVideoRef = useRef(null);
  const primaryVideoRef = useRef(null);
  const videoRestartedRef = useRef(false);

  useLandingSmoothScroll(pageMotionEnabled);

  const { scrollYProgress } = useScroll();
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const { scrollYProgress: afterHeroProgress } = useScroll({
    target: afterHeroRef,
    offset: ["start start", "end end"]
  });

  // The hero is a single screen; these play out as it scrolls away, so the wordmark follows directly.
  const heroCopyY = useTransform(heroProgress, [0, 1], [0, -160]);
  const scrollCueOpacity = useTransform(heroProgress, [0, 0.12], [1, 0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === heroRef.current) {
            syncVideoPlayback(primaryVideoRef.current, entry.isIntersecting);
          } else if (entry.target === afterHeroRef.current) {
            syncVideoPlayback(afterHeroVideoRef.current, entry.isIntersecting);
          }
        });
      },
      { rootMargin: "200px 0px" }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    if (afterHeroRef.current) observer.observe(afterHeroRef.current);
    return () => observer.disconnect();
  }, []);

  useMotionValueEvent(afterHeroProgress, "change", (progress) => {
    if (!pageMotionEnabled) return;

    const video = afterHeroVideoRef.current;
    if (progress >= 0.94 && !videoRestartedRef.current && video) {
      videoRestartedRef.current = true;
      video.currentTime = 0;
      void video.play();
    } else if (progress < 0.86) {
      videoRestartedRef.current = false;
    }
  });

  return (
    <MotionConfig reducedMotion="user" transition={revealTransition}>
      <div className="landing-page">
        <motion.div className="landing-scroll-progress" style={{ scaleX: scrollYProgress }} />
        <LandingNavigation />
        <CursorGlow />

        <main>
          <section ref={heroRef} className="landing-hero" aria-labelledby="hero-heading">
            <div className="hero-sticky-stage">
              <motion.div
                className="hero-video-layer hero-video-primary"
                aria-hidden="true"
              >
                <video ref={primaryVideoRef} autoPlay muted loop playsInline preload="auto">
                  <source src="/videos/hero-coin-toss-graded.mp4" type="video/mp4" />
                </video>
              </motion.div>
              <div className="hero-video-shade" aria-hidden="true" />

              <div className="hero-content">
                <motion.div className="hero-intro" style={pageMotionEnabled ? { y: heroCopyY } : undefined}>
                  <p className="hero-eyebrow">Paper trading for deliberate investors</p>
                  <h1 id="hero-heading">
                    <span>Where market</span>
                    <span>instinct is built,</span>
                    <span>without real risk.</span>
                  </h1>
                </motion.div>

                <motion.div className="hero-actions-panel" style={pageMotionEnabled ? { y: heroCopyY } : undefined}>
                  <p>Research the market, test your thinking, and learn from every decision before real capital is on the line.</p>
                  <div className="hero-actions">
                    <motion.div
                      whileHover={pageMotionEnabled ? { y: -4 } : undefined}
                      whileTap={pageMotionEnabled ? { scale: 0.98 } : undefined}
                    >
                      <Link to={primaryHref} className="primary-action">
                        Start paper trading
                      </Link>
                    </motion.div>
                    <motion.div
                      whileHover={pageMotionEnabled ? { x: 3 } : undefined}
                      whileTap={pageMotionEnabled ? { scale: 0.98 } : undefined}
                    >
                      <Link to="/login" className="secondary-action">Log in</Link>
                    </motion.div>
                  </div>
                  <p className="hero-disclaimer">Simulated execution. No real capital at risk.</p>
                </motion.div>

                <motion.div
                  className="hero-scroll-cue"
                  style={pageMotionEnabled ? { opacity: scrollCueOpacity } : undefined}
                  aria-hidden="true"
                >
                  <span>Scroll down</span>
                  <span className="hero-scroll-cue-arrow" aria-hidden="true" />
                </motion.div>
              </div>
            </div>
          </section>

          <div className="landing-wordmark-band" aria-hidden="true">
            <div className="section-shell">
              <ParticleText
                className="wordmark-particle-text"
                text="OctaTrade"
                fontFamily='Georgia, "Times New Roman", serif'
                fontWeight={400}
                fontSize="clamp(5rem, 19vw, 17rem)"
                color="#f2efe8"
                highlightColor="#c59b5c"
                particleSize={2}
                density={5}
                scatter={160}
                gatherDuration={1800}
                stagger={500}
                pointerRepel={36}
                repelRadius={110}
                idleDrift={0.5}
                trigger="mount"
                glow={false}
              />
            </div>
          </div>

          <section className="landing-expand" aria-label="Live market context">
            {/* Curtains + mediaZoom 1: the playing video is never re-clipped or rescaled while
                scrolling (both measured as stutter); smoothing 0 because Lenis already eases scroll. */}
            <ScrollExpand
              className="landing-scroll-expand"
              src="/videos/bullish-ascent-dim.mp4"
              mediaType="video"
              title="Watch the market move."
              scrollHint="Scroll"
              titleMode="grow"
              startWidth={compactLayout ? 82 : 44}
              startHeight={compactLayout ? 42 : 56}
              revealMode="curtains"
              curtainColor="#000"
              mediaZoom={1}
              scrollDistance={1.1}
              holdDistance={0.35}
              smoothing={0}
              overlayScrim={0.6}
              restDim={0.88}
              useWindowScroll
            >
              <p className="expand-kicker">LIVE MARKET CONTEXT</p>
              <h2>Every decision,<br />in full view.</h2>
              <p className="expand-copy">Quotes, orders and holdings move together, so you see the whole picture before you commit, with paper money only.</p>
            </ScrollExpand>
          </section>

          <div ref={afterHeroRef} className="landing-after-hero">
            <div className="after-hero-video-stage" aria-hidden="true">
              <video
                ref={afterHeroVideoRef}
                muted
                loop
                playsInline
                preload="auto"
              >
                <source src="/videos/bullish-ascent-graded.mp4" type="video/mp4" />
              </video>
              <div className="after-hero-video-overlay" />
            </div>

            <section id="platform" className="after-section after-intro" aria-labelledby="platform-heading">
              <div className="after-section-shell">
                <p className="after-section-index">01 / THE PRACTICE FLOOR</p>
                <div className="after-intro-grid">
                  <h2 id="platform-heading">
                    {pageMotionEnabled ? (
                      [
                        ["Read the market.", "#f2efe8"],
                        ["Test the decision.", "#f2efe8"],
                        ["Keep the lesson.", "#9d988f"]
                      ].map(([line, color], lineIndex) => (
                        <FoldText
                          key={line}
                          className="fold-line"
                          text={line}
                          splitBy="word"
                          hinge="top"
                          trigger="scroll"
                          delay={lineIndex * 0.3}
                          duration={0.8}
                          stagger={0.09}
                          ease="power3.out"
                          perspective={800}
                          creaseShading={0.5}
                          fontSize="inherit"
                          fontWeight="inherit"
                          color={color}
                        />
                      ))
                    ) : (
                      <>
                        Read the market.<br />
                        Test the decision.<br />
                        <span>Keep the lesson.</span>
                      </>
                    )}
                  </h2>
                  <div className="after-intro-copy">
                    <motion.p
                      initial={pageMotionEnabled ? { opacity: 0, y: 26 } : false}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={revealViewport}
                    >
                      OctaTrade turns research, simulated execution, and portfolio context into one continuous learning loop.
                    </motion.p>
                    <motion.div
                      className="after-status-line"
                      initial={pageMotionEnabled ? { opacity: 0, y: 26 } : false}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={revealViewport}
                    >
                      <span />
                      Live market context
                      <small>Paper execution only</small>
                    </motion.div>
                  </div>
                </div>
              </div>
            </section>

            <section id="capabilities" className="after-section after-capabilities" aria-labelledby="capabilities-heading">
              <div className="after-section-shell">
                <div className="after-heading-row">
                  <div>
                    <p className="after-section-index">02 / CONNECTED CAPABILITIES</p>
                    <motion.h2
                      id="capabilities-heading"
                      initial={pageMotionEnabled ? { opacity: 0, y: 40 } : false}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={revealViewport}
                    >
                      One place to build<br />market instinct.
                    </motion.h2>
                  </div>
                  <p>Every view keeps the decision in context—from the first search to the portfolio that follows.</p>
                </div>

                {pageMotionEnabled ? (
                  <ScrollStack
                    className="capability-stack"
                    useWindowScroll
                    smoothScroll={false}
                    itemDistance={120}
                    itemStackDistance={28}
                    stackPosition="18%"
                    scaleEndPosition="8%"
                    baseScale={0.9}
                    itemScale={0.025}
                  >
                    {capabilityCards.map((card) => (
                      <ScrollStackItem key={card.title} itemClassName="after-capability-card">
                        <CapabilityCardContent card={card} />
                      </ScrollStackItem>
                    ))}
                  </ScrollStack>
                ) : (
                  <div className="after-capability-grid">
                    {capabilityCards.map((card) => (
                      <article key={card.title} className="after-capability-card">
                        <CapabilityCardContent card={card} />
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section id="workflow" className="after-section after-workflow" aria-labelledby="workflow-heading">
              <div className="after-section-shell">
                <div className="after-heading-row">
                  <div>
                    <p className="after-section-index">03 / DECISION WORKFLOW</p>
                    <motion.h2
                      id="workflow-heading"
                      initial={pageMotionEnabled ? { opacity: 0, y: 40 } : false}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={revealViewport}
                    >
                      From signal<br />to understanding.
                    </motion.h2>
                  </div>
                  <p>The interface changes with the task. Your context stays connected through the full practice cycle.</p>
                </div>

                {pageMotionEnabled ? (
                  <div className="workflow-swap-grid">
                    <motion.div
                      className="workflow-swap-legend"
                      initial={{ opacity: 0, y: 26 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={revealViewport}
                    >
                      <ol>
                        {workflowSteps.map(([index, label]) => (
                          <li key={label}>
                            <span>{index}</span>
                            {label}
                          </li>
                        ))}
                      </ol>
                      <p>One cycle, repeated with every decision you practise.</p>
                    </motion.div>

                    <div className="workflow-swap-frame">
                      <CardSwap
                        className="workflow-swap"
                        width={compactLayout ? 280 : 520}
                        height={compactLayout ? 340 : 380}
                        cardDistance={compactLayout ? 28 : 60}
                        verticalDistance={compactLayout ? 34 : 64}
                        delay={1000}
                        duration={0.5}
                        skewAmount={4}
                        easing="linear"
                      >
                        {workflowSteps.map(([index, label, title, copy, tools]) => (
                          <Card key={label} customClass="workflow-swap-card">
                            <div className="workflow-card-top">
                              <span>{index}</span>
                              <small>{label} / DECISION STEP</small>
                            </div>
                            <h3>{title}</h3>
                            <p>{copy}</p>
                            <ul className="workflow-card-tags">
                              {tools.map((tool) => <li key={tool}>{tool}</li>)}
                            </ul>
                            <i aria-hidden="true" />
                          </Card>
                        ))}
                      </CardSwap>
                    </div>
                  </div>
                ) : (
                <div className="after-workflow-list">
                  {workflowSteps.map(([index, label, title, copy], stepIndex) => (
                    <motion.article
                      key={label}
                      initial={pageMotionEnabled ? { opacity: 0, x: stepIndex % 2 ? 32 : -32 } : false}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={revealViewport}
                    >
                      <span>{index}</span>
                      <p>{label}</p>
                      <h3>{title}</h3>
                      <small>{copy}</small>
                    </motion.article>
                  ))}
                </div>
                )}
              </div>
            </section>

            <section id="safety" className="after-section after-safety" aria-labelledby="safety-heading">
              <div className="after-section-shell after-safety-grid">
                <div>
                  <p className="after-section-index">04 / TRUST BOUNDARY</p>
                  <motion.h2
                    id="safety-heading"
                    initial={pageMotionEnabled ? { opacity: 0, y: 40 } : false}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={revealViewport}
                  >
                    Practice with<br /><span>clear limits.</span>
                  </motion.h2>
                  <p className="after-safety-lead">A deliberate boundary between learning the mechanics and putting capital at risk.</p>
                </div>

                <motion.div
                  className="trust-carousel-frame"
                  initial={pageMotionEnabled ? { opacity: 0, y: 28 } : false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={revealViewport}
                >
                  <DepthCarousel
                    className="trust-carousel"
                    ariaLabel="Practice boundaries"
                    items={trustSlides}
                    cardWidth={compactLayout ? 300 : 400}
                    sidePadding={compactLayout ? 0 : 120}
                    cardHeight={compactLayout ? 440 : 490}
                    radius={0}
                    tint="#000000"
                    depth={170}
                    spread={compactLayout ? 20 : 64}
                    tilt={16}
                    tiltDirection="right"
                    perspective={1500}
                    visibleCards={2}
                    falloff={0.3}
                    blur={3}
                    duration={800}
                    autoplay
                    autoplayDelay={4200}
                    loop
                    wheelNavigation={false}
                  />
                </motion.div>
              </div>
            </section>

            <section id="workspace" className="after-section after-workspace" aria-labelledby="workspace-heading">
              <div className="after-section-shell">
                <div className="after-heading-row">
                  <div>
                    <p className="after-section-index">05 / INSIDE THE WORKSPACE</p>
                    <motion.h2
                      id="workspace-heading"
                      initial={pageMotionEnabled ? { opacity: 0, y: 40 } : false}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={revealViewport}
                    >
                      Every view,<br />one practice floor.
                    </motion.h2>
                  </div>
                  <p>Drag the sphere to explore each part of OctaTrade, then open the view you want to try.</p>
                </div>

                <div className="workspace-menu-frame">
                  <InfiniteMenu
                    className="workspace-menu"
                    items={workspaceItems}
                    backgroundColor="#050505"
                    onNavigate={navigate}
                  />
                </div>
              </div>
            </section>

            <section className="after-section after-final-cta" aria-labelledby="cta-heading">
              <div className="after-section-shell">
                <p className="after-section-index">06 / BEGIN</p>
                <motion.h2
                  id="cta-heading"
                  initial={pageMotionEnabled ? { opacity: 0, scale: 0.96, y: 35 } : false}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={revealViewport}
                >
                  Build conviction<br /><span>before exposure.</span>
                </motion.h2>
                <p>Research the market. Test the mechanics. Learn without putting real capital on the line.</p>
                <motion.div
                  whileHover={pageMotionEnabled ? { y: -5, scale: 1.015 } : undefined}
                  whileTap={pageMotionEnabled ? { scale: 0.98 } : undefined}
                >
                  <Link to={primaryHref} className="after-cta-action">
                    Start paper trading
                    <span aria-hidden="true">↗</span>
                  </Link>
                </motion.div>
              </div>
            </section>

            <footer className="after-footer">
              <div className="after-section-shell after-footer-main">
                <div className="after-footer-brand">
                  <strong>OctaTrade</strong>
                  <p>A focused environment for paper trading and market learning.</p>
                </div>
                <nav aria-label="Footer navigation">
                  <a href="#platform">Platform</a>
                  <a href="#capabilities">Capabilities</a>
                  <a href="#workflow">Workflow</a>
                  <a href="#safety">Safety</a>
                </nav>
                <div className="after-footer-access">
                  <span>Already registered?</span>
                  <Link to="/login">Log in</Link>
                </div>
              </div>
              <div className="after-section-shell after-footer-legal">
                <span>© 2026 OctaTrade</span>
                <span>Paper trading only. OctaTrade does not provide investment advice.</span>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}
