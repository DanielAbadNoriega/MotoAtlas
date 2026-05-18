import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createReview } from '../../../services/motorcycleReviewService';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import { ReviewModal } from './ReviewModal';

vi.mock('../../../services/motorcycleReviewService', () => ({
  createReview: vi.fn(),
}));

const createReviewMock = vi.mocked(createReview);

function renderModal(onClose = vi.fn()) {
  const renderResult = render(<ReviewModal isOpen motorcycle={bikeFixtures[0]} onClose={onClose} />);
  return { ...renderResult, onClose };
}

describe('ReviewModal', () => {
  beforeEach(() => {
    createReviewMock.mockReset();
    createReviewMock.mockResolvedValue({
      id: 'review-new',
      motorcycleId: bikeFixtures[0].id,
      userName: 'Dani',
      rating: 4,
      ridingStyle: 'viaje',
      ownershipMonths: 12,
      kilometers: 8500,
      comment: 'Muy buena para viajar.',
      pros: [],
      cons: [],
      verified: false,
      status: 'pending',
      createdAt: '2026-05-15T10:00:00.000Z',
      updatedAt: '2026-05-15T10:00:00.000Z',
    });
  });

  it('renderiza el modal como diálogo accesible', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: /Comparte tu experiencia real/i })).toBeInTheDocument();
    expect(screen.getByText(/BMW F 900 GS/i)).toBeInTheDocument();
  });

  it('cierra con el botón cerrar', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(screen.getByRole('button', { name: /Cerrar modal de review/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cierra con Escape', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cierra al hacer click fuera si no está enviando', () => {
    const { container, onClose } = renderModal();

    fireEvent.mouseDown(container.firstElementChild as Element);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('valida rating obligatorio', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /Enviar review/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos obligatorios antes de enviar.');
    expect(screen.getByText('La valoración es obligatoria.')).toBeInTheDocument();
    expect(createReviewMock).not.toHaveBeenCalled();
  });

  it('valida alias obligatorio', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /Valorar 5 de 5/i }));
    await user.click(screen.getByRole('button', { name: 'Viaje' }));
    await user.type(screen.getByLabelText(/Comentario detallado/i), 'La moto va muy fina en carretera.');
    await user.click(screen.getByRole('button', { name: /Enviar review/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos obligatorios antes de enviar.');
    expect(screen.getByText('El alias es obligatorio.')).toBeInTheDocument();
    expect(createReviewMock).not.toHaveBeenCalled();
  });

  it('muestra claramente que el tiempo con la moto se introduce en meses', () => {
    renderModal();

    expect(screen.getByLabelText(/Tiempo con la moto \(meses\)/i)).toHaveAttribute('placeholder', 'Ej. 15 meses');
  });

  it('mantiene las acciones accesibles cuando hay error de validación', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /Enviar review/i }));

    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /Enviar review/i })).toBeVisible();
  });

  it('valida riding_style obligatorio', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /Valorar 4 de 5/i }));
    await user.type(screen.getByLabelText(/Comentario detallado/i), 'La moto va muy fina en carretera.');
    await user.click(screen.getByRole('button', { name: /Enviar review/i }));

    expect(screen.getByText('El uso principal es obligatorio.')).toBeInTheDocument();
    expect(createReviewMock).not.toHaveBeenCalled();
  });

  it('valida comment obligatorio', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /Valorar 5 de 5/i }));
    await user.click(screen.getByRole('button', { name: 'Viaje' }));
    await user.click(screen.getByRole('button', { name: /Enviar review/i }));

    expect(screen.getByText('Por favor, escribe un comentario.')).toBeInTheDocument();
    expect(createReviewMock).not.toHaveBeenCalled();
  });

  it('valida que meses y kilómetros no sean negativos', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/Alias/i), 'MoteroDiario');
    await user.click(screen.getByRole('button', { name: /Valorar 4 de 5/i }));
    fireEvent.change(screen.getByLabelText(/Tiempo con la moto \(meses\)/i), { target: { value: '-1' } });
    fireEvent.change(screen.getByLabelText(/Kilómetros recorridos/i), { target: { value: '-10' } });
    await user.click(screen.getByRole('button', { name: 'Diario' }));
    await user.type(screen.getByLabelText(/Comentario detallado/i), 'Uso diario correcto.');
    await user.click(screen.getByRole('button', { name: /Enviar review/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos obligatorios antes de enviar.');
    expect(screen.getAllByText('Debe ser un número mayor o igual que 0.')).toHaveLength(2);
    expect(createReviewMock).not.toHaveBeenCalled();
  });

  it('envía una review válida con motorcycle_id correcto y muestra éxito', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/Alias/i), 'MoteroViajero');
    await user.click(screen.getByRole('button', { name: /Valorar 4 de 5/i }));
    await user.type(screen.getByLabelText(/Tiempo con la moto \(meses\)/i), '12');
    await user.type(screen.getByLabelText(/Kilómetros recorridos/i), '8500');
    await user.click(screen.getByRole('button', { name: 'Viaje' }));
    await user.type(screen.getByLabelText(/Lo mejor/i), 'Motor lleno');
    await user.type(screen.getByLabelText(/Lo peor/i), 'Precio alto');
    await user.type(screen.getByLabelText(/Comentario detallado/i), 'Muy buena para viajar.');
    await user.click(screen.getByRole('button', { name: /Enviar review/i }));

    await waitFor(() => expect(createReviewMock).toHaveBeenCalled());
    expect(createReviewMock).toHaveBeenCalledWith(
      expect.objectContaining({
        motorcycleId: bikeFixtures[0].id,
        userName: 'MoteroViajero',
        rating: 4,
        ridingStyle: 'viaje',
        ownershipMonths: 12,
        kilometers: 8500,
        comment: 'Muy buena para viajar.',
        pros: ['Motor lleno'],
        cons: ['Precio alto'],
      }),
    );
    expect(createReviewMock.mock.calls[0][0]).not.toHaveProperty('verified');
    expect(await screen.findByRole('heading', { name: /Review enviada/i })).toBeInTheDocument();
    expect(screen.getByText(/Gracias. Tu opinión se revisará antes de publicarse/i)).toBeInTheDocument();
  });

  it('muestra error si falla el servicio', async () => {
    const user = userEvent.setup();
    createReviewMock.mockRejectedValue(new Error('Servicio no disponible'));
    renderModal();

    await user.type(screen.getByLabelText(/Alias/i), 'MoteroDiario');
    await user.click(screen.getByRole('button', { name: /Valorar 4 de 5/i }));
    await user.click(screen.getByRole('button', { name: 'Diario' }));
    await user.type(screen.getByLabelText(/Comentario detallado/i), 'Uso diario correcto.');
    await user.click(screen.getByRole('button', { name: /Enviar review/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Servicio no disponible');
  });
});
