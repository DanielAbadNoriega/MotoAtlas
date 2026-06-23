import { describe, expect, it } from 'vitest';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import type { Bike } from '../../../types/bike';
import {
  buildSuggestedModelId,
  cloneAdminModelDraft,
  createDraftFromBike,
  draftToCreatePayload,
  draftToUpdatePayload,
  validateAdminModelDraftForPublish,
  type AdminModelDraft,
} from './adminModelDraftUtils';

const bmwFixture = bikeFixtures[0] as Bike;

const emptyDraft: AdminModelDraft = {
  brand: '',
  model: '',
  year: '',
  description: '',
  modelId: '',
  segment: '',
  license: '',
  engineType: '',
  displacementCc: '',
  powerHp: '',
  torqueNm: '',
  wetWeightKg: '',
  seatHeightMm: '',
  fuelTankLiters: '',
  priceEur: '',
  pricePending: true,
  imageUrl: '',
  imageLocked: false,
  officialUrl: '',
  sourceNotes: '',
  internalNotes: '',
  features: {
    absCornering: false,
    tractionControl: false,
    ridingModes: false,
    cruiseControl: false,
    quickshifter: false,
    heatedGrips: false,
    tubelessWheels: false,
  },
};

function buildFullDraft(overrides?: Partial<AdminModelDraft>): AdminModelDraft {
  return {
    ...emptyDraft,
    brand: 'TestBrand',
    model: 'Test Model',
    year: '2025',
    description: 'A test bike.',
    modelId: 'test-brand-test-model-2025',
    segment: 'naked',
    license: 'A',
    engineType: 'inline-four',
    displacementCc: '1000',
    powerHp: '200',
    torqueNm: '120',
    wetWeightKg: '200',
    seatHeightMm: '800',
    fuelTankLiters: '18',
    priceEur: '15000',
    pricePending: false,
    imageUrl: 'https://example.com/bike.jpg',
    imageLocked: true,
    officialUrl: '',
    sourceNotes: '',
    internalNotes: '',
    features: {
      absCornering: true,
      tractionControl: true,
      ridingModes: true,
      cruiseControl: false,
      quickshifter: true,
      heatedGrips: false,
      tubelessWheels: false,
    },
    ...overrides,
  };
}

describe('createDraftFromBike', () => {
  it('maps bike fields correctly', () => {
    const draft = createDraftFromBike(bmwFixture);

    expect(draft.brand).toBe('BMW');
    expect(draft.model).toBe('F 900 GS');
    expect(draft.year).toBe('2024');
    expect(draft.description).toBe('Trail media con electrónica completa.');
    expect(draft.modelId).toBe('test-bmw-f-900-gs');
    expect(draft.segment).toBe('trail');
    expect(draft.license).toBe('A');
    expect(draft.engineType).toBe('parallel-twin');
    expect(draft.displacementCc).toBe('895');
    expect(draft.powerHp).toBe('105');
    expect(draft.torqueNm).toBe('93');
    expect(draft.wetWeightKg).toBe('219');
    expect(draft.seatHeightMm).toBe('870');
    expect(draft.fuelTankLiters).toBe('14.5');
    expect(draft.priceEur).toBe('13950');
    expect(draft.imageUrl).toBe('https://example.com/bmw.jpg');
    expect(draft.officialUrl).toBe('');
  });

  it('preserves/initializes features correctly', () => {
    const draft = createDraftFromBike(bmwFixture);

    expect(draft.features.absCornering).toBe(true);
    expect(draft.features.tractionControl).toBe(true);
    expect(draft.features.ridingModes).toBe(true);
    expect(draft.features.cruiseControl).toBe(false);
    expect(draft.features.quickshifter).toBe(true);
    expect(draft.features.heatedGrips).toBe(false);
    expect(draft.features.tubelessWheels).toBe(false);
  });

  it('sets expected default values', () => {
    const draft = createDraftFromBike(bmwFixture);

    expect(draft.pricePending).toBe(false);
    expect(draft.imageLocked).toBe(bmwFixture.imageLocked ?? false);
    expect(draft.sourceNotes).toBe('');
    expect(draft.internalNotes).toBe('');
    expect(draft.officialUrl).toBe('');
  });

  it('handles nullish optional bike fields', () => {
    const bikeWithoutOptionals: Bike = {
      ...bmwFixture,
      imageLocked: undefined,
      officialUrl: null,
    };
    const draft = createDraftFromBike(bikeWithoutOptionals);

    expect(draft.imageLocked).toBe(false);
    expect(draft.officialUrl).toBe('');
  });
});

