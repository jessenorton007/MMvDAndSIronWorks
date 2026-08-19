import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassButtonProps {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  target?: string;
  rel?: string;
  'data-analytics-cta'?: string;
}

const sharedClass = (extra = '') => `
  relative inline-flex items-center justify-center
  px-8 py-4 rounded-full font-display font-medium text-base uppercase tracking-wider
  text-white overflow-hidden group cursor-pointer
  backdrop-blur-md bg-white/5 border border-white/15
  shadow-[0_4px_24px_rgba(255,77,0,0.12),inset_0_1px_0_rgba(255,255,255,0.08)]
  transition-all duration-300
  hover:shadow-[0_8px_40px_rgba(255,77,0,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]
  hover:border-orange-500/40 hover:bg-white/10
  ${extra}
`.replace(/\s+/g, ' ').trim();

const Inner = ({ children }: { children: ReactNode }) => (
  <>
    <div className="absolute inset-0 bg-forge-gradient opacity-0 group-hover:opacity-20 transition-opacity duration-400 rounded-full" />
    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-full" />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/5 h-1/2 bg-white/15 blur-lg rounded-full" />
    <span className="relative z-10">{children}</span>
  </>
);

export function GlassButton({ children, className = '', href, onClick, type, disabled, target, rel, 'data-analytics-cta': analyticsCta }: GlassButtonProps) {
  if (href) {
    return (
      <motion.a
        href={href}
        target={target}
        rel={rel}
        data-analytics-cta={analyticsCta}
        className={sharedClass(className)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Inner>{children}</Inner>
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type || 'button'}
      onClick={onClick}
      disabled={disabled}
      data-analytics-cta={analyticsCta}
      className={sharedClass(className)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Inner>{children}</Inner>
    </motion.button>
  );
}
