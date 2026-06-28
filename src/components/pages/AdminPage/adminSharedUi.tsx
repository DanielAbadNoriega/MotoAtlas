import { useCallback, useState, type ChangeEvent, type ReactNode } from 'react';
import { useAuth } from '../../../features/auth';
import { canUseDemoData, isDemoDataToggleAvailable, setDemoDataPreference } from '../../../shared/env/runtimeEnvironment';
import type { MotorcycleReviewStatus } from '../../../services/motorcycleReviewService';
import { AccountQuickLinksNav, type AdminQuickLinksModelsItem } from '../AccountPage/AccountQuickLinksNav';
import { reviewStatusLabels } from './adminPageConstants';

type AdminGateProps = Readonly<{
  children: ReactNode;
  title?: string;
}>;

type AdminSidebarActiveItem = 'dashboard' | 'moderation' | 'reviews' | 'requests' | 'models';

function AdminState({ children, title }: Readonly<{ children: ReactNode; title: string }>) {
  return (
    <main className="account-page admin-page" aria-labelledby="admin-state-title">
      <section className="account-page__empty-state">
        <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">admin_panel_settings</span>
        <h1 id="admin-state-title">{title}</h1>
        {children}
      </section>
    </main>
  );
}

export function AdminGate({ children }: AdminGateProps) {
  const { isAdmin, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AdminState title="Cargando panel admin...">
        <p>Comprobando permisos de administración.</p>
      </AdminState>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminState title="Inicia sesión para acceder al panel admin">
        <p>Necesitás una sesión de administrador para revisar reportes.</p>
        <a className="account-page__button" href="#/login">Iniciar sesión</a>
      </AdminState>
    );
  }

  if (!isAdmin) {
    return (
      <AdminState title="No tienes permisos para acceder a esta zona.">
        <p>Esta sección está reservada para perfiles con rol admin.</p>
      </AdminState>
    );
  }

  return children;
}

export function AdminSidebar({
  active,
  activeModelsItem,
  children,
}: Readonly<{
  active: AdminSidebarActiveItem;
  activeModelsItem?: AdminQuickLinksModelsItem;
  children?: ReactNode;
}>) {
  return (
    <aside className="account-page__sidebar admin-page__sidebar" aria-label="Navegación admin">
      <article className="account-page__notice admin-page__notice">
        <span className="material-symbols-outlined" aria-hidden="true">shield_person</span>
        <div>
          <p>Zona privada de administración.</p>
          <strong>Las acciones quedan protegidas por rol admin y RLS.</strong>
        </div>
      </article>

      <AccountQuickLinksNav
        activeAdminItem={active}
        activeAdminModelsItem={activeModelsItem}
        ariaLabel="Navegación de administración"
        includeAdmin
      />
      {children}
    </aside>
  );
}

export function AdminDemoDataToggle() {
  const toggleAvailable = isDemoDataToggleAvailable();
  const [includeDemoData, setIncludeDemoData] = useState(() => canUseDemoData());

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.checked;
    setDemoDataPreference(nextValue);
    setIncludeDemoData(nextValue);
  }, []);

  if (!toggleAvailable) {
    return null;
  }

  return (
    <article className="account-page__notice admin-page__notice admin-page__demo-data-toggle">
      <span className="material-symbols-outlined" aria-hidden="true">science</span>
      <div className="admin-page__demo-data-content">
        <strong>Datos demo</strong>
        <p>Solo disponible en development/preview. En producción nunca habilita datos demo.</p>
        <label className="admin-page__demo-data-control" htmlFor="admin-demo-data-toggle">
          <input
            id="admin-demo-data-toggle"
            type="checkbox"
            checked={includeDemoData}
            onChange={handleChange}
          />
          <span>Incluir datos demo</span>
        </label>
        <small className="admin-page__demo-data-caption">El cambio se guarda en este navegador y afecta nuevas consultas o navegación.</small>
      </div>
    </article>
  );
}

export function ReviewStatusBadge({ status }: Readonly<{ status: MotorcycleReviewStatus }>) {
  return <span className="admin-page__status-pill admin-page__status-pill--review" data-status={status}>{reviewStatusLabels[status]}</span>;
}
