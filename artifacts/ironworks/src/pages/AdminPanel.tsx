import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import {
  LayoutDashboard, ShoppingBag, Gem, MessageSquare,
  ClipboardList, Settings, LogOut, Plus, Pencil,
  Trash2, X, Upload, ExternalLink, ChevronDown, ChevronUp, Check, BarChart2, Flame, Image as ImageIcon
} from 'lucide-react';
import {
  useAdminServices, useEtsyProducts, usePremiumProducts, usePreMadeProducts,
  useOrders, useInquiries, useSiteSettings,
} from '@/hooks/useAdminProducts';
import { EtsyProduct } from '@/data/etsy-products';
import { PremiumProduct } from '@/data/premium-products';
import { PreMadeItem } from '@/data/premade-items';
import { ServicePage } from '@/data/services';
import { AnalyticsTab } from './AnalyticsTab';
import { ResilientImage } from '@/components/ResilientImage';
import { preMadeItems as fallbackPreMadeItems } from '@/data/premade-items';
import { useSeo } from '@/lib/seo';

const SESSION_KEY = 'ds_admin_auth';

type Tab = 'overview' | 'premade' | 'services' | 'etsy' | 'premium' | 'inquiries' | 'orders' | 'analytics' | 'settings';

type AdminStorageStatus = {
  ok: boolean;
  backend?: string;
  objectCount?: number;
  referencedImages?: number;
  availableImages?: number;
  missingImages?: string[];
  error?: string;
};

function inputCls(extra = '') {
  return `w-full rounded-lg px-3 py-2.5 text-white text-sm font-sans placeholder:text-white/20 focus:outline-none transition-colors ${extra}`;
}
const iStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' };
function iFocus(e: React.FocusEvent<any>) { e.currentTarget.style.borderColor = 'rgba(255,140,26,0.5)'; }
function iBlur(e: React.FocusEvent<any>) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }
const descriptionInputCls = inputCls('resize-y min-h-36 whitespace-pre-wrap');

const MAX_UPLOAD_DIMENSION = 1200;
const UPLOAD_JPEG_QUALITY = 0.7;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => resolve(String(ev.target?.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load image preview'));
    image.src = src;
  });
}

async function uploadAdminImage(dataUrl: string, filename: string) {
  let response: Response;
  try {
    response = await fetch('/api/admin/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl, filename }),
    });
  } catch {
    throw new Error('Image upload API is not reachable. Make sure the API server is running, reload the admin page, then upload the photos again.');
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.ok === false || !result?.url) {
    throw new Error(result?.error || 'Image upload failed. Make sure the API server can write to the admin uploads folder.');
  }
  const url = String(result.url);
  const verification = await fetch(url, { cache: 'no-store' }).catch(() => null);
  if (!verification?.ok || !verification.headers.get('content-type')?.startsWith('image/')) {
    throw new Error('The image reached storage but could not be read back. It was not added to the product.');
  }
  return url;
}

async function optimizeImageFile(file: File) {
  const raw = await readFileAsDataUrl(file);
  return compactAndStoreImage(raw, file.name);
}

async function compactImageDataUrl(raw: string) {
  if (!/^data:(?:image\/[^;]+|application\/octet-stream);base64,/i.test(raw)) return raw;
  const image = await loadImage(raw).catch(() => null);
  if (!image) return raw;

  const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return raw;
  context.drawImage(image, 0, 0, width, height);
  const optimized = canvas.toDataURL('image/jpeg', UPLOAD_JPEG_QUALITY);
  return optimized.length < raw.length ? optimized : raw;
}

async function compactAndStoreImage(raw: string, filename = 'admin-image') {
  if (!/^data:(?:image\/[^;]+|application\/octet-stream);base64,/i.test(raw)) return raw;
  const compacted = await compactImageDataUrl(raw);
  return uploadAdminImage(compacted, filename);
}

async function compactGalleryImages(gallery: PreMadeItem['gallery']) {
  const compacted = [];
  for (const image of gallery) {
    compacted.push({
      ...image,
      src: await compactAndStoreImage(image.src, image.alt || 'gallery-photo'),
    });
  }
  return compacted;
}

function adminSaveErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (/image upload|upload api|api server|admin uploads/i.test(message)) {
    return message;
  }
  if (/quota|storage|exceeded/i.test(message)) {
    return 'The browser still has old oversized uploaded photos saved locally. Use the Pre-Made Products cleanup button to remove old browser-stored photos, then upload the photos again.';
  }
  return message || 'The changes could not be saved. Try the upload again or use a public image URL.';
}

function isBrowserStoredImage(value: string | undefined) {
  return typeof value === 'string' && /^data:(?:image\/[^;]+|application\/octet-stream);base64,/i.test(value);
}

function preMadeHasBrowserStoredImages(product: PreMadeItem) {
  return [
    product.image,
    product.video?.poster,
    ...(product.gallery ?? []).map(image => image.src),
    ...(product.videos ?? []).map(video => video.poster),
  ].some(isBrowserStoredImage);
}

function stripPreMadeBrowserStoredImages(product: PreMadeItem): PreMadeItem {
  return {
    ...product,
    image: isBrowserStoredImage(product.image) ? '' : product.image,
    gallery: (product.gallery ?? [])
      .map(image => ({ ...image, src: isBrowserStoredImage(image.src) ? '' : image.src }))
      .filter(image => image.src),
    video: product.video
      ? { ...product.video, poster: isBrowserStoredImage(product.video.poster) ? '' : product.video.poster }
      : undefined,
    videos: product.videos?.map(video => ({
      ...video,
      poster: isBrowserStoredImage(video.poster) ? '' : video.poster,
    })),
  };
}

function isAdminUploadedImage(value: string | undefined) {
  return typeof value === 'string' && (
    value.startsWith('/api/admin/images/') ||
    value.startsWith('/images/admin-uploads/')
  );
}

