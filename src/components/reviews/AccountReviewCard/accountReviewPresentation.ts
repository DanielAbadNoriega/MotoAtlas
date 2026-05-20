import { findBikeById, getBikeDetailHash, getBikeDisplayName } from '../../../data/bikes';
import type { MotorcycleReview, MotorcycleReviewRidingStyle, MotorcycleReviewStatus } from '../../../services/motorcycleReviewService';

export type AccountReviewMotorcycleDisplay = Readonly<{
  communityHref: string;
  detailHref: string;
  imageSource: Readonly<{
    brand?: string;
    imageUrl?: string;
    model?: string;
    name?: string;
  }>;
  name: string;
  searchText: string;
  year?: number;
}>;

export const accountReviewStatusLabels: Record<MotorcycleReviewStatus, string> = {
  approved: 'Publicada',
  hidden: 'Oculta',
  pending: 'Pendiente',
  rejected: 'Rechazada',
};

export const accountReviewRidingStyleLabels: Record<MotorcycleReviewRidingStyle, string> = {
  ciudad: 'Ciudad',
  deportivo: 'Deportivo',
  diario: 'Diario',
  offroad: 'Offroad',
  pasajero: 'Pasajero',
  viaje: 'Viaje',
};

export function formatAccountReviewDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha pendiente';
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatAccountReviewOwnershipMonths(value: number | null) {
  if (value === null) {
    return 'Sin dato';
  }

  return value === 1 ? '1 mes' : `${value} meses`;
}

export function formatAccountReviewKilometers(value: number | null) {
  if (value === null) {
    return 'Sin dato';
  }

  return `${new Intl.NumberFormat('es-ES').format(value)} km`;
}

export function getAccountReviewMotorcycleDisplay(review: MotorcycleReview): AccountReviewMotorcycleDisplay {
  const catalogBike = findBikeById(review.motorcycleId);
  const motorcycle = review.motorcycle;
  const name = motorcycle
    ? `${motorcycle.brand} ${motorcycle.model}`
    : catalogBike
      ? getBikeDisplayName(catalogBike)
      : review.motorcycleId;
  const year = motorcycle?.year ?? catalogBike?.year;
  const displayName = year ? `${name} ${year}` : name;
  const detailHref = catalogBike ? getBikeDetailHash(catalogBike) : `#/motos/${review.motorcycleId}`;
  const imageSource = motorcycle
    ? { brand: motorcycle.brand, imageUrl: motorcycle.imageUrl, model: motorcycle.model, name: displayName }
    : catalogBike
      ? { brand: catalogBike.brand, imageUrl: catalogBike.imageUrl, model: catalogBike.model, name: displayName }
      : { name: displayName };

  return {
    communityHref: `#/comunidad/${review.motorcycleId}`,
    detailHref,
    imageSource,
    name: displayName,
    searchText: `${displayName} ${review.motorcycleId}`.toLowerCase(),
    year,
  };
}

export function sortAccountReviewsByNewest(reviews: readonly MotorcycleReview[]) {
  return [...reviews].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}
