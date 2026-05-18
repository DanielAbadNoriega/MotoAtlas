import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DataMethodologyPage,
  DataSourcesPage,
  PrivacyPage,
  RequestModelPage,
  TermsPage,
} from './StaticInfoPages';

describe('StaticInfoPages', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renderiza metodología con etiquetas de procedencia de datos', () => {
    render(<DataMethodologyPage />);

    expect(screen.getByRole('heading', { name: /Datos técnicos con contexto/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Explorar motos/i })).not.toBeInTheDocument();
    expect(screen.getAllByText('api').length).toBeGreaterThan(0);
    expect(screen.getAllByText('manual').length).toBeGreaterThan(0);
    expect(screen.getAllByText('estimated').length).toBeGreaterThan(0);
    expect(screen.getAllByText('user').length).toBeGreaterThan(0);
    expect(screen.getAllByText('placeholder').length).toBeGreaterThan(0);
  });

  it('renderiza fuentes de datos con bloque de transparencia', () => {
    render(<DataSourcesPage />);

    expect(screen.getByRole('heading', { name: /Sabe de dónde viene cada dato/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Source Intelligence/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Data Architecture/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Confidence Index Protocol/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Explorar motos/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Precio en euros con `price_source`/i)).toBeInTheDocument();
    expect(screen.getByText(/Solo el contenido approved se muestra públicamente/i)).toBeInTheDocument();
    expect(screen.getByText(/verifica siempre la información con el fabricante o concesionario/i)).toBeInTheDocument();
  });

  it('renderiza privacidad y términos como páginas legales sobrias', () => {
    const { rerender } = render(<PrivacyPage />);

    expect(screen.getByRole('heading', { name: 'Privacidad' })).toBeInTheDocument();
    expect(screen.getAllByText(/Esta política podrá actualizarse/i).length).toBeGreaterThan(0);

    rerender(<TermsPage />);

    expect(screen.getByRole('heading', { name: /Términos de uso/i })).toBeInTheDocument();
    expect(screen.getByText(/no sustituye la verificación oficial/i)).toBeInTheDocument();
  });

  it('navega por el índice legal sin romper la ruta hash actual', async () => {
    const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
    const user = userEvent.setup();

    window.location.hash = '#/terminos';
    const { rerender } = render(<TermsPage />);

    await user.click(screen.getByRole('link', { name: /01 · Uso de MotoAtlas/i }));

    expect(window.location.hash).toBe('#/terminos');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

    window.location.hash = '#/privacidad';
    rerender(<PrivacyPage />);

    await user.click(screen.getByRole('link', { name: /01 · Datos que podemos recoger/i }));

    expect(window.location.hash).toBe('#/privacidad');
    expect(scrollIntoView).toHaveBeenCalledTimes(2);

    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  });

  it('valida campos obligatorios en Solicitar modelo', async () => {
    const user = userEvent.setup();
    render(<RequestModelPage />);

    await user.click(screen.getByRole('button', { name: /Enviar solicitud/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/Revisa los campos obligatorios/i);
    expect(screen.getByText('La marca es obligatoria.')).toBeInTheDocument();
    expect(screen.getByText('El modelo es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('El año es obligatorio.')).toBeInTheDocument();
  });

  it('muestra success state local y no llama a Supabase al solicitar modelo', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const user = userEvent.setup();
    render(<RequestModelPage />);

    await user.type(screen.getByLabelText('Marca'), 'Honda');
    await user.type(screen.getByLabelText('Modelo'), 'CBR600RR');
    await user.type(screen.getByLabelText('Año'), '2026');
    await user.selectOptions(screen.getByLabelText('Segmento'), 'sport');
    await user.click(screen.getByRole('button', { name: /Enviar solicitud/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/Solicitud recibida/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
