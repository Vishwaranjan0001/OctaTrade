export function validateSymbol(req,res,next){
    const symbol=req.params.symbol.trim().toUpperCase();
    if(symbol.length>20){
        res.status(400).json({msg:"Invalid Stock"});
    }
    req.params.symbol=symbol;
    next();
}