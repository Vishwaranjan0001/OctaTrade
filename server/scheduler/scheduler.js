import { redisClient } from "../config/redis.js";

// FCFS and PRIORITY: one sorted set. The order with the SMALLEST score runs first.
const ORDER_QUEUE_KEY = "queue:orders";

// PRIORITY: each level away from normal (2) moves the order 5 seconds.
// Priority 1 counts as arriving 5 s earlier, priority 3 as 5 s later.
// So a low-priority order is not stuck forever: after waiting long enough it wins (aging).
const PRIORITY_STEP_MS = 5000;
const NORMAL_PRIORITY = 2;

// A user with this many orders already waiting is flooding the queue.
const FLOOD_LIMIT = 3;

// A BUY above this many shares is a big order.
const LARGE_QUANTITY = 100;

// Workers serve the round-robin line on 1 pick out of every 3.
const ROUND_ROBIN_EVERY = 3;
const TURN_KEY = "scheduler:turn";

// ROUND_ROBIN: a line of users, and one list of orders per user.
// Each turn, the first user in line runs ONE order and goes to the back of the line.
const RR_USERS_KEY = "queue:rr:users";

const RR_TAKE_SCRIPT = `
local userId = redis.call("LPOP", KEYS[1])
if not userId then
  return false
end

local userQueue = "queue:rr:user:" .. userId
local orderId = redis.call("LPOP", userQueue)

if redis.call("LLEN", userQueue) > 0 then
  redis.call("RPUSH", KEYS[1], userId)
end

return orderId
`;

function userQueueKey(userId) {
  return `queue:rr:user:${userId}`;
}

// The server picks the algorithm and priority for each order. Users cannot choose.
export function chooseSchedule({ side, quantity, ordersWaiting }) {
  // Many orders from one user: share turns fairly so they don't block everyone else.
  if (ordersWaiting >= FLOOD_LIMIT) {
    return { schedulingPolicy: "ROUND_ROBIN", priority: 3 };
  }

  // Selling locks in the price and frees cash, so it goes ahead.
  if (side === "SELL") {
    return { schedulingPolicy: "PRIORITY", priority: 1 };
  }

  // Big BUY: let small orders finish first (shortest job first).
  if (quantity > LARGE_QUANTITY) {
    return { schedulingPolicy: "PRIORITY", priority: 3 };
  }

  // Normal BUY: first come, first served.
  return { schedulingPolicy: "FCFS", priority: NORMAL_PRIORITY };
}

export async function enqueueOrder(order) {
  const orderId = order._id.toString();
  const userId = order.userId.toString();

  if (order.schedulingPolicy === "ROUND_ROBIN") {
    const ordersWaiting = await redisClient.sendCommand([
      "RPUSH", userQueueKey(userId), orderId
    ]);

    // This user had nothing waiting, so they were not in the line. Add them.
    if (ordersWaiting === 1) {
      await redisClient.sendCommand(["RPUSH", RR_USERS_KEY, userId]);
    }

    return;
  }

  let score = order.createdAt.getTime();

  if (order.schedulingPolicy === "PRIORITY") {
    score = score + (order.priority - NORMAL_PRIORITY) * PRIORITY_STEP_MS;
  }

  await redisClient.sendCommand([
    "ZADD", ORDER_QUEUE_KEY, String(score), orderId
  ]);
}

async function takeSortedOrder() {
  const result = await redisClient.sendCommand(["ZPOPMIN", ORDER_QUEUE_KEY]);

  if (result.length === 0) {
    return null;
  }

  return result[0];
}

async function takeRoundRobinOrder() {
  const orderId = await redisClient.sendCommand([
    "EVAL", RR_TAKE_SCRIPT, "1", RR_USERS_KEY
  ]);

  return orderId;
}

export async function takeNextOrder() {
  // Shared counter, so all workers take turns together.
  const turn = await redisClient.sendCommand(["INCR", TURN_KEY]);

  // Round-robin's turn: serve the flooding users' line first.
  if (turn % ROUND_ROBIN_EVERY === 0) {
    const orderId = await takeRoundRobinOrder();

    if (orderId) {
      return orderId;
    }

    return takeSortedOrder();
  }

  const orderId = await takeSortedOrder();

  if (orderId) {
    return orderId;
  }

  // Sorted queue is empty, so don't leave the round-robin line waiting.
  return takeRoundRobinOrder();
}
