import "dotenv/config";
import mongoose from "mongoose";
import { fork } from "node:child_process";
import { connectDatabase } from "./config/database.js";
import { connectRedis, redisClient } from "./config/redis.js";
import { Order } from "./models/Order.js";
import { enqueueOrder } from "./scheduler/scheduler.js";

const WORKER_COUNT = Number(process.env.WORKER_COUNT) || 3;
const RESTART_DELAY_MS = 1000;

let shuttingDown = false;
const workers = new Set();
const restartTimers = new Set();

async function requeueUnfinishedOrders() {
  await connectDatabase();
  await connectRedis();

  await Order.updateMany(
    {
      status: "PROCESSING"
    },
    {
      status: "PENDING",
      startedAt: null,
      finishedAt: null,
      workerId: null
    }
  );

  const pendingOrders = await Order.find({
    status: "PENDING"
  });

  for (const order of pendingOrders) {
    await enqueueOrder(order);
  }

  console.log(`Re-queued ${pendingOrders.length} unfinished orders`);

  await mongoose.disconnect();
  redisClient.destroy();
}

function startWorker() {
  if (shuttingDown) return;
  const worker = fork(new URL("./worker.js", import.meta.url));
  workers.add(worker);

  worker.on("exit", (code) => {
    workers.delete(worker);
    if (shuttingDown) {
      return;
    }

    console.log(`Worker ${worker.pid} stopped (code ${code}). Starting a new worker.`);
    const timer = setTimeout(() => {
      restartTimers.delete(timer);
      startWorker();
    }, RESTART_DELAY_MS);
    restartTimers.add(timer);
  });
}

function shutdown() {
  shuttingDown = true;
  for (const timer of restartTimers) clearTimeout(timer);
  for (const worker of workers) worker.kill("SIGTERM");
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await requeueUnfinishedOrders();

for (let i = 0; i < WORKER_COUNT; i++) {
  startWorker();
}

console.log(`Started ${WORKER_COUNT} workers`);
