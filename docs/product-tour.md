# Homepage features

The section mounted at `#rb-feature-tour` uses `islands/FeatureTour.jsx` to present OctaTrade's paper-trading features. The screenshot carousel has been replaced by a feature composition with four distinct areas:

- Virtual practice capital: the actual ₹1,00,000 account starting balance, an OctaTrade illustration, and a registration link.
- Watchlists: an interactive six-stock preview. Selections are local React state, not changes to a visitor's account. The separate link opens the real Watchlist route.
- Chart timeframes: accessible 1D, 1W, 1M, and 1Y tabs explaining the chart ranges the app supports. They describe capabilities without presenting invented market data.
- Review tools: links to Portfolio, Analytics, and Orders with concise explanations of their purpose.

## Interaction and accessibility

Watchlist buttons expose their state with `aria-pressed` and announce the selected count, including empty and single-stock states. The timeframe tabs support Left/Right arrows, Home, and End, with linked tab-panel labels. All controls are keyboard accessible and retain visible focus. Motion uses the existing Motion dependency and respects reduced-motion preferences. Layout uses natural content heights rather than fixed card rows or clamped descriptions.

## Illustration provenance

`images/feature-practice-capital.webp` is an AI-generated illustration created with the built-in image-generation tool on 18 October 2026. It depicts an emerald octagonal vault with ivory paper tokens as a visual metaphor for virtual practice funds. It is not a photograph of a physical OctaTrade product or real currency. The original generated PNG is preserved in the tool's generated-images directory; the website uses a 93 KB WebP conversion. The image has descriptive alternative text and loads lazily.

The previous tour screenshots and supplied CircularCarousel source remain available in the repository but are not imported or rendered by this section.

Rebuild the landing bundle with `npm run build --prefix islands` after component changes.
