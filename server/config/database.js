import mongoose from "mongoose";

export async function connectDatabase() {
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/octatrade?replicaSet=rs0"
  );
  console.log("MongoDB connected");
}