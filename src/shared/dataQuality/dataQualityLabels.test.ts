import { describe, expect, it } from 'vitest';
import {
  dataQualityLabels,
  getDataQualityLabel,
  isLowConfidenceSource,
  isPendingPrice,
  pendingPriceLabel,
} from './dataQualityLabels';

describe('dataQualityLabels', () => {
  it('mapea fuentes técnicas a textos amigables para usuario final', () => {
    expect(dataQualityLabels.placeholder).toBe('Pendiente de confirmar');
    expect(dataQualityLabels.estimated).toBe('Estimado');
    expect(dataQualityLabels.api).toBe('Dato técnico');
    expect(dataQualityLabels.manual).toBe('Revisado');
    expect(dataQualityLabels.user).toBe('Comunidad');
    expect(getDataQualityLabel(undefined)).toBe('Estimado');
  });

  it('detecta datos de baja confianza sin exponer texto debug', () => {
    expect(isLowConfidenceSource('placeholder')).toBe(true);
    expect(isLowConfidenceSource('estimated')).toBe(true);
    expect(isLowConfidenceSource('manual')).toBe(false);
  });

  it('detecta precio pendiente con etiqueta de UX', () => {
    expect(isPendingPrice(0, 'placeholder')).toBe(true);
    expect(isPendingPrice(12999, 'manual')).toBe(false);
    expect(pendingPriceLabel).toBe('Precio pendiente de confirmar');
  });
});
