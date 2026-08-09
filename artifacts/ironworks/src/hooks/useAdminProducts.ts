import { useCallback, useEffect, useRef, useState } from 'react';
import { EtsyProduct, defaultEtsyProducts } from '@/data/etsy-products';
import { PremiumProduct, defaultPremiumProducts } from '@/data/premium-products';
import { PreMadeItem, preMadeItems as defaultPreMadeItems } from '@/data/premade-items';
import { ServicePage, services as defaultServices } from '@/data/services';

const LEGACY_KEYS: Record<string, string> = {
  'etsy-products': 'ds_etsy_products_v5',
  'premium-products': 'ds_premium_products_v2',
  'premade-products': 'ds_premade_products_v1',
  services: 'ds_services_v2',
  orders: 'ds_orders',
  inquiries: 'ds_inquiries',
  settings: 'ds_site_settings',
};

export interface Order {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  submittedAt: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  projectType: string;
  message: string;
  submittedAt: string;
}

export interface SiteSettings {
  phone: string;
  email: string;
  facebook: string;
}

export const defaultSiteSettings: SiteSettings = {
  phone: '(435) 421-9033',
  email: 'dandsiron@yahoo.com',
  facebook: '@DallanGoffBlacksmith',
};

type ContentResponse<T> = {
  ok: boolean;
  content: T | null;
  version: number;
  error?: string;
};

function hasEmbeddedImages(value: unknown) {
  return JSON.stringify(value).includes('data:image/');
}

