import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../../features/auth';
import { createReview } from '../../../services/motorcycleReviewService';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import { ReviewModal } from './ReviewModal';

vi.mock('../../../features/auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../services/motorcycleReviewService', () => ({
  createReview: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);
const createReviewMock = vi.mocked(createReview);

function mockAuth(overrides = {}) {
  useAuthMock.mockReturnValue({
    user: null,
    session: null,
    profile: null,
    isAuthenticated: false,
    isAdmin: false,
    isLoading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
    ...overrides,
  } as never);
}

function renderModal(onClose = vi.fn()) {
  const renderResult = render(<ReviewModal isOpen motorcycle={bikeFixtures[0]} onClose={onClose} />);
  return { ...renderResult, onClose };
}

describe('ReviewModal', () => {
  beforeEach(() => {
    createReviewMock.mockReset();
    mockAuth();
    createReviewMock.mockResolvedValue({
      id: 'review-new',
      motorcycleId: bikeFixtures[0].id,
      userId: null,
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

    expect(screen.getByRole('dialog', { name: /Valoración técnica/i })).toBeInTheDocument();
    expect(screen.getByText(/Technical registry \/\/ Owner feedback/i)).toBeInTheDocument();
  });

  it('renderiza Valoración técnica como título principal', () => {
    renderModal();

    expect(screen.getByRole('heading', { name: /Valoración técnica/i })).toBeInTheDocument();
  });

  it('renderiza el bloque de valoración general con estrellas', () => {
    renderModal();

    expect(screen.getByText('Valoración general')).toBeInTheDocument();
    expect(screen.getByText('Puntúa tu experiencia global con esta moto.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /\d estrellas? de 5/i })).toHaveLength(5);
  });

  it('permite seleccionar rating al hacer click en estrellas', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /4 estrellas de 5/i }));

    const stars = screen.getAllByRole('button', { name: /\d estrellas? de 5/i });
    expect(stars[3]).toHaveAttribute('aria-pressed', 'true');
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

    await user.click(screen.getByRole('button', { name: /Registrar y continuar/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos obligatorios antes de enviar.');
    expect(screen.getByText('La valoración es obligatoria.')).toBeInTheDocument();
    expect(createReviewMock).not.toHaveBeenCalled();
  });

  it('valida alias obligatorio', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /4 estrellas de 5/i }));
    await user.click(screen.getByRole('button', { name: 'Viaje' }));
    await user.type(screen.getByLabelText(/Tu experiencia/i), 'Muy buena para viaje.');
    await user.click(screen.getByRole('button', { name: /Registrar y continuar/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos obligatorios antes de enviar.');
    expect(screen.getByText('El alias es obligatorio.')).toBeInTheDocument();
    expect(createReviewMock).not.toHaveBeenCalled();
  });

  it('mantiene las acciones accesibles cuando hay error de validación', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /Registrar y continuar/i }));

    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /Registrar y continuar/i })).toBeVisible();
  });

  it('valida riding_style obligatorio', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /4 estrellas de 5/i }));
    await user.type(screen.getByLabelText(/Alias/i), 'MoteroTest');
    await user.type(screen.getByLabelText(/Tu experiencia/i), 'La moto va muy fina en carretera.');
    await user.click(screen.getByRole('button', { name: /Registrar y continuar/i }));

    expect(screen.getByText('El uso principal es obligatorio.')).toBeInTheDocument();
    expect(createReviewMock).not.toHaveBeenCalled();
  });

  it('valida comment obligatorio', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /5 estrellas de 5/i }));
    await user.click(screen.getByRole('button', { name: 'Viaje' }));
    await user.type(screen.getByLabelText(/Alias/i), 'MoteroTest');
    await user.click(screen.getByRole('button', { name: /Registrar y continuar/i }));

    expect(screen.getByText('Por favor, escribe un comentario.')).toBeInTheDocument();
    expect(createReviewMock).not.toHaveBeenCalled();
  });

  it('valida que meses y kilómetros no Sean negativos', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/Alias/i), 'MoteroDiario');
    await user.click(screen.getByRole('button', { name: /4 estrellas de 5/i }));
    await user.click(screen.getByRole('button', { name: 'Diario' }));
    await user.type(screen.getByLabelText(/Tu experiencia/i), 'Uso diario correcto.');
    fireEvent.change(screen.getByLabelText(/Tiempo con la moto/i), { target: { value: '-1' } });
    fireEvent.change(screen.getByLabelText(/Kilómetros/i), { target: { value: '-10' } });
    await user.click(screen.getByRole('button', { name: /Registrar y continuar/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos obligatorios antes de enviar.');
    expect(screen.getAllByText('Debe ser un número mayor o igual que 0.')).toHaveLength(2);
    expect(createReviewMock).not.toHaveBeenCalled();
  });

  it('envía una review válida con motorcycle_id correcto y muestra éxito', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/Alias/i), 'MoteroViajero');
    await user.click(screen.getByRole('button', { name: /4 estrellas de 5/i }));
    await user.type(screen.getByLabelText(/Tiempo con la moto/i), '12');
    await user.type(screen.getByLabelText(/Kilómetros/i), '8500');
    await user.click(screen.getByRole('button', { name: 'Viaje' }));
    await user.type(screen.getByLabelText(/Pros/i), 'Motor lleno');
    await user.type(screen.getByLabelText(/Contras/i), 'Precio alto');
    await user.type(screen.getByLabelText(/Tu experiencia/i), 'Muy buena para viajar.');
    await user.click(screen.getByRole('button', { name: /Registrar y continuar/i }));

    await waitFor(() => expect(createReviewMock).toHaveBeenCalled());
    expect(createReviewMock.mock.calls[0][0]).toMatchObject({
      motorcycleId: bikeFixtures[0].id,
      userName: 'MoteroViajero',
      rating: 4,
      ridingStyle: 'viaje',
      ownershipMonths: 12,
      kilometers: 8500,
      comment: 'Muy buena para viajar.',
      pros: ['Motor lleno'],
      cons: ['Precio alto'],
    });
    expect(createReviewMock.mock.calls[0][1]).toBeUndefined();
    expect(createReviewMock.mock.calls[0][0]).not.toHaveProperty('verified');
    expect(await screen.findByRole('heading', { name: /Review enviada/i })).toBeInTheDocument();
    expect(screen.getByText(/Gracias. Tu opinión se revisará antes de publicarse/i)).toBeInTheDocument();
  });

  it('funciona con usuario autenticado y pasa user_id correcto al servicio', async () => {
    const user = userEvent.setup();
    mockAuth({
      isAuthenticated: true,
      user: { id: 'auth-user-1', email: 'rider@motoatlas.com' },
      session: { access_token: 'session-token' },
      profile: { id: 'auth-user-1', displayName: 'Rider Zero', avatarUrl: null, role: 'user' },
    });
    renderModal();

    expect(screen.getByText(/Tu review quedará asociada a tu cuenta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Alias/i)).toHaveValue('Rider Zero');

    await user.click(screen.getByRole('button', { name: /5 estrellas de 5/i }));
    await user.click(screen.getByRole('button', { name: 'Viaje' }));
    await user.clear(screen.getByLabelText(/Alias/i));
    await user.type(screen.getByLabelText(/Alias/i), 'Alias Visible');
    await user.type(screen.getByLabelText(/Tu experiencia/i), 'Experiencia real con sesión iniciada.');
    await user.click(screen.getByRole('button', { name: /Registrar y continuar/i }));

    await waitFor(() => expect(createReviewMock).toHaveBeenCalled());
    expect(createReviewMock.mock.calls[0][0]).toMatchObject({
      userName: 'Alias Visible',
    });
    expect(createReviewMock.mock.calls[0][1]).toEqual({
      accessToken: 'session-token',
      userId: 'auth-user-1',
    });
  });

  it('muestra error si falla el servicio', async () => {
    const user = userEvent.setup();
    createReviewMock.mockRejectedValue(new Error('Servicio no disponible'));
    renderModal();

    await user.type(screen.getByLabelText(/Alias/i), 'MoteroDiario');
    await user.click(screen.getByRole('button', { name: /4 estrellas de 5/i }));
    await user.click(screen.getByRole('button', { name: 'Diario' }));
    await user.type(screen.getByLabelText(/Tu experiencia/i), 'Uso diario correcto.');
    await user.click(screen.getByRole('button', { name: /Registrar y continuar/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Servicio no disponible');
  });

  it('no muestra texto literal null en ningún campo del formulario', () => {
    renderModal();

    const textContents = screen.getByRole('dialog').textContent || '';
    expect(textContents).not.toContain('null');
  });

  it('renderiza la sección Tu experiencia', () => {
    renderModal();

    expect(screen.getByRole('textbox', { name: /Tu experiencia/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Cuéntanos cómo se comporta la moto/i)).toBeInTheDocument();
  });

  it('renderiza los labels Pros y Contras', () => {
    renderModal();

    expect(screen.getByLabelText(/Pros/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contras/i)).toBeInTheDocument();
  });

  it('cada aspect card tiene exactamente 1 botón +, 1 botón − y 1 botón comentario', () => {
    renderModal();

    const pesoCard = screen.getByRole('button', { name: /Marcar Peso como punto fuerte/i }).closest('.review-modal__aspect-card');
    expect(pesoCard).not.toBeNull();

    const buttons = pesoCard!.querySelectorAll('button');
    expect(buttons).toHaveLength(3);

    const labels = Array.from(buttons).map(b => b.getAttribute('aria-label'));
    expect(labels).toContain('Marcar Peso como punto fuerte');
    expect(labels).toContain('Marcar Peso como aspecto mejorable');
    expect(labels).toContain('Añadir matiz sobre Peso');
  });

  it('no hay botón negativo duplicado en ninguna aspect card', () => {
    renderModal();

    const allNegativeButtons = screen.getAllByRole('button', { name: /Marcar .+ como aspecto mejorable/i });
    expect(allNegativeButtons).toHaveLength(12);
  });

  it('el botón + activa el estado positivo de un aspecto', async () => {
    const user = userEvent.setup();
    renderModal();

    const motorPositiveBtn = screen.getByRole('button', { name: /Marcar Motor como punto fuerte/i });
    await user.click(motorPositiveBtn);

    expect(motorPositiveBtn).toHaveAttribute('aria-pressed', 'true');
    const card = motorPositiveBtn.closest('.review-modal__aspect-card');
    expect(card).toHaveClass('review-modal__aspect-card--positive');
  });

  it('el botón − activa el estado negativo de un aspecto', async () => {
    const user = userEvent.setup();
    renderModal();

    const motorNegativeBtn = screen.getByRole('button', { name: /Marcar Motor como aspecto mejorable/i });
    await user.click(motorNegativeBtn);

    expect(motorNegativeBtn).toHaveAttribute('aria-pressed', 'true');
    const card = motorNegativeBtn.closest('.review-modal__aspect-card');
    expect(card).toHaveClass('review-modal__aspect-card--negative');
  });

  it('el botón comentario está disabled cuando el aspecto está neutral', () => {
    renderModal();

    const commentBtn = screen.getByRole('button', { name: /Añadir matiz sobre Motor/i });
    expect(commentBtn).toBeDisabled();
  });

  it('el botón comentario queda enabled tras seleccionar + o −', async () => {
    const user = userEvent.setup();
    renderModal();

    const positiveBtn = screen.getByRole('button', { name: /Marcar Motor como punto fuerte/i });
    await user.click(positiveBtn);

    const commentBtn = screen.getByRole('button', { name: /Añadir matiz sobre Motor/i });
    expect(commentBtn).not.toBeDisabled();
    expect(commentBtn).toHaveClass('review-modal__aspect-comment-btn--enabled');
  });
});
