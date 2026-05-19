import { useState } from 'react';
import accountHeroImage from '../../../assets/hero-metodology.png';
import { useAuth } from '../../../features/auth';
import './AccountPage.scss';

function getProfileName(profileName: string | null | undefined, email: string | undefined) {
  return profileName?.trim() || email || 'Usuario MotoAtlas';
}

export function AccountPage() {
  const { isAuthenticated, isLoading, profile, signOut, user } = useAuth();
  const [error, setError] = useState('');
  const displayName = getProfileName(profile?.displayName, user?.email);
  const email = user?.email ?? 'Email no disponible';

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
        <section className="account-page__hero account-page__hero--empty" role="status">
          <img className="account-page__hero-image" src={accountHeroImage} alt="" aria-hidden="true" />
          <div className="account-page__hero-content">
            <span className="account-page__eyebrow">Mi cuenta</span>
            <h1 id="account-page-title">Cargando sesión...</h1>
          </div>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="account-page" aria-labelledby="account-page-title">
        <section className="account-page__hero account-page__hero--empty">
          <img className="account-page__hero-image" src={accountHeroImage} alt="" aria-hidden="true" />
          <div className="account-page__hero-content">
            <span className="account-page__eyebrow">Acceso privado</span>
            <h1 id="account-page-title">Inicia sesión para ver Mi cuenta</h1>
            <p>Tu panel personal guardará futuras reviews, solicitudes de modelo y preferencias.</p>
            <a className="account-page__button" href="#/login">Iniciar sesión</a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="account-page" aria-labelledby="account-page-title">
      <section className="account-page__hero">
        <img className="account-page__hero-image" src={accountHeroImage} alt="" aria-hidden="true" />
        <div className="account-page__hero-content">
          <div>
            <span className="account-page__eyebrow">Usuario</span>
            <h1 id="account-page-title">{displayName}</h1>
            <p>Panel de control de ingeniería personal. Gestiona tus especificaciones y reviews asociadas.</p>
          </div>
          <a className="account-page__button account-page__button--ghost" href="#/cuenta">
            <span className="material-symbols-outlined" aria-hidden="true">edit</span>
            Editar perfil
          </a>
        </div>
      </section>

      {error ? <p className="account-page__alert" role="alert">{error}</p> : null}

      <section className="account-page__dashboard" aria-label="Panel de cuenta">
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
              <button className="account-page__button account-page__button--glass" type="button" onClick={handleSignOut}>
                <span className="material-symbols-outlined" aria-hidden="true">logout</span>
                Cerrar sesión
              </button>
            </div>
          </article>

          <article className="account-page__notice">
            <span className="material-symbols-outlined" aria-hidden="true">info</span>
            <div>
              <p>Cuando envíes una review con sesión iniciada, quedará asociada a tu cuenta automáticamente.</p>
              <strong>Tu alias seguirá siendo el nombre visible para otros usuarios.</strong>
            </div>
          </article>
        </aside>

        <div className="account-page__main">
          <section className="account-page__section" aria-labelledby="account-reviews-title">
            <header className="account-page__section-header">
              <h2 id="account-reviews-title">
                <span className="material-symbols-outlined" aria-hidden="true">rate_review</span>
                Mis reviews
              </h2>
              <span>Total: 0</span>
            </header>
            <article className="account-page__empty-state">
              <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">history</span>
              <h3>Aún no has enviado reviews.</h3>
              <p>Tus aportes técnicos sobre modelos específicos aparecerán aquí una vez que los valides.</p>
            </article>
          </section>

          <section className="account-page__section" aria-labelledby="account-requests-title">
            <header className="account-page__section-header">
              <h2 id="account-requests-title">
                <span className="material-symbols-outlined" aria-hidden="true">analytics</span>
                Mis solicitudes
              </h2>
              <span>Pendientes: 0</span>
            </header>
            <article className="account-page__empty-state">
              <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">add_chart</span>
              <h3>Aún no has solicitado modelos.</h3>
              <p>¿No encuentras una moto? Solicita su ficha técnica y aparecerá en tu radar.</p>
              <a className="account-page__button" href="#/solicitar-modelo">Solicitar telemetría</a>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
