import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  ArrowRight,
  Hammer,
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { useSeo } from "@/lib/seo";
import {
  classesApi,
  classLevels,
  price,
  sessionDate,
  type PublicCatalog,
  type PublicClass,
} from "@/lib/classes";
import "./classes.css";

const introductions = [
  "Start with the fundamentals and get comfortable at the anvil.",
  "Build on your skills with more involved forging projects.",
  "Take on more demanding techniques and detailed work.",
  "Share time at the forge and make something together.",
];
export function ClassesPage() {
  const [, params] = useRoute("/classes/:slug");
  const [catalog, setCatalog] = useState<PublicCatalog>();
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All classes");
  const load = () => {
    setError("");
    classesApi<PublicCatalog>("/classes")
      .then(setCatalog)
      .catch((e) => setError(e.message));
  };
  useEffect(load, []);
  const selected = catalog?.classes.find((c) => c.slug === params?.slug);
  useSeo({
    title: `${selected?.title ?? "Blacksmithing Classes"} | D&S Iron Works`,
    description:
      selected?.description.slice(0, 160) ??
      "Explore beginner, intermediate, advanced, and date night blacksmithing classes at D&S Iron Works.",
    path: params ? `/classes/${params.slug}` : "/classes",
  });
  return (
    <div className="classes-page min-h-screen bg-background text-foreground">
      <Navigation />
      <main>
        {catalog?.preview && (
          <div
            style={{
              position: "fixed",
              bottom: 12,
              left: 12,
              right: 12,
              zIndex: 60,
              pointerEvents: 'none',
              background: "#432712",
              border: "1px solid #fb923c",
              padding: "10px 16px",
              borderRadius: 6,
              fontSize: 12,
              textAlign: "center",
            }}
          >
            Development preview · Sample classes, dates, prices, and waiver. No
            real bookings or payments.
          </div>
        )}
        {params ? (
          <div className="classes-wrap classes-detail">
            <Link href="/classes" className="classes-back">
              ← All classes
            </Link>
            {selected && catalog ? (
              <ClassDetail
                key={selected.id}
                item={selected}
                catalog={catalog}
              />
            ) : !catalog ? (
              <p role="status">Loading class…</p>
            ) : (
              <>
                <h1>Class not available</h1>
                <p>
                  This class may have been removed or is not open yet. Browse
                  the current classes for other options.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <section className="classes-hero">
              <img
                src="/images/red-hot-maple-leaf-poster.jpg"
                alt="Hot steel being shaped at the forge"
              />
              <div className="classes-hero-shade" />
              <div className="classes-wrap classes-hero-content">
                <span className="classes-eyebrow">
                  D&S Iron Works · At the forge
                </span>
                <h1>
                  Make something
                  <br />
                  <em>with your own hands.</em>
                </h1>
                <p>
                  Step up to the anvil. Explore blacksmithing classes for your
                  first sparks, your next challenge, or a night together.
                </p>
                <a href="#find-class" className="classes-button">
                  Explore classes <ArrowRight size={18} />
                </a>
              </div>
            </section>
            <section className="classes-wrap classes-intro">
              <div>
                <span className="classes-eyebrow">
                  A place for every skill level
                </span>
                <h2>Find your time at the forge.</h2>
              </div>
              <p>
                Browse the projects, choose a session, and send your
                registration. Each participant signs their own waiver.
              </p>
            </section>
            <section
              className="classes-wrap classes-categories"
              aria-label="Class categories"
            >
              {classLevels.map((level, i) => (
                <button
                  key={level}
                  onClick={() => {
                    setFilter(level);
                    document
                      .getElementById("find-class")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <span className="classes-number">0{i + 1}</span>
                  <h3>{level}</h3>
                  <p>{introductions[i]}</p>
                  <ArrowRight size={18} />
                </button>
              ))}
            </section>
            <section id="find-class" className="classes-wrap classes-list">
              <span className="classes-eyebrow">Find your class</span>
              <h2>Good things start with a spark.</h2>
              <div className="classes-filters">
                {["All classes", ...classLevels].map((level) => (
                  <button
                    aria-pressed={filter === level}
                    className={filter === level ? "active" : ""}
                    key={level}
                    onClick={() => setFilter(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
              {!catalog && !error && <p role="status">Loading classes…</p>}
              {catalog && (
                <div className="classes-grid">
                  {catalog.classes
                    .filter(
                      (c) => filter === "All classes" || c.level === filter,
                    )
                    .map((c) => (
                      <Link
                        href={`/classes/${c.slug}`}
                        className="class-card"
                        key={c.id}
                      >
                        {c.images[0] ? (
                          <img
                            src={c.images[0].src}
                            alt={c.images[0].alt}
                            loading="lazy"
                          />
                        ) : (
                          <div className="class-image-placeholder">
                            <Hammer size={40} />
                            <span>Project photos coming soon</span>
                          </div>
                        )}
                        <div className="class-card-body">
                          <span className="classes-eyebrow">{c.level}</span>
                          <h3>{c.title}</h3>
                          <p>{c.description}</p>
                          <div className="class-card-meta">
                            <span>{price(c.priceCents)} / person</span>
                            <span>{c.duration}</span>
                          </div>
                          <span className="class-card-link">
                            View class & dates <ArrowRight size={16} />
                          </span>
                        </div>
                      </Link>
                    ))}
                </div>
              )}
              {catalog &&
                !catalog.classes.some(
                  (c) => filter === "All classes" || c.level === filter,
                ) && (
                  <div className="classes-empty">
                    <CalendarDays size={30} />
                    <h3>New sessions are on the way.</h3>
                    <p>
                      {filter === "All classes"
                        ? "Class details and dates will be posted here when they are ready."
                        : `No ${filter.toLowerCase()} classes are listed yet. Check another category or ask about upcoming sessions.`}
                    </p>
                    <Link href="/contact" className="classes-text-link">
                      Ask about classes <ArrowRight size={16} />
                    </Link>
                  </div>
                )}
            </section>
            <section className="classes-wrap classes-how">
              <h2>From curiosity to creation.</h2>
              <div>
                {[
                  [
                    "01",
                    "Choose your class",
                    "See the project, price, and upcoming dates before you register.",
                  ],
                  [
                    "02",
                    "Read & sign",
                    "Review the waiver and sign for yourself during registration.",
                  ],
                  [
                    "03",
                    "Get confirmation",
                    "D&S reviews your request and follows up about your seat and payment.",
                  ],
                ].map(([n, title, copy]) => (
                  <article key={n}>
                    <span className="classes-number">{n}</span>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
        {error && (
          <div className="classes-wrap classes-error" role="alert">
            {error} <button onClick={load}>Try again</button>
          </div>
        )}
        <footer className="classes-wrap classes-footer">
          <span>D&S IRON WORKS</span>
          <Link href="/contact">Questions? Get in touch →</Link>
        </footer>
      </main>
    </div>
  );
}

function ClassDetail({
  item,
  catalog,
}: {
  item: PublicClass;
  catalog: PublicCatalog;
}) {
  const [sessionId, setSessionId] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [receipt, setReceipt] = useState("");
  const [requestId] = useState(() => crypto.randomUUID());
  const available = item.sessions.filter((s) => !s.closed && s.remaining > 0);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await classesApi<{ id: string }>(
        "/classes/registrations",
        {
          requestId,
          classId: item.id,
          sessionId,
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          signature: form.get("signature"),
          consent: form.get("consent") === "on",
          waiverVersion: catalog.waiver.version,
          website: form.get("website"),
        },
      );
      setReceipt(result.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <span className="classes-eyebrow">{item.level}</span>
      <h1>{item.title}</h1>
      <div className="class-detail-layout">
        <div>
          <p className="class-description">{item.description}</p>
          <div className="class-facts">
            <span>
              <Clock size={18} />
              {item.duration}
            </span>
            <span>
              <MapPin size={18} />
              {item.location}
            </span>
            <strong>{price(item.priceCents)} per participant</strong>
          </div>
          <div className="class-gallery">
            {item.images.map((image, i) => (
              <figure key={`${image.src}-${i}`}>
                <img src={image.src} alt={image.alt} />
                <figcaption>{image.alt}</figcaption>
              </figure>
            ))}
          </div>
          <div className="classes-note">
            <h3>Before you register</h3>
            <p>
              Registration is currently for adults 18 and older. Each
              participant must register and sign for themselves, including both
              people attending a date night class.
            </p>
            <p>
              Submitting a request does not reserve a seat or collect payment.
              D&S will contact you to confirm availability and arrange payment.
            </p>
          </div>
        </div>
        <aside className="class-registration">
          {receipt ? (
            <div role="status">
              <CheckCircle2 size={36} className="text-orange-400" />
              <h2>Request received.</h2>
              <p>
                Your registration and signed waiver have been saved. Your seat
                is pending review, and no payment has been collected.
              </p>
              <p>
                D&S will contact you using the details you provided. Save your
                reference below; an automatic confirmation email is not sent
                yet.
              </p>
              <code className="class-reference">{receipt}</code>
              <Link href="/classes" className="classes-button">
                Browse classes
              </Link>
            </div>
          ) : (
            <>
              <span className="classes-eyebrow">Join us at the anvil</span>
              <h2>Choose your session.</h2>
              {!catalog.waiver.enabled ? (
                <p>
                  Registration will open once the class waiver is ready.{" "}
                  <Link href="/contact">Contact D&S for details.</Link>
                </p>
              ) : !available.length ? (
                <p>
                  No open sessions right now. Check back for new dates or{" "}
                  <Link href="/contact">contact D&S.</Link>
                </p>
              ) : (
                <form onSubmit={submit}>
                  <label>
                    Session
                    <select
                      required
                      value={sessionId}
                      onChange={(e) => setSessionId(e.target.value)}
                    >
                      <option value="">Choose a date</option>
                      {item.sessions.map((s) => (
                        <option
                          key={s.id}
                          value={s.id}
                          disabled={s.closed || s.remaining < 1}
                        >
                          {sessionDate(s.startsAt)}
                          {s.closed
                            ? " — Closed"
                            : s.remaining < 1
                              ? " — Full"
                              : ` — ${s.remaining} spaces available`}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Your full name
                    <input
                      name="name"
                      required
                      maxLength={150}
                      autoComplete="name"
                    />
                  </label>
                  <label>
                    Email
                    <input
                      name="email"
                      type="email"
                      required
                      maxLength={254}
                      autoComplete="email"
                    />
                  </label>
                  <label>
                    Phone (optional)
                    <input
                      name="phone"
                      type="tel"
                      maxLength={50}
                      autoComplete="tel"
                    />
                  </label>
                  <div hidden aria-hidden="true">
                    <input name="website" tabIndex={-1} autoComplete="off" />
                  </div>
                  <h3>Participant waiver</h3>
                  <p className="classes-small">
                    Version {catalog.waiver.version}
                  </p>
                  <div className="class-waiver" tabIndex={0}>
                    {catalog.waiver.text}
                  </div>
                  <label>
                    Electronic signature
                    <input
                      name="signature"
                      required
                      maxLength={150}
                      placeholder="Type your full name exactly as above"
                    />
                  </label>
                  <label className="class-check">
                    <input name="consent" type="checkbox" required />
                    <span>{catalog.consentText}</span>
                  </label>
                  <p className="classes-small">
                    Your contact details and signed waiver are stored for D&S to
                    manage your class registration.
                  </p>
                  <p className="classes-note">
                    No payment is collected here. Your seat is only confirmed
                    after D&S reviews your request.
                  </p>
                  {error && (
                    <p role="alert" className="classes-error">
                      {error}
                    </p>
                  )}
                  <button
                    disabled={busy}
                    className="classes-button"
                    type="submit"
                  >
                    {busy ? "Sending…" : "Send registration request"}{" "}
                    <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </>
          )}
        </aside>
      </div>
    </>
  );
}
