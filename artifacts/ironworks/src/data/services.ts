export type ServicePage = {
  slug: string;
  title: string;
  shortTitle: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  heroImage: string;
  gallery?: { src: string; alt: string }[];
  summary: string;
  details: string[];
  examples: string[];
  process?: { title: string; description: string }[];
  localServiceNote?: string;
  relatedSlugs?: string[];
};

export const services: ServicePage[] = [
  {
    slug: 'custom-ironwork-utah',
    title: 'Custom Ironwork & Metal Projects',
    shortTitle: 'Custom Ironwork',
    metaTitle: 'Custom Ironwork & Metal Projects in Southern Utah | D&S Iron Works',
    metaDescription: 'Plan custom ironwork with Dallan Goff at D&S Iron Works, including forged railings, fire pits, signs, furniture, metal art, and one-of-a-kind steel projects in Southern Utah.',
    eyebrow: 'Built by Hand',
    heroImage: '/images/iron-table.jpg',
    gallery: [
      { src: '/images/iron-table.jpg', alt: 'Custom forged iron table built by D&S Iron Works' },
      { src: '/images/client-upload-railings/railing-install-main.jpg', alt: 'Custom forged stair and balcony railing installed in a Utah home' },
      { src: '/images/custom-sign-bealer.jpg', alt: 'Personalized steel sign made by D&S Iron Works' },
    ],
    summary: 'D&S Iron Works plans and builds functional and decorative ironwork for homes, cabins, ranches, businesses, and gathering spaces across Southern and central Utah.',
    details: [
      'Direct project planning with Dallan Goff',
      'Hand-forged and plasma-cut steel details',
      'Custom work for indoor, outdoor, decorative, and functional pieces',
    ],
    examples: ['Fire pits', 'Forged railings', 'Custom knives', 'Custom signs', 'Tables and furniture', 'Metal wall art'],
    process: [
      { title: 'Share the idea', description: 'Bring a sketch, reference photo, measurements, or a rough concept for the space and intended use.' },
      { title: 'Plan it with Dallan', description: 'Discuss scale, steel details, finish, installation needs, and the practical requirements of the piece directly with Dallan.' },
      { title: 'Build and finish', description: 'The project is forged, formed, cut, assembled, and finished in the D&S Iron Works shop.' },
    ],
    localServiceNote: 'D&S Iron Works serves customers throughout Southern and central Utah, including Cedar City, St. George, Beaver, Hurricane, and surrounding communities. Project fit and travel requirements are confirmed during the initial conversation.',
    relatedSlugs: ['forged-railings', 'custom-fire-pits', 'custom-metal-signs', 'forged-metal-art', 'blacksmith-commissions'],
  },
  {
    slug: 'custom-fire-pits',
    title: 'Custom Fire Pits',
    shortTitle: 'Fire Pits',
    metaTitle: 'Custom Fire Pits | Hand-Forged Metal Fire Pits in Utah',
    metaDescription: 'Custom steel fire pits by D&S Iron Works, including plasma-cut designs, ranch themes, outdoor gathering pieces, and hand-finished metalwork.',
    eyebrow: 'Outdoor Ironwork',
    heroImage: '/images/fire-pit-real.jpg',
    summary: 'Custom fire pits are built for outdoor gathering spaces with durable steel, clean cutouts, and details that fit the owner.',
    details: [
      'Personalized cutout designs and themes',
      'Heavy steel construction for outdoor use',
      'Designed for patios, ranches, cabins, and gathering areas',
    ],
    examples: ['Ranch fire pits', 'Family-name fire pits', 'Wildlife cutouts', 'Cabin fire features'],
  },
  {
    slug: 'forged-railings',
    title: 'Forged Railings',
    shortTitle: 'Railings',
    metaTitle: 'Forged Railings | Custom Metal Stair and Hand Railings',
    metaDescription: 'Custom forged railings, stair rails, balcony guards, and handrails by D&S Iron Works with hand-shaped metal details.',
    eyebrow: 'Architectural Iron',
    heroImage: '/images/client-upload-railings/railing-install-main.jpg',
    gallery: [
      {
        src: '/images/client-upload-railings/railing-stair-install.jpg',
        alt: 'Finished hand-forged stair railing installed beside a wood staircase',
      },
      {
        src: '/images/client-upload-railings/railing-install-main.jpg',
        alt: 'Custom hand-forged stair and balcony railing installed in a home',
      },
      {
        src: '/images/client-upload-railings/railing-balcony-install.jpg',
        alt: 'Installed forged balcony railing with organic steel balusters',
      },
      {
        src: '/images/client-upload-railings/railing-stair-finished.jpg',
        alt: 'Finished interior stair railing with hand-forged steel detail',
      },
      {
        src: '/images/client-upload-railings/railing-shop-progress.jpg',
        alt: 'Custom forged railing section in the D&S Iron Works shop',
      },
      {
        src: '/images/client-upload-railings/railing-detail.jpg',
        alt: 'Close detail of forged railing balusters before installation',
      },
    ],
    summary: 'Forged railings bring strength and craft into stairways, entries, balconies, and interior spaces.',
    details: [
      'Custom railing layouts for interior and exterior projects',
      'Hand-forged details matched to the space',
      'Designed for long-term use and a strong visual presence',
    ],
    examples: ['Stair railings', 'Balcony guards', 'Interior handrails', 'Entry railings'],
  },
  {
    slug: 'hand-forged-knives',
    title: 'Hand-Forged Knives',
    shortTitle: 'Knives',
    metaTitle: 'Hand-Forged Knives | Custom Forged Blades by D&S Iron Works',
    metaDescription: 'Hand-forged knives and custom blade commissions by D&S Iron Works, including forged steel details, functional builds, and display pieces.',
    eyebrow: 'Forged Blades',
    heroImage: '/images/hand-forged-knives.jpg',
    summary: 'Hand-forged knives are built as custom blade projects with shop-forged steel character, handle planning, and a direct conversation about the intended use or display.',
    details: [
      'Custom knife and blade concepts planned with Dallan',
      'Forged steel work with handmade finish and character',
      'Options for functional outdoor use, gifts, or display pieces',
    ],
    examples: ['Custom knives', 'Camp knives', 'Display blades', 'Forged gifts'],
  },
  {
    slug: 'custom-metal-signs',
    title: 'Custom Metal Signs',
    shortTitle: 'Metal Signs',
    metaTitle: 'Custom Metal Signs | Ranch, Address, and Personalized Steel Signs',
    metaDescription: 'Custom metal signs from D&S Iron Works, including personalized ranch signs, address plaques, wall art, and plasma-cut steel designs.',
    eyebrow: 'Personalized Steel',
    heroImage: '/images/custom-sign-bealer.jpg',
    summary: 'Custom metal signs turn names, brands, ranch marks, and family ideas into durable steel pieces.',
    details: [
      'Personalized names, ranch themes, and address designs',
      'Plasma-cut steel with hand-finished character',
      'Indoor and outdoor sign options',
    ],
    examples: ['Ranch signs', 'Address signs', 'Family-name signs', 'Wall art signs'],
  },
  {
    slug: 'forged-metal-art',
    title: 'Forged Metal Art',
    shortTitle: 'Metal Art',
    metaTitle: 'Forged Metal Art | Custom Sculptural Ironwork by D&S Iron Works',
    metaDescription: 'Forged metal art, tree sculptures, candelabras, wall pieces, hooks, bells, and decorative ironwork by D&S Iron Works in Utah.',
    eyebrow: 'Sculptural Iron',
    heroImage: '/images/tree-of-life.jpg',
    summary: 'Forged metal art gives a room, entry, cabin, or ranch a handmade piece with weight, texture, and story.',
    details: [
      'One-of-a-kind sculptural and decorative work',
      'Forged leaves, trees, hooks, bells, candelabras, and wall pieces',
      'Designed from a sketch, reference photo, idea, or theme',
    ],
    examples: ['Tree of Life sculptures', 'Candelabras', 'Decorative hooks', 'Forged bells', 'Wall art'],
  },
  {
    slug: 'blacksmith-commissions',
    title: 'Blacksmith Commissions',
    shortTitle: 'Commissions',
    metaTitle: 'Blacksmith Commissions | Custom Hand-Forged Metalwork',
    metaDescription: 'Start a custom blacksmith commission with Dallan Goff at D&S Iron Works for hand-forged art, furniture, fire pits, signs, railings, and gifts.',
    eyebrow: 'Start a Piece',
    heroImage: '/images/hammering-maple-leaf-poster.jpg',
    summary: 'Commission work starts with a direct conversation about the idea, the space, the use, and the look of the finished piece.',
    details: [
      'Bring a sketch, photo, measurements, or rough idea',
      'Direct communication with Dallan from concept to build',
      'Useful for gifts, home projects, ranch work, and statement pieces',
    ],
    examples: ['Custom gifts', 'Forged furniture', 'Metal art', 'Fireplace tools', 'Functional ironwork'],
  },
];

export const getService = (slug: string | undefined) => services.find((service) => service.slug === slug);
