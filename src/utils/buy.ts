import { apiFetcher } from "./api";
import { SwapDataResponse } from "@/types/txn";
import { sendAlert } from "@/bot/sendAlert";
import { sleep } from "./time";
import { errorHandler } from "./handlers";
import { tokensToWatch } from "@/vars/projectGroups";

const lastTxnHash: { [key: string]: string } = {};

export async function getTokenBuys() {
  for (const token of tokensToWatch) {
    try {
      const buys = await apiFetcher<SwapDataResponse>(
        `https://api-v2.sunpump.meme/pump-api/transactions/token/${token}?page=1&size=10&sort=txDateTime:DESC`
      );

      for (const swap of (buys.data?.data.swaps || []).slice().reverse()) {
        const { txHash, toTokenAddress } = swap;

        if (txHash === lastTxnHash[toTokenAddress]) break;

        lastTxnHash[toTokenAddress] = txHash;
        if (swap.txnOrderType === "SELL") continue;

        sendAlert({
          fromTokenAmount: swap.fromTokenAmount,
          fromTokenSymbol: swap.fromTokenSymbol,
          toTokenAmount: swap.toTokenAmount,
          toTokenSymbol: swap.toTokenSymbol,
          txnHash: txHash,
          buyer: swap.userAddress,
          token: swap.toTokenAddress,
        });
      }
    } catch (error) {
      errorHandler(error);
    }
  }

  sleep(5 * 1e3).then(() => getTokenBuys());
}
