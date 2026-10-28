import { Router, type RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { isAdminRequest } from "./admin";
import { classesTransaction } from "../lib/classes-store";
import { sendRegistrationEmails } from "../lib/classes-email";
import {
  consentText,
  seatsRemaining,
  validateCatalog,
  prerequisiteLevel,
  registrationLevel,
  qualifyingCompletions,
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
            .map((c) => ({
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
          paymentProvider: "unconfigured",
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
          state.waiver.text !== catalog.waiver.text &&
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
          previous.sessionId !== body.sessionId
        )
          throw new Error(
            "This request has already been used. Reload the form.",
          );
        return { id: previous.id, status: previous.status, record: undefined };
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
            r.status !== "cancelled",
        )
      )
        throw new Error(
          "You already have a registration for this session. Contact D&S for changes.",
        );
      const timestamp = new Date().toISOString();
      const record: Registration = {
        id: randomUUID(),
        requestId: body.requestId,
        classId: c.id,
        classTitle: c.title,
        classLevel: c.level,
        sessionId: session.id,
        startsAt: session.startsAt,
        priceCents: c.priceCents,
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
      };
      state.registrations.push(record);
      return { id: record.id, status: record.status, record };
    });
    // Commit first. Email failures must never turn a saved signup into an error.
    // Retries of the same request do not send duplicate notifications.
    if (result.record) await sendRegistrationEmails(result.record);
    res.status(201).json({ id: result.id, status: result.status });
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
        const required = prerequisiteLevel(registrationLevel(state, record));
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
        if (req.body.status === "completed") {
          if (record.status !== "confirmed" || Date.parse(record.startsAt) > Date.now())
            throw new Error("Only a confirmed session that has started can be marked completed. Verify actual attendance first.");
          record.classLevel = registrationLevel(state, record);
          record.completedAt = new Date().toISOString();
        }
        if (req.body.status === "confirmed" && record.status !== "confirmed") {
          if (required && (!record.approvedAt || !qualifyingCompletions(state, record).some(r => r.id === record.prerequisiteCompletionId)))
            throw new Error(`Approve completed ${required} attendance before confirming this seat.`);
          const session = state.classes
            .find((c) => c.id === record.classId)
            ?.sessions.find((s) => s.id === record.sessionId);
          if (
            !session ||
            session.closed ||
            Date.parse(session.startsAt) <= Date.now() ||
            seatsRemaining(state, record.classId, session) < 1
          )
            throw new Error("This session is full, closed, or in the past.");
        }
        record.status = req.body.status;
        return state;
      }),
    );
  }),
);
export default router;
