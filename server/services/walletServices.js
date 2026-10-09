import mongoose from "mongoose";
import { Wallet } from "../models/Wallet.js";
import { WalletTransaction } from "../models/WalletTransaction.js";

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

export async function getWalletByUserId(userId) {
  const wallet = await Wallet.findOne({
    userId: userId
  });

  if (!wallet) {
    return null;
  }

  return wallet;
}

export async function depositFunds(userId, amountPaise) {
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    throw new Error("Amount must be a positive integer in paise");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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

    await session.commitTransaction();

    return wallet;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

export async function getWalletTransactions(userId) {
  const transactions = await WalletTransaction.find({
    userId: userId
  }).sort({
    createdAt: -1
  });

  return transactions;
}
