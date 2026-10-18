import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { redisClient } from "../config/redis.js";

const ORDER_EVENTS_CHANNEL = "order-events";

export async function startSocketServer(httpServer) {
  const io = new Server(httpServer);

  io.use((socket, next) => {
    try {
      const payload = jwt.verify(
        socket.handshake.auth.token,
        process.env.JWT_SECRET
      );

      socket.data.userId = payload.userId;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
  });

  const subscriber = redisClient.duplicate();

  subscriber.on("error", (error) => {
    console.error("Redis subscriber error:", error.message);
  });

  await subscriber.connect();

  await subscriber.subscribe(ORDER_EVENTS_CHANNEL, (message) => {
    const order = JSON.parse(message);

    io.to(`user:${order.userId}`).emit("order:update", order);
  });
}

export async function publishOrderUpdate(order) {
  await redisClient.sendCommand([
    "PUBLISH", ORDER_EVENTS_CHANNEL, JSON.stringify(order)
  ]);
}
