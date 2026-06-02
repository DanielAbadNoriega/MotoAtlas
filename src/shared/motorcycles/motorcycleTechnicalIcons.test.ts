import { describe, expect, it } from 'vitest';
import {
  motorcycleTechnicalIconMap,
  getMotorcycleTechnicalIcon,
  type MotorcycleTechnicalIconKey,
} from './motorcycleTechnicalIcons';

describe('motorcycleTechnicalIcons', () => {
  it('exports a map with all expected spec keys', () => {
    const specKeys = [
      'engine',
      'power',
      'torque',
      'weight',
      'seatHeight',
      'fuelTank',
      'license',
      'price',
    ] as const;

    specKeys.forEach((key) => {
      expect(key in motorcycleTechnicalIconMap).toBe(true);
    });
  });

  it('exports all review technical aspect keys', () => {
    const reviewKeys = [
      'electronics',
      'aerodynamics',
      'braking',
      'suspension',
      'ergonomics',
      'consumption',
      'passenger',
      'maintenance',
      'design',
    ] as const;

    reviewKeys.forEach((key) => {
      expect(key in motorcycleTechnicalIconMap).toBe(true);
    });
  });

  it('a2 is NOT a top-level icon key (A2 is a license variant)', () => {
    expect('a2' in motorcycleTechnicalIconMap).toBe(false);
  });

  it('getMotorcycleTechnicalIcon returns correct icon for engine', () => {
    expect(getMotorcycleTechnicalIcon('engine')).toBe('settings_input_component');
  });

  it('getMotorcycleTechnicalIcon returns correct icon for power', () => {
    expect(getMotorcycleTechnicalIcon('power')).toBe('bolt');
  });

  it('getMotorcycleTechnicalIcon returns correct icon for fuelTank', () => {
    expect(getMotorcycleTechnicalIcon('fuelTank')).toBe('oil_barrel');
  });

  it('getMotorcycleTechnicalIcon returns correct icon for license', () => {
    expect(getMotorcycleTechnicalIcon('license')).toBe('workspace_premium');
  });

  it('getMotorcycleTechnicalIcon returns correct icon for electronics', () => {
    expect(getMotorcycleTechnicalIcon('electronics')).toBe('memory');
  });

  it('getMotorcycleTechnicalIcon type prevents invalid keys', () => {
    const key: MotorcycleTechnicalIconKey = 'weight';
    expect(getMotorcycleTechnicalIcon(key)).toBe('weight');
  });
});