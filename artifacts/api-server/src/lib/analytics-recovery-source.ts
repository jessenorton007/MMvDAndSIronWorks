const RECOVERY_OBJECT_NAME = "analytics-recovery.json";

function recoveryObjectName(bucketId: string, privateObjectDir: string) {
  const parts = privateObjectDir.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  if (parts[0] === bucketId) parts.shift();
  if (!parts.length) throw new Error("Private analytics recovery storage path is not configured.");
  return [...parts, RECOVERY_OBJECT_NAME].join("/");
}

export async function readPrivateAnalyticsRecovery(): Promise<string | null> {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  const privateObjectDir = process.env.PRIVATE_OBJECT_DIR;
  if (!bucketId || !privateObjectDir) return null;

  const { Client } = await import("@replit/object-storage");
  const client = new Client({ bucketId });
  const objectName = recoveryObjectName(bucketId, privateObjectDir);
  const exists = await client.exists(objectName);
  if (!exists.ok) throw new Error("Could not check private analytics recovery storage.");
  if (!exists.value) return null;

  const result = await client.downloadAsText(objectName);
  if (!result.ok) throw new Error("Could not read private analytics recovery data.");
  return result.value;
}

export async function savePrivateAnalyticsRecovery(contents: string): Promise<"saved" | "already-exists"> {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  const privateObjectDir = process.env.PRIVATE_OBJECT_DIR;
  if (!bucketId || !privateObjectDir) throw new Error("Private analytics recovery storage is not configured.");

  const { Client } = await import("@replit/object-storage");
  const client = new Client({ bucketId });
  const objectName = recoveryObjectName(bucketId, privateObjectDir);
  const exists = await client.exists(objectName);
  if (!exists.ok) throw new Error("Could not check private analytics recovery storage.");
  if (exists.value) return "already-exists";

  const result = await client.uploadFromText(objectName, contents);
  if (!result.ok) throw new Error("Could not save private analytics recovery data.");
  return "saved";
}
