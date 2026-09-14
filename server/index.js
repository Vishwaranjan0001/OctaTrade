import express from "express";
import "dotenv/config";
import { connectDatabase } from "./config/database.js";
import quoteRoutes from "./routes/quoteRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
const app=express();
app.use(express.json());
/*
  A failed connection here used to surface as a raw unhandled rejection, which
  is the first thing anyone hits when starting the project locally. Report the
  two things that are actually wrong in that case — no MongoDB, or no
  JWT_SECRET — and exit cleanly.
*/
console.log("Connecting to MongoDB...");

try {
  await connectDatabase();
} catch (error) {
  console.error("Could not connect to MongoDB at mongodb://127.0.0.1:27017/octatrade");
  console.error(error.message);
  console.error("Start MongoDB, then run `npm start` again.");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set. Create server/.env with JWT_SECRET and JWT_EXPIRES_IN.");
  process.exit(1);
}
const PORT=3000;
app.get("/health",(req,res)=>{
    res.status(200).json({status:"ok"});

});
app.use("/api/quotes", quoteRoutes);
app.use("/api/auth",authRoutes);
app.use("/api/wallet",walletRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/orders", orderRoutes);
app.listen(PORT,()=>{
    console.log(`Server is listening on http://127.0.0.1:${PORT}`);
});
