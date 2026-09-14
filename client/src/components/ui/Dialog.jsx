import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useSmoothScroll } from "../SmoothScrollProvider.jsx";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dialog — the accessible modal used for order review, deposits and confirmations.
 *
 * Purpose : one correct dialog implementation. It traps focus, closes on
 *           Escape and on backdrop click, restores focus to the element that
 *           opened it, is announced as a modal dialog, and stops Lenis so the
 *           page behind cannot scroll while it is open.
 * Input   : open, onClose, title, description, footer, size, children.
 * Output  : a portalled modal, or null when closed.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  size = "md",
  children
}) {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);
  const lenis = useSmoothScroll();
  /* useId gives stable, collision-free ids without re-randomising per render. */
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descId = `${baseId}-desc`;

  /* Focus management: remember the trigger, move focus in, restore on close. */
  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;

    const node = panelRef.current;
    if (node) {
      const first = node.querySelector(FOCUSABLE);
      (first || node).focus({ preventScroll: true });
    }

    return () => {
      const target = previouslyFocused.current;
      if (target && typeof target.focus === "function") {
        target.focus({ preventScroll: true });
      }
    };
  }, [open]);

  /* Scroll lock. Lenis owns the scroll position, so it must be stopped too. */
  useEffect(() => {
    if (!open) return undefined;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    lenis?.stop();

    return () => {
      body.style.overflow = previousOverflow;
      lenis?.start();
    };
  }, [open, lenis]);

  const onKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key !== "Tab") return;

      /* Focus trap. */
      const node = panelRef.current;
      if (!node) return;

      const focusables = Array.from(node.querySelectorAll(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="ot-dialog-layer">
          <motion.div
            className="ot-dialog__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
          />
          <motion.div
            className={`ot-dialog ot-dialog--${size} ot-oct`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            ref={panelRef}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="ot-dialog__head">
              <div>
                {title ? (
                  <h2 className="ot-h4" id={titleId}>
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p className="ot-dialog__desc" id={descId}>
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="ot-dialog__close"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </header>

            <div className="ot-dialog__body" data-lenis-prevent>
              {children}
            </div>

            {footer ? <footer className="ot-dialog__foot">{footer}</footer> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
