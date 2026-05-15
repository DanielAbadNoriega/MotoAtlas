import type { Bike } from '../types/bike';

export const compareQueueMaxSize = 3;

const compareQueueStorageKey = 'motoatlas.compareQueue.v1';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getCompareSearchHash(bike: Pick<Bike, 'id'>) {
  return `#/buscador?compare=${encodeURIComponent(bike.id)}`;
}

export function getComparatorHash(bikes: readonly Pick<Bike, 'id'>[]) {
  const ids = sanitizeCompareQueue(bikes.map((bike) => bike.id));
  return `#/comparador?bikes=${ids.map((id) => encodeURIComponent(id)).join(',')}`;
}

export function getBrowseSearchHash() {
  return '#/buscador?browse=1';
}

export function getModifyComparisonSearchHash() {
  return '#/buscador';
}

export function isBrowseSearchHash(hash: string) {
  const queryStart = hash.indexOf('?');

  if (queryStart === -1) {
    return false;
  }

  const params = new URLSearchParams(hash.slice(queryStart + 1));
  return params.get('browse') === '1';
}

export function sanitizeCompareQueue(ids: readonly string[]): Bike['id'][] {
  const queue: Bike['id'][] = [];

  ids.forEach((id) => {
    if (!id || queue.includes(id) || queue.length >= compareQueueMaxSize) {
      return;
    }

    queue.push(id);
  });

  return queue;
}

export function mergeCompareQueue(currentIds: readonly Bike['id'][], incomingIds: readonly string[]) {
  const queue = sanitizeCompareQueue(currentIds);
  const rejectedIds: string[] = [];

  incomingIds.forEach((id) => {
    if (!id || queue.includes(id)) {
      return;
    }

    if (queue.length >= compareQueueMaxSize) {
      rejectedIds.push(id);
      return;
    }

    queue.push(id);
  });

  return { queue, rejectedIds };
}

export function loadCompareQueue(): Bike['id'][] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(compareQueueStorageKey);
    const parsedValue: unknown = rawValue ? JSON.parse(rawValue) : [];

    return Array.isArray(parsedValue)
      ? sanitizeCompareQueue(parsedValue.filter((item): item is string => typeof item === 'string'))
      : [];
  } catch {
    return [];
  }
}

export function saveCompareQueue(ids: readonly Bike['id'][]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(compareQueueStorageKey, JSON.stringify(sanitizeCompareQueue(ids)));
}


export type ComparatorHashSelection = Readonly<{
  ids: readonly Bike['id'][];
  ignoredIds: readonly Bike['id'][];
  rawIds: readonly Bike['id'][];
}>;

function getComparatorRawIdsFromHash(hash: string) {
  const queryStart = hash.indexOf('?');

  if (queryStart === -1) {
    return [];
  }

  const params = new URLSearchParams(hash.slice(queryStart + 1));

  return params
    .getAll('bikes')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function getComparatorHashSelection(hash: string): ComparatorHashSelection {
  const rawIds = getComparatorRawIdsFromHash(hash);
  const ids: Bike['id'][] = [];
  const ignoredIds: Bike['id'][] = [];

  rawIds.forEach((id) => {
    if (!id || ids.includes(id)) {
      ignoredIds.push(id);
      return;
    }

    if (ids.length >= compareQueueMaxSize) {
      ignoredIds.push(id);
      return;
    }

    ids.push(id);
  });

  return { ids, ignoredIds, rawIds };
}

export function getComparatorIdsFromHash(hash: string) {
  return getComparatorHashSelection(hash).ids;
}

export function getIncomingCompareIdsFromHash(hash: string) {
  const queryStart = hash.indexOf('?');

  if (queryStart === -1) {
    return [];
  }

  const queryString = hash.slice(queryStart + 1);
  const params = new URLSearchParams(queryString);

  return params
    .getAll('compare')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function clearIncomingCompareHash(routeHash: string) {
  if (!isBrowser() || window.location.hash !== routeHash) {
    return;
  }

  window.history.replaceState(null, '', '#/buscador');
}
