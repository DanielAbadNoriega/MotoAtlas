import { describe, expect, it } from 'vitest';
import { bikeFixtures } from '../test/fixtures/bikes';
import { getComparatorHash, getComparatorIdsFromHash, mergeCompareQueue, sanitizeCompareQueue } from './compareQueue';

describe('compare queue', () => {
  it('removes duplicates and never allows more than 3 motorcycles', () => {
    expect(
      sanitizeCompareQueue([
        'test-bmw-f-900-gs',
        'test-aprilia-tuareg-660',
        'test-bmw-f-900-gs',
        'test-yamaha-mt-09',
        'test-honda-nt1100',
      ]),
    ).toEqual(['test-bmw-f-900-gs', 'test-aprilia-tuareg-660', 'test-yamaha-mt-09']);
  });

  it('builds a comparator hash with a maximum of 3 motorcycles', () => {
    expect(getComparatorHash(bikeFixtures)).toBe(
      '#/comparador?bikes=test-bmw-f-900-gs,test-aprilia-tuareg-660,test-yamaha-mt-09',
    );
  });

  it('reads a comparator hash with a maximum of 3 motorcycles', () => {
    expect(
      getComparatorIdsFromHash(
        '#/comparador?bikes=test-bmw-f-900-gs,test-aprilia-tuareg-660,test-yamaha-mt-09,test-honda-nt1100',
      ),
    ).toEqual(['test-bmw-f-900-gs', 'test-aprilia-tuareg-660', 'test-yamaha-mt-09']);
  });

  it('reports rejected motorcycles when merging into a full queue', () => {
    const result = mergeCompareQueue(
      ['test-bmw-f-900-gs', 'test-aprilia-tuareg-660', 'test-yamaha-mt-09'],
      ['test-honda-nt1100'],
    );

    expect(result.queue).toEqual(['test-bmw-f-900-gs', 'test-aprilia-tuareg-660', 'test-yamaha-mt-09']);
    expect(result.rejectedIds).toEqual(['test-honda-nt1100']);
  });
});
