import type { Bike } from '../../types/bike';
import { sanitizeCompareQueue, type ComparatorHashSelection } from '../../utils/compareQueue';

export function slugifyRoutePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getBikeSeoSlug(bike: Pick<Bike, 'brand' | 'model'>) {
  return slugifyRoutePart(`${bike.brand} ${bike.model}`);
}

export function getBikeCanonicalPath(bike: Pick<Bike, 'brand' | 'model'>) {
  return `/motos/${getBikeSeoSlug(bike)}`;
}

export function getCommunityCanonicalPath(bike: Pick<Bike, 'id'>) {
  return `/comunidad/${bike.id}`;
}

export function getCompareSeoSlug(bikes: readonly Pick<Bike, 'brand' | 'model'>[]) {
  return bikes.map(getBikeSeoSlug).join('-vs-');
}

export function getCompareCanonicalPath(bikes: readonly Pick<Bike, 'brand' | 'model'>[]) {
  return `/comparador/${getCompareSeoSlug(bikes)}`;
}

export function getComparatorHashFromBikes(bikes: readonly Pick<Bike, 'id' | 'brand' | 'model'>[]) {
  const ids = sanitizeCompareQueue(bikes.map((bike) => bike.id));
  const selectedBikes = ids.map((id) => bikes.find((bike) => bike.id === id)).filter((bike): bike is Pick<Bike, 'id' | 'brand' | 'model'> => Boolean(bike));
  const slug = selectedBikes.length >= 2 ? `/${getCompareSeoSlug(selectedBikes)}` : '';

  return `#/comparador${slug}?bikes=${ids.map((id) => encodeURIComponent(id)).join(',')}`;
}

export function getSearchHashWithText(text: string) {
  const query = text.trim();

  return query ? `#/buscador?q=${encodeURIComponent(query)}` : '#/buscador';
}

export function getCurrentAppRoute() {
  if (typeof window === 'undefined') {
    return '';
  }

  if (window.location.hash.startsWith('#/')) {
    return window.location.hash;
  }

  const route = `${window.location.pathname}${window.location.search}`;
  return route === '/' ? '' : route;
}

export function routeToPathAndSearch(route: string) {
  const normalizedRoute = route.startsWith('#') ? route.slice(1) : route;
  const [path, query = ''] = normalizedRoute.split('?');

  return { path: path || '/', search: query ? `?${query}` : '' };
}

function getQueryParamIds(route: string) {
  const queryStart = route.indexOf('?');

  if (queryStart === -1) {
    return [];
  }

  const params = new URLSearchParams(route.slice(queryStart + 1));

  return params
    .getAll('bikes')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function getSearchTextFromRoute(route: string) {
  const queryStart = route.indexOf('?');

  if (queryStart === -1) {
    return '';
  }

  const params = new URLSearchParams(route.slice(queryStart + 1));
  return (params.get('q') ?? params.get('search') ?? params.get('text') ?? '').trim();
}

function getCompareSlugFromRoute(route: string) {
  const { path } = routeToPathAndSearch(route);
  const match = path.match(/^\/comparador\/([^/?#]+)/);

  return match ? decodeURIComponent(match[1]) : undefined;
}

function findBikeBySlugOrId(slugOrId: string, motorcycles: readonly Bike[]) {
  return motorcycles.find((bike) => bike.id === slugOrId || getBikeSeoSlug(bike) === slugOrId);
}

export function getBikeDetailIdFromRoute(route: string, motorcycles: readonly Bike[]) {
  const { path } = routeToPathAndSearch(route);
  const match = path.match(/^\/motos\/([^/?#]+)/);

  if (!match) {
    return undefined;
  }

  const slugOrId = decodeURIComponent(match[1]);
  return findBikeBySlugOrId(slugOrId, motorcycles)?.id ?? slugOrId;
}

export function getCommunityMotorcycleIdFromRoute(route: string, motorcycles: readonly Bike[]) {
  const { path } = routeToPathAndSearch(route);
  const match = path.match(/^\/comunidad\/([^/?#]+)/);

  if (!match) {
    return undefined;
  }

  const slugOrId = decodeURIComponent(match[1]);
  return findBikeBySlugOrId(slugOrId, motorcycles)?.id ?? slugOrId;
}


export type StaticInfoRouteKey = 'metodologia' | 'fuentes-datos' | 'solicitar-modelo' | 'privacidad' | 'terminos';

const staticInfoRoutePaths: Record<StaticInfoRouteKey, string> = {
  metodologia: '/metodologia',
  'fuentes-datos': '/fuentes-datos',
  'solicitar-modelo': '/solicitar-modelo',
  privacidad: '/privacidad',
  terminos: '/terminos',
};

export function getStaticInfoRouteKey(route: string): StaticInfoRouteKey | undefined {
  const { path } = routeToPathAndSearch(route);
  return (Object.entries(staticInfoRoutePaths) as [StaticInfoRouteKey, string][]).find(([, routePath]) => path === routePath)?.[0];
}

export function getStaticInfoCanonicalPath(routeKey: StaticInfoRouteKey) {
  return staticInfoRoutePaths[routeKey];
}

export function isSearchRoute(route: string) {
  const { path } = routeToPathAndSearch(route);
  return /^\/(buscador|catalogo)(\/|$)/.test(path);
}

export function isComparatorRoute(route: string) {
  const { path } = routeToPathAndSearch(route);
  return /^\/comparador(\/|$)/.test(path);
}

export function isCommunityRoute(route: string) {
  const { path } = routeToPathAndSearch(route);
  return /^\/comunidad(\/|$)/.test(path);
}

export function isTopRatedRoute(route: string) {
  const { path } = routeToPathAndSearch(route);
  return /^\/motos-mejor-valoradas(\/|$)/.test(path);
}

export function getComparatorSelectionFromRoute(route: string, motorcycles: readonly Bike[]): ComparatorHashSelection {
  const queryIds = getQueryParamIds(route);
  const slug = getCompareSlugFromRoute(route);
  const slugIds = slug
    ? slug
        .split('-vs-')
        .map((slugPart) => findBikeBySlugOrId(slugPart, motorcycles)?.id)
        .filter((id): id is Bike['id'] => Boolean(id))
    : [];
  const rawIds = queryIds.length > 0 ? queryIds : slugIds;
  const ids: Bike['id'][] = [];
  const ignoredIds: Bike['id'][] = [];

  rawIds.forEach((id) => {
    if (!id || ids.includes(id)) {
      ignoredIds.push(id);
      return;
    }

    if (ids.length >= 3) {
      ignoredIds.push(id);
      return;
    }

    ids.push(id);
  });

  return { ids, ignoredIds, rawIds };
}
