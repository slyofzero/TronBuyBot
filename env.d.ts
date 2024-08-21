declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BOT_TOKEN: string | undefined;
      BOT_USERNAME: string | undefined;
      NODE_ENV: "development" | "production";
      FIREBASE_KEY: string | undefined;
      DEXTOOLS_API_KEY: string | undefined;
      TRENDING_TOKENS_API: string | undefined;
      TRENDING_AUTH_KEY: string | undefined;
      TRENDING_CHANNEL_LINK: string | undefined;
    }
  }
}

export {};
