# Homepage product tour

The homepage feature section is an interactive React tab component in `islands/FeatureTour.jsx`. It introduces Markets, Paper trading, Portfolio, and Analytics using the real app's functionality, with links to the corresponding routes.

Tab selection works with a pointer, Left/Right arrow keys, Home, and End. Motion uses the installed Motion library and respects reduced-motion preferences. Each screenshot has descriptive alternative text and a mobile variant.

## Screenshot provenance

The eight JPEGs in `images/tour/` were captured on 18 October 2026 from the locally running OctaTrade app using a disposable paper-trading test account. Desktop captures use a 1440px viewport; mobile captures use a 430px viewport. Captures are cropped to the active app view, excluding profile and account controls. They show actual app screens and demo-account activity, without invented account balances or price histories. The public caption identifies the screens as previews and explains that balances and trades are examples and market data may be delayed.

To update a screen, capture the relevant view in the light theme at both widths, preserving the filenames: `markets`, `trading`, `portfolio`, or `analytics`, followed by `-desktop.jpg` or `-mobile.jpg`. Keep account credentials and tokens out of images and source. Rebuild the landing bundle with `npm run build --prefix islands` after component changes.
