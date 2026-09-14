import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

/**
 * The single button component.
 *
 * Purpose : one implementation of the octagon-cut control so every action in
 *           the product shares hit area, focus ring, disabled and loading
 *           behaviour. Renders a <button> by default, or any element via `as`
 *           (used for react-router <Link>).
 * Input   : variant "primary"|"secondary"|"ghost"|"danger"|"quiet",
 *           size "sm"|"md"|"lg", loading, block, iconLeft/iconRight, ...rest
 * Output  : an accessible control. While `loading` it stays focusable but is
 *           disabled and announces busy state.
 */
export const Button = forwardRef(function Button(
  {
    as: Component = "button",
    variant = "primary",
    size = "md",
    loading = false,
    block = false,
    disabled = false,
    iconLeft = null,
    iconRight = null,
    className = "",
    children,
    ...rest
  },
  ref
) {
  const isNativeButton = Component === "button";

  return (
    <Component
      ref={ref}
      className={[
        "ot-btn",
        `ot-btn--${variant}`,
        `ot-btn--${size}`,
        block ? "ot-btn--block" : "",
        loading ? "is-loading" : "",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={isNativeButton ? disabled || loading : undefined}
      aria-disabled={!isNativeButton && (disabled || loading) ? true : undefined}
      aria-busy={loading || undefined}
      type={isNativeButton ? rest.type || "button" : rest.type}
      {...rest}
    >
      {loading ? (
        <Loader2 size={15} className="ot-btn__spinner" aria-hidden="true" />
      ) : (
        iconLeft
      )}
      <span className="ot-btn__label">{children}</span>
      {iconRight}
    </Component>
  );
});
