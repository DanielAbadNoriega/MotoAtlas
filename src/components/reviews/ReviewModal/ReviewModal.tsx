import { type FormEvent, useEffect, useRef, useState } from 'react';
import { getBikeDisplayName } from '../../../data/bikes';
import { useAuth } from '../../../features/auth';
import { createReview, type MotorcycleReviewRidingStyle } from '../../../services/motorcycleReviewService';
import { segmentLabels } from '../../../shared/motorcycles/motorcycleTaxonomy';
import type { Bike } from '../../../types/bike';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import './ReviewModal.scss';

export type ReviewModalStatus = 'idle' | 'validation-error' | 'submitting' | 'success' | 'service-error';

type ReviewModalProps = {
  isOpen: boolean;
  motorcycle: Bike;
  onClose: () => void;
};

type ReviewValidationErrors = Partial<Record<'comment' | 'kilometers' | 'ownershipMonths' | 'rating' | 'ridingStyle' | 'userName', string>>;

const ridingStyleOptions = [
  { label: 'Ciudad', value: 'ciudad' },
  { label: 'Viaje', value: 'viaje' },
  { label: 'Off-road', value: 'offroad' },
  { label: 'Deportivo', value: 'deportivo' },
  { label: 'Pasajero', value: 'pasajero' },
  { label: 'Diario', value: 'diario' },
] as const satisfies readonly { label: string; value: MotorcycleReviewRidingStyle }[];

