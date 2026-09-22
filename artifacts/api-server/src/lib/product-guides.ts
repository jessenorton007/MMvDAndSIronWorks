export type ProductGuide = {
  summary: string;
  specs: { label: string; value: string }[];
  faqs: { question: string; answer: string }[];
  related: { path: string; label: string }[];
};

// Buying advice is editorial; specifications below are resolved from current saved descriptions.
export const productGuides: Record<string, ProductGuide> = {
  'pre-built-fire-pits': {
    summary: 'A portable steel fire pit with wildlife cutouts and pack-flat panels. Compare the photos and assembly video, then confirm current availability with Dallan.',
    specs: [{ label: 'Design', value: 'Wildlife cutout panels' }, { label: 'Setup', value: 'Pack-flat panel construction' }],
    faqs: [
      { question: 'How does the fire pit pack for transport?', answer: 'The panel design packs flat. The assembly video on this page shows how the panels fit together, and the walkaround shows the assembled fire pit.' },
      { question: 'Can I order a different design?', answer: 'For a personalized name, ranch theme, or different design, visit Custom Fire Pits and discuss the project with Dallan. Confirm the dimensions, finish, price, and timing for that custom build.' },
      { question: 'What should I confirm before ordering?', answer: 'Ask about current availability, assembled dimensions, packed size, weight, included parts, and pickup or shipping arrangements. These details help you decide whether the fire pit fits your space and transport plans.' },
    ],
    related: [{ path: '/services/custom-fire-pits', label: 'Plan a custom fire pit' }, { path: '/pre-made/iron-rocket-stove', label: 'Explore the Iron Rocket cooking stove' }],
  },
  'iron-rocket-stove': {
    summary: 'The regular Iron Rocket is a wood-fed outdoor cooking stove with a steel cooktop, rear griddle, and a cooktop that lifts off the base for transport.',
    specs: [],
    faqs: [
      { question: 'What is the difference between the regular Iron Rocket and the XL?', answer: 'Compare the current dimensions and included components with Dallan before choosing.' },
      { question: 'Does the stove separate for transport?', answer: 'The product description states that the cooktop lifts off the base stove, allowing the two pieces to be transported separately. Ask Dallan for the weight and transport dimensions before planning your setup.' },
      { question: 'What should I check before purchase?', answer: 'Confirm current availability, what is included, finish, total weight, setup instructions, and pickup or shipping costs. Ask Dallan which accessories and cooking surfaces are included in the quoted price.' },
    ],
    related: [{ path: '/pre-made/iron-rocket-xl', label: 'Compare the larger Iron Rocket XL' }, { path: '/pre-made/pre-built-fire-pits', label: 'See pack-flat steel fire pits' }],
  },
  'iron-rocket-xl': {
    summary: 'The Iron Rocket XL is the larger outdoor cooking model, with a wider steel cooktop and rear griddle. Its cooktop lifts off the base for transport.',
    specs: [],
    faqs: [
      { question: 'How much larger is the XL cooking surface?', answer: 'Compare the current dimensions and included components with Dallan before choosing.' },
      { question: 'Can the XL be taken apart for transport?', answer: 'The product description states that the cooktop lifts off the base stove. Confirm the weight and dimensions of each part with Dallan to plan loading and transport.' },
      { question: 'How do I choose the right model?', answer: 'Compare the listed cooking surfaces, available outdoor space, and transport needs. Contact Dallan to confirm the current configuration, included components, price, and availability before ordering.' },
    ],
    related: [{ path: '/pre-made/iron-rocket-stove', label: 'Compare the regular Iron Rocket Stove' }, { path: '/services/custom-ironwork-utah', label: 'Discuss custom steel projects' }],
  },
};

export type GuideProduct = { id: string; title: string; description: string; videos?: unknown[] };

// Only extract the explicit dimension wording used by the product descriptions.
// Unrecognized or absent specifications are omitted, never guessed.
export function cookingSpecs(description: string) {
  const text = description.replace(/\*+/g, '');
  const cooktop = text.match(/cooktop measuring\s+(\d+(?:\.\d+)?) inches wide by (\d+(?:\.\d+)?) inches long/i);
  const griddle = text.match(/griddle[—–:\s-]+(\d+(?:\.\d+)?) inches wide by (\d+(?:\.\d+)?) inches long/i);
  const specs: ProductGuide['specs'] = [];
  if (cooktop) specs.push({ label: 'Cooktop overall', value: `${cooktop[1]} inches wide × ${cooktop[2]} inches long` });
  if (griddle) specs.push({ label: 'Rear griddle', value: `${griddle[1]} inches wide × ${griddle[2]} inches long` });
  if (/\bcooktop lifts (?:completely )?off the base stove\b/i.test(text)) specs.push({ label: 'Transport', value: 'Cooktop lifts off the base stove' });
  return specs;
}

export function resolveProductGuide(id: string, products: GuideProduct[]): ProductGuide | undefined {
  const base = productGuides[id];
  const item = products.find(product => product.id === id);
  if (!base || !item) return undefined;
  const guide: ProductGuide = { ...base, specs: [...base.specs], faqs: base.faqs.map(faq => ({ ...faq })),
    related: base.related.filter(link => !link.path.startsWith('/pre-made/') || products.some(product => `/pre-made/${product.id}` === link.path)) };
  if (id === 'pre-built-fire-pits') {
    if (!item.videos?.length) guide.faqs[0].answer = 'Ask Dallan how the panels assemble and pack for transport, and confirm the packed dimensions and weight before ordering.';
    return guide;
  }
  guide.specs = cookingSpecs(item.description);
  guide.summary = `Compare ${item.title.trim()}'s current product description, listed specifications, and photos when planning your outdoor cooking setup.`;
  const otherId = id === 'iron-rocket-stove' ? 'iron-rocket-xl' : 'iron-rocket-stove';
  const other = products.find(product => product.id === otherId);
  const dimensions = (product: GuideProduct) => cookingSpecs(product.description).filter(spec => spec.label !== 'Transport').map(spec => `${spec.label.toLowerCase()}: ${spec.value}`).join('; ');
  const ownDimensions = dimensions(item);
  const otherDimensions = other && dimensions(other);
  guide.faqs[0].answer = ownDimensions && otherDimensions
    ? `${item.title.trim()} lists ${ownDimensions}. ${other!.title.trim()} lists ${otherDimensions}. Confirm the current build details and included components with Dallan before choosing.`
    : 'Compare the current product descriptions and ask Dallan for the cooking-surface dimensions, included components, and available models before choosing.';
  guide.faqs[1].answer = guide.specs.some(spec => spec.label === 'Transport')
    ? 'The current product description states that the cooktop lifts off the base stove. Ask Dallan for the weight and transport dimensions of each part before planning your setup.'
    : 'Ask Dallan whether the current build separates for transport, and confirm the weight and dimensions of each part before planning your setup.';
  return guide;
}
