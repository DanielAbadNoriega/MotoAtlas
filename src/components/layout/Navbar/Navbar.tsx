import { Button } from '../../ui/Button';
import './Navbar.scss';

const navLinks = [
  { label: 'Comparativas', href: '#comparativas' },
  { label: 'Noticias', href: '#noticias' },
  { label: 'Rutas', href: '#rutas' },
  { label: 'Comunidad', href: '#comunidad' },
];

export function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <a className="navbar__brand" href="#top" aria-label="Ir al inicio de MotoAtlas">
          MotoAtlas
        </a>

        <nav className="navbar__links" aria-label="Navegación principal">
          {navLinks.map((link) => (
            <a href={link.href} key={link.label}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="navbar__actions">
          <Button variant="ghost" className="navbar__signin">
            Ingresar
          </Button>
          <button className="navbar__icon" aria-label="Abrir perfil">
            <span className="material-symbols-outlined" aria-hidden="true">
              account_circle
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
