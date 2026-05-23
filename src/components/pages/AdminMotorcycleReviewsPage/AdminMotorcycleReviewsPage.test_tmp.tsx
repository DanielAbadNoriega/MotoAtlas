import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../../features/auth';
import { getReviewsByMotorcycleId } from '../../../services/motorcycleReviewService';
import { AdminMotorcycleReviewsPage } from './AdminMotorcycleReviewsPage';

vi.mock('../../../features/auth', () => ({ useAuth: vi.fn() }));
vi.mock('../../../services/motorcycleReviewService', () => ({ getReviewsByMotorcycleId: vi.fn() }));

const useAuthMock = vi.mocked(useAuth);
const getReviewsByMotorcycleIdMock = vi.mocked(getReviewsByMotorcycleId);

describe('mini', () => {
  it('renders without bike', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'admin-1', email: 'a@b.com' },
      session: { access_token: 'tok' },
      profile: { id: 'admin-1', displayName: 'Admin', avatarUrl: null, role: 'admin' },
      isAuthenticated: true, isAdmin: true, isLoading: false,
      signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), refreshProfile: vi.fn(),
    } as never);
    getReviewsByMotorcycleIdMock.mockResolvedValue([]);
    render(<AdminMotorcycleReviewsPage bike={undefined} motorcycleId="test-id" />);
    expect(screen.getByText('test-id')).toBeTruthy();
  });
});
