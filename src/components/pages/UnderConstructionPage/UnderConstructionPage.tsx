import './UnderConstructionPage.scss';

export type CtaItem = Readonly<{
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
  icon?: string;
}>;

export type RoadmapCard = Readonly<{
  title: string;
  description: string;
  statusLabel?: string;
  icon?: string;
}>;

export type RoadmapSection = Readonly<{
  heading: string;
  cards: readonly RoadmapCard[];
}>;

export type UnderConstructionPageProps = Readonly<{
  title: string;
  description: string;
  imageSrc?: string;
  statusLabel?: string;
  primaryCta: CtaItem;
  secondaryCtas?: readonly CtaItem[];
  roadmap?: RoadmapSection;
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
  roadmap,
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

        {roadmap && (
          <section className="under-construction__roadmap" aria-labelledby="under-construction-roadmap-heading">
            <h2 id="under-construction-roadmap-heading">{roadmap.heading}</h2>
            <div className="under-construction__roadmap-cards">
              {roadmap.cards.map((card) => (
                <article key={card.title} className="under-construction__roadmap-card">
                  {card.icon && (
                    <span className="material-symbols-outlined" aria-hidden="true">{card.icon}</span>
                  )}
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  {card.statusLabel && (
                    <span className="under-construction__roadmap-card-status">{card.statusLabel}</span>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {trustMessage && (
          <p className="under-construction__trust-message">{trustMessage}</p>
        )}
      </div>
    </main>
  );
}
