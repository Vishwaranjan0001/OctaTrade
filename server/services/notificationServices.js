import { Notification } from "../models/Notification.js";

const TITLES = {
  COMPLETED: "Order filled",
  REJECTED: "Order rejected",
  CANCELLED: "Order cancelled"
};

// Saved when an order is filled, rejected or cancelled, so the user sees it in any browser.
export async function createOrderNotification(order) {
  let message = `${order.side} ${order.quantity} ${order.symbol}`;

  if (order.status === "COMPLETED") {
    message = message + ` at ₹${(order.executionPricePaise / 100).toFixed(2)}`;
  }

  if (order.status === "REJECTED") {
    message = message + `: ${order.rejectionReason}`;
  }

  await Notification.create({
    userId: order.userId,
    orderId: order._id,
    title: TITLES[order.status],
    message: message
  });
}

export async function getNotifications(userId) {
  return Notification.find({
    userId: userId
  })
    .sort({
      createdAt: -1
    })
    .limit(100);
}

export async function markAllNotificationsRead(userId) {
  await Notification.updateMany(
    {
      userId: userId
    },
    {
      read: true
    }
  );
}

export async function clearNotifications(userId) {
  await Notification.deleteMany({
    userId: userId
  });
}
