import './Footer.scss';

const footerLinks = ['Privacidad', 'Términos', 'Especificaciones técnicas', 'Soporte'];

export function Footer() {
  return (
    <footer className="footer" id="comunidad">
      <div className="footer__inner">
        <div className="footer__brand-block">
          <strong>MotoAtlas</strong>
          <p>© 2026 MotoAtlas. Registro de ingeniería de alto rendimiento.</p>
        </div>

        <nav className="footer__links" aria-label="Enlaces secundarios">
          {footerLinks.map((link) => (
            <a href="#top" key={link}>
              {link}
            </a>
          ))}
        </nav>

        <div className="footer__social" aria-label="Acciones sociales">
          <button aria-label="Cambiar idioma">
            <span className="material-symbols-outlined" aria-hidden="true">
              language
            </span>
          </button>
          <button aria-label="Compartir MotoAtlas">
            <span className="material-symbols-outlined" aria-hidden="true">
              share
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
