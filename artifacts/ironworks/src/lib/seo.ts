import { breadcrumbSchema, websiteSchema } from './seo-structure';
import { useEffect } from 'react';

type SeoInput = {
  enabled?: boolean;
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: string;
  jsonLd?: Record<string, unknown>;
  robots?: string;
};

const defaultImage = '/opengraph.jpg';

function absoluteUrl(path: string) {
  return new URL(path, 'https://dandsironworks.com').toString();
}

function setMeta(name: string, content: string) {
  let tag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setProperty(property: string, content: string) {
  let tag = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setCanonical(url: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function setJsonLd(data?: Record<string, unknown>, id = 'route-json-ld') {
  document.getElementById(id)?.remove();

  if (!data) return;

  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
}

export function useSeo({ enabled = true, title, description, path, image = defaultImage, type = 'website', jsonLd, robots = 'index, follow, max-image-preview:large' }: SeoInput) {
  useEffect(() => {
    if (!enabled) return;
    const canonicalPath = path ?? window.location.pathname;
    const url = absoluteUrl(canonicalPath);
    const imageUrl = absoluteUrl(image);

    document.title = title;
    setMeta('description', description);
    setMeta('robots', robots.includes('noindex') || robots.includes('max-image-preview') ? robots : `${robots}, max-image-preview:large`);
    setProperty('og:title', title);
    setProperty('og:description', description);
    setProperty('og:type', type);
    setProperty('og:url', url);
    setProperty('og:image', imageUrl);
    setProperty('og:site_name', 'D&S Iron Works');
    setProperty('og:locale', 'en_US');
    setProperty('og:image:alt', title.split(' | ')[0]);
    setMeta('twitter:image:alt', title.split(' | ')[0]);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', imageUrl);
    setCanonical(url);
    setJsonLd(jsonLd);
    setJsonLd(websiteSchema, 'site-json-ld');
    setJsonLd(robots.includes('noindex') ? undefined : breadcrumbSchema(canonicalPath, title), 'breadcrumb-json-ld');
  }, [enabled, description, image, jsonLd, path, robots, title, type]);
}
