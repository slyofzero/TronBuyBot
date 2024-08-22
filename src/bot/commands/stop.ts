import { removeDocument } from "@/firebase";
import { StoredGroup } from "@/types";
import { onlyAdmin } from "@/utils/bot";
import { BOT_USERNAME } from "@/utils/env";
import { syncProjectGroups } from "@/vars/projectGroups";
import { CommandContext, Context } from "grammy";

export async function stop(ctx: CommandContext<Context>) {
  const { type, id } = ctx.chat;

  if (type === "private") {
    const text = "Only works in groups or channels";
    ctx.reply(text);
    return false;
  }

  const isAdmin = await onlyAdmin(ctx);
  if (!isAdmin) return false;

  removeDocument<StoredGroup>({
    collectionName: "project_groups",
    queries: [["chatId", "==", id]],
  }).then(() => syncProjectGroups());

  return ctx.reply(`${BOT_USERNAME} stopped`);
}
