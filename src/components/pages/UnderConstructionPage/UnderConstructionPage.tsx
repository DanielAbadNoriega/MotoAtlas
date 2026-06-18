import type { ComponentProps } from 'react';
import './UnderConstructionPage.scss';

type UnderConstructionPageProps = Readonly<{
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref?: ComponentProps<'a'>['href'];
}>;

export function UnderConstructionPage({
  title,
  description,
  ctaLabel,
  ctaHref = '#/',
}: UnderConstructionPageProps) {
  return (
    <main className="under-construction" aria-labelledby="under-construction-title">
      <div className="under-construction__content">
        <h1 id="under-construction-title">{title}</h1>
        <p className="under-construction__description">{description}</p>
        <a href={ctaHref} className="under-construction__cta">{ctaLabel}</a>
      </div>
    </main>
  );
}
