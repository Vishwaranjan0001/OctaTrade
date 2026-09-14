/**
 * The OctaTrade mark.
 *
 * Purpose : the identity's single geometric idea — a regular octagon (eight
 *           market sides) with one heavier "active" edge and a centre axis,
 *           reading as a market ring seen straight on. Inline SVG so it costs
 *           no request, scales cleanly and inherits currentColor.
 * Input   : size (px), withWordmark, className.
 * Output  : <span> containing the mark and optionally the wordmark.
 */
export function Logo({ size = 26, withWordmark = true, className = "" }) {
  return (
    <span className={`ot-logo ${className}`.trim()}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        focusable="false"
        className="ot-logo__mark"
      >
        {/* Outer octagon: the market ring. */}
        <path
          d="M11.03 1.5h9.94l6.53 6.53v9.94l-6.53 6.53h-9.94L4.5 17.97V8.03z"
          transform="translate(0 1)"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
          opacity="0.55"
        />
        {/* The active edge — the side of the market currently in play. */}
        <path
          d="M20.97 2.5 27.5 9.03"
          transform="translate(0 1)"
          stroke="var(--accent)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Inner octagon, rotated 22.5°: the depth layer. */}
        <path
          d="M16 8.4l5.37 3.1v6.2L16 20.8l-5.37-3.1v-6.2z"
          transform="translate(0 1)"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
          opacity="0.9"
        />
        {/* Centre axis mark. */}
        <circle cx="16" cy="17" r="1.5" fill="var(--accent)" />
      </svg>
      {withWordmark ? (
        <span className="ot-logo__word">
          Octa<span className="ot-logo__word-b">Trade</span>
        </span>
      ) : null}
    </span>
  );
}
