import { sleep } from "./time";
import { getSwapLog, hexToTronAddress } from "./web3";
import { tronWeb } from "..";
import { ContractParamter, Transaction } from "tronweb/lib/esm/types";
import { tokensToWatch } from "@/vars/projectGroups";
import { BuyData, sendAlert } from "@/bot/sendAlert";

let lastBlock = 0;
const allowedMethods = ["b6f9de95", "7ff36ab5", "fb3bdb41"];

export async function getBlocks() {
  const blockData = await tronWeb.trx.getCurrentBlock();
  const currentBlock = blockData.block_header.raw_data.number;

  if (currentBlock > lastBlock) {
    lastBlock = currentBlock;
    const transactions = blockData.transactions;

    if (transactions) {
      for (const txn of transactions) {
        parseTxn(txn);
      }
    }
  }

  await sleep(2000);
  getBlocks();
}

async function parseTxn(txn: Transaction<ContractParamter>) {
  const rawData = txn.raw_data.contract
    .map(({ parameter }) => {
      // @ts-expect-error weird
      const methodData = parameter.value.data as string | undefined;
      const methodHex = methodData?.slice(0, 8) || "";

      if (methodData && allowedMethods.includes(methodHex)) {
        const params = methodData.slice(8, methodData.length);

        let start = 0;
        let end = 64;

        const methodParams = [];

        while (end <= params.length) {
          const param = params.slice(start, end);
          methodParams.push(param);
          start += 64;
          end += 64;
        }

        const token = methodParams.at(-1);

        if (token)
          return {
            txn: txn.txID,
            token: hexToTronAddress(token),
            buyer: hexToTronAddress(parameter.value.owner_address),
          };
      }
    })
    .filter((val) => val);

  if (rawData.length) {
    for (const rawDataInfo of rawData) {
      const token = rawDataInfo?.token || "";

      if (tokensToWatch.includes(token)) {
        const swapData = await getSwapLog(txn.txID);

        if (swapData) {
          const txnData = {
            ...rawDataInfo,
            ...swapData,
            txnHash: txn.txID,
          } as BuyData;
          sendAlert(txnData);
        }
      }
    }
  }
}
