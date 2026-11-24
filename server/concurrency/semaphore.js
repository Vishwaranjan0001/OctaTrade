import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { redisClient } from "../config/redis.js";

// Counting semaphore shared by all processes, kept in Redis.
// A lock lets ONE holder in; this lets up to `limit` holders in at once.
// The semaphore is a sorted set of holder tokens, scored by the time they entered.
// A token older than 15 s is dropped, so a crashed holder cannot keep its slot forever.
const LEASE_MS = 15000;

// wait (P): drop expired holders, then join only if fewer than `limit` are inside.
// It runs inside Redis as one step, so two processes cannot both take the last slot.
const ENTER_SCRIPT = `
redis.call("ZREMRANGEBYSCORE", KEYS[1], "-inf", ARGV[1])
if redis.call("ZCARD", KEYS[1]) < tonumber(ARGV[2]) then
  redis.call("ZADD", KEYS[1], ARGV[3], ARGV[4])
  return 1
end
return 0
`;

// Runs fn while holding one slot. Waits (retrying every 50 ms) until a slot is free.
export async function withSemaphore(name, limit, fn) {
  const key = `semaphore:${name}`;
  const token = randomUUID();

  while (true) {
    const now = Date.now();
    const entered = await redisClient.sendCommand([
      "EVAL", ENTER_SCRIPT, "1", key, String(now - LEASE_MS), String(limit), String(now), token
    ]);

    if (entered === 1) {
      break;
    }

    await sleep(50);
  }

  try {
    return await fn();
  } finally {
    // signal (V): leave, freeing the slot.
    await redisClient.sendCommand(["ZREM", key, token]);
  }
}
