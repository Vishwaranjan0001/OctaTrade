import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },

    side: {
      type: String,
      required: true,
      enum: ["BUY", "SELL"]
    },

    orderType: {
      type: String,
      required: true,
      enum: ["MARKET"],
      default: "MARKET"
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    status: {
      type: String,
      required: true,
      enum: ["PENDING", "COMPLETED", "REJECTED", "CANCELLED"],
      default: "PENDING"
    },

    executionPricePaise: {
      type: Number,
      default: null,
      min: 1
    },

    totalAmountPaise: {
      type: Number,
      default: null,
      min: 1
    }
  },
  {
    timestamps: true
  }
);

export const Order = mongoose.model("Order", orderSchema);
