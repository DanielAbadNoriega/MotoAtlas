import { brand, footerContent } from '../../../data/site';
import './Footer.scss';

export function Footer() {
  return (
    <footer className="footer" aria-label={footerContent.ariaLabel}>
      <div className="footer__inner">
        <section className="footer__brand-block" aria-label="MotoAtlas">
          <a className="footer__brand" href={brand.homeHref} aria-label={brand.homeAriaLabel}>
            {brand.name}
          </a>
          <p>{footerContent.brandDescription}</p>
        </section>

        <div className="footer__columns" aria-label="Enlaces del pie de página">
          {footerContent.columns.map((column) => (
            <nav className="footer__column" aria-label={column.title} key={column.title}>
              <h2>{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <nav className="footer__column footer__column--social" aria-label="Social">
            <h2>Social</h2>
            <ul className="footer__social-list">
              {footerContent.socialActions.map((action) => (
                <li key={action.label}>
                  <a href={action.href} target="_blank" rel="noopener noreferrer" aria-label={`MotoAtlas en ${action.label}`}>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {action.icon}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <small className="footer__copyright">{footerContent.copyright}</small>
      </div>
    </footer>
  );
}
