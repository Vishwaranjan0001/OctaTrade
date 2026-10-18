import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { redisClient } from "../config/redis.js";

const LOCK_TIME_MS = 10000;
const WAIT_LIMIT_MS = 5000;
const RETRY_DELAY_MS = 50;

const RELEASE_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
`;

export async function acquireLock(userId, waitLimitMs = WAIT_LIMIT_MS) {
  const key = `lock:user:${userId}`;
  const token = randomUUID();
  const startTime = Date.now();

  while (Date.now() - startTime < waitLimitMs) {
    const result = await redisClient.sendCommand([
      "SET", key, token, "NX", "PX", String(LOCK_TIME_MS)
    ]);

    if (result === "OK") {
      return token;
    }

    await sleep(RETRY_DELAY_MS);
  }

  return null;
}

export async function releaseLock(userId, token) {
  const key = `lock:user:${userId}`;

  await redisClient.sendCommand([
    "EVAL", RELEASE_SCRIPT, "1", key, token
  ]);
}