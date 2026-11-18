import type { Store } from "./analytics-types";

type InitClient = {
  query: (sql: string, values?: unknown[]) => Promise<{
    rows: Record<string, unknown>[];
    rowCount: number | null;
  }>;
};

export async function ensureAnalyticsState(
  client: InitClient,
  key: string,
  readLegacy: () => Promise<Store>,
): Promise<Store> {
  const existing = await client.query("SELECT key FROM admin_content WHERE key=$1", [key]);
  if (!existing.rows.length) {
    const legacy = await readLegacy();
    await client.query(
      "INSERT INTO admin_content (key,payload) VALUES ($1,$2::jsonb) ON CONFLICT (key) DO NOTHING",
      [key, JSON.stringify(legacy)],
    );
  }

  const result = await client.query("SELECT payload FROM admin_content WHERE key=$1 FOR UPDATE", [key]);
  const state = result.rows[0]?.payload;
  if (!state || typeof state !== "object") throw new Error("Analytics state could not be initialized.");
  return state as Store;
}
