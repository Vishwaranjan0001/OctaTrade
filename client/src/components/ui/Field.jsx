import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * TextField — a labelled text input.
 *
 * Purpose : every form field in the product gets a real <label for>, a
 *           described-by error message and a visible focus ring, without each
 *           form re-implementing them.
 * Input   : label, error, hint, suffix, id (optional), ...input props.
 * Output  : field markup wired for screen readers (aria-invalid +
 *           aria-describedby pointing at the hint and the error).
 */
export const TextField = forwardRef(function TextField(
  { label, error, hint, suffix, id, className = "", inputClassName = "", ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id || autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className={`ot-field ${error ? "has-error" : ""} ${className}`.trim()}>
      <label className="ot-field__label" htmlFor={fieldId}>
        {label}
      </label>
      <div className="ot-field__control">
        <input
          ref={ref}
          id={fieldId}
          className={`ot-input ${inputClassName}`.trim()}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          {...rest}
        />
        {suffix ? <span className="ot-field__suffix ot-label">{suffix}</span> : null}
      </div>
      {hint && !error ? (
        <p className="ot-field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="ot-field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

/**
 * PasswordField — TextField with a visibility toggle.
 *
 * Purpose : the auth brief requires a password visibility control. The toggle
 *           is a real button with an accessible name that changes with state,
 *           and it never submits the form.
 */
export const PasswordField = forwardRef(function PasswordField(
  { label, error, hint, id, autoComplete = "current-password", ...rest },
  ref
) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const fieldId = id || autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className={`ot-field ${error ? "has-error" : ""}`}>
      <label className="ot-field__label" htmlFor={fieldId}>
        {label}
      </label>
      <div className="ot-field__control">
        <input
          ref={ref}
          id={fieldId}
          type={visible ? "text" : "password"}
          className="ot-input ot-input--password"
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          {...rest}
        />
        <button
          type="button"
          className="ot-field__reveal"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>
      {hint && !error ? (
        <p className="ot-field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="ot-field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

/** Segmented control used for BUY/SELL and for theme selection. */
export function SegmentedControl({ label, options, value, onChange, name, tone }) {
  return (
    <div className="ot-segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={[
              "ot-segmented__option",
              active ? "is-active" : "",
              active && tone ? `is-${tone}` : "",
              active && option.tone ? `is-${option.tone}` : ""
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onChange(option.value)}
            name={name}
          >
            {option.icon ? option.icon : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
