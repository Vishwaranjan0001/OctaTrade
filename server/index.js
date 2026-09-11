import express from "express";
import quoteRoutes from "./routes/quoteRoutes.js";
const app=express();
const PORT=3000;
app.get("/health",(req,res)=>{
    res.status(200).json({status:"ok"});

});
app.use("/api/quotes", quoteRoutes);
app.listen(PORT,()=>{
    console.log("Server is listening");
});