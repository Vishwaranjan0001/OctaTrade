import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true
    },

    type: {
      type: String,
      required: true,
      enum: ["DEPOSIT", "RESERVE", "RELEASE", "DEBIT", "CREDIT"]
    },

    amountPaise: {
      type: Number,
      required: true,
      min: 1
    },

    availableBalanceAfterPaise: {
      type: Number,
      required: true,
      min: 0
    },

    reservedBalanceAfterPaise: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

export const WalletTransaction = mongoose.model(
  "WalletTransaction",
  walletTransactionSchema
);