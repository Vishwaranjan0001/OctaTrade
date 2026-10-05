import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { ChartPie, ListChecks, ScanSearch } from "lucide-react";

const chapters = [
  {
    title: "Search and study a security.",
    label: "Observe",
    description: "Find an exchange symbol, request its latest quote and build context before forming an opinion.",
    icon: ScanSearch,
    callout: "SEARCH / STUDY / DECIDE"
  },
  {
    title: "Review and place a paper order.",
    label: "Simulate",
    description: "Move deliberately through side, quantity and order type before submitting to the paper order lifecycle.",
    icon: ListChecks,
    callout: "SHAPE / REVIEW / SUBMIT"
  },
  {
    title: "Understand holdings and allocation.",
    label: "Interpret",
    description: "Connect orders to account holdings and portfolio structure, then carry that understanding into the next decision.",
    icon: ChartPie,
    callout: "ORDERS / HOLDINGS / ALLOCATION"
  }
];

export function StoryStep({ chapter, index }) {
  const Icon = chapter.icon;
  return (
    <motion.article
      key={chapter.label}
      className="story-chapter"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.35 }}
    >
      <p className="story-step-label"><Icon aria-hidden="true" />0{index + 1} — {chapter.label}</p>
      <h3>{chapter.title}</h3>
      <p>{chapter.description}</p>
      <span className="story-callout-copy">{chapter.callout}</span>
    </motion.article>
  );
}

export function MarketCoreVisual({ active = 0, scale = 1, animated = true }) {
  return (
    <motion.div className={`story-market story-market-state-${active}`} style={animated ? { scale } : undefined} aria-hidden="true">
      <div className="story-orbit story-orbit-a" />
      <div className="story-orbit story-orbit-b" />
      <motion.div className="story-market-core" layout>
        <div className="story-core-grid" />
        <div className="story-core-title"><span>OCTA / DECISION LOOP</span><span>0{active + 1}</span></div>
        <div className="story-core-object">
          <span className="core-axis core-axis-a" />
          <span className="core-axis core-axis-b" />
          <span className="core-axis core-axis-c" />
          <span className="core-node core-node-a" />
          <span className="core-node core-node-b" />
          <span className="core-node core-node-c" />
          <span className="core-center">{active === 0 ? "QUOTE" : active === 1 ? "ORDER" : "HOLDINGS"}</span>
        </div>
        <div className="story-core-footer"><span>RESEARCH</span><i /><span>EXECUTION</span><i /><span>PORTFOLIO</span></div>
      </motion.div>
      <div className="story-depth-label">Persistent market model</div>
    </motion.div>
  );
}

export function ScrollStory({ animated = false }) {
  const sectionRef = useRef(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const scale = useTransform(scrollYProgress, [0, 0.46, 1], [0.88, 1.08, 0.94]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.min(2, Math.floor(value * 3));
    setActive((previous) => previous === next ? previous : next);
  });

  return (
    <section ref={sectionRef} id="how-it-works" className={`story-section ${animated ? "story-pinned" : "story-flow"}`} aria-labelledby="story-heading">
      <div className="story-stage">
        <div className="story-layout">
          <div className="story-copy">
            <p id="story-heading" className="section-index">04 / DECISION LOOP</p>
            {animated ? (
              <AnimatePresence mode="wait">
                <StoryStep chapter={chapters[active]} index={active} />
              </AnimatePresence>
            ) : (
              <div className="story-static-chapters">
                {chapters.map((chapter, index) => <StoryStep key={chapter.label} chapter={chapter} index={index} />)}
              </div>
            )}
            {animated ? (
              <div className="story-progress" aria-label={`Step ${active + 1} of 3`}>
                {chapters.map((chapter, index) => <span key={chapter.label} className={active === index ? "active" : ""} />)}
              </div>
            ) : null}
          </div>
          <MarketCoreVisual active={animated ? active : 2} scale={scale} animated={animated} />
        </div>
      </div>
    </section>
  );
}
