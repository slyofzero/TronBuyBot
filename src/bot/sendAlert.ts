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

export interface BuyData {
  txnHash: string;
  fromTokenSymbol: string;
  fromTokenAmount: number;
  toTokenSymbol: string;
  toTokenAmount: number;
  buyer: string;
  token: string;
}

// export interface BuyData {
//   txn: string;
//   contract: string;
//   buyer: string;
//   amountBought: number;
// }

export async function sendAlert(data: BuyData) {
  try {
    const {
      buyer,
      token,
      fromTokenAmount,
      fromTokenSymbol,
      toTokenAmount,
      toTokenSymbol,
      txnHash,
    } = data;

    const groups = projectGroups.filter(
      ({ token: groupToken }) => groupToken === token
    );

    if (!groups.length) return;

    // Preparing message for token
    const tokenData = memoTokenData[token];
    const { priceUsd, fdv, info } = tokenData;
    const sentUsdNumber = toTokenAmount * Number(priceUsd);
    const sentNative = cleanUpBotMessage(fromTokenAmount.toLocaleString("en")); // prettier-ignore
    const sentUsd = cleanUpBotMessage(sentUsdNumber.toFixed(2));
    const formattedAmount = cleanUpBotMessage(
      toTokenAmount.toLocaleString("en")
    );
    // const position = change ? `+${change}%` : "New!!!";
    const trendingRank = Object.entries(trendingTokens).findIndex(
      ([trendingToken]) => trendingToken === token
    );

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
    // const photonLink = `https://photon-sol.tinyastro.io/en/lp/${token}`;
    // const advertisement = advertisements.at(0);
    // let advertisementText = "";

    // if (advertisement) {
    //   const { text, link } = advertisement;
    //   advertisementText = `*_Ad: [${text}](${link})_*`;
    // } else {
    //   advertisementText = `*_Ad: [Place your advertisement here](https://t.me/${TRENDING_BOT_USERNAME}?start=adBuyRequest)_*`;
    // }

    const telegramLink = info?.socials?.find(
      ({ type }) => type.toLowerCase() === "telegram"
    )?.url;

    const specialLink = telegramLink
      ? `[Telegram](${telegramLink})`
      : `[Screener](${dexSLink})`;

    //     const message = `*[${toTokenSymbol}](${telegramLink || dexSLink}) Buy\\!*
    // ${emojis}

    // 🔀 ${sentNative} ${fromTokenSymbol} *\\($${sentUsd}\\)*
    // 🔀 ${formattedAmount} *${hardCleanUpBotMessage(toTokenSymbol)}*
    // 👤 [Buyer](${buyerLink}) \\| [Txn](${txnLink}  )
    // 💸 [Market Cap](${dexSLink}) $${cleanUpBotMessage(fdv.toLocaleString("en"))}

    // [DexS](${dexSLink}) \\| ${specialLink} \\| [Trending](${TRENDING_CHANNEL_LINK}/${trendingMessageId})

    // ${advertisementText}`;

    const addEmojiToMessage = (emoji: string) => {
      const emojis = emoji.repeat(emojiCount);
      const trendingPosition =
        trendingRank !== -1
          ? `[Tron Trending \\#${trendingRank + 1}](${TRENDING_CHANNEL_LINK})`
          : "";

      const message = `*[${toTokenSymbol}](${telegramLink || dexSLink}) Buy\\!*
${emojis}

🔀 ${sentNative} ${fromTokenSymbol} *\\($${sentUsd}\\)*
🔀 ${formattedAmount} *${hardCleanUpBotMessage(toTokenSymbol)}*
👤 [Buyer](${buyerLink}) \\| [Txn](${txnLink}  )
💸 [Market Cap](${dexSLink}) $${cleanUpBotMessage(fdv?.toLocaleString("en"))}

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
