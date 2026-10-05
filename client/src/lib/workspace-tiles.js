// Purpose: brand-styled disc images for the landing page's InfiniteMenu, drawn on a canvas
// so no external images are needed. Input: none. Output: menu items with data-URL images.
// File: lib/workspace-tiles.js.

const GOLD = "#c59b5c";
const CREAM = "#e5d7c4";
const BRONZE = "#8c6531";

const glyphs = {
  dashboard(ctx) {
    ctx.strokeStyle = GOLD;
    [[-70, -70, 62, 84], [8, -70, 62, 44], [8, -10, 62, 80], [-70, 30, 62, 40]].forEach(([x, y, w, h]) => {
      ctx.strokeRect(x, y, w, h);
    });
    ctx.fillStyle = CREAM;
    ctx.fillRect(-62, -62, 22, 6);
  },
  markets(ctx) {
    [[-60, -20, 50, -50, 40], [-30, -40, 40, -60, 20], [0, -10, 46, -30, 66], [30, -60, 30, -80, -20], [60, -70, 40, -90, -40]].forEach(([x, top, h, wickTop, wickBottom], i) => {
      ctx.strokeStyle = i % 2 ? CREAM : GOLD;
      ctx.beginPath();
      ctx.moveTo(x, wickTop);
      ctx.lineTo(x, wickBottom + h);
      ctx.stroke();
      ctx.fillStyle = i % 2 ? CREAM : GOLD;
      ctx.fillRect(x - 10, top, 20, h);
    });
  },
  trade(ctx) {
    const arrow = (x, dir, color) => {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, 60 * dir);
      ctx.lineTo(x, -60 * dir);
      ctx.moveTo(x - 26, -34 * dir);
      ctx.lineTo(x, -60 * dir);
      ctx.lineTo(x + 26, -34 * dir);
      ctx.stroke();
    };
    arrow(-34, 1, GOLD);
    arrow(34, -1, CREAM);
  },
  portfolio(ctx) {
    ctx.lineWidth = 22;
    [[0, 0.46, GOLD], [0.5, 0.78, CREAM], [0.82, 0.96, BRONZE]].forEach(([from, to, color]) => {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, 62, from * Math.PI * 2 - Math.PI / 2, to * Math.PI * 2 - Math.PI / 2);
      ctx.stroke();
    });
  },
  watchlist(ctx) {
    ctx.strokeStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(-84, 0);
    ctx.quadraticCurveTo(0, -78, 84, 0);
    ctx.quadraticCurveTo(0, 78, -84, 0);
    ctx.stroke();
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
  },
  analytics(ctx) {
    ctx.strokeStyle = "rgba(229, 215, 196, .45)";
    ctx.beginPath();
    ctx.moveTo(-80, -70);
    ctx.lineTo(-80, 70);
    ctx.lineTo(84, 70);
    ctx.stroke();
    const points = [[-62, 40], [-30, 14], [0, 26], [34, -18], [70, -52]];
    ctx.strokeStyle = GOLD;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.fillStyle = CREAM;
    points.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    });
  },
  orders(ctx) {
    [-54, -18, 18, 54].forEach((y, i) => {
      ctx.fillStyle = i === 3 ? "rgba(229, 215, 196, .35)" : GOLD;
      ctx.fillRect(-78, y - 9, 18, 18);
      ctx.strokeStyle = i === 3 ? "rgba(229, 215, 196, .35)" : CREAM;
      ctx.beginPath();
      ctx.moveTo(-42, y);
      ctx.lineTo(i % 2 ? 54 : 80, y);
      ctx.stroke();
    });
  },
  wallet(ctx) {
    ctx.strokeStyle = GOLD;
    ctx.strokeRect(-84, -52, 168, 112);
    ctx.beginPath();
    ctx.moveTo(-84, -52);
    ctx.lineTo(50, -80);
    ctx.lineTo(60, -52);
    ctx.stroke();
    ctx.strokeStyle = CREAM;
    ctx.strokeRect(30, -12, 54, 34);
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.arc(52, 5, 6, 0, Math.PI * 2);
    ctx.fill();
  },
  activity(ctx) {
    ctx.strokeStyle = GOLD;
    ctx.beginPath();
    [[-90, 0], [-44, 0], [-26, -50], [-2, 56], [22, -26], [38, 0], [90, 0]].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.arc(90, 0, 8, 0, Math.PI * 2);
    ctx.fill();
  }
};

const areas = [
  ["dashboard", "Dashboard", "/dashboard", "Portfolio value, cash and recent moves at a glance."],
  ["markets", "Markets", "/markets", "Search securities and read current market context."],
  ["trade", "Trade", "/trade", "Review and place simulated buy and sell orders."],
  ["portfolio", "Portfolio", "/portfolio", "Holdings and allocation in one connected view."],
  ["watchlist", "Watchlist", "/watchlist", "Keep the names you are studying close before acting."],
  ["analytics", "Analytics", "/analytics", "See how your practice decisions played out."],
  ["orders", "Orders", "/orders", "Every simulated order with its status and history."],
  ["wallet", "Wallet", "/wallet", "Paper cash: deposits, balance and transactions."],
  ["activity", "Activity", "/activity", "A timeline of your practice decisions."]
];

function drawTile(glyph, label) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const background = ctx.createRadialGradient(256, 230, 20, 256, 256, 300);
  background.addColorStop(0, "#211d17");
  background.addColorStop(0.6, "#0d0c0a");
  background.addColorStop(1, "#050505");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, size, size);

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(197, 155, 92, .4)";
  ctx.beginPath();
  ctx.arc(256, 256, 214, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(242, 239, 232, .08)";
  ctx.beginPath();
  ctx.arc(256, 256, 172, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.translate(256, 226);
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  glyphs[glyph](ctx);
  ctx.restore();

  ctx.fillStyle = "#a8a39a";
  ctx.font = '600 22px "IBM Plex Mono", Consolas, monospace';
  ctx.textAlign = "center";
  ctx.fillText(label.toUpperCase().split("").join(" "), 256, 356);

  return canvas.toDataURL("image/png");
}

export function createWorkspaceItems() {
  return areas.map(([glyph, title, link, description]) => ({
    image: drawTile(glyph, title),
    link,
    title,
    description
  }));
}
