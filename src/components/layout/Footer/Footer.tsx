import { brand, footerContent } from '../../../data/site';
import { IconButton } from '../../ui/IconButton';
import './Footer.scss';

export function Footer() {
  return (
    <footer className="footer" id="comunidad" aria-label={footerContent.ariaLabel}>
      <div className="footer__inner">
        <div className="footer__brand-block">
          <strong>{brand.name}</strong>
          <p>{footerContent.copyright}</p>
        </div>

        <nav className="footer__links" aria-label={footerContent.secondaryNavLabel}>
          {footerContent.links.map((link) => (
            <a href={link.href} key={link.label}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="footer__social" aria-label={footerContent.socialLabel}>
          {footerContent.socialActions.map((action) => (
            <IconButton icon={action.icon} label={action.label} key={action.icon} />
          ))}
        </div>
      </div>
    </footer>
  );
}
