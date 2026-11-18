import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Store } from "./analytics-types";

// Private: never add this key to generic public content collections.
const key = "private-analytics-state";
const file = process.env.IRONWORKS_ANALYTICS_FILE || join(dirname(fileURLToPath(import.meta.url)), "../../analytics-data.json");
let queue: Promise<unknown> = Promise.resolve();
async function readLegacy(): Promise<Store> {
  try {
    const data = JSON.parse(await readFile(file, "utf8"));
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
      const existing = await client.query("SELECT key FROM admin_content WHERE key=$1", [key]);
      if (!existing.rowCount) {
        // Import a surviving legacy file only when initializing the database row.
        await client.query("INSERT INTO admin_content (key,payload) VALUES ($1,$2::jsonb) ON CONFLICT (key) DO NOTHING", [key, JSON.stringify(await readLegacy())]);
      }
      const result = await client.query("SELECT payload FROM admin_content WHERE key=$1 FOR UPDATE", [key]);
      const state = result.rows[0].payload as Store;
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
