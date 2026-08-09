export type PreMadeItem = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  image: string;
  alt: string;
  priceLabel: string;
  gallery: { src: string; alt: string }[];
  video?: {
    src: string;
    poster: string;
    label: string;
  };
  paymentUrl?: string;
  videos?: {
    src: string;
    poster: string;
    title: string;
    description: string;
    aspect: 'wide' | 'portrait';
  }[];
  features: string[];
  availability: string;
};

export const preMadeItems: PreMadeItem[] = [
  {
    id: 'pre-built-fire-pits',
    title: 'Pre-Built Fire Pits',
    eyebrow: 'Ready for Camp',
    description:
      'Heavy steel fire pits with cut wildlife details, outdoor-ready construction, and the same D&S shop finish as custom work.',
    image: '/images/premade-fire-pit-sunset.jpg',
    alt: 'Portable steel fire pit with deer cutout panels',
    priceLabel: '$375',
    paymentUrl: 'https://connect.intuit.com/pay/DAndSIronWorksLlc/scs-v1-182eed4f16ef4dc4bbeee73b7ed815324ca44c73fd494477b9700a2b0e77fe845b8269d566cf4bfda2d4572bf26b77d1-0?locale=EN_US&cta=saveandcopylink',
    gallery: [
      {
        src: '/images/premade-fire-pit-sunset.jpg',
        alt: 'Portable deer-panel fire pit photographed at sunset in Utah',
      },
      {
        src: '/images/premade-fire-pit-real-front.jpg',
        alt: 'Finished portable steel fire pit with deer cutout panels',
      },
      {
        src: '/images/premade-fire-pit-camp.jpg',
        alt: 'Pre-built steel fire pit with flame and deer cutout panels',
      },
      {
        src: '/images/premade-fire-pit-cabin.jpg',
        alt: 'Pre-built fire pit burning beside a camp tent',
      },
    ],
    video: {
      src: '/images/premade-fire-pit-showcase.mp4',
      poster: '/images/premade-fire-pit-video-poster.jpg',
      label: 'Pre-built fire pit showcase video',
    },
    videos: [
      {
        src: '/images/portable-fire-pit-walkaround.mp4',
        poster: '/images/portable-fire-pit-walkaround-poster.jpg',
        title: 'Portable Fire Pit Walkaround',
        description: 'A closer look at the finished deer-panel fire pit body, base, and steel proportions.',
        aspect: 'wide',
      },
      {
        src: '/images/portable-fire-pit-assembly.mp4',
        poster: '/images/portable-fire-pit-assembly-poster.jpg',
        title: 'Pack-Flat Assembly',
        description: 'Panel layout and setup view showing how the portable fire pit comes together.',
        aspect: 'portrait',
      },
    ],
    features: ['Pack-flat panels', 'Wildlife cut details', 'Portable outdoor setup'],
    availability: 'Ask what is ready now or reserve the next batch.',
  },
  {
    id: 'iron-rocket-stove',
    title: 'Iron Rocket Stove',
    eyebrow: 'Regular Size',
    description:
      'Regular-size wood-fed rocket stove with flat-top cooking space, griddle options, and efficient firebox heat for camp cooking.',
    image: '/images/iron-rocket-sunset-full.jpg',
    alt: 'Iron Rocket Stove with griddle cooking food outdoors',
    priceLabel: '$2,020',
    paymentUrl: 'https://connect.intuit.com/pay/DAndSIronWorksLlc/scs-v1-99e7ec3cef364562a04c8801e07a0a08c9e5dddec37b4f5bb3d58c9183ee65eca0bbb3ac91e24e1d93393564c236de8c-0?locale=EN_US&cta=saveandcopylink',
    gallery: [
      {
        src: '/images/iron-rocket-sunset-full.jpg',
        alt: 'Complete D and S Iron Works rocket stove photographed at sunset',
      },
      {
        src: '/images/iron-rocket-full.jpg',
        alt: 'Full Iron Rocket Stove with cooktop, chimney, and firebox',
      },
      {
        src: '/images/iron-rocket-sunset-close.jpg',
        alt: 'Iron Rocket Stove branded firebox in front of a Utah sunset',
      },
      {
        src: '/images/iron-rocket-branded-firebox.jpg',
        alt: 'Close view of D and S Iron Works branded rocket stove firebox',
      },
      {
        src: '/images/iron-rocket-cooktop.jpg',
        alt: 'Iron Rocket Stove flat cooking and griddle surfaces',
      },
      {
        src: '/images/premade-rocket-stove-griddle.jpg',
        alt: 'Iron Rocket Stove griddle cooking meat and potatoes',
      },
      {
        src: '/images/premade-rocket-stove-cooking.jpg',
        alt: 'Iron Rocket Stove burning wood below a flat cooking top',
      },
      {
        src: '/images/premade-rocket-stove-branded-side.jpg',
        alt: 'D and S Iron Works Iron Rocket Stove side plate and firebox detail',
      },
      {
        src: '/images/premade-rocket-stove-firebox.jpg',
        alt: 'Close view of Iron Rocket Stove firebox and chimney',
      },
      {
        src: '/images/premade-rocket-stove-logo-detail.jpg',
        alt: 'Branded D and S Iron Works Iron Rocket Stove side detail',
      },
    ],
    features: ['Wood-fed firebox', 'Flat-top cooking surface', 'Portable outdoor setup'],
    availability: 'Built in small runs. Call or text for current availability.',
  },
  {
    id: 'iron-rocket-xl',
    title: 'Iron Rocket XL',
    eyebrow: 'Large Size',
    description:
      'Large wood-fed rocket stove with more cooking surface, a bigger outdoor footprint, and the same rugged D&S steel build.',
    image: '/images/iron-rocket-full.jpg',
    alt: 'Iron Rocket XL outdoor cooking rocket stove',
    priceLabel: '$2,320',
    paymentUrl: 'https://connect.intuit.com/pay/DAndSIronWorksLlc/scs-v1-85749b09e6144582b26bf90f889c6422142301ef619b49a4bdf622cc8ee2576c837621eb4ded404abb73314dbcca41fa-0?locale=EN_US&cta=saveandcopylink',
    gallery: [
      {
        src: '/images/iron-rocket-full.jpg',
        alt: 'Full Iron Rocket XL with cooktop, chimney, and firebox',
      },
      {
        src: '/images/iron-rocket-sunset-full.jpg',
        alt: 'D and S Iron Works rocket stove and large cooktop at sunset',
      },
      {
        src: '/images/iron-rocket-cooktop.jpg',
        alt: 'Large flat cooking and griddle surfaces on an Iron Rocket stove',
      },
      {
        src: '/images/iron-rocket-branded-firebox.jpg',
        alt: 'D and S Iron Works branded wood-fed firebox detail',
      },
      {
        src: '/images/premade-rocket-stove-cooking.jpg',
        alt: 'Iron Rocket XL burning wood below a flat cooking top',
      },
      {
        src: '/images/premade-rocket-stove-griddle.jpg',
        alt: 'Iron Rocket XL griddle cooking meat and potatoes',
      },
      {
        src: '/images/premade-rocket-stove-firebox.jpg',
        alt: 'Close view of Iron Rocket XL firebox and chimney',
      },
      {
        src: '/images/premade-rocket-stove-branded-side.jpg',
        alt: 'D and S Iron Works Iron Rocket XL side plate and firebox detail',
      },
      {
        src: '/images/premade-rocket-stove-logo-detail.jpg',
        alt: 'Branded D and S Iron Works Iron Rocket XL side detail',
      },
    ],
    features: ['Larger cooking surface', 'Wood-fed firebox', 'Heavy steel build'],
    availability: 'Built in small runs. Call or text for current availability.',
  },
];

export const getPreMadeItem = (id: string | undefined) => preMadeItems.find((item) => item.id === id);
