import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../../features/auth';
import { createReview, getApprovedReviewsByMotorcycleId, type MotorcycleReview } from '../../../services/motorcycleReviewService';
import { getReviewReactionSummary, toggleHelpfulReaction, toggleNotHelpfulReaction } from '../../../services/reviewReactionService';
import { createReviewReport, getMyReviewReports } from '../../../services/reviewReportService';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import {
  createApprovedReviewFixture,
  createHiddenReviewFixture,
  createRejectedReviewFixture,
  createReviewFixture,
  createReviewFixtures,
} from '../../../test/fixtures/reviews';
import { MotorcycleCommunityPage } from './MotorcycleCommunityPage';

vi.mock('../../../services/motorcycleReviewService', () => ({
  createReview: vi.fn(),
  getApprovedReviewsByMotorcycleId: vi.fn(),
}));

vi.mock('../../../services/reviewReactionService', () => ({
  getReviewReactionSummary: vi.fn(),
  toggleHelpfulReaction: vi.fn(),
  toggleNotHelpfulReaction: vi.fn(),
}));

vi.mock('../../../services/reviewReportService', () => ({
  createReviewReport: vi.fn(),
  getMyReviewReports: vi.fn(),
}));

vi.mock('../../../features/auth', () => ({
  useAuth: vi.fn(),
}));

const getApprovedReviewsMock = vi.mocked(getApprovedReviewsByMotorcycleId);
const createReviewMock = vi.mocked(createReview);
const getReviewReactionSummaryMock = vi.mocked(getReviewReactionSummary);
const toggleHelpfulReactionMock = vi.mocked(toggleHelpfulReaction);
const toggleNotHelpfulReactionMock = vi.mocked(toggleNotHelpfulReaction);
const createReviewReportMock = vi.mocked(createReviewReport);
const getMyReviewReportsMock = vi.mocked(getMyReviewReports);
const useAuthMock = vi.mocked(useAuth);

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

const approvedReviews: readonly MotorcycleReview[] = [
  {
    id: 'review-approved-1',
    motorcycleId: bikeFixtures[0].id,
    userName: 'Laura',
    rating: 5,
    ridingStyle: 'viaje',
    ownershipMonths: 14,
    kilometers: 12000,
    comment: 'Fantástica para viajar con equipaje.',
    pros: ['Motor lleno', 'Ergonomía cómoda'],
    cons: ['Precio alto'],
    verified: false,
    status: 'approved',
    createdAt: '2026-05-14T10:00:00.000Z',
    updatedAt: '2026-05-14T10:00:00.000Z',
  },
  {
    id: 'review-approved-2',
    motorcycleId: bikeFixtures[0].id,
    userName: '',
    rating: 4,
    ridingStyle: 'viaje',
    ownershipMonths: 10,
    kilometers: 8000,
    comment: 'Muy equilibrada, aunque alta para ciudad.',
    pros: ['Motor lleno'],
    cons: ['Altura de asiento'],
    verified: false,
    status: 'approved',
    createdAt: '2026-05-10T10:00:00.000Z',
    updatedAt: '2026-05-10T10:00:00.000Z',
  },
  {
    id: 'review-pending',
    motorcycleId: bikeFixtures[0].id,
    userName: 'Pendiente',
    rating: 1,
    ridingStyle: 'diario',
    ownershipMonths: null,
    kilometers: null,
    comment: 'No debería mostrarse todavía.',
    pros: [],
    cons: [],
    verified: false,
    status: 'pending',
    createdAt: '2026-05-09T10:00:00.000Z',
    updatedAt: '2026-05-09T10:00:00.000Z',
  },
];

