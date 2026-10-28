import { sendSmtpMessage } from "./smtp";
import type { Registration } from "./classes-model";
import { prerequisiteLevel } from "./classes-model";

export async function sendRegistrationEmails(record: Registration, paymentUrl?: string) {
  // Sample preview signups must not send real mail using inherited credentials.
  if (process.env.NODE_ENV !== "production" && process.env.CLASSES_PREVIEW === "true") return;
  const owner = process.env.CLASS_NOTIFICATION_TO || process.env.ORDER_NOTIFICATION_TO || process.env.CONTACT_NOTIFICATION_TO || "dandsiron@yahoo.com";
  const date = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full", timeStyle: "short", timeZone: "America/Denver",
  }).format(new Date(record.startsAt));
  const details = [
    `Class: ${record.classTitle}`,
    `Session: ${date} (Mountain time)`,
    record.partnerRegistrationId ? `Covered by partner registration ${record.partnerRegistrationId}. Do not make a second payment.` : `Price per ${record.priceUnit === "couple" ? "couple (two adults)" : "participant"}: $${(record.priceCents / 100).toFixed(2)}`,
    `Registration ID: ${record.id}`,
    "Status: Pending — no seat reserved and no payment collected.",
    prerequisiteLevel(record.classLevel) ? `Requires completed ${prerequisiteLevel(record.classLevel)}. D&S must verify attendance and approve eligibility before sending an individual QuickBooks invoice.` : "No prerequisite class required.",
  ].join("\n");
  const messages = [
    {
      to: owner,
      replyTo: record.email,
      subject: `New class registration request: ${record.classTitle}`,
      text: ["New D&S Iron Works class registration request", "", details, "",
        `Name: ${record.name}`, `Email: ${record.email}`, `Phone: ${record.phone || "Not provided"}`,
        "", "Review the request and signed waiver in Admin → Classes & Waivers. Confirm availability and arrange payment before confirming their seat."].join("\n"),
    },
    {
      to: record.email,
      replyTo: owner,
      subject: `Registration request received: ${record.classTitle}`,
      text: [`Hi ${record.name},`, "", "D&S Iron Works received your class registration request.", "", details,
        ...(record.priceUnit === "couple" && !record.partnerRegistrationId ? ["Share your registration ID with your partner so they can register for the same session and sign their own waiver. One payment covers both adults."] : []),
        ...(paymentUrl ? ["", `Pay with QuickBooks: ${paymentUrl}`, "Check the amount before paying. D&S will verify payment manually."] : []),
        "", "Your place is not confirmed yet. D&S will contact you to confirm availability and arrange payment.",
        "Questions? Reply to this email or call (435) 421-9033."].join("\n"),
    },
  ];
  await Promise.all(messages.map(async (message, index) => {
    try {
      const result = await sendSmtpMessage(message);
      if (!result.sent) console.warn(`Class registration ${record.id}: ${index === 0 ? "owner" : "customer"} email not sent (SMTP not configured).`);
    } catch {
      // Do not log SMTP responses or credentials; the signup remains in the roster.
      console.warn(`Class registration ${record.id}: ${index === 0 ? "owner" : "customer"} email failed. Review the admin roster.`);
    }
  }));
}
