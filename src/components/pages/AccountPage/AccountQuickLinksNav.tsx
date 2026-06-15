import { useEffect, useState } from 'react';

export type AccountQuickLinksActiveItem = 'overview' | 'reviews' | 'requests';
export type AdminQuickLinksActiveItem = 'dashboard' | 'moderation' | 'reviews' | 'requests' | 'models';
export type AdminQuickLinksModelsItem = 'overview' | 'new' | 'edit';

type AccountQuickLinksNavProps = Readonly<{
  activeAccountItem?: AccountQuickLinksActiveItem;
  activeAdminItem?: AdminQuickLinksActiveItem;
  activeAdminModelsItem?: AdminQuickLinksModelsItem;
  ariaLabel: string;
  includeAdmin?: boolean;
}>;

type QuickLinkItem = Readonly<{
  href: string;
  id: string;
  label: string;
}>;

const accountLinks = [
  { href: '#/cuenta', id: 'overview', label: 'Resumen' },
  { href: '#/cuenta/reviews', id: 'reviews', label: 'Mis reviews' },
  { href: '#/cuenta/solicitudes', id: 'requests', label: 'Mis solicitudes' },
] as const satisfies readonly QuickLinkItem[];

const adminLinks = [
  { href: '#/admin', id: 'dashboard', label: 'Panel admin' },
  { href: '#/admin/moderacion', id: 'moderation', label: 'Moderación' },
  { href: '#/admin/reviews', id: 'reviews', label: 'Reviews' },
  { href: '#/admin/solicitudes', id: 'requests', label: 'Solicitudes' },
] as const satisfies readonly QuickLinkItem[];

const adminModelLinks = [
  { href: '#/admin/modelos', id: 'overview', label: 'Vista general' },
  { href: '#/admin/modelos/nuevo', id: 'new', label: 'Nuevo modelo' },
  { href: '#/admin/modelos/editar', id: 'edit', label: 'Editar catálogo' },
] as const satisfies readonly QuickLinkItem[];

function getLinkClassName(isActive: boolean) {
  return isActive
    ? 'account-page__quick-link account-page__quick-link--active'
    : 'account-page__quick-link';
}

export function AccountQuickLinksNav({
  activeAccountItem,
  activeAdminItem,
  activeAdminModelsItem,
  ariaLabel,
  includeAdmin = false,
}: AccountQuickLinksNavProps) {
  const [isAccountGroupOpen, setIsAccountGroupOpen] = useState(true);
  const [isAdminGroupOpen, setIsAdminGroupOpen] = useState(includeAdmin);
  const [isModelsGroupOpen, setIsModelsGroupOpen] = useState(includeAdmin);
  const isAdminGroupActive = Boolean(activeAdminItem || activeAdminModelsItem);
  const isModelsGroupActive = activeAdminItem === 'models' || Boolean(activeAdminModelsItem);

  useEffect(() => {
    if (includeAdmin) {
      setIsAdminGroupOpen(true);
      setIsModelsGroupOpen(true);
    }
  }, [includeAdmin]);

  useEffect(() => {
    if (activeAdminModelsItem) {
      setIsAdminGroupOpen(true);
      setIsModelsGroupOpen(true);
    }
  }, [activeAdminModelsItem]);

  return (
    <nav className="account-page__quick-links" aria-label={ariaLabel}>
      <details
        className={[
          'account-page__quick-link-group',
          activeAccountItem ? 'account-page__quick-link-group--active' : '',
        ].filter(Boolean).join(' ')}
        open={isAccountGroupOpen}
        onToggle={(event) => setIsAccountGroupOpen(event.currentTarget.open)}
      >
        <summary className="account-page__quick-link-summary">
          <span>Mi cuenta</span>
          <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
        </summary>
        <div className="account-page__quick-link-list">
          {accountLinks.map((link) => {
            const isActive = activeAccountItem === link.id;

            return (
              <a
                key={link.href}
                className={getLinkClassName(isActive)}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
              >
                {link.label}
              </a>
            );
          })}
        </div>
      </details>

      {includeAdmin ? (
        <details
          className={[
            'account-page__quick-link-group',
            isAdminGroupActive ? 'account-page__quick-link-group--active' : '',
          ].filter(Boolean).join(' ')}
          open={isAdminGroupOpen}
          onToggle={(event) => setIsAdminGroupOpen(event.currentTarget.open)}
        >
          <summary className="account-page__quick-link-summary">
            <span>Panel Admin</span>
            <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
          </summary>
          <div className="account-page__quick-link-list">
            {adminLinks.map((link) => {
              const isActive = activeAdminItem === link.id;

              return (
                <a
                  key={link.href}
                  className={getLinkClassName(isActive)}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                </a>
              );
            })}

            <details
              className={[
                'account-page__quick-link-subgroup',
                isModelsGroupActive ? 'account-page__quick-link-subgroup--active' : '',
              ].filter(Boolean).join(' ')}
              open={isModelsGroupOpen}
              onToggle={(event) => setIsModelsGroupOpen(event.currentTarget.open)}
            >
              <summary className="account-page__quick-link-summary account-page__quick-link-summary--nested">
                <span>Modelos</span>
                <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
              </summary>
              <div className="account-page__quick-link-list account-page__quick-link-list--nested">
                {adminModelLinks.map((link) => {
                  const isActive = (
                    (activeAdminItem === 'models' && link.id === 'overview')
                    || activeAdminModelsItem === link.id
                  );

                  return (
                    <a
                      key={link.href}
                      className={getLinkClassName(isActive)}
                      href={link.href}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {link.label}
                    </a>
                  );
                })}
              </div>
            </details>
          </div>
        </details>
      ) : null}
    </nav>
  );
}
