import { Router, type RequestHandler } from "express";
import { createHash, randomUUID } from "node:crypto";
import { isAdminRequest } from "./admin";
import { classesTransaction } from "../lib/classes-store";
import { signedWaiverCopy } from "../lib/waiver-record";
import { sendRegistrationEmails, resendWaiverCopy } from "../lib/classes-email";
import launchCatalog from "../../../../docs/classes-launch-catalog.json";
import {
  consentText,
  seatsRemaining,
  validateCatalog,
  prerequisiteLevel,
  registrationLevel,
  qualifyingCompletions,
  validateAdultDetails,
  type Registration,
} from "../lib/classes-model";

const router = Router();
const admin: RequestHandler = (req, res, next) => {
  try {
    if (!isAdminRequest(req)) {
      res.status(401).json({ error: "Sign in to the admin panel." });
      return;
    }
    next();
  } catch {
    res.status(503).json({ error: "Admin access is not configured." });
  }
};
const endpoint =
  (handler: RequestHandler): RequestHandler =>
  async (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      await handler(req, res, next);
    } catch (error) {
      res
        .status(400)
        .json({
          error:
            error instanceof Error
              ? error.message
              : "Unable to complete this request.",
        });
    }
  };
router.get(
  "/classes",
  endpoint(async (_req, res) => {
    res.json(
      await classesTransaction(
        (state) => ({
          classes: state.classes
            .filter((c) => c.published)
            .map(({ paymentUrl: _privatePaymentUrl, ...c }) => ({
              ...c,
              sessions: c.sessions
                .filter((s) => new Date(s.startsAt).getTime() > Date.now())
                .map((s) => ({
                  ...s,
                  remaining: seatsRemaining(state, c.id, s),
                })),
            })),
          waiver: state.waiver.enabled
            ? state.waiver
            : { version: "", text: "", enabled: false },
          consentText,
          paymentProvider: "quickbooks_manual",
          preview:
            process.env.NODE_ENV !== "production" &&
            process.env.CLASSES_PREVIEW === "true",
        }),
        false,
      ),
    );
  }),
);
router.get(
  "/admin/classes",
  admin,
  endpoint(async (_req, res) => {
    res.json(await classesTransaction((s) => s, false));
  }),
);
// Explicit setup action only; never overwrite an existing production catalog or import preview registrations.
router.post("/admin/classes/setup", admin, endpoint(async (_req, res) => {
  res.json(await classesTransaction(state => {
    if (state.classes.length || state.registrations.length || state.waiver.text)
      throw new Error("Starter setup is only available for an empty catalog.");
    const catalog = validateCatalog(launchCatalog);
    state.classes = catalog.classes;
    state.waiver = catalog.waiver;
    state.revision++;
    return state;
  }));
}));
router.get("/admin/classes/readiness", admin, endpoint(async (_req, res) => {
  const issues = await classesTransaction(state => {
    const issues: string[] = [];
    if (!state.waiver.enabled || !state.waiver.text || !state.waiver.version) issues.push("Save the approved waiver and enable registration.");
    if (!state.classes.some(c => c.published)) issues.push("Publish at least one completed class listing.");
    for (const c of state.classes.filter(c => c.published)) {
      if (!c.images.length) issues.push(`${c.title}: add project photos.`);
      if (!c.sessions.some(s => !s.closed && Date.parse(s.startsAt) > Date.now() && s.capacity >= (c.priceUnit === "couple" ? 2 : 1))) issues.push(`${c.title}: add an upcoming open session with enough capacity.`);
      if (!prerequisiteLevel(c.level) && c.priceCents > 0 && !c.paymentUrl) issues.push(`${c.title}: add the QuickBooks payment link.`);
    }
    return issues;
  }, false);
  if (!process.env.DATABASE_URL) issues.push("Persistent PostgreSQL storage is not configured on this server.");
  if (!process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID) issues.push("Persistent photo storage is not configured on this server.");
  if (!process.env.SMTP_HOST || !(process.env.SMTP_FROM || process.env.ORDER_NOTIFICATION_FROM)) issues.push("SMTP email is not configured on this server.");
  if (process.env.NODE_ENV !== "production") issues.push("This is a development server; live hosting still needs verification.");
  res.json({ issues, note: "Configuration checks only. Verify checkout amounts, final class details, approved waiver, image uploads, and live email delivery before opening registration." });
}));
router.put(
  "/admin/classes",
  admin,
  endpoint(async (req, res) => {
    const catalog = validateCatalog(req.body);
    res.json(
      await classesTransaction((state) => {
        if (req.body.revision !== state.revision)
          throw new Error(
            "Classes changed in another session. Reload before saving.",
          );
        if (
          state.waiver.text &&
          (state.waiver.text !== catalog.waiver.text || !!state.waiver.collectAdultDetails !== !!catalog.waiver.collectAdultDetails || state.waiver.formKind !== catalog.waiver.formKind) &&
          state.waiver.version === catalog.waiver.version
        )
          throw new Error(
            "Change the waiver version when changing its wording.",
          );
        for (const old of state.classes) {
          const replacement = catalog.classes.find((c) => c.id === old.id);
          const records = state.registrations.filter(
            (r) => r.classId === old.id,
          );
          if (records.length && !replacement)
            throw new Error(
              "This class has registrations. Hide it instead of deleting it.",
            );
          if (records.length && replacement?.level !== old.level)
            throw new Error("A class with registrations cannot change category. Create a new class instead.");
          if (records.length && (replacement?.priceUnit ?? "person") !== (old.priceUnit ?? "person"))
            throw new Error("A class with registrations cannot switch between individual and couple pricing. Create a new class instead.");
          for (const session of old.sessions) {
            const booked = records.filter((r) => r.sessionId === session.id);
            const next = replacement?.sessions.find((s) => s.id === session.id);
            if (booked.length && (!next || next.startsAt !== session.startsAt))
              throw new Error(
                "A session with registrations cannot be removed or rescheduled. Close it and create a new session.",
              );
            if (
              next &&
              next.capacity <
                booked.filter((r) => r.status === "confirmed" || r.status === "completed").length
            )
              throw new Error(
                "Capacity cannot be lower than confirmed attendance.",
              );
          }
        }
        state.classes = catalog.classes;
        state.waiver = catalog.waiver;
        state.revision++;
        return state;
      }),
    );
  }),
);
const attempts = new Map<string, { count: number; expires: number }>();
router.post(
  "/classes/registrations",
  endpoint(async (req, res) => {
    for (const [key, value] of attempts)
      if (value.expires < Date.now()) attempts.delete(key);
    const key = req.ip || "unknown";
    const attempt = attempts.get(key) ?? {
      count: 0,
      expires: Date.now() + 3600000,
    };
    attempt.count++;
    attempts.set(key, attempt);
    if (attempt.count > 30) {
      res
        .status(429)
        .json({ error: "Too many requests. Please try again later." });
      return;
    }
    const body = req.body ?? {};
    const clean = (value: unknown, max: number) =>
      typeof value === "string" && value.length <= max ? value.trim() : "";
    const name = clean(body.name, 150),
      email = clean(body.email, 254).toLowerCase(),
      phone = clean(body.phone, 50),
      signature = clean(body.signature, 150);
    if (
      !name ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      signature.toLowerCase() !== name.toLowerCase() ||
      body.consent !== true ||
      body.website ||
      !/^[a-f0-9-]{36}$/.test(body.requestId ?? "")
    )
      throw new Error(
        "Enter your name, valid email, matching signature, and consent.",
      );
    const result = await classesTransaction((state) => {
      const previous = state.registrations.find(
        (r) => r.requestId === body.requestId,
      );
      if (previous) {
        if (
          previous.email !== email ||
          previous.name !== name ||
          previous.classId !== body.classId ||
          previous.sessionId !== body.sessionId || (previous.partnerRegistrationId ?? "") !== clean(body.partnerRegistrationId ?? "", 80)
        )
          throw new Error(
            "This request has already been used. Reload the form.",
          );
        const previousClass = state.classes.find(c => c.id === previous.classId);
        return { id: previous.id, status: previous.status, record: undefined, paymentUrl: previous.status !== "cancelled" && previous.adultDetails?.role !== "observer" && !previous.partnerRegistrationId && previousClass && !prerequisiteLevel(previousClass.level) ? previousClass.paymentUrl : undefined };
      }
      const c = state.classes.find((c) => c.id === body.classId && c.published);
      const session = c?.sessions.find((s) => s.id === body.sessionId);
      if (
        !c ||
        !session ||
        session.closed ||
        Date.parse(session.startsAt) <= Date.now() ||
        seatsRemaining(state, c.id, session) < 1
      )
        throw new Error(
          "This session is no longer available. Choose another date.",
        );
      if (
        !state.waiver.enabled ||
        !state.waiver.text ||
        state.waiver.version !== body.waiverVersion
      )
        throw new Error(
          "The waiver changed or registration is unavailable. Reload and review the current waiver.",
        );
      if (
        state.registrations.some(
          (r) =>
            r.classId === c.id &&
            r.sessionId === session.id &&
            r.email === email &&
            r.name.trim().replace(/\s+/g, " ").toLowerCase() === name.replace(/\s+/g, " ").toLowerCase() &&
            r.status !== "cancelled",
        )
      )
        throw new Error(
          "You already have a registration for this session. Contact D&S for changes.",
        );
      const timestamp = new Date().toISOString();
      const adultDetails = state.waiver.collectAdultDetails ? validateAdultDetails(body.adultDetails, new Date(timestamp), state.waiver.formKind === "adult-release-2026-11") : undefined;
      if (adultDetails && !phone) throw new Error("Enter your phone number as required by the waiver.");
      const observer = adultDetails?.role === "observer";
      const partnerRegistrationId = clean(body.partnerRegistrationId ?? "", 80);
      if (observer && partnerRegistrationId) throw new Error("Observers cannot join a couple payment. Contact D&S to arrange observation.");
      if (!observer && c.priceUnit === "couple" && !partnerRegistrationId && seatsRemaining(state, c.id, session) < 2)
        throw new Error("This session does not have two spaces available for a couple. Choose another date.");
      if (partnerRegistrationId) {
        const partner = state.registrations.find(r => r.id === partnerRegistrationId && r.classId === c.id && r.sessionId === session.id && r.status !== "cancelled" && !r.partnerRegistrationId);
        if (c.priceUnit !== "couple" || !partner || partner.name.toLowerCase() === name.toLowerCase() || state.registrations.some(r => r.partnerRegistrationId === partnerRegistrationId && r.status !== "cancelled"))
          throw new Error("Check your partner's registration reference and choose the same session. Each couple can have two participants.");
      }
      const record: Registration = {
        id: randomUUID(),
        requestId: body.requestId,
        classId: c.id,
        classTitle: c.title,
        classLevel: c.level,
        sessionId: session.id,
        startsAt: session.startsAt,
        priceCents: observer || partnerRegistrationId ? 0 : c.priceCents,
        priceUnit: observer ? "person" : c.priceUnit ?? "person",
        ...(partnerRegistrationId ? { partnerRegistrationId } : {}),
        name,
        email,
        phone,
        status: "pending",
        paymentStatus: "not_connected",
        submittedAt: timestamp,
        signature,
        waiverVersion: state.waiver.version,
        waiverText: state.waiver.text,
        consentText,
        signedAt: timestamp,
        ...(adultDetails ? { adultDetails } : {}),
      };
      record.signedCopy = signedWaiverCopy(record);
      record.signedCopySha256 = createHash("sha256").update(record.signedCopy, "utf8").digest("hex");
      record.waiverEmail = { status: "pending" };
      state.registrations.push(record);
      return { id: record.id, status: record.status, record, paymentUrl: !observer && !partnerRegistrationId && !prerequisiteLevel(c.level) ? c.paymentUrl : undefined };
    });
    // Commit first. Email failures must never turn a saved signup into an error.
    // Retries of the same request do not send duplicate notifications.
    let waiverEmailStatus = "previously_saved";
    if (result.record) {
      const delivery = await sendRegistrationEmails(result.record, result.paymentUrl);
      waiverEmailStatus = delivery.status;
      await classesTransaction(state => { const saved = state.registrations.find(r => r.id === result.id)!; saved.waiverEmail = delivery; });
    }
    res.status(201).json({ id: result.id, status: result.status, paymentUrl: result.paymentUrl, waiverEmailStatus });
  }),
);
router.patch(
  "/admin/classes/registrations/:id",
  admin,
  endpoint(async (req, res) => {
    if (req.body?.action !== "approve" && !["pending", "confirmed", "cancelled", "completed"].includes(req.body?.status))
      throw new Error("Invalid registration status.");
    res.json(
      await classesTransaction((state) => {
        const record = state.registrations.find((r) => r.id === req.params.id);
        if (!record) throw new Error("Registration not found.");
        const required = record.adultDetails?.role === "observer" ? undefined : prerequisiteLevel(registrationLevel(state, record));
        if (req.body.action === "approve") {
          if (record.status !== "pending" || !required) throw new Error("Only pending prerequisite requests need approval.");
          const completion = qualifyingCompletions(state, record).find(r => r.id === req.body.completionId);
          if (!completion) throw new Error(`Verify a completed ${required} registration for this participant before approval.`);
          record.approvedAt = new Date().toISOString();
          record.prerequisiteCompletionId = completion.id;
          return state;
        }
        if (record.status === "completed" && req.body.status !== "completed")
          throw new Error("Completed attendance cannot be changed through registration status controls.");
        if (["pending", "cancelled"].includes(req.body.status) && state.registrations.some(r => r.partnerRegistrationId === record.id && (r.status === "confirmed" || r.status === "completed")))
          throw new Error("Cancel or mark the partner pending first. Their confirmed seat depends on this couple registration.");
        if (req.body.status === "completed") {
          if (record.status !== "confirmed" || Date.parse(record.startsAt) > Date.now())
            throw new Error("Only a confirmed session that has started can be marked completed. Verify actual attendance first.");
          // Keep the class category frozen at signing.
          record.completedAt = new Date().toISOString();
        }
        if (req.body.status === "confirmed" && record.status !== "confirmed") {
          const partner = record.priceUnit === "couple" && !record.partnerRegistrationId
            ? state.registrations.find(r => r.partnerRegistrationId === record.id && r.status !== "cancelled")
            : undefined;
          if (record.priceUnit === "couple" && !record.partnerRegistrationId && !partner)
            throw new Error("Both adults must register and sign their own waiver before confirming this couple.");
          if (record.partnerRegistrationId && !state.registrations.some(r => r.id === record.partnerRegistrationId && (r.status === "confirmed" || r.status === "completed")))
            throw new Error("Verify the couple's payment and confirm the first participant before confirming their partner.");
          if (required && (!record.approvedAt || !qualifyingCompletions(state, record).some(r => r.id === record.prerequisiteCompletionId)))
            throw new Error(`Approve completed ${required} attendance before confirming this seat.`);
          const session = state.classes
            .find((c) => c.id === record.classId)
            ?.sessions.find((s) => s.id === record.sessionId);
          if (
            !session ||
            session.closed ||
            Date.parse(session.startsAt) <= Date.now() ||
            seatsRemaining(state, record.classId, session) < (partner && partner.status === "pending" ? 2 : 1)
          )
            throw new Error("This session is full, closed, or in the past.");
          // Reserve both places in the same transaction; never split a couple across the last seat.
          if (partner && partner.status === "pending") partner.status = "confirmed";
        }
        record.status = req.body.status;
        return state;
      }),
    );
  }),
);
router.post("/admin/classes/registrations/:id/resend-waiver", admin, endpoint(async (req, res) => {
  const record = await classesTransaction(state => state.registrations.find(r => r.id === req.params.id), false);
  if (!record) throw new Error("Registration not found.");
  const delivery = await resendWaiverCopy(record);
  res.json(await classesTransaction(state => { state.registrations.find(r => r.id === record.id)!.waiverEmail = delivery; return state; }));
}));
export default router;
