import type { ReactNode } from 'react';
import './CommunityHero.scss';

type CommunityHeroAction = Readonly<{
  href?: string;
  label: string;
  onClick?: () => void;
}>;

type CommunityHeroProps = Readonly<{
  actions?: readonly CommunityHeroAction[];
  children?: ReactNode;
  className?: string;
  description: string;
  eyebrow: string;
  imageSrc: string;
  title: string;
  titleId: string;
}>;

export function CommunityHero({
  actions = [],
  children,
  className,
  description,
  eyebrow,
  imageSrc,
  title,
  titleId,
}: CommunityHeroProps) {
  const heroClassName = ['community-hero', className].filter(Boolean).join(' ');

  return (
    <section className={heroClassName}>
      <img src={imageSrc} alt="" aria-hidden="true" />
      <div className="community-hero__content">
        <span className="community-hero__eyebrow">{eyebrow}</span>
        <h1 id={titleId}>{title}</h1>
        <p>{description}</p>
        {actions.length > 0 ? (
          <div className="community-hero__actions">
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
