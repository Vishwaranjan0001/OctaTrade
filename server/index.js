import express from "express";
import "dotenv/config";
import { connectDatabase } from "./config/database.js";
import quoteRoutes from "./routes/quoteRoutes.js";
import authRoutes from "./routes/authRoutes.js";
const app=express();
app.use(express.json());
await connectDatabase();
const PORT=3000;
app.get("/health",(req,res)=>{
    res.status(200).json({status:"ok"});

});
app.use("/api/quotes", quoteRoutes);
app.use("/api/auth",authRoutes);
app.listen(PORT,()=>{
    console.log("Server is listening");
});