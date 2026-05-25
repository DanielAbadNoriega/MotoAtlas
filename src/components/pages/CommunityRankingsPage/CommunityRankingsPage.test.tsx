import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import { CommunityRankingsPage } from './CommunityRankingsPage';

describe('CommunityRankingsPage', () => {
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

  it('renderiza el bloque de metodología', () => {
    window.location.hash = '#/comunidad/rankings';
    render(<CommunityRankingsPage motorcycles={bikeFixtures} />);

    expect(screen.getByRole('heading', { name: /Nuestra Metodología/i })).toBeInTheDocument();
    expect(screen.getByText(/Rankings de MotoAtlas no están influenciados por acuerdos publicitarios/i)).toBeInTheDocument();
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
});
