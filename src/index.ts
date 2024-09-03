import { Bot } from "grammy";
import { initiateBotCommands, initiateCallbackQueries } from "./bot";
import { log } from "./utils/handlers";
import { BOT_TOKEN } from "./utils/env";
import {
  projectGroups,
  syncProjectGroups,
  tokensToWatch,
} from "./vars/projectGroups";
import { memoizeTokenData } from "./vars/tokens";
import { syncAdvertisements } from "./vars/advertisements";
import { syncTrendingTokens } from "./vars/trending";
import { syncTrendingMessageId } from "./vars/message";
import { TronWeb } from "tronweb";
import { getBlocks } from "./utils/buy";

export const tronWeb = new TronWeb({
  fullHost: "https://api.trongrid.io",
});

export const teleBot = new Bot(BOT_TOKEN || "");
log("Bot instance ready");

(async function () {
  teleBot.start();
  log("Telegram bot setup");
  initiateBotCommands();
  initiateCallbackQueries();

  await Promise.all([
    syncAdvertisements(),
    syncProjectGroups(),
    syncTrendingTokens(),
    syncTrendingMessageId(),
  ]);

  await memoizeTokenData(tokensToWatch);

  getBlocks();

  // Recurse functions
  setInterval(
    async () => await memoizeTokenData(projectGroups.map(({ token }) => token)),
    7 * 1e3
  );
  setInterval(
    async () =>
      await Promise.all([syncTrendingTokens(), syncTrendingMessageId()]),
    60 * 1e3
  );
})();
