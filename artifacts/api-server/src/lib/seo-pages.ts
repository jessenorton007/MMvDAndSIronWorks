import seoSourceData from "./seo-source-data.json";

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
};

const absoluteUrl = (value: string) => value.startsWith("http") ? value : `${SITE_ORIGIN}${value}`;

const localBusiness = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
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
  },
  {
    path: "/admin",
    title: "D&S Iron Works Administration",
    description: "Authorized D&S Iron Works administration access.",
    heading: "D&S Iron Works Administration",
    robots: "noindex, nofollow, noarchive",
  },
];

const servicePages: SeoPage[] = services.map((service) => ({
  path: `/services/${service.slug}`,
  title: service.metaTitle,
  description: service.metaDescription,
  heading: service.title,
  image: service.heroImage,
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.metaDescription,
    url: `${SITE_ORIGIN}/services/${service.slug}`,
    provider: {
      "@type": "LocalBusiness",
      name: "D&S Iron Works",
      telephone: "+1-435-421-9033",
    },
    areaServed: "Utah",
    serviceType: service.title,
  },
}));

const preMadePages: SeoPage[] = preMadeItems.map((item) => ({
  path: `/pre-made/${item.id}`,
  title: `${item.title} | D&S Iron Works Pre-Made Steel`,
  description: item.description,
  heading: item.title,
  image: item.image,
  type: "product",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.title,
    description: item.description,
    image: absoluteUrl(item.image),
    brand: { "@type": "Brand", name: "D&S Iron Works" },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: item.priceLabel.replace(/[$,]/g, ""),
      url: `${SITE_ORIGIN}/pre-made/${item.id}`,
    },
  },
}));

const etsyPages: SeoPage[] = defaultEtsyProducts.map((product) => ({
  path: `/shop/${product.id}`,
  title: `${product.title} | D&S Iron Works`,
  description: product.description,
  heading: product.title,
  image: product.image,
  type: "product",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: absoluteUrl(product.image),
    brand: { "@type": "Brand", name: "D&S Iron Works" },
    offers: { "@type": "Offer", url: product.etsyUrl },
  },
}));

const pages = new Map(
  [...staticPages, ...servicePages, ...preMadePages, ...etsyPages].map((page) => [page.path, page]),
);

export function getSeoPage(pathname: string) {
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
