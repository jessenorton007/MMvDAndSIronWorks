import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLocation } from "wouter";
import { PocketKnife } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Embers } from "@/components/Embers";
import { GlassButton } from "@/components/GlassButton";
import { FormattedDescription } from "@/components/FormattedDescription";
import { ResilientImage } from "@/components/ResilientImage";
import { CheckoutModal } from "@/components/CheckoutModal";
import { PreMadePurchaseModal } from "@/components/PreMadePurchaseModal";
import { FloatingContactBanner } from "@/components/FloatingContactBanner";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useAdminServices, useEtsyProducts, usePremiumProducts, usePreMadeProducts } from "@/hooks/useAdminProducts";
import { PremiumProduct } from "@/data/premium-products";
import { PreMadeItem, preMadeItems as fallbackPreMadeItems } from "@/data/premade-items";
import { useSeo } from "@/lib/seo";

const processVideos = [
  {
    title: 'Maple Leaf Detail',
    description: 'A close shop view of the cut leaf form after heat work begins to bring out the final detail.',
    src: '/images/maple-leaf-detail.mp4',
    poster: '/images/maple-leaf-detail-poster.jpg',
    aspect: 'wide',
  },
  {
    title: 'Hammered to Shape',
    description: 'The red-hot maple leaf being refined by hand on the anvil while the steel is still moving.',
    src: '/images/hammering-maple-leaf.mp4',
    poster: '/images/hammering-maple-leaf-poster.jpg',
    aspect: 'wide',
  },
  {
    title: 'Red-Hot Treble Clef',
    description: 'A custom treble clef form glowing on the anvil before the final shaping and finish work.',
    src: '/images/red-hot-treble-clef-forging.mp4',
    poster: '/images/red-hot-treble-clef-poster.jpg',
    aspect: 'portrait',
  },
  {
    title: 'Plasma-Cut Detail',
    description: 'Shop-floor cutting work that turns raw plate into clean custom ironwork components.',
    src: '/images/plasma-cutting-process.mp4',
    poster: '/images/plasma-cutting-poster.jpg',
    aspect: 'portrait',
  },
  {
    title: 'Plasma Sparks',
    description: 'A short cut sequence showing the torch working through steel plate for custom metal art.',
    src: '/images/plasma-sparks-cutting.mp4',
    poster: '/images/plasma-sparks-poster.jpg',
    aspect: 'wide',
  },
] as const;

type ProcessVideo = (typeof processVideos)[number];

const featuredProcessVideo = processVideos[0];
const portraitProcessVideos = processVideos.filter((video) => video.aspect === 'portrait');
const secondaryLandscapeVideos = processVideos.filter((video) => video.aspect === 'wide' && video.title !== featuredProcessVideo.title);

function ProcessVideoCard({
  video,
  delay = 0,
  compact = false,
  featured = false,
}: {
  video: ProcessVideo;
  delay?: number;
  compact?: boolean;
  featured?: boolean;
}) {
  const videoFrameClass = video.aspect === 'portrait'
    ? compact ? 'aspect-[9/16] max-h-[28rem]' : 'aspect-[9/16] max-h-[32rem]'
    : 'aspect-video';

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay }}
      className={`snap-center rounded-xl overflow-hidden bg-white/[0.025] ${featured ? 'shadow-[0_22px_70px_rgba(0,0,0,0.38)]' : ''}`}
      style={{ border: '1px solid rgba(255,255,255,0.09)' }}
    >
      <div className="relative bg-black">
        <video
          controls
          muted
          playsInline
          preload="none"
          poster={video.poster}
          aria-label={`${video.title} forge process video`}
          className={`w-full object-cover ${videoFrameClass}`}
        >
          <source src={video.src} type="video/mp4" />
        </video>
      </div>
      <div className={compact ? 'p-4' : 'p-4 sm:p-5'}>
        <h3 className="font-display text-base sm:text-lg uppercase tracking-wider text-white mb-1">
          {video.title}
        </h3>
        <p className={`text-white/50 text-sm font-sans leading-relaxed ${compact ? 'line-clamp-2' : ''}`}>
          {video.description}
        </p>
      </div>
    </motion.article>
  );
}

