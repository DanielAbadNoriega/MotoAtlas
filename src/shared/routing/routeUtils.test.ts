import { describe, expect, it } from 'vitest';
import { bikeFixtures } from '../../test/fixtures/bikes';
import {
  getBikeCanonicalPath,
  getBikeDetailIdFromRoute,
  getBikeSeoSlug,
  getCompareCanonicalPath,
  getComparatorHashFromBikes,
  getComparatorSelectionFromRoute,
  getSearchHashWithText,
  getSearchTextFromRoute,
} from './routeUtils';

describe('routeUtils SEO routes', () => {
  it('genera slugs limpios para motos y comparadores', () => {
    expect(getBikeSeoSlug(bikeFixtures[1])).toBe('aprilia-tuareg-660');
    expect(getBikeCanonicalPath(bikeFixtures[1])).toBe('/motos/aprilia-tuareg-660');
    expect(getCompareCanonicalPath(bikeFixtures.slice(0, 2))).toBe('/comparador/bmw-f-900-gs-vs-aprilia-tuareg-660');
  });

  it('mantiene query params legacy en hashes SEO-friendly', () => {
    expect(getComparatorHashFromBikes(bikeFixtures.slice(0, 2))).toBe(
      '#/comparador/bmw-f-900-gs-vs-aprilia-tuareg-660?bikes=test-bmw-f-900-gs,test-aprilia-tuareg-660',
    );
  });

  it('resuelve rutas limpias de moto y comparador', () => {
    expect(getBikeDetailIdFromRoute('/motos/bmw-f-900-gs', bikeFixtures)).toBe('test-bmw-f-900-gs');
    expect(getComparatorSelectionFromRoute('/comparador/bmw-f-900-gs-vs-aprilia-tuareg-660', bikeFixtures).ids).toEqual([
      'test-bmw-f-900-gs',
      'test-aprilia-tuareg-660',
    ]);
  });

  it('genera y lee rutas de búsqueda desde la home', () => {
    expect(getSearchHashWithText(' ducati ')).toBe('#/buscador?q=ducati');
    expect(getSearchTextFromRoute('#/buscador?q=ducati')).toBe('ducati');
    expect(getSearchTextFromRoute('/buscador?search=yamaha')).toBe('yamaha');
  });
});
