/*
  Structural previews of the real workspace surfaces.

  These describe LAYOUT and LABELS only. Every value position is an em dash,
  because the figures belong to a signed-in account and inventing them —
  balances, prices, P&L — is exactly what this product must not do. Each entry
  names the API that fills it in the real product.
*/

export const SURFACES = [
  {
    id: "dashboard",
    label: "Dashboard",
    api: "Wallet · Portfolio · Orders",
    summary:
      "Holdings value, unrealised profit or loss, buying power and the latest orders in one view.",
    rows: [
      { key: "Holdings value", value: "—" },
      { key: "Unrealised P&L", value: "—" },
      { key: "Buying power", value: "—" },
      { key: "Positions", value: "—" }
    ]
  },
  {
    id: "markets",
    label: "Markets",
    api: "GET /api/quotes/:symbol",
    summary:
      "Resolve any supported symbol and read its latest price and currency.",
    rows: [
      { key: "Symbol", value: "TCS.NS" },
      { key: "Latest price", value: "—" },
      { key: "Currency", value: "—" },
      { key: "Historical series", value: "Unavailable" }
    ]
  },
  {
    id: "terminal",
    label: "Terminal",
    api: "POST /api/orders",
    summary:
      "Choose a side and quantity. The ticket checks buying power and holdings before the order is sent.",
    rows: [
      { key: "Side", value: "BUY / SELL" },
      { key: "Quantity", value: "—" },
      { key: "Estimated value", value: "—" },
      { key: "Balance after", value: "—" }
    ]
  },
  {
    id: "portfolio",
    label: "Portfolio",
    api: "GET /api/portfolio",
    summary:
      "Quantity and average cost per symbol, with allocation by current market value.",
    rows: [
      { key: "Invested", value: "—" },
      { key: "Market value", value: "—" },
      { key: "Return", value: "—" },
      { key: "Allocation", value: "By market value" }
    ]
  },
  {
    id: "orders",
    label: "Orders",
    api: "GET /api/orders",
    summary:
      "The full blotter with status, execution price and settled value for every order.",
    rows: [
      { key: "Placed", value: "—" },
      { key: "Side", value: "—" },
      { key: "Exec price", value: "—" },
      { key: "Status", value: "NEW / FILLED" }
    ]
  },
  {
    id: "wallet",
    label: "Wallet",
    api: "GET /api/wallet/transactions",
    summary:
      "Virtual INR held in integer paise, with every reservation, debit and credit listed.",
    rows: [
      { key: "Available", value: "—" },
      { key: "Reserved", value: "—" },
      { key: "Ledger entries", value: "—" },
      { key: "Currency", value: "INR" }
    ]
  },
  {
    id: "activity",
    label: "Activity",
    api: "Orders + wallet transactions",
    summary:
      "One timeline showing how a single order propagates into the wallet ledger.",
    rows: [
      { key: "Order accepted", value: "—" },
      { key: "Funds reserved", value: "—" },
      { key: "Order executed", value: "—" },
      { key: "Wallet debited", value: "—" }
    ]
  },
  {
    id: "analytics",
    label: "Analytics",
    api: "Portfolio + Quotes",
    summary:
      "Position weights, concentration and contribution to return — computed, never estimated.",
    rows: [
      { key: "Concentration", value: "—" },
      { key: "Largest position", value: "—" },
      { key: "Contribution", value: "—" },
      { key: "Volatility", value: "Needs history" }
    ]
  }
];
