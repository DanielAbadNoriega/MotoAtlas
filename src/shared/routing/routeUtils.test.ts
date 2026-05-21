import { describe, expect, it } from 'vitest';
import { bikeFixtures } from '../../test/fixtures/bikes';
import {
  getBikeCanonicalPath,
  getAccountMotorcycleReviewsCanonicalPath,
  getAccountMotorcycleReviewsHash,
  getAccountReviewMotorcycleIdFromRoute,
  getBikeDetailIdFromRoute,
  getBikeSeoSlug,
  getCommunityMotorcycleIdFromRoute,
  getCommunityReviewsCanonicalPath,
  getCompareCanonicalPath,
  getComparatorHashFromBikes,
  getComparatorSelectionFromRoute,
  getSearchHashWithText,
  getStaticInfoCanonicalPath,
  getStaticInfoRouteKey,
  getSearchTextFromRoute,
  isAccountReviewsRoute,
  isAccountMotorcycleReviewsRoute,
  isAccountRequestsRoute,
  isAccountRoute,
  isCommunityReviewsRoute,
  isLoginRoute,
  isRegisterRoute,
  isTopRatedRoute,
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



  it('detecta rutas informativas del footer', () => {
    expect(getStaticInfoRouteKey('#/metodologia')).toBe('metodologia');
    expect(getStaticInfoRouteKey('/fuentes-datos')).toBe('fuentes-datos');
    expect(getStaticInfoRouteKey('#/solicitar-modelo')).toBe('solicitar-modelo');
    expect(getStaticInfoRouteKey('#/privacidad')).toBe('privacidad');
    expect(getStaticInfoRouteKey('#/terminos')).toBe('terminos');
    expect(getStaticInfoCanonicalPath('privacidad')).toBe('/privacidad');
  });

  it('detecta rutas de autenticación y cuenta', () => {
    expect(isLoginRoute('#/login')).toBe(true);
    expect(isRegisterRoute('/registro')).toBe(true);
    expect(isAccountRoute('#/cuenta')).toBe(true);
    expect(isAccountRoute('#/perfil')).toBe(true);
    expect(isAccountReviewsRoute('#/cuenta/reviews')).toBe(true);
    expect(isAccountReviewsRoute('#/cuenta/reviews/test-bmw-f-900-gs')).toBe(false);
    expect(isAccountMotorcycleReviewsRoute('#/cuenta/reviews/test-bmw-f-900-gs')).toBe(true);
    expect(getAccountReviewMotorcycleIdFromRoute('#/cuenta/reviews/test-bmw-f-900-gs', bikeFixtures)).toBe('test-bmw-f-900-gs');
    expect(getAccountMotorcycleReviewsCanonicalPath('test-bmw-f-900-gs')).toBe('/cuenta/reviews/test-bmw-f-900-gs');
    expect(getAccountMotorcycleReviewsHash('test-bmw-f-900-gs')).toBe('#/cuenta/reviews/test-bmw-f-900-gs');
    expect(isAccountRequestsRoute('#/cuenta/solicitudes')).toBe(true);
    expect(isAccountRoute('#/cuenta/reviews')).toBe(false);
    expect(isAccountRoute('#/cuenta/solicitudes')).toBe(false);
    expect(isLoginRoute('#/cuenta')).toBe(false);
  });

  it('detecta la ruta de motos mejor valoradas', () => {
    expect(isTopRatedRoute('#/motos-mejor-valoradas')).toBe(true);
    expect(isTopRatedRoute('/motos-mejor-valoradas')).toBe(true);
    expect(isTopRatedRoute('#/motos/test-bmw-f-900-gs')).toBe(false);
  });

  it('detecta el archivo público de reviews de comunidad sin tratarlo como moto', () => {
    expect(getCommunityReviewsCanonicalPath()).toBe('/comunidad/reviews');
    expect(isCommunityReviewsRoute('#/comunidad/reviews')).toBe(true);
    expect(isCommunityReviewsRoute('/comunidad/test-bmw-f-900-gs')).toBe(false);
    expect(getCommunityMotorcycleIdFromRoute('#/comunidad/reviews', bikeFixtures)).toBeUndefined();
    expect(getCommunityMotorcycleIdFromRoute('#/comunidad/test-bmw-f-900-gs', bikeFixtures)).toBe('test-bmw-f-900-gs');
  });

  it('genera y lee rutas de búsqueda desde la home', () => {
    expect(getSearchHashWithText(' ducati ')).toBe('#/buscador?q=ducati');
    expect(getSearchTextFromRoute('#/buscador?q=ducati')).toBe('ducati');
    expect(getSearchTextFromRoute('/buscador?search=yamaha')).toBe('yamaha');
  });
});
