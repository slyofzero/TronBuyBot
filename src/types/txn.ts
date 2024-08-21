export interface SwapDataResponse {
  code: number;
  msg: string;
  data: SwapData;
}

interface SwapData {
  swaps: Swap[];
  metadata: Metadata;
}

interface Swap {
  id: string | null;
  tranType: string | null;
  txnOrderType: "BUY" | "SELL";
  userAddress: string;
  tokenAddress: string;
  swapPoolAddress: string;
  fromTokenAddress: string;
  toTokenAddress: string;
  fromTokenSymbol: string;
  toTokenSymbol: string;
  fromTokenAmount: number;
  toTokenAmount: number;
  fee: number | null;
  volumeInUsd: number | null;
  txHash: string;
  uniqueId: string;
  blockNum: number | null;
  txDateTime: number;
}

interface Metadata {
  page: number;
  size: number;
  total: number;
  sort: string;
}
