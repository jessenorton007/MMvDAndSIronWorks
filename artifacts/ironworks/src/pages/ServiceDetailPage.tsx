import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle, MapPin, Phone, PocketKnife } from 'lucide-react';
import { useLocation, useParams } from 'wouter';
import { Navigation } from '@/components/Navigation';
import { FloatingContactBanner } from '@/components/FloatingContactBanner';
import { Embers } from '@/components/Embers';
import { GlassButton } from '@/components/GlassButton';
import { useAdminServices } from '@/hooks/useAdminProducts';
import { useSeo } from '@/lib/seo';
import NotFound from './not-found';

export function ServiceDetailPage() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { services } = useAdminServices();
  const service = services.find((item) => item.slug === params.slug);
  const relatedServices = service?.relatedSlugs
    ?.map((slug) => services.find((item) => item.slug === slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item)) ?? [];
  const returnToServices = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate('/services');
  };

  useSeo({
    title: service?.metaTitle ?? 'Custom Ironwork Services | D&S Iron Works',
    description: service?.metaDescription ?? 'Custom ironwork, forged metal art, fire pits, signs, railings, and blacksmith commissions by D&S Iron Works.',
    path: service ? `/services/${service.slug}` : '/services',
    image: service?.heroImage,
    jsonLd: service
      ? {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: service.title,
          description: service.metaDescription,
          provider: {
            '@type': 'LocalBusiness',
            name: 'D&S Iron Works',
            telephone: '+1-435-421-9033',
            areaServed: 'Utah',
          },
          areaServed: 'Utah',
          serviceType: service.title,
        }
      : undefined,
  });

  if (!service) return <NotFound />;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navigation />
      <FloatingContactBanner />
      <Embers />

      <main className="relative pt-28 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,77,0,0.06)_0%,transparent_62%)] pointer-events-none" />
        <div className="container mx-auto px-5 sm:px-6 md:px-12 relative z-10">
          <button
            onClick={returnToServices}
            className="flex items-center gap-2 text-white/35 hover:text-white transition-colors mb-10 group font-display tracking-wider text-sm uppercase"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
            All Services
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-14 items-center mb-16">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
              <span className="text-xs font-display tracking-[0.3em] uppercase text-orange-400/70 block mb-4">
                {service.eyebrow}
              </span>
              <h1 className="font-display text-5xl md:text-7xl tracking-widest uppercase leading-none text-white mb-6">
                {service.title}
              </h1>
              <p className="text-white/60 font-sans font-light leading-relaxed text-lg max-w-xl mb-8">
                {service.summary}
              </p>
              <div className="flex flex-wrap gap-4">
                <GlassButton href="tel:+14354219033">
                  <Phone size={15} className="mr-2" />
                  Call Dallan
                </GlassButton>
                <GlassButton onClick={() => navigate('/contact')} className="bg-white/3" data-analytics-cta="request-quote">
                  Start a Project
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
              {service.heroImage ? (
                <img src={service.heroImage} alt={`${service.title} example from D&S Iron Works`} className="w-full h-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-[linear-gradient(135deg,rgba(255,140,26,0.18),rgba(255,255,255,0.035)_45%,rgba(0,0,0,0.45))]">
                  <PocketKnife size={56} className="text-orange-300/70" strokeWidth={1.35} />
                  <span className="font-display text-base uppercase tracking-[0.3em] text-white/55">
                    Custom Blade Commissions
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12">
            <section
              className="rounded-xl p-6 sm:p-8"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-widest text-white mb-6">
                What This Includes
              </h2>
              <div className="space-y-4">
                {service.details.map((detail) => (
                  <div key={detail} className="flex gap-3">
                    <CheckCircle size={17} className="text-orange-400 mt-0.5 shrink-0" />
                    <p className="text-white/60 font-sans leading-relaxed">{detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section
              className="rounded-xl p-6 sm:p-8"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-widest text-white mb-6">
                Common Projects
              </h2>
              <div className="flex flex-wrap gap-2">
                {service.examples.map((example) => (
                  <span
                    key={example}
                    className="rounded-full border border-orange-500/20 bg-orange-500/8 px-3 py-1.5 text-xs font-display tracking-widest uppercase text-orange-200/75"
                  >
                    {example}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {service.gallery && service.gallery.length > 0 && (
            <section className="mt-10">
              <div className="mb-6">
                <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-widest text-white mb-2">
                  Real Project Photos
                </h2>
                <p className="text-white/45 text-sm font-sans leading-relaxed max-w-2xl">
                  Finished work and shop views from D&S Iron Works projects.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {service.gallery.map((image) => (
                  <div
                    key={image.src}
                    className="aspect-[4/3] overflow-hidden rounded-xl bg-black/50"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {service.process && service.process.length > 0 && (
            <section className="mt-14">
              <span className="text-xs font-display tracking-[0.3em] uppercase text-orange-400/70 block mb-3">
                From Idea to Finished Steel
              </span>
              <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-widest text-white mb-7">
                How a Custom Project Starts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {service.process.map((step, index) => (
                  <article key={step.title} className="rounded-xl border border-white/10 bg-white/[0.025] p-6">
                    <span className="font-display text-orange-400/65 text-sm tracking-widest">0{index + 1}</span>
                    <h3 className="font-display text-xl uppercase tracking-wider text-white mt-4 mb-3">{step.title}</h3>
                    <p className="text-white/55 font-sans leading-relaxed text-sm">{step.description}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {service.localServiceNote && (
            <section className="mt-10 rounded-xl border border-orange-500/20 bg-orange-500/[0.045] p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <MapPin size={22} className="text-orange-400 shrink-0 mt-1" />
                <div>
                  <h2 className="font-display text-2xl uppercase tracking-widest text-white mb-3">Serving Southern Utah</h2>
                  <p className="text-white/60 font-sans leading-relaxed max-w-4xl">{service.localServiceNote}</p>
                </div>
              </div>
            </section>
          )}

          {relatedServices.length > 0 && (
            <section className="mt-14">
              <h2 className="font-display text-3xl uppercase tracking-widest text-white mb-7">Explore Custom Project Types</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedServices.map((related) => (
                  <button
                    key={related.slug}
                    onClick={() => navigate(`/services/${related.slug}`)}
                    className="group rounded-xl border border-white/10 bg-white/[0.025] p-5 text-left hover:border-orange-500/30 transition-colors"
                  >
                    <span className="text-[10px] font-display tracking-[0.24em] uppercase text-orange-400/60">{related.eyebrow}</span>
                    <span className="mt-2 flex items-center justify-between gap-3 font-display text-lg uppercase tracking-wider text-white">
                      {related.shortTitle}<ArrowRight size={16} className="text-orange-400 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-t border-white/10 pt-8">
                <p className="text-white/55 font-sans leading-relaxed">Have a custom furniture, architectural, or one-of-a-kind metal project in mind?</p>
                <GlassButton onClick={() => navigate('/contact')} data-analytics-cta="custom-project-quote">
                  Request a Quote <ArrowRight size={15} className="ml-2" />
                </GlassButton>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