// ── Image upload helper ──────────────────────────────────────────
function ImageField({ value, onChange, onBusyChange }: { value: string; onChange: (v: string) => void | Promise<unknown>; onBusyChange?: (busy: boolean) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'url' | 'file'>(value.startsWith('data:') || isAdminUploadedImage(value) ? 'file' : 'url');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    onBusyChange?.(true);
    setUploadError('');
    try {
      const uploadedUrl = await optimizeImageFile(file);
      await onChange(uploadedUrl);
      setMode('file');
    } catch (error) {
      setUploadError(adminSaveErrorMessage(error));
    } finally {
      setUploading(false);
      onBusyChange?.(false);
      e.currentTarget.value = '';
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode('url')}
          className={`text-xs font-display tracking-widest uppercase px-3 py-1 rounded-full transition-colors ${mode === 'url' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-white/30 hover:text-white/60'}`}>
          URL
        </button>
        <button type="button" onClick={() => setMode('file')}
          className={`text-xs font-display tracking-widest uppercase px-3 py-1 rounded-full transition-colors ${mode === 'file' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-white/30 hover:text-white/60'}`}>
          Upload
        </button>
      </div>
      {mode === 'url' ? (
        <input type="text" value={value.startsWith('data:') ? '' : value} onChange={e => onChange(e.target.value)}
          placeholder="https://... or /products/filename.jpg"
          className={inputCls()} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
      ) : (
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button type="button" onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-white/50 hover:text-white transition-colors w-full"
            style={iStyle}>
            <Upload size={14} />
            {uploading ? 'Uploading image...' : value ? 'Image uploaded - click to replace' : 'Choose image file'}
          </button>
          {uploadError && <p className="mt-2 text-xs text-red-300/80 font-sans">{uploadError}</p>}
          {value && (
            <img src={value} alt="preview" className="mt-2 h-20 w-20 object-cover rounded-lg border border-white/10" />
          )}
        </div>
      )}
    </div>
  );
}

// ── Etsy product form ────────────────────────────────────────────
const emptyEtsy = (): EtsyProduct => ({ id: '', title: '', image: '', priceLabel: '', etsyUrl: 'https://www.etsy.com/shop/dandsironworks', description: '', details: [] });

