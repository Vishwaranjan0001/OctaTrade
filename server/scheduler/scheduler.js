import { redisClient } from "../config/redis.js";

export const POLICIES = ["FCFS", "PRIORITY", "ROUND_ROBIN"];

const POLICY_KEY = "scheduler:policy";

// FCFS and PRIORITY: one sorted set. The order with the SMALLEST score runs first.
const ORDER_QUEUE_KEY = "queue:orders";

// PRIORITY: every level below 1 counts as arriving 5 seconds later.
// So a low-priority order is not stuck forever: after waiting long enough it wins (aging).
const PRIORITY_STEP_MS = 5000;

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

export async function getSchedulingPolicy() {
  const policy = await redisClient.sendCommand(["GET", POLICY_KEY]);

  if (POLICIES.includes(policy)) {
    return policy;
  }

  return "FCFS";
}

export async function setSchedulingPolicy(policy) {
  await redisClient.sendCommand(["SET", POLICY_KEY, policy]);
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
    score = score + (order.priority - 1) * PRIORITY_STEP_MS;
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
  const policy = await getSchedulingPolicy();

  if (policy === "ROUND_ROBIN") {
    const orderId = await takeRoundRobinOrder();

    if (orderId) {
      return orderId;
    }

    // Orders queued before the policy was changed
    return takeSortedOrder();
  }

  const orderId = await takeSortedOrder();

  if (orderId) {
    return orderId;
  }

  // Orders queued before the policy was changed
  return takeRoundRobinOrder();
}
