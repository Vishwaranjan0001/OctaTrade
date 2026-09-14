import { AlertTriangle, Inbox, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { ApiError } from "../../lib/apiClient.js";
import { Button } from "./Button.jsx";

/**
 * EmptyState — a designed answer to "there is nothing here yet".
 *
 * Purpose : the product never fills a gap with invented data, so empty states
 *           carry real weight: they must explain what the surface will show
 *           and what the user can do next. Rendered as a <div role="status">
 *           so screen readers announce it instead of finding an empty region.
 * Input   : icon, title, description, action, secondaryAction, compact.
 * Output  : announced empty region.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  children
}) {
  return (
    <div
      className={`ot-state ot-state--empty ${compact ? "is-compact" : ""}`.trim()}
      role="status"
    >
      <span className="ot-state__glyph" aria-hidden="true">
        <Icon size={compact ? 16 : 20} strokeWidth={1.6} />
      </span>
      <div className="ot-state__text">
        <p className="ot-state__title">{title}</p>
        {description ? <p className="ot-state__desc">{description}</p> : null}
        {children}
      </div>
      {action || secondaryAction ? (
        <div className="ot-state__actions">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Turns any thrown error into human copy.
 *
 * Purpose : the backend emits several shapes and several failure modes
 *           (transport down, 401, 404, 502 from the upstream quote feed).
 *           Views should not each interpret them.
 * Input   : an Error (usually ApiError) and an optional subject noun.
 * Output  : { title, description, icon, canRetry }
 */
export function describeError(error, subject = "this data") {
  if (!error) {
    return { title: "Something went wrong", description: null, icon: AlertTriangle, canRetry: true };
  }

  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return {
        title: "Cannot reach the OctaTrade API",
        description:
          "The request did not leave the browser or the server did not answer. Confirm the API server is running, then retry.",
        icon: WifiOff,
        canRetry: true
      };
    }

    if (error.isUnauthorized) {
      return {
        title: "Session expired",
        description: "Sign in again to continue.",
        icon: AlertTriangle,
        canRetry: false
      };
    }

    if (error.isUpstreamFailure) {
      return {
        title: "Market data provider did not respond",
        description:
          "The quote endpoint could not reach its upstream data provider. This is usually temporary — retry in a moment.",
        icon: AlertTriangle,
        canRetry: true
      };
    }

    if (error.isNotFound) {
      return {
        title: "Not found",
        description: error.message,
        icon: AlertTriangle,
        canRetry: false
      };
    }

    return {
      title: `Could not load ${subject}`,
      description: error.message,
      icon: AlertTriangle,
      canRetry: error.status >= 500
    };
  }

  return {
    title: `Could not load ${subject}`,
    description: error.message || null,
    icon: AlertTriangle,
    canRetry: true
  };
}

/**
 * ErrorState — the standard failure surface.
 * Input  : error, subject, onRetry, compact.
 * Output : an alert region with a retry affordance when retrying can help.
 */
export function ErrorState({ error, subject, onRetry, compact = false }) {
  const { title, description, icon: Icon, canRetry } = describeError(error, subject);

  return (
    <div
      className={`ot-state ot-state--error ${compact ? "is-compact" : ""}`.trim()}
      role="alert"
    >
      <span className="ot-state__glyph" aria-hidden="true">
        <Icon size={compact ? 16 : 20} strokeWidth={1.6} />
      </span>
      <div className="ot-state__text">
        <p className="ot-state__title">{title}</p>
        {description ? <p className="ot-state__desc">{description}</p> : null}
      </div>
      {canRetry && onRetry ? (
        <div className="ot-state__actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            iconLeft={<RefreshCw size={14} aria-hidden="true" />}
          >
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * DataUnavailable — used where a backend capability does not exist yet.
 *
 * Purpose : the brief forbids inventing series to fill a chart. Where the API
 *           has no endpoint (historical OHLC, benchmark series, portfolio time
 *           series) this component states exactly what is missing and what
 *           would need to be connected. It is deliberately plain, not an error.
 */
export function DataUnavailable({ title, description, requirement, compact = false }) {
  return (
    <div
      className={`ot-state ot-state--unavailable ${compact ? "is-compact" : ""}`.trim()}
      role="status"
    >
      <div className="ot-state__text">
        <p className="ot-state__title">{title}</p>
        {description ? <p className="ot-state__desc">{description}</p> : null}
        {requirement ? (
          <p className="ot-state__req ot-mono">
            <span className="ot-label">Requires</span> {requirement}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Inline spinner for buttons and table cells. */
export function InlineLoader({ label = "Loading" }) {
  return (
    <span className="ot-inline-loader" role="status">
      <Loader2 size={13} aria-hidden="true" />
      <span className="ot-sr">{label}</span>
    </span>
  );
}

/**
 * Skeleton — a sized placeholder.
 * Purpose : reserve the exact final box so nothing shifts when data lands
 *           (the brief requires no layout shift). Width/height are explicit.
 */
export function Skeleton({ width = "100%", height = 14, className = "" }) {
  return (
    <span
      className={`ot-skeleton ${className}`.trim()}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/** A block of skeleton rows matching table row height. */
export function SkeletonRows({ rows = 4, columns = 4 }) {
  return (
    <div className="ot-skeleton-rows" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div className="ot-skeleton-rows__row" key={rowIndex}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <Skeleton
              key={columnIndex}
              height={12}
              width={columnIndex === 0 ? "34%" : "16%"}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Loading region for panels, with an accessible busy announcement. */
export function LoadingState({ label = "Loading", rows = 4, columns = 4 }) {
  return (
    <div className="ot-state ot-state--loading" role="status" aria-busy="true">
      <span className="ot-sr">{label}</span>
      <SkeletonRows rows={rows} columns={columns} />
    </div>
  );
}
