import { Link } from "react-router-dom";
import {
  ArrowRight,
  Banknote,
  Compass,
  Search,
  Wallet as WalletIcon
} from "lucide-react";

import { PageHeader } from "../../components/app/PageHeader.jsx";
import { Panel, PanelBody, PanelHeader } from "../../components/ui/Panel.jsx";
import { Metric } from "../../components/ui/Metric.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { ErrorState } from "../../components/ui/States.jsx";
import { OrdersTable } from "../../components/app/OrdersTable.jsx";
import { AllocationDonut } from "../../components/charts/LazyCharts.jsx";
import { CoverageNotice } from "../../components/app/CoverageNotice.jsx";
import {
  useMe,
  useOrders,
  usePortfolioValuation,
  useWallet
} from "../../hooks/queries.js";
import {
  formatPaise,
  formatPaiseSigned,
  formatPercent,
  signOf
} from "../../lib/format.js";

/**
 * Dashboard — the account desk.
 *
 * Purpose : answer "where does my account stand right now" using only values
 *           the API actually returns. Wallet balances come from GET /api/wallet,
 *           positions and cost basis from GET /api/portfolio, live valuation
 *           from GET /api/quotes/:symbol, and recent activity from
 *           GET /api/orders. There are deliberately no market indices, movers
 *           or news: the backend provides none, so none are shown.
 * Input   : none.
 * Output  : the populated desk, or an onboarding path for a new account.
 */
