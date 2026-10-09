import "dotenv/config";
import mongoose from "mongoose";
import { setTimeout as sleep } from "node:timers/promises";
import { connectDatabase } from "./config/database.js";
import { connectRedis, redisClient } from "./config/redis.js";
import { Order } from "./models/Order.js";
import { takeNextOrder, enqueueOrder } from "./scheduler/scheduler.js";
import { acquireLock, releaseLock } from "./concurrency/userLock.js";
import { executeBuyOrder, executeSellOrder } from "./services/orderServices.js";
import { publishOrderUpdate } from "./realtime/socket.js";

const IDLE_SLEEP_MS = 200;
const LOCK_WAIT_MS = 30000;

let running = true;

async function processOrder(orderId) {
  const order = await Order.findById(orderId);

  if (!order || order.status !== "PENDING") {
    return;
  }

  const userId = order.userId.toString();
  const lockToken = await acquireLock(userId, LOCK_WAIT_MS);

  if (!lockToken) {
    await enqueueOrder(order);
    return;
  }

  try {
    const claimedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        status: "PENDING"
      },
      {
        status: "PROCESSING",
        startedAt: new Date(),
        workerId: process.pid
      },
      {
        returnDocument: "after"
      }
    );

    if (!claimedOrder) {
      return;
    }

    try {
      if (claimedOrder.side === "BUY") {
        await executeBuyOrder(claimedOrder);
      } else {
        await executeSellOrder(claimedOrder);
      }
    } catch (error) {
      console.error(`Worker ${process.pid}: order ${orderId} failed:`, error.message);
    }

    const finishedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        finishedAt: new Date()
      },
      {
        returnDocument: "after"
      }
    );

    const waitingMs = finishedOrder.startedAt - finishedOrder.createdAt;

    console.log(
      `Worker ${process.pid}: ${finishedOrder.side} ${finishedOrder.quantity} ${finishedOrder.symbol} -> ${finishedOrder.status} (waited ${waitingMs} ms)`
    );

    await publishOrderUpdate(finishedOrder);
  } finally {
    await releaseLock(userId, lockToken);
  }
}

async function startWorker() {
  await connectDatabase();
  await connectRedis();

  console.log(`Worker ${process.pid} started`);

  while (running) {
    const orderId = await takeNextOrder();

    if (!orderId) {
      await sleep(IDLE_SLEEP_MS);
      continue;
    }

    try {
      await processOrder(orderId);
    } catch (error) {
      console.error(`Worker ${process.pid}: could not process order ${orderId}:`, error.message);
    }
  }

  await mongoose.disconnect();
  redisClient.destroy();

  console.log(`Worker ${process.pid} stopped`);
}

process.on("SIGINT", () => {
  running = false;
});

process.on("SIGTERM", () => {
  running = false;
});

await startWorker();
