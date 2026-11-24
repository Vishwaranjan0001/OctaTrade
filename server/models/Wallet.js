import mongoose from "mongoose";

// Defines the structure and validation rules for each user's wallet.
const walletSchema = new mongoose.Schema(
  {
    // Links the wallet to its owner.
    // The unique constraint ensures that each user has only one wallet.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    // Stores the funds currently available for trading or withdrawal.
    // Balance is stored in paise to avoid floating-point errors
    // when performing monetary calculations.
    availableBalancePaise: {
      type: Number,
      required: true,
      default: 10_000_000, // Initial virtual balance: ₹1,00,000.
      min: 0
    },

    // Holds funds reserved for operations such as pending orders.
    // Reserved funds are separated from the available balance.
    reservedBalancePaise: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },

    // Defines the wallet's currency.
    // INR is the only supported currency in the current system.
    currency: {
      type: String,
      required: true,
      default: "INR",
      enum: ["INR"]
    }
  },
  {
    // Automatically maintains wallet creation and modification timestamps.
    timestamps: true
  }
);

// Creates the Wallet model used by services to interact with MongoDB.
export const Wallet = mongoose.model("Wallet", walletSchema);