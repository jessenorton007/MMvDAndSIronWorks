import { preMadeSeo, etsySeo } from "./product-content";
import seoSourceData from "./seo-source-data.json";
import { serviceContentHtml, serviceDirectoryHtml, escapeHtml, type PublicService } from "./service-content";
import { imageHtml } from './image-html';

const { defaultEtsyProducts, preMadeItems, services } = seoSourceData;

export const SITE_ORIGIN = "https://dandsironworks.com";

export type SeoPage = {
  path: string;
  title: string;
  description: string;
  heading: string;
  image?: string;
  robots?: string;
  type?: "website" | "product";
  jsonLd?: Record<string, unknown>;
  contentHtml?: string;
};

const absoluteUrl = (value: string) => value.startsWith("http") ? value : `${SITE_ORIGIN}${value}`;

const localBusiness = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_ORIGIN}/#business`,
  name: "D&S Iron Works",
  description: "Custom ironwork, forged metal art, pre-built fire pits, rocket stoves, railings, signs, and hand-forged goods by Dallan Goff.",
  url: `${SITE_ORIGIN}/`,
  image: `${SITE_ORIGIN}/opengraph.jpg`,
  telephone: "+1-435-421-9033",
  email: "dandsiron@yahoo.com",
  areaServed: "Utah",
  sameAs: [
    "https://www.facebook.com/DallanGoffBlacksmith",
    "https://www.etsy.com/shop/dandsironworks",
  ],
};

const staticPages: SeoPage[] = [
  {
    path: "/",
    title: "D&S Iron Works | Custom Ironwork, Fire Pits & Rocket Stoves in Utah",
    description: "D&S Iron Works by Dallan Goff creates custom ironwork, pre-built fire pits, rocket stoves, metal signs, forged railings, sculptural ironwork, and hand-forged goods in Utah.",
    heading: "Custom Ironwork by D&S Iron Works",
    image: "/opengraph.jpg",
    jsonLd: localBusiness,
  },
  {
    path: "/services",
    title: "Custom Ironwork, Fire Pits, Railings & Metal Signs in Utah | D&S Iron Works",
    description: "Explore D&S Iron Works custom metalwork services: custom ironwork, fire pits, forged railings, metal signs, forged metal art, knives, and blacksmith commissions in Utah.",
    heading: "Custom Metalwork Services in Utah",
    image: "/images/iron-table.jpg",
  },
  {
    path: "/contact",
    title: "Contact D&S Iron Works | Custom Ironwork & Pre-Made Fire Pits",
    description: "Contact Dallan Goff about custom ironwork, pre-built fire pits, Iron Rocket outdoor cooking stoves, railings, signs, forged art, or blacksmith commissions in Utah.",
    heading: "Contact D&S Iron Works",
    image: "/opengraph.jpg",
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'ContactPage',
      name: 'Contact D&S Iron Works', url: `${SITE_ORIGIN}/contact`,
      mainEntity: localBusiness,
    },
    contentHtml: '<p>Have an idea, a sketch, or just a feeling? Reach out to Dallan directly.</p>'
      + '<h2>Contact Dallan Goff</h2><ul>'
      + '<li><a href="tel:+14354219033">Call (435) 421-9033</a></li>'
      + '<li><a href="sms:+14354219033">Text (435) 421-9033</a></li>'
      + '<li><a href="mailto:dandsiron@yahoo.com">Email dandsiron@yahoo.com</a></li>'
      + '<li><a href="https://www.facebook.com/DallanGoffBlacksmith">Dallan Goff Blacksmith on Facebook</a></li></ul>',
  },
  {
    path: "/admin",
    title: "D&S Iron Works Administration",
    description: "Authorized D&S Iron Works administration access.",
    heading: "D&S Iron Works Administration",
    robots: "noindex, nofollow, noarchive",
  },
];

const servicePage = (service: PublicService, allServices: PublicService[]): SeoPage => ({
  path: `/services/${service.slug}`,
  title: service.metaTitle,
  description: service.metaDescription,
  heading: service.title,
  image: service.heroImage,
  contentHtml: serviceContentHtml(service, allServices),
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.metaDescription,
    url: `${SITE_ORIGIN}/services/${service.slug}`,
    provider: {
      "@type": "LocalBusiness",
      "@id": `${SITE_ORIGIN}/#business`,
      name: "D&S Iron Works",
      telephone: "+1-435-421-9033",
    },
    areaServed: "Utah",
    serviceType: service.title,
  },
});

const servicePages = services.map(service => servicePage(service, services));

const preMadePages = preMadeItems.map(item => preMadeSeo(item));
const etsyPages = defaultEtsyProducts.map(etsySeo);

const pages = new Map(
  [...staticPages, ...servicePages, ...preMadePages, ...etsyPages].map((page) => [page.path, page]),
);

export function getSeoPage(pathname: string, publicServices: PublicService[] = services) {
  const project = seoSourceData.railingProject;
  if (pathname === project.path) {
    return {
      path: project.path, title: `${project.title} | D&S Iron Works Project`, heading: project.title,
      description: project.description, image: project.sections[0].image,
      jsonLd: { '@context': 'https://schema.org', '@type': 'WebPage', name: project.title, description: project.description, url: `${SITE_ORIGIN}${project.path}` },
      contentHtml: `<p>${escapeHtml(project.intro)}</p>` + project.sections.map((section, index) => `<section>${imageHtml(section.image, section.alt, index === 0)}<h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.text)}</p></section>`).join('')
        + `<section><h2>Planning Your Own Railing</h2><p>${escapeHtml(project.planning)}</p><a href="/services/forged-railings">Explore the railing service</a></section>`,
    };
  }
  if (pathname === "/services") {
    return { ...pages.get(pathname)!, contentHtml: serviceDirectoryHtml(publicServices) };
  }
  if (pathname.startsWith("/services/")) {
    const service = publicServices.find(item => `/services/${item.slug}` === pathname);
    return service ? servicePage(service, publicServices) : undefined;
  }
  return pages.get(pathname);
}

export function notFoundSeo(pathname: string): SeoPage {
  return {
    path: pathname,
    title: "Page Not Found | D&S Iron Works",
    description: "The requested D&S Iron Works page could not be found.",
    heading: "Page Not Found",
    robots: "noindex, nofollow",
  };
}
