import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import realMotorcycleSeed from '../../../../data/import/motorcycles.json';
import { createReview, getApprovedReviewsByMotorcycleId } from '../../../services/motorcycleReviewService';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import type { Bike } from '../../../types/bike';
import { MOTORCYCLE_IMAGE_FALLBACK_URL } from '../../../shared/images/getMotorcycleImage';
import { BikeDetailPage } from './BikeDetailPage';

vi.mock('../../../services/motorcycleReviewService', () => ({
  createReview: vi.fn(),
  getApprovedReviewsByMotorcycleId: vi.fn(),
}));

const realMotorcycles = realMotorcycleSeed as readonly Bike[];
const getApprovedReviewsMock = vi.mocked(getApprovedReviewsByMotorcycleId);
const createReviewMock = vi.mocked(createReview);

describe('BikeDetailPage', () => {
  beforeEach(() => {
    getApprovedReviewsMock.mockReset();
    createReviewMock.mockReset();
    getApprovedReviewsMock.mockResolvedValue([]);
    createReviewMock.mockResolvedValue({
      id: 'review-new',
      motorcycleId: bikeFixtures[0].id,
      userName: 'Dani',
      rating: 5,
      ridingStyle: 'viaje',
      ownershipMonths: null,
      kilometers: null,
      comment: 'Muy buena.',
      pros: [],
      cons: [],
      verified: false,
      status: 'pending',
      createdAt: '2026-05-14T10:00:00.000Z',
      updatedAt: '2026-05-14T10:00:00.000Z',
    });
  });

  it('renders name, brand, year and main specs from fixtures', () => {
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    expect(screen.getByRole('heading', { name: /BMW F 900 GS/i })).toBeInTheDocument();
    expect(screen.getAllByText('2024').length).toBeGreaterThan(0);
    expect(screen.getByText(/Trail media con electrónica completa/i)).toBeInTheDocument();

    const mainSpecs = screen.getByRole('group', { name: 'Datos principales' });
    expect(within(mainSpecs).getByText('Potencia')).toBeInTheDocument();
    expect(within(mainSpecs).getByText(/105/)).toBeInTheDocument();
    expect(within(mainSpecs).getByText('Peso')).toBeInTheDocument();
    expect(within(mainSpecs).getByText(/219/)).toBeInTheDocument();
    expect(within(mainSpecs).getByText('Motor')).toBeInTheDocument();
    expect(within(mainSpecs).getByText(/895/)).toBeInTheDocument();
  });

  it('shows pros and cons in Resumen tab', () => {
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    expect(screen.getByText('Motor elástico')).toBeInTheDocument();
    expect(screen.getByText('Buen equilibrio')).toBeInTheDocument();
    expect(screen.getByText('Precio alto')).toBeInTheDocument();
  });

  it('shows common reliability issues inside Comunidad tab', async () => {
    const user = userEvent.setup();
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    await user.click(screen.getByRole('tab', { name: /Comunidad/i }));

    const communityTab = document.querySelector('.bike-detail__community-tab') as HTMLElement;
    expect(within(communityTab).getByText('Calor en ciudad')).toBeInTheDocument();
  });

  it('has a working add-to-comparator link without calling Supabase', () => {
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    expect(screen.getByRole('link', { name: /Añadir al comparador/i })).toHaveAttribute(
      'href',
      '#/buscador?compare=test-bmw-f-900-gs',
    );
  });

  it('has working links back to the search page', () => {
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    expect(screen.getByRole('link', { name: /Volver al catálogo/i })).toHaveAttribute('href', '#/buscador');
    expect(screen.getByRole('link', { name: /Ver más motos/i })).toHaveAttribute('href', '#/buscador?browse=1');
  });

  it('renders related motorcycles from local fixtures inside Comparar tab', async () => {
    const user = userEvent.setup();
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    await user.click(screen.getByRole('tab', { name: /Comparar/i }));

    expect(screen.getByRole('heading', { name: /Aprilia Tuareg 660/i })).toBeInTheDocument();
  });

  it('renders a not found state when the motorcycle is missing', () => {
    render(<BikeDetailPage motorcycles={bikeFixtures} />);

    expect(screen.getByRole('heading', { name: /Moto no encontrada/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver al buscador/i })).toHaveAttribute('href', '#/buscador');
  });

  it('renders a real motorcycle from the current JSON seed', () => {
    const bmwF900Gs = realMotorcycles.find((bike) => bike.id === 'bmw-f-900-gs-2024');

    render(<BikeDetailPage bike={bmwF900Gs} motorcycles={realMotorcycles} />);

    expect(screen.getByRole('heading', { name: /BMW F 900 GS/i })).toBeInTheDocument();
    expect(screen.getByText(/Trail media-alta con mucho par/i)).toBeInTheDocument();

    const mainSpecs = screen.getByRole('group', { name: 'Datos principales' });
    expect(within(mainSpecs).getByText(/105/)).toBeInTheDocument();
    expect(within(mainSpecs).getByText(/895/)).toBeInTheDocument();
  });

  it('renders a pending technical image overlay when detail image is missing', () => {
    const bikeWithoutImage = { ...bikeFixtures[0], imageUrl: '' } as Bike;

    const { container } = render(<BikeDetailPage bike={bikeWithoutImage} motorcycles={[bikeWithoutImage, ...bikeFixtures.slice(1)]} />);

    expect(screen.getByText('TECHNICAL IMAGE PENDING')).toBeInTheDocument();
    expect(container.querySelector(`img[src="${MOTORCYCLE_IMAGE_FALLBACK_URL}"]`)).toBeInTheDocument();
  });

  it('renders approved reviews inside Comunidad tab with FeaturedReviewCard', async () => {
    getApprovedReviewsMock.mockResolvedValue([
      {
        id: 'review-1',
        motorcycleId: bikeFixtures[0].id,
        userName: 'Laura',
        rating: 5,
        ridingStyle: 'viaje',
        ownershipMonths: 10,
        kilometers: 12000,
        comment: 'Muy equilibrada para viajar.',
        pros: [],
        cons: [],
        verified: false,
        status: 'approved',
        createdAt: '2026-05-14T10:00:00.000Z',
        updatedAt: '2026-05-14T10:00:00.000Z',
      },
      {
        id: 'review-2',
        motorcycleId: bikeFixtures[0].id,
        userName: 'Marc',
        rating: 4,
        ridingStyle: 'diario',
        ownershipMonths: null,
        kilometers: null,
        comment: 'Cara, pero completa.',
        pros: [],
        cons: [],
        verified: false,
        status: 'approved',
        createdAt: '2026-05-14T10:00:00.000Z',
        updatedAt: '2026-05-14T10:00:00.000Z',
      },
    ]);

    const user = userEvent.setup();
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    const tabs = await screen.findAllByRole('tab');
    const comunidadTab = tabs.find(tab => tab.textContent?.includes('Comunidad'));
    if (!comunidadTab) {
      throw new Error('Comunidad tab not found');
    }
    await user.click(comunidadTab);

    const reviewCards = await screen.findAllByTestId('featured-review-card');
    expect(reviewCards).toHaveLength(2);
    expect(within(reviewCards[0]).getByText('@Laura')).toBeInTheDocument();
  });

  it('opens the review modal from the Comunidad tab', async () => {
    const user = userEvent.setup();
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    const tabs = await screen.findAllByRole('tab');
    const comunidadTab = tabs.find(tab => tab.textContent?.includes('Comunidad'));
    if (!comunidadTab) {
      throw new Error('Comunidad tab not found');
    }
    await user.click(comunidadTab);

    const communitySection = document.querySelector('.bike-detail__community-tab') as HTMLElement | null;
    if (!communitySection) {
      throw new Error('Community tab content not rendered');
    }
    const writeReviewButtons = within(communitySection).getAllByRole('button', { name: /Escribir review/i });
    expect(writeReviewButtons.length).toBeGreaterThan(0);
    await user.click(writeReviewButtons[0]);
    expect(createReviewMock).not.toHaveBeenCalled();
  });

  it('links to the future community reviews route', () => {
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    expect(screen.getByRole('link', { name: /Ver reviews/i })).toHaveAttribute('href', `#/comunidad/${bikeFixtures[0].id}`);
  });

  it('renderiza “Ver reviews” en el hero sin romper CTAs existentes', () => {
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    const heroActions = screen.getByRole('group', { name: /Acciones principales de la ficha/i });

    expect(within(heroActions).getByRole('link', { name: /Ver reviews/i })).toHaveAttribute(
      'href',
      `#/comunidad/${bikeFixtures[0].id}`,
    );
    expect(within(heroActions).getByRole('link', { name: /Ver más motos/i })).toHaveAttribute('href', '#/buscador?browse=1');
  });

  it('muestra Página oficial solo si la moto trae officialUrl', () => {
    const bikeWithOfficialUrl = {
      ...bikeFixtures[0],
      officialUrl: 'https://www.bmw-motorrad.es/',
    } satisfies Bike;

    const { rerender } = render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);
    expect(screen.queryByRole('link', { name: /Página oficial/i })).not.toBeInTheDocument();

    rerender(<BikeDetailPage bike={bikeWithOfficialUrl} motorcycles={[bikeWithOfficialUrl, ...bikeFixtures.slice(1)]} />);

    const officialLink = screen.getByRole('link', { name: /Página oficial/i });
    expect(officialLink).toHaveAttribute('href', 'https://www.bmw-motorrad.es/');
    expect(officialLink).toHaveAttribute('target', '_blank');
    expect(officialLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renderiza cuatro tabs: Resumen, Especificaciones, Comunidad, Comparar', () => {
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    const tablist = screen.getByRole('tablist', { name: /Secciones de la ficha/i });
    expect(within(tablist).getAllByRole('tab')).toHaveLength(4);
    expect(within(tablist).getByText('Resumen')).toBeInTheDocument();
    expect(within(tablist).getByText('Especificaciones')).toBeInTheDocument();
    expect(within(tablist).getByText('Comunidad')).toBeInTheDocument();
    expect(within(tablist).getByText('Comparar')).toBeInTheDocument();
  });

  it('no existe tab Metodología', () => {
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    expect(screen.queryByRole('tab', { name: /Metodología/i })).not.toBeInTheDocument();
  });

  it('Resumen activo por defecto', () => {
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    const resumenTab = screen.getByRole('tab', { name: /Resumen/i });
    expect(resumenTab).toHaveAttribute('aria-selected', 'true');
    expect(resumenTab).toHaveClass('bike-detail__tab--active');
  });

  it('al hacer click en Resumen aparecen contenidos de riding y fit', async () => {
    const user = userEvent.setup();
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    await user.click(screen.getByRole('tab', { name: /Resumen/i }));

    expect(screen.getByRole('heading', { name: /Perfil dinámico/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /¿Es esta moto para ti?/i })).toBeInTheDocument();
  });

  it('al hacer click en Especificaciones muestra cards técnicas de specs', async () => {
    const user = userEvent.setup();
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    await user.click(screen.getByRole('tab', { name: /Especificaciones/i }));

    expect(screen.getByText('MOTOR')).toBeInTheDocument();
    expect(screen.getByText('POTENCIA')).toBeInTheDocument();
    expect(screen.getByText('TORQUE')).toBeInTheDocument();
    expect(screen.getByText('PESO')).toBeInTheDocument();
    expect(screen.getByText('ALTURA ASIENTO')).toBeInTheDocument();
    expect(screen.getByText('DEPÓSITO')).toBeInTheDocument();
    expect(screen.getByText('CARNET')).toBeInTheDocument();
    expect(screen.getByText('PRECIO BASE')).toBeInTheDocument();
  });

  it('Especificaciones muestra cilindrada, potencia, par y peso con valores correctos', async () => {
    const user = userEvent.setup();
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    await user.click(screen.getByRole('tab', { name: /Especificaciones/i }));

    const specsTab = document.querySelector('.bike-detail__specs-tab') as HTMLElement;
    expect(specsTab).toBeInTheDocument();
    const withinSpecs = within(specsTab);
    expect(withinSpecs.getByText('895')).toBeInTheDocument();
    expect(withinSpecs.getByText('105')).toBeInTheDocument();
    expect(withinSpecs.getByText('93')).toBeInTheDocument();
    expect(withinSpecs.getByText('219')).toBeInTheDocument();
  });

  it('Especificaciones no renderiza suspensiones, frenos ni neumáticos porque no existen en el modelo', async () => {
    const user = userEvent.setup();
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    await user.click(screen.getByRole('tab', { name: /Especificaciones/i }));

    expect(screen.queryByText(/Suspensión/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Frenos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Neumático/i)).not.toBeInTheDocument();
  });

  it('Especificaciones muestra features activas como chips, no las inactivas', async () => {
    const user = userEvent.setup();
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    await user.click(screen.getByRole('tab', { name: /Especificaciones/i }));

    expect(screen.getByText('ABS en curva')).toBeInTheDocument();
    expect(screen.getByText('Quickshifter')).toBeInTheDocument();
    expect(screen.queryByText('Puños calefactables')).not.toBeInTheDocument();
  });

  it('Especificaciones muestra A2 badge y versión limitada si aplica', async () => {
    const user = userEvent.setup();
    render(<BikeDetailPage bike={bikeFixtures[1]} motorcycles={bikeFixtures} />);

    await user.click(screen.getByRole('tab', { name: /Especificaciones/i }));

    expect(screen.getByText('COMPATIBILIDAD A2')).toBeInTheDocument();
    expect(screen.getByText('Limitada a 47.6 CV (orig. 80 CV)')).toBeInTheDocument();
  });

  it('Especificaciones no muestra bloque A2 para moto no A2 compatible', async () => {
    const user = userEvent.setup();
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    await user.click(screen.getByRole('tab', { name: /Especificaciones/i }));

    expect(screen.queryByText('COMPATIBILIDAD A2')).not.toBeInTheDocument();
  });

  it('Precio pendiente no muestra 0 ni valor falso', async () => {
    const bikeWithPendingPrice = {
      ...bikeFixtures[0],
      priceEur: 0,
      priceSource: 'placeholder' as const,
    } satisfies Bike;

    const user = userEvent.setup();
    render(<BikeDetailPage bike={bikeWithPendingPrice} motorcycles={bikeFixtures} />);

    await user.click(screen.getByRole('tab', { name: /Especificaciones/i }));

    const specsTab = document.querySelector('.bike-detail__specs-tab') as HTMLElement;
    expect(specsTab?.innerHTML).toContain('Precio pendiente');
    expect(specsTab?.innerHTML).not.toContain('0 €');
  });

  it('al hacer click en Comunidad muestra mini resumen comunitario', async () => {
    const user = userEvent.setup();
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    await user.click(screen.getByRole('tab', { name: /Comunidad/i }));

    const communityTab = document.querySelector('.bike-detail__community-tab');
    expect(communityTab).toBeInTheDocument();
  });

  it('al hacer click en Comparar muestra related bikes', async () => {
    const user = userEvent.setup();
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    await user.click(screen.getByRole('tab', { name: /Comparar/i }));

    expect(screen.queryByText('Comparador próximamente')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Rivales del mismo segmento/i })).toBeInTheDocument();
  });

  it('no aparece null ni undefined en tabs', () => {
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    const html = screen.getByRole('main').innerHTML;
    expect(html).not.toContain('null');
    expect(html).not.toContain('undefined');
  });
});
