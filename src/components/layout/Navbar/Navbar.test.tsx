import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../../features/auth';
import { getSupabaseClient } from '../../../shared/supabase/supabaseClient';
import { Navbar } from './Navbar';


vi.mock('../../../shared/supabase/supabaseClient', () => ({
  getSupabaseClient: vi.fn(),
}));

const getSupabaseClientMock = vi.mocked(getSupabaseClient);

function renderNavbar() {
  return render(<Navbar />);
}

describe('Navbar responsive', () => {
  beforeEach(() => {
    window.history.pushState(null, '', '/');
    window.location.hash = '';
    window.localStorage.clear();
    getSupabaseClientMock.mockReset();
    getSupabaseClientMock.mockReturnValue(null);
  });

  it('define el navbar desktop desde 991px', () => {
    const styles = readFileSync('src/components/layout/Navbar/Navbar.scss', 'utf8');

    expect(styles).toContain('$navbar-desktop-min: 991px');
    expect(styles).toContain('@media (min-width: $navbar-desktop-min)');
  });

  it('muestra enlaces principales en desktop', () => {
    renderNavbar();
    const primaryNav = screen.getByRole('navigation', { name: 'Navegación principal' });

    expect(within(primaryNav).getByRole('link', { name: 'Buscador' })).toHaveAttribute('href', '#/buscador');
    expect(within(primaryNav).getByRole('link', { name: 'Comparador' })).toHaveAttribute('href', '#/comparador');
    expect(within(primaryNav).getByRole('link', { name: 'Noticias' })).toHaveAttribute('href', '#/noticias');
    expect(within(primaryNav).getByRole('link', { name: 'Comunidad' })).toHaveAttribute('href', '#/comunidad');
  });


  it('muestra Iniciar sesión sin usuario', () => {
    renderNavbar();

    expect(screen.getAllByRole('link', { name: /Iniciar sesión/i }).map((link) => link.getAttribute('href'))).toContain('#/login');
  });

  it('muestra Mi cuenta y permite cerrar sesión con usuario autenticado', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const profileQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'user-1', display_name: 'Rider Zero', avatar_url: null, role: 'user' },
        error: null,
      }),
    };
    getSupabaseClientMock.mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: 'token', user: { id: 'user-1', email: 'rider@motoatlas.com' } } },
          error: null,
        }),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        signOut,
      },
      from: vi.fn(() => profileQuery),
    } as never);
    const user = userEvent.setup();

    render(<AuthProvider><Navbar /></AuthProvider>);

    expect(await screen.findByRole('link', { name: /Rider Zero/i })).toHaveAttribute('href', '#/cuenta');
    await user.click(screen.getByRole('button', { name: /Cerrar sesión/i }));

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('muestra bottom nav mobile con labels principales', () => {
    renderNavbar();
    const mobileNav = screen.getByRole('navigation', { name: 'Navegación móvil' });

    expect(within(mobileNav).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '#/');
    expect(within(mobileNav).getByRole('link', { name: 'Comparar' })).toHaveAttribute('href', '#/comparador');
    expect(within(mobileNav).getByRole('link', { name: 'Comunidad' })).toHaveAttribute('href', '#/comunidad');
    expect(within(mobileNav).queryByRole('link', { name: 'Perfil' })).not.toBeInTheDocument();
  });

  it('navega al buscador desde el icono de búsqueda desktop', async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole('button', { name: 'Abrir buscador' }));

    expect(window.location.hash).toBe('#/buscador');
  });

  it('conserva las motos seleccionadas en el enlace del comparador', () => {
    window.localStorage.setItem('motoatlas.compareQueue.v1', JSON.stringify(['test-bmw-f-900-gs', 'test-aprilia-tuareg-660']));

    renderNavbar();

    const primaryNav = screen.getByRole('navigation', { name: 'Navegación principal' });
    const mobileNav = screen.getByRole('navigation', { name: 'Navegación móvil' });

    expect(within(primaryNav).getByRole('link', { name: 'Comparador' })).toHaveAttribute(
      'href',
      '#/comparador?bikes=test-bmw-f-900-gs,test-aprilia-tuareg-660',
    );
    expect(within(mobileNav).getByRole('link', { name: 'Comparar' })).toHaveAttribute(
      'href',
      '#/comparador?bikes=test-bmw-f-900-gs,test-aprilia-tuareg-660',
    );
  });

  it('abre el drawer tablet con hamburguesa', async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));

    expect(screen.getByRole('dialog', { name: 'Navegación' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegación tablet' })).toBeInTheDocument();
  });

  it('cierra el drawer con el botón cerrar', async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    await user.click(screen.getByRole('button', { name: 'Cerrar menú' }));

    expect(screen.queryByRole('dialog', { name: 'Navegación' })).not.toBeInTheDocument();
  });

  it('cierra el drawer con Escape', async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Navegación' })).not.toBeInTheDocument());
  });

  it('marca el item activo con aria-current', () => {
    window.location.hash = '#/comunidad/test-bmw-f-900-gs';
    renderNavbar();
    const mobileNav = screen.getByRole('navigation', { name: 'Navegación móvil' });

    expect(within(mobileNav).getByRole('link', { name: 'Comunidad' })).toHaveAttribute('aria-current', 'page');
  });

  it('navega a Home, Buscador, Comparador y Comunidad', async () => {
    const user = userEvent.setup();
    renderNavbar();
    const primaryNav = screen.getByRole('navigation', { name: 'Navegación principal' });
    const mobileNav = screen.getByRole('navigation', { name: 'Navegación móvil' });

    await user.click(within(primaryNav).getByRole('link', { name: 'Buscador' }));
    expect(window.location.hash).toBe('#/buscador');

    await user.click(within(mobileNav).getByRole('link', { name: 'Comparar' }));
    expect(window.location.hash).toBe('#/comparador');

    await user.click(within(mobileNav).getByRole('link', { name: 'Comunidad' }));
    expect(window.location.hash).toBe('#/comunidad');

    await user.click(within(mobileNav).getByRole('link', { name: 'Home' }));
    expect(window.location.hash).toBe('#/');
  });

  it('no muestra bloques técnicos falsos de Stitch', () => {
    renderNavbar();

    expect(screen.queryByText(/SYSTEM STATUS/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/TELEMETRY_LINK/i)).not.toBeInTheDocument();
  });
});
