import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, ExternalLink, X } from "lucide-react";
import { GlassButton } from "./GlassButton";
import { FormattedDescription } from "./FormattedDescription";
import { useToast } from "@/hooks/use-toast";
import { PreMadeItem } from "@/data/premade-items";
import { saveOrder } from "@/hooks/useAdminProducts";
import { submitPurchase } from "@/lib/commerce";

interface PreMadePurchaseModalProps {
  item: PreMadeItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const blankForm = {
  name: "",
  email: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  postalCode: "",
  quantity: "1",
  deliveryPreference: "Ship it",
  notes: "",
};

export function PreMadePurchaseModal({ item, isOpen, onClose }: PreMadePurchaseModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ orderId: string; paymentUrl?: string; message: string } | null>(null);
  const [form, setForm] = useState(blankForm);

  if (!item) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const resetAndClose = () => {
    setForm(blankForm);
    setSuccess(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      productId: item.id,
      productTitle: item.title,
      productType: "Pre-made item",
      priceLabel: item.priceLabel,
      paymentUrl: item.paymentUrl,
      quantity: Math.max(1, Number(form.quantity || 1)),
      customer: {
        name: form.name,
        email: form.email,
        phone: form.phone,
      },
      shipping: {
        address1: form.address1,
        address2: form.address2,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
      },
      deliveryPreference: form.deliveryPreference,
      notes: form.notes,
    };

    try {
      const result = await submitPurchase(payload);
      await saveOrder({
        productId: item.id,
        productTitle: item.title,
        productPrice: item.priceLabel,
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: `${form.address1}${form.address2 ? `, ${form.address2}` : ""}, ${form.city}, ${form.state} ${form.postalCode}`,
      });
      setSuccess({ orderId: result.orderId, paymentUrl: result.paymentUrl, message: result.message });
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }
    } catch (err) {
      await saveOrder({
        productId: item.id,
        productTitle: item.title,
        productPrice: item.priceLabel,
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: `${form.address1}${form.address2 ? `, ${form.address2}` : ""}, ${form.city}, ${form.state} ${form.postalCode}`,
      });
      setSuccess({
        orderId: `local_${Date.now()}`,
        message: "Your order details were saved. The payment/email service is not reachable in this preview.",
      });
      toast({
        title: "Backend Not Reachable",
        description: err instanceof Error ? err.message : "Order saved for follow-up.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = "w-full rounded-lg px-4 py-2.5 text-white text-sm font-sans placeholder:text-white/25 focus:outline-none transition-colors";
  const inputStyle: React.CSSProperties = { background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)" };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetAndClose}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-[70] w-[calc(100%-1.5rem)] max-w-4xl max-h-[92vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto"
          >
            <div className="rounded-2xl overflow-hidden relative bg-[#0f0b08]" style={{ border: "1px solid rgba(255,140,26,0.2)", boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }}>
              <button onClick={resetAndClose} className="absolute top-4 right-4 z-10 p-2 rounded-full text-white/40 hover:text-white transition-colors bg-white/5 border border-white/10">
                <X size={18} />
              </button>

              {success ? (
                <div className="p-8 sm:p-12 flex flex-col items-center text-center gap-5">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-orange-500/10 border border-orange-500/30">
                    <CheckCircle size={28} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs font-display tracking-[0.28em] uppercase text-orange-400/70 mb-3">Order Received</p>
                    <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-widest text-white mb-3">
                      Purchase Started
                    </h2>
                    <p className="text-white/55 font-sans leading-relaxed max-w-xl">
                      {success.message}
                    </p>
                  </div>
                  <p className="text-white/35 text-xs font-sans">Order ID: {success.orderId}</p>
                  {success.paymentUrl && (
                    <GlassButton href={success.paymentUrl} className="text-sm px-6 py-3">
                      Continue to QuickBooks <ExternalLink size={14} className="ml-2" />
                    </GlassButton>
                  )}
                  <button onClick={resetAndClose} className="text-xs font-display tracking-widest uppercase text-white/35 hover:text-white/70 transition-colors">
                    Back to Site
                  </button>
                </div>
              ) : (
                <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
                  <div className="p-6 sm:p-8 bg-white/[0.025] border-b lg:border-b-0 lg:border-r border-white/10">
                    <p className="text-xs font-display tracking-[0.28em] uppercase text-orange-400/70 mb-4">Pre-Made Purchase</p>
                    <div className="aspect-[4/3] rounded-xl overflow-hidden mb-5 bg-black border border-white/10">
                      <img src={item.image} alt={item.alt} className="w-full h-full object-cover" />
                    </div>
                    <h2 className="font-display text-2xl uppercase tracking-widest text-white mb-2">{item.title}</h2>
                    <FormattedDescription
                      text={item.description}
                      className="text-white/50 text-sm font-sans leading-relaxed mb-5 space-y-3"
                    />
                    <div className="flex items-end justify-between gap-4 pt-5 border-t border-white/10">
                      <span className="text-white/35 text-sm font-sans">Current price</span>
                      <span className="font-display text-2xl text-forge-gradient text-right">{item.priceLabel}</span>
                    </div>
                    <p className="text-white/30 text-xs font-sans leading-relaxed mt-4">
                      QuickBooks handles payment after your buyer and shipping details are submitted. No card details are collected on this site.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 sm:p-8 flex flex-col gap-4">
                    <h3 className="font-display uppercase tracking-widest text-xs text-white/35 mb-1">Buyer + Shipping Details</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Full Name" name="name" value={form.name} onChange={handleChange} required inputCls={inputCls} inputStyle={inputStyle} />
                      <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} required inputCls={inputCls} inputStyle={inputStyle} />
                    </div>
                    <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required inputCls={inputCls} inputStyle={inputStyle} />
                    <Field label="Street Address" name="address1" value={form.address1} onChange={handleChange} required inputCls={inputCls} inputStyle={inputStyle} />
                    <Field label="Apartment / Unit" name="address2" value={form.address2} onChange={handleChange} inputCls={inputCls} inputStyle={inputStyle} />
                    <div className="grid sm:grid-cols-[1fr_0.55fr_0.65fr] gap-4">
                      <Field label="City" name="city" value={form.city} onChange={handleChange} required inputCls={inputCls} inputStyle={inputStyle} />
                      <Field label="State" name="state" value={form.state} onChange={handleChange} required inputCls={inputCls} inputStyle={inputStyle} />
                      <Field label="ZIP" name="postalCode" value={form.postalCode} onChange={handleChange} required inputCls={inputCls} inputStyle={inputStyle} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Quantity" name="quantity" type="number" value={form.quantity} onChange={handleChange} required inputCls={inputCls} inputStyle={inputStyle} />
                      <div>
                        <label className="block text-xs font-display tracking-widest uppercase text-white/30 mb-1.5">Delivery</label>
                        <select name="deliveryPreference" value={form.deliveryPreference} onChange={handleChange} className={inputCls} style={inputStyle}>
                          <option value="Ship it">Ship it</option>
                          <option value="Local pickup">Local pickup</option>
                          <option value="Discuss delivery">Discuss delivery</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-display tracking-widest uppercase text-white/30 mb-1.5">Order Notes</label>
                      <textarea name="notes" rows={3} value={form.notes} onChange={handleChange} placeholder="Gate code, delivery notes, timeline, or questions" className={`${inputCls} resize-none`} style={inputStyle} />
                    </div>
                    <GlassButton type="submit" disabled={isSubmitting} className="w-full justify-center mt-2">
                      {isSubmitting ? "Starting Purchase..." : "Start Purchase"}
                    </GlassButton>
                    <p className="text-center text-xs text-white/25 font-sans">
                      D&S receives the order details by email; QuickBooks handles the payment.
                    </p>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  required,
  type = "text",
  inputCls,
  inputStyle,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  inputCls: string;
  inputStyle: React.CSSProperties;
}) {
  return (
    <div>
      <label className="block text-xs font-display tracking-widest uppercase text-white/30 mb-1.5">{label}{required ? " *" : ""}</label>
      <input required={required} type={type} name={name} value={value} onChange={onChange} className={inputCls} style={inputStyle} />
    </div>
  );
}
