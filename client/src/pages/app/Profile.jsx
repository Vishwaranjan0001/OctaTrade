import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, ShieldCheck } from "lucide-react";

import { PageHeader } from "../../components/app/PageHeader.jsx";
import { Panel, PanelBody, PanelHeader } from "../../components/ui/Panel.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Metric } from "../../components/ui/Metric.jsx";
import { ErrorState, LoadingState } from "../../components/ui/States.jsx";
import { SourceNotice } from "../../components/app/CoverageNotice.jsx";
import { useMe, useOrders, usePortfolioValuation, useWallet } from "../../hooks/queries.js";
import { useAuthStore } from "../../store/authStore.js";
import { formatPaise, shortId } from "../../lib/format.js";

/**
 * Profile — account identity.
 *
 * Purpose : show exactly the identity fields the API returns from
 *           GET /api/auth/me (id, name, email) plus a factual summary of the
 *           account. There is no profile-update endpoint, so no editable form
 *           is offered — presenting one that could not save would be a lie.
 * Input   : none.
 * Output  : the profile page.
 */
export default function Profile() {
  const me = useMe();
  const wallet = useWallet();
  const orders = useOrders();
  const valuation = usePortfolioValuation();
  const signOut = useAuthStore((state) => state.signOut);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  function onSignOut() {
    signOut();
    queryClient.clear();
    navigate("/", { replace: true });
  }

  return (
    <div className="ot-stack">
      <PageHeader
        title="Profile"
        source="GET /api/auth/me"
        lede="The identity attached to this paper-trading account."
      />

      <div className="ot-grid ot-grid--primary">
        <Panel>
          <PanelHeader title="Identity" meta="Authentication protected" />
          <PanelBody>
            {me.isLoading ? (
              <LoadingState label="Loading profile" rows={3} columns={2} />
            ) : me.error ? (
              <ErrorState error={me.error} subject="your profile" onRetry={me.refetch} />
            ) : (
              <dl className="ot-kv">
                <div className="ot-kv__row">
                  <dt className="ot-kv__key">Name</dt>
                  <dd className="ot-kv__val">{me.data?.name ?? "—"}</dd>
                </div>
                <div className="ot-kv__row">
                  <dt className="ot-kv__key">Email</dt>
                  <dd className="ot-kv__val">{me.data?.email ?? "—"}</dd>
                </div>
                <div className="ot-kv__row">
                  <dt className="ot-kv__key">Account ID</dt>
                  <dd className="ot-kv__val" title={me.data?.id}>
                    {shortId(me.data?.id)}
                  </dd>
                </div>
                <div className="ot-kv__row">
                  <dt className="ot-kv__key">Session</dt>
                  <dd className="ot-kv__val">Bearer token</dd>
                </div>
                <div className="ot-kv__row">
                  <dt className="ot-kv__key">Account type</dt>
                  <dd className="ot-kv__val">Paper trading</dd>
                </div>
              </dl>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Account summary" />
          <div className="ot-metric-row">
            <Metric
              label="Wallet available"
              value={formatPaise(wallet.data?.availableBalancePaise)}
              loading={wallet.isLoading}
            />
            <Metric
              label="Positions"
              value={valuation.isLoading ? null : String(valuation.totalCount)}
              loading={valuation.isLoading}
            />
            <Metric
              label="Orders placed"
              value={orders.isLoading ? null : String((orders.data ?? []).length)}
              loading={orders.isLoading}
            />
          </div>
          <PanelBody>
            <SourceNotice>
              Profile details cannot be changed from here. The OctaTrade API
              exposes no update endpoint for name, email or password.
            </SourceNotice>
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Security"
          description="How this session is protected."
        />
        <PanelBody>
          <ul className="ot-fact-list">
            <li className="ot-fact-list__item">
              <ShieldCheck size={15} aria-hidden="true" />
              <span>
                Your password is stored only as a bcrypt hash. It is never held
                in this browser.
              </span>
            </li>
            <li className="ot-fact-list__item">
              <ShieldCheck size={15} aria-hidden="true" />
              <span>
                Wallet, portfolio and order endpoints all require your bearer
                token. An expired token returns you to sign-in automatically.
              </span>
            </li>
            <li className="ot-fact-list__item">
              <ShieldCheck size={15} aria-hidden="true" />
              <span>
                No payment instrument is attached to this account. All funds are
                virtual and cannot be withdrawn.
              </span>
            </li>
          </ul>

          <div className="ot-profile__actions">
            <Button as={Link} to="/settings" variant="secondary" size="sm">
              Preferences
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={onSignOut}
              iconLeft={<LogOut size={14} aria-hidden="true" />}
            >
              Sign out
            </Button>
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}
