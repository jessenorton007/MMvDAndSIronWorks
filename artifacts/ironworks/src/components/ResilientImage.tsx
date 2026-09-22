import optimizedImages from '@/data/optimized-images.json';
import { useEffect, useState, type ImgHTMLAttributes } from 'react';

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
};

export function ResilientImage({ src, fallbackSrc, onError, onLoad, ...props }: Props) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => setCurrentSrc(src), [src]);

  const variants = optimizedImages[currentSrc as keyof typeof optimizedImages];
  const optimized = variants?.[variants.length - 1];
  const [originalOnly, setOriginalOnly] = useState(false);
  useEffect(() => setOriginalOnly(false), [currentSrc]);
  return (
    <img
      {...props}
      src={!originalOnly && optimized ? optimized.src : currentSrc}
      srcSet={!originalOnly && variants ? variants.map(image => `${image.src} ${image.width}w`).join(', ') : props.srcSet}
      sizes={props.sizes ?? '(max-width: 767px) 100vw, 50vw'}
      decoding={props.decoding ?? 'async'}
      loading={props.loading ?? 'lazy'}
      onLoad={(event) => {
        event.currentTarget.style.display = '';
        onLoad?.(event);
      }}
      onError={(event) => {
        if (optimized && !originalOnly) { setOriginalOnly(true); return; }
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
          return;
        }
        event.currentTarget.style.display = 'none';
        onError?.(event);
      }}
    />
  );
}