function readLegacy<T>(key: string): T | null {
  const storageKey = LEGACY_KEYS[key];
  if (!storageKey) return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as T;
    return hasEmbeddedImages(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

function clearLegacy(key: string) {
  const storageKey = LEGACY_KEYS[key];
  if (!storageKey) return;
  try { localStorage.removeItem(storageKey); } catch { /* Browser storage is no longer authoritative. */ }
}

function hasAdminSession() {
  try {
    return sessionStorage.getItem('ds_admin_auth') === '1';
  } catch {
    return false;
  }
}

async function requestContent<T>(key: string): Promise<ContentResponse<T>> {
  const response = await fetch(`/api/admin/content/${encodeURIComponent(key)}`, { cache: 'no-store' });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.ok === false) throw new Error(result?.error || `Could not load ${key}.`);
  return result as ContentResponse<T>;
}

async function persistContent<T>(key: string, content: T, version?: number): Promise<ContentResponse<T>> {
  const response = await fetch(`/api/admin/content/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, ...(version && version > 0 ? { version } : {}) }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.ok === false) throw new Error(result?.error || `Could not save ${key}.`);
  return result as ContentResponse<T>;
}

function useServerContent<T>(key: string, defaults: T) {
  const [content, setContentState] = useState<T>(defaults);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const versionRef = useRef(0);
  const contentRef = useRef(defaults);
  const defaultsRef = useRef(defaults);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const writeStartedRef = useRef(false);

  const apply = useCallback((next: T) => {
    contentRef.current = next;
    setContentState(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    requestContent<T>(key)
      .then(async result => {
        if (cancelled) return;
        if (writeStartedRef.current) return;
        if (result.content !== null) {
          const legacy = key === 'premade-products' ? null : readLegacy<T>(key);
          if (hasAdminSession() && legacy !== null && result.version <= 1 && JSON.stringify(legacy) !== JSON.stringify(result.content)) {
            const migrated = await persistContent(key, legacy, result.version);
            if (cancelled) return;
            versionRef.current = migrated.version;
            apply(migrated.content ?? legacy);
            clearLegacy(key);
            return;
          }
          versionRef.current = result.version;
          apply(result.content);
          clearLegacy(key);
          return;
        }

        const seed = readLegacy<T>(key) ?? defaultsRef.current;
        if (!hasAdminSession()) {
          apply(seed);
          return;
        }
        const saved = await persistContent(key, seed);
        if (cancelled) return;
        versionRef.current = saved.version;
        apply(saved.content ?? seed);
        clearLegacy(key);
      })
      .catch(reason => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : `Could not load ${key}.`);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [apply, key]);

  const save = useCallback(async (next: T) => {
    writeStartedRef.current = true;
    let result = next;
    const run = async () => {
      const saved = await persistContent(key, next, versionRef.current);
      versionRef.current = saved.version;
      result = saved.content ?? next;
      apply(result);
      clearLegacy(key);
      setError('');
    };
    const pending = queueRef.current.then(run, run);
    queueRef.current = pending.then(() => undefined, () => undefined);
    await pending;
    return result;
  }, [apply, key]);

  const mutate = useCallback(async (updater: (current: T) => T) => {
    writeStartedRef.current = true;
    let result = contentRef.current;
    const run = async () => {
      const next = updater(contentRef.current);
      const saved = await persistContent(key, next, versionRef.current);
      versionRef.current = saved.version;
      result = saved.content ?? next;
      apply(result);
      clearLegacy(key);
      setError('');
    };
    const pending = queueRef.current.then(run, run);
    queueRef.current = pending.then(() => undefined, () => undefined);
    await pending;
    return result;
  }, [apply, key]);

  return { content, contentRef, save, mutate, loading, error };
}

function useServerCollection<T extends { id: string }>(key: string, defaults: T[]) {
  const state = useServerContent<T[]>(key, defaults);
  const setItems = useCallback((updated: T[]) => state.save(updated), [state.save]);
  const addItem = useCallback((item: T) => state.mutate(current => [...current, item]), [state.mutate]);
  const updateItem = useCallback((item: T) => state.mutate(current => current.map(existing => existing.id === item.id ? item : existing)), [state.mutate]);
  const removeItem = useCallback((id: string) => state.mutate(current => current.filter(item => item.id !== id)), [state.mutate]);
  return { items: state.content, setItems, addItem, updateItem, removeItem, loading: state.loading, error: state.error };
}

export function useEtsyProducts() {
  const state = useServerCollection('etsy-products', defaultEtsyProducts);
  return { products: state.items, setProducts: state.setItems, addProduct: state.addItem, updateProduct: state.updateItem, removeProduct: state.removeItem, loading: state.loading, error: state.error };
}

export function usePremiumProducts() {
  const state = useServerCollection('premium-products', defaultPremiumProducts);
  return { products: state.items, setProducts: state.setItems, addProduct: state.addItem, updateProduct: state.updateItem, removeProduct: state.removeItem, loading: state.loading, error: state.error };
}

export function usePreMadeProducts() {
  const state = useServerCollection('premade-products', defaultPreMadeItems);
  return { products: state.items, setProducts: state.setItems, addProduct: state.addItem, updateProduct: state.updateItem, removeProduct: state.removeItem, loading: state.loading, error: state.error };
}

export function useAdminServices() {
  const state = useServerContent<ServicePage[]>('services', defaultServices);
  const updateServiceFields = useCallback(
    (slug: string, updater: (service: ServicePage) => ServicePage) =>
      state.mutate(current => current.map(item => item.slug === slug ? updater(item) : item)),
    [state.mutate],
  );
  return {
    services: state.content,
    setServices: state.save,
    updateServiceFields,
    loading: state.loading,
    error: state.error,
  };
}

export function useSiteSettings() {
  const state = useServerContent<SiteSettings>('settings', defaultSiteSettings);
  return { settings: state.content, setSettings: state.save, loading: state.loading, error: state.error };
}

export function useOrders() {
  const state = useServerCollection<Order>('orders', []);
  return { orders: state.items, removeOrder: state.removeItem, loading: state.loading, error: state.error };
}

export function useInquiries() {
  const state = useServerCollection<Inquiry>('inquiries', []);
  return { inquiries: state.items, removeInquiry: state.removeItem, loading: state.loading, error: state.error };
}

async function appendRecord(key: 'orders' | 'inquiries', record: Record<string, unknown>) {
  const response = await fetch(`/api/admin/records/${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.ok === false) throw new Error(result?.error || 'Could not save the submission.');
}

export function saveOrder(order: Omit<Order, 'id' | 'submittedAt'>) {
  return appendRecord('orders', order);
}

export function saveInquiry(inquiry: Omit<Inquiry, 'id' | 'submittedAt'>) {
  return appendRecord('inquiries', inquiry);
}
