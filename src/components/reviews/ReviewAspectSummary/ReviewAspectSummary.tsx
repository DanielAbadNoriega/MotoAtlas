import { useState } from 'react';
import type { MotorcycleReviewAspectCategory, MotorcycleReviewAspectSentiment } from '../../../services/motorcycleReviewService';
import './ReviewAspectSummary.scss';

export type ReviewAspectSummaryAspect = Readonly<{
  category: MotorcycleReviewAspectCategory;
  sentiment: MotorcycleReviewAspectSentiment;
  comment?: string | null;
}>;

export type ReviewAspectSummaryProps = Readonly<{
  aspects: readonly ReviewAspectSummaryAspect[] | undefined | null;
}>;

const categoryLabels: Record<MotorcycleReviewAspectCategory, string> = {
  engine: 'Motor',
  ergonomics: 'Ergonomía',
  consumption: 'Consumo',
  braking: 'Frenada',
  suspension: 'Suspensión',
  electronics: 'Electrónica',
  aerodynamics: 'Aerodinámica',
  passenger: 'Pasajero',
  maintenance: 'Mantenimiento',
  price: 'Precio',
  weight: 'Peso',
  design: 'Diseño',
};

const categoryIcons: Record<MotorcycleReviewAspectCategory, string> = {
  engine: 'settings',
  ergonomics: 'accessibility_new',
  consumption: 'local_gas_station',
  braking: 'emergency',
  suspension: 'air',
  electronics: 'memory',
  aerodynamics: 'air',
  passenger: 'group',
  maintenance: 'build',
  price: 'euro_symbol',
  weight: 'fitness_center',
  design: 'palette',
};

function AspectChipWithComment({
  aspect,
  label,
  icon,
  isPositive,
}: {
  aspect: ReviewAspectSummaryAspect;
  label: string;
  icon: string;
  isPositive: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  function handleClick() {
    setIsOpen((prev) => !prev);
  }

  function handleBlur(e: React.FocusEvent) {
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !e.currentTarget.closest('.review-aspect-summary__chip')?.contains(relatedTarget)) {
      setIsOpen(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <span className="review-aspect-summary__chip">
      <button
        className={`review-aspect-summary__chip-btn ${isPositive ? 'review-aspect-summary__chip-btn--positive' : 'review-aspect-summary__chip-btn--negative'}`}
        aria-label={`Ver matiz sobre ${label}`}
        aria-expanded={isOpen}
        type="button"
        onClick={handleClick}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      >
        <span className="review-aspect-summary__chip-icon material-symbols-outlined" aria-hidden="true">
          {icon}
        </span>
        <span className="review-aspect-summary__chip-label">{label}</span>
        <span className={`review-aspect-summary__chip-sentiment ${isPositive ? 'review-aspect-summary__chip-sentiment--positive' : 'review-aspect-summary__chip-sentiment--negative'}`} aria-hidden="true">
          {isPositive ? '+' : '−'}
        </span>
        <span className="review-aspect-summary__chip-comment material-symbols-outlined" aria-hidden="true">
          chat
        </span>
      </button>
      {isOpen && (
        <span
          className="review-aspect-summary__tooltip"
          role="tooltip"
        >
          {aspect.comment}
        </span>
      )}
    </span>
  );
}

function AspectChip({ aspect }: { aspect: ReviewAspectSummaryAspect }) {
  const hasComment = aspect.comment != null && aspect.comment.trim() !== '';
  const label = categoryLabels[aspect.category];
  const icon = categoryIcons[aspect.category];
  const isPositive = aspect.sentiment === 'positive';

  if (hasComment) {
    return (
      <AspectChipWithComment
        aspect={aspect}
        label={label}
        icon={icon}
        isPositive={isPositive}
      />
    );
  }

  return (
    <span className={`review-aspect-summary__chip-item ${isPositive ? 'review-aspect-summary__chip-item--positive' : 'review-aspect-summary__chip-item--negative'}`}>
      <span className="review-aspect-summary__chip-icon material-symbols-outlined" aria-hidden="true">
        {icon}
      </span>
      <span className="review-aspect-summary__chip-label">{label}</span>
      <span className={`review-aspect-summary__chip-sentiment ${isPositive ? 'review-aspect-summary__chip-sentiment--positive' : 'review-aspect-summary__chip-sentiment--negative'}`} aria-hidden="true">
        {isPositive ? '+' : '−'}
      </span>
    </span>
  );
}

export function ReviewAspectSummary({ aspects }: ReviewAspectSummaryProps) {
  if (!aspects || aspects.length === 0) {
    return null;
  }

  return (
    <div className="review-aspect-summary">
      <h4 className="review-aspect-summary__title">Valoración técnica</h4>
      <div className="review-aspect-summary__grid" role="list">
        {aspects.map((aspect) => (
          <AspectChip key={aspect.category} aspect={aspect} />
        ))}
      </div>
    </div>
  );
}
