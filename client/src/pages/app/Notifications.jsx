import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BellOff, CheckCheck, RefreshCw } from "lucide-react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { PageHeader } from "../../components/app/PageHeader.jsx";
import { Panel, PanelBody, PanelHeader } from "../../components/ui/Panel.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States.jsx";
import { SourceNotice } from "../../components/app/CoverageNotice.jsx";
import { useAccountEvents } from "../../hooks/useAccountEvents.js";
import { formatRelative } from "../../lib/format.js";

/*
  Read state is a local preference: the API stores no notification records, so
  "seen" cannot be synced. Only event ids are kept.
*/
const useReadStore = create(
  persist(
    (set, get) => ({
      readIds: [],
      markRead(id) {
        if (get().readIds.includes(id)) return;
        set({ readIds: [...get().readIds, id] });
      },
      markAllRead(ids) {
        set({ readIds: Array.from(new Set([...get().readIds, ...ids])) });
      },
      reset() {
        set({ readIds: [] });
      }
    }),
    { name: "octatrade.notifications.read", version: 1 }
  )
);

/**
 * Notifications — what changed on the account.
 *
 * Purpose : surface the events worth knowing about — order outcomes and wallet
 *           movements — drawn from real records. The API has no notifications
 *           resource, so this page never fabricates alerts, badges or system
 *           messages; it presents account events and says where they come from.
 * Input   : none.
 * Output  : the notifications page.
 */
export default function Notifications() {
  const { events, isLoading, isFetching, error, refetch } = useAccountEvents();
  const readIds = useReadStore((state) => state.readIds);
  const markRead = useReadStore((state) => state.markRead);
  const markAllRead = useReadStore((state) => state.markAllRead);

  /* Only outcomes are notification-worthy; a plain debit is ledger detail. */
  const notable = useMemo(
    () =>
      events.filter((event) =>
        ["FILLED", "REJECTED", "CANCELLED", "DEPOSIT", "NEW"].includes(event.status)
      ),
    [events]
  );

  const unreadCount = notable.filter((event) => !readIds.includes(event.id)).length;

  return (
    <div className="ot-stack">
      <PageHeader
        title="Notifications"
        source="Derived from account records"
        lede="Order outcomes and wallet movements from your own account history."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={refetch}
              loading={isFetching}
              iconLeft={<RefreshCw size={14} aria-hidden="true" />}
            >
              Refresh
            </Button>
            {unreadCount > 0 ? (
              <Button
                size="sm"
                onClick={() => markAllRead(notable.map((event) => event.id))}
                iconLeft={<CheckCheck size={14} aria-hidden="true" />}
              >
                Mark all read
              </Button>
            ) : null}
          </>
        }
      />

      <Panel>
        <PanelHeader
          title="Inbox"
          meta={unreadCount > 0 ? `${unreadCount} unread` : "All read"}
        />
        <PanelBody>
          {isLoading ? (
            <LoadingState label="Loading notifications" rows={4} columns={2} />
          ) : error ? (
            <ErrorState error={error} subject="your notifications" onRetry={refetch} />
          ) : notable.length === 0 ? (
            <EmptyState
              icon={BellOff}
              title="Nothing to report"
              description="When an order executes or is rejected, or funds move in your wallet, it will be listed here."
              action={
                <Button as={Link} to="/terminal" size="sm">
                  Open the terminal
                </Button>
              }
            />
          ) : (
            <ul className="ot-notify">
              {notable.map((event) => {
                const unread = !readIds.includes(event.id);
                return (
                  <li
                    className={`ot-notify__item ${unread ? "is-unread" : ""} is-${event.tone}`}
                    key={event.id}
                  >
                    <span className="ot-notify__dot" aria-hidden="true" />
                    <div className="ot-notify__body">
                      <Link to={event.href} className="ot-notify__title">
                        {event.title}
                        {event.symbol ? (
                          <span className="ot-mono"> · {event.symbol}</span>
                        ) : null}
                      </Link>
                      <p className="ot-notify__detail ot-mono">{event.detail}</p>
                      <p className="ot-notify__time">{formatRelative(event.at)}</p>
                    </div>
                    {unread ? (
                      <button
                        type="button"
                        className="ot-notify__read"
                        onClick={() => markRead(event.id)}
                      >
                        Mark read
                      </button>
                    ) : (
                      <span className="ot-notify__read is-done">Read</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </PanelBody>
      </Panel>

      <SourceNotice>
        OctaTrade does not have a notifications endpoint, so there is no push or
        email delivery and read state is stored in this browser only.
      </SourceNotice>
    </div>
  );
}
