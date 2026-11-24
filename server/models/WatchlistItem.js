import mongoose from "mongoose";

const watchlistItemSchema = new mongoose.Schema(
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
      trim: true,
      maxlength: 20
    }
  },
  {
    timestamps: true
  }
);

// A symbol appears at most once in a user's watchlist.
watchlistItemSchema.index(
  {
    userId: 1,
    symbol: 1
  },
  {
    unique: true
  }
);

export const WatchlistItem = mongoose.model("WatchlistItem", watchlistItemSchema);
