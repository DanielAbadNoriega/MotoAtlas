import { useId } from 'react';
import './UnderConstructionCardSection.scss';

export type UnderConstructionExtraCard = Readonly<{
  id?: string;
  title: string;
  description: string;
  statusLabel?: string;
  icon?: string;
}>;

export type UnderConstructionCardSectionProps = Readonly<{
  heading: string;
  cards: readonly UnderConstructionExtraCard[];
}>;

export function UnderConstructionCardSection({ heading, cards }: UnderConstructionCardSectionProps) {
  const headingId = useId();

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="under-construction-card-section" aria-labelledby={headingId}>
      <h2 id={headingId}>{heading}</h2>
      <div className="under-construction-card-section__cards">
        {cards.map((card, index) => (
          <article key={card.id ?? `${card.title}-${index}`} className="under-construction-card-section__card">
            {card.icon && (
              <span className="material-symbols-outlined" aria-hidden="true">{card.icon}</span>
            )}
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            {card.statusLabel && (
              <span className="under-construction-card-section__card-status">{card.statusLabel}</span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
