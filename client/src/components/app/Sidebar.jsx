import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Logo } from "../ui/Logo.jsx";
import { NAV_GROUPS } from "./navigation.js";

/**
 * Sidebar — the workspace navigation.
 *
 * Purpose : one nav definition rendered for both the fixed desktop rail and
 *           the mobile drawer. Uses a real <nav> with grouped lists so screen
 *           readers get the same structure sighted users see, and NavLink's
 *           aria-current marks the active route.
 * Input   : onNavigate (called after any link activation so the mobile drawer
 *           can close), user, onSignOut.
 * Output  : navigation markup.
 */
export function Sidebar({ onNavigate, user, onSignOut }) {
  const initials = (user?.name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="ot-sidebar__inner">
      <div className="ot-sidebar__brand">
        <NavLink to="/dashboard" onClick={onNavigate} aria-label="OctaTrade dashboard">
          <Logo size={24} />
        </NavLink>
        <span className="ot-sidebar__env ot-label">Paper</span>
      </div>

      <nav className="ot-sidebar__nav" aria-label="Workspace">
        {NAV_GROUPS.map((group) => (
          <div className="ot-sidebar__group" key={group.id}>
            <p className="ot-sidebar__group-label ot-label" id={`nav-group-${group.id}`}>
              {group.label}
            </p>
            <ul aria-labelledby={`nav-group-${group.id}`}>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `ot-navlink ${isActive ? "is-active" : ""}`
                      }
                      onClick={onNavigate}
                      end={item.to === "/dashboard"}
                    >
                      <Icon size={15} strokeWidth={1.7} aria-hidden="true" />
                      <span>{item.label}</span>
                      <span className="ot-navlink__edge" aria-hidden="true" />
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="ot-sidebar__foot">
        <div className="ot-sidebar__user">
          <span className="ot-sidebar__avatar ot-mono" aria-hidden="true">
            {initials || "—"}
          </span>
          <span className="ot-sidebar__user-text">
            <span className="ot-sidebar__user-name">{user?.name || "Account"}</span>
            <span className="ot-sidebar__user-mail">{user?.email || ""}</span>
          </span>
        </div>
        <button type="button" className="ot-sidebar__signout" onClick={onSignOut}>
          <LogOut size={14} aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
