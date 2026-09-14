# OctaTrade Architecture Decisions

## ADR 001: Keep backend code in `server/`

### Problem

OctaTrade will eventually contain a React frontend and a Node backend with different dependencies and commands.

### Options considered

- Put all files and dependencies in the repository root.
- Keep frontend and backend projects in separate folders.

### Chosen solution

Backend code and backend package metadata live in `server/`. A separate `client/` folder will be introduced when frontend development begins.

### Why

This keeps backend responsibilities and dependencies clear without creating folders before they are needed.

### Trade-offs

Developers must run commands from the correct subfolder. Shared root-level tooling may be added later if repetition justifies it.

## ADR 002: Use Express for the HTTP API

### Problem

The backend needs readable HTTP routing, middleware, request handling, and response handling.

### Options considered

- Node's built-in HTTP module
- Express
- Other frameworks such as Fastify or NestJS

### Chosen solution

Use Express.

### Why

Express exposes request and response fundamentals with little framework ceremony, matches the planned stack, and has a mature ecosystem.

### Trade-offs

Express is an additional dependency and hides some low-level HTTP details. We will explain those details when they affect behavior or design.

## ADR 003: Use ES modules

### Problem

Node supports both CommonJS (`require`) and ES module (`import`) syntax.

### Options considered

- CommonJS
- ES modules

### Chosen solution

Set `"type": "module"` in the backend's `package.json` and use `import` and `export`.

### Why

ES modules are standard JavaScript syntax and align with the module style used by modern React tooling.

### Trade-offs

Some older Node examples use CommonJS, so their module syntax must be translated when reused.

## ADR 004: Build the frontend as a Vite + React client in `client/`

### Problem

ADR 001 reserved `client/` for frontend code. The frontend needed a build tool,
a routing model and a data-fetching strategy against the existing Express API.

### Options considered

- Server-rendered templates from Express
- Create React App
- Vite + React with client-side routing

### Chosen solution

Vite + React 19 with `react-router-dom`, JavaScript and JSX only. During
development Vite proxies `/api` to the Express server on port 3000.

### Why

The backend is a JSON API with no view layer, so a separate client keeps the
two concerns apart exactly as ADR 001 intended. The dev proxy means the client
calls same-origin relative URLs, so the backend needs no CORS middleware and its
code is untouched. `VITE_API_BASE_URL` allows a deployed client to point at a
different API origin without a code change.

### Trade-offs

Two dev processes must run. Deep links require the host to serve `index.html`
for unmatched paths.

## ADR 005: One animation frame loop for the whole client

### Problem

The interface uses smooth scrolling (Lenis), scroll-linked transforms (Motion)
and a WebGL scene (React Three Fiber). Each library ships its own
`requestAnimationFrame` loop by default. Three loops read and write layout at
different points in the same frame, so scroll-linked transforms lag the smoothed
scroll position by a variable amount — which is felt as jitter.

### Options considered

- Let each library run its own loop
- Drive everything from a hand-written loop
- Adopt one library's scheduler as the single loop

### Chosen solution

Motion's frame scheduler is the only loop. Lenis is constructed with
`autoRaf: false` and ticked from `frame.update(..., true)`. The R3F canvas uses
`frameloop="never"` and is advanced from the same scheduler.

### Why

Scroll position, DOM transforms and the WebGL render all resolve within one
frame, so they cannot drift apart. It also makes pausing free: not advancing the
scheduler stops the scene, which is how the scene is suspended when it is
off-screen, when the tab is hidden, or when motion is reduced.

### Trade-offs

Components must not start their own loops, and `useFrame` work only runs while
something advances the canvas. Both constraints are documented in
`SmoothScrollProvider.jsx` and `FinancialScene.jsx`.

## ADR 006: Never render a financial value the API did not provide

### Problem

Several surfaces have no backing endpoint yet: historical candles, portfolio
valuation history, benchmark series. A chart with no data looks broken, and the
easy fix — generating plausible numbers — would make a paper-trading product
display fabricated prices.

### Options considered

- Generate sample series for empty charts
- Hide surfaces that have no data
- Render an explicit unavailable state naming the missing capability

### Chosen solution

Unavailable data renders a `DataUnavailable` state that says what is missing and
which endpoint would supply it. Unknown values render as an em dash. Where a
total covers only part of the account — because a live quote failed for some
symbols — the figure is shown with an explicit coverage disclosure rather than
presented as complete.

### Why

A simulator's credibility rests entirely on the reader trusting that displayed
numbers are real. One invented price destroys that for every other number.

### Trade-offs

Empty states need real design attention, and some panels stay empty until the
corresponding endpoint exists.

## ADR 007: Add the orders API to complete the trading path

### Problem

The client needed `POST /api/orders`, `GET /api/orders` and
`GET /api/orders/:orderId` to place and display paper orders. No order routes,
controller, service or model existed in `server/`.

### Options considered

- Ship the terminal in a permanent error state until the endpoints exist
- Simulate order execution in the browser
- Implement the missing endpoints in the existing backend style

### Chosen solution

Implement them: `models/Order.js`, `services/orderServices.js`,
`Controllers/orderController.js`, `middleware/validateOrder.js` and
`routes/orderRoutes.js`, wired with one line in `index.js`. No existing backend
logic was modified.

### Why

Simulating fills in the client is precisely the fabrication this project avoids,
and a terminal that cannot place an order is not a trading product. Order
settlement reuses the existing wallet and holding models, so money continues to
move in integer paise through the same ledger.

### Trade-offs

Settlement performs several sequential writes. Multi-document transactions need
a MongoDB replica set and this project runs a standalone `mongod`, so writes are
ordered defensively (funds reserved before a holding changes; a holding reduced
before a sale is credited) rather than wrapped in a transaction.
