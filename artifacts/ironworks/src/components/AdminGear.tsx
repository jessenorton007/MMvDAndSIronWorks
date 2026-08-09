import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Eye, EyeOff } from 'lucide-react';
import { useLocation } from 'wouter';

const SESSION_KEY = 'ds_admin_auth';

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export function AdminGear() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.ok === false) throw new Error(result?.error || 'Could not sign in.');
      sessionStorage.setItem(SESSION_KEY, '1');
      setOpen(false);
      setPassword('');
      navigate('/admin');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not sign in.');
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3 rounded-full text-white/20 hover:text-white/50 transition-colors"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        aria-label="Admin Panel"
      >
        <Settings size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setOpen(false); setError(''); setPassword(''); }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-4"
            >
              <div
                className="rounded-2xl p-8 relative"
                style={{
                  background: 'rgba(14,10,6,0.97)',
                  border: '1px solid rgba(255,140,26,0.2)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
                }}
              >
                <button
                  onClick={() => { setOpen(false); setError(''); setPassword(''); }}
                  className="absolute top-4 right-4 p-1.5 rounded-full text-white/30 hover:text-white/70 transition-colors"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 rounded-full bg-orange-500/10 border border-orange-500/20">
                    <Settings size={18} className="text-orange-400" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg uppercase tracking-widest text-white">Admin Access</h2>
                    <p className="text-xs text-white/30 font-sans">Admin Panel</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="Password"
                      autoFocus
                      className="w-full rounded-xl px-4 py-3 pr-12 text-white text-sm font-sans placeholder:text-white/25 focus:outline-none transition-colors"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: error ? '1px solid rgba(255,80,80,0.5)' : '1px solid rgba(255,255,255,0.1)',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,140,26,0.4)')}
                      onBlur={e => (e.currentTarget.style.borderColor = error ? 'rgba(255,80,80,0.5)' : 'rgba(255,255,255,0.1)')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {error && (
                    <p className="text-xs text-red-400 font-sans">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl font-display uppercase tracking-widest text-sm text-white transition-all duration-200 disabled:opacity-60"
                    style={{
                      background: 'linear-gradient(135deg, #FF4D00, #FF8C1A)',
                      boxShadow: '0 4px 20px rgba(255,77,0,0.25)',
                    }}
                  >
                    {submitting ? 'Signing In...' : 'Enter'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
