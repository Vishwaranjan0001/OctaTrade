import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    availableBalancePaise: {
      type: Number,
      required: true,
      default: 10_000_000,
      min: 0
    },
    reservedBalancePaise: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      default: "INR",
      enum: ["INR"]
    }
  },
  {
    timestamps: true
  }
);

export const Wallet = mongoose.model("Wallet", walletSchema);