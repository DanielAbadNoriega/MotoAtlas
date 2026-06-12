import type { ReactNode } from 'react';
import { PageHero, type PageHeroAction } from '../PageHero';

type CommunityHeroProps = Readonly<{
  actions?: readonly PageHeroAction[];
  children?: ReactNode;
  className?: string;
  description: string;
  eyebrow: string;
  imageSrc: string;
  title: string;
  titleId: string;
}>;

/**
 * @deprecated Usar `PageHero` directamente. Este wrapper existe
 * temporalmente (rama `feature/page-hero-community-base`) para mantener
 * compatibilidad con importadores externos mientras se completa la
 * migración.
 */
export function CommunityHero({
  actions,
  children,
  className,
  description,
  eyebrow,
  imageSrc,
  title,
  titleId,
}: CommunityHeroProps) {
  return (
    <PageHero
      actions={actions}
      className={className}
      description={description}
      eyebrow={eyebrow}
      imageSrc={imageSrc}
      imageAlt=""
      title={title}
      titleId={titleId}
    >
      {children}
    </PageHero>
  );
}
