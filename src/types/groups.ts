export interface StoredGroup {
  id?: string;
  token: string;
  chatId: number;
  emoji?: string | null;
  media?: string | null;
  mediaType?: "video" | "photo" | "gif" | null;
  minBuy?: number;
  websiteLink?: string;
  telegramLink?: string;
  twitterLink?: string;
}
