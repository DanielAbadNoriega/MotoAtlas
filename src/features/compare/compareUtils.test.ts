import { describe, expect, it } from 'vitest';
import { bikeFixtures } from '../../test/fixtures/bikes';
import {
  buildCompareViewModel,
  getCompareHashAfterAdding,
  getCompareHashAfterRemoving,
  getCompareHashSelection,
  resolveCompareSelectionFromHash,
} from './compareUtils';

describe('compareUtils', () => {
  it('reads compare ids from query params and ignores extras', () => {
    const selection = getCompareHashSelection(
      '#/comparador?bikes=test-bmw-f-900-gs,test-aprilia-tuareg-660,test-yamaha-mt-09,test-honda-nt1100',
    );

    expect(selection.ids).toEqual(['test-bmw-f-900-gs', 'test-aprilia-tuareg-660', 'test-yamaha-mt-09']);
    expect(selection.ignoredIds).toEqual(['test-honda-nt1100']);
  });

  it('resolves bikes from query params using local fixtures', () => {
    const selection = resolveCompareSelectionFromHash(
      '#/comparador?bikes=test-bmw-f-900-gs,test-aprilia-tuareg-660,missing-bike',
      bikeFixtures,
    );

    expect(selection.bikes.map((bike) => bike.id)).toEqual(['test-bmw-f-900-gs', 'test-aprilia-tuareg-660']);
    expect(selection.missingIds).toEqual(['missing-bike']);
  });

  it('builds a dynamic compare view model for the Stitch blocks', () => {
    const viewModel = buildCompareViewModel(bikeFixtures.slice(0, 2));

    expect(viewModel.title).toBe('BMW F 900 GS vs Aprilia Tuareg 660');
    expect(viewModel.highlights).toHaveLength(3);
    expect(viewModel.performanceRows).toHaveLength(7);
    expect(viewModel.reports.length).toBeGreaterThan(0);
    expect(viewModel.videos).toHaveLength(2);
    expect(viewModel.finalVerdict.winnerBike.id).toBeTruthy();
  });

  it('syncs hashes when adding and removing bikes', () => {
    const ids = ['test-bmw-f-900-gs', 'test-aprilia-tuareg-660'];

    expect(getCompareHashAfterAdding(ids, 'test-yamaha-mt-09')).toBe(
      '#/comparador?bikes=test-bmw-f-900-gs,test-aprilia-tuareg-660,test-yamaha-mt-09',
    );
    expect(getCompareHashAfterRemoving([...ids, 'test-yamaha-mt-09'], 'test-aprilia-tuareg-660')).toBe(
      '#/comparador?bikes=test-bmw-f-900-gs,test-yamaha-mt-09',
    );
  });
});
