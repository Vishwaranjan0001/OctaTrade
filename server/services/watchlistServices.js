import { WatchlistItem } from "../models/WatchlistItem.js";

export async function getWatchlist(userId) {
  const items = await WatchlistItem.find({
    userId: userId
  }).sort({
    createdAt: 1
  });

  return items.map((item) => item.symbol);
}

export async function addToWatchlist(userId, symbol) {
  // upsert: adding a symbol that is already there changes nothing.
  await WatchlistItem.updateOne(
    {
      userId: userId,
      symbol: symbol
    },
    {
      userId: userId,
      symbol: symbol
    },
    {
      upsert: true
    }
  );

  return getWatchlist(userId);
}

export async function removeFromWatchlist(userId, symbol) {
  await WatchlistItem.deleteOne({
    userId: userId,
    symbol: symbol
  });

  return getWatchlist(userId);
}