export default function Dashboard() {
  const { data: user } = useMe();
  const wallet = useWallet();
  const orders = useOrders();
  const valuation = usePortfolioValuation();

  const availablePaise = wallet.data?.availableBalancePaise ?? null;
  const reservedPaise = wallet.data?.reservedBalancePaise ?? null;

  const orderRows = orders.data ?? [];
  const hasPositions = valuation.totalCount > 0;
  const hasOrders = orderRows.length > 0;

  /* A brand-new account: funded wallet, nothing traded yet. */
  const isNewAccount =
    !wallet.isLoading &&
    !valuation.isLoading &&
    !orders.isLoading &&
    !hasPositions &&
    !hasOrders;

  const firstName = (user?.name || "").trim().split(/\s+/)[0];

  return (
    <div className="ot-stack">
      <PageHeader
        title={firstName ? `${firstName}'s desk` : "Desk"}
        source="Wallet · Portfolio · Orders"
        lede="Every figure below is read from your OctaTrade account. Market value and profit or loss are derived from live quotes at the moment this page loaded."
        actions={
          <>
            <Button as={Link} to="/markets" variant="secondary" size="sm" iconLeft={<Search size={14} aria-hidden="true" />}>
              Find a security
            </Button>
            <Button as={Link} to="/terminal" size="sm" iconRight={<ArrowRight size={14} aria-hidden="true" />}>
              Open terminal
            </Button>
          </>
        }
      />

      {wallet.error ? (
        <Panel>
          <ErrorState error={wallet.error} subject="your wallet" onRetry={wallet.refetch} />
        </Panel>
      ) : null}

      {isNewAccount ? (
        <OnboardingDesk availablePaise={availablePaise} loading={wallet.isLoading} />
      ) : (
        <>
          {/* Primary account figures. Hairline-separated columns rather than a
              grid of identical cards. */}
          <Panel>
            <div className="ot-metric-row">
              <Metric
                label="Holdings value"
                value={
                  valuation.marketValuePaise === null
                    ? "Not priced"
                    : formatPaise(valuation.marketValuePaise)
                }
                sub={
                  valuation.marketValuePaise === null
                    ? "Live quote unavailable"
                    : `${valuation.pricedCount} of ${valuation.totalCount} positions priced`
                }
                size="lg"
                loading={valuation.isLoading}
              />
              <Metric
                label="Unrealised P&L"
                value={
                  valuation.unrealisedPaise === null
                    ? "Not priced"
                    : formatPaiseSigned(valuation.unrealisedPaise)
                }
                tone={
                  valuation.unrealisedPaise === null
                    ? null
                    : signOf(valuation.unrealisedPaise)
                }
                sub={
                  valuation.returnPct === null
                    ? "Requires a live quote"
                    : `${formatPercent(valuation.returnPct, { signed: true })} on priced cost`
                }
                size="lg"
                loading={valuation.isLoading}
              />
              <Metric
                label="Invested"
                value={formatPaise(valuation.investedPaise)}
                sub="Cost basis from holdings"
                loading={valuation.isLoading}
              />
              <Metric
                label="Positions"
                value={valuation.isLoading ? null : String(valuation.totalCount)}
                sub={valuation.totalCount === 1 ? "1 security held" : "securities held"}
                loading={valuation.isLoading}
              />
            </div>
          </Panel>

          <CoverageNotice
            pricedCount={valuation.pricedCount}
            totalCount={valuation.totalCount}
            unpricedSymbols={valuation.unpricedSymbols}
          />

          {/* Wallet strip. */}
          <Panel>
            <div className="ot-metric-row">
              <Metric
                label="Buying power"
                value={formatPaise(availablePaise)}
                sub="Available to place buy orders"
                loading={wallet.isLoading}
              />
              <Metric
                label="Reserved"
                value={formatPaise(reservedPaise)}
                tone={reservedPaise ? "reserved" : null}
                sub="Held against working orders"
                loading={wallet.isLoading}
              />
              <Metric
                label="Currency"
                value={wallet.data?.currency ?? null}
                sub="Virtual funds"
                loading={wallet.isLoading}
              />
              <div className="ot-metric-cta">
                <Button
                  as={Link}
                  to="/wallet"
                  variant="secondary"
                  size="sm"
                  iconLeft={<WalletIcon size={14} aria-hidden="true" />}
                >
                  Manage wallet
                </Button>
              </div>
            </div>
          </Panel>

          {/* Asymmetric split: the blotter is the wider column. */}
          <div className="ot-grid ot-grid--primary">
            <Panel>
              <PanelHeader
                title="Recent orders"
                meta={`${orderRows.length} total`}
                actions={
                  hasOrders ? (
                    <Button as={Link} to="/orders" variant="ghost" size="sm">
                      View all
                    </Button>
                  ) : null
                }
              />
              <OrdersTable
                rows={orderRows}
                limit={6}
                loading={orders.isLoading}
                error={orders.error}
                onRetry={orders.refetch}
                compact
              />
            </Panel>

            <Panel>
              <PanelHeader
                title="Allocation"
                description="Share of the portfolio held in each security."
              />
              <PanelBody>
                <AllocationDonut rows={valuation.rows} basis="market" height={230} />
              </PanelBody>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * OnboardingDesk — the first-run experience.
 *
 * Purpose : a new account has a funded wallet and nothing else. Rather than
 *           showing zeros across a dashboard, this states what the account
 *           already has and gives the three real steps to a first position.
 * Input   : availablePaise, loading.
 * Output  : the onboarding panel.
 */
function OnboardingDesk({ availablePaise, loading }) {
  const steps = [
    {
      index: "01",
      title: "Find a security",
      body: "Search any Yahoo Finance-compatible symbol, such as TCS.NS or INFY.NS, to read its latest quote.",
      to: "/markets",
      cta: "Open markets",
      icon: Search
    },
    {
      index: "02",
      title: "Place a paper order",
      body: "Choose a side and quantity in the terminal. The order is validated against your real buying power before it is sent.",
      to: "/terminal",
      cta: "Open terminal",
      icon: Compass
    },
    {
      index: "03",
      title: "Follow the settlement",
      body: "Watch the order lifecycle, the wallet ledger entry and the resulting position build up across your workspace.",
      to: "/activity",
      cta: "View activity",
      icon: Banknote
    }
  ];

  return (
    <Panel>
      <PanelHeader
        title="Your account is ready"
        meta="No positions yet"
        description="Your wallet has been opened with virtual funds. Nothing has been traded on this account, so there is no valuation to show yet."
      />
      <PanelBody>
        <div className="ot-onboard">
          <div className="ot-onboard__balance">
            <Metric
              label="Opening buying power"
              value={formatPaise(availablePaise)}
              sub="Virtual INR credited to your wallet"
              size="lg"
              loading={loading}
            />
          </div>

          <ol className="ot-onboard__steps">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <li className="ot-onboard__step" key={step.index}>
                  <span className="ot-onboard__step-index ot-label">{step.index}</span>
                  <div className="ot-onboard__step-body">
                    <h3 className="ot-h4">{step.title}</h3>
                    <p className="ot-onboard__step-text">{step.body}</p>
                    <Button
                      as={Link}
                      to={step.to}
                      variant="secondary"
                      size="sm"
                      iconLeft={<Icon size={14} aria-hidden="true" />}
                    >
                      {step.cta}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </PanelBody>
    </Panel>
  );
}
