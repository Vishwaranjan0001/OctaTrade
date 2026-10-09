import "dotenv/config";
import http from "node:http";
import { connectDatabase } from "./config/database.js";
import { connectRedis } from "./config/redis.js";
import { startSocketServer } from "./realtime/socket.js";
import app from "./app.js";

await connectDatabase();
await connectRedis();

const PORT = 3000;

const server = http.createServer(app);

await startSocketServer(server);

server.listen(PORT, () => {
  console.log("Server is listening");
});
