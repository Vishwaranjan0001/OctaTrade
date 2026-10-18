/* =====================================================
   OctaTrade trading desk: a small hash-routed app on the real
   OctaTrade backend (through server.mjs: /api and /socket.io).
   Pages: dashboard, markets, trade, stock, portfolio, orders,
   watchlist, analytics, activity, wallet, notifications,
   profile, settings.
   This file owns data and routing. React Bits widgets (islands/home.jsx)
   render metric cards, live prices, feeds, titles, tiles, the ticker and
   ticket controls; graphs use TradingView lightweight-charts.
   ===================================================== */
(() => {
  const $ = (id) => document.getElementById(id);
  const TOKEN_KEY = "octa.film.token";
  const DEFAULT_WATCH = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS"];
  const IST = 19800; // seconds; lightweight-charts shows UTC, so intraday times are shifted to IST

  // ---------- storage (wrapped: private windows can throw) ----------
  const store = {
    get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
    json(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  };
  const prefs = Object.assign({ toasts: true, compact: false }, store.json("octa.film.prefs", {}));

  // ---------- formatting ----------
  const inr = (rupees, dp = 2) => "₹" + Number(rupees || 0).toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  const paise = (p, dp = 2) => inr((p || 0) / 100, dp);
  const signed = (p) => (p > 0 ? "+" : p < 0 ? "−" : "") + paise(Math.abs(p));
  const pct = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(2)}%`;
  const tone = (v) => (v > 0 ? "up" : v < 0 ? "down" : "");
  const normSymbol = (s) => {
    const t = String(s || "").trim().toUpperCase();
    return !t || t.includes(".") || t.startsWith("^") ? t : t + ".NS";
  };
  const short = (s) => String(s).replace(".NS", "").replace("^NSEI", "NIFTY 50");
  const badge = (s) => short(s).replace(/[^A-Z0-9]/g, "").slice(0, 2) || "—";
  const when = (d) => new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const ago = (d) => {
    const s = Math.max(0, (Date.now() - new Date(d)) / 1000);
    if (s < 60) return "now";
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // =====================================================
  // React widget bus (islands/home.jsx). Plain-text fallback if the bundle is missing.
  // =====================================================
  const bus = (window.__pmUI = window.__pmUI || {});
  function ui(id, data) {
    bus[id] = data;
    window.dispatchEvent(new CustomEvent("pm:ui", { detail: { id, data } }));
    if (window.PM_HOME) return;
    const el = document.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (!el) return;
    const b = el.querySelector("b"), sm = el.querySelector("small");
    if (b) { b.textContent = data.fallback ?? data.text ?? ""; if (sm && data.sub != null) sm.textContent = data.sub; }
    else if (data.items) el.innerHTML = data.items.length ? data.items.map((i) => `<p><b>${esc(i.title)}</b> ${esc(i.description || "")}</p>`).join("") : esc(data.empty || "");
    else el.textContent = data.fallback ?? data.text ?? "";
  }
  // number specs for Counter: money in paise, percent, plain count, or text
  function moneySpec(p, { sign = false } = {}) {
    const neg = p < 0, r = Math.abs(p || 0) / 100;
    const s = sign ? (p > 0 ? "+" : neg ? "−" : "") : neg ? "−" : "";
    if (prefs.compact && r >= 1e5) {
      const cr = r >= 1e7;
      return { value: +(r / (cr ? 1e7 : 1e5)).toFixed(2), prefix: s + "₹", suffix: cr ? "Cr" : "L", decimals: 2, fallback: `${s}₹${(r / (cr ? 1e7 : 1e5)).toFixed(2)}${cr ? "Cr" : "L"}` };
    }
    return { value: r, prefix: s + "₹", decimals: 2, fallback: s + inr(r) };
  }
  const pctSpec = (v, dp = 2) => ({ value: Math.abs(v), prefix: v > 0 ? "+" : v < 0 ? "−" : "", suffix: "%", decimals: dp, fallback: pct(v) });
  const countSpec = (n) => ({ value: n, decimals: 0, fallback: String(n) });
  const metric = (id, spec, sub, tn = "") => ui(id, { ...spec, sub, tone: tn });
  const price = (id, rupees) => ui(id, rupees == null ? { text: "—" } : { value: rupees, prefix: "₹", decimals: 2, fallback: inr(rupees) });

  // ---------- API ----------
  let token = store.get(TOKEN_KEY);
  class ApiError extends Error { constructor(m, status) { super(m); this.status = status; } }
  async function api(path, { method = "GET", body, headers = {} } = {}) {
    const h = { ...headers };
    if (body !== undefined) h["Content-Type"] = "application/json";
    if (token) h.Authorization = "Bearer " + token;
    let res;
    try {
      res = await fetch(path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch {
      setApiState(false);
      throw new ApiError("Cannot reach the server.", 0);
    }
    const data = await res.json().catch(() => null);
    if (res.status === 502 && data && /backend is not running/i.test(data.message || "")) setApiState(false);
    if (!res.ok) {
      if (res.status === 401 && token && path !== "/api/auth/login") signOut();
      throw new ApiError((data && (data.message || data.msg)) || "Something went wrong.", res.status);
    }
    return data;
  }
  let apiUp = null;
  function setApiState(up) {
    apiUp = up;
    $("backend-banner").hidden = up;
    const el = $("st-api");
    if (el) { el.textContent = up ? "Connected" : "Offline"; el.className = "pill " + (up ? "pill-live" : "pill-bad"); }
  }

  // quotes and price history, with short caches
  const quoteCache = new Map();
  async function quote(sym, maxAge = 15000) {
    const c = quoteCache.get(sym);
    if (c && Date.now() - c.t < maxAge) return c.q;
    const q = await api(`/api/quotes/${encodeURIComponent(sym)}`);
    quoteCache.set(sym, { q, t: Date.now(), prev: c ? c.q.price : null });
    return q;
  }
  const histCache = new Map();
  async function history(sym, range) {
    const k = sym + "|" + range, c = histCache.get(k);
    if (c && Date.now() - c.t < 60000) return c.d;
    const { candles } = await api(`/api/quotes/${encodeURIComponent(sym)}/history?range=${range}`);
    histCache.set(k, { d: candles, t: Date.now() });
    return candles;
  }

  // ---------- state ----------
  const state = {
    user: null, wallet: null, holdings: [], orders: [], tx: [], pHistory: [],
    watch: [], notifs: [], symbol: "TCS.NS",
    tradeRange: "1D", stockRange: "1M",
    orderTab: "all", orderSide: "ALL", orderQuery: "", openOrder: null,
    actKind: "all", actQuery: "", sort: { key: "currentValuePaise", dir: "desc" },
  };
  const userKey = (k) => `octa.film.${k}.${state.user ? state.user.id : "anon"}`;
  const saveWatch = () => store.set(userKey("watch"), JSON.stringify(state.watch));
  const saveNotifs = () => store.set(userKey("notifs"), JSON.stringify(state.notifs.slice(0, 100)));

  // ---------- toasts + headline number ----------
  function toast(title, description = "", tag = "ok") {
    if (window.PM_HOME) return window.dispatchEvent(new CustomEvent("pm:toast", { detail: { title, description, tag } }));
    const el = document.createElement("div");
    el.className = "plain-toast";
    el.innerHTML = `<b>${esc(title)}</b>${esc(description)}`;
    $("toast-host").appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }
  function setHeadline(rupees) {
    if (window.PM_HOME) window.dispatchEvent(new CustomEvent("pm:pv", { detail: { value: rupees } }));
    else $("rb-balance").textContent = inr(rupees);
  }
  function spark(el) {
    const r = el.getBoundingClientRect();
    window.dispatchEvent(new CustomEvent("pm:spark", { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }));
  }

  // =====================================================
  // Auth
  // =====================================================
  let mode = "login";
  function setMode(m) {
    mode = m;
    $("tab-login").setAttribute("aria-selected", String(m === "login"));
    $("tab-register").setAttribute("aria-selected", String(m === "register"));
    $("f-name").hidden = m !== "register";
    $("pw-hint").hidden = m !== "register";
    $("auth-submit").textContent = m === "login" ? "Sign in" : "Create account";
    $("auth-form").password.autocomplete = m === "login" ? "current-password" : "new-password";
    $("auth-err").textContent = "";
  }
  $("tab-login").addEventListener("click", () => setMode("login"));
  $("tab-register").addEventListener("click", () => setMode("register"));

  $("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const name = f.name.value.trim(), email = f.email.value.trim(), password = f.password.value;
    const err = $("auth-err");
    err.textContent = "";
    if (mode === "register" && !name) return (err.textContent = "Enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return (err.textContent = "Enter a valid email address.");
    if (mode === "register" && password.length < 8) return (err.textContent = "Password must be at least 8 characters.");
    if (!password) return (err.textContent = "Enter your password.");
    const btn = $("auth-submit");
    btn.disabled = true;
    try {
      if (mode === "register") await api("/api/auth/register", { method: "POST", body: { name, email, password } });
      const out = await api("/api/auth/login", { method: "POST", body: { email, password } });
      token = out.token;
      store.set(TOKEN_KEY, token);
      state.user = out.user;
      f.password.value = "";
      if (!location.hash || location.hash === "#") replaceHash("#dashboard");
      await enterApp();
      if (mode === "register") toast("Account created", "Your wallet starts with ₹1,00,000 of virtual money.");
    } catch (ex) {
      err.textContent = ex.status === 409 ? "That email is already registered. Sign in instead." : ex.message;
    } finally {
      btn.disabled = false;
    }
  });
  function replaceHash(h) { try { window.history.replaceState(null, "", h); } catch { location.hash = h; } }

  function signOut() {
    token = null;
    store.del(TOKEN_KEY);
    state.user = null;
    if (socket) { socket.disconnect(); socket = null; }
    stopPolling();
    setConn(false);
    $("shell").hidden = true;
    $("auth").hidden = false;
  }
  $("logout").addEventListener("click", signOut);

  // =====================================================
  // Data
  // =====================================================
  async function loadWallet() {
    state.wallet = await api("/api/wallet");
    setHeadline(state.wallet.availableBalancePaise / 100);
    $("top-cash").textContent = paise(state.wallet.availableBalancePaise);
  }
  async function loadHoldings() { state.holdings = (await api("/api/portfolio")).holdings; }
  async function loadOrders() {
    const { orders } = await api("/api/orders");
    state.orders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  async function loadTx() {
    const { transactions } = await api("/api/wallet/transactions");
    state.tx = transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  async function loadPHistory() { state.pHistory = (await api("/api/portfolio/history")).history; }
  async function refresh(parts = ["wallet", "holdings", "orders", "tx", "phist"]) {
    const map = { wallet: loadWallet, holdings: loadHoldings, orders: loadOrders, tx: loadTx, phist: loadPHistory };
    await Promise.allSettled(parts.map((p) => map[p]()));
    render();
  }

  function totals() {
    const h = state.holdings;
    const invested = h.reduce((s, x) => s + x.investedValuePaise, 0);
    const value = h.reduce((s, x) => s + x.currentValuePaise, 0);
    const pl = h.reduce((s, x) => s + x.profitLossPaise, 0);
    const cash = state.wallet ? state.wallet.availableBalancePaise : 0;
    const reserved = state.wallet ? state.wallet.reservedBalancePaise : 0;
    return { invested, value, pl, cash, reserved, ret: invested ? (pl / invested) * 100 : 0, total: value + cash };
  }

  // =====================================================
  // Charts: TradingView lightweight-charts (bundled in islands-home.js)
  // =====================================================
  const LW = () => window.LightweightCharts;
  const charts = {};
  function alpha(hex, a) {
    const m = hex.replace("#", "");
    const n = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }
  function chartOptions(extra = {}) {
    return {
      autoSize: true,
      layout: { background: { type: "solid", color: "transparent" }, textColor: css("--ink-faint"), fontFamily: "'JetBrains Mono', monospace", fontSize: 11 },
      grid: { vertLines: { color: css("--line") }, horzLines: { color: css("--line") } },
      rightPriceScale: { borderColor: css("--line"), scaleMargins: { top: 0.12, bottom: 0.08 } },
      timeScale: { borderColor: css("--line"), fixLeftEdge: true, fixRightEdge: true },
      crosshair: {
        vertLine: { color: css("--ink-faint"), labelBackgroundColor: css("--ink") },
        horzLine: { color: css("--ink-faint"), labelBackgroundColor: css("--ink") },
      },
      localization: { locale: "en-IN" },
      handleScroll: { vertTouchDrag: false },
      ...extra,
    };
  }
  function chart(id, extra) {
    if (!LW()) return null;
    let c = charts[id];
    if (!c) {
      c = charts[id] = { api: LW().createChart($(id), chartOptions(extra)), series: {} };
    }
    return c;
  }
  function resetCharts() {
    for (const k of Object.keys(charts)) { try { charts[k].api.remove(); } catch { /* ignore */ } delete charts[k]; }
  }
  const toTime = (t) => (typeof t === "number" ? t + IST : t);
  // area for the main series, optional dashed line for a benchmark
  function areaChart(id, main, bench, { fmt = (v) => inr(v, 0), up = true } = {}) {
    const c = chart(id, { localization: { locale: "en-IN", priceFormatter: fmt } });
    if (!c) return;
    c.api.applyOptions({ localization: { locale: "en-IN", priceFormatter: fmt } });
    const col = up ? css("--accent") : css("--accent-2");
    if (!c.series.main) {
      c.series.main = c.api.addSeries(LW().AreaSeries, { lineWidth: 2, priceLineVisible: false, lastValueVisible: true });
      c.series.bench = c.api.addSeries(LW().LineSeries, { lineWidth: 1.5, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    }
    c.series.main.applyOptions({ lineColor: col, topColor: alpha(col, 0.32), bottomColor: alpha(col, 0.02) });
    c.series.bench.applyOptions({ color: css("--nifty") });
    c.series.main.setData(main);
    c.series.bench.setData(bench || []);
    c.api.timeScale().fitContent();
  }

  // donut stays on canvas (lightweight-charts has no pie), drawn with a sweep animation
  const donutState = new Map();
  function donut(canvas, items) {
    const sig = items.map((i) => i.name + i.value).join("|") + document.documentElement.dataset.theme;
    const animate = donutState.get(canvas.id) !== sig && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    donutState.set(canvas.id, sig);
    const t0 = performance.now();
    const draw = (now) => {
      const k = animate ? Math.min(1, (now - t0) / 700) : 1;
      const ease = 1 - Math.pow(1 - k, 3);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (w < 20 || h < 20) return;
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 4, inner = r * 0.66;
      const total = items.reduce((s, x) => s + x.value, 0);
      ctx.strokeStyle = css("--line-strong"); ctx.lineWidth = r - inner;
      ctx.beginPath(); ctx.arc(cx, cy, (r + inner) / 2, 0, Math.PI * 2); ctx.stroke();
      if (total) {
        let a = -Math.PI / 2;
        for (const it of items) {
          const da = (it.value / total) * Math.PI * 2 * ease;
          ctx.beginPath(); ctx.arc(cx, cy, r, a, a + da); ctx.arc(cx, cy, inner, a + da, a, true); ctx.closePath();
          ctx.fillStyle = it.color; ctx.fill();
          ctx.strokeStyle = css("--card"); ctx.lineWidth = 2; ctx.stroke();
          a += da;
        }
      }
      if (k < 1) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }
  const PALETTE = ["#1f9e6e", "#f2c14e", "#d9472b", "#3a6ea5", "#8a5cc2", "#57534c", "#3ddc97", "#c9822b"];
  function allocation() {
    const t = totals();
    return [...state.holdings].sort((a, b) => b.currentValuePaise - a.currentValuePaise).map((x, i) => ({
      name: short(x.symbol), value: x.currentValuePaise, pct: t.value ? (x.currentValuePaise / t.value) * 100 : 0, color: PALETTE[i % PALETTE.length],
    }));
  }
  function legendHTML(items) {
    if (!items.length) return `<li class="empty">No allocation yet. Complete your first paper trade.</li>`;
    return items.map((it) => `<li><span><i class="sw" style="background:${it.color}"></i>${esc(it.name)}</span><b>${it.pct.toFixed(1)}%</b></li>`).join("");
  }
  const holdingsSeries = () => ({
    main: state.pHistory.map((p) => ({ time: p.date, value: p.value })),
    bench: state.pHistory.filter((p) => p.benchmark != null).map((p) => ({ time: p.date, value: p.benchmark })),
  });

  // =====================================================
  // Router
  // =====================================================
  const VIEWS = ["dashboard", "markets", "trade", "stock", "portfolio", "orders", "watchlist", "analytics", "activity", "wallet", "notifications", "profile", "settings"];
  let view = "dashboard";
  function parseHash() {
    const [v, arg] = location.hash.replace(/^#/, "").split("/");
    return { v: VIEWS.includes(v) ? v : "dashboard", arg: arg ? decodeURIComponent(arg) : "" };
  }
  function go() {
    if ($("shell").hidden) return;
    const { v, arg } = parseHash();
    view = v;
    if ((v === "trade" || v === "stock") && arg) state.symbol = normSymbol(arg);
    document.querySelectorAll(".view").forEach((s) => (s.hidden = s.dataset.view !== v));
    document.querySelector(".ticker").hidden = v !== "dashboard";   // live ticker belongs to the dashboard only
    document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("is-on", a.dataset.nav === v || (v === "stock" && a.dataset.nav === "markets")));
    closeNav();
    placeTicket();
    window.scrollTo(0, 0);
    if (v === "notifications") { state.notifs.forEach((n) => (n.read = true)); saveNotifs(); }
    window.dispatchEvent(new CustomEvent("pm:route", { detail: { view: v } }));
    render();
    pollNow();
  }
  window.addEventListener("hashchange", go);

  function render() {
    if ($("shell").hidden) return;
    renderChrome();
    const fn = RENDER[view];
    if (fn) fn();
  }
  function renderChrome() {
    const n = state.notifs.filter((x) => !x.read).length;
    $("notif-count").hidden = !n;
    $("notif-count").textContent = n;
    if (state.user) $("avatar").textContent = initials(state.user.name);
  }
  const initials = (name) => String(name || "Octa Trader").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");

  function closeNav() { $("shell").classList.remove("nav-open"); $("scrim").hidden = true; $("menu-btn").setAttribute("aria-expanded", "false"); }
  $("menu-btn").addEventListener("click", () => {
    const open = !$("shell").classList.contains("nav-open");
    $("shell").classList.toggle("nav-open", open); $("scrim").hidden = !open; $("menu-btn").setAttribute("aria-expanded", String(open));
  });
  $("scrim").addEventListener("click", closeNav);
  $("top-search").addEventListener("submit", (e) => {
    e.preventDefault();
    const s = normSymbol($("top-search-input").value);
    if (!s) return;
    $("top-search-input").value = "";
    location.hash = "#stock/" + encodeURIComponent(s);
  });

  // =====================================================
  // Live polling: keeps prices, candles, the ticker and P/L moving
  // =====================================================
  let timers = [];
  function stopPolling() { timers.forEach(clearInterval); timers = []; }
  function startPolling() {
    stopPolling();
    timers.push(setInterval(pollPrice, 10000));     // current symbol (backend caches 5 s)
    timers.push(setInterval(pollWatch, 30000));     // ticker + watchlist
    timers.push(setInterval(() => { if (["dashboard", "portfolio", "analytics", "profile"].includes(view)) refresh(["holdings", "wallet"]); }, 60000));
  }
  function pollNow() { pollPrice(); }
  async function pollPrice() {
    if (view !== "trade" && view !== "stock") return;
    const s = state.symbol;
    try {
      const q = await quote(s, 4000);
      if (state.symbol !== s || q.price == null) return;
      price(view === "trade" ? "t-price" : "s-price", q.price);
      if (view === "trade") { price("t-q-price", q.price); liveCandle(q.price); }
      updateEstimate();
    } catch { /* quote errors show on the page already */ }
  }
  async function pollWatch() {
    const list = state.watch.slice(0, 12);
    if (!list.length) { ui("ticker", { items: [] }); return; }
    const qs = await Promise.all(list.map((s) => quote(s, 20000).catch(() => null)));
    ui("ticker", {
      items: list.map((s, i) => {
        const c = quoteCache.get(s);
        const dir = c && c.prev != null && qs[i] && qs[i].price !== c.prev ? (qs[i].price > c.prev ? "up" : "down") : "";
        return { s, label: short(s), price: qs[i] && qs[i].price != null ? inr(qs[i].price) : "—", dir };
      }),
    });
    if (view === "markets") RENDER.markets();
    if (view === "trade") renderWatchSide();
  }

  // =====================================================
  // Pages
  // =====================================================
  const RENDER = {};

  // ---------- Dashboard (information only) ----------
  RENDER.dashboard = () => {
    const t = totals();
    const hr = new Date().getHours();
    ui("dash-title", { text: `${hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening"}, ${state.user ? state.user.name.split(" ")[0] : "trader"}` });
    metric("d-total", moneySpec(t.total), "Holdings + cash");
    metric("d-ret", moneySpec(t.pl, { sign: true }), `${pct(t.ret)} unrealised`, tone(t.pl));
    metric("d-inv", moneySpec(t.invested), `${state.holdings.length} active position${state.holdings.length === 1 ? "" : "s"}`);
    metric("d-res", moneySpec(t.reserved), t.reserved ? "Held while orders run" : "No open reservations");
    const hs = holdingsSeries();
    $("d-chart-msg").textContent = hs.main.length > 1 ? "" : "Your holdings chart appears after your first completed buy.";
    areaChart("d-chart", hs.main.length > 1 ? hs.main : [], hs.main.length > 1 ? hs.bench : [],
      { up: !hs.main.length || hs.main[hs.main.length - 1].value >= hs.main[0].value });
    ui("d-feed", {
      empty: "No orders yet. Your fills and rejections will show here.",
      maxHeight: 340,
      items: state.orders.slice(0, 8).map((o) => ({
        id: o._id, href: `#stock/${encodeURIComponent(o.symbol)}`, kind: o.side === "BUY" ? "buy" : "sell", icon: o.side === "BUY" ? "↘" : "↗",
        title: `${o.side === "BUY" ? "Bought" : "Sold"} ${o.quantity} ${short(o.symbol)}`,
        description: o.totalAmountPaise ? `${paise(o.totalAmountPaise)} · ${when(o.createdAt)}` : when(o.createdAt),
        meta: ago(o.createdAt), status: o.status,
      })),
    });
    const top = [...state.holdings].sort((a, b) => b.currentValuePaise - a.currentValuePaise).slice(0, 5);
    $("d-top").innerHTML = top.length ? top.map((x) => `
      <li><a href="#stock/${encodeURIComponent(x.symbol)}"><span class="sec"><span class="sym-badge">${badge(x.symbol)}</span><span><b>${esc(short(x.symbol))}</b><small>${x.quantity} shares</small></span></span>
      <span class="num">${paise(x.currentValuePaise)}<small class="${tone(x.profitLossPaise)}">${signed(x.profitLossPaise)}</small></span></a></li>`).join("")
      : `<li class="empty">No holdings yet.</li>`;
    renderWatchMini();
  };
  async function renderWatchMini() {
    const list = state.watch.slice(0, 6);
    if (!list.length) { $("d-watch").innerHTML = `<li class="empty">Your watchlist is empty.</li>`; return; }
    const qs = await Promise.all(list.map((s) => quote(s).catch(() => null)));
    if (view !== "dashboard") return;
    $("d-watch").innerHTML = list.map((s, i) => `
      <li><a href="#stock/${encodeURIComponent(s)}"><span class="sec"><span class="sym-badge">${badge(s)}</span><span><b>${esc(short(s))}</b><small>${esc(s)}</small></span></span>
      <span class="num">${qs[i] && qs[i].price != null ? inr(qs[i].price) : "Unavailable"}</span></a></li>`).join("");
  }

  // ---------- Markets (GlareHover tiles with live Counter prices) ----------
  RENDER.markets = async () => {
    if (!state.watch.length) { ui("mk-tiles", { items: [], empty: "Your watchlist is empty. Add a symbol in Watchlist." }); return; }
    const tile = (s, q, loading) => ({ s, badge: badge(s), sub: q ? q.currency || "" : loading ? "Loading…" : "Quote unavailable" });
    ui("mk-tiles", { items: state.watch.map((s) => tile(s, quoteCache.get(s)?.q, true)) });
    const qs = await Promise.all(state.watch.map((s) => quote(s).catch(() => null)));
    if (view !== "markets") return;
    ui("mk-tiles", { items: state.watch.map((s, i) => tile(s, qs[i], false)) });
    state.watch.forEach((s, i) => price(`tile:${s}`, qs[i] ? qs[i].price : null));
  };
  $("mk-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const s = normSymbol($("mk-input").value);
    $("mk-err").textContent = "";
    if (!s) return ($("mk-err").textContent = "Enter a symbol, such as TCS.");
    $("mk-input").value = "";
    location.hash = "#stock/" + encodeURIComponent(s);
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-unwatch]");
    if (b) toggleWatch(b.dataset.unwatch, false);
  });
  const STAR = `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

  function toggleWatch(sym, on) {
    const s = normSymbol(sym);
    const has = state.watch.includes(s);
    const next = on === undefined ? !has : on;
    if (next && !has) state.watch.push(s);
    if (!next && has) state.watch = state.watch.filter((x) => x !== s);
    saveWatch();
    render();
    pollWatch();
  }

  // ---------- Trade terminal ----------
  RENDER.trade = () => {
    const s = state.symbol;
    syncTicketSymbol(s);
    renderWatchSide();
    $("t-badge").textContent = badge(s);
    $("t-sym").textContent = s;
    const inWatch = state.watch.includes(s);
    $("t-star").setAttribute("aria-pressed", String(inWatch));
    $("t-star").setAttribute("aria-label", inWatch ? "Remove from watchlist" : "Add to watchlist");
    renderTradeQuote(s);
    renderCandles(s);
    const os = state.orders.slice(0, 6);
    $("t-orders").innerHTML = os.length ? os.map((o) => `
      <tr class="click" data-go="#trade/${encodeURIComponent(o.symbol)}"><td><b>${esc(o.symbol)}</b></td><td><span class="side-tag ${o.side}">${o.side}</span></td>
      <td class="r">${o.quantity}</td><td class="r">${o.executionPricePaise ? paise(o.executionPricePaise) : "—"}</td>
      <td>${when(o.createdAt)}</td><td class="r"><span class="status ${o.status}">${o.status}</span></td></tr>`).join("")
      : `<tr class="empty"><td colspan="6">No orders yet.</td></tr>`;
    const pos = state.holdings.find((h) => h.symbol === s);
    $("t-pos").hidden = !pos;
    if (pos) $("t-pos").innerHTML = `You hold <b>${pos.quantity}</b> share${pos.quantity > 1 ? "s" : ""} at an average of <b>${paise(pos.averageBuyPricePaise)}</b>. P/L <b class="${tone(pos.profitLossPaise)}">${signed(pos.profitLossPaise)}</b>.`;
  };
  async function renderTradeQuote(s) {
    $("t-state").textContent = "Loading quote"; $("t-state").className = "pill";
    try {
      const q = await quote(s);
      if (state.symbol !== s) return;
      price("t-price", q.price); price("t-q-price", q.price);
      $("t-cur").textContent = q.currency || "INR";
      $("t-q-cur").textContent = q.currency || "Currency unavailable";
      $("t-state").textContent = "Live · updates every 10 s"; $("t-state").className = "pill pill-live";
    } catch {
      if (state.symbol !== s) return;
      price("t-price", null); price("t-q-price", null);
      $("t-state").textContent = "Quote unavailable"; $("t-state").className = "pill pill-bad";
    }
    updateEstimate();
  }
  let lastBar = null;
  async function renderCandles(s) {
    const range = state.tradeRange;
    $("candle-msg").textContent = "Loading…";
    try {
      let cs = await history(s, range);
      if (range === "1D" && cs.length && typeof cs[0].time === "number") {
        const day = (t) => new Date((t + IST) * 1000).toISOString().slice(0, 10);
        const last = day(cs[cs.length - 1].time);
        cs = cs.filter((c) => day(c.time) === last);
      }
      if (state.symbol !== s || state.tradeRange !== range || view !== "trade") return;
      $("candle-msg").textContent = cs.length > 1 ? "" : "No price history for this range.";
      const c = chart("candles", { timeScale: { borderColor: css("--line"), timeVisible: range !== "1M" && range !== "1Y", secondsVisible: false } });
      if (!c) return;
      c.api.applyOptions({ timeScale: { timeVisible: range === "1D" || range === "1W" } });
      if (!c.series.candle) {
        c.series.candle = c.api.addSeries(LW().CandlestickSeries, { borderVisible: false, priceLineVisible: true });
        c.series.vol = c.api.addSeries(LW().HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "vol", lastValueVisible: false, priceLineVisible: false });
        c.api.priceScale("vol").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
        c.api.priceScale("right").applyOptions({ scaleMargins: { top: 0.08, bottom: 0.24 } });
        c.api.subscribeCrosshairMove(candleTip);
      }
      const up = css("--accent"), dn = css("--accent-2");
      c.series.candle.applyOptions({ upColor: up, downColor: dn, wickUpColor: up, wickDownColor: dn });
      const bars = cs.map((k) => ({ time: toTime(k.time), open: k.open, high: k.high, low: k.low, close: k.close }));
      c.series.candle.setData(bars);
      c.series.vol.setData(cs.map((k) => ({ time: toTime(k.time), value: k.volume || 0, color: alpha(k.close >= k.open ? up : dn, 0.35) })));
      c.api.timeScale().fitContent();
      lastBar = bars.length ? { ...bars[bars.length - 1] } : null;
      if (cs.length > 1) {
        const a = cs[0].open, b = cs[cs.length - 1].close, p = ((b - a) / a) * 100;
        $("t-chg").textContent = `${pct(p)} · ${range}`; $("t-chg").className = "muted " + tone(p);
      }
    } catch {
      if (state.symbol !== s) return;
      const c = charts.candles;
      if (c && c.series.candle) { c.series.candle.setData([]); c.series.vol.setData([]); }
      lastBar = null;
      $("candle-msg").textContent = "Price history is unavailable right now.";
    }
  }
  // move the last candle with each live quote
  function liveCandle(p) {
    const c = charts.candles;
    if (!c || !c.series.candle || !lastBar) return;
    lastBar = { ...lastBar, close: p, high: Math.max(lastBar.high, p), low: Math.min(lastBar.low, p) };
    try { c.series.candle.update(lastBar); } catch { /* older bar than the series end: ignore */ }
  }
  function candleTip(param) {
    const tip = $("candle-tip"), c = charts.candles;
    const d = param && param.time && c ? param.seriesData.get(c.series.candle) : null;
    if (!d) { tip.hidden = true; return; }
    const v = c.series.vol ? param.seriesData.get(c.series.vol) : null;
    const t = typeof param.time === "number" ? new Date((param.time - IST) * 1000).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
      : new Date(param.time.year ? `${param.time.year}-${param.time.month}-${param.time.day}` : param.time).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    tip.hidden = false;
    tip.innerHTML = `${t}<br>O ${d.open.toFixed(2)} · H ${d.high.toFixed(2)}<br>L ${d.low.toFixed(2)} · C <b class="${tone(d.close - d.open)}">${d.close.toFixed(2)}</b>${v ? `<br>Vol ${Number(v.value).toLocaleString("en-IN")}` : ""}`;
  }
  document.querySelectorAll("#t-ranges .range").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll("#t-ranges .range").forEach((x) => x.classList.toggle("is-on", x === b));
    state.tradeRange = b.dataset.range;
    renderCandles(state.symbol);
  }));
  $("t-star").addEventListener("click", () => toggleWatch(state.symbol));
  document.addEventListener("click", (e) => {
    const tr = e.target.closest("tr[data-go]");
    if (tr) location.hash = tr.dataset.go;
  });

  let watchFilter = "";
  async function renderWatchSide() {
    const ul = $("watch-list");
    const list = state.watch.filter((s) => s.toLowerCase().includes(watchFilter.toLowerCase()));
    $("w-count").textContent = `${state.watch.length} saved`;
    const row = (s, q) => {
      const c = quoteCache.get(s);
      const dir = c && c.prev != null && q && q.price !== c.prev ? (q.price > c.prev ? "tick-up" : "tick-down") : "";
      return `<li><button type="button" class="${s === state.symbol ? "is-on" : ""}" data-pick="${esc(s)}">
      <span class="sym-badge">${badge(s)}</span><span><b>${esc(s)}</b><small>${q ? esc(q.currency || "") : "…"}</small></span>
      <span class="px ${dir}">${q && q.price != null ? inr(q.price) : "—"}</span></button></li>`;
    };
    if (!list.length) {
      ul.innerHTML = watchFilter ? `<li class="empty">Press Enter to open ${esc(normSymbol(watchFilter))}.</li>` : `<li class="empty">No saved symbols.</li>`;
      return;
    }
    ul.innerHTML = list.map((s) => row(s, quoteCache.get(s)?.q)).join("");
    const qs = await Promise.all(list.map((s) => quote(s).catch(() => null)));
    if (view !== "trade") return;
    ul.innerHTML = list.map((s, i) => row(s, qs[i])).join("");
  }
  $("watch-list").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pick]");
    if (b) location.hash = "#trade/" + encodeURIComponent(b.dataset.pick);
  });
  $("watch-input").addEventListener("input", (e) => { watchFilter = e.target.value.trim(); renderWatchSide(); });
  $("watch-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const s = normSymbol($("watch-input").value);
    if (!s) return;
    $("watch-input").value = ""; watchFilter = "";
    location.hash = "#trade/" + encodeURIComponent(s);
  });

  // ---------- Stock details ----------
  RENDER.stock = async () => {
    const s = state.symbol;
    syncTicketSymbol(s);
    ui("s-sym", { text: s });
    $("s-ex").textContent = s.endsWith(".NS") ? "NSE" : s.startsWith("^") ? "Index" : "Other";
    const inWatch = state.watch.includes(s);
    $("s-star").setAttribute("aria-pressed", String(inWatch));
    $("s-star").textContent = inWatch ? "★ Watching" : "☆ Add to watchlist";
    const pos = state.holdings.find((h) => h.symbol === s);
    $("s-pos").textContent = pos ? `${pos.quantity} shares · ${signed(pos.profitLossPaise)}` : "None";
    try {
      const q = await quote(s);
      if (state.symbol !== s) return;
      price("s-price", q.price);
      $("s-cur").textContent = q.currency || "Currency unavailable";
      $("s-cur2").textContent = q.currency || "—";
    } catch {
      price("s-price", null); $("s-cur").textContent = "Quote unavailable for this symbol."; $("s-cur2").textContent = "—";
    }
    renderStockChart(s);
    updateEstimate();
  };
  async function renderStockChart(s) {
    const range = state.stockRange;
    $("s-chart-msg").textContent = "Loading…";
    try {
      const cs = await history(s, range);
      if (state.symbol !== s || state.stockRange !== range || view !== "stock") return;
      const data = cs.map((c) => ({ time: toTime(c.time), value: c.close }));
      const up = data.length > 1 && data[data.length - 1].value >= data[0].value;
      $("s-chart-msg").textContent = data.length > 1 ? "" : "No price history for this range.";
      chart("s-chart", { timeScale: { borderColor: css("--line"), timeVisible: range === "1D" || range === "1W" } });
      charts["s-chart"] && charts["s-chart"].api.applyOptions({ timeScale: { timeVisible: range === "1D" || range === "1W" } });
      areaChart("s-chart", data.length > 1 ? data : [], [], { fmt: (v) => inr(v), up });
      if (data.length > 1) {
        const p = ((data[data.length - 1].value - data[0].value) / data[0].value) * 100;
        $("s-chg").textContent = `${pct(p)} · ${range}`; $("s-chg").className = "q-chg " + tone(p);
      }
    } catch {
      areaChart("s-chart", [], []);
      $("s-chart-msg").textContent = "Price history is unavailable right now.";
    }
  }
  document.querySelectorAll("#s-ranges .range").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll("#s-ranges .range").forEach((x) => x.classList.toggle("is-on", x === b));
    state.stockRange = b.dataset.range;
    renderStockChart(state.symbol);
  }));
  $("s-star").addEventListener("click", () => toggleWatch(state.symbol));

  // ---------- Portfolio ----------
  RENDER.portfolio = () => {
    const t = totals();
    metric("p-value", moneySpec(t.value), `${state.holdings.length} position${state.holdings.length === 1 ? "" : "s"}`);
    metric("p-inv", moneySpec(t.invested), "Cost basis");
    metric("p-pl", moneySpec(t.pl, { sign: true }), pct(t.ret), tone(t.pl));
    metric("p-cash", moneySpec(t.cash), "Buying power");
    const hs = holdingsSeries();
    $("p-growth-msg").textContent = hs.main.length > 1 ? "" : "Growth appears after your first completed buy.";
    const v0 = hs.main.length ? hs.main[0].value : 1;
    areaChart("p-growth", hs.main.length > 1 ? hs.main.map((p) => ({ time: p.time, value: p.value / v0 })) : [],
      hs.main.length > 1 ? hs.bench.map((p) => ({ time: p.time, value: p.value / v0 })) : [],
      { fmt: (v) => "₹" + v.toFixed(3), up: !hs.main.length || hs.main[hs.main.length - 1].value >= v0 });
    const al = allocation();
    donut($("p-alloc"), al);
    $("p-alloc-total").textContent = paise(t.value);
    $("p-legend").innerHTML = legendHTML(al);
    const { key, dir } = state.sort;
    const rows = [...state.holdings].sort((a, b) => {
      const x = a[key], y = b[key];
      const c = typeof x === "string" ? x.localeCompare(y) : x - y;
      return dir === "asc" ? c : -c;
    });
    document.querySelectorAll(".sortable th button").forEach((b) => (b.dataset.dir = b.dataset.sort === key ? dir : ""));
    $("p-rows").innerHTML = rows.length ? rows.map((x) => {
      const p = x.investedValuePaise ? (x.profitLossPaise / x.investedValuePaise) * 100 : 0;
      return `<tr>
        <td><a class="sec" href="#stock/${encodeURIComponent(x.symbol)}"><span class="sym-badge">${badge(x.symbol)}</span><span><b>${esc(x.symbol)}</b><small>NSE · Equity</small></span></a></td>
        <td class="r">${x.quantity}</td><td class="r">${paise(x.averageBuyPricePaise)}</td><td class="r">${paise(x.currentPricePaise)}</td>
        <td class="r">${paise(x.investedValuePaise)}</td><td class="r"><b>${paise(x.currentValuePaise)}</b></td>
        <td class="r ${tone(x.profitLossPaise)}"><b>${signed(x.profitLossPaise)}</b><br><small>${pct(p)}</small></td>
        <td class="r"><a class="text-link" href="#trade/${encodeURIComponent(x.symbol)}">Trade →</a></td></tr>`;
    }).join("") : `<tr class="empty"><td colspan="8">Your portfolio is ready. <a class="text-link" href="#trade">Place a paper trade</a> to create your first position.</td></tr>`;
  };
  document.querySelectorAll(".sortable th button").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.sort;
    state.sort = { key: k, dir: state.sort.key === k && state.sort.dir === "desc" ? "asc" : "desc" };
    RENDER.portfolio();
  }));

  // ---------- Orders ----------
  RENDER.orders = () => {
    const q = state.orderQuery.toLowerCase();
    const list = state.orders.filter((o) => {
      const tab = state.orderTab;
      const okTab = tab === "all" || (tab === "executed" && o.status === "COMPLETED") || (tab === "rejected" && o.status === "REJECTED") ||
        (tab === "open" && (o.status === "PENDING" || o.status === "PROCESSING"));
      return okTab && (state.orderSide === "ALL" || o.side === state.orderSide) && o.symbol.toLowerCase().includes(q);
    });
    $("o-rows").innerHTML = list.length ? list.map((o) => {
      const open = state.openOrder === o._id;
      return `<tr class="click" data-order="${esc(o._id)}" aria-expanded="${open}">
        <td><span class="sec"><span class="sym-badge">${badge(o.symbol)}</span><span><b>${esc(o.symbol)}</b><small>${when(o.createdAt)}</small></span></span></td>
        <td><span class="side-tag ${o.side}">${o.side}</span></td><td><span class="pill">${o.orderType || "MARKET"}</span></td>
        <td class="r">${o.quantity}</td><td class="r">${o.executionPricePaise ? paise(o.executionPricePaise) : "—"}</td>
        <td class="r">${o.totalAmountPaise ? paise(o.totalAmountPaise) : "—"}</td><td class="r"><span class="status ${o.status}">${o.status}</span></td></tr>
        ${open ? `<tr class="detail"><td colspan="7"><div class="info-grid">
          <div><span class="muted">Order ID</span><b>${esc(o._id)}</b></div>
          <div><span class="muted">Placed</span><b>${when(o.createdAt)}</b></div>
          <div><span class="muted">Finished</span><b>${o.finishedAt ? when(o.finishedAt) : "Not yet"}</b></div>
          <div><span class="muted">${o.status === "REJECTED" ? "Reason" : "Next"}</span><b>${o.status === "REJECTED" ? esc(o.rejectionReason || "Not given") : `<a class="text-link" href="#trade/${encodeURIComponent(o.symbol)}">Trade ${esc(short(o.symbol))} →</a>`}</b></div>
        </div></td></tr>` : ""}`;
    }).join("") : `<tr class="empty"><td colspan="7">No matching orders. Change the filters or <a class="text-link" href="#trade">place a paper order</a>.</td></tr>`;
  };
  $("o-rows").addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    const tr = e.target.closest("tr[data-order]");
    if (!tr) return;
    state.openOrder = state.openOrder === tr.dataset.order ? null : tr.dataset.order;
    RENDER.orders();
  });
  segment("o-tabs", "tab", (v) => { state.orderTab = v; RENDER.orders(); });
  segment("o-side", "side", (v) => { state.orderSide = v; RENDER.orders(); });
  $("o-search").addEventListener("input", (e) => { state.orderQuery = e.target.value.trim(); RENDER.orders(); });
  function segment(id, attr, fn) {
    $(id).addEventListener("click", (e) => {
      const b = e.target.closest(".seg-btn");
      if (!b) return;
      $(id).querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("is-on", x === b));
      fn(b.dataset[attr]);
    });
  }

  // ---------- Watchlist ----------
  let wlFilter = "";
  RENDER.watchlist = async () => {
    const list = state.watch.filter((s) => s.toLowerCase().includes(wlFilter.toLowerCase()));
    const row = (s, q, loading) => `<tr>
      <td><a class="sec" href="#stock/${encodeURIComponent(s)}"><span class="sym-badge">${badge(s)}</span><b>${esc(s)}</b></a></td>
      <td class="r">${loading ? "Loading…" : q && q.price != null ? inr(q.price) : "Unavailable"}</td><td>${q ? esc(q.currency || "—") : "—"}</td>
      <td class="r"><span class="sec" style="justify-content:flex-end"><button class="star" type="button" aria-pressed="true" aria-label="Remove ${esc(s)}" data-unwatch="${esc(s)}">${STAR}</button>
      <a class="text-link" href="#trade/${encodeURIComponent(s)}">Trade →</a></span></td></tr>`;
    if (!list.length) { $("wl-rows").innerHTML = `<tr class="empty"><td colspan="4">${state.watch.length ? "No symbols match the filter." : "No securities here. Add a symbol above."}</td></tr>`; return; }
    $("wl-rows").innerHTML = list.map((s) => row(s, quoteCache.get(s)?.q, !quoteCache.get(s))).join("");
    const qs = await Promise.all(list.map((s) => quote(s).catch(() => null)));
    if (view !== "watchlist") return;
    $("wl-rows").innerHTML = list.map((s, i) => row(s, qs[i], false)).join("");
  };
  $("wl-filter").addEventListener("input", (e) => { wlFilter = e.target.value.trim(); RENDER.watchlist(); });
  $("wl-add").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("wl-err");
    err.textContent = "";
    const s = normSymbol($("wl-add-input").value);
    if (!s) return (err.textContent = "Enter a symbol, such as TCS.");
    if (state.watch.includes(s)) return (err.textContent = `${s} is already on your watchlist.`);
    try { await quote(s); } catch { return (err.textContent = `No quote found for ${s}. Check the symbol.`); }
    $("wl-add-input").value = "";
    toggleWatch(s, true);
    toast("Added to watchlist", s);
  });

  // ---------- Analytics ----------
  RENDER.analytics = () => {
    const t = totals();
    metric("a-ret", pctSpec(t.ret), signed(t.pl), tone(t.ret));
    const al = allocation();
    const largest = al[0];
    metric("a-large", largest ? pctSpec(largest.pct, 1) : { text: "—" }, largest ? largest.name : "No holdings");
    const done = state.orders.filter((o) => o.status === "COMPLETED").length;
    const rej = state.orders.filter((o) => o.status === "REJECTED").length;
    metric("a-fill", done + rej ? { value: Math.round((done / (done + rej)) * 100), suffix: "%", decimals: 0, fallback: `${Math.round((done / (done + rej)) * 100)}%` } : { text: "—" }, `${done} filled · ${rej} rejected`);
    metric("a-cash", t.total ? { value: (t.cash / t.total) * 100, suffix: "%", decimals: 1, fallback: `${((t.cash / t.total) * 100).toFixed(1)}%` } : { text: "—" }, "Cash share of total value");
    const hs = holdingsSeries();
    $("a-chart-msg").textContent = hs.main.length > 1 ? "" : "The equity curve appears after your first completed buy.";
    areaChart("a-chart", hs.main.length > 1 ? hs.main : [], hs.main.length > 1 ? hs.bench : [],
      { up: !hs.main.length || hs.main[hs.main.length - 1].value >= hs.main[0].value });
    donut($("a-donut"), al);
    $("a-donut-c").textContent = largest ? `${largest.pct.toFixed(1)}%` : "0%";
    $("a-legend").innerHTML = legendHTML(al.slice(0, 6));
    const obs = [];
    if (!state.holdings.length) obs.push(["", "No positions yet", "Risk signals appear once you hold shares."]);
    else {
      obs.push([largest.pct > 35 ? "warn" : "", "Position concentration", `${largest.name} is ${largest.pct.toFixed(1)}% of your holdings value${largest.pct > 35 ? ". One stock moves your whole portfolio." : "."}`]);
      obs.push([state.holdings.length < 3 ? "warn" : "", "Diversification", `${state.holdings.length} active equity position${state.holdings.length === 1 ? "" : "s"}${state.holdings.length < 3 ? ". Fewer than three makes returns depend on very few names." : "."}`]);
    }
    const cashPct = t.total ? (t.cash / t.total) * 100 : 100;
    obs.push([cashPct < 10 ? "warn" : "", "Cash buffer", `${cashPct.toFixed(1)}% of your account is cash${cashPct < 10 ? ". Little room for new trades." : "."}`]);
    if (rej) obs.push(["bad", "Rejected orders", `${rej} order${rej === 1 ? " was" : "s were"} rejected. Check the reason in Orders.`]);
    $("a-obs").innerHTML = obs.map(([c, b, s]) => `<li class="${c}"><b>${esc(b)}</b><span>${esc(s)}</span></li>`).join("");
  };

  // ---------- Activity (AnimatedList) ----------
  RENDER.activity = () => {
    const ev = [
      ...state.orders.map((o) => ({
        kind: "order", side: o.side, date: o.createdAt, status: o.status, amount: o.totalAmountPaise, id: "o" + o._id, sym: o.symbol,
        title: `${o.side === "BUY" ? "Bought" : "Sold"} ${o.quantity} ${o.symbol}`,
        detail: o.executionPricePaise ? `${paise(o.executionPricePaise)} per share` : o.status === "REJECTED" ? (o.rejectionReason || "Order rejected") : "Waiting for a worker",
      })),
      ...state.tx.filter((t) => t.type === "DEPOSIT").map((t) => ({
        kind: "cash", date: t.createdAt, status: "COMPLETED", amount: t.amountPaise, id: "t" + t._id, title: "Virtual funds deposited", detail: "Buying power increased",
      })),
    ].filter((x) => (state.actKind === "all" || x.kind === state.actKind) && `${x.title} ${x.detail}`.toLowerCase().includes(state.actQuery.toLowerCase()))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    ui("ac-list", {
      empty: "No activity yet. Orders and wallet movements will appear here.",
      maxHeight: 620,
      items: ev.map((x) => ({
        id: x.id, href: x.kind === "cash" ? "#wallet" : `#stock/${encodeURIComponent(x.sym)}`,
        kind: x.kind === "cash" ? "cash" : x.side === "BUY" ? "buy" : "sell", icon: x.kind === "cash" ? "₹" : x.side === "BUY" ? "↘" : "↗",
        title: x.title, description: `${x.detail} · ${when(x.date)}`, meta: x.amount ? paise(x.amount) : "—", status: x.status,
      })),
    });
  };
  $("ac-search").addEventListener("input", (e) => { state.actQuery = e.target.value.trim(); RENDER.activity(); });
  segment("ac-kind", "kind", (v) => { state.actKind = v; RENDER.activity(); });

  // ---------- Wallet ----------
  const TX_LABEL = { DEPOSIT: "Deposit", RESERVE: "Reserved for order", RELEASE: "Reservation released", DEBIT: "Bought shares", CREDIT: "Sold shares" };
  RENDER.wallet = () => {
    const w = state.wallet || { availableBalancePaise: 0, reservedBalancePaise: 0 };
    metric("w-avail", moneySpec(w.availableBalancePaise), "Available now");
    metric("w-res", moneySpec(w.reservedBalancePaise), w.reservedBalancePaise ? "Held for running orders" : "No open reservations");
    metric("w-dep", moneySpec(state.tx.filter((t) => t.type === "DEPOSIT").reduce((s, t) => s + t.amountPaise, 0)), "Lifetime paper funds");
    metric("w-moves", countSpec(state.tx.filter((t) => t.type === "DEBIT" || t.type === "CREDIT").length), "Recorded settlements");
    $("w-entries").textContent = `${state.tx.length} entr${state.tx.length === 1 ? "y" : "ies"}`;
    $("w-rows").innerHTML = state.tx.length ? state.tx.map((t) => {
      const plus = t.type === "DEPOSIT" || t.type === "CREDIT" || t.type === "RELEASE";
      return `<tr><td><span class="sec"><span class="side-tag ${plus ? "BUY" : "SELL"}">${t.type}</span>${TX_LABEL[t.type] || t.type}</span></td>
        <td>${when(t.createdAt)}</td><td class="r ${plus ? "up" : ""}">${plus ? "+" : "−"}${paise(t.amountPaise)}</td>
        <td class="r">${paise(t.availableBalanceAfterPaise)}</td></tr>`;
    }).join("") : `<tr class="empty"><td colspan="4">No movements yet.</td></tr>`;
  };
  const dep = $("deposit-form");
  dep.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => { dep.amount.value = c.dataset.amt; dep.amount.focus(); }));
  dep.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("dep-err");
    err.textContent = "";
    const rupees = Number(dep.amount.value);
    const amountPaise = Math.round(rupees * 100);
    if (!Number.isFinite(rupees) || amountPaise <= 0) return (err.textContent = "Enter an amount above ₹0.");
    if (rupees > 10000000) return (err.textContent = "Keep a single deposit at ₹1,00,00,000 or less.");
    const btn = $("dep-submit");
    btn.disabled = true;
    try {
      const out = await api("/api/wallet/deposit", { method: "POST", body: { amountPaise } });
      state.wallet = out.wallet;
      setHeadline(out.wallet.availableBalancePaise / 100);
      $("top-cash").textContent = paise(out.wallet.availableBalancePaise);
      toast("Virtual funds added", `${paise(amountPaise)} is ready to trade.`);
      spark(btn);
      await refresh(["tx"]);
    } catch (ex) {
      err.textContent = ex.message;
    } finally {
      btn.disabled = false;
    }
  });

  // ---------- Notifications (AnimatedList) ----------
  RENDER.notifications = () => {
    ui("n-list", {
      empty: "No notifications yet. Order fills and rejections will appear here.",
      maxHeight: 620,
      items: state.notifs.map((n) => ({
        id: n.id, href: "#orders", kind: n.status === "COMPLETED" ? "buy" : "sell", icon: n.status === "COMPLETED" ? "✓" : "✕",
        title: n.title, description: `${n.detail} · ${when(n.at)}`, meta: ago(n.at), status: n.status,
      })),
    });
  };
  $("n-clear").addEventListener("click", () => { state.notifs = []; saveNotifs(); render(); });

  // ---------- Profile ----------
  RENDER.profile = () => {
    const u = state.user || {}, t = totals();
    $("pr-initials").textContent = initials(u.name);
    $("pr-name").textContent = $("pr-name2").textContent = u.name || "—";
    $("pr-email").textContent = $("pr-email2").textContent = u.email || "—";
    metric("pr-value", moneySpec(t.value), `${state.holdings.length} holding${state.holdings.length === 1 ? "" : "s"}`);
    metric("pr-done", countSpec(state.orders.filter((o) => o.status === "COMPLETED").length), `${state.orders.length} total order${state.orders.length === 1 ? "" : "s"}`);
    metric("pr-session", { text: "Protected" }, "Signed bearer token");
  };

  // ---------- Settings ----------
  RENDER.settings = () => {
    const theme = document.documentElement.dataset.theme || "light";
    document.querySelectorAll("[data-theme-opt]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeOpt === theme)));
    document.querySelectorAll("[data-pref]").forEach((i) => (i.checked = !!prefs[i.dataset.pref]));
    const live = socket && socket.connected;
    $("st-socket").textContent = live ? "Connected" : "Offline"; $("st-socket").className = "pill " + (live ? "pill-live" : "pill-bad");
    setApiState(apiUp !== false);
  };
  document.querySelectorAll("[data-theme-opt]").forEach((b) => b.addEventListener("click", () => {
    document.documentElement.dataset.theme = b.dataset.themeOpt;
    store.set("octa.film.theme", b.dataset.themeOpt);
    window.dispatchEvent(new CustomEvent("pm:theme"));
    resetCharts();          // charts take their colours at creation
    render();
  }));
  document.querySelectorAll("[data-pref]").forEach((i) => i.addEventListener("change", () => {
    prefs[i.dataset.pref] = i.checked;
    store.set("octa.film.prefs", JSON.stringify(prefs));
  }));

  // =====================================================
  // Order ticket (one element, moved between Trade and Stock).
  // BUY: button. SELL: React Bits HoldButton ("hold to sell"). Quantity: ElasticSlider.
  // =====================================================
  document.body.appendChild($("ticket-tpl").content.cloneNode(true));
  const ticket = $("ticket-card");
  ticket.hidden = true;
  const form = $("order-form");
  window.dispatchEvent(new CustomEvent("pm:ticket"));
  function placeTicket() {
    const host = document.querySelector(`.view[data-view="${view}"] .ticket-host`);
    if (host) host.appendChild(ticket);
    ticket.hidden = !host;
  }
  function syncTicketSymbol(s) {
    if (normSymbol(form.symbol.value) !== s) { form.symbol.value = short(s); pendingKey = null; }
  }
  let pendingKey = null;             // one idempotency key per intended order: retries cannot buy twice
  let submitting = false;
  const side = () => form.querySelector("input[name=side]:checked").value;
  function updateEstimate() {
    const sym = normSymbol(form.symbol.value);
    const q = Number(form.quantity.value);
    const c = quoteCache.get(sym);
    const p = c ? c.q.price : null;
    $("o-est").textContent = p && Number.isInteger(q) && q > 0 ? inr(p * q) : "—";
    const s = side();
    $("order-submit").hidden = s === "SELL";
    form.querySelector('[data-rb="hold"]').hidden = s !== "SELL";
    let max = 0, hint = "";
    if (s === "BUY") {
      $("o-power-k").textContent = "Buying power";
      $("o-power").textContent = state.wallet ? paise(state.wallet.availableBalancePaise) : "—";
      if (p && state.wallet) { max = Math.min(500, Math.floor(state.wallet.availableBalancePaise / Math.round(p * 100))); hint = `Up to ${max} share${max === 1 ? "" : "s"} with your buying power`; }
    } else {
      const held = state.holdings.find((h) => h.symbol === sym);
      $("o-power-k").textContent = "You hold";
      $("o-power").textContent = `${held ? held.quantity : 0} share${held && held.quantity === 1 ? "" : "s"}`;
      max = held ? held.quantity : 0;
      hint = held ? `Slide to choose up to ${held.quantity}` : "";
    }
    ui("qty", { max, value: Number.isInteger(q) && q > 0 ? q : 1, side: s, hint });
    ui("hold", { label: `Hold to sell ${Number.isInteger(q) && q > 0 ? q : ""} ${short(sym)}`.replace(/\s+/g, " ").trim(), disabled: submitting });
  }
  form.addEventListener("input", () => { pendingKey = null; $("order-err").textContent = ""; updateEstimate(); });
  form.addEventListener("change", updateEstimate);
  let symT;
  form.symbol.addEventListener("input", () => {
    clearTimeout(symT);
    symT = setTimeout(() => {
      const s = normSymbol(form.symbol.value);
      if (s.length < 3) return;
      quote(s).then(updateEstimate, () => {});
    }, 600);
  });
  window.addEventListener("pm:hold-sell", () => { if (!ticket.hidden && side() === "SELL") form.requestSubmit(); });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("order-err");
    err.textContent = "";
    form.symbol.removeAttribute("aria-invalid"); form.quantity.removeAttribute("aria-invalid");
    const symbol = normSymbol(form.symbol.value);
    const quantity = Number(form.quantity.value);
    if (!symbol) { form.symbol.setAttribute("aria-invalid", "true"); return (err.textContent = "Enter an NSE symbol, such as TCS."); }
    if (symbol.length > 20) { form.symbol.setAttribute("aria-invalid", "true"); return (err.textContent = "Symbols are at most 20 characters."); }
    if (!Number.isInteger(quantity) || quantity <= 0) { form.quantity.setAttribute("aria-invalid", "true"); return (err.textContent = "Quantity must be a whole number of shares, 1 or more."); }
    const s = side();
    if (s === "SELL") {
      const held = state.holdings.find((h) => h.symbol === symbol);
      if (!held || held.quantity < quantity) {
        form.quantity.setAttribute("aria-invalid", "true");
        return (err.textContent = held ? `You hold ${held.quantity} share${held.quantity > 1 ? "s" : ""} of ${symbol}.` : `You do not hold ${symbol}.`);
      }
    } else {
      const c = quoteCache.get(symbol);
      if (c && c.q.price && state.wallet) {
        const need = Math.round(c.q.price * 100) * quantity;
        if (need > state.wallet.availableBalancePaise) {
          form.quantity.setAttribute("aria-invalid", "true");
          return (err.textContent = `That needs about ${paise(need)}. You have ${paise(state.wallet.availableBalancePaise)} available.`);
        }
      }
    }
    if (submitting) return;
    pendingKey = pendingKey || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());
    const btn = $("order-submit");
    submitting = true; btn.disabled = true; updateEstimate();
    try {
      const out = await api("/api/orders", { method: "POST", body: { symbol, side: s, quantity }, headers: { "Idempotency-Key": pendingKey } });
      pendingKey = null;
      const o = out.order;
      if (!state.orders.some((x) => x._id === o._id)) state.orders.unshift(o);
      toast(out.message || "Order received", `${s} ${quantity} ${symbol}, waiting for a worker.`);
      spark(s === "SELL" ? form.querySelector('[data-rb="hold"]') : btn);
      await refresh(["wallet"]);
    } catch (ex) {
      err.textContent = ex.message;
    } finally {
      submitting = false; btn.disabled = false; updateEstimate();
    }
  });

  // =====================================================
  // Realtime
  // =====================================================
  let socket = null;
  function setConn(on) {
    const el = $("conn");
    el.dataset.state = on ? "on" : "off";
    el.querySelector("span").textContent = on ? "Live" : "Offline";
    if (view === "settings") RENDER.settings();
  }
  function connectSocket() {
    if (socket || !window.io || !token) return;
    socket = window.io({ auth: { token }, transports: ["websocket", "polling"] });
    socket.on("connect", () => setConn(true));
    socket.on("disconnect", () => setConn(false));
    socket.on("connect_error", () => setConn(false));
    socket.on("order:update", (o) => {
      const i = state.orders.findIndex((x) => x._id === o._id);
      if (i >= 0) state.orders[i] = { ...state.orders[i], ...o }; else state.orders.unshift(o);
      if (o.status === "COMPLETED" || o.status === "REJECTED") {
        const filled = o.status === "COMPLETED";
        const title = filled ? "Order filled" : "Order rejected";
        const detail = filled ? `${o.side} ${o.quantity} ${o.symbol} at ${paise(o.executionPricePaise)}` : (o.rejectionReason || `${o.side} ${o.symbol} was not filled`);
        state.notifs.unshift({ id: o._id + o.status, side: o.side, status: o.status, title, detail, at: Date.now(), read: view === "notifications" });
        saveNotifs();
        if (prefs.toasts) toast(title, detail + ".", filled ? "ok" : "err");
      }
      quoteCache.delete(o.symbol);
      refresh(["wallet", "holdings", "tx", "phist"]);
    });
  }

  // =====================================================
  // Boot
  // =====================================================
  async function enterApp() {
    if (!state.user) state.user = await api("/api/auth/me");
    state.watch = store.json(userKey("watch"), DEFAULT_WATCH.slice());
    state.notifs = store.json(userKey("notifs"), []);
    $("auth").hidden = true;
    $("shell").hidden = false;
    connectSocket();
    startPolling();
    go();
    await refresh();
    pollWatch();
    quote(state.symbol).then(updateEstimate, () => {});
  }

  let resizeT;
  window.addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { if (view === "portfolio" || view === "analytics") render(); }, 150);
  });

  async function boot() {
    setMode("login");
    try { const r = await fetch("/health"); setApiState(r.ok); } catch { setApiState(false); }
    if (token) {
      try { await enterApp(); return; } catch { signOut(); }
    }
    $("auth").hidden = false;
  }
  boot();
})();
