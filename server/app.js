import express from "express";
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

export default app;
