import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../../features/auth';
import './AuthPage.scss';

type AuthPageMode = 'login' | 'register';

type FormErrors = Partial<Record<'displayName' | 'email' | 'password' | 'confirmPassword', string>>;

type AuthPageProps = Readonly<{
  mode: AuthPageMode;
}>;

function getInitialForm() {
  return {
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  };
}

function validateForm(mode: AuthPageMode, form: ReturnType<typeof getInitialForm>) {
  const errors: FormErrors = {};

  if (mode === 'register' && !form.displayName.trim()) {
    errors.displayName = 'El alias es obligatorio.';
  }

  if (!form.email.trim()) {
    errors.email = 'El email es obligatorio.';
  }

  if (!form.password.trim()) {
    errors.password = 'La contraseña es obligatoria.';
  }

  if (mode === 'register' && form.password.length > 0 && form.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres.';
  }

  if (mode === 'register' && form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  return errors;
}

export function AuthPage({ mode }: AuthPageProps) {
  const { isAuthenticated, isLoading, signIn, signUp } = useAuth();
  const [form, setForm] = useState(getInitialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serviceError, setServiceError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const isRegister = mode === 'register';

  useEffect(() => {
    setErrors({});
    setServiceError('');
    setSuccessMessage('');
  }, [mode]);

  const updateField = (field: keyof ReturnType<typeof getInitialForm>, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateForm(mode, form);
    setErrors(nextErrors);
    setServiceError('');
    setSuccessMessage('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegister) {
        await signUp({ displayName: form.displayName, email: form.email, password: form.password });
        setSuccessMessage('Cuenta creada. Revisa tu email si Supabase requiere confirmación antes de iniciar sesión.');
      } else {
        await signIn({ email: form.email, password: form.password });
        setSuccessMessage('Sesión iniciada. Redirigiendo a Mi cuenta.');
        window.location.hash = '#/cuenta';
      }
    } catch (error) {
      setServiceError(error instanceof Error ? error.message : 'No se ha podido completar la autenticación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="auth-page" aria-labelledby="auth-page-title">
        <section className="auth-page__panel" role="status">
          <span className="auth-page__eyebrow">Auth link</span>
          <h1 id="auth-page-title">Comprobando sesión...</h1>
        </section>
      </main>
    );
  }

  if (isAuthenticated && !successMessage) {
    return (
      <main className="auth-page" aria-labelledby="auth-page-title">
        <section className="auth-page__panel auth-page__panel--success">
          <span className="auth-page__eyebrow">Sesión activa</span>
          <h1 id="auth-page-title">Ya has iniciado sesión</h1>
          <p>Tu cuenta de MotoAtlas está conectada.</p>
          <a className="auth-page__primary" href="#/cuenta">Ir a Mi cuenta</a>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page" aria-labelledby="auth-page-title">
      <section className="auth-page__panel">
        <div className="auth-page__intro">
          <span className="auth-page__eyebrow">MotoAtlas Auth</span>
          <h1 id="auth-page-title">{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
          <p>
            {isRegister
              ? 'Crea tu cuenta para preparar futuras reviews asociadas y solicitudes de modelos.'
              : 'Accede para gestionar tus reviews y futuras aportaciones.'}
          </p>
        </div>

        {(serviceError || Object.keys(errors).length > 0) && !successMessage ? (
          <div className="auth-page__alert" role="alert">
            {serviceError || 'Revisa los campos obligatorios antes de continuar.'}
          </div>
        ) : null}

        {successMessage ? (
          <div className="auth-page__success" role="status">
            <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
            <p>{successMessage}</p>
            <a href="#/cuenta">Ir a Mi cuenta</a>
          </div>
        ) : null}

        <form className="auth-page__form" onSubmit={handleSubmit} noValidate>
          {isRegister ? (
            <label htmlFor="auth-display-name">
              Alias
              <input
                id="auth-display-name"
                name="display_name"
                type="text"
                value={form.displayName}
                onChange={(event) => updateField('displayName', event.target.value)}
                placeholder="RIDER_01"
                aria-invalid={Boolean(errors.displayName)}
              />
              {errors.displayName ? <span>{errors.displayName}</span> : <small>Tu alias podrá mostrarse junto a tus reviews.</small>}
            </label>
          ) : null}

          <label htmlFor="auth-email">
            Email
            <input
              id="auth-email"
              name="email"
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="user@motoatlas.tech"
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email ? <span>{errors.email}</span> : null}
          </label>

          <label htmlFor="auth-password">
            Contraseña
            <input
              id="auth-password"
              name="password"
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              placeholder="••••••••"
              aria-invalid={Boolean(errors.password)}
            />
            {errors.password ? <span>{errors.password}</span> : null}
          </label>

          {isRegister ? (
            <label htmlFor="auth-confirm-password">
              Confirmar contraseña
              <input
                id="auth-confirm-password"
                name="confirm_password"
                type="password"
                value={form.confirmPassword}
                onChange={(event) => updateField('confirmPassword', event.target.value)}
                placeholder="••••••••"
                aria-invalid={Boolean(errors.confirmPassword)}
              />
              {errors.confirmPassword ? <span>{errors.confirmPassword}</span> : null}
            </label>
          ) : null}

          <button className="auth-page__primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Estableciendo enlace...' : isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="auth-page__switch">
          {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
          <a href={isRegister ? '#/login' : '#/registro'}>{isRegister ? 'Iniciar sesión' : 'Crear cuenta'}</a>
        </p>
      </section>
    </main>
  );
}
