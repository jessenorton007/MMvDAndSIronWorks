import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useRoute } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Hammer,
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { FloatingContactBanner } from "@/components/FloatingContactBanner";
import { Embers } from "@/components/Embers";
import { GlassButton } from "@/components/GlassButton";
import { ResilientImage } from "@/components/ResilientImage";
import { useSeo } from "@/lib/seo";
import {
  classesApi,
  classLevels,
  price,
  sessionDate,
  type PublicCatalog,
  type PublicClass,
} from "@/lib/classes";

const eyebrow =
  "text-xs font-display tracking-[0.3em] uppercase text-orange-400/70 block mb-4";
const heading =
  "font-display text-2xl sm:text-3xl uppercase tracking-widest text-white";
const panel = "rounded-xl p-6 sm:p-8 bg-white/[0.025] border border-white/10";
const field =
  "block w-full rounded-lg px-3 py-2.5 mt-2 bg-white/[0.04] border border-white/10 text-white text-sm font-sans placeholder:text-white/25 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/30";
const label = "block text-sm text-white/60 font-sans";

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
  const visibleClasses =
    catalog?.classes.filter(
      (c) => filter === "All classes" || c.level === filter,
    ) ?? [];
  useSeo({
    title: `${selected?.title ?? "Blacksmithing Classes"} | D&S Iron Works`,
    description:
      selected?.description.slice(0, 160) ??
      "Explore beginner, intermediate, advanced, and date night blacksmithing classes at D&S Iron Works.",
    path: params ? `/classes/${params.slug}` : "/classes",
  });

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navigation />
      <FloatingContactBanner />
      <Embers />
      <main className="relative pt-28 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,77,0,0.06)_0%,transparent_62%)] pointer-events-none" />
        <div className="container mx-auto px-5 sm:px-6 md:px-12 relative z-10">
          <Link
            href={params ? "/classes" : "/"}
            className="inline-flex items-center gap-2 text-white/35 hover:text-white transition-colors mb-10 group font-display tracking-wider text-sm uppercase"
          >
            <ArrowLeft
              size={15}
              className="group-hover:-translate-x-1 transition-transform"
            />
            {params ? "All Classes" : "Back to Home"}
          </Link>
          {catalog?.preview && (
            <p className="mb-8 rounded-lg border border-orange-500/15 bg-orange-500/[0.04] px-4 py-3 text-xs text-orange-200/60 font-sans">
              Development preview · Sample dates and waiver. Payment buttons open real QuickBooks checkout pages; do not pay while testing.
            </p>
          )}
          {error && (
            <div
              className="mb-8 rounded-xl border border-red-400/20 bg-red-500/5 p-5 text-red-200/80 text-sm"
              role="alert"
            >
              {error}{" "}
              <button onClick={load} className="underline ml-3">
                Try again
              </button>
            </div>
          )}
          {params ? (
            selected && catalog ? (
              <ClassDetail
                key={selected.id}
                item={selected}
                catalog={catalog}
              />
            ) : !catalog ? (
              <p role="status" className="text-white/50">
                Loading class…
              </p>
            ) : (
              <div className={panel}>
                <h1 className={heading}>Class not available</h1>
                <p className="text-white/50 font-sans mt-4">
                  This class may have been removed or is not open yet. Browse
                  the current classes for other options.
                </p>
              </div>
            )
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
                <div>
                  <span className={eyebrow}>Learn at the Forge</span>
                  <h1 className="font-display text-5xl md:text-7xl tracking-widest uppercase leading-none text-white">
                    Blacksmithing{" "}
                    <span className="text-forge-gradient">Classes</span>
                  </h1>
                </div>
                <p className="text-white/55 max-w-md font-sans font-light leading-relaxed">
                  Learn a new skill and make something of your own. Explore
                  beginner, intermediate, advanced, and date night classes at
                  D&S Iron Works.
                </p>
              </div>
              <div
                className="flex flex-wrap gap-2 mb-10"
                aria-label="Filter classes"
              >
                {["All classes", ...classLevels].map((level) => (
                  <button
                    key={level}
                    aria-pressed={filter === level}
                    onClick={() => setFilter(level)}
                    className={`rounded-full border px-4 py-2 text-xs font-display tracking-widest uppercase transition-colors focus-visible:outline-2 focus-visible:outline-orange-400 ${filter === level ? "border-orange-500/30 bg-orange-500/10 text-orange-200/90" : "border-white/10 bg-white/[0.025] text-white/45 hover:text-white hover:border-white/25"}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              {!catalog && !error && (
                <p role="status" className="text-white/50">
                  Loading classes…
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-16">
                {visibleClasses.map((c, i) => (
                  <motion.article
                    key={c.id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: i * 0.06 }}
                    className="group rounded-xl overflow-hidden bg-white/[0.025] border border-white/[0.09]"
                  >
                    <Link
                      href={`/classes/${c.slug}`}
                      className="block w-full text-left h-full"
                    >
                      <div className="aspect-[4/3] overflow-hidden">
                        {c.images[0] ? (
                          <ResilientImage
                            src={c.images[0].src}
                            alt={c.images[0].alt}
                            loading={i < 3 ? "eager" : "lazy"}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-4 bg-[linear-gradient(135deg,rgba(255,140,26,0.18),rgba(255,255,255,0.035)_45%,rgba(0,0,0,0.45))]">
                            <Hammer
                              size={40}
                              strokeWidth={1.4}
                              className="text-orange-300/70"
                            />
                            <span className="font-display text-xs uppercase tracking-[0.28em] text-white/55">
                              Project Photos Coming Soon
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-5 sm:p-6">
                        <span className="text-[10px] font-display tracking-[0.24em] uppercase text-orange-400/65 block mb-2">
                          {c.level}
                        </span>
                        <h2 className="font-display text-xl uppercase tracking-wider text-white mb-3">
                          {c.title}
                        </h2>
                        <p className="text-white/50 text-sm font-sans leading-relaxed mb-5 line-clamp-3">
                          {c.description}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 mb-5">
                          <span className="font-display text-xl text-forge-gradient">
                            {price(c.priceCents)}
                            <span className="font-sans text-xs text-white/35 ml-2">
                              / {c.priceUnit === "couple" ? "couple" : "person"}
                            </span>
                          </span>
                          <span className="text-xs text-white/40 font-sans">
                            {c.duration}
                          </span>
                        </div>
                        <span className="nav-link inline-flex items-center gap-2 text-xs font-display tracking-widest uppercase">
                          View Class & Dates <ArrowRight size={13} />
                        </span>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>
              {catalog && !visibleClasses.length && (
                <div className={`${panel} mb-16`}>
                  <CalendarDays size={28} className="text-orange-400/70 mb-5" />
                  <h2 className={heading}>New Sessions Coming Soon</h2>
                  <p className="text-white/50 text-sm font-sans leading-relaxed mt-4 mb-6">
                    {filter === "All classes"
                      ? "Class details and dates will be posted here when they are ready."
                      : `No ${filter.toLowerCase()} classes are listed yet. Check another category or ask about upcoming sessions.`}
                  </p>
                  <GlassButton href="/contact">Ask About Classes</GlassButton>
                </div>
              )}
              <div className="rounded-xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.025] border border-orange-400/[0.16]">
                <div>
                  <h2 className={`${heading} mb-2`}>Find Your First Class</h2>
                  <p className="text-white/50 font-sans text-sm leading-relaxed max-w-2xl">
                    Not sure where to start? Talk with Dallan about your
                    experience and the projects you'd like to make.
                  </p>
                </div>
                <GlassButton href="tel:+14354219033" className="shrink-0">
                  <span className="inline-flex items-center gap-2">
                    <Phone size={15} />
                    Call Dallan
                  </span>
                </GlassButton>
              </div>
            </>
          )}
        </div>
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
  const [paymentUrl, setPaymentUrl] = useState("");
  const [partnerReference, setPartnerReference] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [receipt, setReceipt] = useState("");
  const [signingRole, setSigningRole] = useState("participant");
  const [copyEmailStatus, setCopyEmailStatus] = useState("");
  const [requestId] = useState(() => crypto.randomUUID());
  const available = item.sessions.filter((s) => !s.closed && s.remaining > 0);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await classesApi<{ id: string; paymentUrl?: string; waiverEmailStatus?: string }>(
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
          partnerRegistrationId: partnerReference.trim(),
          ...(catalog.waiver.collectAdultDetails ? { adultDetails: Object.fromEntries(["dateOfBirth", "address", "cityStateZip", "emergencyContact", "medicalConditions", "medications", "role", "healthDisclosure", "photoPermission"].map(key => [key, form.get(key)])) } : {}),
        },
      );
      setCopyEmailStatus(result.waiverEmailStatus ?? "");
      setReceipt(result.id);
      setPaymentUrl(result.paymentUrl ?? "");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-14 items-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className={eyebrow}>{item.level}</span>
          <h1 className="font-display text-5xl md:text-7xl tracking-widest uppercase leading-none text-white mb-6">
            {item.title}
          </h1>
          <div className="mb-8 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/8 px-3 py-1.5 text-xs font-display tracking-widest uppercase text-orange-200/75">
              <Clock size={13} />
              {item.duration}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/8 px-3 py-1.5 text-xs font-display tracking-widest uppercase text-orange-200/75">
              <MapPin size={13} />
              {item.location}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="rounded-xl px-5 py-3 bg-white/[0.025] border border-white/10">
              <span className="block text-white/35 text-xs font-sans mb-1">
                {item.priceUnit === "couple" ? "Per couple (2 adults)" : "Per participant"}
              </span>
              <span className="font-display text-3xl text-forge-gradient">
                {price(item.priceCents)}
              </span>
            </div>
            <GlassButton href="#registration">View Sessions</GlassButton>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative aspect-[4/3] rounded-xl overflow-hidden border border-orange-400/[0.16] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        >
          {item.images[0] ? (
            <ResilientImage
              src={item.images[0].src}
              alt={item.images[0].alt}
              loading="eager"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-white/[0.025]">
              <Hammer size={48} className="text-orange-300/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        </motion.div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-start">
        <div className="space-y-8">
          <section className={panel}>
            <h2 className={`${heading} mb-6`}>About This Class</h2>
            <p className="text-white/60 font-sans leading-relaxed whitespace-pre-wrap">
              {item.description}
            </p>
          </section>
          {!!item.images.length && (
            <section className={panel}>
              <h2 className={`${heading} mb-6`}>Project Gallery</h2>
              <div className="grid grid-cols-2 gap-3">
                {item.images.map((image, i) => (
                  <figure key={`${image.src}-${i}`}>
                    <ResilientImage
                      src={image.src}
                      alt={image.alt}
                      loading="lazy"
                      className="w-full aspect-[4/3] rounded-lg object-cover border border-white/[0.08] bg-black/50"
                    />
                    <figcaption className="text-white/35 text-xs font-sans leading-relaxed mt-2">
                      {image.alt}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
          <section className={panel}>
            <h2 className={`${heading} mb-6`}>Before You Register</h2>
            <div className="text-white/50 font-sans text-sm leading-relaxed space-y-4">
              <p>
                {item.level === "Intermediate" || item.level === "Advanced"
                  ? `You must complete ${item.level === "Intermediate" ? "Beginner" : "Intermediate"} before taking this class. Use the same name and email as your earlier registration. D&S will verify completion and approve your request before sending an individual QuickBooks invoice. No account is needed.`
                  : "No prerequisite class is required. No account is needed."}
              </p>
              <p>
                Registration is currently for adults 18 and older. Each
                participant must register and sign for themselves, including
                both people attending a date night class.
              </p>
              {item.priceUnit === "couple" && <p>One payment covers two adults. The first person registers and shares their registration reference with their partner. The partner selects the same session and enters that reference below when signing their own waiver. Only the first person pays.</p>}
              <p>
                Submitting a request does not reserve a seat or collect payment.
                D&S will contact you to confirm availability and arrange
                payment.
              </p>
            </div>
          </section>
        </div>
        <aside id="registration" className={`${panel} scroll-mt-28`}>
          {receipt ? (
            <div role="status">
              <CheckCircle2 size={32} className="text-orange-400 mb-5" />
              <h2 className={`${heading} mb-5`}>Request Received</h2>
              <p className="text-white/55 font-sans text-sm leading-relaxed mb-4">
                Your registration and signed waiver have been saved. Your seat
                is pending review, and no payment has been collected.
              </p>
              <p className="text-white/40 font-sans text-sm leading-relaxed mb-5">
                D&S will contact you using the details you provided. Save your
                reference below. {catalog.preview ? "Sample previews do not send email." : "If you don’t receive an acknowledgment, contact D&S with this reference."}
              </p>
              <code className="block break-all text-orange-200/70 text-xs mb-6">
                {receipt}
              </code>
              <p className="text-white/60 text-sm mb-5">{copyEmailStatus === "sent" ? "Your signed copy has been submitted to our mail server for delivery. Check your inbox and spam folder." : "Your signed copy is saved. Email delivery is not confirmed; contact D&S for a copy if it does not arrive."}</p>
              {signingRole !== "observer" && item.priceUnit === "couple" && <p className="text-white/55 text-sm mb-5">{partnerReference.trim() ? "Your waiver is linked to your partner's registration. Do not make a second payment. D&S will verify the couple's payment and both registrations." : "Share this reference with your partner. They must select the same session, enter this reference, and sign their own waiver. Make only one payment for the two of you."}</p>}
              {paymentUrl && (
                <div className="mb-6 space-y-4">
                  <p className="text-white/55 text-sm">Continue to QuickBooks to pay. Check the class and amount before paying. D&S verifies payment and confirms your seat manually; opening this link does not confirm payment or reserve a seat.</p>
                  {catalog.preview && <p className="text-orange-300 text-sm">This is a real QuickBooks checkout link. Do not make a payment while testing this preview.</p>}
                  <GlassButton href={paymentUrl} target="_blank" rel="noopener noreferrer">Pay with QuickBooks</GlassButton>
                </div>
              )}
              <GlassButton href="/classes">Browse Classes</GlassButton>
            </div>
          ) : (
            <>
              <span className={eyebrow}>Join Us at the Forge</span>
              <h2 className={`${heading} mb-6`}>Choose Your Session</h2>
              {!catalog.waiver.enabled ? (
                <p className="text-white/50 font-sans leading-relaxed">
                  Registration will open once the class waiver is ready.{" "}
                  <Link href="/contact" className="text-orange-300/80">
                    Contact D&S for details.
                  </Link>
                </p>
              ) : !available.length ? (
                <p className="text-white/50 font-sans leading-relaxed">
                  No open sessions right now. Check back for new dates or{" "}
                  <Link href="/contact" className="text-orange-300/80">
                    contact D&S.
                  </Link>
                </p>
              ) : (
                <form onSubmit={submit} className="space-y-5">
                  {item.priceUnit === "couple" && <label className="block text-white/60 text-sm">Partner's registration reference (only if they already registered)<input className={field} value={partnerReference} maxLength={80} onChange={e => setPartnerReference(e.target.value)} placeholder="Leave blank if you are registering first" /><span className="block mt-2 text-xs">Use the same session as your partner. Entering their reference links your waiver and avoids a second payment.</span></label>}
                  <label className={label}>
                    Session
                    <select
                      required
                      value={sessionId}
                      onChange={(e) => setSessionId(e.target.value)}
                      className={field}
                    >
                      <option className="bg-background" value="">
                        Choose a date
                      </option>
                      {item.sessions.map((s) => (
                        <option
                          className="bg-background"
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
                  <label className={label}>
                    Your full name
                    <input
                      className={field}
                      name="name"
                      required
                      maxLength={150}
                      autoComplete="name"
                    />
                  </label>
                  <label className={label}>
                    Email
                    <input
                      className={field}
                      name="email"
                      type="email"
                      required
                      maxLength={254}
                      autoComplete="email"
                    />
                  </label>
                  <label className={label}>
                    {catalog.waiver.collectAdultDetails ? "Phone" : "Phone (optional)"}
                    <input
                      className={field}
                      name="phone"
                      required={catalog.waiver.collectAdultDetails}
                      type="tel"
                      maxLength={50}
                      autoComplete="tel"
                    />
                  </label>
                  {catalog.waiver.collectAdultDetails && <>
                    <p className="text-white/55 text-sm">Participant information required by the adult waiver. Your selected session supplies the class date and time, and your age is calculated from your date of birth.</p>
                    <label className={label}>Date of birth<input className={field} type="date" name="dateOfBirth" required /></label>
                    <label className={label}>Street address<input className={field} name="address" autoComplete="street-address" maxLength={300} required /></label>
                    <label className={label}>City, state, ZIP<input className={field} name="cityStateZip" maxLength={200} required /></label>
                    <label className={label}>Emergency contact name and phone<input className={field} name="emergencyContact" maxLength={300} required /></label>
                    {catalog.waiver.formKind === "adult-release-2026-11" ? <>
                      <label className={label}>Participant or observer<select className={field} name="role" required defaultValue="" onChange={e => { setSigningRole(e.target.value); if (e.target.value === "observer") setPartnerReference(""); }}><option value="" disabled>Choose one</option><option value="participant">Participant — I will work at the forge and anvil.</option><option value="observer">Observer — I will watch only, without handling tools or hot metal.</option></select><span className="block text-xs mt-2">Observation must be arranged with D&S. Observers receive no payment link and do not earn prerequisite class credit.</span></label>
                      <fieldset><legend className={label}>Is there anything about your health that the instructor should know to keep you safe?</legend><label className="block mt-2"><input type="radio" name="healthDisclosure" value="no" required /> No.</label><label className="block mt-2"><input type="radio" name="healthDisclosure" value="in_person" required /> Yes. I will tell the instructor in person before class begins.</label></fieldset>
                      <fieldset><legend className={label}>Photos (optional)</legend><label className="block mt-2"><input type="radio" name="photoPermission" value="yes" /> Yes. D&S may use photos and videos as described in section 8 below.</label><label className="block mt-2"><input type="radio" name="photoPermission" value="no" /> No. Please do not use photos or videos of me.</label><label className="block mt-2"><input type="radio" name="photoPermission" value="not_selected" defaultChecked /> Leave unanswered — no permission granted.</label></fieldset>
                    </> : <>
                    <label className={label}>Known allergies or medical conditions (write None if none)<textarea className={field} name="medicalConditions" maxLength={2000} required /></label>
                    <label className={label}>Current medications (write None if none)<textarea className={field} name="medications" maxLength={2000} required /></label>
                    </>}
                  </>}
                  <div hidden aria-hidden="true">
                    <input name="website" tabIndex={-1} autoComplete="off" />
                  </div>
                  <div className="border-t border-white/10 pt-6">
                    <h3 className="font-display text-xl uppercase tracking-wider text-white mb-2">
                      Participant Waiver
                    </h3>
                    <p className="text-xs text-white/35 font-sans mb-3">
                      Version {catalog.waiver.version}
                    </p>
                    <div
                      tabIndex={0}
                      className="whitespace-pre-wrap break-words rounded-lg bg-black/20 border border-white/10 p-4 text-white/55 text-sm font-sans leading-relaxed"
                    >
                      {catalog.waiver.text}
                    </div>
                  </div>
                  <label className={label}>
                    Electronic signature
                    <input
                      className={field}
                      name="signature"
                      required
                      maxLength={150}
                      placeholder="Type your full name exactly as above"
                    />
                  </label>
                  <label className="flex items-start gap-3 text-sm text-white/55 font-sans leading-relaxed">
                    <input
                      name="consent"
                      type="checkbox"
                      required
                      className="mt-1 size-4 shrink-0 accent-orange-500"
                    />
                    <span>{catalog.consentText}</span>
                  </label>
                  <p className="text-xs text-white/35 font-sans leading-relaxed">
                    Your participant details and signed waiver are stored privately for D&S to
                    manage your class registration. A full copy will be emailed to the address you enter.
                  </p>
                  <p className="rounded-lg border border-orange-500/15 bg-orange-500/[0.04] p-4 text-xs text-orange-200/65 font-sans leading-relaxed">
                    No payment is collected here. Your seat is only confirmed
                    after D&S reviews your request.
                  </p>
                  {error && (
                    <p role="alert" className="text-red-300/80 text-sm">
                      {error}
                    </p>
                  )}
                  <GlassButton
                    disabled={busy}
                    type="submit"
                    className="w-full disabled:opacity-50"
                  >
                    <span className="inline-flex items-center gap-2">
                      {busy ? "Sending…" : "Send Registration Request"}
                      <ArrowRight size={15} />
                    </span>
                  </GlassButton>
                </form>
              )}
            </>
          )}
        </aside>
      </div>
    </>
  );
}
