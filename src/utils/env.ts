import dotenv from "dotenv";

export const { NODE_ENV } = process.env;
dotenv.config({
  path: NODE_ENV === "development" ? ".env" : ".env.production",
});

export const {
  BOT_TOKEN,
  BOT_USERNAME,
  FIREBASE_KEY,
  DEXTOOLS_API_KEY,
  TRENDING_AUTH_KEY,
  TRENDING_TOKENS_API,
  TRENDING_CHANNEL_LINK,
} = process.env;
