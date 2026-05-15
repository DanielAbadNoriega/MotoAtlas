import { type FormEvent, useEffect, useRef, useState } from 'react';
import { brand, navActions, siteA11y } from '../../../data/site';
import { getCurrentAppRoute, getSearchHashWithText, routeToPathAndSearch } from '../../../shared/routing/routeUtils';
import './Navbar.scss';

type NavigationItem = Readonly<{
  href: `#${string}`;
  icon: string;
  id: 'home' | 'search' | 'compare' | 'news' | 'community' | 'profile';
  label: string;
}>;

const desktopItems = [
  { id: 'search', icon: 'explore', label: 'Buscador', href: '#/buscador' },
  { id: 'compare', icon: 'compare_arrows', label: 'Comparador', href: '#/comparador' },
  { id: 'news', icon: 'article', label: 'Noticias', href: '#/noticias' },
  { id: 'community', icon: 'hub', label: 'Comunidad', href: '#/comunidad' },
] satisfies readonly NavigationItem[];

const drawerItems = [
  ...desktopItems,
  { id: 'profile', icon: 'account_circle', label: 'Perfil', href: '#/perfil' },
] satisfies readonly NavigationItem[];

const mobileItems = [
  { id: 'home', icon: 'home', label: 'Home', href: '#/' },
  { id: 'compare', icon: 'compare_arrows', label: 'Comparar', href: '#/comparador' },
  { id: 'community', icon: 'hub', label: 'Comunidad', href: '#/comunidad' },
] satisfies readonly NavigationItem[];

function useCurrentRoute() {
  const [route, setRoute] = useState(getCurrentAppRoute);

  useEffect(() => {
    const handleRouteChange = () => setRoute(getCurrentAppRoute());

    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return route;
}

function getComparablePath(route: string) {
  const { path } = routeToPathAndSearch(route);
  return path === '/' ? '/' : path.replace(/\/$/, '');
}

function isRouteActive(route: string, itemId: NavigationItem['id']) {
  const path = getComparablePath(route);

  if (itemId === 'home') {
    return path === '/';
  }

  if (itemId === 'search') {
    return /^\/(buscador|catalogo)(\/|$)/.test(path);
  }

  if (itemId === 'compare') {
    return /^\/comparador(\/|$)/.test(path);
  }

  if (itemId === 'news') {
    return path === '/noticias' || route === '#noticias';
  }

  if (itemId === 'community') {
    return /^\/comunidad(\/|$)/.test(path);
  }

  return path === '/perfil';
}

function NavIcon({ icon }: { icon: string }) {
  return (
    <span className="material-symbols-outlined" aria-hidden="true">
      {icon}
    </span>
  );
}

function getAriaCurrent(route: string, itemId: NavigationItem['id']) {
  return isRouteActive(route, itemId) ? 'page' : undefined;
}

function DesktopNav({ route }: { route: string }) {
  return (
    <nav className="navbar__desktop-links" aria-label={siteA11y.mainNavigationLabel}>
      {desktopItems.map((item) => (
        <a href={item.href} key={item.id} aria-current={getAriaCurrent(route, item.id)}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}

function DesktopSearch() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    window.location.hash = getSearchHashWithText(String(formData.get('navbar-search') ?? ''));
  };

  return (
    <form className="navbar__search" onSubmit={handleSubmit}>
      <NavIcon icon="search" />
      <input aria-label="Buscar motos" id="navbar-search" name="navbar-search" placeholder="BUSCAR MOTOS..." type="search" />
    </form>
  );
}

function DrawerNav({ isOpen, onClose, route }: { isOpen: boolean; onClose: () => void; route: string }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="navbar__drawer-layer">
      <button className="navbar__drawer-backdrop" type="button" onClick={onClose} aria-label="Cerrar navegación" />
      <aside id="navbar-tablet-drawer" className="navbar__drawer" role="dialog" aria-modal="true" aria-labelledby="navbar-drawer-title">
        <header className="navbar__drawer-header">
          <span id="navbar-drawer-title" className="navbar__drawer-title">Navegación</span>
          <button ref={closeButtonRef} className="navbar__drawer-close" type="button" onClick={onClose} aria-label="Cerrar menú">
            <NavIcon icon="close" />
          </button>
        </header>
        <nav className="navbar__drawer-links" aria-label="Navegación tablet">
          {drawerItems.map((item) => (
            <a href={item.href} key={item.id} onClick={onClose} aria-current={getAriaCurrent(route, item.id)}>
              <NavIcon icon={item.icon} />
              <span>{item.label}</span>
              <NavIcon icon="chevron_right" />
            </a>
          ))}
        </nav>
      </aside>
    </div>
  );
}

function MobileBottomNav({ route }: { route: string }) {
  return (
    <nav className="navbar__mobile-bottom" aria-label="Navegación móvil">
      {mobileItems.map((item) => (
        <a href={item.href} key={item.id} aria-current={getAriaCurrent(route, item.id)}>
          <NavIcon icon={item.icon} />
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}

export function Navbar() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const route = useCurrentRoute();

  const openSearch = () => {
    window.location.hash = '#/buscador';
  };

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [route]);

  return (
    <>
      <header className="navbar">
        <div className="navbar__inner">
          <a className="navbar__brand" href={brand.homeHref} aria-label={brand.homeAriaLabel}>
            {brand.name}
          </a>

          <DesktopNav route={route} />

          <div className="navbar__desktop-actions">
            <DesktopSearch />
            <a className="navbar__signin" href="#/perfil">
              <NavIcon icon="account_circle" />
              <span>{navActions.signInLabel}</span>
            </a>
          </div>

          <button
            className="navbar__tablet-menu"
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-expanded={isDrawerOpen}
            aria-controls="navbar-tablet-drawer"
            aria-label={navActions.menuLabel}
          >
            <NavIcon icon="menu" />
          </button>

          <div className="navbar__mobile-actions">
            <button className="navbar__mobile-icon" type="button" onClick={openSearch} aria-label={navActions.searchLabel}>
              <NavIcon icon="search" />
            </button>
            <a className="navbar__mobile-icon" href="#/perfil" aria-label={navActions.profileLabel}>
              <NavIcon icon="account_circle" />
            </a>
          </div>
        </div>
      </header>
      <DrawerNav isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} route={route} />
      <MobileBottomNav route={route} />
    </>
  );
}
