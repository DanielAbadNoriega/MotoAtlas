import { segmentIcons, segmentLabels } from '../../../shared/motorcycles/motorcycleTaxonomy';
import type { BikeSegment } from '../../../types/bike';

export function formatPreviewNumber(value: string, unit: string): string {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return '—';
  }

  return `${new Intl.NumberFormat('es-ES').format(parsed)} ${unit}`;
}

export function formatPreviewPrice(value: string, isPending: boolean): string {
  const parsed = Number(value);

  if (isPending || !Number.isFinite(parsed) || parsed <= 0) {
    return 'Precio pendiente';
  }

  return new Intl.NumberFormat('es-ES', {
    currency: 'EUR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(parsed);
}

export function getPreviewBadgeLabel(segment: BikeSegment | ''): string {
  return segment ? segmentLabels[segment] : 'Segmento pendiente';
}

export function getPreviewBadgeIcon(segment: BikeSegment | ''): string {
  return segment ? segmentIcons[segment] : 'category';
}
