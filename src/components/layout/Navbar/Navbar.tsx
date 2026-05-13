import { brand, navActions, navLinks, siteA11y } from '../../../data/site';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import './Navbar.scss';

export function Navbar() {
  const openSearch = () => {
    window.location.hash = '#/buscador';
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <a className="navbar__brand" href={brand.homeHref} aria-label={brand.homeAriaLabel}>
          {brand.name}
        </a>

        <nav className="navbar__links" aria-label={siteA11y.mainNavigationLabel}>
          {navLinks.map((link) => (
            <a href={link.href} key={link.label}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="navbar__actions">
          <Button variant="ghost" className="navbar__signin">
            {navActions.signInLabel}
          </Button>
          <IconButton
            className="navbar__icon navbar__icon--search"
            icon="search"
            label={navActions.searchLabel}
            onClick={openSearch}
          />
          <IconButton
            className="navbar__icon navbar__icon--menu"
            icon="menu"
            label={navActions.menuLabel}
          />
          <IconButton
            className="navbar__icon navbar__icon--profile"
            icon="account_circle"
            label={navActions.profileLabel}
          />
        </div>
      </div>
    </header>
  );
}
