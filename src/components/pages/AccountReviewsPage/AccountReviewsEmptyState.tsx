import './AccountReviewsEmptyState.scss';

type AccountReviewsEmptyStateProps = Readonly<{
  onClearFilters?: () => void;
}>;

export function AccountReviewsEmptyState({ onClearFilters }: AccountReviewsEmptyStateProps) {
  return (
    <section className="account-reviews-empty" aria-labelledby="account-reviews-empty-title">
      <div className="account-reviews-empty__visual" aria-hidden="true" data-testid="reviews-empty-radar">
        <div className="account-reviews-empty__glow" />
        <div className="account-reviews-empty__radar">
          <div className="account-reviews-empty__ring account-reviews-empty__ring--outer" data-testid="reviews-empty-radar-ring" />
          <div className="account-reviews-empty__ring account-reviews-empty__ring--inner" data-testid="reviews-empty-radar-ring" />
          <div className="account-reviews-empty__sweep" data-testid="reviews-empty-radar-sweep" />
          <span className="account-reviews-empty__marker account-reviews-empty__marker--top" data-testid="reviews-empty-radar-marker" />
          <span className="account-reviews-empty__marker account-reviews-empty__marker--bottom" data-testid="reviews-empty-radar-marker" />
          <span className="account-reviews-empty__marker account-reviews-empty__marker--left" data-testid="reviews-empty-radar-marker" />
          <span className="account-reviews-empty__marker account-reviews-empty__marker--right" data-testid="reviews-empty-radar-marker" />
          <span className="account-reviews-empty__icon material-symbols-outlined">search_off</span>
        </div>
      </div>

      <div className="account-reviews-empty__content">
        <h2 id="account-reviews-empty-title">No hay reviews con estos filtros</h2>
        <p>Prueba a cambiar los filtros para encontrar lo que necesitas.</p>
        {onClearFilters ? (
          <button className="account-reviews-empty__action" type="button" onClick={onClearFilters}>
            Limpiar filtros
          </button>
        ) : null}
      </div>
    </section>
  );
}