describe('MotorcycleCommunityPage', () => {
  beforeEach(() => {
    vi.useRealTimers();
    getApprovedReviewsMock.mockReset();
    createReviewMock.mockReset();
    getReviewReactionSummaryMock.mockReset();
    toggleHelpfulReactionMock.mockReset();
    toggleNotHelpfulReactionMock.mockReset();
    createReviewReportMock.mockReset();
    getMyReviewReportsMock.mockReset();
    useAuthMock.mockReset();
    mockAuth();
    getApprovedReviewsMock.mockResolvedValue(approvedReviews);
    getReviewReactionSummaryMock.mockImplementation(async (reviewIds) =>
      reviewIds.map((reviewId) => ({
        helpfulCount: reviewId === 'review-approved-1' ? 2 : 0,
        hasReactedHelpful: false,
        hasReactedNotHelpful: false,
        reviewId,
      })),
    );
    getMyReviewReportsMock.mockResolvedValue([]);
    createReviewReportMock.mockResolvedValue({
      comment: null,
      reason: 'spam',
      reviewId: 'review-approved-1',
      status: 'pending',
      userId: 'user-1',
    });
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
      createdAt: '2026-05-15T10:00:00.000Z',
      updatedAt: '2026-05-15T10:00:00.000Z',
    });
  });

  it('renderiza la comunidad de una moto existente', async () => {
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    expect(screen.getByRole('heading', { name: /Reviews BMW F 900 GS/i })).toBeInTheDocument();
    expect(screen.getByText('Trail')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(await screen.findByText('Fantástica para viajar con equipaje.')).toBeInTheDocument();
    expect(getApprovedReviewsMock).toHaveBeenCalledWith(bikeFixtures[0].id);
  });

  it('muestra “Moto no encontrada” si el id es inválido', () => {
    render(<MotorcycleCommunityPage motorcycleId="id-invalido" />);

    expect(screen.getByRole('heading', { name: /Moto no encontrada/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver al buscador/i })).toHaveAttribute('href', '#/buscador');
  });

  it('carga reviews approved y no muestra pending', async () => {
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    expect(await screen.findByText('Fantástica para viajar con equipaje.')).toBeInTheDocument();
    expect(screen.getByText('Muy equilibrada, aunque alta para ciudad.')).toBeInTheDocument();
    expect(screen.queryByText('No debería mostrarse todavía.')).not.toBeInTheDocument();
    expect(screen.getByText('@Usuario_MotoAtlas')).toBeInTheDocument();
  });

  it('no muestra reviews rejected ni hidden aunque lleguen por error del servicio', async () => {
    getApprovedReviewsMock.mockResolvedValue([
      createApprovedReviewFixture({ comment: 'Review visible aprobada.' }),
      createRejectedReviewFixture({ comment: 'Review rechazada privada.' }),
      createHiddenReviewFixture({ comment: 'Review oculta privada.' }),
    ]);

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    expect(await screen.findByText('Review visible aprobada.')).toBeInTheDocument();
    expect(screen.queryByText('Review rechazada privada.')).not.toBeInTheDocument();
    expect(screen.queryByText('Review oculta privada.')).not.toBeInTheDocument();
  });

  it('no rompe con reviews incompletas y usa fallbacks seguros', async () => {
    getApprovedReviewsMock.mockResolvedValue([
      createReviewFixture({
        comment: 'Review con campos parciales.',
        cons: [],
        createdAt: 'fecha-invalida',
        kilometers: null,
        ownershipMonths: null,
        pros: [],
        userName: '',
      }),
    ]);

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    expect(await screen.findByText('Review con campos parciales.')).toBeInTheDocument();
    expect(screen.getByText('@Usuario_MotoAtlas')).toBeInTheDocument();
    expect(screen.getByText(/Fecha pendiente/)).toBeInTheDocument();
    expect(screen.getAllByText('N/D').length).toBeGreaterThan(0);
  });

  it('no muestra badge verificado cuando la review no trae verificación real', async () => {
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    await screen.findByText('Fantástica para viajar con equipaje.');

    expect(screen.queryByText('Review verificada')).not.toBeInTheDocument();
  });

  it('muestra badge verificado solo cuando la review viene marcada como verified', async () => {
    getApprovedReviewsMock.mockResolvedValue([{ ...approvedReviews[0], verified: true }]);

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    expect(await screen.findByText('Review verificada')).toBeInTheDocument();
  });

  it('calcula rating medio y uso principal más común', async () => {
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    await screen.findByText('Fantástica para viajar con equipaje.');
    expect(screen.getByText('4.5/5 · 2 reviews')).toBeInTheDocument();
    expect(screen.getAllByText('Viaje').length).toBeGreaterThan(0);
    expect(screen.getByText('10.000 km')).toBeInTheDocument();
    expect(screen.getByText('12 meses')).toBeInTheDocument();
  });

  it('muestra empty state cuando no hay reviews aprobadas', async () => {
    getApprovedReviewsMock.mockResolvedValue([]);

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    expect(await screen.findByRole('heading', { name: /Aún no hay reviews aprobadas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sé el primero en escribir una review/i })).toBeInTheDocument();
  });

  it('abre ReviewModal desde “Escribir review”', async () => {
    const user = userEvent.setup();
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    await user.click(screen.getAllByRole('button', { name: /Escribir review/i })[0]);

    expect(screen.getByRole('dialog', { name: /Comparte tu experiencia real/i })).toBeInTheDocument();
    expect(createReviewMock).not.toHaveBeenCalled();
  });

  it('mantiene un único botón “Escribir review” en la comunidad', async () => {
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    await screen.findByText('Fantástica para viajar con equipaje.');

    expect(screen.getAllByRole('button', { name: /^Escribir review$/i })).toHaveLength(1);
  });

  it('sustituye el slider por un listado compacto de owner reports', async () => {
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const list = await screen.findByRole('list', { name: /Listado compacto de owner reports/i });

    expect(within(list).getByText('Fantástica para viajar con equipaje.')).toBeInTheDocument();
    expect(within(list).getByText('Muy equilibrada, aunque alta para ciudad.')).toBeInTheDocument();
    expect(screen.getAllByTestId('owner-report-row')).toHaveLength(2);
    expect(screen.queryByRole('region', { name: /Verified owner reports/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ver reviews anteriores/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ver reviews siguientes/i })).not.toBeInTheDocument();
  });

  it('muestra acción Útil con contador en cada owner report', async () => {
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const rows = await screen.findAllByTestId('owner-report-row');

    await waitFor(() => expect(within(rows[0]).getByRole('button', { name: /Útil 2/i })).toHaveAttribute('aria-pressed', 'false'));
    expect(within(rows[1]).getByRole('button', { name: /Útil 0/i })).toBeInTheDocument();
    expect(within(rows[0]).getByRole('button', { name: /Marcar como no útil/i })).toHaveTextContent('No útil');
    expect(within(rows[0]).getByRole('button', { name: /Marcar como no útil/i })).not.toHaveTextContent(/\d/);
    expect(getReviewReactionSummaryMock).toHaveBeenCalledWith(['review-approved-1', 'review-approved-2'], null);
  });

  it('al pulsar Útil autenticado llama al toggle y actualiza aria-pressed', async () => {
    const user = userEvent.setup();
    mockAuth({
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      session: { access_token: 'session-token' },
      isAuthenticated: true,
    });
    toggleHelpfulReactionMock.mockResolvedValue({
      helpfulCount: 3,
      hasReactedHelpful: true,
      hasReactedNotHelpful: false,
      reviewId: 'review-approved-1',
    });

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const usefulButton = await screen.findByRole('button', { name: /Marcar como útil\. Útil 2/i });
    await user.click(usefulButton);

    expect(toggleHelpfulReactionMock).toHaveBeenCalledWith('review-approved-1', {
      accessToken: 'session-token',
      userId: 'user-1',
    });
    await waitFor(() => expect(screen.getByRole('button', { name: /Quitar útil\. Útil 3/i })).toHaveAttribute('aria-pressed', 'true'));
  });

  it('usuario autenticado puede marcar No útil sin contador público', async () => {
    const user = userEvent.setup();
    mockAuth({
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      session: { access_token: 'session-token' },
      isAuthenticated: true,
    });
    toggleNotHelpfulReactionMock.mockResolvedValue({
      helpfulCount: 2,
      hasReactedHelpful: false,
      hasReactedNotHelpful: true,
      reviewId: 'review-approved-1',
    });

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const firstRow = (await screen.findAllByTestId('owner-report-row'))[0];
    const notHelpfulButton = await waitFor(() => within(firstRow).getByRole('button', { name: /Marcar como no útil/i }));
    await user.click(notHelpfulButton);

    expect(toggleNotHelpfulReactionMock).toHaveBeenCalledWith('review-approved-1', {
      accessToken: 'session-token',
      userId: 'user-1',
    });
    await waitFor(() => expect(within(firstRow).getByRole('button', { name: /Quitar no útil/i })).toHaveAttribute('aria-pressed', 'true'));
    expect(within(firstRow).getByRole('button', { name: /Quitar no útil/i })).toHaveTextContent('No útil');
    expect(within(firstRow).getByRole('button', { name: /Quitar no útil/i })).not.toHaveTextContent(/\d/);
  });

  it('marcar No útil desactiva Útil y reduce el contador público de útiles', async () => {
    const user = userEvent.setup();
    mockAuth({
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      session: { access_token: 'session-token' },
      isAuthenticated: true,
    });
    getReviewReactionSummaryMock.mockImplementation(async (reviewIds) =>
      reviewIds.map((reviewId) => ({
        helpfulCount: reviewId === 'review-approved-1' ? 2 : 0,
        hasReactedHelpful: reviewId === 'review-approved-1',
        hasReactedNotHelpful: false,
        reviewId,
      })),
    );
    toggleNotHelpfulReactionMock.mockResolvedValue({
      helpfulCount: 1,
      hasReactedHelpful: false,
      hasReactedNotHelpful: true,
      reviewId: 'review-approved-1',
    });

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const firstRow = (await screen.findAllByTestId('owner-report-row'))[0];
    await waitFor(() => expect(within(firstRow).getByRole('button', { name: /Quitar útil\. Útil 2/i })).toHaveAttribute('aria-pressed', 'true'));
    await user.click(within(firstRow).getByRole('button', { name: /Marcar como no útil/i }));

    await waitFor(() => expect(within(firstRow).getByRole('button', { name: /Marcar como útil\. Útil 1/i })).toHaveAttribute('aria-pressed', 'false'));
    expect(within(firstRow).getByRole('button', { name: /Quitar no útil/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('marcar Útil desactiva No útil y sube el contador público de útiles', async () => {
    const user = userEvent.setup();
    mockAuth({
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      session: { access_token: 'session-token' },
      isAuthenticated: true,
    });
    getReviewReactionSummaryMock.mockImplementation(async (reviewIds) =>
      reviewIds.map((reviewId) => ({
        helpfulCount: reviewId === 'review-approved-1' ? 2 : 0,
        hasReactedHelpful: false,
        hasReactedNotHelpful: reviewId === 'review-approved-1',
        reviewId,
      })),
    );
    toggleHelpfulReactionMock.mockResolvedValue({
      helpfulCount: 3,
      hasReactedHelpful: true,
      hasReactedNotHelpful: false,
      reviewId: 'review-approved-1',
    });

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const firstRow = (await screen.findAllByTestId('owner-report-row'))[0];
    await waitFor(() => expect(within(firstRow).getByRole('button', { name: /Quitar no útil/i })).toHaveAttribute('aria-pressed', 'true'));
    await user.click(within(firstRow).getByRole('button', { name: /Marcar como útil\. Útil 2/i }));

    await waitFor(() => expect(within(firstRow).getByRole('button', { name: /Quitar útil\. Útil 3/i })).toHaveAttribute('aria-pressed', 'true'));
    expect(within(firstRow).getByRole('button', { name: /Marcar como no útil/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('si no hay sesión muestra tooltip temporal, no llama al toggle y reinicia timer al pulsar otra vez', async () => {
    const user = userEvent.setup();
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const firstRow = (await screen.findAllByTestId('owner-report-row'))[0];
    const helpfulButton = await waitFor(() => within(firstRow).getByRole('button', { name: /Útil 2/i }));
    const initialHelpfulLabel = helpfulButton.textContent;
    await user.click(helpfulButton);

    const tooltip = within(firstRow).getByRole('status');
    expect(tooltip).toHaveTextContent('Inicia sesión para marcar esta review como útil.');
    expect(tooltip).toHaveClass('motorcycle-community__helpful-feedback--visible');
    expect(toggleHelpfulReactionMock).not.toHaveBeenCalled();
    expect(helpfulButton).toHaveAttribute('aria-pressed', 'false');
    expect(within(firstRow).getByRole('button', { name: /Marcar como útil\./i })).toHaveTextContent(initialHelpfulLabel ?? '');

    await new Promise((resolve) => setTimeout(resolve, 1500));
    await user.click(helpfulButton);
    await new Promise((resolve) => setTimeout(resolve, 700));
    expect(within(firstRow).getByRole('status')).toHaveTextContent('Inicia sesión para marcar esta review como útil.');

    await new Promise((resolve) => setTimeout(resolve, 1600));
    expect(within(firstRow).queryByRole('status')).not.toBeInTheDocument();
  }, 10000);

  it('si no hay sesión al pulsar No útil muestra tooltip y no llama al servicio', async () => {
    const user = userEvent.setup();
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const firstRow = (await screen.findAllByTestId('owner-report-row'))[0];
    await user.click(await waitFor(() => within(firstRow).getByRole('button', { name: /Marcar como no útil/i })));

    expect(within(firstRow).getByRole('status')).toHaveTextContent('Inicia sesión para valorar esta review.');
    expect(toggleHelpfulReactionMock).not.toHaveBeenCalled();
    expect(toggleNotHelpfulReactionMock).not.toHaveBeenCalled();
    expect(within(firstRow).getByRole('button', { name: /Marcar como no útil/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('muestra acción Reportar sin contador público en reviews de otros usuarios', async () => {
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const firstRow = (await screen.findAllByTestId('owner-report-row'))[0];
    const reportButton = within(firstRow).getByRole('button', { name: /Reportar review/i });

    expect(reportButton).toHaveTextContent('Reportar');
    expect(reportButton).not.toHaveTextContent(/\d/);
  });

  it('si no hay sesión al pulsar Reportar muestra tooltip y no llama al servicio', async () => {
    const user = userEvent.setup();
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const firstRow = (await screen.findAllByTestId('owner-report-row'))[0];
    await user.click(within(firstRow).getByRole('button', { name: /Reportar review/i }));

    expect(within(firstRow).getByRole('status')).toHaveTextContent('Inicia sesión para reportar esta review.');
    expect(createReviewReportMock).not.toHaveBeenCalled();
  });

  it('usuario autenticado abre y cancela la UI de reporte con motivos controlados', async () => {
    const user = userEvent.setup();
    mockAuth({
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      session: { access_token: 'session-token' },
      isAuthenticated: true,
    });

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const firstRow = (await screen.findAllByTestId('owner-report-row'))[0];
    await user.click(await waitFor(() => within(firstRow).getByRole('button', { name: /Reportar review/i })));

    const reportForm = within(firstRow).getByRole('form', { name: /Reportar review/i });
    expect(within(reportForm).getByLabelText('Spam')).toBeChecked();
    expect(within(reportForm).getByLabelText('Ofensivo')).toBeInTheDocument();
    expect(within(reportForm).getByLabelText('Información falsa')).toBeInTheDocument();
    expect(within(reportForm).getByLabelText('Acoso')).toBeInTheDocument();
    expect(within(reportForm).getByLabelText('Otro')).toBeInTheDocument();

    await user.click(within(reportForm).getByRole('button', { name: /Cancelar/i }));
    expect(within(firstRow).queryByRole('form', { name: /Reportar review/i })).not.toBeInTheDocument();
  });

  it('usuario autenticado envía reporte y ve confirmación', async () => {
    const user = userEvent.setup();
    mockAuth({
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      session: { access_token: 'session-token' },
      isAuthenticated: true,
    });

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const firstRow = (await screen.findAllByTestId('owner-report-row'))[0];
    await user.click(await waitFor(() => within(firstRow).getByRole('button', { name: /Reportar review/i })));
    const reportForm = within(firstRow).getByRole('form', { name: /Reportar review/i });

    await user.click(within(reportForm).getByLabelText('Información falsa'));
    await user.type(within(reportForm).getByPlaceholderText('Añade contexto si lo necesitas'), 'Datos incorrectos');
    await user.click(within(reportForm).getByRole('button', { name: /Enviar reporte/i }));

    expect(createReviewReportMock).toHaveBeenCalledWith(
      { comment: 'Datos incorrectos', reason: 'false_information', reviewId: 'review-approved-1' },
      { accessToken: 'session-token', userId: 'user-1' },
    );
    await waitFor(() => expect(within(firstRow).getByRole('status')).toHaveTextContent('Gracias. Revisaremos esta review.'));
    expect(within(firstRow).getByLabelText('Review reportada')).toHaveTextContent('Reportada');
  });

  it('duplicado de reporte muestra mensaje controlado y no abre contador', async () => {
    const user = userEvent.setup();
    mockAuth({
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      session: { access_token: 'session-token' },
      isAuthenticated: true,
    });
    createReviewReportMock.mockRejectedValue(new Error('Ya has reportado esta review.'));

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const firstRow = (await screen.findAllByTestId('owner-report-row'))[0];
    await user.click(await waitFor(() => within(firstRow).getByRole('button', { name: /Reportar review/i })));
    await user.click(within(firstRow).getByRole('button', { name: /Enviar reporte/i }));

    await waitFor(() => expect(within(firstRow).getByRole('status')).toHaveTextContent('Ya has reportado esta review.'));
    expect(within(firstRow).getByLabelText('Review reportada')).toHaveTextContent('Reportada');
    expect(within(firstRow).queryByText(/Reportar\s+\d/)).not.toBeInTheDocument();
  });

  it('muestra estado Reportada si el usuario ya reportó la review', async () => {
    mockAuth({
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      session: { access_token: 'session-token' },
      isAuthenticated: true,
    });
    getMyReviewReportsMock.mockResolvedValue([
      {
        comment: null,
        reason: 'spam',
        reviewId: 'review-approved-1',
        status: 'pending',
        userId: 'user-1',
      },
    ]);

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const firstRow = (await screen.findAllByTestId('owner-report-row'))[0];
    await waitFor(() => expect(within(firstRow).getByLabelText('Review reportada')).toHaveTextContent('Reportada'));
    expect(within(firstRow).queryByRole('button', { name: /Reportar review/i })).not.toBeInTheDocument();
  });

  it('no permite marcar como útil una review propia y la muestra como métrica pasiva', async () => {
    mockAuth({
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      session: { access_token: 'session-token' },
      isAuthenticated: true,
    });
    getApprovedReviewsMock.mockResolvedValue([
      createApprovedReviewFixture({
        id: 'own-review',
        comment: 'Mi propia review publicada.',
        userId: 'user-1',
      }),
    ]);
    getReviewReactionSummaryMock.mockResolvedValue([
      { helpfulCount: 7, hasReactedHelpful: false, hasReactedNotHelpful: false, reviewId: 'own-review' },
    ]);

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const row = (await screen.findAllByTestId('owner-report-row'))[0];

    await waitFor(() => expect(within(row).getByLabelText('Útil 7')).toBeInTheDocument());
    expect(within(row).queryByRole('button', { name: /Útil 7/i })).not.toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: /No útil/i })).not.toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: /Reportar review/i })).not.toBeInTheDocument();
  });

  it('mueve Problemas comunes e insights al sidebar debajo de filtros', async () => {
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const sidebar = screen.getByRole('complementary', { name: /Resumen de comunidad/i });
    const insightsHeading = screen.getByRole('heading', { name: /Problemas comunes e insights/i });
    const insightsSection = insightsHeading.closest('section');
    const filters = sidebar.querySelector('.motorcycle-community__filters');

    expect(screen.getAllByRole('heading', { name: /Problemas comunes e insights/i })).toHaveLength(1);
    expect(insightsSection).not.toBeNull();
    expect(filters).toBeInTheDocument();
    expect(sidebar).toContainElement(insightsSection as HTMLElement);
    expect(Array.from(sidebar.children).indexOf(filters as Element)).toBe(0);
    expect(Array.from(sidebar.children).indexOf(insightsSection as Element)).toBe(1);
    expect(await screen.findByRole('list', { name: /Listado compacto de owner reports/i })).toBeInTheDocument();
  });

  it('pagina 5 owner reports por página y no muestra paginación con una sola página', async () => {
    const user = userEvent.setup();
    getApprovedReviewsMock.mockResolvedValue(createReviewFixtures(12));

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    expect(await screen.findByText('Review aprobada 1')).toBeInTheDocument();
    expect(screen.getAllByTestId('owner-report-row')).toHaveLength(5);
    expect(screen.queryByText('Review aprobada 6')).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /Paginación de owner reports/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Review aprobada 6')).toBeInTheDocument();

    cleanup();
    getApprovedReviewsMock.mockResolvedValue([createApprovedReviewFixture({ comment: 'Única review aprobada.' })]);
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    expect(await screen.findByText('Única review aprobada.')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: /Paginación de owner reports/i })).not.toBeInTheDocument();
  });

  it('filtra por rating y resetea a página 1 al cambiar filtros', async () => {
    const user = userEvent.setup();
    getApprovedReviewsMock.mockResolvedValue([
      createApprovedReviewFixture({ id: 'rating-five-stars', comment: 'Cinco estrellas.', rating: 5, createdAt: '2026-05-01T10:00:00.000Z' }),
      createApprovedReviewFixture({ id: 'rating-four-stars', comment: 'Cuatro estrellas.', rating: 4, createdAt: '2026-05-02T10:00:00.000Z' }),
      createApprovedReviewFixture({ id: 'rating-three-stars', comment: 'Tres estrellas.', rating: 3, createdAt: '2026-05-03T10:00:00.000Z' }),
      ...createReviewFixtures(8).map((review, index) => ({ ...review, id: `extra-${index}`, comment: `Extra ${index + 1}`, rating: 4 })),
    ]);

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    expect(await screen.findByText('Extra 1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: '4 estrellas o más' }));
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: '5 estrellas' }));
    expect(screen.getByText('Cinco estrellas.')).toBeInTheDocument();
    expect(screen.queryByText('Cuatro estrellas.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '3 estrellas o menos' }));
    expect(screen.getByText('Tres estrellas.')).toBeInTheDocument();
    expect(screen.queryByText('Cinco estrellas.')).not.toBeInTheDocument();
  });

  it('ordena por más recientes, mejor valoradas, más kilómetros y más tiempo con la moto', async () => {
    const user = userEvent.setup();
    getApprovedReviewsMock.mockResolvedValue([
      createApprovedReviewFixture({ id: 'sort-recent', comment: 'Más reciente.', rating: 3, kilometers: 1000, ownershipMonths: 2, createdAt: '2026-05-20T10:00:00.000Z' }),
      createApprovedReviewFixture({ id: 'sort-best-rated', comment: 'Mejor valorada.', rating: 5, kilometers: 2000, ownershipMonths: 6, createdAt: '2026-05-10T10:00:00.000Z' }),
      createApprovedReviewFixture({ id: 'sort-most-km', comment: 'Más kilómetros.', rating: 4, kilometers: 45000, ownershipMonths: 8, createdAt: '2026-05-09T10:00:00.000Z' }),
      createApprovedReviewFixture({ id: 'sort-most-ownership', comment: 'Más tiempo.', rating: 4, kilometers: 3000, ownershipMonths: 84, createdAt: '2026-05-08T10:00:00.000Z' }),
    ]);

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    expect(within((await screen.findAllByTestId('owner-report-row'))[0]).getByText('Más reciente.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Orden: Mejor valoradas' }));
    await waitFor(() => expect(within(screen.getAllByTestId('owner-report-row')[0]).getByText('Mejor valorada.')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Orden: Más kilómetros' }));
    await waitFor(() => expect(within(screen.getAllByTestId('owner-report-row')[0]).getByText('Más kilómetros.')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Orden: Más tiempo con la moto' }));
    await waitFor(() => expect(within(screen.getAllByTestId('owner-report-row')[0]).getByText('Más tiempo.')).toBeInTheDocument());
  });

  it('limpia pros/contras nulos o vacíos y no renderiza texto literal null', async () => {
    getApprovedReviewsMock.mockResolvedValue([
      {
        ...createApprovedReviewFixture({ id: 'mixed-pros-cons', comment: 'Review con pros y contras mixtos.' }),
        pros: ['fiabilidad', null, '', 'consumo'] as unknown as readonly string[],
        cons: [null, 'peso', 'null'] as unknown as readonly string[],
      },
      {
        ...createApprovedReviewFixture({ id: 'empty-pros-cons', comment: 'Review sin pros ni contras visibles.' }),
        pros: [null, ''] as unknown as readonly string[],
        cons: null as unknown as readonly string[],
      },
    ]);

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const firstRow = await screen.findByText('Review con pros y contras mixtos.').then((element) => element.closest('[data-testid=\"owner-report-row\"]') as HTMLElement);
    const secondRow = screen.getByText('Review sin pros ni contras visibles.').closest('[data-testid=\"owner-report-row\"]') as HTMLElement;

    expect(firstRow).toHaveTextContent('Pros: fiabilidad, consumo');
    expect(firstRow).toHaveTextContent('Contras: peso');
    expect(within(secondRow).queryByText(/Pros:/)).not.toBeInTheDocument();
    expect(within(secondRow).queryByText(/Contras:/)).not.toBeInTheDocument();
    expect(screen.queryByText('null')).not.toBeInTheDocument();
  });

  it('mantiene icono de usuario sin inicial y no crea dislikes ni respuestas funcionales', async () => {
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const row = (await screen.findAllByTestId('owner-report-row'))[0];
    const avatar = row.querySelector('.motorcycle-community__owner-avatar');

    expect(avatar).toBeInTheDocument();
    expect(avatar?.querySelector('strong')).not.toBeInTheDocument();
    expect(within(row).getByLabelText('5 de 5 estrellas')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /dislike|responder|respuesta/i })).not.toBeInTheDocument();
  });

  it('mantiene navegación hacia ficha y comparador', async () => {
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const page = screen.getByRole('main');
    expect(within(page).getByRole('link', { name: /Ver ficha/i })).toHaveAttribute('href', '#/motos/test-bmw-f-900-gs');
    expect(within(page).getByRole('link', { name: /Comparar esta moto/i })).toHaveAttribute(
      'href',
      '#/comparador?bikes=test-bmw-f-900-gs',
    );
    await waitFor(() => expect(getApprovedReviewsMock).toHaveBeenCalled());
  });
});
