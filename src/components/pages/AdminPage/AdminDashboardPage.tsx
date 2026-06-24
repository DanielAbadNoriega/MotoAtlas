import { useAuth } from '../../../features/auth';
import adminHeroImage from '../../../assets/hero-admin.png';
import { PageHero } from '../../ui/PageHero';
import { AdminGate, AdminSidebar, AdminDemoDataToggle } from './adminSharedUi';
import { getDisplayName } from './adminPageUtils';

export function AdminDashboardPage() {
  const { profile, user } = useAuth();

  return (
    <AdminGate>
      <PageHero
        className="admin-page__community-hero admin-page__hero"
        titleId="admin-dashboard-title"
        imageSrc={adminHeroImage}
        eyebrow="ADMIN STUDIO"
        title="Panel de administración"
        description="Gestiona la actividad crítica de MotoAtlas desde un espacio privado."
      >
        <div className="admin-page__hero-meta">
          <div className="admin-page__admin-chip" aria-label="Administrador activo">
            <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
            {getDisplayName(profile?.displayName, user?.email)}
          </div>
        </div>
      </PageHero>

      <main className="account-page admin-page" aria-labelledby="admin-dashboard-title">
        <section className="account-page__dashboard">
          <AdminSidebar active="dashboard">
            <AdminDemoDataToggle />
          </AdminSidebar>
          <div className="account-page__main">
            <section className="admin-page__dashboard-grid" aria-labelledby="admin-dashboard-cards-title">
              <article className="account-page__card admin-page__summary-card">
                <span className="material-symbols-outlined" aria-hidden="true">flag</span>
                <h2 id="admin-dashboard-cards-title">Reportes pendientes</h2>
                <p>Revisa reportes de reviews, actualiza su estado y actúa sobre la review si corresponde.</p>
                <a className="account-page__button" href="#/admin/moderacion">Ir a moderación</a>
              </article>
              <article className="account-page__card admin-page__summary-card admin-page__summary-card--muted">
                <span className="material-symbols-outlined" aria-hidden="true">rate_review</span>
                <h2>Reviews pendientes</h2>
                <p>Garaje admin agrupado por moto para revisar reviews de la comunidad.</p>
                <a className="account-page__button account-page__button--glass" href="#/admin/reviews">Ir a reviews</a>
              </article>
              <article className="account-page__card admin-page__summary-card admin-page__summary-card--muted">
                <span className="material-symbols-outlined" aria-hidden="true">fact_check</span>
                <h2>Solicitudes pendientes</h2>
                <p>Gestiona las solicitudes de nuevos modelos enviadas por la comunidad.</p>
                <a className="account-page__button account-page__button--glass" href="#/admin/solicitudes">Ir a solicitudes</a>
              </article>
            </section>
          </div>
        </section>
      </main>
    </AdminGate>
  );
}
