import assert from "node:assert/strict";
import { build } from "esbuild";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempBundle = path.join(root, ".tmp-analytics-private-import-test.mjs");

class IsolatedDatabase {
  row;

  async query(sql, values = []) {
    if (sql.startsWith("SELECT key")) {
      return { rows: this.row ? [{ key: values[0] }] : [], rowCount: this.row ? 1 : 0 };
    }
    if (sql.startsWith("INSERT")) {
      if (!this.row) this.row = { key: values[0], payload: JSON.parse(values[1]) };
      return { rows: [], rowCount: 1 };
    }
    if (sql.startsWith("SELECT payload")) {
      return { rows: this.row ? [{ payload: this.row.payload }] : [], rowCount: this.row ? 1 : 0 };
    }
    throw new Error("Unexpected isolated query.");
  }
}

try {
  await build({
    entryPoints: [
      path.join(root, "src/lib/analytics-state-init.ts"),
      path.join(root, "src/lib/analytics-recovery-source.ts"),
    ],
    bundle: true,
    format: "esm",
    platform: "node",
    outdir: path.join(root, ".tmp-analytics-import-modules"),
    external: ["@replit/object-storage"],
    write: true,
  });
  const tempDir = path.join(root, ".tmp-analytics-import-modules");
  const init = await import(pathToFileURL(path.join(tempDir, "analytics-state-init.js")).href);
  const recovery = await import(pathToFileURL(path.join(tempDir, "analytics-recovery-source.js")).href);

  const raw = await recovery.readPrivateAnalyticsRecovery();
  assert.ok(raw, "private recovery object should be available to the server");
  const recovered = JSON.parse(raw);
  assert.ok(recovered.visitors && recovered.sessions && Array.isArray(recovered.events));

  const database = new IsolatedDatabase();
  let legacyReads = 0;
  const imported = await init.ensureAnalyticsState(database, "private-analytics-state", async () => {
    legacyReads++;
    return recovered;
  });
  assert.deepEqual(imported, recovered);
  assert.equal(legacyReads, 1);

  const sentinel = { visitors: { isolated: { id: "isolated" } }, sessions: {}, events: [] };
  database.row.payload = sentinel;
  const second = await init.ensureAnalyticsState(database, "private-analytics-state", async () => {
    legacyReads++;
    return recovered;
  });
  assert.deepEqual(second, sentinel, "a second initialization must preserve existing analytics");
  assert.equal(legacyReads, 1, "existing state must not re-import the recovery source");

  console.log(JSON.stringify({
    privateSourceRead: true,
    initialImport: "passed",
    secondInitializationPreservedExistingState: true,
    backupCounts: {
      visitors: Object.keys(recovered.visitors).length,
      sessions: Object.keys(recovered.sessions).length,
      events: recovered.events.length,
    },
  }));
} finally {
  await rm(path.join(root, ".tmp-analytics-import-modules"), { recursive: true, force: true });
  await rm(tempBundle, { force: true });
}
