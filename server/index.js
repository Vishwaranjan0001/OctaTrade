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
await connectDatabase();
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
    console.log("Server is listening");
});
