import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import motorcyclesSeed from '../../../data/import/motorcycles.json';
import { BIKE_SEGMENTS, segmentLabels } from './motorcycleTaxonomy';

const expectedSegments = [
  'trail',
  'adventure',
  'touring',
  'sport-touring',
  'naked',
  'sport',
  'supersport',
  'hypernaked',
  'enduro',
  'dual-sport',
  'scrambler',
  'custom',
  'cruiser',
  'retro',
  'neo-retro',
  'scooter',
] as const;

function parseSingleQuotedValues(source: string) {
  return (source.match(/'([^']+)'/g) ?? []).map((value) => value.slice(1, -1));
}

describe('motorcycle taxonomy contract', () => {
  it('keeps BIKE_SEGMENTS aligned with the 16 expected categories', () => {
    expect(BIKE_SEGMENTS).toEqual(expectedSegments);
  });

  it('keeps BikeSegment type union aligned with the expected categories', () => {
    const bikeTypesSource = readFileSync('src/types/bike.ts', 'utf8');
    const bikeSegmentTypeBlock = bikeTypesSource.match(/export type BikeSegment =([\s\S]*?);/);

    expect(bikeSegmentTypeBlock).not.toBeNull();

    const parsedSegments = parseSingleQuotedValues(bikeSegmentTypeBlock?.[1] ?? '');
    expect(parsedSegments).toEqual(expectedSegments);
  });

  it('keeps Supabase motorcycle_segment enum aligned with the expected categories', () => {
    const schemaSource = readFileSync('supabase/schema.sql', 'utf8');
    const enumBlock = schemaSource.match(/create type motorcycle_segment as enum \(([\s\S]*?)\);/i);

    expect(enumBlock).not.toBeNull();

    const parsedSegments = parseSingleQuotedValues(enumBlock?.[1] ?? '');
    expect(parsedSegments).toEqual(expectedSegments);
  });

  it('exposes visible labels for every BikeSegment key (no missing mapping)', () => {
    const labelKeys = Object.keys(segmentLabels).sort();
    const expectedKeys = [...expectedSegments].sort();

    expect(labelKeys).toEqual(expectedKeys);

    expectedSegments.forEach((segment) => {
      const label = segmentLabels[segment];
      expect(label.trim().length).toBeGreaterThan(0);
      expect(label).not.toBe(segment);
    });
  });

  it('accepts current import dataset segments as valid taxonomy values', () => {
    const seedSegments = [...new Set(motorcyclesSeed.map((motorcycle) => motorcycle.segment))].sort();
    const validSegments = new Set<string>(BIKE_SEGMENTS);
    const invalidSegments = seedSegments.filter((segment) => !validSegments.has(segment));

    expect(invalidSegments).toEqual([]);

    // Guardrail documental: no fallamos por segmentos ausentes en dataset actual.
    const missingExpectedSegments = expectedSegments.filter((segment) => !seedSegments.includes(segment));
    expect(Array.isArray(missingExpectedSegments)).toBe(true);
  });
});
