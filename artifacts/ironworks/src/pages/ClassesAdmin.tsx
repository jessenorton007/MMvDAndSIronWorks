import { useEffect, useState } from "react";
import {
  classesApi,
  classLevels,
  price,
  sessionDate,
  type ClassesState,
  type ForgeClass,
  type Registration,
} from "@/lib/classes";
import "./classes.css";
import { prerequisiteLevel, registrationLevel, qualifyingCompletions } from "../../../api-server/src/lib/classes-model";

const initialClass = (): ForgeClass => ({
  id: crypto.randomUUID(),
  slug: "",
  title: "",
  level: "Beginner",
  description: "",
  duration: "",
  location: "",
  priceCents: 0,
  published: false,
  images: [],
  sessions: [],
});
const localDate = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
export function ClassesAdmin() {
  const [state, setState] = useState<ClassesState>();
  const [editing, setEditing] = useState<ForgeClass>();
  const [readiness, setReadiness] = useState<{ issues: string[]; note: string }>();
  const [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [search, setSearch] = useState("");
  async function load() {
    setError("");
    try {
      setState(await classesApi<ClassesState>("/admin/classes"));
      setDirty(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (state) void classesApi<{ issues: string[]; note: string }>("/admin/classes/readiness").then(setReadiness).catch(() => setReadiness(undefined));
  }, [state?.revision]);
  async function setup() {
    setBusy(true);
    setError("");
    try {
      setState(await classesApi<ClassesState>("/admin/classes/setup", {}));
      setMessage("Four draft classes added with the supplied QuickBooks links and verified prices. Add final descriptions, photos, dates, and waiver before publishing.");
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (editing || dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [editing, dirty]);
  async function save(next: ClassesState) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      setState(
        await classesApi<ClassesState>(
          "/admin/classes",
          {
            classes: next.classes,
            waiver: next.waiver,
            revision: next.revision,
          },
          "PUT",
        ),
      );
      setEditing(undefined);
      setDirty(false);
      setMessage("Classes and waiver saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function changeStatus(
    record: Registration,
    status: Registration["status"],
    completionId?: string,
  ) {
    setBusy(true);
    setError("");
    try {
      const updated = await classesApi<ClassesState>(
        `/admin/classes/registrations/${record.id}`,
        completionId ? { action: "approve", completionId } : { status },
        "PATCH",
      );
      setState((current) =>
        current
          ? { ...current, registrations: updated.registrations }
          : updated,
      );
      setMessage(
        completionId ? "Prerequisite approved. Create and send an individual QuickBooks invoice to this participant, then confirm their seat after verifying payment. No email was sent by this action." : "Registration updated. Confirming the first member of a couple confirms both signed registrations together. No payment was processed and no email was sent.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File) {
    if (!editing) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 6 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG, or WebP under 6 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await classesApi<{ url: string }>("/admin/images", {
        image,
        filename: file.name,
      });
      setEditing((c) =>
        c ? { ...c, images: [...c.images, { src: result.url, alt: "" }] } : c,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const edit = <K extends keyof ForgeClass>(key: K, value: ForgeClass[K]) =>
    setEditing((c) => (c ? { ...c, [key]: value } : c));
  function download(record: Registration) {
    const text = `D&S Iron Works — signed class waiver\nRegistration: ${record.id}\nClass: ${record.classTitle}\nSession: ${sessionDate(record.startsAt)}\nParticipant: ${record.name}\nEmail: ${record.email}\nSigned: ${record.signedAt}\nWaiver version: ${record.waiverVersion}\n\n${record.waiverText}\n\n${record.consentText}\nElectronic signature: ${record.signature}\n`;
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `waiver-${record.id}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="classes-page classes-admin">
      <span className="classes-eyebrow">Class management</span>
      <h2>Classes & registrations</h2>
      <p>
        Add projects, upload photos, and manage sessions. Payments are checked manually in QuickBooks. Confirming a seat does not mark it paid.
      </p>
      {error && (
        <p role="alert" className="classes-error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="admin-status">
          {message}
        </p>
      )}
      {readiness && <details><summary>Launch checks · {readiness.issues.length} item(s) to review</summary><p className="classes-small">{readiness.note}</p><ul>{readiness.issues.map(issue => <li key={issue}>{issue}</li>)}</ul></details>}
      {!state ? (
        <button onClick={load}>Load classes</button>
      ) : (
        <>
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void save({
                  ...state,
                  classes: state.classes.some((c) => c.id === editing.id)
                    ? state.classes.map((c) =>
                        c.id === editing.id ? editing : c,
                      )
                    : [...state.classes, editing],
                });
              }}
            >
              <h3>
                {state.classes.some((c) => c.id === editing.id)
                  ? "Edit class"
                  : "New class"}
              </h3>
              <div className="admin-fields">
                <label>
                  Class name
                  <input
                    required
                    maxLength={150}
                    value={editing.title}
                    onChange={(e) => edit("title", e.target.value)}
                  />
                </label>
                <label>
                  Page URL: /classes/
                  <input
                    required
                    pattern="[a-z0-9-]+"
                    maxLength={100}
                    value={editing.slug}
                    placeholder="beginner-blacksmithing"
                    onChange={(e) => edit("slug", e.target.value)}
                  />
                </label>
                <label>
                  Category
                  <select
                    value={editing.level}
                    onChange={(e) =>
                      edit("level", e.target.value as ForgeClass["level"])
                    }
                  >
                    {classLevels.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Price {editing.priceUnit === "couple" ? "per couple" : "per participant"} (USD)
                  <input
                    required
                    type="number"
                    min="0"
                    max="10000"
                    step="0.01"
                    value={editing.priceCents / 100}
                    onChange={(e) =>
                      edit(
                        "priceCents",
                        Math.round(Number(e.target.value) * 100),
                      )
                    }
                  />
                </label>
                <label>
                  Duration
                  <input
                    maxLength={100}
                    required={editing.published}
                    value={editing.duration}
                    placeholder="e.g. 2 hours"
                    onChange={(e) => edit("duration", e.target.value)}
                  />
                </label>
                <label>
                  Location / address
                  <input
                    maxLength={300}
                    required={editing.published}
                    value={editing.location}
                    onChange={(e) => edit("location", e.target.value)}
                  />
                </label>
              </div>
              <label>
                Description and what participants will make
                <textarea
                  rows={7}
                  maxLength={10000}
                  required={editing.published}
                  value={editing.description}
                  onChange={(e) => edit("description", e.target.value)}
                />
              </label>
              <label>
                QuickBooks payment link
                <input type="url" maxLength={2000} value={editing.paymentUrl ?? ""} placeholder="https://connect.intuit.com/pay/..." onChange={(e) => edit("paymentUrl", e.target.value)} />
              </label>
              {editing.level === "Date night" && <label>Price covers<select value={editing.priceUnit ?? "person"} onChange={e => edit("priceUnit", e.target.value as "person" | "couple")}><option value="person">One participant</option><option value="couple">One couple (two adults)</option></select></label>}
              <p className="classes-small">
                Beginner and Date Night show this link after registration. Intermediate and Advanced links are stored privately for reference only; send an individual QuickBooks invoice after eligibility approval. Verify the amount in QuickBooks when changing a website price—this field does not update QuickBooks.
              </p>
              <label className="class-check">
                <input
                  type="checkbox"
                  checked={editing.published}
                  onChange={(e) => edit("published", e.target.checked)}
                />{" "}
                Show this class on the website
              </label>
              <h3>Project photos</h3>
              <p className="classes-small">
                Add up to 12 photos. The first photo is the class cover.
              </p>
              {editing.images.map((img, i) => (
                <div key={i} className="admin-session">
                  <img
                    className="admin-image"
                    src={img.src}
                    alt={img.alt || "New project photo"}
                  />
                  <label>
                    Photo description
                    <input
                      required
                      maxLength={300}
                      value={img.alt}
                      onChange={(e) =>
                        edit(
                          "images",
                          editing.images.map((image, index) =>
                            index === i
                              ? { ...image, alt: e.target.value }
                              : image,
                          ),
                        )
                      }
                    />
                  </label>
                  <div className="admin-actions">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => {
                        const images = [...editing.images];
                        [images[i - 1], images[i]] = [
                          images[i]!,
                          images[i - 1]!,
                        ];
                        edit("images", images);
                      }}
                    >
                      Move earlier
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        edit(
                          "images",
                          editing.images.filter((_, index) => index !== i),
                        )
                      }
                    >
                      Remove photo
                    </button>
                  </div>
                </div>
              ))}
              <label>
                Upload a photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy || editing.images.length >= 12}
                  onChange={(e) => {
                    if (e.target.files?.[0]) void upload(e.target.files[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              <h3>Session dates</h3>
              <p className="classes-small">
                Enter times in your browser’s timezone (
                {Intl.DateTimeFormat().resolvedOptions().timeZone}). Customers
                see Mountain time. Sessions with registrations can be closed,
                but cannot be removed or rescheduled.
              </p>
              {editing.sessions.map((s, i) => (
                <div key={s.id} className="admin-session">
                  <div className="admin-fields">
                    <label>
                      Date and time
                      <input
                        type="datetime-local"
                        required
                        value={localDate(s.startsAt)}
                        onChange={(e) => {
                          if (e.target.value)
                            edit(
                              "sessions",
                              editing.sessions.map((session, index) =>
                                index === i
                                  ? {
                                      ...session,
                                      startsAt: new Date(
                                        e.target.value,
                                      ).toISOString(),
                                    }
                                  : session,
                              ),
                            );
                        }}
                      />
                    </label>
                    <label>
                      Participant capacity
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={s.capacity}
                        onChange={(e) =>
                          edit(
                            "sessions",
                            editing.sessions.map((session, index) =>
                              index === i
                                ? {
                                    ...session,
                                    capacity: Number(e.target.value),
                                  }
                                : session,
                            ),
                          )
                        }
                      />
                    </label>
                  </div>
                  <label className="class-check">
                    <input
                      type="checkbox"
                      checked={s.closed}
                      onChange={(e) =>
                        edit(
                          "sessions",
                          editing.sessions.map((session, index) =>
                            index === i
                              ? { ...session, closed: e.target.checked }
                              : session,
                          ),
                        )
                      }
                    />{" "}
                    Closed to registration
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      edit(
                        "sessions",
                        editing.sessions.filter((_, index) => index !== i),
                      )
                    }
                  >
                    Remove session
                  </button>
                </div>
              ))}
              <div className="admin-actions">
                <button
                  type="button"
                  onClick={() =>
                    edit("sessions", [
                      ...editing.sessions,
                      {
                        id: crypto.randomUUID(),
                        startsAt: new Date(
                          Date.now() + 7 * 86400000,
                        ).toISOString(),
                        capacity: 6,
                        closed: false,
                      },
                    ])
                  }
                >
                  Add session
                </button>
              </div>
              <div className="admin-actions">
                <button
                  className="classes-button"
                  disabled={busy}
                  type="submit"
                >
                  {busy ? "Saving…" : "Save class"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm("Discard unsaved class edits?"))
                      setEditing(undefined);
                  }}
                >
                  Cancel editing
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="admin-actions">
                <button
                  disabled={busy}
                  className="classes-button"
                  onClick={() => setEditing(initialClass())}
                >
                  Add class
                </button>
                <a
                  href="/classes"
                  target="_blank"
                  rel="noreferrer"
                  className="classes-button"
                >
                  View classes page
                </a>
                <button
                  disabled={busy}
                  onClick={() => {
                    if (
                      !dirty ||
                      window.confirm(
                        "Discard unsaved waiver changes and reload?",
                      )
                    )
                      void load();
                  }}
                >
                  Reload
                </button>
              </div>
              {!state.classes.length && (
                <div><p>
                  No classes yet. Add your first class; it starts as a draft.
                </p><button disabled={busy || dirty} onClick={() => void setup()}>Add Beginner, Intermediate, Advanced, and Date Night drafts</button></div>
              )}
              {state.classes.map((c) => (
                <article key={c.id}>
                  <span className="classes-eyebrow">
                    {c.level} · {c.published ? "Visible" : "Draft / hidden"}
                  </span>
                  <h3>{c.title}</h3>
                  <p>
                    {price(c.priceCents)} per {c.priceUnit === "couple" ? "couple" : "person"} · {c.sessions.length}{" "}
                    session(s)
                  </p>
                  <div className="admin-actions">
                    <button
                      disabled={busy}
                      onClick={() => setEditing(structuredClone(c))}
                    >
                      Edit class
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        void save({
                          ...state,
                          classes: state.classes.map((item) =>
                            item.id === c.id
                              ? { ...item, published: !item.published }
                              : item,
                          ),
                        })
                      }
                    >
                      {c.published ? "Hide class" : "Publish class"}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete ${c.title}? Classes with registrations must be hidden instead.`,
                          )
                        )
                          void save({
                            ...state,
                            classes: state.classes.filter(
                              (item) => item.id !== c.id,
                            ),
                          });
                      }}
                    >
                      Delete
                    </button>
                    {c.published && (
                      <a
                        href={`/classes/${c.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open class ↗
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </>
          )}
          {!editing && (
            <details>
              <summary>
                Waiver & registration settings
                {dirty ? " — unsaved changes" : ""}
              </summary>
              <p className="classes-small">
                Use the business’s approved waiver wording. Registration stays
                closed until a version and waiver are saved and enabled. Signed
                copies retain their original wording. This release accepts
                adults signing for themselves; guardian signing is not included.
              </p>
              <label>
                Waiver version
                <input
                  maxLength={80}
                  value={state.waiver.version}
                  placeholder="e.g. 2026-01"
                  onChange={(e) => {
                    setDirty(true);
                    setState({
                      ...state,
                      waiver: { ...state.waiver, version: e.target.value },
                    });
                  }}
                />
              </label>
              <label>
                Approved waiver text
                <textarea
                  rows={12}
                  maxLength={30000}
                  value={state.waiver.text}
                  onChange={(e) => {
                    setDirty(true);
                    setState({
                      ...state,
                      waiver: { ...state.waiver, text: e.target.value },
                    });
                  }}
                />
              </label>
              <label className="class-check">
                <input
                  type="checkbox"
                  checked={state.waiver.enabled}
                  onChange={(e) => {
                    setDirty(true);
                    setState({
                      ...state,
                      waiver: { ...state.waiver, enabled: e.target.checked },
                    });
                  }}
                />{" "}
                Approved waiver is ready; enable registration
              </label>
              <button
                disabled={busy}
                className="classes-button"
                onClick={() => void save(state)}
              >
                Save waiver settings
              </button>
            </details>
          )}
          <h3>Registrations</h3>
          <p className="classes-small">
            Beginner → Intermediate → Advanced. Date Night has no prerequisite.
            Mark completed only after verifying attendance. For restricted classes, verify the participant's name and email against their completion record, approve eligibility, then send an individual invoice from QuickBooks. Do not share reusable Intermediate or Advanced payment links.
          </p>
          <p className="classes-small">
            Pending requests do not hold seats. Confirm only after arranging
            payment with the customer. Contact participants directly; status
            changes do not send emails.
          </p>
          <label className="admin-search">
            Search by name, email, or class
            <input value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          {!state.registrations.length && <p>No registrations yet.</p>}
          {[...state.registrations]
            .reverse()
            .filter((r) =>
              `${r.name} ${r.email} ${r.classTitle}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((r) => (
              <article key={r.id} className="admin-record">
                <span className="classes-eyebrow">
                  {r.status} · Verify payment in QuickBooks
                </span>
                <h3>
                  {r.name} · {r.classTitle}
                </h3>
                <p>
                  {sessionDate(r.startsAt)} · {price(r.priceCents)}
                  <br />
                  <a href={`mailto:${r.email}`}>{r.email}</a>
                  {r.phone && ` · ${r.phone}`}
                </p>
                <p className="classes-small">Reference: {r.id}</p>
                {r.priceUnit === "couple" && <p className="classes-small">{r.partnerRegistrationId ? `Partner registration: ${r.partnerRegistrationId}. Covered by that couple's payment; do not invoice twice.` : `Payment covers two adults. Partner: ${state.registrations.find(other => other.partnerRegistrationId === r.id && other.status !== "cancelled")?.name ?? "Awaiting separate partner waiver"}. After verifying payment and both waivers, use Confirm both seats on this registration.`}</p>}
                {prerequisiteLevel(registrationLevel(state, r)) ? (
                  <div>
                    <p>Requires completed {prerequisiteLevel(registrationLevel(state, r))}. {r.approvedAt ? "Eligibility approved; send an individual QuickBooks invoice and verify payment before confirming." : "Awaiting eligibility approval. Do not request payment yet."}</p>
                    {r.status === "pending" && !r.approvedAt && (
                      qualifyingCompletions(state, r).length ? qualifyingCompletions(state, r).map(completion => (
                        <button key={completion.id} disabled={busy} onClick={() => {
                          if (window.confirm(`Verify that ${r.name} (${r.email}) is the same participant who completed ${completion.classTitle} on ${sessionDate(completion.startsAt)}. Approve eligibility?`)) void changeStatus(r, r.status, completion.id);
                        }}>Approve using {completion.classTitle} · {sessionDate(completion.startsAt)}</button>
                      )) : <p className="classes-small">No matching completed attendance found. Search the roster and verify their earlier class. Payment or a confirmed booking alone does not qualify.</p>
                    )}
                  </div>
                ) : <p className="classes-small">No prerequisite required.</p>}
                {r.completedAt && <p className="classes-small">Attendance recorded completed: {sessionDate(r.completedAt)}</p>}
                <div className="admin-actions">
                  {(["pending", "confirmed", "cancelled"] as const).map(
                    (status) => (
                      <button
                        key={status}
                        disabled={busy || r.status === status || r.status === "completed" || (status === "confirmed" && !!prerequisiteLevel(registrationLevel(state, r)) && !r.approvedAt)}
                        onClick={() => void changeStatus(r, status)}
                      >
                        {status === "confirmed"
                          ? r.priceUnit === "couple" && !r.partnerRegistrationId ? "Confirm both seats" : "Confirm seat"
                          : status === "cancelled"
                            ? "Cancel registration"
                            : "Mark pending"}
                      </button>
                    ),
                  )}
                  {r.status === "confirmed" && Date.parse(r.startsAt) <= Date.now() && (
                    <button disabled={busy} onClick={() => {
                      if (window.confirm(`Confirm ${r.name} actually attended and completed ${r.classTitle}? This is an attendance record, not a payment status.`)) void changeStatus(r, "completed");
                    }}>Mark class completed</button>
                  )}
                  <button onClick={() => download(r)}>
                    Download signed waiver
                  </button>
                </div>
                <details>
                  <summary>View signed waiver</summary>
                  <p className="classes-small">
                    {r.signature} · {r.signedAt} · Version {r.waiverVersion}
                  </p>
                  <pre>
                    {r.waiverText}
                    {"\n\n"}
                    {r.consentText}
                  </pre>
                </details>
              </article>
            ))}
        </>
      )}
    </section>
  );
}
