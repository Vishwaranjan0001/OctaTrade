import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Moon, Pause, Play, Search, Sun } from "lucide-react";
import { useUiStore } from "../../store/uiStore.js";
import { useMotionPreference } from "../../hooks/useMotionPreference.js";
import { useResolvedTheme } from "../ThemeProvider.jsx";
import { normaliseSymbol } from "../../lib/format.js";

/**
 * Topbar — page identity plus the global controls.
 *
 * Purpose : carries the symbol jump-to search (the fastest path to any
 *           security), the theme switch, the motion pause control required by
 *           the brief, and the mobile navigation trigger.
 * Input   : title, group, onOpenNav.
 * Output  : the workspace header element.
 */
export function Topbar({ title, group, onOpenNav }) {
  const navigate = useNavigate();
  const [symbol, setSymbol] = useState("");
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const theme = useResolvedTheme();
  const { motionEnabled, toggleMotion, prefersReducedMotion } = useMotionPreference();

  /**
   * Submits the jump-to-symbol field.
   * Input : form submit event. Output: navigation to the security's page.
   * No lookup happens here — the destination page owns the real quote request.
   */
  function onSubmit(event) {
    event.preventDefault();
    const next = normaliseSymbol(symbol);
    if (!next) return;
    navigate(`/markets/${encodeURIComponent(next)}`);
    setSymbol("");
  }

  return (
    <header className="ot-topbar">
      <button
        type="button"
        className="ot-topbar__menu"
        onClick={onOpenNav}
        aria-label="Open navigation"
      >
        <Menu size={18} aria-hidden="true" />
      </button>

      <div className="ot-topbar__identity">
        {group ? <span className="ot-label">{group}</span> : null}
        <h1 className="ot-topbar__title">{title}</h1>
      </div>

      <form className="ot-topbar__search" onSubmit={onSubmit} role="search">
        <label className="ot-sr" htmlFor="topbar-symbol">
          Jump to symbol
        </label>
        <Search size={15} aria-hidden="true" className="ot-topbar__search-icon" />
        <input
          id="topbar-symbol"
          className="ot-topbar__search-input ot-mono"
          value={symbol}
          onChange={(event) => setSymbol(event.target.value)}
          placeholder="Symbol, e.g. TCS.NS"
          autoComplete="off"
          spellCheck="false"
          enterKeyHint="search"
        />
      </form>

      <div className="ot-topbar__tools">
        <button
          type="button"
          className="ot-icon-btn"
          onClick={toggleMotion}
          aria-pressed={!motionEnabled}
          title={
            prefersReducedMotion
              ? "Your system already requests reduced motion"
              : motionEnabled
                ? "Pause interface motion"
                : "Resume interface motion"
          }
        >
          {motionEnabled ? (
            <Pause size={15} aria-hidden="true" />
          ) : (
            <Play size={15} aria-hidden="true" />
          )}
          <span className="ot-sr">
            {motionEnabled ? "Pause interface motion" : "Resume interface motion"}
          </span>
        </button>

        <button
          type="button"
          className="ot-icon-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? (
            <Sun size={15} aria-hidden="true" />
          ) : (
            <Moon size={15} aria-hidden="true" />
          )}
          <span className="ot-sr">
            {theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          </span>
        </button>
      </div>
    </header>
  );
}
