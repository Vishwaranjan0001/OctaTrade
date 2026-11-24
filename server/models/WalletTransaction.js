import mongoose from "mongoose";

// Defines the structure of records that track wallet-related transactions.
const walletTransactionSchema = new mongoose.Schema(
  {
    // Identifies the user associated with this transaction.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // References the wallet in which this transaction occurred.
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true
    },

    // Specifies the type of wallet operation being recorded.
    // Only the defined transaction types are allowed.
    type: {
      type: String,
      required: true,
      enum: ["DEPOSIT", "RESERVE", "RELEASE", "DEBIT", "CREDIT"]
    },

    // Stores the transaction amount in paise rather than rupees.
    // A minimum value of 1 ensures the transaction amount is positive.
    amountPaise: {
      type: Number,
      required: true,
      min: 1
    },

    // Records the available wallet balance after this transaction.
    availableBalanceAfterPaise: {
      type: Number,
      required: true,
      min: 0
    },

    // Records the reserved wallet balance after this transaction.
    reservedBalanceAfterPaise: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    // Automatically records when the transaction is created and updated.
    timestamps: true
  }
);

// Creates an index for retrieving a user's transactions
// in reverse chronological order.
walletTransactionSchema.index(
  {
    userId: 1,
    createdAt: -1
  }
);

// Creates the Mongoose model used to store and retrieve transactions.
export const WalletTransaction = mongoose.model(
  "WalletTransaction",
  walletTransactionSchema
);