# OctaTrade final frontend

The Papermint scroll-film landing page with OctaTrade content, plus a trading desk and the OctaTrade backend, order workers, MongoDB, and Redis.

## Start on another device with Docker

Install [Docker Desktop](https://docs.docker.com/desktop/) (Windows/macOS, using Linux containers), or Docker Engine with the Compose plugin (Linux), and start Docker. No separate Node.js, MongoDB, or Redis installation is needed.

```bash
git clone https://github.com/Vishwaranjan0001/OctaTrade.git
cd OctaTrade
docker compose up --build -d
```

Open **http://localhost:8787** for the landing page, or **http://localhost:8787/app.html** for the trading desk. Create a new account to sign in. The first build downloads dependencies and container images; later starts reuse them. Internet access is needed for market data and externally hosted fonts/scripts.

The setup builds the React bundles, starts MongoDB as a single-member replica set (required for transactions), waits for it and Redis to be ready, then starts the API, three order workers, and frontend. The frontend forwards API and realtime requests to the API container. Only the frontend port is published. See Docker's [startup order documentation](https://docs.docker.com/compose/how-tos/startup-order/) for the readiness behavior.

```bash
docker compose ps                 # Check service status
docker compose logs -f            # View logs (Ctrl+C to stop following)
docker compose down               # Stop; keep accounts and balances
docker compose up -d              # Start again
```

`mongo-init` exiting with code 0 is normal: it initializes the replica set and then finishes. Accounts, balances, queues, and the automatically generated login-signing secret are stored in named Docker volumes and survive rebuilds and `docker compose down`. A new device starts with a fresh database; cloning the repository does not transfer existing accounts. `docker compose down --volumes` deletes those saved volumes and resets the app.

### Optional settings

Compose works with no `.env` file. To customize it, copy `.env.example` to `.env` and edit it before starting:

```dotenv
APP_PORT=8787
APP_HOST=127.0.0.1
WORKER_COUNT=3
JWT_EXPIRES_IN=7d
JWT_SECRET=
```

Change `APP_PORT` if port 8787 is occupied. Set `APP_HOST=0.0.0.0` to open the app from another device on your network using `http://<computer-ip>:8787` (allow the port through your firewall). Leave `JWT_SECRET` blank to generate a random value on first start, or supply your own. Run `docker compose up -d` after changing settings. The included setup is for local use; public deployment needs HTTPS and appropriate access controls.

### Get updates

```bash
git pull --ff-only
docker compose up --build -d
```

## Run without Docker

The backend source in `server/` was copied from the local OctaTrade backend used by this frontend, including its current scheduler changes. The separate original checkout was not changed.

Start a MongoDB replica set named `rs0` and Redis. Install backend dependencies with `npm ci` inside `server/`, then set `MONGODB_URI`, `REDIS_URL`, `JWT_SECRET`, and `JWT_EXPIRES_IN` in `server/.env`. Run `npm run api` and `npm run workers` in separate terminals from `server/`. Start the frontend from this directory:

```bash
node server.mjs
```

Env: `PORT` (8787) and `API` (http://localhost:3000).

## What is where

| Path | What |
|---|---|
| `index.html`, `css/style.css`, `css/after.css`, `js/app.js` | Landing page: hero, scroll film, reel sections, post-film sections |
| `frames/` | 428 WebP frames + `manifest.json`, scrubbed by scroll |
| `video/clips/` | The four Papermint clips (A2, B1, C3, D4); `video/cut/` holds A and B trimmed at the measured best join |
| `video/film.mp4` | Assembled film (35.7 s) |
| `app.html`, `css/desk.css`, `js/desk.js` | Trading app (hash routes): Dashboard (information only), Markets, Trade terminal, Stock details, Portfolio, Orders, Watchlist, Analytics, Activity, Wallet, Notifications, Profile, Settings (light/dark) |
| `css/brand.css`, `js/brand.js`, `images/favicon.svg` | Animated OctaTrade identity shared by the landing page, sign-in, and trading desk; respects reduced motion |
| `islands/` | React Bits components (`landing.jsx`, `sections.jsx`, `home.jsx`), built to `js/islands-*.js` |
| App widgets (`islands/home.jsx`) | Counter + SpotlightCard metric cards, live Counter prices with up/down flash, AnimatedList feeds, BlurText titles, ScrollVelocity ticker (dashboard only), ShinyText live pills, GlareHover market tiles, ElasticSlider quantity, HoldButton hold-to-sell, DotGrid sign-in, SwipeToast, ClickSpark. `desk.js` feeds them through `window.__pmUI` + `pm:ui` events |
| Charts | TradingView lightweight-charts 5.2.1 (bundled in `islands-home.js`): candlesticks + volume on Trade, area charts with a dashed Nifty 50 line elsewhere. Prices poll every 10 s and move the last candle |
| `server.mjs` | Static server + backend proxy (HTTP and WebSocket) |
| `server/` | Backend API, order workers, scheduler, and database models |
| `Dockerfile`, `docker/`, `compose.yaml` | Frontend/backend images and the complete local Docker setup |
| `qa/` | Headless screenshots and `desk-test.mjs` (end-to-end desk test) |

## Rebuild the islands

```bash
cd islands && npm install && npm run build
```

## Swap the film

Put new clips in `video/clips/`, check each join, then assemble:

```bash
python <skill>/scripts/joinmatch.py video/clips/A.mp4 video/clips/B.mp4
bash <skill>/scripts/assemble-film.sh video/clips/A.mp4 video/clips/B.mp4 video/clips/C.mp4 video/clips/D.mp4
```

Set `--paper` in `css/style.css` (and `css/desk.css`) to the colour the script prints.

## Test the desk

For a startup smoke test against the running Docker stack (requires Node.js 22+ on the host):

```bash
node qa/docker-smoke.mjs
```

This checks the packaged assets, API proxy, account creation/login, transactional wallet deposit, invalid order handling, and authenticated realtime connection. It creates a disposable account with virtual funds.

For the full browser walkthrough:

```bash
PW_FROM=islands/package.json node qa/desk-test.mjs
```

It creates a throwaway local account (saved in `qa/test-account.json`) and walks every page: info-only dashboard, deposit, invalid and valid orders with the live fill, portfolio sorting, order filters, watchlist add/remove, markets, stock, analytics, activity, notifications, profile and dark theme (42 checks, including hold-to-sell and the React widgets).

## Honest limits

- Prices come from Yahoo Finance through the backend and can be delayed (cached up to 5 s).
- Market orders only, as in the backend.
- The film is the Papermint film (mint wallet, dollar-style notes with "100" printed on them, a real hand). It is not OctaTrade-specific yet.
