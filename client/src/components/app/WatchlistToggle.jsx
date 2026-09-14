import { Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/Button.jsx";
import { useWatchlistStore } from "../../store/watchlistStore.js";
import { toast } from "../ui/Toast.jsx";
import { normaliseSymbol } from "../../lib/format.js";

/**
 * WatchlistToggle — add or remove a symbol from the device watchlist.
 *
 * Purpose : one control for a capability the backend does not provide, so the
 *           copy states that the list lives on this device.
 * Input   : symbol, size, variant.
 * Output  : a toggle button; confirms the change with a toast.
 */
export function WatchlistToggle({ symbol, size = "sm", variant = "secondary" }) {
  const normalised = normaliseSymbol(symbol);
  const symbols = useWatchlistStore((state) => state.symbols);
  const toggle = useWatchlistStore((state) => state.toggle);

  const watching = symbols.includes(normalised);

  function onToggle() {
    toggle(normalised);
    if (watching) {
      toast.info(`${normalised} removed`, "Removed from your watchlist on this device.");
    } else {
      toast.success(`${normalised} added`, "Saved to your watchlist on this device.");
    }
  }

  if (!normalised) return null;

  return (
    <Button
      variant={watching ? "quiet" : variant}
      size={size}
      onClick={onToggle}
      aria-pressed={watching}
      iconLeft={
        watching ? (
          <EyeOff size={14} aria-hidden="true" />
        ) : (
          <Eye size={14} aria-hidden="true" />
        )
      }
    >
      {watching ? "Watching" : "Watch"}
    </Button>
  );
}
