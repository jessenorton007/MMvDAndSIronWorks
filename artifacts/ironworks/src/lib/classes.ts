import type {
  ForgeClass,
  ClassesState,
  Waiver,
  Registration,
} from "../../../api-server/src/lib/classes-model";
export type { ForgeClass, ClassesState, Waiver, Registration };
export const classLevels = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Date night",
] as const;
export type PublicClass = Omit<ForgeClass, "sessions"> & {
  sessions: (ForgeClass["sessions"][number] & { remaining: number })[];
};
export type PublicCatalog = {
  classes: PublicClass[];
  waiver: Waiver;
  consentText: string;
  preview?: boolean;
};
export const price = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(cents / 100);
export const sessionDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Denver",
  }).format(new Date(date)) + " Mountain time";
export async function classesApi<T>(
  url: string,
  body?: unknown,
  method = "POST",
): Promise<T> {
  const response = await fetch(
    "/api" + url,
    body === undefined
      ? { credentials: "same-origin" }
      : {
          method,
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "Unable to complete this request.");
  return result;
}
