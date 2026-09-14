import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/Button.jsx";

/**
 * ErrorBoundary — contains a render fault to one region.
 *
 * Purpose : a thrown render error in a single section used to unmount the whole
 *           route, leaving a blank page with no explanation. This keeps the rest
 *           of the page alive, states plainly that a section failed, and offers
 *           a retry that remounts just that subtree.
 * Input   : children, label (what failed, for the message), compact.
 * Output  : children, or the fallback panel.
 *
 * Implemented as a class because error boundaries have no hook equivalent.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, key: 0 };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surfaced in the console so the fault is diagnosable in development.
    console.error(`[OctaTrade] ${this.props.label || "A section"} failed to render`, error, info);
  }

  retry = () => {
    this.setState((current) => ({ error: null, key: current.key + 1 }));
  };

  render() {
    const { error, key } = this.state;
    const { children, label = "This section", compact = false } = this.props;

    if (!error) return <div key={key}>{children}</div>;

    return (
      <div
        className={`ot-state ot-state--error ${compact ? "is-compact" : ""}`}
        role="alert"
      >
        <span className="ot-state__glyph" aria-hidden="true">
          <AlertTriangle size={compact ? 16 : 20} strokeWidth={1.6} />
        </span>
        <div className="ot-state__text">
          <p className="ot-state__title">{label} could not be displayed</p>
          <p className="ot-state__desc">
            The rest of the page is unaffected. Retrying reloads just this
            section.
          </p>
        </div>
        <div className="ot-state__actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={this.retry}
            iconLeft={<RefreshCw size={14} aria-hidden="true" />}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }
}
