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
  paymentUrl?: string;
  priceUnit?: "person" | "couple";
  published: boolean;
  images: { src: string; alt: string }[];
  sessions: ClassSession[];
};
export type Waiver = { version: string; text: string; enabled: boolean; collectAdultDetails?: boolean; formKind?: "adult-release-2026-11" };
export type AdultDetails = { dateOfBirth: string; ageAtSigning: number; address: string; cityStateZip: string; emergencyContact: string; medicalConditions?: string; medications?: string; role?: "participant" | "observer"; healthDisclosure?: "no" | "in_person"; photoPermission?: "yes" | "no" | "not_selected" };
export function validateAdultDetails(value: unknown, now = new Date(), revised = false): AdultDetails {
  const data = value as Record<string, unknown> | undefined;
  const field = (key: string, max: number) => {
    const v = data?.[key];
    if (typeof v !== "string" || !v.trim() || v.length > max) throw new Error("Complete every participant and emergency-information field. Write None where appropriate.");
    return v.trim();
  };
  const dateOfBirth = field("dateOfBirth", 10);
  const dob = new Date(dateOfBirth + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) || !Number.isFinite(dob.getTime()) || dob.toISOString().slice(0, 10) !== dateOfBirth)
    throw new Error("Enter a valid date of birth.");
  let ageAtSigning = now.getUTCFullYear() - dob.getUTCFullYear();
  if (now.getUTCMonth() < dob.getUTCMonth() || (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate())) ageAtSigning--;
  if (ageAtSigning < 18) throw new Error("This waiver is for participants age 18 and older.");
  if (revised && (!['participant', 'observer'].includes(String(data?.role)) || !['no', 'in_person'].includes(String(data?.healthDisclosure)) || !['yes', 'no', 'not_selected'].includes(String(data?.photoPermission)))) throw new Error("Choose participant or observer and answer the health question. Photo permission is optional.");
  return { dateOfBirth, ageAtSigning, address: field("address", 300), cityStateZip: field("cityStateZip", 200), emergencyContact: field("emergencyContact", 300), ...(revised ? { role: data!.role as "participant" | "observer", healthDisclosure: data!.healthDisclosure as "no" | "in_person", photoPermission: data!.photoPermission as "yes" | "no" | "not_selected" } : { medicalConditions: field("medicalConditions", 2000), medications: field("medications", 2000) }) };
}
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
  status: "pending" | "confirmed" | "cancelled" | "completed";
  classLevel?: ClassLevel;
  completedAt?: string;
  approvedAt?: string;
  prerequisiteCompletionId?: string;
  paymentStatus: "not_connected";
  partnerRegistrationId?: string;
  priceUnit?: "person" | "couple";
  submittedAt: string;
  signature: string;
  waiverVersion: string;
  waiverText: string;
  consentText: string;
  signedAt: string;
  adultDetails?: AdultDetails;
  signedCopy?: string;
  signedCopySha256?: string;
  waiverEmail?: { status: "pending" | "sent" | "failed"; attemptedAt?: string; sentAt?: string };
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
          (r.status === "confirmed" || r.status === "completed"),
      ).length,
  );
}
export const consentText =
  "I have read and agree to the waiver above. I am at least 18 years old, I am signing for myself, and I agree that typing my full name is my electronic signature.";
export function prerequisiteLevel(level?: ClassLevel): ClassLevel | undefined {
  return level === "Intermediate" ? "Beginner" : level === "Advanced" ? "Intermediate" : undefined;
}
export function registrationLevel(state: ClassesState, record: Registration) {
  return record.classLevel ?? state.classes.find(c => c.id === record.classId)?.level;
}
export function qualifyingCompletions(state: ClassesState, record: Registration) {
  const required = prerequisiteLevel(registrationLevel(state, record));
  if (!required) return [];
  const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
  return state.registrations.filter(r => r.id !== record.id && r.status === "completed"
    && r.adultDetails?.role !== "observer" && registrationLevel(state, r) === required
    && normalize(r.email) === normalize(record.email) && normalize(r.name) === normalize(record.name)
    && Date.parse(r.startsAt) < Date.parse(record.startsAt));
}
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
    const paymentUrl = text(c.paymentUrl ?? "", 2000);
    if (paymentUrl) {
      let url: URL;
      try { url = new URL(paymentUrl); } catch { throw new Error("Enter a valid QuickBooks payment link."); }
      if (url.protocol !== "https:" || url.hostname !== "connect.intuit.com" || !url.pathname.startsWith("/pay/") || url.username || url.password || url.port)
        throw new Error("Use an HTTPS QuickBooks payment link from connect.intuit.com/pay/.");
    }
    return {
      id,
      slug,
      title: text(c.title, 150, true),
      level: c.level,
      description: text(c.description, 10000, c.published),
      duration: text(c.duration, 100, c.published),
      location: text(c.location, 300, c.published),
      priceCents: c.priceCents,
      paymentUrl,
      priceUnit: c.level === "Date night" && c.priceUnit === "couple" ? "couple" as const : "person" as const,
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
    collectAdultDetails: data.waiver.collectAdultDetails === true,
    ...(data.waiver.formKind === "adult-release-2026-11" ? { formKind: "adult-release-2026-11" as const } : {}),
  };
  if (waiver.formKind && !waiver.collectAdultDetails) throw new Error("The revised adult release requires adult details.");
  if (waiver.enabled && (!waiver.version || !waiver.text))
    throw new Error(
      "Add approved waiver text and a version before enabling registration.",
    );
  return { classes, waiver };
}
