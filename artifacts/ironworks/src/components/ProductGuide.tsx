import { Link } from 'wouter';
import { productGuides } from '@/data/product-guides';

export function ProductGuide({ id }: { id: string }) {
  const guide = productGuides[id];
  if (!guide) return null;
  return <section className="mt-12 space-y-10">
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
      <h2 className="font-display text-3xl uppercase tracking-widest mb-4">At a Glance</h2>
      <p className="text-white/60 leading-relaxed mb-6">{guide.summary}</p>
      <dl className="grid sm:grid-cols-2 gap-5">{guide.specs.map(spec => <div key={spec.label}><dt className="text-orange-300 font-display text-lg">{spec.label}</dt><dd className="text-white/65 mt-1">{spec.value}</dd></div>)}</dl>
      <p className="text-white/45 text-sm mt-6">Confirm the current build specifications and included components with Dallan before ordering.</p>
    </div>
    <div><h2 className="font-display text-3xl uppercase tracking-widest mb-6">Before You Order</h2>
      {guide.faqs.map(faq => <article key={faq.question} className="border-b border-white/10 py-5"><h3 className="font-display text-xl mb-3">{faq.question}</h3><p className="text-white/60 leading-relaxed max-w-4xl">{faq.answer}</p></article>)}
    </div>
    <nav aria-label="Related products and services" className="flex flex-wrap gap-5">{guide.related.map(link => <Link key={link.path} href={link.path} className="text-orange-300 underline underline-offset-4">{link.label}</Link>)}<Link href="/contact" className="text-orange-300 underline underline-offset-4" data-analytics-cta="product-question">Ask Dallan a question</Link></nav>
  </section>;
}
