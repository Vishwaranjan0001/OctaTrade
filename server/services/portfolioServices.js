import { Holding } from "../models/Holding.js";

export async function getHoldingsByUserId(userId) {
  const holdings = await Holding.find({
    userId: userId
  }).sort({
    symbol: 1
  });

  return holdings;
}