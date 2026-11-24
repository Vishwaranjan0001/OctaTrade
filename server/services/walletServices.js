import mongoose from "mongoose";
import { Wallet } from "../models/Wallet.js";
import { WalletTransaction } from "../models/WalletTransaction.js";

// Creates a new wallet for a user within the provided database session.
export async function createWallet(userId, session) {
  const createdWallets = await Wallet.create(
    [
      {
        userId: userId
      }
    ],
    { session: session }
  );

  return createdWallets[0];
}

// Retrieves a user's wallet using their user ID.
// Returns null if the wallet does not exist.
export async function getWalletByUserId(userId) {
  const wallet = await Wallet.findOne({
    userId: userId
  });

  if (!wallet) {
    return null;
  }

  return wallet;
}

// Deposits funds into a user's wallet and records the transaction.
// The amount must be a positive integer expressed in paise.
export async function depositFunds(userId, amountPaise) {
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    throw new Error("Amount must be a positive integer in paise");
  }

  // Starts a MongoDB session to execute the deposit as a transaction.
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Atomically increases the available balance and returns the updated wallet.
    const wallet = await Wallet.findOneAndUpdate(
      {
        userId: userId
      },
      {
        $inc: {
          availableBalancePaise: amountPaise
        }
      },
      {
        returnDocument: "after",
        session: session
      }
    );

    if (!wallet) {
      await session.abortTransaction();
      return null;
    }

    // Records the deposit along with the wallet balances after the operation.
    await WalletTransaction.create(
      [
        {
          userId: userId,
          walletId: wallet._id,
          type: "DEPOSIT",
          amountPaise: amountPaise,
          availableBalanceAfterPaise: wallet.availableBalancePaise,
          reservedBalanceAfterPaise: wallet.reservedBalancePaise
        }
      ],
      { session: session }
    );

    // Commits the balance update and transaction record together.
    await session.commitTransaction();

    return wallet;
  } catch (error) {
    // Aborts the transaction if any operation fails.
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    throw error;
  } finally {
    // Releases the MongoDB session regardless of success or failure.
    await session.endSession();
  }
}

// Fetches a user's transaction history, newest transaction first.
export async function getWalletTransactions(userId) {
  const transactions = await WalletTransaction.find({
    userId: userId
  }).sort({
    createdAt: -1
  });

  return transactions;
}
