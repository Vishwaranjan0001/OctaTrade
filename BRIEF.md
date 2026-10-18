# OctaTrade scroll-film site: brief

Status: not final (experimental frontend). The original OctaTrade project is not touched.

| Field | Value | Source |
|---|---|---|
| Brand name | OctaTrade | user |
| What it is | A real-time paper-trading simulator. You trade real market quotes with virtual money, and the engine underneath shows OS and DBMS ideas: worker pools, a scheduler, per-user locks, atomic holdings. | project README |
| Who it is for | Students and new traders who want to practise without risking money, and people curious how a trading engine works inside | authored |
| One belief by the end | "I can learn to trade here for free, on real prices, and the engine is built properly." | authored |
| Primary action | Start trading | authored |
| Second page | Working trading dashboard (`app.html`) on the real OctaTrade backend: sign in / register, wallet + deposit, live quote, buy/sell orders, order history, holdings, realtime order updates | authored (user asked to use the same backend) |
| Vibe | Calm, precise, engineered, warm. References: a Swiss watch movement exploded view, a Muji catalogue, Kubrick symmetry | authored |
| Hero object | An octagonal emerald-green ceramic vault box with brass trim (the "octa") | authored |
| Story | A: blank ivory paper notes swirl into the open octagonal vault and it closes. B: the vault opens into an exploded view (lid, brass gears, emerald tokens, notes fanned). C: a porcelain sculpture hand presses one octagonal token (placing an order). D: the parts fold into a rising candlestick chart of emerald and brass bars. | authored |
| Palette | Background bone `#ECE8DF`; emerald `#1F6B52`; deep green `#123D30`; brass `#B48A4A`; ivory paper `#F7F4EC`; ink `#16201C` | authored |
| Fonts | Fraunces (display), Inter Tight (body), JetBrains Mono (labels, numbers) | authored |
| Assets owned | none | |
| Join check | Every clip join measured with `joinmatch.py`; regenerate any join over ~3x the normal frame step | user asked |
| Project folder | `Desktop/frontend octa not final` | user |
| Backend | `OctaTrade/server` unchanged, on `http://localhost:3000`. This folder's `server.mjs` serves the site and proxies `/api` and `/socket.io` to it (the backend has no CORS, so a same-origin proxy is needed without editing it). | user + authored |
