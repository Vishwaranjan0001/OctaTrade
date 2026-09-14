import mongoose from "mongoose";

/*
  An order record.

  Money is stored in integer paise, consistent with Wallet and Holding, so the
  whole system reconciles exactly without floating-point drift.

  status
    NEW       accepted and recorded, not yet settled
    FILLED    executed; wallet settled and holding updated
    REJECTED  refused before any money or shares moved
    CANCELLED reserved for future order types that can be withdrawn
*/
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

    type: {
      type: String,
      required: true,
      default: "MARKET",
      enum: ["MARKET"]
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    // The quote the order was priced from, in paise.
    requestedPricePaise: {
      type: Number,
      required: true,
      min: 0
    },

    // The price it actually settled at. Null until the order fills.
    executedPricePaise: {
      type: Number,
      default: null,
      min: 0
    },

    // quantity * executedPricePaise. Null until the order fills.
    totalValuePaise: {
      type: Number,
      default: null,
      min: 0
    },

    status: {
      type: String,
      required: true,
      default: "NEW",
      enum: ["NEW", "FILLED", "REJECTED", "CANCELLED"]
    },

    rejectionReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index({
  userId: 1,
  createdAt: -1
});

export const Order = mongoose.model("Order", orderSchema);
