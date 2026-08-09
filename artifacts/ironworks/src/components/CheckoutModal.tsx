import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { GlassButton } from './GlassButton';
import { FormattedDescription } from './FormattedDescription';
import { PremiumProduct } from '../data/premium-products';
import { useToast } from '@/hooks/use-toast';
import { saveOrder } from '@/hooks/useAdminProducts';

interface CheckoutModalProps {
  product: PremiumProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ product, isOpen, onClose }: CheckoutModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });

  if (!product) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await saveOrder({
        productId: product.id,
        productTitle: product.title,
        productPrice: product.priceLabel,
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
      });
      setIsSubmitting(false);
      setForm({ name: '', email: '', phone: '', address: '' });
      onClose();
      toast({
        title: "Inquiry Received",
        description: "We'll be in touch directly to confirm details and next steps.",
      });
    } catch (error) {
      setIsSubmitting(false);
      toast({
        title: "Could Not Save Inquiry",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const inputCls = "w-full rounded-lg px-4 py-2.5 text-white text-sm font-sans placeholder:text-white/25 focus:outline-none transition-colors";
  const inputStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4"
          >
            <div className="rounded-2xl overflow-hidden relative"
              style={{ background: 'rgba(14,10,6,0.98)', border: '1px solid rgba(255,140,26,0.2)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
              <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full text-white/40 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <X size={18} />
              </button>

              <div className="grid md:grid-cols-2">
                <div className="relative overflow-hidden p-8 flex flex-col"
                  style={{ background: 'rgba(255,77,0,0.04)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,77,0,0.08),transparent_60%)] pointer-events-none" />
                  <div className="relative z-10 flex-1 flex flex-col">
                    <h3 className="font-display uppercase tracking-widest text-xs text-orange-400/70 mb-4">Inquiry Summary</h3>
                    <div className="aspect-square rounded-xl overflow-hidden mb-5" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                      {product.image
                        ? <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-white/5 flex items-center justify-center"><span className="text-white/20 font-display uppercase text-sm">No image</span></div>
                      }
                    </div>
                    <h2 className="font-display text-xl text-white uppercase tracking-wider mb-2">{product.title}</h2>
                    <FormattedDescription
                      text={product.description}
                      className="text-white/45 text-sm font-sans mb-6 flex-1 space-y-3"
                    />
                    <div className="pt-5 flex justify-between items-end" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <span className="text-white/35 text-sm font-sans">Listed price</span>
                      <span className="font-display text-2xl text-forge-gradient">{product.priceLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="font-display uppercase tracking-widest text-xs text-white/35 mb-6">Your Details</h3>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {[
                      { name: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe', required: true },
                      { name: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com', required: true },
                      { name: 'phone', label: 'Phone', type: 'tel', placeholder: '(555) 000-0000', required: true },
                    ].map(f => (
                      <div key={f.name}>
                        <label className="block text-xs font-display tracking-widest uppercase text-white/30 mb-1.5">{f.label}</label>
                        <input required={f.required} type={f.type} name={f.name} value={(form as any)[f.name]} onChange={handleChange}
                          placeholder={f.placeholder} className={inputCls} style={inputStyle}
                          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,140,26,0.45)')}
                          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-display tracking-widest uppercase text-white/30 mb-1.5">Shipping Address</label>
                      <textarea required rows={3} name="address" value={form.address} onChange={handleChange}
                        placeholder="123 Forge Lane, City, State ZIP" className={inputCls + ' resize-none'} style={inputStyle}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,140,26,0.45)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                    </div>
                    <div className="mt-3">
                      <GlassButton type="submit" disabled={isSubmitting} className="w-full justify-center">
                        {isSubmitting ? 'Sending...' : 'Send Inquiry'}
                      </GlassButton>
                    </div>
                    <p className="text-center text-xs text-white/25 font-sans">This sends a direct inquiry, not an Etsy order.</p>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
