export const levels = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Date night",
] as const;
export type ClassLevel = (typeof levels)[number];
export type ClassSession = {
  id: string;
  startsAt: string;
  capacity: number;
  closed: boolean;
};
export type ForgeClass = {
  id: string;
  slug: string;
  title: string;
  level: ClassLevel;
  description: string;
  duration: string;
  location: string;
  priceCents: number;
  published: boolean;
  images: { src: string; alt: string }[];
  sessions: ClassSession[];
};
export type Waiver = { version: string; text: string; enabled: boolean };
export type Registration = {
  id: string;
  requestId: string;
  classId: string;
  sessionId: string;
  classTitle: string;
  startsAt: string;
  priceCents: number;
  name: string;
  email: string;
  phone: string;
  status: "pending" | "confirmed" | "cancelled";
  paymentStatus: "not_connected";
  submittedAt: string;
  signature: string;
  waiverVersion: string;
  waiverText: string;
  consentText: string;
  signedAt: string;
};
export type ClassesState = {
  revision: number;
  classes: ForgeClass[];
  waiver: Waiver;
  registrations: Registration[];
};
export const emptyClassesState = (): ClassesState => ({
  revision: 0,
  classes: [],
  waiver: { version: "", text: "", enabled: false },
  registrations: [],
});
export function seatsRemaining(
  state: ClassesState,
  classId: string,
  session: ClassSession,
) {
  return Math.max(
    0,
    session.capacity -
      state.registrations.filter(
        (r) =>
          r.classId === classId &&
          r.sessionId === session.id &&
          r.status === "confirmed",
      ).length,
  );
}
export const consentText =
  "I have read and agree to the waiver above. I am at least 18 years old, I am signing for myself, and I agree that typing my full name is my electronic signature.";
export function validateCatalog(value: unknown): {
  classes: ForgeClass[];
  waiver: Waiver;
} {
  const data = value as { classes?: ForgeClass[]; waiver?: Waiver };
  if (
    !data ||
    !Array.isArray(data.classes) ||
    data.classes.length > 200 ||
    !data.waiver
  )
    throw new Error("Invalid classes catalog.");
  const text = (v: unknown, max: number, required = false) => {
    if (typeof v !== "string" || v.length > max || (required && !v.trim()))
      throw new Error(
        "Complete all required fields and keep text within the displayed limits.",
      );
    return v.trim();
  };
  const ids = new Set<string>(),
    slugs = new Set<string>();
  const classes = data.classes.map((c) => {
    const id = text(c.id, 80, true),
      slug = text(c.slug, 100, true);
    if (!/^[a-z0-9-]+$/.test(slug) || ids.has(id) || slugs.has(slug))
      throw new Error("Each class needs a unique ID and lowercase URL slug.");
    ids.add(id);
    slugs.add(slug);
    if (
      !levels.includes(c.level) ||
      !Number.isInteger(c.priceCents) ||
      c.priceCents < 0 ||
      c.priceCents > 1000000 ||
      typeof c.published !== "boolean"
    )
      throw new Error("Invalid class level or price.");
    if (
      !Array.isArray(c.images) ||
      c.images.length > 12 ||
      !Array.isArray(c.sessions) ||
      c.sessions.length > 100
    )
      throw new Error("Use up to 12 photos and 100 sessions per class.");
    const sessionIds = new Set<string>();
    return {
      id,
      slug,
      title: text(c.title, 150, true),
      level: c.level,
      description: text(c.description, 10000, c.published),
      duration: text(c.duration, 100, c.published),
      location: text(c.location, 300, c.published),
      priceCents: c.priceCents,
      published: c.published,
      images: c.images.map((i) => {
        const src = text(i.src, 2000, true);
        if (
          !/^\/(?!\/)[^\s\\]+$/.test(src) &&
          !/^https:\/\/[^\s\\]+$/.test(src)
        )
          throw new Error("Photos must use an uploaded image or HTTPS URL.");
        return { src, alt: text(i.alt, 300, true) };
      }),
      sessions: c.sessions.map((s) => {
        const sid = text(s.id, 80, true);
        if (
          sessionIds.has(sid) ||
          !Number.isInteger(s.capacity) ||
          s.capacity < 1 ||
          s.capacity > 100 ||
          typeof s.closed !== "boolean" ||
          typeof s.startsAt !== "string" ||
          !Number.isFinite(Date.parse(s.startsAt))
        )
          throw new Error(
            "Each session needs a unique ID, date, and capacity between 1 and 100.",
          );
        sessionIds.add(sid);
        return {
          id: sid,
          startsAt: new Date(s.startsAt).toISOString(),
          capacity: s.capacity,
          closed: s.closed,
        };
      }),
    };
  });
  const waiver = {
    version: text(data.waiver.version, 80),
    text: text(data.waiver.text, 30000),
    enabled: data.waiver.enabled === true,
  };
  if (waiver.enabled && (!waiver.version || !waiver.text))
    throw new Error(
      "Add approved waiver text and a version before enabling registration.",
    );
  return { classes, waiver };
}
