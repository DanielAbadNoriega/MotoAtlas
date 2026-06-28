import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MotorcycleReview, MotorcycleReviewAspect } from '../../../services/motorcycleReviewService';
import { FeaturedReviewCard } from './FeaturedReviewCard';

function createReview(overrides: Partial<MotorcycleReview> = {}): MotorcycleReview {
  const id = overrides.id ?? 'review-1';
  const index = Number(id.replace(/\D/g, '')) || 1;

  return {
    id,
    motorcycleId: overrides.motorcycleId ?? `moto-${index}`,
    userId: null,
    motorcycle: overrides.motorcycle ?? {
      id: `moto-${index}`,
      brand: 'BMW',
      model: `F 900 GS ${index}`,
      year: 2024,
      imageUrl: '/bmw-f900gs.webp',
      segment: 'trail',
      license: 'A',
    },
    userName: overrides.userName ?? 'Rider 1',
    rating: overrides.rating ?? 4,
    ridingStyle: overrides.ridingStyle ?? 'viaje',
    ownershipMonths: overrides.ownershipMonths ?? 12,
    kilometers: overrides.kilometers ?? 15000,
    comment: overrides.comment ?? 'Review de prueba con mucho texto.',
    pros: overrides.pros ?? ['Motor suave', 'Consumo contenido'],
    cons: overrides.cons ?? ['Suspensión algo rígida'],
    verified: false,
    status: 'approved',
    source: 'user',
    createdAt: overrides.createdAt ?? '2026-05-15T10:00:00.000Z',
    updatedAt: '2026-05-15T10:00:00.000Z',
  };
}

function createAspects(overrides: Partial<MotorcycleReviewAspect>[] = []): MotorcycleReviewAspect[] {
  return overrides.length > 0 ? overrides as MotorcycleReviewAspect[] : [];
}

