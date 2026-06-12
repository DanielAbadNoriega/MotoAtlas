import type { ReactNode } from 'react';
import './SearchHero.scss';

export type SearchHeroProps = {
  children?: ReactNode;
  className?: string;
  description?: string;
  eyebrow?: string;
  imageAlt?: string;
  imageSrc: string;
  title: string;
  titleId: string;
};

export function SearchHero({
  children,
  className,
  description,
  eyebrow,
  imageAlt = '',
  imageSrc,
  title,
  titleId,
}: SearchHeroProps) {
  return (
    <section className={['search-hero', className].filter(Boolean).join(' ')} aria-labelledby={titleId}>
      <div className="search-hero__media" aria-hidden="true">
        <img className="search-hero__image" src={imageSrc} alt={imageAlt} />
        <span className="search-hero__overlay" />
      </div>

      <div className="search-hero__content">
        {eyebrow ? <span className="search-hero__eyebrow">{eyebrow}</span> : null}
        <h1 className="search-hero__title" id={titleId}>
          {title}
        </h1>
        {description ? <p className="search-hero__description">{description}</p> : null}
        {children ? <div className="search-hero__search">{children}</div> : null}
      </div>
    </section>
  );
}
