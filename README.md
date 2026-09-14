# OctaTrade

OctaTrade is a real-time paper-trading simulator that uses virtual money to
demonstrate OS and DBMS concepts.

Orders are priced from live market quotes and settled against a virtual wallet
held in integer paise. Nothing in the interface is fabricated: where the API has
no data, the product says so rather than filling the gap.

## Layout

```
server/   Express + MongoDB JSON API
client/   Vite + React frontend
docs/     Architecture decisions and learning notes
```

## Running it locally

**Prerequisites:** Node 20+ and a local MongoDB listening on
`mongodb://127.0.0.1:27017`.

Create `server/.env`:

```
JWT_SECRET=replace-with-any-long-random-string
JWT_EXPIRES_IN=7d
```

Then, from the repository root:

```bash
npm run setup     # installs server/ and client/ dependencies
npm run dev       # API on :3000 and client on :5173, in one terminal
```

Open <http://localhost:5173>. Ctrl-C stops both.

To run them separately instead:

```bash
npm run server    # or: cd server && npm start
npm run client    # or: cd client && npm run dev
```

The dev server proxies `/api` to `http://127.0.0.1:3000`, so the client calls
same-origin relative URLs and the backend needs no CORS layer. Point the client
at a different API with `VITE_PROXY_TARGET` (dev) or `VITE_API_BASE_URL` (a
built client) — see `client/.env.example`.

### Production build

```bash
npm run build     # outputs client/dist
npm run preview   # serves that build on :4173, proxying /api the same way
```

When deploying the built client, the host must serve `index.html` for unmatched
paths so client-side routes like `/dashboard` resolve on a hard refresh.

## API

| Method | Path                      | Purpose                                  |
| ------ | ------------------------- | ---------------------------------------- |
| POST   | `/api/auth/register`      | Create an account (returns no token)     |
| POST   | `/api/auth/login`         | Exchange credentials for a bearer token  |
| GET    | `/api/auth/me`            | The signed-in account                    |
| GET    | `/api/quotes/:symbol`     | Latest price and currency for a symbol   |
| GET    | `/api/wallet`             | Available and reserved balance, in paise |
| POST   | `/api/wallet/deposit`     | Credit virtual funds (integer paise)     |
| GET    | `/api/wallet/transactions`| Wallet ledger, newest first              |
| GET    | `/api/portfolio`          | Holdings with quantity and average cost  |
| POST   | `/api/orders`             | Place a market BUY or SELL order         |
| GET    | `/api/orders`             | Order blotter                            |
| GET    | `/api/orders/:orderId`    | A single order                           |

All money fields are **integer paise**. Quote prices are **rupee floats**. The
conversion happens in exactly one place on the client (`client/src/lib/format.js`)
and one place on the server (`server/services/orderServices.js`).

## Frontend

React with JSX only — no TypeScript. Lenis for smooth scrolling, Motion for
React for transitions and scroll-linked transforms, React Three Fiber for the
hero scene, React Slick for the surfaces carousel, Recharts for allocation,
TradingView Lightweight Charts for OHLC, React Query for server state, Zustand
for local UI state, React Hook Form with Zod for forms, Lucide for icons.

Design and engineering decisions are recorded in
[`docs/architecture-decisions.md`](docs/architecture-decisions.md) — in
particular ADR 005 (one animation frame loop) and ADR 006 (never render a value
the API did not provide).
