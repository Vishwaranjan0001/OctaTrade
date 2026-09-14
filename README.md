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

## Running it

The backend needs a local MongoDB on `mongodb://127.0.0.1:27017/octatrade` and a
`.env` in `server/` containing `JWT_SECRET` and `JWT_EXPIRES_IN`.

```bash
# terminal 1 — API on :3000
cd server
npm install
npm start

# terminal 2 — client on :5173
cd client
npm install
npm run dev
```

The dev server proxies `/api` to `http://127.0.0.1:3000`, so the client calls
same-origin relative URLs and the backend needs no CORS layer. To point a built
client at a different API origin, set `VITE_API_BASE_URL` (see
`client/.env.example`).

```bash
cd client
npm run build     # production build into client/dist
npm run preview   # serve the build locally
```

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
