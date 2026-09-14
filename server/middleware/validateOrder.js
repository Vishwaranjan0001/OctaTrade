/*
  Validates an order request before it reaches the service.

  Mirrors the constraints the Order model enforces, so a bad request is answered
  with a clear 400 rather than a Mongoose validation error.
*/
export function validateOrder(req, res, next) {
  const symbol = req.body.symbol;
  const side = req.body.side;
  const quantity = req.body.quantity;

  if (typeof symbol !== "string" || symbol.trim().length === 0) {
    return res.status(400).json({
      message: "symbol is required"
    });
  }

  const normalisedSymbol = symbol.trim().toUpperCase();

  if (normalisedSymbol.length > 20) {
    return res.status(400).json({
      message: "symbol must be 20 characters or fewer"
    });
  }

  if (side !== "BUY" && side !== "SELL") {
    return res.status(400).json({
      message: "side must be BUY or SELL"
    });
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({
      message: "quantity must be a positive integer"
    });
  }

  req.body.symbol = normalisedSymbol;
  req.body.side = side;
  req.body.quantity = quantity;

  next();
}
