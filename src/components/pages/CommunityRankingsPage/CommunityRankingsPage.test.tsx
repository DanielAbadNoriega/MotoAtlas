import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getApprovedCommunityReviews, getReviewAspectsByReviewIds, type MotorcycleReview } from '../../../services/motorcycleReviewService';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import { createApprovedReviewFixture } from '../../../test/fixtures/reviews';
import { CommunityRankingsPage } from './CommunityRankingsPage';

vi.mock('../../../services/motorcycleReviewService', () => ({
  getApprovedCommunityReviews: vi.fn(),
  getReviewAspectsByReviewIds: vi.fn(),
}));

const getApprovedCommunityReviewsMock = vi.mocked(getApprovedCommunityReviews);
const getReviewAspectsByReviewIdsMock = vi.mocked(getReviewAspectsByReviewIds);

function createReview(overrides: Partial<MotorcycleReview> = {}): MotorcycleReview {
  const id = overrides.id ?? 'review-1';
  const index = Number(id.replace(/\D/g, '')) || 1;
  const motorcycleId = overrides.motorcycleId ?? bikeFixtures[index % bikeFixtures.length].id;

  return {
    id,
    motorcycleId,
    userId: null,
    userName: 'Test User',
    rating: overrides.rating ?? 4,
    ridingStyle: overrides.ridingStyle ?? 'viaje',
    ownershipMonths: 12,
    kilometers: 5000,
    comment: 'Test comment',
    pros: ['Good'],
    cons: ['Bad'],
    verified: false,
    status: overrides.status ?? 'approved',
    source: 'user',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('CommunityRankingsPage', () => {
  beforeEach(() => {
    getApprovedCommunityReviewsMock.mockReset();
    getApprovedCommunityReviewsMock.mockResolvedValue([]);
    getReviewAspectsByReviewIdsMock.mockReset();
    getReviewAspectsByReviewIdsMock.mockResolvedValue([]);
  });

  it('renderiza la página sin elementos ficticios de Stitch', () => {
    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    expect(screen.getByRole('heading', { name: /Las motos mejor valoradas por la comunidad/i })).toBeInTheDocument();
    expect(screen.getByText(/RANKINGS DE COMUNIDAD/i)).toBeInTheDocument();
    expect(screen.queryByText(/TopAppBar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sign In/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/STATUS: ACQUIRING TELEMETRY/i)).not.toBeInTheDocument();
  });

  it('renderiza el hero con eyebrow y acciones', () => {
    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    expect(screen.getByText('RANKINGS DE COMUNIDAD')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explorar rankings/i })).toHaveAttribute('href', '#rankings-categories');
    const allVerComunidadLinks = screen.getAllByRole('link', { name: /Ver comunidad/i });
    expect(allVerComunidadLinks[0]).toHaveAttribute('href', '#/comunidad');
  });

  it('renderiza el podium top 3', () => {
    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    const podiumCard = screen.getByRole('article', { name: /Puesto 1: BMW F 900 GS/i });
    expect(podiumCard).toBeInTheDocument();
  });

  it('renderiza las 8 categorías de rankings', () => {
    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    expect(screen.getByText('Mejor valoración global')).toBeInTheDocument();
    expect(screen.getByText('Más recomendadas día a día')).toBeInTheDocument();
    expect(screen.getByText('Mejores para viajar')).toBeInTheDocument();
    expect(screen.getByText('Más deportivas')).toBeInTheDocument();
    expect(screen.getByText('Más equilibradas carnet A2')).toBeInTheDocument();
    expect(screen.getByText('Mejor relación peso/potencia')).toBeInTheDocument();
    expect(screen.getByText('Más fiables según usuarios')).toBeInTheDocument();
    expect(screen.getByText('Más cómodas con pasajero')).toBeInTheDocument();
  });

  it('renderiza los filtros de segmento y búsqueda', () => {
    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    expect(screen.getByLabelText('Segmento')).toBeInTheDocument();
    expect(screen.getByLabelText('Buscar modelo')).toBeInTheDocument();
  });

  it('renderiza el listado técnico de rankings', () => {
    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    const table = screen.getByLabelText('Listado técnico de rankings');
    expect(table).toBeInTheDocument();
  });

  it('renderiza el bloque de metodología con escala 0-10 y diferenciación de estrellas', () => {
    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    expect(screen.getByRole('heading', { name: /Nuestra Metodología/i })).toBeInTheDocument();
    expect(screen.getByText(/escala 0–10/i)).toBeInTheDocument();
    expect(screen.getByText(/estrellas pertenecen a las reviews/i)).toBeInTheDocument();
  });

  it('renderiza el CTA final', () => {
    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    expect(screen.getByRole('heading', { name: /Tu experiencia también cuenta/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Publicar review/i })).toHaveAttribute('href', '#/comunidad/reviews');
  });

  it('filtra por segmento cuando se cambia el select', async () => {
    window.location.hash = '#/comunidad/rankings';
    const { container } = render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    const segmentSelect = screen.getByLabelText('Segmento');

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      'value',
    )?.set;
    nativeInputValueSetter?.call(segmentSelect, 'naked');
    segmentSelect.dispatchEvent(new Event('change', { bubbles: true }));

    expect(container.querySelector('.rankings__categories-grid')).toBeInTheDocument();
  });

  it('llama a getApprovedCommunityReviews', async () => {
    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    await waitFor(() => {
      expect(getApprovedCommunityReviewsMock).toHaveBeenCalledTimes(1);
    });
  });

  it('muestra shield con Alta confianza cuando hay 10+ reviews', async () => {
    getReviewAspectsByReviewIdsMock.mockResolvedValue([]);

    getApprovedCommunityReviewsMock.mockResolvedValue([
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 5 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 4 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 5 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 4 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 5 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 4 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 5 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 4 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 5 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 4 }),
    ]);

    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    await waitFor(() => {
      const shield = document.querySelector('.rankings__confidence-shield--high');
      expect(shield).toBeInTheDocument();
      expect(shield?.getAttribute('aria-label')).toBe('Alta confianza');
      const tooltip = shield?.querySelector('.rankings__confidence-tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip?.getAttribute('role')).toBe('tooltip');
      expect(tooltip?.textContent).toBe('Alta confianza');
      const icon = shield?.querySelector('.material-symbols-outlined');
      expect(icon).toBeInTheDocument();
      expect(icon?.textContent).toBe('shield');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('muestra shield con Media confianza cuando hay 3-9 reviews', async () => {
    getReviewAspectsByReviewIdsMock.mockResolvedValue([]);

    getApprovedCommunityReviewsMock.mockResolvedValue([
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 5 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 4 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 5 }),
    ]);

    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    await waitFor(() => {
      const shield = document.querySelector('.rankings__confidence-shield--medium');
      expect(shield).toBeInTheDocument();
      expect(shield?.getAttribute('aria-label')).toBe('Media confianza');
      const tooltip = shield?.querySelector('.rankings__confidence-tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip?.getAttribute('role')).toBe('tooltip');
      expect(tooltip?.textContent).toBe('Media confianza');
      const icon = shield?.querySelector('.material-symbols-outlined');
      expect(icon).toBeInTheDocument();
      expect(icon?.textContent).toBe('shield');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('no muestra shield de confianza cuando no hay reviews', async () => {
    getApprovedCommunityReviewsMock.mockResolvedValue([]);

    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    await waitFor(() => {
      expect(document.querySelector('.rankings__confidence-shield')).not.toBeInTheDocument();
    });
  });

  it('muestra shield con Baja confianza cuando hay 1-2 reviews', async () => {
    getReviewAspectsByReviewIdsMock.mockResolvedValue([]);

    getApprovedCommunityReviewsMock.mockResolvedValue([
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 4 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 5 }),
    ]);

    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    await waitFor(() => {
      const shield = document.querySelector('.rankings__confidence-shield--low');
      expect(shield).toBeInTheDocument();
      expect(shield?.getAttribute('aria-label')).toBe('Baja confianza');
      const tooltip = shield?.querySelector('.rankings__confidence-tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip?.getAttribute('role')).toBe('tooltip');
      expect(tooltip?.textContent).toBe('Baja confianza');
      const icon = shield?.querySelector('.material-symbols-outlined');
      expect(icon).toBeInTheDocument();
      expect(icon?.textContent).toBe('shield');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('shield de confianza tiene icono visible y aria-hidden en el span interno', async () => {
    getReviewAspectsByReviewIdsMock.mockResolvedValue([]);

    getApprovedCommunityReviewsMock.mockResolvedValue([
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 5 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 4 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 5 }),
    ]);

    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    await waitFor(() => {
      const shieldWrapper = document.querySelector('.rankings__confidence-shield--medium');
      expect(shieldWrapper).toBeInTheDocument();
      const iconSpan = shieldWrapper?.querySelector('.material-symbols-outlined');
      expect(iconSpan).toBeInTheDocument();
      expect(iconSpan?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('no muestra texto null en el podium', async () => {
    getApprovedCommunityReviewsMock.mockResolvedValue([]);

    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    await waitFor(() => {
      expect(screen.queryByText(/null/i)).not.toBeInTheDocument();
    });
  });

  it('usa icono analytics en podium y no estrella', async () => {
    getReviewAspectsByReviewIdsMock.mockResolvedValue([]);

    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    const analyticsIcon = document.querySelector('.rankings__rating-icon');
    expect(analyticsIcon).toBeInTheDocument();
    expect(analyticsIcon?.textContent).toBe('analytics');
    expect(document.querySelector('.rankings__rating-star')).not.toBeInTheDocument();
  });

  it('muestra tooltip en categorías de ranking', async () => {
    getApprovedCommunityReviewsMock.mockResolvedValue([]);

    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    const globalCard = document.querySelector('.rankings__category-card[title*="Valoración"]');
    expect(globalCard).toBeInTheDocument();
  });

  it('muestra tooltips de cada categoría', async () => {
    getApprovedCommunityReviewsMock.mockResolvedValue([]);

    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    const dailyCard = document.querySelector('.rankings__category-card[title*="Uso diario"]');
    expect(dailyCard).toBeInTheDocument();

    const travelCard = document.querySelector('.rankings__category-card[title*="Viajes"]');
    expect(travelCard).toBeInTheDocument();
  });

  it('TechnicalTable no muestra sufijo A de confianza en rating', async () => {
    getReviewAspectsByReviewIdsMock.mockResolvedValue([]);

    getApprovedCommunityReviewsMock.mockResolvedValue([
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 5 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 4 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 5 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 4 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 5 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 4 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 5 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 4 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 5 }),
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 4 }),
    ]);

    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Listado técnico de rankings')).toBeInTheDocument();
    });

    const table = screen.getByLabelText('Listado técnico de rankings');
    const tableContent = table.textContent ?? '';
    expect(tableContent).not.toMatch(/A\b/);
    const confidenceBadge = within(table).queryByText('A');
    expect(confidenceBadge).not.toBeInTheDocument();
  });

  it('TechnicalTable no muestra .rankings__table-confidence', async () => {
    getReviewAspectsByReviewIdsMock.mockResolvedValue([]);
    getApprovedCommunityReviewsMock.mockResolvedValue([
      createReview({ motorcycleId: 'test-bmw-f-900-gs', rating: 5 }),
    ]);

    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Listado técnico de rankings')).toBeInTheDocument();
    });

    expect(document.querySelector('.rankings__table-confidence')).not.toBeInTheDocument();
  });

  it('filtro segmento naked filtra resultados de tabla técnica', async () => {
    getReviewAspectsByReviewIdsMock.mockResolvedValue([]);
    getApprovedCommunityReviewsMock.mockResolvedValue([]);

    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Listado técnico de rankings')).toBeInTheDocument();
    });

    const segmentSelect = screen.getByLabelText('Segmento');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      'value',
    )?.set;
    nativeInputValueSetter?.call(segmentSelect, 'naked');
    segmentSelect.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => {
      const table = screen.getByLabelText('Listado técnico de rankings');
      expect(table.textContent).toContain('MT-09');
      expect(table.textContent).not.toContain('F 900 GS');
    });
  });

  it('filtro carnet A2 filtra resultados de tabla técnica', async () => {
    getReviewAspectsByReviewIdsMock.mockResolvedValue([]);
    getApprovedCommunityReviewsMock.mockResolvedValue([]);

    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Listado técnico de rankings')).toBeInTheDocument();
    });

    const licenseSelect = screen.getByLabelText('Carnet');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      'value',
    )?.set;
    nativeInputValueSetter?.call(licenseSelect, 'A2');
    licenseSelect.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => {
      const table = screen.getByLabelText('Listado técnico de rankings');
      expect(table.textContent).toContain('Tuareg 660');
    });
  });

  it('filtro uso ciudad afecta resultados', async () => {
    getReviewAspectsByReviewIdsMock.mockResolvedValue([]);
    getApprovedCommunityReviewsMock.mockResolvedValue([]);

    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Listado técnico de rankings')).toBeInTheDocument();
    });

    const useSelect = screen.getByLabelText('Uso');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      'value',
    )?.set;
    nativeInputValueSetter?.call(useSelect, 'city');
    useSelect.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => {
      const table = screen.getByLabelText('Listado técnico de rankings');
      expect(table.textContent).toBeTruthy();
    });
  });

  it('filtro búsqueda filtra resultados de tabla técnica', async () => {
    getReviewAspectsByReviewIdsMock.mockResolvedValue([]);
    getApprovedCommunityReviewsMock.mockResolvedValue([]);

    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Listado técnico de rankings')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Buscar modelo');
    searchInput.focus();
    await userEvent.type(searchInput, 'BMW');

    await waitFor(() => {
      const table = screen.getByLabelText('Listado técnico de rankings');
      expect(table.textContent).toContain('F 900 GS');
      expect(table.textContent).not.toContain('MT-09');
    });
  });

  it('podium no refleja filtros de segmento', async () => {
    getReviewAspectsByReviewIdsMock.mockResolvedValue([]);
    getApprovedCommunityReviewsMock.mockResolvedValue([
      createReview({ motorcycleId: 'test-aprilia-tuareg-660', rating: 5 }),
      createReview({ motorcycleId: 'test-aprilia-tuareg-660', rating: 5 }),
      createReview({ motorcycleId: 'test-aprilia-tuareg-660', rating: 5 }),
      createReview({ motorcycleId: 'test-aprilia-tuareg-660', rating: 5 }),
      createReview({ motorcycleId: 'test-aprilia-tuareg-660', rating: 5 }),
      createReview({ motorcycleId: 'test-aprilia-tuareg-660', rating: 5 }),
      createReview({ motorcycleId: 'test-aprilia-tuareg-660', rating: 5 }),
      createReview({ motorcycleId: 'test-aprilia-tuareg-660', rating: 5 }),
      createReview({ motorcycleId: 'test-aprilia-tuareg-660', rating: 5 }),
      createReview({ motorcycleId: 'test-aprilia-tuareg-660', rating: 5 }),
    ]);

    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Puesto 1: Aprilia Tuareg 660')).toBeInTheDocument();
    });

    const segmentSelect = screen.getByLabelText('Segmento');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      'value',
    )?.set;
    nativeInputValueSetter?.call(segmentSelect, 'naked');
    segmentSelect.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => {
      expect(screen.getByLabelText('Puesto 1: Aprilia Tuareg 660')).toBeInTheDocument();
    });
  });

  it('no aparece texto null en resultados filtrados', async () => {
    getReviewAspectsByReviewIdsMock.mockResolvedValue([]);
    getApprovedCommunityReviewsMock.mockResolvedValue([]);

    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Listado técnico de rankings')).toBeInTheDocument();
    });

    expect(screen.queryByText(/null/i)).not.toBeInTheDocument();
  });
});
