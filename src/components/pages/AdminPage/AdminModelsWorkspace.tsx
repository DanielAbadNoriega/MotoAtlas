import { type ReactNode } from 'react';
import { useAuth } from '../../../features/auth';
import adminHeroImage from '../../../assets/hero-admin.png';
import { PageHero } from '../../ui/PageHero';
import { AdminGate, AdminSidebar, AdminDemoDataToggle } from './adminSharedUi';
import { getDisplayName } from './adminPageUtils';
import { type AdminQuickLinksModelsItem } from '../AccountPage/AccountQuickLinksNav';

export function AdminModelsWorkspace({
  activeModelsItem,
  children,
  description,
  sidebarContent,
  title,
  titleId,
}: Readonly<{
  activeModelsItem: AdminQuickLinksModelsItem;
  children: ReactNode;
  description: string;
  sidebarContent?: ReactNode;
  title: string;
  titleId: string;
}>) {
  const { profile, user } = useAuth();

  return (
    <AdminGate>
      <PageHero
        className="admin-page__community-hero admin-page__hero"
        titleId={titleId}
        imageSrc={adminHeroImage}
        eyebrow="ADMIN STUDIO"
        title={title}
        description={description}
      >
        <div className="admin-page__hero-meta">
          <div className="admin-page__admin-chip" aria-label="Administrador activo">
            <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
            {getDisplayName(profile?.displayName, user?.email)}
          </div>
        </div>
      </PageHero>

      <main className="account-page admin-page" aria-labelledby={titleId}>
        <section className="account-page__dashboard admin-page__layout">
          <AdminSidebar active="models" activeModelsItem={activeModelsItem}>
            {sidebarContent}
            <AdminDemoDataToggle />
          </AdminSidebar>
          <div className="account-page__main">{children}</div>
        </section>
      </main>
    </AdminGate>
  );
}
