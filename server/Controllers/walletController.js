import { getWalletByUserId } from "../services/walletServices.js";

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