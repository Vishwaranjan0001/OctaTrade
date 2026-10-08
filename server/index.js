import "dotenv/config";
import { connectDatabase } from "./config/database.js";
import app from "./app.js";
import { connectRedis } from "./config/redis.js"; 
await connectDatabase();
await connectRedis();   

const PORT = 3000;

app.listen(PORT, () => {
  console.log("Server is listening");
});
