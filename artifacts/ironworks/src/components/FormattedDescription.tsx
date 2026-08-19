type FormattedDescriptionProps = {
  text: string;
  className?: string;
  paragraphClassName?: string;
};

export function FormattedDescription({
  text,
  className = '',
  paragraphClassName = '',
}: FormattedDescriptionProps) {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return null;

  const inline = (value: string): ReactNode[] => value.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-white/85">{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });

  const blocks: Array<{ type: 'paragraph'; text: string } | { type: 'list'; items: string[] }> = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', text: paragraph.join('\n').trim() });
    paragraph = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ type: 'list', items: list });
    list = [];
  };

  for (const line of normalized.split('\n')) {
    const item = line.match(/^\s*[-*]\s+(.+)$/);
    if (item) {
      flushParagraph();
      list.push(item[1] ?? '');
    } else if (!line.trim()) {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();

  return (
    <div className={className}>
      {blocks.map((block, index) => block.type === 'list' ? (
        <ul key={index} className="list-disc space-y-2 pl-5 marker:text-orange-400/70">
          {block.items.map((item, itemIndex) => <li key={itemIndex}>{inline(item)}</li>)}
        </ul>
      ) : (
        <p key={index} className={`whitespace-pre-line ${paragraphClassName}`}>
          {inline(block.text)}
        </p>
      ))}
    </div>
  );
}
import { Fragment, type ReactNode } from 'react';
