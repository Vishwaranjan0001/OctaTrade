import "dotenv/config";
import { connectDatabase } from "./config/database.js";
import app from "./app.js";

await connectDatabase();

const PORT = 3000;

app.listen(PORT, () => {
  console.log("Server is listening");
});
