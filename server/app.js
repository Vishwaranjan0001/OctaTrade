import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import quoteRoutes from "./routes/quoteRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import schedulerRoutes from "./routes/schedulerRoutes.js";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "ok"
  });
});

app.use("/api/quotes", quoteRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/scheduler", schedulerRoutes);

// The built React site (client/dist). Express serves it so the site, the API
// and Socket.IO all live on one address in production.
const clientDist = fileURLToPath(new URL("../client/dist", import.meta.url));

app.use(express.static(clientDist));

// Pages like /dashboard are React routes, not files, so send index.html for them.
app.get("/{*page}", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  return res.sendFile(path.join(clientDist, "index.html"));
});

export default app;
