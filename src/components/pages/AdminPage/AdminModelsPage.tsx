import { AdminModelsWorkspace } from './AdminModelsWorkspace';

export function AdminModelsPage() {
  return (
    <AdminModelsWorkspace
      activeModelsItem="overview"
      description="Gestiona las fichas técnicas del catálogo MotoAtlas."
      title="Estudio de modelos"
      titleId="admin-models-title"
    >
      <section className="admin-page__dashboard-grid" aria-labelledby="admin-models-cards-title">
        <article className="account-page__card admin-page__summary-card">
          <span className="material-symbols-outlined" aria-hidden="true">precision_manufacturing</span>
          <h2 id="admin-models-cards-title">Workspace futuro</h2>
          <p>Este hub reúne los accesos iniciales para preparar el alta y la edición del catálogo sin activar todavía formularios, búsqueda ni persistencia.</p>
        </article>
        <article className="account-page__card admin-page__summary-card admin-page__summary-card--muted">
          <span className="material-symbols-outlined" aria-hidden="true">add_circle</span>
          <h2>Nuevo modelo</h2>
          <p>Aquí arrancará el futuro flujo de alta interna del catálogo.</p>
          <a className="account-page__button account-page__button--glass" href="#/admin/modelos/nuevo">Abrir placeholder</a>
        </article>
        <article className="account-page__card admin-page__summary-card">
          <span className="material-symbols-outlined" aria-hidden="true">edit_note</span>
          <h2>Editar modelo existente</h2>
          <p>Busca y selecciona una moto del catálogo para abrir su ficha interna de edición.</p>
          <a className="account-page__button account-page__button--glass" href="#/admin/modelos/editar">Seleccionar modelo</a>
        </article>
      </section>
    </AdminModelsWorkspace>
  );
}
