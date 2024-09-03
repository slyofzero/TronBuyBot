import { TronWeb } from "tronweb";
import { tronWeb } from "..";
import { swapEvent } from "./constants";

export function isValidEthAddress(address: string) {
  const regex = /^0x[a-fA-F0-9]{40}$/;
  return regex.test(address);
}
export function getTokenAddress(coinStore: string) {
  const match = coinStore.match(/CoinStore<([^>]+)>/);
  const innerText = match ? match[1] : "";

  return innerText;
}

export function hexToTronAddress(hex: string) {
  // Remove leading zeros and get the last 40 characters (20 bytes)
  const addressHex = hex.slice(-40);

  // Convert the hex to a Tron address using TronWeb
  const tronAddress = TronWeb.address.fromHex(`41${addressHex}`);
  return tronAddress;
}

export function decodeHexToDecimal(hex: string) {
  return BigInt(`0x${hex}`).toString();
}

export async function getSwapLog(txnHash: string) {
  const txn = await tronWeb.trx.getTransactionInfo(txnHash);
  const swapLog = txn.log?.find(({ topics }) => topics.includes(swapEvent));

  if (!swapLog) return;

  const segmentLength = 64; // Each segment is 32 bytes or 64 hex characters
  const numberOfSegments = swapLog.data.length / segmentLength; // Calculate how many segments there are

  const decodedValues = [];

  for (let i = 0; i < numberOfSegments; i++) {
    const start = i * segmentLength;
    const end = start + segmentLength;
    const segment = swapLog.data.slice(start, end);
    decodedValues.push(decodeHexToDecimal(segment));
  }

  const [amount0In, , , amount1Out] = decodedValues;
  const contractAddress = hexToTronAddress(swapLog.address);

  return {
    amount0In: Number(Number(tronWeb.fromSun(Number(amount0In))).toFixed(2)),
    amount1Out: Number((Number(amount1Out) / 1e18).toFixed(2)),
    pool: contractAddress,
  };
}
