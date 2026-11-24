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
      enum: ["MARKET", "LIMIT", "STOP_LOSS"],
      default: "MARKET"
    },

    // LIMIT: BUY at or below this price, SELL at or above it.
    limitPricePaise: {
      type: Number,
      default: null,
      min: 1
    },

    // STOP_LOSS (SELL only): sell at market once the price falls to this level.
    triggerPricePaise: {
      type: Number,
      default: null,
      min: 1
    },

    // Money held back in the wallet for an open LIMIT BUY.
    reservedAmountPaise: {
      type: Number,
      default: 0,
      min: 0
    },

    // SELL only: what the sold shares cost and the profit or loss made.
    costBasisPaise: {
      type: Number,
      default: null
    },

    realizedProfitLossPaise: {
      type: Number,
      default: null
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    status: {
      type: String,
      required: true,
      // OPEN: a LIMIT or STOP_LOSS order waiting for its price.
      enum: ["PENDING", "PROCESSING", "OPEN", "COMPLETED", "REJECTED", "CANCELLED"],
      default: "PENDING"
    },

    rejectionReason: {
      type: String,
      default: null
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
    },

    idempotencyKey: {
      type: String,
      trim: true
    },

    priority: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
      default: 2
    },

    schedulingPolicy: {
      type: String,
      enum: ["FCFS", "PRIORITY", "ROUND_ROBIN"]
    },

    workerId: {
      type: Number,
      default: null
    },

    startedAt: {
      type: Date,
      default: null
    },

    finishedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index(
  {
    userId: 1,
    createdAt: -1
  }
);

// The trigger watcher looks up OPEN orders.
orderSchema.index(
  {
    status: 1
  }
);

orderSchema.index(
  {
    userId: 1,
    idempotencyKey: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      idempotencyKey: {
        $type: "string"
      }
    }
  }
);

export const Order = mongoose.model("Order", orderSchema);
