# Homepage product tour

The homepage feature section uses the React Bits `CircularCarousel` in `islands/FeatureTour.jsx`. Six screens introduce market watch, stock research, paper trading, portfolio, analytics, and trade history. Descriptions follow the screen at the front of the cylinder, with links to the corresponding app routes.

The component source and CSS were supplied by the user and live in `islands/reactbits/CircularCarousel/`, under the existing React Bits license. Integration adds a controller ref for Previous/Next and direct screen selection, keyboard-focus pausing, immediate manual selection for reduced motion, and a fix that stops rendering while the cylinder is at rest. The original drag, momentum, curved tiles, viewport pausing, and visibility handling are preserved.

Automatic rotation advances one screen at a time and has a visible Play/Pause control. Dragging, keyboard navigation, or choosing a screen pauses autoplay. Left/Right, Home, and End work on the carousel; all controls are keyboard accessible. Reduced motion disables automatic rotation and entrance movement, while keeping manual controls available. The carousel has a descriptive accessible name and each slide is labelled. Screen-reader announcements are quiet during automatic rotation.

## Screenshot provenance

The JPEGs in `images/tour/` were captured on 18 October 2026 from the locally running OctaTrade app using a disposable paper-trading test account. The carousel uses the six desktop captures from a 1440px viewport. Mobile captures from the previous tour are retained. Captures are cropped to the active app view, excluding profile and account controls. They show actual app screens and demo-account activity, without invented account balances or price histories. The public caption explains that balances and trades are examples and market data may be delayed.

To update a screen, capture the relevant view in the light theme, preserving the filenames: `markets`, `research`, `trading`, `portfolio`, `analytics`, or `history`, followed by `-desktop.jpg`. Keep account credentials and tokens out of images and source. Rebuild the landing bundle with `npm run build --prefix islands` after component changes.
