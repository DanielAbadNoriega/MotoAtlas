import type { MotorcycleDataSource } from '../../types/bike';

export const dataQualityLabels = {
  api: 'Dato técnico',
  estimated: 'Estimado',
  manual: 'Revisado',
  placeholder: 'Pendiente de confirmar',
  user: 'Comunidad',
} as const satisfies Record<MotorcycleDataSource, string>;

export const pendingPriceLabel = 'Precio pendiente de confirmar';
export const estimatedScoresLabel = 'Valoración estimada';
export const estimatedProsConsLabel = 'Pros y contras estimados';
export const estimatedReliabilityLabel = 'Fiabilidad estimada';

export function getDataQualityLabel(source: MotorcycleDataSource | undefined) {
  return source ? dataQualityLabels[source] : dataQualityLabels.estimated;
}

export function isPlaceholderSource(source: MotorcycleDataSource | undefined) {
  return source === 'placeholder';
}

export function isEstimatedSource(source: MotorcycleDataSource | undefined) {
  return source === 'estimated';
}

export function isLowConfidenceSource(source: MotorcycleDataSource | undefined) {
  return isEstimatedSource(source) || isPlaceholderSource(source);
}

export function isPendingPrice(priceEur: number | undefined, priceSource: MotorcycleDataSource | undefined) {
  return isPlaceholderSource(priceSource) || !priceEur || priceEur <= 0;
}
