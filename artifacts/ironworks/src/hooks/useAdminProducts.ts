import { useState, useCallback, useEffect } from 'react';
import { EtsyProduct, defaultEtsyProducts } from '@/data/etsy-products';
import { PremiumProduct, defaultPremiumProducts } from '@/data/premium-products';
import { PreMadeItem, preMadeItems as defaultPreMadeItems } from '@/data/premade-items';
import { ServicePage, services as defaultServices } from '@/data/services';

const ETSY_KEY = 'ds_etsy_products_v5';
const PREMIUM_KEY = 'ds_premium_products_v2';
const PREMADE_KEY = 'ds_premade_products_v1';
const SERVICES_KEY = 'ds_services_v2';
const ORDERS_KEY = 'ds_orders';
const INQUIRIES_KEY = 'ds_inquiries';
const LOST_RUNTIME_IMAGES = new Set([
  'codex-image-aug-4-2026-02-19-25-pm-1785962926133-3bb539fa.jpg',
  'setema-img-jpg-1785962934106-d5033425.jpg',
]);

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

function readStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  const serialized = JSON.stringify(value);
  try {
    localStorage.setItem(key, serialized);
  } catch (error) {
    const name = error instanceof DOMException ? error.name : '';
    if (/quota/i.test(name) || error instanceof DOMException) {
      const previous = localStorage.getItem(key);
      try {
        localStorage.removeItem(key);
        localStorage.setItem(key, serialized);
        return;
      } catch {
        if (previous !== null) {
          try {
            localStorage.setItem(key, previous);
          } catch {
            // Keep the original quota error message below.
          }
        }
      }
      throw new Error('Browser storage quota exceeded while saving admin changes');
    }
    throw error;
  }
}

function mirrorStorage(key: string, value: unknown) {
  try {
    writeStorage(key, value);
  } catch {
    // Server-backed admin data should not fail just because browser storage is full.
  }
}

function isBrowserStoredImage(value: string | undefined) {
  return typeof value === 'string' && value.startsWith('data:image/');
}

