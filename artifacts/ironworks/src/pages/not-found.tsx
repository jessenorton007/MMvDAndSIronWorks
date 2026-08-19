import { ArrowLeft } from "lucide-react";
import { useSeo } from "@/lib/seo";
import { GlassButton } from "@/components/GlassButton";

export default function NotFound() {
  useSeo({
    title: "Page Not Found | D&S Iron Works",
    description: "The requested D&S Iron Works page could not be found.",
    robots: "noindex, nofollow",
  });
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-5 text-foreground">
      <main className="w-full max-w-xl text-center">
        <span className="font-display text-sm uppercase tracking-[0.35em] text-orange-400/70">Error 404</span>
        <h1 className="mt-5 font-display text-5xl sm:text-7xl uppercase tracking-widest text-white">Page Not Found</h1>
        <p className="mx-auto mt-5 mb-9 max-w-md font-sans leading-relaxed text-white/50">
          The page may have moved or the address may be incorrect. Return to D&amp;S Iron Works to explore custom ironwork and available products.
        </p>
        <GlassButton href="/">
          <ArrowLeft size={15} className="mr-2" /> Home
        </GlassButton>
      </main>
    </div>
  );
}
