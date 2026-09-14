import mongoose from "mongoose";

const stockSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    exchange: {
      type: String,
      required: true,
      enum: ["NSE"],
      default: "NSE"
    },

    currency: {
      type: String,
      required: true,
      enum: ["INR"],
      default: "INR"
    },

    isActive: {
      type: Boolean,
      required: true,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Stock = mongoose.model("Stock", stockSchema);