import { LRUCache } from "./lruCache.js";
import { LFUCache } from "./lfuCache.js";

// A small cache in each process's memory, checked before Redis and Yahoo Finance.
// Set PRICE_CACHE_POLICY=LFU in .env to use LFU; anything else uses LRU.
export let priceCache = new LRUCache(50);

if (process.env.PRICE_CACHE_POLICY === "LFU") {
  priceCache = new LFUCache(50);
}
