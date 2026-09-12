import mongoose from "mongoose";

export async function connectDatabase() {
  await mongoose.connect("mongodb://127.0.0.1:27017/octatrade");
  console.log("MongoDB connected");
}