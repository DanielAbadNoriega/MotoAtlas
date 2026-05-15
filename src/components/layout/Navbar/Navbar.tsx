import { useEffect, useMemo, useRef, useState } from 'react';
import { brand, navActions, siteA11y } from '../../../data/site';
import { getCurrentAppRoute, routeToPathAndSearch } from '../../../shared/routing/routeUtils';
import {
  compareQueueChangeEventName,
  getComparatorHashFromIds,
  loadCompareQueue,
} from '../../../utils/compareQueue';
import './Navbar.scss';

type NavigationItem = Readonly<{
  href: `#${string}`;
  icon: string;
  id: 'home' | 'search' | 'compare' | 'news' | 'community' | 'profile';
  label: string;
}>;

const staticDesktopItems = [
  { id: 'search', icon: 'explore', label: 'Buscador', href: '#/buscador' },
  { id: 'compare', icon: 'compare_arrows', label: 'Comparador', href: '#/comparador' },
  { id: 'news', icon: 'article', label: 'Noticias', href: '#/noticias' },
  { id: 'community', icon: 'hub', label: 'Comunidad', href: '#/comunidad' },
] satisfies readonly NavigationItem[];

const staticMobileItems = [
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

function useCompareHref() {
  const [queue, setQueue] = useState(loadCompareQueue);

  useEffect(() => {
    const updateQueue = () => setQueue(loadCompareQueue());

    window.addEventListener(compareQueueChangeEventName, updateQueue);
    window.addEventListener('storage', updateQueue);
    window.addEventListener('hashchange', updateQueue);

    return () => {
      window.removeEventListener(compareQueueChangeEventName, updateQueue);
      window.removeEventListener('storage', updateQueue);
      window.removeEventListener('hashchange', updateQueue);
    };
  }, []);

  return getComparatorHashFromIds(queue);
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

function getNavigationItems(compareHref: `#${string}`) {
  return staticDesktopItems.map((item) => (item.id === 'compare' ? { ...item, href: compareHref } : item));
}

function DesktopNav({ compareHref, route }: { compareHref: `#${string}`; route: string }) {
  const items = getNavigationItems(compareHref);

  return (
    <nav className="navbar__desktop-links" aria-label={siteA11y.mainNavigationLabel}>
      {items.map((item) => (
        <a href={item.href} key={item.id} aria-current={getAriaCurrent(route, item.id)}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}

function DrawerNav({ compareHref, isOpen, onClose, route }: { compareHref: `#${string}`; isOpen: boolean; onClose: () => void; route: string }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerItems = useMemo(
    () => [
      ...getNavigationItems(compareHref),
      { id: 'profile', icon: 'account_circle', label: 'Perfil', href: '#/perfil' },
    ] satisfies readonly NavigationItem[],
    [compareHref],
  );

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
        <button ref={closeButtonRef} className="navbar__drawer-close" type="button" onClick={onClose} aria-label="Cerrar menú">
          <NavIcon icon="close" />
        </button>
        <hr/>
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

function MobileBottomNav({ compareHref, route }: { compareHref: `#${string}`; route: string }) {
  const items = staticMobileItems.map((item) => (item.id === 'compare' ? { ...item, href: compareHref } : item));

  return (
    <nav className="navbar__mobile-bottom" aria-label="Navegación móvil">
      {items.map((item) => (
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
  const compareHref = useCompareHref();

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

          <DesktopNav compareHref={compareHref} route={route} />

          <div className="navbar__desktop-actions">
            <button className="navbar__mobile-icon" type="button" onClick={openSearch} aria-label="Abrir buscador">
              <NavIcon icon="search" />
            </button>
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
      <DrawerNav compareHref={compareHref} isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} route={route} />
      <MobileBottomNav compareHref={compareHref} route={route} />
    </>
  );
}
