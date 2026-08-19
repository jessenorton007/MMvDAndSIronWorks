type GaEventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const defaultMeasurementId = 'G-QW2GMHN0GZ';
const measurementId = String(import.meta.env.VITE_GA4_MEASUREMENT_ID ?? defaultMeasurementId).trim();
const isConfigured = /^G-[A-Z0-9]+$/i.test(measurementId);

export function initGa4() {
  if (!isConfigured || typeof window === 'undefined' || window.gtag) return false;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: true });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
  return true;
}

export function trackGaEvent(name: string, params: GaEventParams = {}) {
  if (!isConfigured || typeof window === 'undefined') return;
  window.gtag?.('event', name, params);
}

export function ga4Status() {
  return { configured: isConfigured, measurementId: isConfigured ? measurementId : '' };
}
