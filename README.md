# OctaTrade scroll-film frontend (not final)

An experimental frontend for OctaTrade: the Papermint scroll-film landing page with OctaTrade content, plus a working trading desk on the **real OctaTrade backend**. The original `OctaTrade` project is not modified.

## Run it

1. Start the backend as usual (MongoDB + WSL Redis + API on port 3000 + workers):
   ```bash
   cd "OneDrive/Documents/OctaTrade/server" && npm start
   ```
2. Start this site (static files + same-origin proxy for `/api` and `/socket.io`, because the backend has no CORS):
   ```bash
   node server.mjs
   ```
3. Open http://localhost:8787 (landing) and http://localhost:8787/app.html (trading desk).

Env: `PORT` (8787) and `API` (http://localhost:3000).

## What is where

| Path | What |
|---|---|
| `index.html`, `css/style.css`, `css/after.css`, `js/app.js` | Landing page: hero, scroll film, reel sections, post-film sections |
| `frames/` | 428 WebP frames + `manifest.json`, scrubbed by scroll |
| `video/clips/` | The four Papermint clips (A2, B1, C3, D4); `video/cut/` holds A and B trimmed at the measured best join |
| `video/film.mp4` | Assembled film (35.7 s) |
| `app.html`, `css/desk.css`, `js/desk.js` | Trading app (hash routes): Dashboard (information only), Markets, Trade terminal, Stock details, Portfolio, Orders, Watchlist, Analytics, Activity, Wallet, Notifications, Profile, Settings (light/dark) |
| `islands/` | React Bits components (`landing.jsx`, `sections.jsx`, `home.jsx`), built to `js/islands-*.js` |
| App widgets (`islands/home.jsx`) | Counter + SpotlightCard metric cards, live Counter prices with up/down flash, AnimatedList feeds, BlurText titles, ScrollVelocity ticker (dashboard only), ShinyText live pills, GlareHover market tiles, ElasticSlider quantity, HoldButton hold-to-sell, DotGrid sign-in, SwipeToast, ClickSpark. `desk.js` feeds them through `window.__pmUI` + `pm:ui` events |
| Charts | TradingView lightweight-charts 5.2.1 (bundled in `islands-home.js`): candlesticks + volume on Trade, area charts with a dashed Nifty 50 line elsewhere. Prices poll every 10 s and move the last candle |
| `server.mjs` | Static server + backend proxy (HTTP and WebSocket) |
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

```bash
PW_FROM=islands/package.json node qa/desk-test.mjs
```

It creates a throwaway local account (saved in `qa/test-account.json`) and walks every page: info-only dashboard, deposit, invalid and valid orders with the live fill, portfolio sorting, order filters, watchlist add/remove, markets, stock, analytics, activity, notifications, profile and dark theme (42 checks, including hold-to-sell and the React widgets).

## Honest limits

- Prices come from Yahoo Finance through the backend and can be delayed (cached up to 5 s).
- Market orders only, as in the backend.
- The film is the Papermint film (mint wallet, dollar-style notes with "100" printed on them, a real hand). It is not OctaTrade-specific yet.
