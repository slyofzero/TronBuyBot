import { PairData, PairsData } from "@/types";
import { SunPumpTokenData } from "@/types/sunpumpapidata";
import { apiFetcher } from "@/utils/api";
import { log } from "@/utils/handlers";

interface StoredMemoData extends Partial<PairData> {
  holders?: number;
}

export const memoTokenData: { [key: string]: StoredMemoData } = {};
export let pairsToWatch: string[] = [];
export function setPairsToWatch(newPairsToWatch: string[]) {
  pairsToWatch = newPairsToWatch;
}

export async function memoizeTokenData(tokens: string[]) {
  log("Memoizing token data...");

  for (const token of tokens) {
    try {
      const tokenData = await apiFetcher<PairsData>(
        `https://api.dexscreener.com/latest/dex/tokens/${token}`
      );
      const data = tokenData?.data?.pairs?.at(0);
      const tokenAddress = data?.baseToken.address;

      let toStoreData: StoredMemoData | null = null;

      if (tokenAddress) {
        // memoTokenData[tokenAddress] = data;
        toStoreData = data;
      } else {
        const sunpumpData = await apiFetcher<SunPumpTokenData>(
          `https://api-v2.sunpump.meme/pump-api/token/${token}`
        );

        const tokenData = sunpumpData.data?.data;

        if (tokenData) {
          const priceUsd = String(tokenData.priceInTrx * tokenData.trxPriceInUsd); // prettier-ignore
          toStoreData = { priceUsd, fdv: tokenData.marketCap };
        }
      }

      const holders = await apiFetcher<any>(
        `https://api-v2.sunpump.meme/pump-api/token/holders?address=${token}`
      );
      const holdersCount = holders.data?.data?.metadata?.total;
      memoTokenData[token] = { ...toStoreData, holders: holdersCount };
    } catch (error) {
      continue;
    }
  }

  log("✅ Memoized token data...");
}
