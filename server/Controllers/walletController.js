import {
  getWalletByUserId,
  depositFunds,
  getWalletTransactions
} from "../services/walletServices.js";

export async function getMyWallet(req, res) {
  try {
    const wallet = await getWalletByUserId(req.userId);

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found"
      });
    }

    return res.status(200).json({
      id: wallet._id,
      availableBalancePaise: wallet.availableBalancePaise,
      reservedBalancePaise: wallet.reservedBalancePaise,
      currency: wallet.currency
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      message: "Unable to retrieve wallet"
    });
  }
}

export async function depositToWallet(req, res) {
  try {
    const amountPaise = req.body.amountPaise;

    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      return res.status(400).json({
        message: "amountPaise must be a positive integer"
      });
    }

    const wallet = await depositFunds(req.userId, amountPaise);

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found"
      });
    }

    return res.status(200).json({
      message: "Funds deposited successfully",
      wallet: {
        id: wallet._id,
        availableBalancePaise: wallet.availableBalancePaise,
        reservedBalancePaise: wallet.reservedBalancePaise,
        currency: wallet.currency
      }
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      message: "Unable to deposit funds"
    });
  }
}

export async function getMyWalletTransactions(req, res) {
  try {
    const transactions = await getWalletTransactions(req.userId);

    return res.status(200).json({
      transactions: transactions
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      message: "Unable to retrieve wallet transactions"
    });
  }
}
