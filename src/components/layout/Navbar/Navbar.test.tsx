import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { Navbar } from './Navbar';

function renderNavbar() {
  return render(<Navbar />);
}

describe('Navbar responsive', () => {
  beforeEach(() => {
    window.history.pushState(null, '', '/');
    window.location.hash = '';
  });

  it('muestra enlaces principales en desktop', () => {
    renderNavbar();
    const primaryNav = screen.getByRole('navigation', { name: 'Navegación principal' });

    expect(within(primaryNav).getByRole('link', { name: 'Buscador' })).toHaveAttribute('href', '#/buscador');
    expect(within(primaryNav).getByRole('link', { name: 'Comparador' })).toHaveAttribute('href', '#/comparador');
    expect(within(primaryNav).getByRole('link', { name: 'Noticias' })).toHaveAttribute('href', '#/noticias');
    expect(within(primaryNav).getByRole('link', { name: 'Comunidad' })).toHaveAttribute('href', '#/comunidad');
  });

  it('muestra bottom nav mobile con labels principales', () => {
    renderNavbar();
    const mobileNav = screen.getByRole('navigation', { name: 'Navegación móvil' });

    expect(within(mobileNav).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '#/');
    expect(within(mobileNav).getByRole('link', { name: 'Comparar' })).toHaveAttribute('href', '#/comparador');
    expect(within(mobileNav).getByRole('link', { name: 'Comunidad' })).toHaveAttribute('href', '#/comunidad');
    expect(within(mobileNav).queryByRole('link', { name: 'Perfil' })).not.toBeInTheDocument();
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
