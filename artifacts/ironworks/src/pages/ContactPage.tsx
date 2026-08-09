import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MessageSquare, Facebook, Send, ArrowLeft, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { Navigation } from '@/components/Navigation';
import { FloatingContactBanner } from '@/components/FloatingContactBanner';
import { GlassButton } from '@/components/GlassButton';
import { Embers } from '@/components/Embers';
import { saveInquiry } from '@/hooks/useAdminProducts';
import { submitContact } from '@/lib/commerce';
import { useSeo } from '@/lib/seo';

const PROJECT_TYPES = [
  'Custom Gate / Fence',
  'Fireplace / Fire Pit',
  'Pre-built Fire Pit / Iron Rocket Stove',
  'Stair Railing',
  'Wall Art / Sculpture',
  'Home Decor / Small Goods',
  'Other / Not Sure Yet',
];

export function ContactPage() {
  const [, navigate] = useLocation();
  useSeo({
    title: 'Contact D&S Iron Works | Custom Ironwork & Pre-Made Fire Pits',
    description: 'Contact Dallan Goff at D&S Iron Works to ask about custom ironwork, pre-built fire pits, Iron Rocket Stove and Iron Rocket XL camp cooking stoves, metal signs, railings, forged art, or blacksmith commissions in Utah.',
    path: '/contact',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact D&S Iron Works',
      description: 'Start a custom ironwork project or ask about pre-made fire pits, Iron Rocket Stove, and Iron Rocket XL from D&S Iron Works.',
    },
  });

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    projectType: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitContact(form);
    } catch {
      // The database record is still required if email delivery is unavailable.
    }
    try {
      await saveInquiry(form);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = `
    w-full rounded-xl px-4 py-3 text-white text-sm font-sans placeholder:text-white/25
    focus:outline-none transition-colors
  `;
  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
  };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,140,26,0.45)';
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navigation />
      <FloatingContactBanner />
      <Embers />

      <div className="relative pt-28 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,77,0,0.06)_0%,transparent_60%)] pointer-events-none" />

        <div className="container mx-auto px-6 md:px-12 max-w-6xl relative z-10">
          <motion.button
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/35 hover:text-white transition-colors mb-10 group font-display tracking-wider text-sm uppercase"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </motion.button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left — Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-xs font-display tracking-[0.3em] uppercase text-orange-400/70 block mb-4">
                Start a Project
              </span>
              <h1 className="font-display text-5xl md:text-6xl tracking-widest uppercase leading-tight text-white mb-6">
                Let's Build<br />
                <span className="text-forge-gradient">Something</span>
              </h1>
              <p className="text-white/50 font-sans font-light leading-relaxed mb-10 max-w-md">
                Have an idea, a sketch, or just a feeling? Reach out to Dallan directly.
                We discuss every project personally — no middlemen, no forms that go nowhere.
              </p>

              <div className="space-y-5 mb-12">
                <a
                  href="tel:+14354219033"
                  className="flex items-center gap-4 group"
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:bg-orange-500/15"
                    style={{ background: 'rgba(255,140,26,0.08)', border: '1px solid rgba(255,140,26,0.2)' }}>
                    <Phone size={16} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs font-display tracking-widest uppercase text-white/35 mb-0.5">Call or Text</p>
                    <p className="text-white font-sans group-hover:text-orange-300 transition-colors">(435) 421-9033</p>
                  </div>
                </a>

                <a
                  href="mailto:dandsiron@yahoo.com"
                  className="flex items-center gap-4 group"
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:bg-orange-500/15"
                    style={{ background: 'rgba(255,140,26,0.08)', border: '1px solid rgba(255,140,26,0.2)' }}>
                    <Mail size={16} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs font-display tracking-widest uppercase text-white/35 mb-0.5">Email</p>
                    <p className="text-white font-sans group-hover:text-orange-300 transition-colors">dandsiron@yahoo.com</p>
                  </div>
                </a>

                <a
                  href="sms:+14354219033"
                  className="flex items-center gap-4 group"
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:bg-orange-500/15"
                    style={{ background: 'rgba(255,140,26,0.08)', border: '1px solid rgba(255,140,26,0.2)' }}>
                    <MessageSquare size={16} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs font-display tracking-widest uppercase text-white/35 mb-0.5">Text</p>
                    <p className="text-white font-sans group-hover:text-orange-300 transition-colors">Text us directly</p>
                  </div>
                </a>

                <a
                  href="https://www.facebook.com/DallanGoffBlacksmith"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 group"
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:bg-orange-500/15"
                    style={{ background: 'rgba(255,140,26,0.08)', border: '1px solid rgba(255,140,26,0.2)' }}>
                    <Facebook size={16} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs font-display tracking-widest uppercase text-white/35 mb-0.5">Facebook</p>
                    <p className="text-white font-sans group-hover:text-orange-300 transition-colors">@DallanGoffBlacksmith</p>
                  </div>
                </a>
              </div>

              <div className="flex gap-4">
                <GlassButton href="tel:+14354219033" className="text-sm px-6 py-3">
                  <Phone size={14} className="mr-2" />
                  Call Now
                </GlassButton>
                <GlassButton href="sms:+14354219033" className="text-sm px-6 py-3">
                  <MessageSquare size={14} className="mr-2" />
                  Text Us
                </GlassButton>
              </div>
            </motion.div>

            {/* Right — Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div
                className="rounded-2xl p-8 md:p-10 relative overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
                }}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-3xl rounded-full pointer-events-none" />

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center text-center py-12 gap-6"
                  >
                    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-orange-500/10 border border-orange-500/30">
                      <CheckCircle size={28} className="text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-display text-2xl uppercase tracking-widest text-white mb-3">Message Received</h3>
                      <p className="text-white/50 font-sans text-sm leading-relaxed max-w-xs">
                        Dallan will be in touch with you directly. Most responses within 24 hours.
                      </p>
                    </div>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="text-xs font-display tracking-widest uppercase text-white/30 hover:text-white/60 transition-colors"
                    >
                      Send Another
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <h3 className="font-display text-sm tracking-[0.25em] uppercase text-white/40 mb-7">Send a Message</h3>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-display tracking-widest uppercase text-white/35 mb-2">Name *</label>
                          <input
                            required
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Your name"
                            className={inputCls}
                            style={inputStyle}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-display tracking-widest uppercase text-white/35 mb-2">Phone</label>
                          <input
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="(555) 000-0000"
                            className={inputCls}
                            style={inputStyle}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-display tracking-widest uppercase text-white/35 mb-2">Email *</label>
                        <input
                          required
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="your@email.com"
                          className={inputCls}
                          style={inputStyle}
                          onFocus={inputFocus}
                          onBlur={inputBlur}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-display tracking-widest uppercase text-white/35 mb-2">Project Type</label>
                        <select
                          name="projectType"
                          value={form.projectType}
                          onChange={handleChange}
                          className={inputCls}
                          style={{ ...inputStyle, appearance: 'none', color: form.projectType ? 'white' : 'rgba(255,255,255,0.25)' }}
                          onFocus={inputFocus}
                          onBlur={inputBlur}
                        >
                          <option value="">Select a type...</option>
                          {PROJECT_TYPES.map(t => (
                            <option key={t} value={t} style={{ background: '#1a1008', color: 'white' }}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-display tracking-widest uppercase text-white/35 mb-2">Tell Us About Your Project *</label>
                        <textarea
                          required
                          name="message"
                          rows={5}
                          value={form.message}
                          onChange={handleChange}
                          placeholder="Describe what you're envisioning — dimensions, materials, references, timeline..."
                          className={inputCls + ' resize-none'}
                          style={inputStyle}
                          onFocus={inputFocus}
                          onBlur={inputBlur}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 rounded-xl font-display uppercase tracking-widest text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60"
                        style={{
                          background: 'linear-gradient(135deg, #FF4D00, #FF8C1A)',
                          boxShadow: '0 4px 24px rgba(255,77,0,0.3)',
                        }}
                      >
                        {submitting ? 'Sending...' : (
                          <>
                            <Send size={14} />
                            Send Message
                          </>
                        )}
                      </button>

                      <p className="text-center text-xs text-white/25 font-sans">
                        Your message goes directly to Dallan
                      </p>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