function isLostRuntimeImage(value: string | undefined) {
  if (!value) return false;
  const filename = value.split('/').pop()?.split(/[?#]/)[0];
  return Boolean(filename && LOST_RUNTIME_IMAGES.has(filename));
}

function recoverLostPreMadeImages(product: PreMadeItem): PreMadeItem {
  const fallback = defaultPreMadeItems.find(item => item.id === product.id);
  const gallery = (product.gallery ?? []).filter(image => !isLostRuntimeImage(image.src));
  const hasTemporaryTestCopy = product.id === 'pre-built-fire-pits' && /testt?\s+test/i.test(product.description);
  return {
    ...product,
    description: hasTemporaryTestCopy ? fallback?.description ?? product.description : product.description,
    image: isLostRuntimeImage(product.image) ? fallback?.image ?? '' : product.image,
    gallery: gallery.length > 0 ? gallery : fallback?.gallery ?? [],
    video: product.video
      ? { ...product.video, poster: isLostRuntimeImage(product.video.poster) ? fallback?.video?.poster ?? '' : product.video.poster }
      : undefined,
    videos: product.videos?.map((video, index) => ({
      ...video,
      poster: isLostRuntimeImage(video.poster) ? fallback?.videos?.[index]?.poster ?? '' : video.poster,
    })),
  };
}

function stripBrowserStoredPreMadeImages(product: PreMadeItem): PreMadeItem {
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

function readLocalPreMadeProducts() {
  return readStorage<PreMadeItem[]>(PREMADE_KEY, defaultPreMadeItems)
    .map(stripBrowserStoredPreMadeImages)
    .map(recoverLostPreMadeImages);
}

async function uploadRecoveredImage(value: string | undefined, filename: string) {
  if (!isBrowserStoredImage(value)) return value ?? '';

  const response = await fetch('/api/admin/images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: value, filename }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.ok === false || !result?.url) {
    throw new Error(result?.error || 'Could not recover a browser-stored image.');
  }
  return String(result.url);
}

async function recoverLocalPreMadeProducts() {
  const stored = readStorage<PreMadeItem[]>(PREMADE_KEY, defaultPreMadeItems);
  const recovered: PreMadeItem[] = [];

  for (const product of stored) {
    recovered.push({
      ...product,
      image: await uploadRecoveredImage(product.image, `${product.id}-image`),
      gallery: await Promise.all((product.gallery ?? []).map(async (image, index) => ({
        ...image,
        src: await uploadRecoveredImage(image.src, `${product.id}-gallery-${index}`),
      }))),
      video: product.video
        ? {
            ...product.video,
            poster: await uploadRecoveredImage(product.video.poster, `${product.id}-video-poster`),
          }
        : undefined,
      videos: await Promise.all((product.videos ?? []).map(async (video, index) => ({
        ...video,
        poster: await uploadRecoveredImage(video.poster, `${product.id}-video-${index}`),
      }))),
    });
  }

  return recovered.map(stripBrowserStoredPreMadeImages).map(recoverLostPreMadeImages);
}

async function readServerPreMadeProducts() {
  const response = await fetch('/api/admin/premade-products');
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.ok === false || !Array.isArray(result?.products)) {
    throw new Error(result?.error || 'Could not load server pre-made products.');
  }
  return (result.products as PreMadeItem[]).map(recoverLostPreMadeImages);
}

async function saveServerPreMadeProducts(products: PreMadeItem[]) {
  const response = await fetch('/api/admin/premade-products', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.ok === false) {
    throw new Error(result?.error || 'Could not save pre-made products on the server.');
  }
}

function readEtsyProducts() {
  const current = readStorage<EtsyProduct[] | null>(ETSY_KEY, null);
  if (current) return current;

  writeStorage(ETSY_KEY, defaultEtsyProducts);
  return defaultEtsyProducts;
}

function mergeServices(stored: ServicePage[]) {
  const storedBySlug = new Map(stored.map(service => [service.slug, service]));
  return defaultServices.map(service => ({
    ...service,
    ...(storedBySlug.get(service.slug) ?? {}),
  }));
}

function readServices() {
  const current = readStorage<ServicePage[] | null>(SERVICES_KEY, null);
  const merged = mergeServices(current ?? defaultServices);
  if (!current) writeStorage(SERVICES_KEY, merged);
  return merged;
}

export function useEtsyProducts() {
  const [products, setProductsState] = useState<EtsyProduct[]>(() =>
    readEtsyProducts()
  );

  const setProducts = useCallback((updated: EtsyProduct[]) => {
    writeStorage(ETSY_KEY, updated);
    setProductsState(updated);
  }, []);

  const addProduct = useCallback((p: EtsyProduct) => {
    setProducts([...readEtsyProducts(), p]);
  }, [setProducts]);

  const updateProduct = useCallback((p: EtsyProduct) => {
    const all = readEtsyProducts();
    setProducts(all.map(x => x.id === p.id ? p : x));
  }, [setProducts]);

  const removeProduct = useCallback((id: string) => {
    const all = readEtsyProducts();
    setProducts(all.filter(x => x.id !== id));
  }, [setProducts]);

  return { products, setProducts, addProduct, updateProduct, removeProduct };
}

export function usePremiumProducts() {
  const [products, setProductsState] = useState<PremiumProduct[]>(() =>
    readStorage<PremiumProduct[]>(PREMIUM_KEY, defaultPremiumProducts)
  );

  const setProducts = useCallback((updated: PremiumProduct[]) => {
    writeStorage(PREMIUM_KEY, updated);
    setProductsState(updated);
  }, []);

  const addProduct = useCallback((p: PremiumProduct) => {
    setProducts([...readStorage<PremiumProduct[]>(PREMIUM_KEY, defaultPremiumProducts), p]);
  }, [setProducts]);

  const updateProduct = useCallback((p: PremiumProduct) => {
    const all = readStorage<PremiumProduct[]>(PREMIUM_KEY, defaultPremiumProducts);
    setProducts(all.map(x => x.id === p.id ? p : x));
  }, [setProducts]);

  const removeProduct = useCallback((id: string) => {
    const all = readStorage<PremiumProduct[]>(PREMIUM_KEY, defaultPremiumProducts);
    setProducts(all.filter(x => x.id !== id));
  }, [setProducts]);

  return { products, setProducts, addProduct, updateProduct, removeProduct };
}

export function usePreMadeProducts() {
  const [products, setProductsState] = useState<PreMadeItem[]>(() => readLocalPreMadeProducts());

  useEffect(() => {
    let cancelled = false;
    readServerPreMadeProducts()
      .then(async serverProducts => {
        if (cancelled) return;
        if (serverProducts.length > 0) {
          setProductsState(serverProducts);
          mirrorStorage(PREMADE_KEY, serverProducts);
          return;
        }

        const localProducts = await recoverLocalPreMadeProducts();
        setProductsState(localProducts);
        mirrorStorage(PREMADE_KEY, localProducts);
        await saveServerPreMadeProducts(localProducts);
      })
      .catch(() => {
        if (!cancelled) setProductsState(readLocalPreMadeProducts());
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setProducts = useCallback(async (updated: PreMadeItem[]) => {
    const cleaned = updated.map(stripBrowserStoredPreMadeImages).map(recoverLostPreMadeImages);
    await saveServerPreMadeProducts(cleaned);
    mirrorStorage(PREMADE_KEY, cleaned);
    setProductsState(cleaned);
  }, []);

  const addProduct = useCallback((p: PreMadeItem) => setProducts([...products, p]), [products, setProducts]);

  const updateProduct = useCallback((p: PreMadeItem) => setProducts(products.map(x => x.id === p.id ? p : x)), [products, setProducts]);

  const removeProduct = useCallback((id: string) => setProducts(products.filter(x => x.id !== id)), [products, setProducts]);

  return { products, setProducts, addProduct, updateProduct, removeProduct };
}

export function useAdminServices() {
  const [services, setServicesState] = useState<ServicePage[]>(() =>
    readServices()
  );

  const setServices = useCallback((updated: ServicePage[]) => {
    const merged = mergeServices(updated);
    writeStorage(SERVICES_KEY, merged);
    setServicesState(merged);
  }, []);

  const updateService = useCallback((service: ServicePage) => {
    const all = readServices();
    setServices(all.map(item => item.slug === service.slug ? service : item));
  }, [setServices]);

  return { services, setServices, updateService };
}

export function saveOrder(order: Omit<Order, 'id' | 'submittedAt'>) {
  const all = readStorage<Order[]>(ORDERS_KEY, []);
  const full: Order = {
    ...order,
    id: `ord_${Date.now()}`,
    submittedAt: new Date().toISOString(),
  };
  localStorage.setItem(ORDERS_KEY, JSON.stringify([full, ...all]));
}

export function getOrders(): Order[] {
  return readStorage<Order[]>(ORDERS_KEY, []);
}

export function saveInquiry(inq: Omit<Inquiry, 'id' | 'submittedAt'>) {
  const all = readStorage<Inquiry[]>(INQUIRIES_KEY, []);
  const full: Inquiry = {
    ...inq,
    id: `inq_${Date.now()}`,
    submittedAt: new Date().toISOString(),
  };
  localStorage.setItem(INQUIRIES_KEY, JSON.stringify([full, ...all]));
}

export function getInquiries(): Inquiry[] {
  return readStorage<Inquiry[]>(INQUIRIES_KEY, []);
}

export function deleteOrder(id: string) {
  const all = readStorage<Order[]>(ORDERS_KEY, []);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(all.filter(o => o.id !== id)));
}

export function deleteInquiry(id: string) {
  const all = readStorage<Inquiry[]>(INQUIRIES_KEY, []);
  localStorage.setItem(INQUIRIES_KEY, JSON.stringify(all.filter(i => i.id !== id)));
}
