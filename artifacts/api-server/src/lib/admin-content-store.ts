import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { adminDataDir } from "./upload-dir";

const allowedKeys = new Set([
  "premade-products",
  "etsy-products",
  "premium-products",
  "services",
  "settings",
  "orders",
  "inquiries",
]);

type StoredContent = {
  key: string;
  payload: unknown;
  version: number;
  updatedAt: Date;
};

type LocalContentFile = Record<string, { payload: unknown; version: number; updatedAt: string }>;

export function assertAdminContentKey(key: string) {
  if (!allowedKeys.has(key)) throw new Error("Unknown admin content collection.");
  return key;
}

function useDatabase() {
  if (process.env["DATABASE_URL"]) return true;
  if (process.env["NODE_ENV"] === "production") {
    throw new Error("DATABASE_URL is required for persistent production admin content.");
  }
  return false;
}

async function databasePool() {
  const { pool } = await import("@workspace/db");
  return pool;
}

function localFilePath() {
  return path.join(adminDataDir(), "admin-content.json");
}

async function readLocalFile(): Promise<LocalContentFile> {
  try {
    return JSON.parse(await readFile(localFilePath(), "utf8")) as LocalContentFile;
  } catch {
    return {};
  }
}

async function writeLocalFile(contents: LocalContentFile) {
  await mkdir(adminDataDir(), { recursive: true });
  await writeFile(localFilePath(), JSON.stringify(contents, null, 2), "utf8");
}

export async function readAdminContent(key: string): Promise<StoredContent | undefined> {
  assertAdminContentKey(key);

  if (!useDatabase()) {
    const saved = (await readLocalFile())[key];
    return saved ? { key, payload: saved.payload, version: saved.version, updatedAt: new Date(saved.updatedAt) } : undefined;
  }

  const pool = await databasePool();
  const result = await pool.query<{ key: string; payload: unknown; version: number; updated_at: Date }>(
    "SELECT key, payload, version, updated_at FROM admin_content WHERE key = $1 LIMIT 1",
    [key],
  );
  const row = result.rows[0];
  return row ? { key: row.key, payload: row.payload, version: row.version, updatedAt: row.updated_at } : undefined;
}

export async function writeAdminContent(key: string, payload: unknown, expectedVersion?: number): Promise<StoredContent> {
  assertAdminContentKey(key);

  if (!useDatabase()) {
    const all = await readLocalFile();
    const current = all[key];
    if (expectedVersion !== undefined && current?.version !== expectedVersion) {
      throw new Error("This content changed in another session. Reload it before saving again.");
    }
    const saved = { payload, version: (current?.version ?? 0) + 1, updatedAt: new Date().toISOString() };
    all[key] = saved;
    await writeLocalFile(all);
    return { key, payload, version: saved.version, updatedAt: new Date(saved.updatedAt) };
  }

  const pool = await databasePool();
  const serialized = JSON.stringify(payload);
  const result = expectedVersion !== undefined
    ? await pool.query<{ key: string; payload: unknown; version: number; updated_at: Date }>(
        `UPDATE admin_content
         SET payload = $2::jsonb, version = version + 1, updated_at = now()
         WHERE key = $1 AND version = $3
         RETURNING key, payload, version, updated_at`,
        [key, serialized, expectedVersion],
      )
    : await pool.query<{ key: string; payload: unknown; version: number; updated_at: Date }>(
        `INSERT INTO admin_content (key, payload)
         VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO UPDATE
         SET payload = EXCLUDED.payload, version = admin_content.version + 1, updated_at = now()
         RETURNING key, payload, version, updated_at`,
        [key, serialized],
      );

  const row = result.rows[0];
  if (!row) throw new Error("This content changed in another session. Reload it before saving again.");
  return { key: row.key, payload: row.payload, version: row.version, updatedAt: row.updated_at };
}

export async function appendAdminRecord(key: "orders" | "inquiries", record: Record<string, unknown>) {
  if (!useDatabase()) {
    const current = await readAdminContent(key);
    const records = Array.isArray(current?.payload) ? current.payload : [];
    return writeAdminContent(key, [record, ...records], current?.version);
  }

  const pool = await databasePool();
  const result = await pool.query<{ key: string; payload: unknown; version: number; updated_at: Date }>(
    `INSERT INTO admin_content (key, payload)
     VALUES ($1, jsonb_build_array($2::jsonb))
     ON CONFLICT (key) DO UPDATE
     SET payload = jsonb_build_array($2::jsonb) ||
       CASE WHEN jsonb_typeof(admin_content.payload) = 'array' THEN admin_content.payload ELSE '[]'::jsonb END,
       version = admin_content.version + 1,
       updated_at = now()
     RETURNING key, payload, version, updated_at`,
    [key, JSON.stringify(record)],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Could not save the submitted record.");
  return { key: row.key, payload: row.payload, version: row.version, updatedAt: row.updated_at };
}
