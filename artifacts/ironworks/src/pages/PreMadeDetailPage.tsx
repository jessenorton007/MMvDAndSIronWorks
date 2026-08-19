import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Phone, X } from 'lucide-react';
import { useLocation, useParams } from 'wouter';
import { Navigation } from '@/components/Navigation';
import { FloatingContactBanner } from '@/components/FloatingContactBanner';
import { FormattedDescription } from '@/components/FormattedDescription';
import { ResilientImage } from '@/components/ResilientImage';
import { Embers } from '@/components/Embers';
import { GlassButton } from '@/components/GlassButton';
import { PreMadePurchaseModal } from '@/components/PreMadePurchaseModal';
import { usePreMadeProducts } from '@/hooks/useAdminProducts';
import { getPreMadeItem as getFallbackPreMadeItem } from '@/data/premade-items';
import { useSeo } from '@/lib/seo';
import NotFound from './not-found';

export function PreMadeDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { products } = usePreMadeProducts();
  const item = products.find((product) => product.id === params.id);
  const fallbackItem = getFallbackPreMadeItem(params.id);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState<{ src: string; alt: string } | null>(null);
  const returnToPreMade = () => {
    window.location.assign('/#pre-made');
  };

  useSeo({
    title: item ? `${item.title} | D&S Iron Works Pre-Made Steel` : 'Pre-Made Steel Items | D&S Iron Works',
    description: item
      ? `${item.description} Available from D&S Iron Works for ${item.priceLabel}.`
      : 'Pre-built fire pits, Iron Rocket Stove, and Iron Rocket XL camp cooking stoves from D&S Iron Works.',
    path: item ? `/pre-made/${item.id}` : '/pre-made',
    image: item?.image,
    jsonLd: item
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: item.title,
          description: item.description,
          image: typeof window === 'undefined' ? item.image : `${window.location.origin}${item.image}`,
          brand: {
            '@type': 'Brand',
            name: 'D&S Iron Works',
          },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'USD',
            price: item.priceLabel.replace(/[$,]/g, ''),
          },
        }
      : undefined,
  });

  if (!item) return <NotFound />;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navigation />
      <FloatingContactBanner />
      <Embers />

      <main className="relative pt-28 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,77,0,0.06)_0%,transparent_62%)] pointer-events-none" />
        <div className="container mx-auto px-5 sm:px-6 md:px-12 relative z-10">
          <button
            onClick={returnToPreMade}
            className="flex items-center gap-2 text-white/35 hover:text-white transition-colors mb-10 group font-display tracking-wider text-sm uppercase"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
            Pre-Made Items
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-14 items-center mb-16">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
              <span className="text-xs font-display tracking-[0.3em] uppercase text-orange-400/70 block mb-4">
                {item.eyebrow}
              </span>
              <h1 className="font-display text-5xl md:text-7xl tracking-widest uppercase leading-none text-white mb-6">
                {item.title}
              </h1>
              <FormattedDescription
                text={item.description}
                className="text-white/60 font-sans font-light leading-relaxed text-lg max-w-xl mb-7 space-y-4"
              />
              <div className="mb-8 flex flex-wrap gap-2">
                {item.features.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full border border-orange-500/20 bg-orange-500/8 px-3 py-1.5 text-xs font-display tracking-widest uppercase text-orange-200/75"
                  >
                    {feature}
                  </span>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="rounded-xl px-5 py-3 bg-white/[0.025] border border-white/10">
                  <span className="block text-white/35 text-xs font-sans mb-1">Price</span>
                  <span className="font-display text-3xl text-forge-gradient">{item.priceLabel}</span>
                </div>
                <GlassButton onClick={() => setPurchaseOpen(true)}>
                  Start Purchase
                </GlassButton>
                <GlassButton href="tel:+14354219033" className="bg-white/3">
                  <Phone size={15} className="mr-2" />
                  Call Dallan
                </GlassButton>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative aspect-[4/3] rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(255,140,26,0.16)', boxShadow: '0 24px 80px rgba(0,0,0,0.45)' }}
            >
              <button
                type="button"
                onClick={() => setExpandedImage({ src: item.image, alt: item.alt })}
                className="h-full w-full cursor-zoom-in"
                aria-label={`Enlarge ${item.title} photo`}
              >
                <ResilientImage src={item.image} fallbackSrc={fallbackItem?.image} alt={item.alt} className="w-full h-full object-cover" />
              </button>
              <div className="absolute inset-0 bg-gradient-to-t from-black/52 via-transparent to-transparent pointer-events-none" />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12">
            <section
              className="rounded-xl p-6 sm:p-8"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-widest text-white mb-6">
                Details
              </h2>
              <div className="space-y-4">
                {item.features.map((feature) => (
                  <div key={feature} className="flex gap-3">
                    <CheckCircle size={17} className="text-orange-400 mt-0.5 shrink-0" />
                    <p className="text-white/60 font-sans leading-relaxed">{feature}</p>
                  </div>
                ))}
              </div>
              <p className="text-white/35 text-sm font-sans leading-relaxed mt-6">
                {item.availability}
              </p>
            </section>

            <section
              className="rounded-xl p-6 sm:p-8"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-widest text-white mb-6">
                Gallery
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {item.gallery.map((image, index) => (
                  <button
                    key={image.src}
                    type="button"
                    onClick={() => setExpandedImage(image)}
                    className="aspect-[4/3] rounded-lg overflow-hidden bg-black/50 cursor-zoom-in"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    aria-label={`Enlarge ${image.alt}`}
                  >
                    <ResilientImage src={image.src} fallbackSrc={fallbackItem?.gallery[index]?.src ?? fallbackItem?.gallery[0]?.src} alt={image.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </section>
          </div>

          {(item.video || item.videos?.length) && (
            <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
              {item.video && (
                <video
                  controls
                  muted
                  playsInline
                  preload="none"
                  poster={item.video.poster}
                  aria-label={item.video.label}
                  className="w-full aspect-video rounded-xl object-cover bg-black"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <source src={item.video.src} type="video/mp4" />
                </video>
              )}
              {item.videos?.map((video) => (
                <article key={video.src} className="rounded-xl overflow-hidden bg-white/[0.025]" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <video
                    controls
                    muted
                    playsInline
                    preload="none"
                    poster={video.poster}
                    aria-label={`${video.title} video`}
                    className={`w-full bg-black ${video.aspect === 'portrait' ? 'aspect-[9/16] max-h-[34rem] object-contain' : 'aspect-video object-cover'}`}
                  >
                    <source src={video.src} type="video/mp4" />
                  </video>
                  <div className="p-4">
                    <h3 className="font-display text-base uppercase tracking-wider text-white mb-1">{video.title}</h3>
                    <p className="text-white/45 text-sm font-sans leading-relaxed">{video.description}</p>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>

      <PreMadePurchaseModal
        item={item}
        isOpen={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
      />

      {expandedImage && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/88 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={expandedImage.alt}
          onClick={() => setExpandedImage(null)}
        >
          <button
            type="button"
            onClick={() => setExpandedImage(null)}
            className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/55 p-3 text-white/70 transition-colors hover:text-white"
            aria-label="Close enlarged image"
          >
            <X size={20} />
          </button>
          <img
            src={expandedImage.src}
            alt={expandedImage.alt}
            className="max-h-[88vh] max-w-[94vw] rounded-xl object-contain"
            style={{ boxShadow: '0 28px 90px rgba(0,0,0,0.7)' }}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