function PreMadeVideoTile({
  video,
  compact = false,
}: {
  video: NonNullable<PreMadeItem['videos']>[number];
  compact?: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-xl bg-white/[0.025]" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="bg-black">
        <video
          controls
          muted
          playsInline
          preload="none"
          poster={video.poster}
          aria-label={`${video.title} video`}
          className={`w-full bg-black ${video.aspect === 'portrait' ? 'aspect-[9/16] max-h-[70vh] object-contain' : 'aspect-video object-cover'}`}
        >
          <source src={video.src} type="video/mp4" />
        </video>
      </div>
      <div className={compact ? 'p-3' : 'p-4'}>
        <h4 className="font-display text-sm uppercase tracking-wider text-white mb-1">{video.title}</h4>
        <p className="text-white/45 text-xs font-sans leading-relaxed">{video.description}</p>
      </div>
    </article>
  );
}

function PreMadeItemCard({
  item,
  delay,
  onPurchase,
  onDetails,
}: {
  item: PreMadeItem;
  delay: number;
  onPurchase: () => void;
  onDetails: () => void;
}) {
  const isFirePit = item.id === 'pre-built-fire-pits';
  const fallbackItem = fallbackPreMadeItems.find(candidate => candidate.id === item.id);

  if (isFirePit) {
    return (
      <motion.article
        key={item.id}
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ delay }}
        className="group rounded-2xl overflow-hidden bg-white/[0.025] lg:col-span-2"
        style={{ border: '1px solid rgba(255,255,255,0.09)' }}
      >
        <div className="grid lg:grid-cols-[minmax(0,1.22fr)_minmax(22rem,0.78fr)] gap-0">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="relative aspect-[16/10] min-h-[18rem] rounded-xl overflow-hidden bg-black mb-4" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <ResilientImage
                src={item.image}
                fallbackSrc={fallbackItem?.image}
                alt={item.alt}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/10 to-transparent" />
              <div className="absolute left-5 bottom-5 right-5">
                <span className="text-[10px] font-display tracking-[0.28em] uppercase text-orange-300/80 block mb-2">
                  {item.eyebrow}
                </span>
                <h3 className="font-display text-2xl sm:text-4xl uppercase tracking-widest text-white">
                  {item.title}
                </h3>
              </div>
            </div>

            {item.videos && (
              <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(13rem,0.48fr)] gap-4">
                {item.videos.map((video, index) => (
                  <PreMadeVideoTile key={video.src} video={video} compact={index > 0} />
                ))}
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6 lg:p-8 flex flex-col gap-5 bg-black/10 lg:border-l border-white/10">
            <div>
              <span className="text-[10px] font-display tracking-[0.28em] uppercase text-orange-300/75 block mb-2">
                Portable Fire Pit Gallery
              </span>
              <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-widest text-white mb-3">
                Pack-Flat Deer Panel Fire Pit
              </h3>
              <FormattedDescription
                text={`${item.description}\n\nThe panel design packs down for transport, then locks into a sturdy outdoor fire pit with deer cutout details on each side.`}
                className="text-white/58 text-sm font-sans leading-relaxed space-y-3"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {item.gallery.map((image, index) => (
                <div key={image.src} className="aspect-[4/3] rounded-lg overflow-hidden bg-black/50" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <ResilientImage src={image.src} fallbackSrc={fallbackItem?.gallery[index]?.src ?? fallbackItem?.gallery[0]?.src} alt={image.alt} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {item.features.map((feature) => (
                <span key={feature} className="rounded-full px-3 py-1 text-[10px] font-display tracking-widest uppercase text-white/50 bg-white/[0.035] border border-white/10">
                  {feature}
                </span>
              ))}
            </div>

            <div className="mt-auto pt-3">
              <div className="mb-4 flex items-end justify-between gap-4 border-t border-white/10 pt-4">
                <span className="text-white/35 text-xs font-sans">Price</span>
                <span className="font-display text-xl tracking-wider text-forge-gradient text-right">{item.priceLabel}</span>
              </div>
              <p className="text-white/35 text-xs font-sans mb-4">{item.availability}</p>
              <div className="flex flex-wrap gap-3">
                <GlassButton onClick={onDetails} className="text-sm px-5 py-2.5 bg-white/3">
                  View Details
                </GlassButton>
                <GlassButton onClick={onPurchase} className="text-sm px-5 py-2.5">
                  Start Purchase
                </GlassButton>
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      key={item.id}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay }}
      className="group rounded-2xl overflow-hidden bg-white/[0.025]"
      style={{ border: '1px solid rgba(255,255,255,0.09)' }}
    >
      <div className="grid sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)] gap-0">
        <div className="relative min-h-[18rem] sm:min-h-[24rem] overflow-hidden bg-black">
          <ResilientImage
            src={item.image}
            fallbackSrc={fallbackItem?.image}
            alt={item.alt}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute left-5 bottom-5 right-5">
            <span className="text-[10px] font-display tracking-[0.28em] uppercase text-orange-300/80 block mb-2">
              {item.eyebrow}
            </span>
            <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-widest text-white">
              {item.title}
            </h3>
          </div>
        </div>
        <div className="p-5 sm:p-6 flex flex-col gap-5">
          <FormattedDescription
            text={item.description}
            className="text-white/58 text-sm font-sans leading-relaxed space-y-3"
          />
          <div className="grid grid-cols-2 gap-3">
            {item.gallery.map((image, index) => (
              <div key={image.src} className="aspect-[4/3] rounded-lg overflow-hidden bg-black/50" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <ResilientImage src={image.src} fallbackSrc={fallbackItem?.gallery[index]?.src ?? fallbackItem?.gallery[0]?.src} alt={image.alt} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          {item.video && (
            <video
              controls
              muted
              playsInline
              preload="none"
              poster={item.video.poster}
              aria-label={item.video.label}
              className="w-full aspect-video rounded-lg object-cover bg-black"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <source src={item.video.src} type="video/mp4" />
            </video>
          )}
          <div className="flex flex-wrap gap-2">
            {item.features.map((feature) => (
              <span key={feature} className="rounded-full px-3 py-1 text-[10px] font-display tracking-widest uppercase text-white/50 bg-white/[0.035] border border-white/10">
                {feature}
              </span>
            ))}
          </div>
          <div className="mt-auto pt-1">
            <div className="mb-4 flex items-end justify-between gap-4 border-t border-white/10 pt-4">
              <span className="text-white/35 text-xs font-sans">Price</span>
              <span className="font-display text-xl tracking-wider text-forge-gradient text-right">{item.priceLabel}</span>
            </div>
            <p className="text-white/35 text-xs font-sans mb-4">{item.availability}</p>
            <div className="flex flex-wrap gap-3">
              <GlassButton onClick={onDetails} className="text-sm px-5 py-2.5 bg-white/3">
                View Details
              </GlassButton>
              <GlassButton onClick={onPurchase} className="text-sm px-5 py-2.5">
                Start Purchase
              </GlassButton>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function Home() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.22], [1, 1.06]);
  const [checkoutProduct, setCheckoutProduct] = useState<PremiumProduct | null>(null);
  const [purchaseItem, setPurchaseItem] = useState<PreMadeItem | null>(null);
  const [, navigate] = useLocation();

  const { products: etsyProducts } = useEtsyProducts();
  const { products: premiumProducts } = usePremiumProducts();
  const { products: preMadeProducts } = usePreMadeProducts();
  const { services: adminServices } = useAdminServices();

  const serviceBySlug = (slug: string) => adminServices.find((service) => service.slug === slug);
  const customDesignCards = [
    {
      fallbackSrc: '/images/custom-sign-bealer.jpg',
      label: 'Custom Signs & Art',
      alt: 'Custom metal sign by D&S Iron Works',
      desc: 'Personalized metal signs, address plaques, and custom cut artwork for home and ranch',
      slug: 'custom-metal-signs',
    },
    {
      fallbackSrc: '/images/tree-of-life.jpg',
      label: 'Forged Art & Décor',
      alt: 'Tree of Life forged iron sculpture',
      desc: 'Tree of life sculptures, candelabras, hooks, bells, and one-of-a-kind decorative ironwork',
      slug: 'forged-metal-art',
    },
    {
      fallbackSrc: '/images/client-upload-railings/railing-install-main.jpg',
      label: 'Forged Railings',
      alt: 'Hand-forged stair railing example',
      desc: 'Stair railings, balcony guards, and interior handrails — all hand-forged',
      slug: 'forged-railings',
    },
    {
      fallbackSrc: '/images/fire-pit-real.jpg',
      label: 'Fire Pits',
      alt: 'Custom fire pit with metal cutout design',
      desc: 'Outdoor fire pits with custom cutout designs — CNC plasma or hand-forged',
      slug: 'custom-fire-pits',
    },
    {
      fallbackSrc: '',
      label: 'Hand-Forged Knives',
      alt: 'Hand-forged knives by D&S Iron Works',
      desc: 'Custom knife and blade commissions planned directly with Dallan',
      slug: 'hand-forged-knives',
    },
  ].map((card) => {
    const service = serviceBySlug(card.slug);
    return {
      ...card,
      src: service?.heroImage ?? card.fallbackSrc,
      label: service?.shortTitle ?? card.label,
      desc: service?.summary ?? card.desc,
    };
  });

  useSeo({
    title: 'D&S Iron Works | Custom Ironwork, Fire Pits & Iron Rocket Stoves in Utah',
    description: 'D&S Iron Works by Dallan Goff creates custom ironwork, pre-built fire pits, Iron Rocket Stove and Iron Rocket XL camp cooking stoves, metal signs, forged railings, sculptural ironwork, and hand-forged goods in Utah.',
    path: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'D&S Iron Works',
      description: 'Custom ironwork, forged metal art, pre-built fire pits, Iron Rocket Stove and Iron Rocket XL camp cooking stoves, railings, signs, sculptures, and hand-forged goods by Dallan Goff.',
      image: typeof window === 'undefined' ? '/opengraph.jpg' : `${window.location.origin}/opengraph.jpg`,
      telephone: '+1-435-421-9033',
      email: 'dandsiron@yahoo.com',
      areaServed: 'Utah',
      sameAs: ['https://www.facebook.com/DallanGoffBlacksmith', 'https://www.etsy.com/shop/dandsironworks'],
    },
  });

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden">
      <Navigation />
      <Embers />
      <FloatingContactBanner />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section id="hero" className="relative h-screen flex items-center overflow-hidden">
        <motion.div
          className="absolute inset-0 z-0"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          {/* Subtle overlays — reduced from before so the forge shines through */}
          <div className="absolute inset-0 bg-[#0d0a07]/55 md:bg-[#0d0a07]/40 z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/20 md:from-black/75 md:via-black/30 md:to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/15 to-black/85 md:from-black/40 md:via-transparent md:to-black/70 z-10" />

          {/* Forging video background — loops silently */}
          <img
            src="/images/mobile-hero-iron-table.jpg"
            alt=""
            className="md:hidden w-full h-full object-cover object-center"
            aria-hidden="true"
          />
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/images/hero-bg.png"
            className="hidden md:block w-full h-full object-cover object-center"
            aria-hidden="true"
          >
            <source src="/images/forging-hero.mp4" type="video/mp4" />
            {/* Fallback static image if video fails */}
            <img src="/images/hero-bg.png" alt="Forge interior" className="w-full h-full object-cover" />
          </video>
        </motion.div>

        <div className="relative z-10 container mx-auto px-5 sm:px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mb-3"
            >
              <span className="text-xs font-display tracking-[0.3em] uppercase text-orange-400/90">
                D &amp; S Iron Works — Dallan Goff
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.25 }}
              className="font-display text-6xl md:text-7xl lg:text-8xl tracking-widest uppercase text-white leading-none mb-6"
            >
              Custom<br />
              <span className="text-forge-gradient" style={{ textShadow: '0 0 48px rgba(255,77,0,0.55)', filter: 'drop-shadow(0 0 24px rgba(255,100,0,0.5))' }}>Ironwork</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.45 }}
              className="text-white/70 text-lg leading-relaxed mb-10 font-sans font-light max-w-md"
            >
              Bespoke metal craft, custom fireplaces, forged art, and one-of-a-kind ironwork.
              Raw, honest, built to last generations.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.65 }}
              className="flex flex-wrap gap-4"
            >
              <motion.button
                onClick={() => scrollTo('custom-designs')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative inline-flex items-center justify-center px-8 py-4 rounded-full font-display font-medium text-base uppercase tracking-wider text-white overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #FF4D00 0%, #FF8C1A 55%, #FFB347 100%)',
                  boxShadow: '0 4px 28px rgba(255,77,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                <span className="relative z-10">View Custom Work</span>
                <div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-colors rounded-full" />
              </motion.button>
              <GlassButton onClick={() => scrollTo('pre-made')} className="bg-white/3">
                Pre-Made Items
              </GlassButton>
            </motion.div>
          </div>

          {/* Right side floating portfolio cards — desktop only */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="hidden lg:flex flex-col items-end gap-4"
          >
            <div
              className="relative w-64 h-64 rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(255,140,26,0.2)', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
            >
              <img src="/images/custom-sign-bealer.jpg" alt="Custom Metal Signs" className="w-full h-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-3 left-3 text-xs font-display tracking-widest uppercase text-white/80">Custom Signs & Art</div>
            </div>
            <div
              className="relative w-48 h-48 rounded-2xl overflow-hidden self-start ml-12"
              style={{ border: '1px solid rgba(255,140,26,0.15)', boxShadow: '0 16px 60px rgba(0,0,0,0.4)' }}
            >
              <img src="/images/tree-of-life.jpg" alt="Tree of Life Iron Sculpture" className="w-full h-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
              <div className="absolute bottom-3 left-3 text-xs font-display tracking-widest uppercase text-white/80">Forged Art</div>
            </div>
            <div
              className="relative w-56 h-40 rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(255,140,26,0.12)', boxShadow: '0 12px 48px rgba(0,0,0,0.4)' }}
            >
              <img src="/images/fire-pit-real.jpg" alt="Custom Fire Pit" className="w-full h-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
              <div className="absolute bottom-3 left-3 text-xs font-display tracking-widest uppercase text-white/80">Fire Pits</div>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            onClick={() => scrollTo('custom-designs')}
            className="flex flex-col items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
          >
            <span className="text-xs font-display tracking-widest uppercase">Scroll</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              className="w-px h-8 bg-gradient-to-b from-white/50 to-transparent"
            />
          </motion.button>
        </div>
      </section>

      {/* ── CUSTOM DESIGNS ───────────────────────────────────────────── */}
      <section id="custom-designs" className="relative py-24 sm:py-32 z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
        <div className="container mx-auto px-5 sm:px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
            <div>
              <span className="text-xs font-display tracking-[0.3em] uppercase text-orange-400/70 block mb-3">
                The Heart of the Shop
              </span>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-widest uppercase leading-none">
                <span className="text-forge-gradient">Custom</span><br />Ironwork
              </h2>
            </div>
            <p className="text-white/55 max-w-sm font-sans font-light leading-relaxed">
              Custom fireplaces, fire pits, personalized metalwork signs, and sculptural ironwork.
              Each piece is honest, heavy, and built for generations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 mb-16">
            {customDesignCards.map((item, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: i * 0.1 }}
                onClick={() => navigate(`/services/${item.slug}`)}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl text-left"
                style={{ border: '1px solid rgba(255,255,255,0.09)' }}
              >
                {item.src ? (
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[linear-gradient(135deg,rgba(255,140,26,0.18),rgba(255,255,255,0.035)_45%,rgba(0,0,0,0.45))]">
                    <PocketKnife size={42} className="text-orange-300/70" strokeWidth={1.4} />
                    <span className="font-display text-sm uppercase tracking-[0.28em] text-white/55">
                      Custom Blade Commissions
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="font-display text-lg sm:text-xl uppercase tracking-wider text-white mb-1">{item.label}</h3>
                  <p className="text-white/55 text-sm font-sans opacity-0 group-hover:opacity-100 transition-opacity duration-300 leading-snug">{item.desc}</p>
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: 'inset 0 0 0 1px rgba(255,140,26,0.25)' }} />
              </motion.button>
            ))}
          </div>

          <div className="mb-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-7">
              <div>
                <span className="text-xs font-display tracking-[0.3em] uppercase text-orange-400/70 block mb-3">
                  Services
                </span>
                <h3 className="font-display text-3xl sm:text-4xl tracking-widest uppercase text-white">
                  Custom Metalwork Categories
                </h3>
              </div>
              <GlassButton onClick={() => navigate('/services')} className="self-start md:self-auto text-sm px-6 py-2.5">
                View All Services
              </GlassButton>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {adminServices.map((service) => (
                <button
                  key={service.slug}
                  onClick={() => navigate(`/services/${service.slug}`)}
                  className="group rounded-xl p-4 sm:p-5 text-left bg-white/[0.025] hover:bg-white/[0.04] transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span className="text-[10px] font-display tracking-[0.24em] uppercase text-orange-400/55 block mb-2">
                    {service.eyebrow}
                  </span>
                  <h4 className="font-display text-base sm:text-lg uppercase tracking-wider text-white group-hover:text-orange-100 transition-colors">
                    {service.shortTitle}
                  </h4>
                </button>
              ))}
            </div>
          </div>

          {/* Featured piece — custom iron table */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-6 mb-16 rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,140,26,0.14)', background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="sm:w-72 h-64 sm:h-auto flex-shrink-0 overflow-hidden">
              <img
                src="/images/iron-table.jpg"
                alt="Custom hand-forged iron table"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <span className="text-xs font-display tracking-[0.3em] uppercase text-orange-400/70 mb-2">Signature Craft</span>
              <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-widest text-white mb-3">
                Custom Iron<br />Furniture & Tables
              </h3>
              <p className="text-white/55 font-sans font-light leading-relaxed mb-5 max-w-md">
                Hand-forged twisted-leg iron tables with CNC cut tops — built in the shop from raw steel. Every weld, every twist, done by hand.
              </p>
              <GlassButton onClick={() => navigate('/contact')} className="self-start text-sm px-6 py-2.5">
                Commission a Piece
              </GlassButton>
            </div>
          </motion.div>

          {/* Commission CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl px-6 sm:px-8 py-10 sm:py-14 md:px-16 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,77,0,0.07) 0%, rgba(14,10,6,0.8) 60%)',
              border: '1px solid rgba(255,140,26,0.2)',
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,77,0,0.14),transparent_60%)] pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="max-w-xl">
                <h3 className="font-display text-2xl sm:text-3xl md:text-4xl tracking-widest uppercase text-white mb-3">
                  Commission a Piece
                </h3>
                <p className="text-white/60 font-sans font-light leading-relaxed">
                  Bring your idea, a photo, a sketch, or just a feeling — we'll build it.
                  Every commission starts with a direct call with Dallan.
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <p className="text-xs font-display tracking-widest uppercase text-orange-400/60">
                  Talk to Dallan directly
                </p>
                <div className="text-2xl font-display tracking-wider text-white">(435) 421-9033</div>
                <p className="text-xs text-white/35 font-sans">Call or text — goes straight to the forge</p>
                <GlassButton onClick={() => navigate('/contact')} className="text-sm px-6 py-2.5 mt-2">
                  Send a Message
                </GlassButton>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PRE-MADE ITEMS ───────────────────────────────────────────── */}
      <section id="pre-made" className="relative py-20 sm:py-28 z-10 border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,77,0,0.06),transparent_58%)] pointer-events-none" />
        <div className="container mx-auto px-5 sm:px-6 md:px-12 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10 sm:mb-12">
            <div>
              <span className="text-xs font-display tracking-[0.3em] uppercase text-orange-400/70 block mb-3">
                Built Ahead
              </span>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-widest uppercase leading-none">
                Pre-Made <span className="text-forge-gradient">Items</span>
              </h2>
            </div>
            <p className="text-white/55 max-w-md font-sans font-light leading-relaxed">
              Small-batch ready-built fire pits, Iron Rocket Stoves, and Iron Rocket XL stoves. Same shop-built steel work, faster path to pickup or delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {preMadeProducts.map((item, i) => (
              <PreMadeItemCard
                key={item.id}
                item={item}
                delay={i * 0.08}
                onPurchase={() => setPurchaseItem(item)}
                onDetails={() => navigate(`/pre-made/${item.id}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── SHOP PROCESS ─────────────────────────────────────────────── */}
      <section id="process" className="relative py-20 sm:py-24 z-10 border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,77,0,0.05),transparent_55%)] pointer-events-none" />
        <div className="container mx-auto px-5 sm:px-6 md:px-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10 sm:mb-12">
            <div>
              <span className="text-xs font-display tracking-[0.3em] uppercase text-orange-400/70 block mb-3">
                Forged in Motion
              </span>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-widest uppercase leading-none mb-5">
                From <span className="text-forge-gradient">Detail</span><br />to Form
              </h2>
            </div>
            <p className="text-white/55 max-w-md font-sans font-light leading-relaxed">
              A focused look at the shop process: cut steel, hand shaping, and the details behind custom metal art.
            </p>
          </div>

          <div className="hidden lg:grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-5 items-start">
            <div className="grid grid-cols-2 gap-5 pt-14">
              {portraitProcessVideos.map((video, i) => (
                <ProcessVideoCard
                  key={video.title}
                  video={video}
                  delay={i * 0.06}
                  compact
                />
              ))}
            </div>
            <div className="grid gap-5">
              <ProcessVideoCard video={featuredProcessVideo} featured />
              <div className="grid grid-cols-2 gap-5">
                {secondaryLandscapeVideos.map((video, i) => (
                  <ProcessVideoCard
                    key={video.title}
                    video={video}
                    delay={0.12 + i * 0.06}
                    compact
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="relative lg:hidden">
            <Carousel opts={{ align: 'center', loop: true }} className="w-full" aria-label="Forge process videos">
              <CarouselContent className="ml-0 items-start">
                {processVideos.map((video, i) => (
                  <CarouselItem key={video.title} className="basis-full pl-0">
                    <div className="px-1">
                      <ProcessVideoCard video={video} delay={i * 0.04} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="inline-flex left-2 top-[34%] h-10 w-10 border-white/15 bg-black/70 text-white hover:bg-black/85 hover:text-white disabled:opacity-35" />
              <CarouselNext className="inline-flex right-2 top-[34%] h-10 w-10 border-white/15 bg-black/70 text-white hover:bg-black/85 hover:text-white disabled:opacity-35" />
            </Carousel>
            <div className="mt-4 flex justify-center gap-1.5" aria-hidden="true">
              {processVideos.map((video) => (
                <span key={video.title} className="h-1.5 w-6 rounded-full bg-white/15" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PREMIUM SIGNATURE PIECES ─────────────────────────────────── */}
      <section id="premium" className="relative py-24 sm:py-32 z-10 border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,77,0,0.04)_0%,transparent_65%)] pointer-events-none" />
        <div className="container mx-auto px-5 sm:px-6 md:px-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-xs font-display tracking-[0.3em] uppercase text-orange-400/70 block mb-3">Available by Inquiry</span>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-widest uppercase leading-none">
                Signature <span className="text-forge-gradient">Pieces</span>
              </h2>
            </div>
            <p className="text-white/55 max-w-sm font-sans font-light">
              High-end works available now — contact for pricing and shipping.
            </p>
          </div>

          {premiumProducts.length === 0 ? (
            <div className="rounded-xl flex flex-col items-center justify-center py-24 gap-4"
              style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
              <p className="text-white/25 font-display uppercase tracking-widest text-sm">Signature pieces coming soon</p>
              <p className="text-white/15 text-xs font-sans">Add pieces via the admin panel</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {premiumProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group flex flex-col rounded-xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)', transition: 'border-color 0.3s, box-shadow 0.3s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,140,26,0.22)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 48px rgba(255,77,0,0.1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.09)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img src={product.image} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.35)] pointer-events-none" />
                  </div>
                  <div className="p-5 sm:p-7 flex flex-col flex-1">
                    <h3 className="font-display text-lg sm:text-xl uppercase tracking-wider text-white mb-2">{product.title}</h3>
                    <FormattedDescription
                      text={product.description}
                      className="text-white/55 text-sm mb-6 flex-1 font-sans leading-relaxed space-y-3"
                    />
                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-display text-xl sm:text-2xl tracking-wider text-forge-gradient">{product.priceLabel}</span>
                      <GlassButton onClick={() => setCheckoutProduct(product)} className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm">Inquire</GlassButton>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── ETSY SHOP ────────────────────────────────────────────────── */}
      <section id="shop" className="relative py-24 sm:py-32 z-10 border-t border-white/5">
        <div className="container mx-auto px-5 sm:px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-display tracking-[0.3em] uppercase text-orange-400/70 block mb-3">Hand-Forged Goods</span>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-widest uppercase leading-none">
                Forge <span className="text-forge-gradient">Shop</span>
              </h2>
            </div>
            <div className="flex flex-col gap-2 items-start md:items-end">
              <p className="text-white/50 max-w-xs font-sans font-light text-sm leading-relaxed">
                Small-batch iron jewelry, hooks, fire tools, and home accents.
              </p>
              <a
                href="https://www.etsy.com/shop/dandsironworks"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link text-sm font-display tracking-widest uppercase"
              >
                View Full Etsy Shop →
              </a>
            </div>
          </div>

          {etsyProducts.length === 0 ? (
            <div className="rounded-xl flex flex-col items-center justify-center py-24 gap-4"
              style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
              <p className="text-white/25 font-display uppercase tracking-widest text-sm">Shop products coming soon</p>
              <a href="https://www.etsy.com/shop/dandsironworks" target="_blank" rel="noopener noreferrer" className="nav-link text-xs font-display tracking-widest uppercase">
                Visit our Etsy shop →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {etsyProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/shop/${product.id}`)}
                >
                  <div
                    className="aspect-square mb-3 overflow-hidden rounded-xl relative"
                    style={{ border: '1px solid rgba(255,255,255,0.09)', transition: 'border-color 0.3s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,140,26,0.28)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.09)'}
                  >
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100"
                      style={{ transition: 'transform 0.5s ease, opacity 0.3s ease' }}
                    />
                    {product.badge && (
                      <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 bg-black/75 backdrop-blur-sm text-orange-400 text-[9px] sm:text-[10px] font-display tracking-widest uppercase px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-orange-500/30 pointer-events-none">
                        {product.badge}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center backdrop-blur-[2px]">
                      <span className="font-display text-sm uppercase tracking-widest text-white border border-white/30 rounded-full px-5 py-2.5 bg-white/5">
                        View Details
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display tracking-wider uppercase text-white/85 group-hover:text-white transition-colors text-xs sm:text-sm leading-snug">{product.title}</h3>
                    <p className="text-orange-400/75 mt-1 font-sans text-sm">{product.priceLabel}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer id="contact" className="border-t border-white/8 py-14 sm:py-16 relative overflow-hidden"
        style={{ background: 'rgba(10,7,4,0.97)' }}>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-orange-600/8 blur-[120px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-5 sm:px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 mb-12">
            <div className="flex flex-col items-start">
              <img src="/brand/logo.png" alt="D&S Iron Works" className="h-12 sm:h-14 mb-4" style={{ filter: 'invert(1) brightness(0.7)' }} />
              <p className="text-white/35 text-sm font-sans leading-relaxed max-w-xs">
                D &amp; S Iron Works by Dallan Goff creates custom ironwork, forged railings,
                fire pits, signs, sculptures, and hand-forged goods in Utah.
              </p>
            </div>
            <div>
              <h4 className="font-display text-xs tracking-[0.3em] uppercase text-orange-400/60 mb-5">Contact</h4>
              <div className="space-y-3">
                <a href="tel:+14354219033" className="block text-white/55 hover:text-white transition-colors font-sans text-sm">(435) 421-9033</a>
                <a href="mailto:dandsiron@yahoo.com" className="block text-white/55 hover:text-white transition-colors font-sans text-sm">dandsiron@yahoo.com</a>
                <a href="https://www.facebook.com/DallanGoffBlacksmith" target="_blank" rel="noopener noreferrer" className="block text-white/55 hover:text-white transition-colors font-sans text-sm">@DallanGoffBlacksmith</a>
              </div>
            </div>
            <div>
              <h4 className="font-display text-xs tracking-[0.3em] uppercase text-orange-400/60 mb-5">Navigate</h4>
              <div className="space-y-3">
                {[
                  { label: 'Custom Designs', id: 'custom-designs' },
                  { label: 'Pre-Made Items', id: 'pre-made' },
                  { label: 'Signature Pieces', id: 'premium' },
                  { label: 'Forge Shop', id: 'shop' },
                ].map(({ label, id }) => (
                  <button key={id} onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
                    className="nav-link block text-sm font-display tracking-widest uppercase">{label}</button>
                ))}
                <button onClick={() => navigate('/services')} className="nav-link block text-sm font-display tracking-widest uppercase">Services</button>
                <button onClick={() => navigate('/contact')} className="nav-link block text-sm font-display tracking-widest uppercase">Contact</button>
              </div>
            </div>
          </div>
          <div className="border-t border-white/6 pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-white/20 text-xs font-sans">
              © {new Date().getFullYear()} D &amp; S Iron Works. All rights reserved.
            </p>
            <a
              href="https://www.etsy.com/shop/dandsironworks"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/25 hover:text-orange-400/60 text-xs font-display tracking-widest uppercase transition-colors"
            >
              Etsy Shop →
            </a>
          </div>
          {/* Agency credit — floating pill */}
          <div className="mt-10 flex justify-center">
            <div className="relative">
              {/* Ambient glow layer behind the pill */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(255,100,20,0.13) 0%, transparent 72%)',
                  transform: 'scaleX(1.6) scaleY(2.2)',
                  filter: 'blur(18px)',
                }}
              />
              <div
                className="relative flex items-center gap-2 px-6 py-2.5 rounded-full text-center"
                style={{
                  background: 'rgba(18,12,8,0.70)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255,120,30,0.18)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.04) inset, 0 8px 40px rgba(255,70,0,0.10), 0 1px 0 rgba(255,255,255,0.06) inset',
                }}
              >
                {/* Inner top highlight */}
                <div
                  className="absolute top-0 left-1/4 right-1/4 h-px rounded-full pointer-events-none"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}
                />
                {/* Subtle inner warm glow */}
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at 40% 0%, rgba(255,90,0,0.07) 0%, transparent 60%)' }}
                />
                <span
                  className="relative text-[11px] font-sans tracking-wide whitespace-nowrap"
                  style={{ color: 'rgba(255,255,255,0.32)', letterSpacing: '0.04em' }}
                >
                  Proudly designed by{' '}
                  <a
                    href="https://mojavemarketingllc.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-orange-300"
                    style={{ color: 'rgba(255,175,100,0.75)' }}
                  >
                    Mojave Marketing
                  </a>
                  {' '}in partnership with{' '}
                  <a
                    href="https://surrealmarketingservices.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'rgba(255,175,100,0.75)', textDecoration: 'underline', textDecorationColor: 'rgba(255,140,50,0.30)', textUnderlineOffset: '3px', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,210,150,0.95)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,175,100,0.75)')}
                  >
                    Surreal Marketing
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {checkoutProduct && (
        <CheckoutModal
          product={checkoutProduct}
          isOpen={!!checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
        />
      )}
      {purchaseItem && (
        <PreMadePurchaseModal
          item={purchaseItem}
          isOpen={!!purchaseItem}
          onClose={() => setPurchaseItem(null)}
        />
      )}
    </div>
  );
}
