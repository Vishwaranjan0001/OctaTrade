import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity as ActivityIcon, RefreshCw } from "lucide-react";

import { PageHeader } from "../../components/app/PageHeader.jsx";
import { Panel, PanelBody, PanelHeader } from "../../components/ui/Panel.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { SegmentedControl } from "../../components/ui/Field.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States.jsx";
import { SourceNotice } from "../../components/app/CoverageNotice.jsx";
import { useAccountEvents } from "../../hooks/useAccountEvents.js";
import { formatDateTime, formatRelative } from "../../lib/format.js";

/**
 * Activity — the account's chronological history.
 *
 * Purpose : one timeline of everything that has happened on the account, built
 *           by merging real orders with real wallet movements. Useful for
 *           following how a single order propagates into the ledger.
 * Input   : none.
 * Output  : the activity page.
 */
export default function Activity() {
  const { events, isLoading, isFetching, error, refetch } = useAccountEvents();
  const [filter, setFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (filter === "ALL") return events;
    return events.filter((event) => event.kind === filter);
  }, [events, filter]);

  return (
    <div className="ot-stack">
      <PageHeader
        title="Activity"
        source="Orders + wallet transactions"
        lede="A single timeline assembled from your order records and wallet ledger. Every entry corresponds to a stored record — nothing here is generated."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={refetch}
            loading={isFetching}
            iconLeft={<RefreshCw size={14} aria-hidden="true" />}
          >
            Refresh
          </Button>
        }
      />

      <Panel>
        <PanelHeader
          title="Timeline"
          meta={`${filtered.length} event${filtered.length === 1 ? "" : "s"}`}
          actions={
            <div className="ot-filter">
              <SegmentedControl
                label="Filter activity"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "ALL", label: "All" },
                  { value: "ORDER", label: "Orders" },
                  { value: "WALLET", label: "Wallet" }
                ]}
              />
            </div>
          }
        />
        <PanelBody>
          {isLoading ? (
            <LoadingState label="Loading activity" rows={6} columns={3} />
          ) : error ? (
            <ErrorState error={error} subject="your activity" onRetry={refetch} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ActivityIcon}
              title={events.length === 0 ? "No activity yet" : "Nothing matches this filter"}
              description={
                events.length === 0
                  ? "Your first order or deposit will appear here, along with the wallet movements it produces."
                  : "Try a different filter to see the rest of your history."
              }
              action={
                events.length === 0 ? (
                  <Button as={Link} to="/terminal" size="sm">
                    Open the terminal
                  </Button>
                ) : null
              }
            />
          ) : (
            <ol className="ot-timeline">
              {filtered.map((event) => (
                <li className={`ot-timeline__item is-${event.tone}`} key={event.id}>
                  <span className="ot-timeline__glyph" aria-hidden="true" />
                  <div className="ot-timeline__body">
                    <div className="ot-timeline__head">
                      <Link to={event.href} className="ot-timeline__title">
                        {event.title}
                      </Link>
                      <span className="ot-timeline__kind ot-label">{event.kind}</span>
                    </div>
                    <p className="ot-timeline__detail ot-mono">{event.detail}</p>
                    <p className="ot-timeline__time">
                      <time dateTime={event.at || undefined}>
                        {formatDateTime(event.at)}
                      </time>
                      <span className="ot-timeline__ago">{formatRelative(event.at)}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </PanelBody>
      </Panel>

      <SourceNotice>
        OctaTrade has no separate events endpoint. This timeline is assembled in
        the browser from <span className="ot-mono">GET /api/orders</span> and{" "}
        <span className="ot-mono">GET /api/wallet/transactions</span>.
      </SourceNotice>
    </div>
  );
}
