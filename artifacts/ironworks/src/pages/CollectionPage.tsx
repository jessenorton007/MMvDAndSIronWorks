import { Link, useLocation } from 'wouter';
import { Navigation } from '@/components/Navigation';
import { FloatingContactBanner } from '@/components/FloatingContactBanner';
import { ResilientImage } from '@/components/ResilientImage';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useEtsyProducts, usePreMadeProducts } from '@/hooks/useAdminProducts';
import { collections, collectionSchema } from '@/lib/seo-structure';
import { useSeo } from '@/lib/seo';
import { productDescription } from '@/lib/product-seo';
export function CollectionPage() {
  const [location] = useLocation();
  const path = location === '/pre-made' ? '/pre-made' : '/shop';
  const premade = usePreMadeProducts(); const etsy = useEtsyProducts();
  const { products, loading, error } = path === '/pre-made' ? premade : etsy;
  const info = collections[path];
  useSeo({ enabled: !loading, image: products[0]?.image, title: info.title, description: info.description, path, jsonLd: collectionSchema(path, products) });
  return <div className="min-h-screen bg-background text-foreground"><Navigation /><FloatingContactBanner />
    <main className="container mx-auto max-w-7xl px-5 sm:px-8 pt-32 pb-24">
      <Breadcrumbs path={path} title={info.heading} />
      <p className="font-display text-orange-400 tracking-widest uppercase mb-3">D&S Iron Works</p>
      <h1 className="font-display text-4xl sm:text-6xl uppercase tracking-wide mb-6">{info.heading}</h1>
      <p className="text-white/65 leading-relaxed max-w-3xl mb-10">{info.intro}</p>
      {error && <p role="status" className="text-orange-200 mb-6">We could not refresh the latest listings. Confirm current details with Dallan before ordering.</p>}
      {loading && !products.length && <p role="status">Loading current products…</p>}
      {!loading && !products.length && <p>No products are listed right now. <Link href="/contact" className="text-orange-300 underline">Ask Dallan about availability.</Link></p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7 mb-14">{products.map((product, i) => <article key={product.id} className="rounded-xl overflow-hidden border border-white/10 bg-white/[0.025]">
        <Link href={`${path}/${product.id}`} className="block group">
          <ResilientImage src={product.image} alt={product.title} loading={i < 3 ? 'eager' : 'lazy'} sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" className="aspect-square w-full object-cover" />
          <div className="p-6"><h2 className="font-display text-2xl mb-3 group-hover:text-orange-300">{product.title}</h2>
          <p className="text-orange-300 font-display text-xl mb-3">{product.priceLabel}</p>
          <p className="text-sm text-white/60 leading-relaxed mb-4">{productDescription(product.description)}</p><span className="text-sm text-orange-300">View photos & details →</span></div>
        </Link>
      </article>)}</div>
      <section className="border border-white/10 rounded-xl p-6 sm:p-8"><h2 className="font-display text-3xl mb-4">{info.adviceTitle}</h2><p className="text-white/65 leading-relaxed max-w-3xl mb-5">{info.advice}</p>
        <div className="flex flex-wrap gap-5 text-orange-300"><Link href={info.relatedPath} className="underline">{info.relatedLabel}</Link><Link href="/contact" className="underline">Ask Dallan a question</Link></div>
      </section>
    </main>
  </div>;
}
