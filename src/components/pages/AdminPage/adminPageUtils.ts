import { getMotorcycleImageObjectPath } from './adminGalleryImageUtils';
import type { RangeFilterPreset } from './adminPageConstants';
import type { Bike } from '../../../types/bike';

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha pendiente' : dateFormatter.format(date);
}

export function getTimestamp(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function formatPendingReviewCount(value: number): string {
  return value === 1 ? '1 review nueva' : `${value} reviews nuevas`;
}

export function getDisplayName(profileName: string | null | undefined, email: string | undefined): string {
  return profileName?.trim() || email || 'Admin MotoAtlas';
}

export function getBrandOptions(catalog: readonly Bike[]): string[] {
  return [...new Set(catalog.map((b) => b.brand))].sort();
}

export function isRangePresetActive(min: string, max: string, preset: RangeFilterPreset): boolean {
  return min === preset.min && max === preset.max;
}

export function normalizeTextList(values: readonly string[] | null | undefined): string[] {
  return (values ?? [])
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0 && value.toLowerCase() !== 'null');
}

export function getCurrentImageOriginLabel(imageUrl: string): string {
  const trimmedUrl = imageUrl.trim();

  if (!trimmedUrl) {
    return 'Pendiente';
  }

  if (getMotorcycleImageObjectPath(trimmedUrl)) {
    return 'Storage MotoAtlas';
  }

  if (trimmedUrl.startsWith('/images/')) {
    return 'Catálogo local';
  }

  if (/^https?:\/\//i.test(trimmedUrl)) {
    return 'URL externa';
  }

  return 'Borrador local';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