function EtsyForm({ initial, onSave, onClose }: { initial: EtsyProduct | null; onSave: (p: EtsyProduct) => void | Promise<void>; onClose: () => void }) {
  const [f, setF] = useState<EtsyProduct>(initial ?? emptyEtsy());
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailsText, setDetailsText] = useState((initial?.details ?? []).join('\n'));
  const set = (k: keyof EtsyProduct, v: any) => setF(p => ({ ...p, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const details = detailsText.split('\n').map(s => s.trim()).filter(Boolean);
    const id = f.id || `ep_${Date.now()}`;
    setSaving(true);
    try { await onSave({ ...f, id, details }); } finally { setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Title *</label>
          <input required value={f.title} onChange={e => set('title', e.target.value)} placeholder="Hand-Forged Hook" className={inputCls()} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
        </div>
        <div>
          <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Price *</label>
          <input required value={f.priceLabel} onChange={e => set('priceLabel', e.target.value)} placeholder="$45.00" className={inputCls()} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Product Image</label>
        <ImageField value={f.image} onChange={v => set('image', v)} onBusyChange={setUploading} />
      </div>
      <div>
        <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Etsy Product URL</label>
        <input value={f.etsyUrl} onChange={e => set('etsyUrl', e.target.value)} placeholder="https://www.etsy.com/listing/..." className={inputCls()} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
      </div>
      <div>
        <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Description *</label>
        <textarea required rows={6} value={f.description} onChange={e => set('description', e.target.value)} placeholder="Describe the product..." className={descriptionInputCls} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
      </div>
      <div>
        <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Specs / Details <span className="text-white/25 normal-case font-sans tracking-normal">(one per line)</span></label>
        <textarea rows={3} value={detailsText} onChange={e => setDetailsText(e.target.value)} placeholder={"Solid iron bar stock\nHand-hammered finish\nBeeswax rust protection"} className={inputCls('resize-none')} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={uploading || saving} className="flex-1 py-2.5 rounded-lg font-display uppercase tracking-widest text-sm text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#FF4D00,#FF8C1A)', boxShadow: '0 4px 16px rgba(255,77,0,0.25)' }}>
          {uploading ? 'Uploading Image...' : saving ? 'Saving to Database...' : initial ? 'Save Changes' : 'Add Product'}
        </button>
        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-white/40 hover:text-white transition-colors text-sm" style={iStyle}>Cancel</button>
      </div>
    </form>
  );
}

// ── Premium product form ─────────────────────────────────────────
const emptyPremium = (): PremiumProduct => ({ id: '', title: '', image: '', priceLabel: '', description: '' });

function PremiumForm({ initial, onSave, onClose }: { initial: PremiumProduct | null; onSave: (p: PremiumProduct) => void | Promise<void>; onClose: () => void }) {
  const [f, setF] = useState<PremiumProduct>(initial ?? emptyPremium());
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof PremiumProduct, v: any) => setF(p => ({ ...p, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = f.id || `pr_${Date.now()}`;
    setSaving(true);
    try { await onSave({ ...f, id }); } finally { setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Title *</label>
          <input required value={f.title} onChange={e => set('title', e.target.value)} placeholder="Custom Fire Pit" className={inputCls()} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
        </div>
        <div>
          <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Price *</label>
          <input required value={f.priceLabel} onChange={e => set('priceLabel', e.target.value)} placeholder="$1,200.00" className={inputCls()} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Product Image</label>
        <ImageField value={f.image} onChange={v => set('image', v)} onBusyChange={setUploading} />
      </div>
      <div>
        <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Description *</label>
        <textarea required rows={6} value={f.description} onChange={e => set('description', e.target.value)} placeholder="Describe this signature piece..." className={descriptionInputCls} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={uploading || saving} className="flex-1 py-2.5 rounded-lg font-display uppercase tracking-widest text-sm text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#FF4D00,#FF8C1A)', boxShadow: '0 4px 16px rgba(255,77,0,0.25)' }}>
          {uploading ? 'Uploading Image...' : saving ? 'Saving to Database...' : initial ? 'Save Changes' : 'Add Product'}
        </button>
        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-white/40 hover:text-white transition-colors text-sm" style={iStyle}>Cancel</button>
      </div>
    </form>
  );
}

// ── Pre-made product form ────────────────────────────────────────
const emptyPreMade = (): PreMadeItem => ({
  id: '',
  title: '',
  eyebrow: 'Ready-Built',
  description: '',
  image: '',
  alt: '',
  priceLabel: '',
  paymentUrl: '',
  gallery: [],
  features: [],
  availability: 'Built in small runs. Call or text for current availability.',
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

function PreMadeForm({
  initial,
  onSave,
  onClose,
  onError,
}: {
  initial: PreMadeItem | null;
  onSave: (p: PreMadeItem) => void | Promise<void>;
  onClose: () => void;
  onError?: (error: unknown) => void;
}) {
  const [f, setF] = useState<PreMadeItem>(initial ?? emptyPreMade());
  const [featuresText, setFeaturesText] = useState((initial?.features ?? []).join('\n'));
  const [gallery, setGallery] = useState<Array<PreMadeItem['gallery'][number] & { editorKey: string }>>(
    () => (initial?.gallery ?? []).map(image => ({ ...image, editorKey: crypto.randomUUID() })),
  );
  const [saving, setSaving] = useState(false);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [formError, setFormError] = useState('');
  const [videoText, setVideoText] = useState(
    (initial?.videos ?? []).map(video => `${video.src} | ${video.poster} | ${video.title} | ${video.description} | ${video.aspect}`).join('\n')
  );
  const [primaryVideo, setPrimaryVideo] = useState(initial?.video ?? { src: '', poster: '', label: '' });
  const set = (k: keyof PreMadeItem, v: any) => setF(p => ({ ...p, [k]: v }));
  const setGalleryItem = (index: number, patch: Partial<PreMadeItem['gallery'][number]>) =>
    setGallery(items => items.map((item, i) => i === index ? { ...item, ...patch } : item));
  const moveGalleryItem = (index: number, direction: -1 | 1) => {
    setGallery(items => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= items.length) return items;
      const updated = [...items];
      [updated[index], updated[nextIndex]] = [updated[nextIndex], updated[index]];
      return updated;
    });
  };
  const trackUpload = (busy: boolean) => setPendingUploads(count => Math.max(0, count + (busy ? 1 : -1)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingUploads > 0) {
      setFormError('Wait for every image upload to finish before saving.');
      return;
    }
    setSaving(true);
    setFormError('');
    const id = f.id || slugify(f.title) || `pm_${Date.now()}`;
    const features = featuresText.split('\n').map(s => s.trim()).filter(Boolean);
    try {
      const cleanGallery = await compactGalleryImages(gallery
        .map(image => ({ src: image.src.trim(), alt: image.alt.trim() || f.title }))
        .filter(image => image.src));
      const videos = videoText.split('\n').map(line => {
        const [src = '', poster = '', title = '', description = '', aspect = 'wide'] = line.split('|').map(part => part.trim());
        return {
          src,
          poster,
          title: title || f.title,
          description,
          aspect: aspect === 'portrait' ? 'portrait' as const : 'wide' as const,
        };
      }).filter(video => video.src && video.poster);
      await onSave({
        ...f,
        id,
        image: await compactAndStoreImage(f.image.trim(), `${id}-main`),
        alt: f.alt || f.title,
        gallery: cleanGallery,
        features,
        videos: videos.length ? videos : undefined,
        video: primaryVideo.src && primaryVideo.poster
          ? {
              ...primaryVideo,
              poster: await compactAndStoreImage(primaryVideo.poster.trim(), `${id}-video-poster`),
            }
          : undefined,
      });
    } catch (error) {
      setFormError(adminSaveErrorMessage(error));
      onError?.(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {formError && (
        <div className="rounded-lg px-4 py-3 text-sm text-red-100/80 font-sans leading-relaxed" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(248,113,113,0.22)' }}>
          {formError}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Title *</label>
          <input required value={f.title} onChange={e => set('title', e.target.value)} placeholder="Iron Rocket Stove" className={inputCls()} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
        </div>
        <div>
          <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Price *</label>
          <input required value={f.priceLabel} onChange={e => set('priceLabel', e.target.value)} placeholder="$375" className={inputCls()} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Page ID</label>
          <input value={f.id} readOnly={!!initial} onChange={e => set('id', slugify(e.target.value))} placeholder="auto-created-from-title" className={inputCls(initial ? 'text-white/35' : '')} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
        </div>
        <div>
          <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Eyebrow</label>
          <input value={f.eyebrow} onChange={e => set('eyebrow', e.target.value)} placeholder="Regular Size" className={inputCls()} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Main Image</label>
        <ImageField value={f.image} onChange={v => set('image', v)} onBusyChange={trackUpload} />
      </div>
      <div>
        <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Image Alt Text</label>
        <input value={f.alt} onChange={e => set('alt', e.target.value)} placeholder="Describe the image for SEO/accessibility" className={inputCls()} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
      </div>
      <div>
        <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Description *</label>
        <textarea required rows={7} value={f.description} onChange={e => set('description', e.target.value)} placeholder="Describe this ready-built product..." className={descriptionInputCls} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
      </div>
      <div>
        <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">QuickBooks Payment Link</label>
        <input value={f.paymentUrl ?? ''} onChange={e => set('paymentUrl', e.target.value)} placeholder="https://connect.intuit.com/pay/..." className={inputCls()} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
      </div>
      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <label className="block text-xs font-display tracking-widest uppercase text-white/40">Gallery Images</label>
          <button
            type="button"
            onClick={() => setGallery(items => [...items, { src: '', alt: f.title || 'Pre-made product photo', editorKey: crypto.randomUUID() }])}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-display uppercase tracking-widest text-orange-300/80 transition-colors hover:text-orange-300"
            style={{ background: 'rgba(255,140,26,0.08)', border: '1px solid rgba(255,140,26,0.18)' }}
          >
            <Plus size={12} /> Add Photo
          </button>
        </div>
        <div className="space-y-3">
          {gallery.length === 0 ? (
            <div className="rounded-xl px-4 py-8 text-center text-sm text-white/30" style={{ border: '1px dashed rgba(255,255,255,0.12)' }}>
              No gallery photos yet.
            </div>
          ) : (
            gallery.map((image, index) => (
              <div key={image.editorKey} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="grid grid-cols-1 md:grid-cols-[7rem_1fr_auto] gap-3">
                  <div className="aspect-[4/3] overflow-hidden rounded-lg bg-white/[0.04] border border-white/10">
                    {image.src ? (
                      <img src={image.src} alt={image.alt || f.title || 'Gallery preview'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] text-white/25">Preview</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <ImageField value={image.src} onChange={src => setGalleryItem(index, { src })} onBusyChange={trackUpload} />
                    <input
                      value={image.alt}
                      onChange={e => setGalleryItem(index, { alt: e.target.value })}
                      placeholder="Alt text for this gallery photo"
                      className={inputCls()}
                      style={iStyle}
                      onFocus={iFocus}
                      onBlur={iBlur}
                    />
                  </div>
                  <div className="flex md:flex-col gap-2">
                    <button type="button" onClick={() => moveGalleryItem(index, -1)} disabled={index === 0} className="rounded-lg p-2 text-white/40 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-25" style={iStyle} aria-label="Move photo up">
                      <ChevronUp size={15} />
                    </button>
                    <button type="button" onClick={() => moveGalleryItem(index, 1)} disabled={index === gallery.length - 1} className="rounded-lg p-2 text-white/40 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-25" style={iStyle} aria-label="Move photo down">
                      <ChevronDown size={15} />
                    </button>
                    <button type="button" onClick={() => setGallery(items => items.filter((_, i) => i !== index))} className="rounded-lg p-2 text-white/30 transition-colors hover:text-red-400" style={iStyle} aria-label="Remove photo">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div>
        <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Features <span className="text-white/25 normal-case font-sans tracking-normal">one per line</span></label>
        <textarea rows={3} value={featuresText} onChange={e => setFeaturesText(e.target.value)} placeholder={"Wood-fed firebox\nFlat-top cooking surface\nHeavy steel build"} className={inputCls('resize-none')} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
      </div>
      <div>
        <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Availability Note</label>
        <input value={f.availability} onChange={e => set('availability', e.target.value)} className={inputCls()} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
      </div>
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-xs font-display tracking-widest uppercase text-white/40 mb-3">Primary Showcase Video</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input value={primaryVideo.src} onChange={e => setPrimaryVideo(v => ({ ...v, src: e.target.value }))} placeholder="/images/video.mp4" className={inputCls()} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
          <input value={primaryVideo.poster} onChange={e => setPrimaryVideo(v => ({ ...v, poster: e.target.value }))} placeholder="/images/poster.jpg" className={inputCls()} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
          <input value={primaryVideo.label} onChange={e => setPrimaryVideo(v => ({ ...v, label: e.target.value }))} placeholder="Video label" className={inputCls()} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Additional Videos <span className="text-white/25 normal-case font-sans tracking-normal">one per line: video | poster | title | description | wide/portrait</span></label>
        <textarea rows={4} value={videoText} onChange={e => setVideoText(e.target.value)} placeholder={"/images/walkaround.mp4 | /images/poster.jpg | Walkaround | Finished product view | wide"} className={inputCls('resize-none')} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving || pendingUploads > 0} className="flex-1 py-2.5 rounded-lg font-display uppercase tracking-widest text-sm text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#FF4D00,#FF8C1A)', boxShadow: '0 4px 16px rgba(255,77,0,0.25)' }}>
          {pendingUploads > 0 ? `Uploading ${pendingUploads} Image${pendingUploads === 1 ? '' : 's'}...` : saving ? 'Saving to Database...' : initial ? 'Save Changes' : 'Add Pre-Made Product'}
        </button>
        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-white/40 hover:text-white transition-colors text-sm" style={iStyle}>Cancel</button>
      </div>
    </form>
  );
}

// ── Modal wrapper ────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="rounded-2xl p-7 relative" style={{ background: 'rgba(14,10,6,0.98)', border: '1px solid rgba(255,140,26,0.2)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-lg uppercase tracking-widest text-white">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-full text-white/30 hover:text-white/70 transition-colors"><X size={16} /></button>
          </div>
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Confirm delete dialog ────────────────────────────────────────
function Confirm({ msg, onConfirm, onCancel }: { msg: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel} className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-sm mx-4">
        <div className="rounded-2xl p-7" style={{ background: 'rgba(14,10,6,0.98)', border: '1px solid rgba(255,80,80,0.25)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
          <p className="text-white/75 font-sans text-sm mb-6">{msg}</p>
          <div className="flex gap-3">
            <button onClick={onConfirm} className="flex-1 py-2.5 rounded-lg font-display uppercase tracking-widest text-sm text-white" style={{ background: 'rgba(255,60,60,0.7)', border: '1px solid rgba(255,60,60,0.3)' }}>Delete</button>
            <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg font-display uppercase tracking-widest text-sm text-white/50 hover:text-white transition-colors" style={iStyle}>Cancel</button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Section header ───────────────────────────────────────────────
function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-7 gap-4">
      <div>
        <h2 className="font-display text-2xl uppercase tracking-widest text-white">{title}</h2>
        {sub && <p className="text-white/35 text-xs font-sans mt-1">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="rounded-xl p-5 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,140,26,0.1)', border: '1px solid rgba(255,140,26,0.2)' }}>
        <Icon size={16} className="text-orange-400" />
      </div>
      <div>
        <p className="text-2xl font-display text-white">{value}</p>
        <p className="text-xs font-display tracking-widest uppercase text-white/35">{label}</p>
      </div>
    </div>
  );
}

function ServiceImagesPanel({
  services,
  updateServiceFields,
}: {
  services: ServicePage[];
  updateServiceFields: (slug: string, updater: (service: ServicePage) => ServicePage) => void;
}) {
  return (
    <div>
      <SectionHeader title="Service Images" sub="Images used on the homepage service cards, services page, and individual service pages" />
      <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(255,140,26,0.06)', border: '1px solid rgba(255,140,26,0.18)' }}>
        <p className="text-sm text-orange-100/75 font-sans leading-relaxed">
          Change any service/category image here. Leave the knives image blank until you have a real knife photo; the site will show the custom blade commission placeholder instead of a broken image.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {services.map((service) => (
          <div key={service.slug} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="aspect-[4/3] overflow-hidden bg-white/[0.035]">
              {service.heroImage ? (
                <img src={service.heroImage} alt={`${service.title} preview`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-white/25">
                  <ImageIcon size={30} />
                  <span className="font-display text-xs uppercase tracking-widest">No photo assigned</span>
                </div>
              )}
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="font-display uppercase tracking-wider text-white text-sm">{service.title}</p>
                <p className="text-white/25 text-xs font-sans mt-1">/services/{service.slug}</p>
              </div>
              <ImageField
                value={service.heroImage}
                onChange={(heroImage) => updateServiceFields(service.slug, current => ({ ...current, heroImage }))}
              />
              <button
                type="button"
                onClick={() => updateServiceFields(service.slug, current => ({ ...current, heroImage: '' }))}
                className="text-xs font-display uppercase tracking-widest text-white/30 hover:text-red-300 transition-colors"
              >
                Clear Image
              </button>
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-xs font-display uppercase tracking-widest text-white/40">Detail Gallery</p>
                  <button
                    type="button"
                    onClick={() => updateServiceFields(service.slug, current => ({
                      ...current,
                      gallery: [...(current.gallery ?? []), { src: '', alt: current.title }],
                    }))}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-display uppercase tracking-widest text-orange-300/80 transition-colors hover:text-orange-300"
                    style={{ background: 'rgba(255,140,26,0.08)', border: '1px solid rgba(255,140,26,0.18)' }}
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
                {(service.gallery ?? []).length === 0 ? (
                  <div className="rounded-lg px-3 py-5 text-center text-xs text-white/25" style={{ border: '1px dashed rgba(255,255,255,0.12)' }}>
                    No detail gallery photos.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(service.gallery ?? []).map((image, index) => {
                      const gallery = service.gallery ?? [];
                      const updateGalleryItem = (patch: Partial<NonNullable<ServicePage['gallery']>[number]>) => {
                        updateServiceFields(service.slug, current => ({
                          ...current,
                          gallery: (current.gallery ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
                        }));
                      };
                      const moveGalleryItem = (direction: -1 | 1) => {
                        updateServiceFields(service.slug, current => {
                          const currentGallery = current.gallery ?? [];
                          const nextIndex = index + direction;
                          if (nextIndex < 0 || nextIndex >= currentGallery.length) return current;
                          const updated = [...currentGallery];
                          [updated[index], updated[nextIndex]] = [updated[nextIndex], updated[index]];
                          return { ...current, gallery: updated };
                        });
                      };
                      return (
                        <div key={`service-gallery-${service.slug}-${index}`} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div className="grid grid-cols-1 gap-3">
                            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-white/[0.04] border border-white/10">
                              {image.src ? (
                                <img src={image.src} alt={image.alt || service.title} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[11px] text-white/25">Preview</div>
                              )}
                            </div>
                            <ImageField value={image.src} onChange={(src) => updateGalleryItem({ src })} />
                            <input
                              value={image.alt}
                              onChange={(e) => updateGalleryItem({ alt: e.target.value })}
                              placeholder="Alt text for this gallery photo"
                              className={inputCls()}
                              style={iStyle}
                              onFocus={iFocus}
                              onBlur={iBlur}
                            />
                            <div className="flex gap-2">
                              <button type="button" onClick={() => moveGalleryItem(-1)} disabled={index === 0} className="rounded-lg p-2 text-white/40 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-25" style={iStyle} aria-label="Move gallery photo up">
                                <ChevronUp size={15} />
                              </button>
                              <button type="button" onClick={() => moveGalleryItem(1)} disabled={index === gallery.length - 1} className="rounded-lg p-2 text-white/40 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-25" style={iStyle} aria-label="Move gallery photo down">
                                <ChevronDown size={15} />
                              </button>
                              <button type="button" onClick={() => updateServiceFields(service.slug, current => ({ ...current, gallery: (current.gallery ?? []).filter((_, itemIndex) => itemIndex !== index) }))} className="ml-auto rounded-lg p-2 text-white/30 transition-colors hover:text-red-300" style={iStyle} aria-label="Remove gallery photo">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main admin panel ─────────────────────────────────────────────
export function AdminPanel() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { products: etsyProducts, addProduct: addEtsy, updateProduct: updateEtsy, removeProduct: removeEtsy } = useEtsyProducts();
  const { products: premiumProducts, addProduct: addPremium, updateProduct: updatePremium, removeProduct: removePremium } = usePremiumProducts();
  const { products: preMadeProducts, setProducts: setPreMadeProducts, addProduct: addPreMade, updateProduct: updatePreMade, removeProduct: removePreMade } = usePreMadeProducts();
  const { services: adminServices, updateServiceFields } = useAdminServices();
  const { orders, removeOrder } = useOrders();
  const { inquiries, removeInquiry } = useInquiries();

  const [etsyModal, setEtsyModal] = useState<{ open: boolean; editing: EtsyProduct | null }>({ open: false, editing: null });
  const [premiumModal, setPremiumModal] = useState<{ open: boolean; editing: PremiumProduct | null }>({ open: false, editing: null });
  const [preMadeModal, setPreMadeModal] = useState<{ open: boolean; editing: PreMadeItem | null }>({ open: false, editing: null });
  const [confirm, setConfirm] = useState<{ msg: string; onConfirm: () => void } | null>(null);
  const [saveError, setSaveError] = useState('');
  const [storageStatus, setStorageStatus] = useState<AdminStorageStatus | null>(null);

  useSeo({
    title: 'D&S Iron Works Administration',
    description: 'Authorized D&S Iron Works administration access.',
    path: '/admin',
    robots: 'noindex, nofollow, noarchive',
  });

  const { settings: savedSettings, setSettings: persistSettings } = useSiteSettings();
  const [settings, setSettings] = useState(savedSettings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => setSettings(savedSettings), [savedSettings]);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) !== '1') {
      navigate('/');
      return;
    }
    fetch('/api/admin/session')
      .then(response => {
        if (response.ok) return;
        sessionStorage.removeItem(SESSION_KEY);
        navigate('/');
      })
      .catch(() => {
        sessionStorage.removeItem(SESSION_KEY);
        navigate('/');
      });
  }, [navigate]);

  useEffect(() => {
    if (tab !== 'premade') return;
    let cancelled = false;
    fetch('/api/admin/storage-status')
      .then(async response => {
        const result = await response.json().catch(() => ({}));
        if (!cancelled) setStorageStatus({ ...result, ok: response.ok && result?.ok !== false });
      })
      .catch(() => {
        if (!cancelled) setStorageStatus({ ok: false, error: 'The storage API is not reachable.' });
      });
    return () => { cancelled = true; };
  }, [tab, preMadeProducts]);

  const logout = () => {
    void fetch('/api/admin/logout', { method: 'POST' });
    sessionStorage.removeItem(SESSION_KEY);
    navigate('/');
  };

  const handleDeleteOrder = (id: string) => {
    setConfirm({ msg: 'Delete this purchase inquiry permanently?', onConfirm: () => { void removeOrder(id); setConfirm(null); } });
  };
  const handleDeleteInquiry = (id: string) => {
    setConfirm({ msg: 'Delete this inquiry permanently?', onConfirm: () => { void removeInquiry(id); setConfirm(null); } });
  };

  const saveSettings = async () => {
    await saveAdminChange(async () => {
      await persistSettings(settings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    });
  };

  const saveAdminChange = async (save: () => unknown | Promise<unknown>, onSuccess?: () => void, options?: { rethrow?: boolean }) => {
    try {
      await save();
      setSaveError('');
      onSuccess?.();
    } catch (error) {
      setSaveError(adminSaveErrorMessage(error));
      if (options?.rethrow) throw error;
    }
  };

  const hasPreMadeBrowserStoredImages = preMadeProducts.some(preMadeHasBrowserStoredImages);
  const clearPreMadeBrowserStoredImages = () => {
    void saveAdminChange(() => setPreMadeProducts(preMadeProducts.map(stripPreMadeBrowserStoredImages)));
  };

  const navItems: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'premade', label: 'Pre-Made Products', icon: Flame, badge: preMadeProducts.length },
    { id: 'services', label: 'Service Images', icon: ImageIcon, badge: adminServices.filter(service => service.heroImage).length },
    { id: 'etsy', label: 'Shop Products', icon: ShoppingBag, badge: etsyProducts.length },
    { id: 'premium', label: 'Signature Pieces', icon: Gem, badge: premiumProducts.length },
    { id: 'inquiries', label: 'Inquiries', icon: MessageSquare, badge: inquiries.length },
    { id: 'orders', label: 'Purchase Inquiries', icon: ClipboardList, badge: orders.length },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: 'var(--app-font-sans)' }}>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-3.5"
        style={{ background: 'rgba(10,7,4,0.95)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-3">
          <button className="md:hidden p-1 text-white/50 hover:text-white" onClick={() => setMobileNavOpen(v => !v)}>
            {mobileNavOpen ? <X size={20} /> : <ChevronDown size={20} />}
          </button>
          <img src="/brand/logo.png" alt="Admin" className="h-8 w-auto" style={{ filter: 'invert(1) brightness(0.7)' }} />
          <span className="font-display text-sm uppercase tracking-widest text-white/40">Admin</span>
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-xs font-display tracking-widest uppercase text-white/30 hover:text-red-400 transition-colors px-3 py-1.5 rounded-full"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <LogOut size={12} />
          Logout
        </button>
      </div>

      <div className="flex pt-14">
        {/* Sidebar */}
        <AnimatePresence>
          {(true) && (
            <aside className={`${mobileNavOpen ? 'block' : 'hidden'} md:block fixed md:sticky top-14 left-0 h-[calc(100vh-3.5rem)] w-56 flex-shrink-0 overflow-y-auto z-20`}
              style={{ background: 'rgba(10,7,4,0.97)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <nav className="p-4 flex flex-col gap-1">
                {navItems.map(item => (
                  <button key={item.id} onClick={() => { setTab(item.id); setMobileNavOpen(false); }}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-sm font-sans transition-all duration-150 group"
                    style={{
                      background: tab === item.id ? 'rgba(255,140,26,0.12)' : 'transparent',
                      color: tab === item.id ? '#ff8c1a' : 'rgba(255,255,255,0.45)',
                      border: tab === item.id ? '1px solid rgba(255,140,26,0.2)' : '1px solid transparent',
                    }}>
                    <item.icon size={15} className={tab === item.id ? 'text-orange-400' : 'text-white/30 group-hover:text-white/50'} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: tab === item.id ? 'rgba(255,140,26,0.2)' : 'rgba(255,255,255,0.08)', color: tab === item.id ? '#ff8c1a' : 'rgba(255,255,255,0.4)' }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </aside>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-6 md:p-10">
          {saveError && (
            <div className="rounded-xl p-4 mb-6 flex items-start justify-between gap-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(248,113,113,0.22)' }}>
              <div>
                <p className="font-display uppercase tracking-widest text-sm text-red-200 mb-1">Changes did not save</p>
                <p className="text-sm text-red-100/70 font-sans leading-relaxed">{saveError}</p>
              </div>
              <button type="button" onClick={() => setSaveError('')} className="text-red-100/45 hover:text-red-100 transition-colors">
                <X size={16} />
              </button>
            </div>
          )}

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div>
              <SectionHeader title="Overview" sub="D & S Iron Works admin dashboard" />
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                <StatCard label="Pre-Made Products" value={preMadeProducts.length} icon={Flame} />
                <StatCard label="Service Images" value={adminServices.filter(service => service.heroImage).length} icon={ImageIcon} />
                <StatCard label="Shop Products" value={etsyProducts.length} icon={ShoppingBag} />
                <StatCard label="Signature Pieces" value={premiumProducts.length} icon={Gem} />
                <StatCard label="Inquiries" value={inquiries.length} icon={MessageSquare} />
                <StatCard label="Purchase Inquiries" value={orders.length} icon={ClipboardList} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <h3 className="font-display uppercase tracking-widest text-sm text-white/50 mb-4">Recent Inquiries</h3>
                  {inquiries.length === 0 ? <p className="text-white/25 text-sm">No inquiries yet.</p> : inquiries.slice(0, 3).map(i => (
                    <div key={i.id} className="py-3 border-b border-white/5 last:border-0">
                      <p className="text-white/80 text-sm font-medium">{i.name}</p>
                      <p className="text-white/35 text-xs mt-0.5">{i.projectType || 'No type'} · {new Date(i.submittedAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <h3 className="font-display uppercase tracking-widest text-sm text-white/50 mb-4">Recent Purchase Inquiries</h3>
                  {orders.length === 0 ? <p className="text-white/25 text-sm">No purchase inquiries yet.</p> : orders.slice(0, 3).map(o => (
                    <div key={o.id} className="py-3 border-b border-white/5 last:border-0">
                      <p className="text-white/80 text-sm font-medium">{o.name}</p>
                      <p className="text-white/35 text-xs mt-0.5">{o.productTitle} · {o.productPrice}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PRE-MADE PRODUCTS */}
          {tab === 'premade' && (
            <div>
              <SectionHeader title="Pre-Made Products" sub="Fire pits, Iron Rocket Stove, Iron Rocket XL, media, pricing, and QuickBooks links"
                action={
                  <button onClick={() => setPreMadeModal({ open: true, editing: null })}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-display uppercase tracking-widest text-sm text-white transition-all"
                    style={{ background: 'linear-gradient(135deg,#FF4D00,#FF8C1A)', boxShadow: '0 4px 14px rgba(255,77,0,0.25)' }}>
                    <Plus size={14} /> Add Pre-Made
                  </button>
                }
              />
              {storageStatus && (
                <div
                  className="rounded-xl p-4 mb-6"
                  style={{
                    background: storageStatus.ok && !storageStatus.missingImages?.length ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.08)',
                    border: storageStatus.ok && !storageStatus.missingImages?.length ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(248,113,113,0.22)',
                  }}
                >
                  <p className="font-display uppercase tracking-widest text-sm text-white/80 mb-1">
                    {storageStatus.ok ? 'Persistent Storage Connected' : 'Persistent Storage Needs Attention'}
                  </p>
                  <p className="text-sm text-white/55 font-sans leading-relaxed">
                    {storageStatus.ok
                       ? `${storageStatus.backend === 'cloud-storage' ? 'Cloud image storage' : 'Local development storage'} is active. ${storageStatus.availableImages ?? 0} of ${storageStatus.referencedImages ?? 0} uploaded product images are available.`
                      : storageStatus.error || 'The storage service could not be reached.'}
                  </p>
                  {!!storageStatus.missingImages?.length && (
                    <p className="mt-2 break-all text-xs text-red-200/70 font-sans">
                      Missing files: {storageStatus.missingImages.join(', ')}
                    </p>
                  )}
                </div>
              )}
              <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(255,140,26,0.06)', border: '1px solid rgba(255,140,26,0.18)' }}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <p className="text-sm text-orange-100/75 font-sans leading-relaxed">
                    Use this tab to change rocket stove pictures, reorder galleries, edit prices, and update QuickBooks payment links. New uploads are saved as site image files through the API instead of browser storage.
                  </p>
                  <button
                    type="button"
                    onClick={clearPreMadeBrowserStoredImages}
                    disabled={!hasPreMadeBrowserStoredImages}
                    className="shrink-0 rounded-lg px-4 py-2 text-xs font-display uppercase tracking-widest text-orange-100 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                    style={{ background: 'rgba(255,140,26,0.14)', border: '1px solid rgba(255,140,26,0.28)' }}
                  >
                    {hasPreMadeBrowserStoredImages ? 'Clear Old Browser Uploads' : 'No Browser Uploads Found'}
                  </button>
                </div>
              </div>
              {preMadeProducts.length === 0 ? (
                <div className="rounded-xl flex flex-col items-center justify-center py-24 gap-4" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <Flame size={32} className="text-white/15" />
                  <p className="text-white/25 text-sm font-sans">No pre-made products yet</p>
                  <button onClick={() => setPreMadeModal({ open: true, editing: null })} className="text-xs font-display tracking-widest uppercase text-orange-400/70 hover:text-orange-400 transition-colors">+ Add Pre-Made Product</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {preMadeProducts.map(p => (
                    <div key={p.id} className="rounded-xl overflow-hidden flex flex-col" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="aspect-[4/3] overflow-hidden bg-white/5">
                        {p.image ? <ResilientImage src={p.image} fallbackSrc={fallbackPreMadeItems.find(item => item.id === p.id)?.image} alt={p.alt || p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Flame size={32} className="text-white/15" /></div>}
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <p className="font-display uppercase tracking-wider text-white text-sm">{p.title}</p>
                          <p className="text-orange-400/80 text-sm font-sans whitespace-nowrap">{p.priceLabel}</p>
                        </div>
                        <p className="text-white/25 text-xs font-sans mb-3">/{p.id}</p>
                        <p className="text-white/35 text-xs font-sans flex-1 line-clamp-3 whitespace-pre-line">{p.description}</p>
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {p.features.slice(0, 3).map(feature => (
                            <span key={feature} className="rounded-full px-2 py-0.5 text-[10px] font-display tracking-widest uppercase text-white/40 bg-white/[0.035] border border-white/10">
                              {feature}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => setPreMadeModal({ open: true, editing: p })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white transition-colors flex-1 justify-center" style={iStyle}>
                            <Pencil size={12} /> Edit
                          </button>
                          <button onClick={() => navigate(`/pre-made/${p.id}`)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-orange-400 transition-colors" style={iStyle}>
                            <ExternalLink size={12} />
                          </button>
                          <button onClick={() => setConfirm({ msg: `Delete "${p.title}"?`, onConfirm: () => { void saveAdminChange(() => removePreMade(p.id), () => setConfirm(null)); } })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/30 hover:text-red-400 transition-colors" style={iStyle}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SERVICE IMAGES */}
          {tab === 'services' && (
            <ServiceImagesPanel services={adminServices} updateServiceFields={(slug, updater) => {
              void saveAdminChange(() => updateServiceFields(slug, updater));
            }} />
          )}

          {/* ETSY PRODUCTS */}
          {tab === 'etsy' && (
            <div>
              <SectionHeader title="Shop Products" sub="Forge shop products linked to Etsy"
                action={
                  <button onClick={() => setEtsyModal({ open: true, editing: null })}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-display uppercase tracking-widest text-sm text-white transition-all"
                    style={{ background: 'linear-gradient(135deg,#FF4D00,#FF8C1A)', boxShadow: '0 4px 14px rgba(255,77,0,0.25)' }}>
                    <Plus size={14} /> Add Product
                  </button>
                }
              />
              {etsyProducts.length === 0 ? (
                <div className="rounded-xl flex flex-col items-center justify-center py-24 gap-4" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <ShoppingBag size={32} className="text-white/15" />
                  <p className="text-white/25 text-sm font-sans">No products yet — add your first one</p>
                  <button onClick={() => setEtsyModal({ open: true, editing: null })} className="text-xs font-display tracking-widest uppercase text-orange-400/70 hover:text-orange-400 transition-colors">+ Add Product</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {etsyProducts.map(p => (
                    <div key={p.id} className="rounded-xl overflow-hidden flex flex-col" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="aspect-square overflow-hidden bg-white/5">
                        {p.image ? <img src={p.image} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={32} className="text-white/15" /></div>}
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <p className="font-display uppercase tracking-wider text-white text-sm mb-1">{p.title}</p>
                        <p className="text-orange-400/80 text-sm mb-3 font-sans">{p.priceLabel}</p>
                        <p className="text-white/35 text-xs font-sans flex-1 line-clamp-2 whitespace-pre-line">{p.description}</p>
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => setEtsyModal({ open: true, editing: p })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white transition-colors flex-1 justify-center" style={iStyle}>
                            <Pencil size={12} /> Edit
                          </button>
                          <a href={p.etsyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-orange-400 transition-colors" style={iStyle}>
                            <ExternalLink size={12} />
                          </a>
                          <button onClick={() => setConfirm({ msg: `Delete "${p.title}"?`, onConfirm: () => { removeEtsy(p.id); setConfirm(null); } })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/30 hover:text-red-400 transition-colors" style={iStyle}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PREMIUM PRODUCTS */}
          {tab === 'premium' && (
            <div>
              <SectionHeader title="Signature Pieces" sub="High-end pieces with direct inquiry forms"
                action={
                  <button onClick={() => setPremiumModal({ open: true, editing: null })}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-display uppercase tracking-widest text-sm text-white"
                    style={{ background: 'linear-gradient(135deg,#FF4D00,#FF8C1A)', boxShadow: '0 4px 14px rgba(255,77,0,0.25)' }}>
                    <Plus size={14} /> Add Piece
                  </button>
                }
              />
              {premiumProducts.length === 0 ? (
                <div className="rounded-xl flex flex-col items-center justify-center py-24 gap-4" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <Gem size={32} className="text-white/15" />
                  <p className="text-white/25 text-sm font-sans">No signature pieces yet</p>
                  <button onClick={() => setPremiumModal({ open: true, editing: null })} className="text-xs font-display tracking-widest uppercase text-orange-400/70 hover:text-orange-400 transition-colors">+ Add Piece</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {premiumProducts.map(p => (
                    <div key={p.id} className="rounded-xl overflow-hidden flex flex-col" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="aspect-[4/3] overflow-hidden bg-white/5">
                        {p.image ? <img src={p.image} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Gem size={32} className="text-white/15" /></div>}
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <p className="font-display uppercase tracking-wider text-white text-sm mb-1">{p.title}</p>
                        <p className="text-orange-400/80 text-sm mb-3 font-sans">{p.priceLabel}</p>
                        <p className="text-white/35 text-xs font-sans flex-1 line-clamp-2 whitespace-pre-line">{p.description}</p>
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => setPremiumModal({ open: true, editing: p })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white transition-colors flex-1 justify-center" style={iStyle}>
                            <Pencil size={12} /> Edit
                          </button>
                          <button onClick={() => setConfirm({ msg: `Delete "${p.title}"?`, onConfirm: () => { removePremium(p.id); setConfirm(null); } })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/30 hover:text-red-400 transition-colors" style={iStyle}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* INQUIRIES */}
          {tab === 'inquiries' && (
            <div>
              <SectionHeader title="Inquiries" sub="Messages from the contact page" />
              {inquiries.length === 0 ? (
                <div className="rounded-xl flex flex-col items-center justify-center py-24 gap-3" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <MessageSquare size={32} className="text-white/15" />
                  <p className="text-white/25 text-sm font-sans">No inquiries yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {inquiries.map(i => (
                    <div key={i.id} className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <p className="font-display uppercase tracking-wider text-white text-sm">{i.name}</p>
                            {i.projectType && <span className="text-xs px-2 py-0.5 rounded-full text-orange-400/70 font-sans" style={{ background: 'rgba(255,140,26,0.08)', border: '1px solid rgba(255,140,26,0.15)' }}>{i.projectType}</span>}
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs text-white/35 font-sans mb-3">
                            <a href={`mailto:${i.email}`} className="hover:text-orange-400 transition-colors">{i.email}</a>
                            {i.phone && <a href={`tel:${i.phone}`} className="hover:text-orange-400 transition-colors">{i.phone}</a>}
                            <span>{new Date(i.submittedAt).toLocaleString()}</span>
                          </div>
                          <p className="text-white/60 text-sm font-sans leading-relaxed">{i.message}</p>
                        </div>
                        <button onClick={() => handleDeleteInquiry(i.id)} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0 p-1.5"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PURCHASE INQUIRIES */}
          {tab === 'orders' && (
            <div>
              <SectionHeader title="Purchase Inquiries" sub="Pre-made product checkout requests. Payment continues through QuickBooks after the site captures buyer and shipping details." />
              {orders.length === 0 ? (
                <div className="rounded-xl flex flex-col items-center justify-center py-24 gap-3" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <ClipboardList size={32} className="text-white/15" />
                  <p className="text-white/25 text-sm font-sans">No purchase inquiries yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {orders.map(o => (
                    <div key={o.id} className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <p className="font-display uppercase tracking-wider text-white text-sm">{o.name}</p>
                            <span className="text-orange-400/80 font-sans text-sm">{o.productTitle}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full text-orange-400/70" style={{ background: 'rgba(255,140,26,0.08)', border: '1px solid rgba(255,140,26,0.15)' }}>{o.productPrice}</span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs text-white/35 font-sans mb-2">
                            <a href={`mailto:${o.email}`} className="hover:text-orange-400 transition-colors">{o.email}</a>
                            {o.phone && <a href={`tel:${o.phone}`} className="hover:text-orange-400 transition-colors">{o.phone}</a>}
                            <span>{new Date(o.submittedAt).toLocaleString()}</span>
                          </div>
                          {o.address && <p className="text-white/45 text-xs font-sans">{o.address}</p>}
                        </div>
                        <button onClick={() => handleDeleteOrder(o.id)} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0 p-1.5"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ANALYTICS */}
          {tab === 'analytics' && <AnalyticsTab />}

          {/* SETTINGS */}
          {tab === 'settings' && (
            <div>
              <SectionHeader title="Site Settings" sub="Update contact information shown on the site" />
              <div className="max-w-lg rounded-xl p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Phone Number</label>
                    <input value={settings.phone} onChange={e => setSettings(s => ({ ...s, phone: e.target.value }))} className={inputCls()} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
                  </div>
                  <div>
                    <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Email</label>
                    <input value={settings.email} onChange={e => setSettings(s => ({ ...s, email: e.target.value }))} className={inputCls()} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
                  </div>
                  <div>
                    <label className="block text-xs font-display tracking-widest uppercase text-white/40 mb-1.5">Facebook Handle</label>
                    <input value={settings.facebook} onChange={e => setSettings(s => ({ ...s, facebook: e.target.value }))} className={inputCls()} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
                  </div>
                  <button onClick={saveSettings} className="flex items-center justify-center gap-2 py-3 rounded-lg font-display uppercase tracking-widest text-sm text-white transition-all mt-2"
                    style={{ background: settingsSaved ? 'rgba(34,197,94,0.3)' : 'linear-gradient(135deg,#FF4D00,#FF8C1A)', border: settingsSaved ? '1px solid rgba(34,197,94,0.3)' : 'none', boxShadow: settingsSaved ? 'none' : '0 4px 14px rgba(255,77,0,0.25)' }}>
                    {settingsSaved ? <><Check size={14} /> Saved</> : 'Save Settings'}
                  </button>
                  <p className="text-xs text-white/25 font-sans">Settings are saved in the production database.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {etsyModal.open && (
        <Modal title={etsyModal.editing ? 'Edit Product' : 'Add Shop Product'} onClose={() => setEtsyModal({ open: false, editing: null })}>
          <EtsyForm initial={etsyModal.editing} onClose={() => setEtsyModal({ open: false, editing: null })}
            onSave={p => saveAdminChange(
              () => { etsyModal.editing ? updateEtsy(p) : addEtsy(p); },
              () => setEtsyModal({ open: false, editing: null })
            )} />
        </Modal>
      )}
      {premiumModal.open && (
        <Modal title={premiumModal.editing ? 'Edit Piece' : 'Add Signature Piece'} onClose={() => setPremiumModal({ open: false, editing: null })}>
          <PremiumForm initial={premiumModal.editing} onClose={() => setPremiumModal({ open: false, editing: null })}
            onSave={p => saveAdminChange(
              () => { premiumModal.editing ? updatePremium(p) : addPremium(p); },
              () => setPremiumModal({ open: false, editing: null })
            )} />
        </Modal>
      )}
      {preMadeModal.open && (
        <Modal title={preMadeModal.editing ? 'Edit Pre-Made Product' : 'Add Pre-Made Product'} onClose={() => setPreMadeModal({ open: false, editing: null })}>
          <PreMadeForm initial={preMadeModal.editing} onClose={() => setPreMadeModal({ open: false, editing: null })}
            onError={error => setSaveError(adminSaveErrorMessage(error))}
            onSave={p => saveAdminChange(
              async () => { preMadeModal.editing ? await updatePreMade(p) : await addPreMade(p); },
              () => setPreMadeModal({ open: false, editing: null }),
              { rethrow: true }
            )} />
        </Modal>
      )}
      {confirm && <Confirm msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