describe('FeaturedReviewCard', () => {
  const user = userEvent.setup();

  it('renderiza título', async () => {
    const review = createReview({ motorcycle: { id: 'moto-1', brand: 'Honda', model: 'CBR650R', year: 2024, imageUrl: '/honda.webp', segment: 'naked', license: 'A' } });
    render(<FeaturedReviewCard review={review} />);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Honda CBR650R 2024');
  });

  it('renderiza metadatos en orden: uso, tiempo, kms, fecha', async () => {
    const review = createReview({
      ridingStyle: 'offroad',
      ownershipMonths: 24,
      kilometers: 30000,
      createdAt: '2026-03-01T10:00:00.000Z',
    });
    render(<FeaturedReviewCard review={review} />);

    const meta = screen.getByRole('list', { name: 'Metadatos de la review' });
    const items = within(meta).getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent('Offroad');
    expect(items[1]).toHaveTextContent('24 meses');
    expect(items[2]).toHaveTextContent('30.000 km');
    expect(items[3]).toHaveTextContent('01 mar 2026');
  });

  it('renderiza rating con aria-label', async () => {
    const review = createReview({ rating: 5 });
    render(<FeaturedReviewCard review={review} />);

    const rating = screen.getByLabelText('Rating 5 de 5');
    expect(rating).toHaveTextContent('5');
    expect(within(rating).getByText('★')).toBeInTheDocument();
  });

  it('body cerrado por defecto', async () => {
    const review = createReview();
    render(<FeaturedReviewCard review={review} />);

    const body = document.getElementById(`featured-review-body-${review.id}`);
    expect(body).toBeInTheDocument();
    expect(body).toHaveAttribute('aria-hidden', 'true');
    expect(body).not.toHaveClass('featured-review-card__body--open');
  });

  it('click en header abre body', async () => {
    const review = createReview();
    render(<FeaturedReviewCard review={review} />);

    const header = screen.getByRole('button');
    await user.click(header);

    const body = document.getElementById(`featured-review-body-${review.id}`);
    expect(body).toHaveAttribute('aria-hidden', 'false');
    expect(body).toHaveClass('featured-review-card__body--open');
  });

  it('click de nuevo cierra body', async () => {
    const review = createReview();
    render(<FeaturedReviewCard review={review} />);

    const header = screen.getByRole('button');
    await user.click(header);
    await user.click(header);

    const body = document.getElementById(`featured-review-body-${review.id}`);
    expect(body).toHaveAttribute('aria-hidden', 'true');
    expect(body).not.toHaveClass('featured-review-card__body--open');
  });

  it('body muestra comentario completo', async () => {
    const review = createReview({ comment: 'Comentario expandido que debe verse completo.' });
    render(<FeaturedReviewCard review={review} />);

    const header = screen.getByRole('button');
    await user.click(header);

    expect(screen.getByText('"Comentario expandido que debe verse completo."')).toBeInTheDocument();
  });

  it('body muestra pros completos', async () => {
    const review = createReview({ pros: ['Motor lleno', 'Consumo moderado'] });
    render(<FeaturedReviewCard review={review} />);

    const header = screen.getByRole('button');
    await user.click(header);

    expect(screen.getByText(/^Pros:/)).toBeInTheDocument();
    expect(screen.getByText('Motor lleno, Consumo moderado')).toBeInTheDocument();
  });

  it('body muestra contras completos', async () => {
    const review = createReview({ cons: ['Calor', 'Frenos mejores'] });
    render(<FeaturedReviewCard review={review} />);

    const header = screen.getByRole('button');
    await user.click(header);

    expect(screen.getByText(/^Contras:/)).toBeInTheDocument();
    expect(screen.getByText('Calor, Frenos mejores')).toBeInTheDocument();
  });

  it('body muestra ReviewAspectSummary si hay aspects', async () => {
    const review = createReview();
    const aspects = createAspects([
      { category: 'engine', sentiment: 'positive', comment: 'Buen motor' },
      { category: 'consumption', sentiment: 'positive' },
    ]);
    render(<FeaturedReviewCard review={review} aspects={aspects} />);

    const header = screen.getByRole('button');
    await user.click(header);

    expect(screen.getByText('Valoración técnica')).toBeInTheDocument();
  });

  it('oculta pros si no existen', async () => {
    const review = createReview({ pros: [] });
    render(<FeaturedReviewCard review={review} />);

    const header = screen.getByRole('button');
    await user.click(header);

    expect(screen.queryByText(/^Pros:/)).not.toBeInTheDocument();
  });

  it('oculta pros si pros contiene strings vacíos o espacios', async () => {
    const review = createReview({ pros: ['', '  ', '   '] });
    render(<FeaturedReviewCard review={review} />);

    const header = screen.getByRole('button');
    await user.click(header);

    expect(screen.queryByText(/^Pros:/)).not.toBeInTheDocument();
  });

  it('oculta pros si pros contiene texto null o undefined', async () => {
    const review = createReview({ pros: ['null' as unknown as string, 'undefined' as unknown as string] });
    render(<FeaturedReviewCard review={review} />);

    const header = screen.getByRole('button');
    await user.click(header);

    expect(screen.queryByText(/^Pros:/)).not.toBeInTheDocument();
  });

  it('oculta contras si no existen', async () => {
    const review = createReview({ cons: [] });
    render(<FeaturedReviewCard review={review} />);

    const header = screen.getByRole('button');
    await user.click(header);

    expect(screen.queryByText(/^Contras:/)).not.toBeInTheDocument();
  });

  it('oculta contras si contras contiene strings vacíos o espacios', async () => {
    const review = createReview({ cons: ['', '  ', '   '] });
    render(<FeaturedReviewCard review={review} />);

    const header = screen.getByRole('button');
    await user.click(header);

    expect(screen.queryByText(/^Contras:/)).not.toBeInTheDocument();
  });

  it('oculta contras si contras contiene texto null o undefined', async () => {
    const review = createReview({ cons: ['null' as unknown as string, 'undefined' as unknown as string] });
    render(<FeaturedReviewCard review={review} />);

    const header = screen.getByRole('button');
    await user.click(header);

    expect(screen.queryByText(/^Contras:/)).not.toBeInTheDocument();
  });

  it('sí renderiza pros cuando hay contenido real', async () => {
    const review = createReview({ pros: ['Motor lleno', 'Consumo moderado'] });
    render(<FeaturedReviewCard review={review} />);

    const header = screen.getByRole('button');
    await user.click(header);

    expect(screen.getByText(/^Pros:/)).toBeInTheDocument();
    expect(screen.getByText('Motor lleno, Consumo moderado')).toBeInTheDocument();
  });

  it('sí renderiza contras cuando hay contenido real', async () => {
    const review = createReview({ cons: ['Calor', 'Frenos mejores'] });
    render(<FeaturedReviewCard review={review} />);

    const header = screen.getByRole('button');
    await user.click(header);

    expect(screen.getByText(/^Contras:/)).toBeInTheDocument();
    expect(screen.getByText('Calor, Frenos mejores')).toBeInTheDocument();
  });

  it('el icono de expansión se renderiza como SVG', async () => {
    const review = createReview();
    const { container } = render(<FeaturedReviewCard review={review} />);

    const header = screen.getByRole('button');
    const svg = header.querySelector('svg.featured-review-card__expand-icon');
    expect(svg).toBeInTheDocument();
  });

  it('al abrir cambia el estado de expansión', async () => {
    const review = createReview();
    render(<FeaturedReviewCard review={review} />);

    const header = screen.getByRole('button');
    expect(header).toHaveAttribute('aria-expanded', 'false');

    await user.click(header);

    expect(header).toHaveAttribute('aria-expanded', 'true');
  });

  it('footer muestra autor', async () => {
    const review = createReview({ userName: 'Rider Prueba' });
    render(<FeaturedReviewCard review={review} />);

    expect(screen.getByText('@Rider_Prueba')).toBeInTheDocument();
  });

  it('footer muestra CTAs Ver ficha y Más reviews', async () => {
    const review = createReview();
    render(<FeaturedReviewCard review={review} />);

    expect(screen.getByRole('link', { name: 'Ver ficha' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Más reviews' })).toBeInTheDocument();
  });

  it('no aparece texto literal null', async () => {
    const review = createReview({ kilometers: null, ownershipMonths: null });
    render(<FeaturedReviewCard review={review} />);

    expect(screen.queryByText(/null/i)).not.toBeInTheDocument();
  });

  it('renderiza la imagen de la moto con alt correcto', async () => {
    const review = createReview({
      motorcycle: { id: 'moto-img', brand: 'Yamaha', model: 'MT-09', year: 2024, imageUrl: '/yamaha-mt09.webp', segment: 'naked', license: 'A' },
    });
    render(<FeaturedReviewCard review={review} />);

    const image = screen.getByAltText('Yamaha MT-09 2024');
    expect(image).toBeInTheDocument();
  });

  it('usa fallback si imageSource falta', async () => {
    const review = createReview({ motorcycle: undefined, motorcycleId: 'unknown-bike' });
    render(<FeaturedReviewCard review={review} />);

    expect(screen.queryByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('renderiza sin actionsSlot cuando no se provee', async () => {
    const review = createReview();
    render(<FeaturedReviewCard review={review} />);

    expect(screen.getByRole('link', { name: 'Ver ficha' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Más reviews' })).toBeInTheDocument();
  });

  it('mostrar chip Propia cuando isOwnReview={true}', async () => {
    const review = createReview({ id: 'own-test-1', userId: 'user-1' });
    render(<FeaturedReviewCard review={review} isOwnReview={true} />);
    expect(screen.getByText('Propia')).toBeInTheDocument();
    expect(screen.getByLabelText('Review propia')).toBeInTheDocument();
  });

  it('no mostrar chip cuando isOwnReview={false}', async () => {
    const review = createReview({ id: 'not-own-test-1', userId: 'other-user' });
    render(<FeaturedReviewCard review={review} isOwnReview={false} />);
    expect(screen.queryByText('Propia')).not.toBeInTheDocument();
  });

  it('no mostrar chip cuando isOwnReview no se pasa', async () => {
    const review = createReview({ id: 'no-badge-test-1' });
    render(<FeaturedReviewCard review={review} />);
    expect(screen.queryByText('Propia')).not.toBeInTheDocument();
  });

  it('chip no rompe el header desplegable', async () => {
    const review = createReview({ id: 'header-toggle-badge-1', userId: 'user-1' });
    render(<FeaturedReviewCard review={review} isOwnReview={true} />);
    const header = screen.getByRole('button');
    expect(screen.getByText('Propia')).toBeInTheDocument();
    await user.click(header);
    const body = document.getElementById('featured-review-body-header-toggle-badge-1');
    expect(body).toHaveAttribute('aria-hidden', 'false');
    expect(body).toHaveClass('featured-review-card__body--open');
  });

  it('Propia tiene icono block con aria-hidden=true', async () => {
    const review = createReview({ id: 'icon-test-1', userId: 'user-1' });
    render(<FeaturedReviewCard review={review} isOwnReview={true} />);
    const chip = screen.getByLabelText('Review propia');
    const svg = chip.querySelector('svg[aria-hidden="true"]');
    expect(svg).toBeInTheDocument();
  });

  it('Propia no es elemento interactivo (no button, no link)', async () => {
    const review = createReview({ id: 'non-interactive-1', userId: 'user-1' });
    render(<FeaturedReviewCard review={review} isOwnReview={true} />);
    const chip = screen.getByLabelText('Review propia');
    expect(chip.tagName).toBe('SPAN');
    expect(chip).not.toHaveAttribute('onClick');
    expect(chip).not.toHaveAttribute('onKeyDown');
  });

  it('isOwnReview=true sin actionsSlot muestra actions wrapper con Propia', async () => {
    const review = createReview({ id: 'own-no-actions-1', userId: 'user-1' });
    render(<FeaturedReviewCard review={review} isOwnReview={true} />);
    const actionsWrapper = document.querySelector('.featured-review-card__actions');
    expect(actionsWrapper).toBeInTheDocument();
    expect(within(actionsWrapper as HTMLElement).getByText('Propia')).toBeInTheDocument();
  });

  it('isOwnReview=false sin actionsSlot no muestra actions wrapper', async () => {
    const review = createReview({ id: 'not-own-no-actions-1' });
    render(<FeaturedReviewCard review={review} isOwnReview={false} />);
    expect(document.querySelector('.featured-review-card__actions')).not.toBeInTheDocument();
  });

  it('renderiza con actionsSlot personalizado', async () => {
    const review = createReview();
    render(
      <FeaturedReviewCard
        review={review}
        actionsSlot={<button type="button">Acción custom</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Acción custom' })).toBeInTheDocument();
  });

  it('hideImage={true} oculta la imagen', async () => {
    const review = createReview({
      motorcycle: { id: 'moto-no-img', brand: 'Yamaha', model: 'MT-09', year: 2024, imageUrl: '/yamaha-mt09.webp', segment: 'naked', license: 'A' },
    });
    render(<FeaturedReviewCard review={review} hideImage={true} />);

    expect(screen.queryByAltText('Yamaha MT-09 2024')).not.toBeInTheDocument();
  });

  it('hideImage={false} muestra la imagen', async () => {
    const review = createReview({
      motorcycle: { id: 'moto-with-img', brand: 'Yamaha', model: 'MT-09', year: 2024, imageUrl: '/yamaha-mt09.webp', segment: 'naked', license: 'A' },
    });
    render(<FeaturedReviewCard review={review} hideImage={false} />);

    expect(screen.getByAltText('Yamaha MT-09 2024')).toBeInTheDocument();
  });

  it('hideLinks={true} oculta los enlaces Más reviews y Ver ficha', async () => {
    const review = createReview();
    render(<FeaturedReviewCard review={review} hideLinks={true} />);

    expect(screen.queryByRole('link', { name: 'Ver ficha' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Más reviews' })).not.toBeInTheDocument();
  });

  it('hideLinks={false} muestra los enlaces', async () => {
    const review = createReview();
    render(<FeaturedReviewCard review={review} hideLinks={false} />);

    expect(screen.getByRole('link', { name: 'Ver ficha' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Más reviews' })).toBeInTheDocument();
  });

  it('sin hideLinks ni hideImage se comporta como antes (imagen + links visibles)', async () => {
    const review = createReview({
      motorcycle: { id: 'moto-default', brand: 'Honda', model: 'CBR650R', year: 2024, imageUrl: '/honda.webp', segment: 'naked', license: 'A' },
    });
    render(<FeaturedReviewCard review={review} />);

    expect(screen.getByAltText('Honda CBR650R 2024')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver ficha' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Más reviews' })).toBeInTheDocument();
  });

  it('hideImage={true} hideLinks={true} sin otros cambios en header/body/footer', async () => {
    const review = createReview({ id: 'combined-hide-1', pros: ['Test pro'], cons: [] });
    render(<FeaturedReviewCard review={review} hideImage={true} hideLinks={true} />);

    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ver ficha' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Más reviews' })).not.toBeInTheDocument();

    const header = screen.getByRole('button');
    await user.click(header);
    expect(screen.getByText('"Review de prueba con mucho texto."')).toBeInTheDocument();
  });
});
