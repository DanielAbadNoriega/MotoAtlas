import type { ReactNode } from 'react';
import './PageHero.scss';

export type PageHeroAction = Readonly<{
  href?: string;
  label: string;
  onClick?: () => void;
}>;

export type PageHeroProps = Readonly<{
  actions?: readonly PageHeroAction[];
  children?: ReactNode;
  className?: string;
  description?: string;
  eyebrow?: string;
  imageAlt?: string;
  imageSrc?: string;
  title: string;
  titleId: string;
}>;

export function PageHero({
  actions = [],
  children,
  className,
  description,
  eyebrow,
  imageAlt,
  imageSrc,
  title,
  titleId,
}: PageHeroProps) {
  const heroClassName = ['page-hero', className].filter(Boolean).join(' ');

  return (
    <section className={heroClassName}>
      {imageSrc ? (
        <img src={imageSrc} alt={imageAlt ?? ''} aria-hidden={imageAlt ? undefined : 'true'} />
      ) : null}
      <div className="page-hero__content">
        {eyebrow ? <span className="page-hero__eyebrow">{eyebrow}</span> : null}
        <h1 id={titleId}>{title}</h1>
        {description ? <p>{description}</p> : null}
        {actions.length > 0 ? (
          <div className="page-hero__actions">
            {actions.map((action) => (
              action.href ? (
                <a href={action.href} key={`${action.label}-${action.href}`}>{action.label}</a>
              ) : (
                <button type="button" key={`${action.label}-button`} onClick={action.onClick}>{action.label}</button>
              )
            ))}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}
