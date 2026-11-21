import type { Registration } from "./classes-model";

// Used for both the immutable email copy and the admin download.
export function signedWaiverCopy(r: Registration): string {
  if (r.signedCopy) return r.signedCopy;
  const d = r.adultDetails;
  const date = new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short", timeZone: "America/Denver" }).format(new Date(r.startsAt));
  return ["D&S Iron Works LLC — signed adult release", `Registration: ${r.id}`, `Class: ${r.classTitle}`,
    `Class date: ${date} (America/Denver)`, `Class date (UTC): ${r.startsAt}`, `Full name / printed name: ${r.name}`,
    `Email: ${r.email}`, `Phone: ${r.phone}`, ...(d ? [
      `Date of birth: ${d.dateOfBirth}`, `Age at signing: ${d.ageAtSigning}`, `Address: ${d.address}, ${d.cityStateZip}`,
      `Emergency contact (name and phone): ${d.emergencyContact}`,
      ...(d.role ? [`Role: ${d.role}`, `Health: ${d.healthDisclosure === "in_person" ? "Yes. I will tell the instructor in person before class begins." : "No."}`,
      `Photos (optional): ${d.photoPermission === "yes" ? "Yes — permission granted as described in section 8." : d.photoPermission === "no" ? "No. Please do not use photos or videos of me." : "Not selected — no permission granted."}`] : [`Medical conditions: ${d.medicalConditions}`, `Medications: ${d.medications}`]),
    ] : []), `Waiver revision: ${r.waiverVersion}`, `Signed at (UTC, server recorded): ${r.signedAt}`,
    "", "FULL TEXT PRESENTED AT SIGNING", "", r.waiverText, "", "SIGNING EVIDENCE", r.consentText,
    "Electronic-signature consent: checked", `Electronic signature: ${r.signature}`, `Printed name: ${r.name}`,
    `Signed at (UTC): ${r.signedAt}`, "", "This copy preserves the submission as signed. Later booking status changes do not alter it.", ""].join("\n");
}

const mutable = new Set(["status", "completedAt", "approvedAt", "prerequisiteCompletionId", "waiverEmail"]);
export function signingEvidence(r: Registration) {
  return JSON.stringify(Object.fromEntries(Object.entries(r).filter(([key]) => !mutable.has(key)).sort(([a], [b]) => a.localeCompare(b))));
}
export function protectSignedRecords(before: Registration[], after: Registration[]) {
  for (const original of before) {
    const next = after.find(r => r.id === original.id);
    if (!next || signingEvidence(original) !== signingEvidence(next)) throw new Error("Signed registration records cannot be changed or deleted. Create a new signing record instead.");
  }
}
