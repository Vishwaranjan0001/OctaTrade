// "Good to know" fact cards shown by FactCards.jsx (tilting DepthCard components).
// Four details not stated anywhere else on the landing page; each is real behaviour in server/:
// idempotency keys (orderServices), the order:update socket (realtime/socket.js),
// the 5 s quote cache (marketDataServices) and balances kept in paise (walletServices).
export const FACTS = [
  { id: 'once', theme: 'emerald', label: 'Order protection', figure: 'Once',
    text: 'Tapped twice or lost signal mid-order? Each order is placed only once, so your positions stay exactly as you intended.' },
  { id: 'live', theme: 'sun', label: 'Order tracking', figure: 'Live',
    text: 'Follow every order from placed to filled. If one can’t go through, you’ll see exactly why.' },
  { id: 'quotes', theme: 'ink', label: 'Market data', figure: 'Seconds',
    text: 'Prices refresh within seconds as you trade. Market data may be briefly delayed and is for practice only.' },
  { id: 'paise', theme: 'mint', label: 'Precision', figure: '₹0.01',
    text: 'Every balance, fill and profit or loss is accounted to the paisa, so your results are always exact.' },
];
