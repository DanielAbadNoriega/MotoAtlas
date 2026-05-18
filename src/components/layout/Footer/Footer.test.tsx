import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renderiza MotoAtlas dentro de un footer semántico', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo', { name: /Pie de página de MotoAtlas/i });

    expect(footer.tagName.toLowerCase()).toBe('footer');
    expect(within(footer).getByRole('link', { name: /Ir al inicio de MotoAtlas/i })).toHaveTextContent('MotoAtlas');
    expect(within(footer).getByText('Registro técnico de motos, comparativas y comunidad.')).toBeInTheDocument();
  });

  it('renderiza columnas principales', () => {
    render(<Footer />);

    expect(screen.getByRole('navigation', { name: 'Explorar' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Datos' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Legal' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Social' })).toBeInTheDocument();
  });

  it('usa los href hash principales correctos', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: 'Buscador' })).toHaveAttribute('href', '#/buscador');
    expect(screen.getByRole('link', { name: 'Comparador' })).toHaveAttribute('href', '#/comparador');
    expect(screen.getByRole('link', { name: 'Comunidad' })).toHaveAttribute('href', '#/comunidad');
    expect(screen.getByRole('link', { name: 'Motos mejor valoradas' })).toHaveAttribute('href', '#/motos-mejor-valoradas');
  });


  it('incluye las rutas de Datos y Legal enlazadas desde el footer', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: 'Metodología' })).toHaveAttribute('href', '#/metodologia');
    expect(screen.getByRole('link', { name: 'Fuentes de datos' })).toHaveAttribute('href', '#/fuentes-datos');
    expect(screen.getByRole('link', { name: 'Solicitar modelo' })).toHaveAttribute('href', '#/solicitar-modelo');
    expect(screen.getByRole('link', { name: 'Privacidad' })).toHaveAttribute('href', '#/privacidad');
    expect(screen.getByRole('link', { name: 'Términos' })).toHaveAttribute('href', '#/terminos');
  });

  it('no renderiza idioma global ni share global', () => {
    render(<Footer />);

    expect(screen.queryByRole('button', { name: /Cambiar idioma/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Compartir MotoAtlas/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Soporte/i)).not.toBeInTheDocument();
  });

  it('renderiza redes sociales externas con target, rel y aria-label', () => {
    render(<Footer />);

    for (const socialName of ['TikTok', 'Instagram', 'YouTube', 'Facebook']) {
      const link = screen.getByRole('link', { name: `MotoAtlas en ${socialName}` });

      expect(link).toHaveAttribute('href', expect.stringMatching(/^https:\/\/www\./));
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('mantiene las redes como enlaces accesibles sin texto visible y muestra un único copyright', () => {
    render(<Footer />);

    expect(screen.queryByText('TikTok')).not.toBeInTheDocument();
    expect(screen.queryByText('Instagram')).not.toBeInTheDocument();
    expect(screen.queryByText('YouTube')).not.toBeInTheDocument();
    expect(screen.queryByText('Facebook')).not.toBeInTheDocument();
    expect(screen.getAllByText('© 2026 MotoAtlas. Todos los derechos reservados.')).toHaveLength(1);
  });
});
