import type { ReactNode } from 'react';
import './UnderConstructionPage.scss';

export type CtaItem = Readonly<{
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
  icon?: string;
}>;

export type UnderConstructionPageProps = Readonly<{
  title: string;
  description: string;
  imageSrc?: string;
  statusLabel?: string;
  primaryCta: CtaItem;
  secondaryCtas?: readonly CtaItem[];
  children?: ReactNode;
  trustMessage?: string;
}>;

function CtaButton({ label, href, variant, icon }: CtaItem) {
  return (
    <a
      href={href}
      className={`under-construction__cta under-construction__cta--${variant ?? 'primary'}`}
    >
      {icon && <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>}
      {label}
    </a>
  );
}

export function UnderConstructionPage({
  title,
  description,
  imageSrc = '/images/placeholders/building-page-placeholder.png',
  statusLabel,
  primaryCta,
  secondaryCtas,
  children,
  trustMessage,
}: UnderConstructionPageProps) {
  return (
    <main className="under-construction" aria-labelledby="under-construction-title">
      <div className="under-construction__media" aria-hidden="true">
        <img src={imageSrc} alt="" />
      </div>

      <div className="under-construction__content">
        <div className="under-construction__hero">
          {statusLabel && (
            <span className="under-construction__status-label">{statusLabel}</span>
          )}

          <h1 id="under-construction-title">{title}</h1>
          <p className="under-construction__description">{description}</p>

          <div className="under-construction__actions">
            <CtaButton {...primaryCta} />

            {secondaryCtas?.map((cta) => (
              <CtaButton key={cta.href + cta.label} {...cta} />
            ))}
          </div>
        </div>

        {children && (
          <div className="under-construction__extra">
            {children}
          </div>
        )}

        {trustMessage && (
          <p className="under-construction__trust-message">{trustMessage}</p>
        )}
      </div>
    </main>
  );
}
