import { Wallet } from "../models/Wallet.js";
import { WalletTransaction } from "../models/WalletTransaction.js";

export async function createWallet(userId) {
  const wallet = await Wallet.create({
    userId: userId
  });

  return wallet;
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

  const wallet = await Wallet.findOne({
    userId: userId
  });

  if (!wallet) {
    return null;
  }

  wallet.availableBalancePaise += amountPaise;
  await wallet.save();

  await WalletTransaction.create({
    userId: userId,
    walletId: wallet._id,
    type: "DEPOSIT",
    amountPaise: amountPaise,
    availableBalanceAfterPaise: wallet.availableBalancePaise,
    reservedBalanceAfterPaise: wallet.reservedBalancePaise
  });

  return wallet;
}

export async function getWalletTransactions(userId) {
  const transactions = await WalletTransaction.find({
    userId: userId
  }).sort({
    createdAt: -1
  });

  return transactions;
}