function splitReviewList(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOptionalPositiveNumber(value: FormDataEntryValue | null) {
  const rawValue = String(value ?? '').trim();

  if (!rawValue) {
    return null;
  }

  const normalizedValue = Number(rawValue.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(normalizedValue) ? normalizedValue : Number.NaN;
}

function getFieldClass(hasError: boolean) {
  return hasError ? 'review-modal__field review-modal__field--error' : 'review-modal__field';
}

export function ReviewModal({ isOpen, motorcycle, onClose }: ReviewModalProps) {
  const { isAuthenticated, profile, session, user } = useAuth();
  const [rating, setRating] = useState(0);
  const [ridingStyle, setRidingStyle] = useState<MotorcycleReviewRidingStyle | ''>('');
  const [status, setStatus] = useState<ReviewModalStatus>('idle');
  const [errors, setErrors] = useState<ReviewValidationErrors>({});
  const [serviceError, setServiceError] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = `review-modal-title-${motorcycle.id}`;

  const isSubmitting = status === 'submitting';
  const bikeName = getBikeDisplayName(motorcycle);
  const profileAlias = profile?.displayName?.trim() ?? '';
  const reviewAuthContext = isAuthenticated && user?.id && session?.access_token
    ? { accessToken: session.access_token, userId: user.id }
    : undefined;

  const resetModal = () => {
    setRating(0);
    setRidingStyle('');
    setStatus('idle');
    setErrors({});
    setServiceError('');
    formRef.current?.reset();
  };

  const requestClose = () => {
    if (isSubmitting) {
      return;
    }

    resetModal();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        requestClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting]);

  if (!isOpen) {
    return null;
  }

  const validate = (formData: FormData): ReviewValidationErrors => {
    const nextErrors: ReviewValidationErrors = {};
    const userName = String(formData.get('user_name') ?? '').trim();
    const ownershipMonths = parseOptionalPositiveNumber(formData.get('ownership_months'));
    const kilometers = parseOptionalPositiveNumber(formData.get('kilometers'));

    if (!userName) {
      nextErrors.userName = 'El alias es obligatorio.';
    }

    if (rating < 1 || rating > 5) {
      nextErrors.rating = 'La valoración es obligatoria.';
    }

    if (!ridingStyle) {
      nextErrors.ridingStyle = 'El uso principal es obligatorio.';
    }

    if (!String(formData.get('comment') ?? '').trim()) {
      nextErrors.comment = 'Por favor, escribe un comentario.';
    }

    if (ownershipMonths !== null && (!Number.isFinite(ownershipMonths) || ownershipMonths < 0)) {
      nextErrors.ownershipMonths = 'Debe ser un número mayor o igual que 0.';
    }

    if (kilometers !== null && (!Number.isFinite(kilometers) || kilometers < 0)) {
      nextErrors.kilometers = 'Debe ser un número mayor o igual que 0.';
    }

    return nextErrors;
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextErrors = validate(formData);

    setErrors(nextErrors);
    setServiceError('');

    if (Object.keys(nextErrors).length > 0 || !ridingStyle) {
      setStatus('validation-error');
      return;
    }

    setStatus('submitting');

    try {
      await createReview(
        {
          motorcycleId: motorcycle.id,
          userName: String(formData.get('user_name') ?? '').trim(),
          rating,
          ridingStyle,
          ownershipMonths: parseOptionalPositiveNumber(formData.get('ownership_months')),
          kilometers: parseOptionalPositiveNumber(formData.get('kilometers')),
          comment: String(formData.get('comment') ?? ''),
          pros: splitReviewList(formData.get('pros')),
          cons: splitReviewList(formData.get('cons')),
        },
        reviewAuthContext,
      );
      setStatus('success');
      setErrors({});
      formRef.current?.reset();
    } catch (error) {
      setStatus('service-error');
      setServiceError(error instanceof Error ? error.message : 'No se pudo enviar la review. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="review-modal" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        requestClose();
      }
    }}>
      <section className="review-modal__dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        {status === 'success' ? (
          <div className="review-modal__success">
            <div className="review-modal__accent" />
            <div className="review-modal__success-content">
              <div className="review-modal__success-icon" aria-hidden="true">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <h2 id={titleId}>Review enviada</h2>
              <p>Gracias. Tu opinión se revisará antes de publicarse.</p>
              <div className="review-modal__success-meta" aria-hidden="true">
                <span />
                <small>Review pendiente de moderación</small>
                <span />
              </div>
              <button className="review-modal__secondary-action" type="button" onClick={requestClose}>
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <>
            <header className="review-modal__header">
              <div>
                <h2 id={titleId}>Comparte tu experiencia real</h2>
                <p>Tu opinión ayudará a otros motoristas a elegir mejor.</p>
              </div>
              <button ref={closeButtonRef} className="review-modal__close" type="button" onClick={requestClose} aria-label="Cerrar modal de review">
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </header>

            <form ref={formRef} className="review-modal__form" onSubmit={submitReview} noValidate>
              {status === 'validation-error' ? (
                <div className="review-modal__alert" role="alert">
                  <span className="material-symbols-outlined" aria-hidden="true">report</span>
                  <span>Revisa los campos obligatorios antes de enviar.</span>
                </div>
              ) : null}
              {status === 'service-error' ? (
                <div className="review-modal__alert" role="alert">
                  <span className="material-symbols-outlined" aria-hidden="true">report</span>
                  <span>{serviceError || 'No se pudo enviar la review. Inténtalo de nuevo.'}</span>
                </div>
              ) : null}

              <div className="review-modal__context-card">
                <div className="review-modal__thumb">
                  <MotorcycleImage motorcycle={motorcycle} decorative />
                </div>
                <div>
                  <div>
                    <span>{segmentLabels[motorcycle.segment]}</span>
                    <small>MY {motorcycle.year}</small>
                  </div>
                  <strong>{bikeName}</strong>
                </div>
              </div>

              <label className={getFieldClass(Boolean(errors.userName))} htmlFor="review-modal-user-name">
                <span>Alias</span>
                <input id="review-modal-user-name" name="user_name" autoComplete="nickname" defaultValue={profileAlias} placeholder="Ej. MoteroViajero" type="text" />
                {errors.userName ? <small>{errors.userName}</small> : null}
              </label>
              {reviewAuthContext ? (
                <p className="review-modal__account-note">Tu review quedará asociada a tu cuenta. Tu alias será el nombre visible.</p>
              ) : null}

              <fieldset className={errors.rating ? 'review-modal__rating review-modal__rating--error' : 'review-modal__rating'}>
                <legend>Valoración general</legend>
                <div>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      aria-label={`Valorar ${value} de 5`}
                      aria-pressed={rating >= value}
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">star</span>
                    </button>
                  ))}
                </div>
                {errors.rating ? <p>{errors.rating}</p> : null}
              </fieldset>

              <div className="review-modal__grid">
                <label className={getFieldClass(Boolean(errors.ownershipMonths))} htmlFor="review-modal-ownership-months">
                  <span>Tiempo con la moto (meses)</span>
                  <input id="review-modal-ownership-months" name="ownership_months" min="0" placeholder="Ej. 15 meses" type="number" />
                  {errors.ownershipMonths ? <small>{errors.ownershipMonths}</small> : null}
                </label>
                <label className={getFieldClass(Boolean(errors.kilometers))} htmlFor="review-modal-kilometers">
                  <span>Kilómetros recorridos</span>
                  <input id="review-modal-kilometers" name="kilometers" min="0" placeholder="Ej: 12500" type="number" />
                  {errors.kilometers ? <small>{errors.kilometers}</small> : null}
                </label>
              </div>

              <fieldset className={errors.ridingStyle ? 'review-modal__usage review-modal__usage--error' : 'review-modal__usage'}>
                <legend>Uso principal</legend>
                <div>
                  {ridingStyleOptions.map((option) => (
                    <button
                      aria-pressed={ridingStyle === option.value}
                      className={ridingStyle === option.value ? 'review-modal__usage-option review-modal__usage-option--active' : 'review-modal__usage-option'}
                      key={option.value}
                      type="button"
                      onClick={() => setRidingStyle(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {errors.ridingStyle ? <p>{errors.ridingStyle}</p> : null}
              </fieldset>

              <div className="review-modal__grid">
                <label className="review-modal__field" htmlFor="review-modal-pros">
                  <span>Lo mejor</span>
                  <textarea id="review-modal-pros" name="pros" placeholder="Puntos positivos, ergonomía, motor..." rows={3} />
                </label>
                <label className="review-modal__field" htmlFor="review-modal-cons">
                  <span>Lo peor</span>
                  <textarea id="review-modal-cons" name="cons" placeholder="Defectos, mantenimiento, consumo..." rows={3} />
                </label>
              </div>

              <label className={getFieldClass(Boolean(errors.comment))} htmlFor="review-modal-comment">
                <span>Comentario detallado</span>
                <textarea id="review-modal-comment" name="comment" placeholder="Cuéntanos con detalle tu experiencia tras estos kilómetros..." rows={5} />
                {errors.comment ? <small>{errors.comment}</small> : null}
              </label>

              <footer className="review-modal__footer">
                <button className="review-modal__secondary-action" type="button" onClick={requestClose} disabled={isSubmitting}>
                  Cancelar
                </button>
                <button className="review-modal__primary-action" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Enviar review'}
                </button>
              </footer>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
