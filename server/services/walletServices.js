import { Wallet } from "../models/Wallet.js";

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
