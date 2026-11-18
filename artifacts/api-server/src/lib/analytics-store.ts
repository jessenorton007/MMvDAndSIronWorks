import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Store } from "./analytics-types";
import { readPrivateAnalyticsRecovery } from "./analytics-recovery-source";
import { ensureAnalyticsState } from "./analytics-state-init";

// Private: never add this key to generic public content collections.
const key = "private-analytics-state";
const file = process.env.IRONWORKS_ANALYTICS_FILE || join(dirname(fileURLToPath(import.meta.url)), "../../analytics-data.json");
let queue: Promise<unknown> = Promise.resolve();
async function readLegacy(): Promise<Store> {
  try {
    const hasExplicitLegacyFile = Boolean(process.env.IRONWORKS_ANALYTICS_FILE);
    const privateRecovery = hasExplicitLegacyFile ? null : await readPrivateAnalyticsRecovery();
    if (!hasExplicitLegacyFile && !privateRecovery && process.env.NODE_ENV === "production") {
      throw new Error("Private analytics recovery input is unavailable.");
    }
    const raw = privateRecovery ?? await readFile(file, "utf8");
    const data = JSON.parse(raw);
    if (!data.visitors || !data.sessions || !Array.isArray(data.events)) throw new Error("Invalid analytics storage");
    return data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return { visitors: {}, sessions: {}, events: [] };
  }
}
export async function analyticsTransaction<T>(action: (store: Store) => T, write = true): Promise<T> {
  if (process.env.DATABASE_URL) {
    const { pool } = await import("@workspace/db");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const state = await ensureAnalyticsState(client, key, readLegacy);
      const output = action(state);
      if (write) await client.query("UPDATE admin_content SET payload=$2::jsonb, version=version+1, updated_at=now() WHERE key=$1", [key, JSON.stringify(state)]);
      await client.query("COMMIT");
      return output;
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }
  if (process.env.NODE_ENV === "production") throw new Error("Persistent analytics storage requires DATABASE_URL");
  const operation = queue.then(async () => {
    const state = await readLegacy();
    const output = action(state);
    if (write) {
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file + ".tmp", JSON.stringify(state));
      await rename(file + ".tmp", file);
    }
    return output;
  });
  queue = operation.catch(() => undefined);
  return operation;
}
