import { Order } from "../models/Order.js";

export async function getSchedulingMetrics(minutes) {
  const since = new Date(Date.now() - minutes * 60 * 1000);

  const results = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: since },
        schedulingPolicy: { $ne: null },
        startedAt: { $ne: null },
        finishedAt: { $ne: null }
      }
    },
    {
      $group: {
        _id: "$schedulingPolicy",
        orders: { $sum: 1 },
        averageWaitingMs: {
          $avg: { $subtract: ["$startedAt", "$createdAt"] }
        },
        averageExecutionMs: {
          $avg: { $subtract: ["$finishedAt", "$startedAt"] }
        },
        averageTurnaroundMs: {
          $avg: { $subtract: ["$finishedAt", "$createdAt"] }
        },
        firstArrival: { $min: "$createdAt" },
        lastFinish: { $max: "$finishedAt" }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  return results.map((result) => {
    const totalSeconds = (result.lastFinish - result.firstArrival) / 1000;

    return {
      policy: result._id,
      orders: result.orders,
      averageWaitingMs: Math.round(result.averageWaitingMs),
      averageExecutionMs: Math.round(result.averageExecutionMs),
      averageTurnaroundMs: Math.round(result.averageTurnaroundMs),
      throughputPerSecond: Number((result.orders / totalSeconds).toFixed(2))
    };
  });
}
