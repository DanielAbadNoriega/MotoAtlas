import type { ReactNode } from 'react';
import { getMotorcycleTechnicalIcon, type MotorcycleTechnicalIconKey } from '../../../shared/motorcycles/motorcycleTechnicalIcons';
import './TechnicalSpecCard.scss';

export type TechnicalSpecCardVariant = 'default' | 'accent';

export type TechnicalSpecCardProps = Readonly<{
  icon: MotorcycleTechnicalIconKey;
  label: string;
  meta?: string;
  value: string;
  unit?: string;
  variant?: TechnicalSpecCardVariant;
  /** Optional content rendered below the value (e.g. chips, badges). Never rendered when null/undefined. */
  children?: ReactNode;
}>;

export function TechnicalSpecCard({
  icon,
  label,
  meta,
  value,
  unit,
  variant = 'default',
  children,
}: TechnicalSpecCardProps) {
  const cardClasses = variant === 'accent' ? 'bike-detail__spec-card bike-detail__spec-card--accent' : 'bike-detail__spec-card';
  const hasMeta = typeof meta === 'string' && meta.trim().length > 0;

  return (
    <article className={cardClasses} data-spec-variant={variant}>
      <div className="bike-detail__spec-card-header">
        <span className="material-symbols-outlined" aria-hidden="true">
          {getMotorcycleTechnicalIcon(icon)}
        </span>
      </div>
      <p className="bike-detail__spec-label">{label}</p>
      <div className="bike-detail__spec-value-row">
        <span className="bike-detail__spec-value">{value}</span>
        {unit && <span className="bike-detail__spec-unit">{unit}</span>}
      </div>
      {hasMeta && <p className="bike-detail__spec-meta">{meta}</p>}
      {children}
    </article>
  );
}
