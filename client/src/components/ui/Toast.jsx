import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { create } from "zustand";

/*
  Toasts report the outcome of real API calls — an order accepted, a deposit
  credited, a symbol added to the watchlist. They never invent events.
*/

let nextId = 0;

export const useToastStore = create((set, get) => ({
  toasts: [],

  push({ tone = "info", title, description, ttl = 5200 }) {
    const id = ++nextId;
    set({ toasts: [...get().toasts, { id, tone, title, description }] });
    if (ttl) {
      window.setTimeout(() => get().dismiss(id), ttl);
    }
    return id;
  },

  dismiss(id) {
    set({ toasts: get().toasts.filter((toast) => toast.id !== id) });
  }
}));

/**
 * Imperative helpers so callers do not need the hook inside event handlers.
 * Purpose/Input/Output: toast(tone, title, description) -> toast id.
 */
export const toast = {
  success: (title, description) =>
    useToastStore.getState().push({ tone: "success", title, description }),
  error: (title, description) =>
    useToastStore.getState().push({ tone: "error", title, description, ttl: 7000 }),
  info: (title, description) =>
    useToastStore.getState().push({ tone: "info", title, description })
};

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };

/**
 * Toaster — the live region that renders queued toasts.
 * Purpose : announce outcomes to assistive tech (aria-live polite) and give
 *           sighted users a dismissible confirmation anchored out of the way.
 */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div className="ot-toaster" role="region" aria-label="Notifications">
      <div aria-live="polite" aria-atomic="false" className="ot-toaster__stack">
        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const Icon = ICONS[item.tone] || Info;
            return (
              <motion.div
                key={item.id}
                className={`ot-toast ot-toast--${item.tone} ot-oct-sm`}
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                layout
              >
                <Icon size={16} aria-hidden="true" className="ot-toast__icon" />
                <div className="ot-toast__text">
                  <p className="ot-toast__title">{item.title}</p>
                  {item.description ? (
                    <p className="ot-toast__desc">{item.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="ot-toast__close"
                  onClick={() => dismiss(item.id)}
                  aria-label="Dismiss notification"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
