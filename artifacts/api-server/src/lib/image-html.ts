import source from './seo-source-data.json';

const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export function imageHtml(src: string, alt: string, eager = false) {
  const variants = source.optimizedImages[src as keyof typeof source.optimizedImages];
  const image = variants?.[variants.length - 1];
  const responsive = image ? ` srcset="${variants.map(variant => `${escape(variant.src)} ${variant.width}w`).join(', ')}" sizes="(max-width: 767px) 100vw, 50vw" width="${image.width}" height="${image.height}"` : '';
  return `<img src="${escape(image?.src ?? src)}" alt="${escape(alt)}"${responsive} loading="${eager ? 'eager' : 'lazy'}"${eager ? ' fetchpriority="high"' : ''} decoding="async" style="max-width:100%;height:auto" />`;
}
