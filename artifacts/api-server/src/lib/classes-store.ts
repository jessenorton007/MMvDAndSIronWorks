import { protectSignedRecords } from "./waiver-record";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { adminDataDir } from "./upload-dir";
import { emptyClassesState, type ClassesState } from "./classes-model";

// Deliberately excluded from generic public admin-content endpoints: contains signatures and contact details.
const key = "private-classes-state";
let localQueue: Promise<unknown> = Promise.resolve();
export async function classesTransaction<T>(
  action: (state: ClassesState) => T,
  write = true,
): Promise<T> {
  if (process.env.DATABASE_URL) {
    const { pool } = await import("@workspace/db");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "INSERT INTO admin_content (key, payload) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO NOTHING",
        [key, JSON.stringify(emptyClassesState())],
      );
      const result = await client.query(
        "SELECT payload FROM admin_content WHERE key = $1 FOR UPDATE",
        [key],
      );
      const state = result.rows[0].payload as ClassesState;
      const originals = structuredClone(state.registrations);
      const output = action(state);
      protectSignedRecords(originals, state.registrations);
      if (write)
        await client.query(
          "UPDATE admin_content SET payload=$2::jsonb, version=version+1, updated_at=now() WHERE key=$1",
          [key, JSON.stringify(state)],
        );
      await client.query("COMMIT");
      return output;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  if (process.env.NODE_ENV === "production")
    throw new Error("Persistent database storage is required.");
  const operation = localQueue.then(async () => {
    const file = path.join(adminDataDir(), "classes.json");
    let state: ClassesState;
    try {
      state = JSON.parse(await readFile(file, "utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      state = emptyClassesState();
    }
    const originals = structuredClone(state.registrations);
    const output = action(state);
    protectSignedRecords(originals, state.registrations);
    if (write) {
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file + ".tmp", JSON.stringify(state));
      await rename(file + ".tmp", file);
    }
    return output;
  });
  localQueue = operation.catch(() => undefined);
  return operation;
}
