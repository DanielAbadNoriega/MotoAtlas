import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ModelRequestCard } from './ModelRequestCard';

const request = {
  id: 'request-1',
  userId: 'user-1',
  brand: 'Ducati',
  model: 'Monster',
  year: 2026,
  segment: 'naked',
  contactEmail: 'rider@motoatlas.com',
  officialUrl: 'https://ducati.example/monster',
  comment: 'Mercado: España\n\nMe interesa para comparar contra la competencia A2.',
  status: 'pending',
  source: 'user',
  createdAt: '2026-05-18T10:00:00.000Z',
  updatedAt: '2026-05-18T10:00:00.000Z',
} as const;

describe('ModelRequestCard', () => {
  it('renderiza status, marca/modelo/año, fecha y datos opcionales sin imagen', () => {
    render(<ModelRequestCard request={request} />);

    const card = screen.getByTestId('model-request-card');

    expect(within(card).getByText('Pendiente')).toBeInTheDocument();
    expect(within(card).getByRole('heading', { name: 'Ducati Monster' })).toBeInTheDocument();
    expect(within(card).getByText('Año 2026 · naked')).toBeInTheDocument();
    expect(within(card).getByText('Enviada')).toBeInTheDocument();
    expect(card).toHaveTextContent(/18 may 2026/i);
    expect(within(card).getByText('España')).toBeInTheDocument();
    expect(within(card).getByText('rider@motoatlas.com')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Página oficial/i })).toHaveAttribute('href', 'https://ducati.example/monster');
    expect(within(card).getByText(/Me interesa para comparar/i)).toBeInTheDocument();
    expect(within(card).queryByRole('img')).not.toBeInTheDocument();
  });

  it('renderiza contenido opcional sin romper', () => {
    render(
      <ModelRequestCard
        request={{ ...request, comment: null, contactEmail: null, officialUrl: null, segment: null, status: 'approved' }}
        headingLevel={3}
      />,
    );

    const card = screen.getByTestId('model-request-card');

    expect(within(card).getByText('Aprobada')).toBeInTheDocument();
    expect(within(card).getByRole('heading', { level: 3, name: 'Ducati Monster' })).toBeInTheDocument();
    expect(within(card).getByText('Año 2026')).toBeInTheDocument();
    expect(within(card).queryByText('Contacto')).not.toBeInTheDocument();
    expect(within(card).queryByText('Fuente')).not.toBeInTheDocument();
    expect(within(card).queryByRole('img')).not.toBeInTheDocument();
  });
});
