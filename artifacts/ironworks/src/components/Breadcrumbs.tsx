import { Link } from 'wouter';
import { breadcrumbsFor } from '@/lib/seo-structure';
export function Breadcrumbs({ path, title }: { path: string; title: string }) {
  const items = breadcrumbsFor(path, title);
  return <nav aria-label="Breadcrumb" className="mb-6 text-sm font-sans text-white/60"><ol className="flex flex-wrap gap-x-2 gap-y-1">
    {items.map((item, i) => <li key={item.path} className="inline-flex gap-2">{i > 0 && <span aria-hidden="true">/</span>}
      {i === items.length - 1 ? <span aria-current="page">{item.name}</span> : <Link href={item.path} className="text-orange-300 hover:underline">{item.name}</Link>}
    </li>)}
  </ol></nav>;
}
