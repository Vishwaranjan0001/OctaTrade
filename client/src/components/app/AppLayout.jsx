import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

import { Sidebar } from "./Sidebar.jsx";
import { Topbar } from "./Topbar.jsx";
import { NAV_INDEX } from "./navigation.js";
import { useUiStore } from "../../store/uiStore.js";
import { useAuthStore } from "../../store/authStore.js";
import { useMe } from "../../hooks/queries.js";
import { useScrollReset } from "../SmoothScrollProvider.jsx";
import { useQueryClient } from "@tanstack/react-query";

/**
 * AppLayout — chrome for every authenticated page.
 *
 * Purpose : one shell so the 15 workspace surfaces share navigation, header,
 *           scroll reset and sign-out behaviour. The desktop sidebar is fixed;
 *           on mobile the same navigation becomes an animated drawer.
 * Input   : none — renders the matched child route through <Outlet/>.
 * Output  : the workspace frame with <main id="main"> as the skip-link target.
 */
export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const closeSidebar = useUiStore((state) => state.closeSidebar);
  const signOut = useAuthStore((state) => state.signOut);

  const { data: user } = useMe();

  /* Every client-side navigation lands at the top of the new page. */
  useScrollReset(location.pathname);

  /* Route match -> page title. Falls back to the path so unknown nested routes
     still announce something sensible. */
  const match =
    NAV_INDEX.find((item) => location.pathname === item.to) ||
    NAV_INDEX.find((item) => location.pathname.startsWith(`${item.to}/`));

  const title = match?.label || "Workspace";

  /* Keep the document title in step for tab identification and history. */
  useEffect(() => {
    document.title = `${title} — OctaTrade`;
  }, [title]);

  /* Escape closes the mobile drawer. */
  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeSidebar();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen, closeSidebar]);

  /**
   * Signs the user out.
   * Clears the bearer token, drops every cached account response so no data
   * from the previous session can be read, then returns to the landing page.
   */
  function onSignOut() {
    signOut();
    queryClient.clear();
    closeSidebar();
    navigate("/", { replace: true });
  }

  return (
    <div className="ot-app">
      <aside className="ot-sidebar" aria-label="Primary">
        <Sidebar user={user} onSignOut={onSignOut} />
      </aside>

      {/* Mobile drawer: same navigation, presented as a dialog. */}
      <AnimatePresence>
        {sidebarOpen ? (
          <div className="ot-drawer-layer">
            <motion.div
              className="ot-drawer__backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={closeSidebar}
            />
            <motion.div
              className="ot-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                type="button"
                className="ot-drawer__close"
                onClick={closeSidebar}
                aria-label="Close navigation"
              >
                <X size={16} aria-hidden="true" />
              </button>
              <Sidebar user={user} onSignOut={onSignOut} onNavigate={closeSidebar} />
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <div className="ot-app__main">
        <Topbar
          title={title}
          group={match?.group}
          onOpenNav={() => setSidebarOpen(true)}
        />
        <main className="ot-app__content" id="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
