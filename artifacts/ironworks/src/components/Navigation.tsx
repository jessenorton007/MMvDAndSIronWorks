import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useLocation } from 'wouter';

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const isHome = window.location.pathname === '/' || window.location.pathname === base || window.location.pathname === base + '/';
    if (!isHome) {
      navigate(`/#${id}`);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const goContact = () => {
    setMobileMenuOpen(false);
    navigate('/contact');
  };

  const goServices = () => {
    setMobileMenuOpen(false);
    navigate('/services');
  };

  const navLinks = [
    { name: 'Custom', href: '/#custom-designs', action: () => scrollTo('custom-designs') },
    { name: 'Pre-Made', href: '/#pre-made', action: () => scrollTo('pre-made') },
    { name: 'Services', href: '/services', action: goServices },
    { name: 'Shop', href: '/#shop', action: () => scrollTo('shop') },
    { name: 'Contact', href: '/contact', action: goContact },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}>
      <div className="container mx-auto px-4 md:px-8">
        <div
          className="mx-auto max-w-5xl rounded-full flex items-center justify-between px-5 py-3 transition-all duration-300"
          style={{
            background: scrolled ? 'rgba(14,10,6,0.88)' : 'rgba(14,10,6,0.55)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: scrolled
              ? '0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'
              : '0 4px 24px rgba(0,0,0,0.3)',
          }}
        >
          <a href="/#hero" className="flex-shrink-0 cursor-pointer" aria-label="D&S Iron Works home">
            <img
              src="/brand/logo.png"
              alt="D&S Iron Works"
              className="h-12 w-auto"
              style={{ filter: 'invert(1) brightness(1.4) drop-shadow(0 0 8px rgba(255,140,26,0.2))' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector('span')) {
                  const span = document.createElement('span');
                  span.className = 'font-display font-bold text-xl tracking-wider text-white';
                  span.innerText = 'D&S IRON WORKS';
                  parent.appendChild(span);
                }
              }}
            />
          </a>

          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                href={link.href}
                key={link.name}
                onClick={event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) { event.preventDefault(); link.action(); } }}
                className="nav-link text-sm font-display font-medium tracking-widest uppercase"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="md:hidden">
            <button
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white/70 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="absolute top-full left-0 right-0 mt-3 px-4 md:hidden z-50"
          >
            <div
              className="rounded-2xl p-5 flex flex-col gap-1"
              style={{
                background: 'rgba(14,10,6,0.96)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
              }}
            >
              {navLinks.map((link) => (
                <a
                  href={link.href}
                  key={link.name}
                  onClick={event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) { event.preventDefault(); link.action(); } }}
                  className="nav-link text-left text-lg font-display tracking-widest uppercase py-3 border-b border-white/5 last:border-0"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
