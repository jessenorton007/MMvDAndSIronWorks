import seoSourceData from "./seo-source-data.json";
import { readAdminContent } from "./admin-content-store";
import { imageHtml } from './image-html';

type SourceService = (typeof seoSourceData.services)[number];
export type PublicService = { [Key in keyof SourceService]: SourceService[Key] };

export async function readPublicServices(): Promise<PublicService[]> {
  const saved = await readAdminContent("services");
  if (!Array.isArray(saved?.payload)) return seoSourceData.services;
  // Fill newly introduced fields without overwriting saved text or empty arrays.
  return (saved.payload as PublicService[]).map(service => ({
    ...seoSourceData.services.find(item => item.slug === service.slug),
    ...service,
  }));
}

export const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const list = (items: string[]) => `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
const section = (title: string, body: string) => `<section><h2>${escapeHtml(title)}</h2>${body}</section>`;
const internalLink = (path: string, label: string) => path.startsWith("/") && !path.startsWith("//")
  ? `<a href="${escapeHtml(path)}">${escapeHtml(label)}</a>` : escapeHtml(label);

export function serviceDirectoryHtml(services: PublicService[]) {
  return section("Explore Custom Metalwork Services", `<ul>${services.map(service =>
    `<li>${internalLink(`/services/${service.slug}`, service.title)}<p>${escapeHtml(service.summary)}</p></li>`
  ).join("")}</ul>`);
}

export function serviceContentHtml(service: PublicService, services: PublicService[]) {
  const related = (service.relatedSlugs ?? []).flatMap(slug => {
    const item = services.find(candidate => candidate.slug === slug);
    return item ? [`<li>${internalLink(`/services/${item.slug}`, item.title)}</li>`] : [];
  });
  return [
    `<p>${escapeHtml(service.summary)}</p>`,
    section("What This Includes", list(service.details)),
    section("Common Projects", list(service.examples)),
    service.gallery?.length ? section("Real Project Photos", service.gallery.map(photo =>
      `<figure>${imageHtml(photo.src, photo.alt)}</figure>`
    ).join("")) : "",
    service.process?.length ? section("How a Custom Project Starts", `<ol>${service.process.map(step =>
      `<li><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.description)}</p></li>`
    ).join("")}</ol>`) : "",
    service.localServiceNote ? section("Serving Southern Utah", `<p>${escapeHtml(service.localServiceNote)}</p>`) : "",
    service.quoteChecklist?.length ? section("What to Send for a Quote", list(service.quoteChecklist)) : "",
    service.faqs?.length ? section("Common Questions", service.faqs.map(faq =>
      `<h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p>`
    ).join("")) : "",
    service.relatedProducts?.length ? section("Pre-Built Options", service.relatedProducts.map(product => internalLink(product.path, product.label)).join(" ")) : "",
    related.length ? section("Explore Custom Project Types", `<ul>${related.join("")}</ul>`) : "",
    service.slug === 'forged-railings' ? '<section><h2>From the Shop to the Staircase</h2><p>Take a closer look at the branch-like steelwork in the shop and around a wood staircase and upper landing.</p><a href="/projects/forged-stair-balcony-railings">View the stair and balcony railing project</a></section>' : '',
  ].join("");
}
