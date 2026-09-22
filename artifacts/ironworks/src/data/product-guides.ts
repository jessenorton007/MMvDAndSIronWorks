export type ProductGuide = {
  summary: string;
  specs: { label: string; value: string }[];
  faqs: { question: string; answer: string }[];
  related: { path: string; label: string }[];
};

// Dimensions transcribed from the site's public admin product descriptions, version 8.
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
    specs: [{ label: 'Cooktop overall', value: '16 inches wide × 32 inches long' }, { label: 'Rear griddle', value: '16 inches wide × 18 inches long' }, { label: 'Transport', value: 'Cooktop lifts off the base stove' }],
    faqs: [
      { question: 'What is the difference between the regular Iron Rocket and the XL?', answer: 'The regular model lists a 16 × 32 inch cooktop and 16 × 18 inch rear griddle. The XL lists a 22 × 32 inch cooktop and 22 × 20 inch rear griddle. Choose based on the cooking surface and space you need, and confirm the current build details with Dallan.' },
      { question: 'Does the stove separate for transport?', answer: 'The product description states that the cooktop lifts off the base stove, allowing the two pieces to be transported separately. Ask Dallan for the weight and transport dimensions before planning your setup.' },
      { question: 'What should I check before purchase?', answer: 'Confirm current availability, what is included, finish, total weight, setup instructions, and pickup or shipping costs. Ask Dallan which accessories and cooking surfaces are included in the quoted price.' },
    ],
    related: [{ path: '/pre-made/iron-rocket-xl', label: 'Compare the larger Iron Rocket XL' }, { path: '/pre-made/pre-built-fire-pits', label: 'See pack-flat steel fire pits' }],
  },
  'iron-rocket-xl': {
    summary: 'The Iron Rocket XL is the larger outdoor cooking model, with a wider steel cooktop and rear griddle. Its cooktop lifts off the base for transport.',
    specs: [{ label: 'Cooktop overall', value: '22 inches wide × 32 inches long' }, { label: 'Rear griddle', value: '22 inches wide × 20 inches long' }, { label: 'Transport', value: 'Cooktop lifts off the base stove' }],
    faqs: [
      { question: 'How much larger is the XL cooking surface?', answer: 'The listed XL cooktop is 22 × 32 inches, compared with 16 × 32 inches on the regular Iron Rocket. Its rear griddle is 22 × 20 inches, compared with 16 × 18 inches on the regular model.' },
      { question: 'Can the XL be taken apart for transport?', answer: 'The product description states that the cooktop lifts off the base stove. Confirm the weight and dimensions of each part with Dallan to plan loading and transport.' },
      { question: 'How do I choose the right model?', answer: 'Compare the listed cooking surfaces, available outdoor space, and transport needs. Contact Dallan to confirm the current configuration, included components, price, and availability before ordering.' },
    ],
    related: [{ path: '/pre-made/iron-rocket-stove', label: 'Compare the regular Iron Rocket Stove' }, { path: '/services/custom-ironwork-utah', label: 'Discuss custom steel projects' }],
  },
};
