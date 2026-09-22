import source from './seo-source-data.json';
import { readAdminContent } from './admin-content-store';
import { escapeHtml } from './service-content';
import { productSchema, productDescription, publicFeatures, reliableProductDetails, plainText } from './product-seo';
import type { SeoPage } from './seo-pages';
import { resolveProductGuide } from './product-guides';
import { imageHtml } from './image-html';

type PreMade = (typeof source.preMadeItems)[number];
type Etsy = (typeof source.defaultEtsyProducts)[number];
export async function readPublicProducts(key: 'premade-products'): Promise<PreMade[]>;
export async function readPublicProducts(key: 'etsy-products'): Promise<Etsy[]>;
export async function readPublicProducts(key: 'premade-products' | 'etsy-products'): Promise<(PreMade | Etsy)[]> {
  const saved = await readAdminContent(key);
  return Array.isArray(saved?.payload) ? saved.payload : key === 'premade-products' ? source.preMadeItems : source.defaultEtsyProducts;
}
const paragraph = (text: string) => `<p>${escapeHtml(plainText(text))}</p>`;
const list = (items: string[]) => `<ul>${items.map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ul>`;
const section = (title: string, body: string) => `<section><h2>${escapeHtml(title)}</h2>${body}</section>`;

export function preMadeSeo(item: PreMade, products: PreMade[] = source.preMadeItems): SeoPage {
  const path = `/pre-made/${item.id}`;
  const guide = resolveProductGuide(item.id, products);
  const guideHtml = guide ? [
    section('At a Glance', paragraph(guide.summary) + `<dl>${guide.specs.map(spec => `<dt>${escapeHtml(spec.label)}</dt><dd>${escapeHtml(spec.value)}</dd>`).join('')}</dl>` + paragraph('Confirm the current build specifications and included components with Dallan before ordering.')),
    section('Before You Order', guide.faqs.map(faq => `<h3>${escapeHtml(faq.question)}</h3>${paragraph(faq.answer)}`).join('')),
    `<nav aria-label="Related products and services">${guide.related.map(link => `<a href="${escapeHtml(link.path)}">${escapeHtml(link.label)}</a>`).join(' · ')} · <a href="/contact">Ask Dallan a question</a></nav>`,
  ].join('') : '';
  return {
    path, title: `${item.title} | D&S Iron Works Pre-Made Steel`, heading: item.title,
    description: productDescription(item.description), image: item.image, type: 'product',
    jsonLd: productSchema(item, path),
    contentHtml: imageHtml(item.image, item.alt, true) + paragraph(`Price: ${item.priceLabel}`)
      + section('Details', list(publicFeatures(item.features)) + paragraph(item.availability))
      + section('Gallery', item.gallery.map(photo => imageHtml(photo.src, photo.alt)).join(''))
      + section('About This Product', item.description.split(/\n\s*\n/).map(paragraph).join('')) + guideHtml,
  };
}

export function etsySeo(item: Etsy): SeoPage {
  const path = `/shop/${item.id}`;
  return {
    path, title: `${item.title} | D&S Iron Works`, heading: item.title,
    description: productDescription(item.description), image: item.image, type: 'product',
    jsonLd: productSchema(item, path, item.etsyUrl),
    contentHtml: imageHtml(item.image, item.title, true) + paragraph(item.priceLabel) + list(reliableProductDetails(item.details))
      + `<p><a href="${escapeHtml(item.etsyUrl)}" rel="noopener noreferrer">Buy on Etsy</a></p>`
      + paragraph('Confirm the current price, options, and availability on Etsy before purchasing.')
      + section('About This Product', paragraph(item.description))
      + '<p><a href="/services/blacksmith-commissions">Ask about a custom blacksmith commission</a></p>',
  };
}
