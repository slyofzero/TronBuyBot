import { getDocument } from "@/firebase";
import { StoredGroup } from "@/types";
import { log } from "@/utils/handlers";

export let projectGroups: StoredGroup[] = [];
export const tokensToWatch: string[] = [];

export function addProjectGroup(group: StoredGroup) {
  projectGroups.push(group);
}

export function setProjectGroups(groups: StoredGroup[]) {
  projectGroups = groups;
}

export async function syncProjectGroups() {
  const rows = await getDocument<StoredGroup>({
    collectionName: "project_groups",
  });
  projectGroups = rows;
  log("Synced projectGroups with firebase");

  for (const { token } of rows) {
    if (!tokensToWatch.includes(token)) tokensToWatch.push(token);
  }
}
