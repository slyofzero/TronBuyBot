import { errorHandler } from "@/utils/handlers";
import { memoTokenData } from "@/vars/tokens";
import { TRENDING_CHANNEL_LINK } from "@/utils/env";
import { trendingTokens } from "@/vars/trending";
import {
  botRemovedError,
  cleanUpBotMessage,
  hardCleanUpBotMessage,
} from "@/utils/bot";
import { trendingMessageId } from "@/vars/message";
import { projectGroups } from "@/vars/projectGroups";
import { teleBot } from "..";
import { trendingIcons } from "@/utils/constants";
import { getRandomNumber } from "@/utils/general";

export interface BuyData {
  txnHash: string;
  amount0In: number;
  amount1Out: number;
  pool: string;
  txn: string;
  token: string;
  buyer: string;
}

export async function sendAlert(data: BuyData) {
  try {
    const { buyer, token, txnHash, amount0In, amount1Out } = data;

    const groups = projectGroups.filter(
      ({ token: groupToken }) => groupToken === token
    );

    if (!groups.length) return;

    // Preparing message for token
    const tokenData = memoTokenData[token];
    const { priceUsd, fdv, info, baseToken } = tokenData;
    const toTokenSymbol = baseToken?.symbol;
    const sentUsdNumber = amount1Out * Number(priceUsd);
    const sentNative = cleanUpBotMessage(amount0In.toLocaleString("en")); // prettier-ignore
    const sentUsd = cleanUpBotMessage(sentUsdNumber.toFixed(2));
    const formattedAmount = cleanUpBotMessage(amount1Out.toLocaleString("en"));
    // const position = change ? `+${change}%` : "New!!!";
    const trendingRank = Object.entries(trendingTokens).findIndex(
      ([trendingToken]) => trendingToken === token
    );

    const displayFdv = fdv
      ? Number(
          (Number(fdv) + sentUsdNumber * getRandomNumber(1.5, 3)).toFixed(2)
        ).toLocaleString("en")
      : 0;

    // log(`${buyer} bought ${toTokenAmount} ${toTokenSymbol}`);

    const randomizeEmojiCount = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    let emojiCount = 0;
    if (sentUsdNumber <= 50) {
      emojiCount = randomizeEmojiCount(5, 10);
    } else if (sentUsdNumber <= 100) {
      emojiCount = randomizeEmojiCount(10, 35);
    } else {
      emojiCount = randomizeEmojiCount(35, 70);
    }

    // links
    const buyerLink = `https://tronscan.org/#/address/${buyer}`;
    const txnLink = `https://tronscan.org/#/transaction/${txnHash}`;
    const dexSLink = `https://dexscreener.com/tron/${token}`;

    const telegramLink = info?.socials?.find(
      ({ type }) => type.toLowerCase() === "telegram"
    )?.url;

    const specialLink = telegramLink
      ? `[Telegram](${telegramLink})`
      : `[Screener](${dexSLink})`;

    const addEmojiToMessage = (emoji: string) => {
      const emojis = emoji.repeat(emojiCount);
      const trendingPosition =
        trendingRank !== -1
          ? `[${trendingIcons[trendingRank]} \\#${
              trendingRank + 1
            } on Tron Trending](${TRENDING_CHANNEL_LINK})`
          : "";

      const message = `*[${toTokenSymbol}](${telegramLink || dexSLink}) Buy\\!*
${emojis}

🔀 Spent ${sentNative} TRX *\\($${sentUsd}\\)*
🔀 Got ${formattedAmount} *${hardCleanUpBotMessage(toTokenSymbol)}*
👤 [Buyer](${buyerLink}) \\| [Txn](${txnLink}  )
💸 [Market Cap](${dexSLink}) $${cleanUpBotMessage(displayFdv)}

[DexS](${dexSLink}) \\| ${specialLink} \\| [Trending](${TRENDING_CHANNEL_LINK}/${trendingMessageId})

${trendingPosition}`;

      return message;
    };

    // Sending Message
    for (const group of groups) {
      const { emoji, mediaType, minBuy } = group;
      if (sentUsd > Number(minBuy)) continue;
      const message = addEmojiToMessage(emoji || "🟢");

      try {
        if (group.media) {
          if (mediaType === "video") {
            await teleBot.api.sendAnimation(group.chatId, group.media, {
              parse_mode: "MarkdownV2",
              // @ts-expect-error Type not found
              disable_web_page_preview: true,
              caption: message,
            });
          } else {
            await teleBot.api.sendPhoto(group.chatId, group.media, {
              parse_mode: "MarkdownV2",
              // @ts-expect-error Type not found
              disable_web_page_preview: true,
              caption: message,
            });
          }
        } else {
          await teleBot.api.sendMessage(group.chatId, message, {
            parse_mode: "MarkdownV2",
            // @ts-expect-error Type not found
            disable_web_page_preview: true,
          });
        }
      } catch (error) {
        // errorHandler(error);
        botRemovedError(error, group.chatId);
      }
    }
  } catch (error) {
    errorHandler(error);
  }
}
