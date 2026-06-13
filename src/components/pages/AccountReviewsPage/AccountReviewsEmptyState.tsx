import { RadarState } from '../../../shared/ui/states/RadarState';

type AccountReviewsEmptyStateProps = Readonly<{
  actionLabel?: string;
  description?: string;
  onClearFilters?: () => void;
  title?: string;
}>;

export function AccountReviewsEmptyState({
  actionLabel = 'Limpiar filtros',
  description = 'Prueba a cambiar los filtros para encontrar lo que necesitas.',
  onClearFilters,
  title = 'No hay reviews con estos filtros',
}: AccountReviewsEmptyStateProps) {
  return (
    <RadarState
      actionLabel={actionLabel}
      description={description}
      onAction={onClearFilters}
      title={title}
      titleId="account-reviews-empty-title"
    />
  );
}
