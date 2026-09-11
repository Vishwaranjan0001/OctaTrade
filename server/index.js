import express from "express";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();
const app=express();
const PORT=3000;
app.get("/health",(req,res)=>{
    res.status(200).json({status:"ok"});

});
app.get("/api/quotes/:symbol",async(req,res)=>{
    const symbol=req.params.symbol;
    try{
        const quote=await yahooFinance.quote(symbol);
        res.status(200).json({
            symbol: quote.symbol,
            price: quote.regularMarketPrice,
            currency: quote.currency
        });
    }
    catch(err){
        res.status(502).json({
      message: "Unable to fetch market quote"
    });
    }

});
app.listen(PORT,()=>{
    console.log("Server is listening");
});