import type { Bike } from '../../types/bike';

export const MOTORCYCLE_LOCAL_IMAGE_PUBLIC_DIR = '/images/motorcycles';
export const MOTORCYCLE_LOCAL_IMAGE_WIDTH = 1600;
export const MOTORCYCLE_LOCAL_IMAGE_HEIGHT = 900;
export const MOTORCYCLE_LOCAL_IMAGE_QUALITY = 82;

export function getMotorcycleLocalImageFileName(motorcycle: Pick<Bike, 'id'>) {
  return `${motorcycle.id}.webp`;
}

export function getMotorcycleLocalImageUrl(motorcycle: Pick<Bike, 'id'>) {
  return `${MOTORCYCLE_LOCAL_IMAGE_PUBLIC_DIR}/${getMotorcycleLocalImageFileName(motorcycle)}`;
}
