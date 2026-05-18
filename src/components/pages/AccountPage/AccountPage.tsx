import { useState } from 'react';
import { useAuth } from '../../../features/auth';
import './AccountPage.scss';

function getProfileName(profileName: string | null | undefined, email: string | undefined) {
  return profileName?.trim() || email || 'Usuario MotoAtlas';
}

function getRoleLabel(role: string | undefined) {
  return role === 'admin' ? 'Administrador' : 'Usuario';
}

export function AccountPage() {
  const { isAuthenticated, isLoading, profile, signOut, user } = useAuth();
  const [error, setError] = useState('');
  const displayName = getProfileName(profile?.displayName, user?.email);

  const handleSignOut = async () => {
    setError('');

    try {
      await signOut();
      window.location.hash = '#/';
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'No se ha podido cerrar sesión.');
    }
  };

  if (isLoading) {
    return (
      <main className="account-page" aria-labelledby="account-page-title">
        <section className="account-page__hero" role="status">
          <span>Mi cuenta</span>
          <h1 id="account-page-title">Cargando sesión...</h1>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="account-page" aria-labelledby="account-page-title">
        <section className="account-page__hero account-page__hero--empty">
          <span>Acceso privado</span>
          <h1 id="account-page-title">Inicia sesión para ver Mi cuenta</h1>
          <p>Tu panel personal guardará futuras reviews, solicitudes de modelo y preferencias.</p>
          <a className="account-page__button" href="#/login">Iniciar sesión</a>
        </section>
      </main>
    );
  }

  return (
    <main className="account-page" aria-labelledby="account-page-title">
      <section className="account-page__hero">
        <div>
          <span>Authenticated</span>
          <h1 id="account-page-title">{displayName}</h1>
          <p>Panel personal de MotoAtlas. Gestiona tu identidad y prepara futuras aportaciones.</p>
        </div>
        <button className="account-page__button account-page__button--ghost" type="button" onClick={handleSignOut}>
          Cerrar sesión
        </button>
      </section>

      {error ? <p className="account-page__alert" role="alert">{error}</p> : null}

      <section className="account-page__grid" aria-label="Datos de cuenta">
        <article className="account-page__card">
          <span className="material-symbols-outlined" aria-hidden="true">settings_input_component</span>
          <h2>Identidad</h2>
          <dl>
            <div>
              <dt>Alias</dt>
              <dd>{displayName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>Rol</dt>
              <dd>{getRoleLabel(profile?.role)}</dd>
            </div>
          </dl>
        </article>

        <article className="account-page__card account-page__card--placeholder">
          <span className="account-page__counter">Total: 0</span>
          <h2>Mis reviews</h2>
          <p>Aún no has enviado reviews asociadas a tu cuenta.</p>
          <small>Cuando conectemos reviews con usuarios, aparecerán aquí.</small>
        </article>

        <article className="account-page__card account-page__card--placeholder">
          <span className="account-page__counter">Pendientes: 0</span>
          <h2>Mis solicitudes</h2>
          <p>Las solicitudes de modelos todavía no se guardan en backend.</p>
          <a href="#/solicitar-modelo">Solicitar modelo</a>
        </article>
      </section>
    </main>
  );
}
