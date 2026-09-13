import mongoose from "mongoose";

const holdingSchema = new mongoose.Schema(
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

    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },

    averageBuyPricePaise: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

holdingSchema.index(
  {
    userId: 1,
    symbol: 1
  },
  {
    unique: true
  }
);

export const Holding = mongoose.model("Holding", holdingSchema);