describe('cloneAdminModelDraft', () => {
  it('creates a shallow copy with a cloned features object', () => {
    const original = buildFullDraft();
    const cloned = cloneAdminModelDraft(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });

  it('mutating the clone does not mutate the original features object', () => {
    const original = buildFullDraft();
    const cloned = cloneAdminModelDraft(original);

    cloned.features.absCornering = false;
    cloned.brand = 'Mutated';

    expect(original.features.absCornering).toBe(true);
    expect(original.brand).toBe('TestBrand');
  });
});

describe('buildSuggestedModelId', () => {
  it('generates a slug from brand/model/year', () => {
    const draft = buildFullDraft();
    const id = buildSuggestedModelId(draft);

    expect(id).toBe('testbrand-test-model-2025');
  });

  it('returns empty string when all parts are empty', () => {
    const id = buildSuggestedModelId({ brand: '', model: '', year: '' });

    expect(id).toBe('');
  });

  it('handles missing year gracefully', () => {
    const id = buildSuggestedModelId({ brand: 'BMW', model: 'R 1300 GS', year: '' });

    expect(id).toBe('bmw-r-1300-gs');
  });

  it('handles missing brand gracefully', () => {
    const id = buildSuggestedModelId({ brand: '', model: 'MT-09', year: '2024' });

    expect(id).toBe('mt-09-2024');
  });

  it('slugifies multi-word brand and model correctly', () => {
    const id = buildSuggestedModelId({ brand: 'Honda', model: 'NT1100', year: '2022' });

    expect(id).toBe('honda-nt1100-2022');
  });
});

describe('draftToUpdatePayload', () => {
  it('preserves existing behavior exactly', () => {
    const draft = buildFullDraft();
    const payload = draftToUpdatePayload(draft);

    expect(payload.brand).toBe('TestBrand');
    expect(payload.model).toBe('Test Model');
    expect(payload.year).toBe(2025);
    expect(payload.description).toBe('A test bike.');
    expect(payload.segment).toBe('naked');
    expect(payload.license).toBe('A');
    expect(payload.engineType).toBe('inline-four');
    expect(payload.displacementCc).toBe(1000);
    expect(payload.powerHp).toBe(200);
    expect(payload.torqueNm).toBe(120);
    expect(payload.wetWeightKg).toBe(200);
    expect(payload.seatHeightMm).toBe(800);
    expect(payload.fuelTankLiters).toBe(18);
    expect(payload.priceEur).toBe(15000);
    expect(payload.imageUrl).toBe('https://example.com/bike.jpg');
    expect(payload.imageLocked).toBe(true);
    expect(payload.descriptionLocked).toBe(false);
    expect(payload.priceSource).toBe('manual');
    expect(payload.imageSource).toBe('manual');
    expect(payload.specsSource).toBe('manual');
    expect(payload.scoresSource).toBe('estimated');
    expect(payload.prosConsSource).toBe('estimated');
    expect(payload.reliabilitySource).toBe('estimated');
    expect(payload.absCornering).toBe(true);
    expect(payload.tractionControl).toBe(true);
    expect(payload.ridingModes).toBe(true);
    expect(payload.cruiseControl).toBe(false);
    expect(payload.quickshifter).toBe(true);
    expect(payload.heatedGrips).toBe(false);
    expect(payload.tubelessWheels).toBe(false);
  });

  it('handles empty/optional fields by omitting them', () => {
    const payload = draftToUpdatePayload(emptyDraft);

    expect(payload.brand).toBeUndefined();
    expect(payload.model).toBeUndefined();
    expect(payload.year).toBeUndefined();
    expect(payload.description).toBeUndefined();
    expect(payload.segment).toBeUndefined();
    expect(payload.license).toBeUndefined();
    expect(payload.engineType).toBeUndefined();
    expect(payload.displacementCc).toBeUndefined();
    expect(payload.powerHp).toBeUndefined();
    expect(payload.torqueNm).toBeUndefined();
    expect(payload.wetWeightKg).toBeUndefined();
    expect(payload.seatHeightMm).toBeUndefined();
    expect(payload.fuelTankLiters).toBeUndefined();
    expect(payload.priceEur).toBeUndefined();
    expect(payload.imageUrl).toBeUndefined();
  });

  it('handles pricePending as before — omits priceEur when pricePending is true', () => {
    const draft = buildFullDraft({ pricePending: true });
    const payload = draftToUpdatePayload(draft);

    expect(payload.priceEur).toBeUndefined();
  });

  it('handles imageUrl/imageLocked as before', () => {
    const draft = buildFullDraft({ imageUrl: '', imageLocked: false });
    const payload = draftToUpdatePayload(draft);

    expect(payload.imageUrl).toBeUndefined();
    expect(payload.imageLocked).toBe(false);
  });

  it('sets all feature flags from draft values', () => {
    const draft = buildFullDraft();
    const payload = draftToUpdatePayload(draft);

    const expectedFeatures = draft.features;

    expect(payload.absCornering).toBe(expectedFeatures.absCornering);
    expect(payload.tractionControl).toBe(expectedFeatures.tractionControl);
    expect(payload.ridingModes).toBe(expectedFeatures.ridingModes);
    expect(payload.cruiseControl).toBe(expectedFeatures.cruiseControl);
    expect(payload.quickshifter).toBe(expectedFeatures.quickshifter);
    expect(payload.heatedGrips).toBe(expectedFeatures.heatedGrips);
    expect(payload.tubelessWheels).toBe(expectedFeatures.tubelessWheels);
  });
});

describe('draftToCreatePayload', () => {
  it('includes modelId and preserves existing create payload shape', () => {
    const draft = buildFullDraft();
    const payload = draftToCreatePayload(draft, 'suggested-id-2025');

    expect(payload.id).toBe('test-brand-test-model-2025');
    expect(payload.brand).toBe('TestBrand');
    expect(payload.model).toBe('Test Model');
    expect(payload.year).toBe(2025);
    expect(payload.description).toBe('A test bike.');
    expect(payload.segment).toBe('naked');
    expect(payload.license).toBe('A');
    expect(payload.engineType).toBe('inline-four');
    expect(payload.displacementCc).toBe(1000);
    expect(payload.powerHp).toBe(200);
    expect(payload.torqueNm).toBe(120);
    expect(payload.wetWeightKg).toBe(200);
    expect(payload.seatHeightMm).toBe(800);
    expect(payload.fuelTankLiters).toBe(18);
    expect(payload.priceEur).toBe(15000);
    expect(payload.imageUrl).toBe('https://example.com/bike.jpg');
    expect(payload.imageLocked).toBe(true);
    expect(payload.descriptionLocked).toBe(false);
    expect(payload.priceSource).toBe('manual');
    expect(payload.imageSource).toBe('manual');
    expect(payload.specsSource).toBe('manual');
    expect(payload.scoresSource).toBe('estimated');
    expect(payload.prosConsSource).toBe('estimated');
    expect(payload.reliabilitySource).toBe('estimated');
    expect(payload.absCornering).toBe(true);
    expect(payload.tractionControl).toBe(true);
    expect(payload.ridingModes).toBe(true);
    expect(payload.cruiseControl).toBe(false);
    expect(payload.quickshifter).toBe(true);
    expect(payload.heatedGrips).toBe(false);
    expect(payload.tubelessWheels).toBe(false);
  });

  it('handles optional fields exactly as before', () => {
    const payload = draftToCreatePayload(emptyDraft, '');

    expect(payload.id).toBe('');
    expect(payload.brand).toBe('');
    expect(payload.model).toBe('');
    expect(payload.year).toBe(0);
    expect(payload.description).toBe('');
    expect(payload.segment).toBe('');
    expect(payload.license).toBe('');
    expect(payload.engineType).toBe('');
    expect(payload.displacementCc).toBe(0);
    expect(payload.powerHp).toBe(0);
    expect(payload.torqueNm).toBe(0);
    expect(payload.wetWeightKg).toBe(0);
    expect(payload.seatHeightMm).toBe(0);
    expect(payload.fuelTankLiters).toBe(0);
    expect(payload.priceEur).toBe(0);
    expect(payload.imageUrl).toBe('');
  });

  it('uses suggested modelId when modelId is not set in draft', () => {
    const draft = buildFullDraft({ modelId: '' });
    const payload = draftToCreatePayload(draft, 'suggested-id-2025');

    expect(payload.id).toBe('suggested-id-2025');
  });

  it('pricePending sets priceEur to 0', () => {
    const draft = buildFullDraft({ pricePending: true });
    const payload = draftToCreatePayload(draft, '');

    expect(payload.priceEur).toBe(0);
  });
});

describe('validateAdminModelDraftForPublish', () => {
  describe('create mode', () => {
    it('validates modelId is required in create mode', () => {
      const draft = buildFullDraft({ modelId: '' });
      const result = validateAdminModelDraftForPublish(draft, { mode: 'create' });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.message).toBe('El ID del modelo es obligatorio.');
      }
    });

    it('validates modelId has no spaces', () => {
      const draft = buildFullDraft({ modelId: 'has space' });
      const result = validateAdminModelDraftForPublish(draft, { mode: 'create' });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.message).toBe('El ID del modelo no puede contener espacios.');
      }
    });

    it('uses suggested modelId fallback — passes validation when draft is otherwise valid', () => {
      const draft = buildFullDraft({ modelId: '' });
      const result = validateAdminModelDraftForPublish(draft, { mode: 'create', modelId: 'suggested-id' });

      expect(result.isValid).toBe(true);
    });
  });

  describe('edit mode', () => {
    it('does not require modelId in edit mode', () => {
      const draft = buildFullDraft({ modelId: '' });
      const result = validateAdminModelDraftForPublish(draft, { mode: 'edit' });

      expect(result.isValid).toBe(true);
    });
  });

  it('validates required fields exactly as before', () => {
    const cases: { field: keyof AdminModelDraft; message: string; override: Partial<AdminModelDraft> }[] = [
      { field: 'brand', message: 'La marca es obligatoria.', override: { brand: '' } },
      { field: 'model', message: 'El modelo es obligatorio.', override: { model: '' } },
      { field: 'description', message: 'La descripción es obligatoria.', override: { description: '' } },
      { field: 'segment', message: 'El segmento es obligatorio.', override: { segment: '' } },
      { field: 'license', message: 'El carnet es obligatorio.', override: { license: '' } },
      { field: 'engineType', message: 'El tipo de motor es obligatorio.', override: { engineType: '' } },
    ];

    for (const { message, override } of cases) {
      const draft = buildFullDraft(override);
      const result = validateAdminModelDraftForPublish(draft, { mode: 'edit' });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.message).toBe(message);
      }
    }
  });

  it('validates year is between 1900 and 2100', () => {
    const draft = buildFullDraft({ year: '1800' });
    const result = validateAdminModelDraftForPublish(draft, { mode: 'edit' });

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.message).toBe('El año debe ser un número entre 1900 y 2100.');
    }
  });

  it('validates displacementCc > 0', () => {
    const draft = buildFullDraft({ displacementCc: '0' });
    const result = validateAdminModelDraftForPublish(draft, { mode: 'edit' });

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.message).toBe('La cilindrada debe ser un número mayor a 0.');
    }
  });

  it('validates imageUrl is present and starts correctly', () => {
    const draft = buildFullDraft({ imageUrl: '' });
    const result = validateAdminModelDraftForPublish(draft, { mode: 'edit' });

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.message).toBe('La URL de imagen es obligatoria.');
    }
  });

  it('preserves current validation messages/results', () => {
    const draft = buildFullDraft();
    const result = validateAdminModelDraftForPublish(draft, { mode: 'create' });

    expect(result.isValid).toBe(true);
  });

  it('allows relative image paths starting with /', () => {
    const draft = buildFullDraft({ imageUrl: '/images/bike.jpg' });
    const result = validateAdminModelDraftForPublish(draft, { mode: 'edit' });

    expect(result.isValid).toBe(true);
  });

  it('rejects invalid image URL format', () => {
    const draft = buildFullDraft({ imageUrl: 'ftp://bad.com/bike.jpg' });
    const result = validateAdminModelDraftForPublish(draft, { mode: 'edit' });

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.message).toBe('La URL de imagen debe ser una URL absoluta o una ruta local comenzando con /.');
    }
  });
});
