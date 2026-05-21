import type { ReactNode } from 'react';

export type AccountSidebarActiveItem = 'overview' | 'reviews' | 'requests';

type AccountSidebarProps = Readonly<{
  activeItem: AccountSidebarActiveItem;
  beforeNotice?: ReactNode;
  displayName: string;
  email: string;
  onSignOut: () => void | Promise<void>;
  notice?: Readonly<{
    body: string;
    strong?: string;
  }>;
}>;

function getNavLinkClassName(item: AccountSidebarActiveItem, activeItem: AccountSidebarActiveItem) {
  return item === activeItem ? 'account-page__quick-link account-page__quick-link--active' : 'account-page__quick-link';
}

export function AccountSidebar({ activeItem, beforeNotice, displayName, email, notice, onSignOut }: AccountSidebarProps) {
  return (
    <aside className="account-page__sidebar" aria-label="Resumen de perfil">
      <article className="account-page__card account-page__profile-card">
        <span className="account-page__ghost-icon material-symbols-outlined" aria-hidden="true">settings_input_component</span>
        <h2>
          <span aria-hidden="true" />
          Resumen de perfil
        </h2>
        <dl>
          <div>
            <dt>Alias de piloto</dt>
            <dd>{displayName}</dd>
          </div>
          <div>
            <dt>Email de acceso</dt>
            <dd>{email}</dd>
          </div>
        </dl>
        <div className="account-page__profile-actions">
          <button className="account-page__button account-page__button--glass" type="button" onClick={onSignOut}>
            <span className="material-symbols-outlined" aria-hidden="true">logout</span>
            Cerrar sesión
          </button>
        </div>
      </article>

      <nav className="account-page__quick-links" aria-label="Navegación de cuenta">
        <a className={getNavLinkClassName('overview', activeItem)} href="#/cuenta" aria-current={activeItem === 'overview' ? 'page' : undefined}>
          Mi cuenta
        </a>
        <a className={getNavLinkClassName('reviews', activeItem)} href="#/cuenta/reviews" aria-current={activeItem === 'reviews' ? 'page' : undefined}>
          Mis reviews
        </a>
        <a className={getNavLinkClassName('requests', activeItem)} href="#/cuenta/solicitudes" aria-current={activeItem === 'requests' ? 'page' : undefined}>
          Mis solicitudes
        </a>
      </nav>

      {beforeNotice}

      {notice ? (
        <article className="account-page__notice">
          <span className="material-symbols-outlined" aria-hidden="true">info</span>
          <div>
            <p>{notice.body}</p>
            {notice.strong ? <strong>{notice.strong}</strong> : null}
          </div>
        </article>
      ) : null}
    </aside>
  );
}
