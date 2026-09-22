import { Link } from 'wouter';
import { Navigation } from '@/components/Navigation';
import { FloatingContactBanner } from '@/components/FloatingContactBanner';
import { ResilientImage } from '@/components/ResilientImage';
import { GlassButton } from '@/components/GlassButton';
import { railingProject as project } from '@/data/projects';
import { useSeo } from '@/lib/seo';

export function ProjectPage() {
  useSeo({ title: `${project.title} | D&S Iron Works Project`, description: project.description, path: project.path, image: project.sections[0].image,
    jsonLd: { '@context': 'https://schema.org', '@type': 'WebPage', name: project.title, description: project.description, url: `https://dandsironworks.com${project.path}` } });
  return <div className="min-h-screen bg-background text-foreground"><Navigation /><FloatingContactBanner />
    <main className="container mx-auto max-w-6xl px-5 sm:px-8 pt-32 pb-24">
      <nav aria-label="Breadcrumb" className="text-sm text-orange-300 mb-8"><Link href="/">Home</Link> / <Link href="/services/forged-railings">Forged Railings</Link> / Project Photos</nav>
      <p className="font-display text-orange-400 tracking-widest uppercase mb-3">Shop Work & Installed Details</p>
      <h1 className="font-display text-4xl sm:text-6xl tracking-wide uppercase mb-6">{project.title}</h1>
      <p className="text-white/65 text-lg leading-relaxed max-w-3xl mb-12">{project.intro}</p>
      {project.sections.map((section, index) => <section key={section.title} className="mb-14">
        <ResilientImage src={section.image} alt={section.alt} loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} sizes="(max-width: 1152px) 100vw, 1152px" className="w-full aspect-[4/3] object-cover rounded-xl mb-6" />
        <h2 className="font-display text-3xl uppercase tracking-wide mb-4">{section.title}</h2><p className="text-white/60 leading-relaxed max-w-3xl">{section.text}</p>
      </section>)}
      <section className="rounded-xl border border-white/10 p-6 sm:p-8"><h2 className="font-display text-3xl uppercase mb-4">Planning Your Own Railing</h2><p className="text-white/60 leading-relaxed mb-7">{project.planning}</p><div className="flex flex-wrap gap-5 items-center"><GlassButton href="/contact" data-analytics-cta="railing-project">Discuss Your Railing</GlassButton><Link href="/services/forged-railings" className="text-orange-300 underline">Explore the railing service</Link></div></section>
    </main>
  </div>;
}
