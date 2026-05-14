import { type ImgHTMLAttributes, useEffect, useState } from 'react';
import {
  MOTORCYCLE_IMAGE_FALLBACK_LABEL,
  getMotorcycleImage,
  type MotorcycleImageSource,
} from '../../../shared/images/getMotorcycleImage';
import './MotorcycleImage.scss';

type MotorcycleImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt' | 'src'> &
  Readonly<{
    alt?: string;
    decorative?: boolean;
    motorcycle: MotorcycleImageSource;
  }>;

export function MotorcycleImage({ alt, className, decorative = false, motorcycle, onError, ...imageProps }: MotorcycleImageProps) {
  const [hasLoadError, setHasLoadError] = useState(false);
  const image = getMotorcycleImage(motorcycle, hasLoadError ? { forceFallback: true, reason: 'load-error' } : undefined);
  const altText = decorative ? '' : image.isFallback ? image.altText : alt ?? image.altText;

  useEffect(() => {
    setHasLoadError(false);
  }, [motorcycle.imageUrl, motorcycle.image_url, motorcycle.image]);

  return (
    <div className="motorcycle-image" data-fallback={image.isFallback ? 'true' : 'false'}>
      <img
        {...imageProps}
        alt={altText}
        className={className}
        data-motorcycle-image={image.isFallback ? 'fallback' : 'real'}
        src={image.imageUrl}
        onError={(event) => {
          if (!image.isFallback) {
            setHasLoadError(true);
          }

          onError?.(event);
        }}
      />
      {image.isFallback ? (
        <span className="motorcycle-image__pending" aria-hidden="true">
          {MOTORCYCLE_IMAGE_FALLBACK_LABEL}
        </span>
      ) : null}
    </div>
  );
}
