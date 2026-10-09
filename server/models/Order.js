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
      enum: ["PENDING", "PROCESSING", "COMPLETED", "REJECTED", "CANCELLED"],
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
