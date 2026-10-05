import SlickSlider from "react-slick";
import "slick-carousel/slick/slick.css";
import { ArrowLeft, ArrowRight, BookOpenCheck, ChartNoAxesCombined, Layers3, ScanSearch } from "lucide-react";

const capabilities = [
  {
    index: "01",
    title: "Study the instrument, not the noise.",
    copy: "Move from symbol search to a focused security view with the latest quote and research context supplied by the platform.",
    eyebrow: "Market study",
    icon: ScanSearch,
    labels: ["Search exchange symbols", "Latest quote", "Historical data unavailable"],
    visual: "quote"
  },
  {
    index: "02",
    title: "Turn a thesis into a deliberate order.",
    copy: "Review the side, quantity and order type before a paper order enters its simulated lifecycle.",
    eyebrow: "Paper execution",
    icon: Layers3,
    labels: ["Review required", "Order lifecycle", "Virtual wallet"],
    visual: "order"
  },
  {
    index: "03",
    title: "Read the portfolio as a system.",
    copy: "Connect holdings, allocation and account activity in one calm workspace built for reflection.",
    eyebrow: "Portfolio context",
    icon: ChartNoAxesCombined,
    labels: ["Account holdings", "Portfolio API", "Allocation view"],
    visual: "portfolio"
  },
  {
    index: "04",
    title: "Practice with transparent guardrails.",
    copy: "Keep learning separate from live capital with protected account access and explicit paper-trading language.",
    eyebrow: "Learning loop",
    icon: BookOpenCheck,
    labels: ["Authentication protected", "Paper trading only", "No investment advice"],
    visual: "safety"
  }
];

const Slider = SlickSlider.default ?? SlickSlider;

function CarouselArrow({ direction, onClick }) {
  const Icon = direction === "next" ? ArrowRight : ArrowLeft;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`carousel-arrow carousel-arrow-${direction}`}
      aria-label={`${direction === "next" ? "Next" : "Previous"} capability`}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}

function CapabilityVisual({ type }) {
  return (
    <div className={`capability-visual capability-visual-${type}`} aria-hidden="true">
      <div className="capability-visual-header">
        <span>OCTA / {type.toUpperCase()}</span>
        <span>INTERFACE MAP</span>
      </div>
      <div className="capability-orbit"><span /><span /><span /></div>
      <div className="capability-scanline" />
      <div className="capability-visual-label">{type === "quote" ? "LATEST QUOTE" : type === "order" ? "ORDER REVIEW" : type === "portfolio" ? "ACCOUNT HOLDINGS" : "PROTECTED ACCESS"}</div>
    </div>
  );
}

export function CapabilityCarousel() {
  const settings = {
    accessibility: true,
    arrows: true,
    dots: true,
    infinite: false,
    speed: 520,
    slidesToShow: 1,
    slidesToScroll: 1,
    swipe: true,
    swipeToSlide: true,
    touchMove: true,
    adaptiveHeight: false,
    nextArrow: <CarouselArrow direction="next" />,
    prevArrow: <CarouselArrow direction="previous" />,
    responsive: [
      {
        breakpoint: 640,
        settings: {
          arrows: false,
          speed: 360
        }
      }
    ]
  };

  return (
    <div className="capability-carousel" role="region" aria-roledescription="carousel" aria-label="Platform capabilities">
      <Slider {...settings}>
        {capabilities.map((capability) => {
          const Icon = capability.icon;
          return (
            <article key={capability.index} className="capability-slide">
              <div className="capability-copy">
                <div className="capability-kicker"><Icon aria-hidden="true" /><span>{capability.eyebrow}</span></div>
                <p className="capability-index">{capability.index} / 04</p>
                <h3>{capability.title}</h3>
                <p className="capability-description">{capability.copy}</p>
                <ul aria-label="Included capability labels">
                  {capability.labels.map((label) => <li key={label}>{label}</li>)}
                </ul>
              </div>
              <CapabilityVisual type={capability.visual} />
            </article>
          );
        })}
      </Slider>
    </div>
  );
}
