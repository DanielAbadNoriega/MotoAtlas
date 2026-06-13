import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../features/auth';
import { createReviewWithAspects, type MotorcycleReviewRidingStyle } from '../../../services/motorcycleReviewService';
import type { Bike } from '../../../types/bike';
import { getMotorcycleTechnicalIcon } from '../../../shared/motorcycles/motorcycleTechnicalIcons';
import './ReviewModal.scss';

export type ReviewModalStatus = 'idle' | 'validation-error' | 'submitting' | 'success' | 'service-error';

type ReviewModalProps = {
  isOpen: boolean;
  motorcycle: Bike;
  onClose: () => void;
};

type ReviewValidationErrors = Partial<Record<'comment' | 'kilometers' | 'ownershipMonths' | 'rating' | 'ridingStyle', string>>;

const ASPECT_ID_TO_CATEGORY: Record<string, string> = {
  motor: 'engine',
  ergo: 'ergonomics',
  consumo: 'consumption',
  frenada: 'braking',
  suspension: 'suspension',
  electronica: 'electronics',
  aero: 'aerodynamics',
  pasajero: 'passenger',
  mantenimiento: 'maintenance',
  precio: 'price',
  peso: 'weight',
  diseno: 'design',
};

const ridingStyleOptions = [
  { label: 'Ciudad', value: 'ciudad' },
  { label: 'Viaje', value: 'viaje' },
  { label: 'Off-road', value: 'offroad' },
  { label: 'Deportivo', value: 'deportivo' },
  { label: 'Pasajero', value: 'pasajero' },
  { label: 'Diario', value: 'diario' },
] as const satisfies readonly { label: string; value: MotorcycleReviewRidingStyle }[];

const technicalAspects = [
  { id: 'motor', name: 'Motor', icon: getMotorcycleTechnicalIcon('engine'), category: 'engine' },
  { id: 'ergo', name: 'Ergonomía', icon: getMotorcycleTechnicalIcon('ergonomics'), category: 'ergonomics' },
  { id: 'consumo', name: 'Consumo', icon: getMotorcycleTechnicalIcon('consumption'), category: 'consumption' },
  { id: 'frenada', name: 'Frenada', icon: getMotorcycleTechnicalIcon('braking'), category: 'braking' },
  { id: 'suspension', name: 'Suspensión', icon: getMotorcycleTechnicalIcon('suspension'), category: 'suspension' },
  { id: 'electronica', name: 'Electrónica', icon: getMotorcycleTechnicalIcon('electronics'), category: 'electronics' },
  { id: 'aero', name: 'Aerodinámica', icon: getMotorcycleTechnicalIcon('aerodynamics'), category: 'aerodynamics' },
  { id: 'pasajero', name: 'Pasajero', icon: getMotorcycleTechnicalIcon('passenger'), category: 'passenger' },
  { id: 'mantenimiento', name: 'Mantenimiento', icon: getMotorcycleTechnicalIcon('maintenance'), category: 'maintenance' },
  { id: 'precio', name: 'Precio', icon: getMotorcycleTechnicalIcon('price'), category: 'price' },
  { id: 'peso', name: 'Peso', icon: getMotorcycleTechnicalIcon('weight'), category: 'weight' },
  { id: 'diseno', name: 'Diseño', icon: getMotorcycleTechnicalIcon('design'), category: 'design' },
] as const;

type AspectValue = 'positive' | 'negative' | null;

function parseOptionalPositiveNumber(value: FormDataEntryValue | null) {
  const rawValue = String(value ?? '').trim();

  if (!rawValue) {
    return null;
  }

  const normalizedValue = Number(rawValue.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(normalizedValue) ? normalizedValue : Number.NaN;
}

export function ReviewModal({ isOpen, motorcycle, onClose }: ReviewModalProps) {
  const { isAuthenticated, profile, session, user } = useAuth();
  const [rating, setRating] = useState(0);
  const [ridingStyle, setRidingStyle] = useState<MotorcycleReviewRidingStyle | ''>('');
  const [status, setStatus] = useState<ReviewModalStatus>('idle');
  const [errors, setErrors] = useState<ReviewValidationErrors>({});
  const [serviceError, setServiceError] = useState('');
  const [aspectValues, setAspectValues] = useState<Record<string, AspectValue>>({});
  const [aspectComments, setAspectComments] = useState<Record<string, string>>({});
  const [activeAspectComment, setActiveAspectComment] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = `review-modal-title-${motorcycle.id}`;

  const isSubmitting = status === 'submitting';
  const profileAlias = profile?.displayName?.trim() || 'Usuario MotoAtlas';
  const reviewAuthContext = isAuthenticated && user?.id && session?.access_token
    ? { accessToken: session.access_token, userId: user.id }
    : undefined;

  const resetModal = () => {
    setRating(0);
    setRidingStyle('');
    setStatus('idle');
    setErrors({});
    setServiceError('');
    setAspectValues({});
    setAspectComments({});
    setActiveAspectComment(null);
    formRef.current?.reset();
  };

  const toggleAspect = (aspectId: string, value: 'positive' | 'negative') => {
    setAspectValues((prev) => {
      const current = prev[aspectId];
      if (current === value) {
        const next = { ...prev };
        delete next[aspectId];
        return next;
      }
      return { ...prev, [aspectId]: value };
    });
  };

  const openAspectComment = (aspectId: string) => {
    setActiveAspectComment(aspectId);
  };

  const closeAspectComment = () => {
    setActiveAspectComment(null);
  };

  const saveAspectComment = (aspectId: string, comment: string) => {
    setAspectComments((prev) => ({ ...prev, [aspectId]: comment }));
    setActiveAspectComment(null);
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
        if (activeAspectComment) {
          event.stopPropagation();
          closeAspectComment();
        } else {
          requestClose();
        }
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
    const ownershipMonths = parseOptionalPositiveNumber(formData.get('ownership_months'));
    const kilometers = parseOptionalPositiveNumber(formData.get('kilometers'));

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

    if (!reviewAuthContext) {
      setStatus('service-error');
      setServiceError('Inicia sesión para escribir una review.');
      return;
    }

    setStatus('submitting');

    const aspectsToSend = technicalAspects
      .filter((aspect) => {
        const value = aspectValues[aspect.id];
        return value === 'positive' || value === 'negative';
      })
      .map((aspect) => ({
        category: aspect.category,
        sentiment: aspectValues[aspect.id] as 'positive' | 'negative',
        comment: aspectComments[aspect.id] || null,
      }));

    try {
      await createReviewWithAspects(
        {
          motorcycleId: motorcycle.id,
          userName: profileAlias,
          rating,
          ridingStyle,
          ownershipMonths: parseOptionalPositiveNumber(formData.get('ownership_months')),
          kilometers: parseOptionalPositiveNumber(formData.get('kilometers')),
          comment: String(formData.get('comment') ?? ''),
          pros: String(formData.get('pros') ?? '').split(/[\n,]/).map(s => s.trim()).filter(Boolean),
          cons: String(formData.get('cons') ?? '').split(/[\n,]/).map(s => s.trim()).filter(Boolean),
        },
        aspectsToSend,
        reviewAuthContext,
      );

      resetModal();
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
              <button className="review-modal__close-btn" type="button" onClick={requestClose}>
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <>
            <header className="review-modal__header">
              <button ref={closeButtonRef} className="review-modal__close" type="button" onClick={requestClose} aria-label="Cerrar modal de review">
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
              <div className="review-modal__header-content">
                <div className="review-modal__eyebrow">
                  <span className="review-modal__eyebrow-line" aria-hidden="true" />
                  <span className="review-modal__eyebrow-text">Technical registry // Owner feedback</span>
                </div>
                <div className="review-modal__title-group">
                  <h2 id={titleId}>Valoración técnica</h2>
                  <p>Desglosa tu experiencia con la moto de forma clara y útil para otros moteros.</p>
                </div>
              </div>
            </header>

            <form ref={formRef} className="review-modal__form" onSubmit={submitReview} noValidate>
              {status === 'validation-error' ? (
                <div className="review-modal__alert" role="alert">
                  <span className="material-symbols-outlined" aria-hidden="true">report</span>
                  <span>Revisa los campos obligatorios antes de enviar.</span>
                </div>
              ) : null}
              {status === 'service-error' ? (
                <div className="review-modal__alert review-modal__alert--service" role="alert">
                  <span className="material-symbols-outlined" aria-hidden="true">report</span>
                  <span>{serviceError || 'No se pudo enviar la review. Inténtalo de nuevo.'}</span>
                </div>
              ) : null}

              <div className="review-modal__alias-block">
                <div className="review-modal__alias-row">
                  <span className="review-modal__alias-text">@{profileAlias}</span>
                  {reviewAuthContext ? (
                    <span className="review-modal__account-badge">
                      <span className="material-symbols-outlined" aria-hidden="true">shield</span>
                      <span>Tu review quedará asociada a tu cuenta.</span>
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="review-modal__rating-block">
                <div className="review-modal__rating-header">
                  <h3 className="review-modal__rating-title">Valoración general</h3>
                  <p className="review-modal__rating-subtitle">Puntúa tu experiencia global con esta moto.</p>
                </div>
                <div className={errors.rating ? 'review-modal__stars review-modal__stars--error' : 'review-modal__stars'}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      aria-label={`${value} ${value === 1 ? 'estrella' : 'estrellas'} de 5`}
                      aria-pressed={rating >= value}
                      className={rating >= value ? 'review-modal__star review-modal__star--active' : 'review-modal__star'}
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">star</span>
                    </button>
                  ))}
                </div>
                {errors.rating ? <p className="review-modal__field-error">{errors.rating}</p> : null}
              </div>

              <div className="review-modal__aspect-grid">
                {technicalAspects.map((aspect) => {
                  const value = aspectValues[aspect.id];
                  const comment = aspectComments[aspect.id];
                  const isFlipping = activeAspectComment === aspect.id;
                  return (
                    <div
                      key={aspect.id}
                      className={[
                        'review-modal__aspect-card',
                        value === 'positive' ? 'review-modal__aspect-card--positive' : '',
                        value === 'negative' ? 'review-modal__aspect-card--negative' : '',
                        isFlipping ? 'review-modal__aspect-card--flipping' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <div className="review-modal__aspect-card-front">
                        <div className="review-modal__aspect-card-decoration" aria-hidden="true">
                          <span className="material-symbols-outlined">{aspect.icon}</span>
                        </div>
                        <div className="review-modal__aspect-card-content">
                          <div className="review-modal__aspect-card-header">
                            <span className="review-modal__aspect-card-dot" aria-hidden="true" />
                            <span className="review-modal__aspect-card-name">{aspect.name}</span>
                            {comment ? (
                              <span className="review-modal__aspect-card-has-comment" aria-hidden="true">
                                <span className="material-symbols-outlined">comment</span>
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="review-modal__aspect-card-actions">
                          <div className="review-modal__aspect-card-buttons">
                            <button
                              aria-label={`Marcar ${aspect.name} como punto fuerte`}
                              aria-pressed={value === 'positive'}
                              className={['review-modal__aspect-btn', value === 'positive' ? 'review-modal__aspect-btn--positive' : ''].filter(Boolean).join(' ')}
                              type="button"
                              onClick={() => toggleAspect(aspect.id, 'positive')}
                            >
                              <span className="material-symbols-outlined" aria-hidden="true">add</span>
                            </button>
                            <button
                              aria-label={`Marcar ${aspect.name} como aspecto mejorable`}
                              aria-pressed={value === 'negative'}
                              className={['review-modal__aspect-btn', value === 'negative' ? 'review-modal__aspect-btn--negative' : ''].filter(Boolean).join(' ')}
                              type="button"
                              onClick={() => toggleAspect(aspect.id, 'negative')}
                            >
                              <span className="material-symbols-outlined" aria-hidden="true">remove</span>
                            </button>
                            <button
                              aria-label={`Añadir matiz sobre ${aspect.name}`}
                              className={['review-modal__aspect-comment-btn', value ? 'review-modal__aspect-comment-btn--enabled' : ''].filter(Boolean).join(' ')}
                              disabled={!value}
                              type="button"
                              onClick={() => value && openAspectComment(aspect.id)}
                            >
                              <span className="material-symbols-outlined" aria-hidden="true">comment</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="review-modal__aspect-card-back">
                        <div className="review-modal__aspect-card-back-header">
                          <span className="review-modal__aspect-card-back-title">Matiz sobre {aspect.name}</span>
                        </div>
                        <textarea
                          aria-label={`Matiz sobre ${aspect.name}`}
                          className="review-modal__aspect-card-textarea"
                          maxLength={280}
                          placeholder="Añade un matiz breve sobre este punto..."
                          defaultValue={comment ?? ''}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              e.stopPropagation();
                              closeAspectComment();
                            }
                          }}
                        />
                        <div className="review-modal__aspect-card-back-actions">
                          <button
                            className="review-modal__aspect-card-back-cancel"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              closeAspectComment();
                            }}
                          >
                            <span className="material-symbols-outlined" aria-hidden="true">close</span>
                          </button>
                          <button
                            className="review-modal__aspect-card-back-save"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const textarea = (e.currentTarget.closest('.review-modal__aspect-card-back') as HTMLElement)?.querySelector('textarea');
                              saveAspectComment(aspect.id, textarea?.value ?? '');
                            }}
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="review-modal__aspect-card review-modal__usage-card">
                  <div className="review-modal__aspect-card-decoration" aria-hidden="true">
                    <span className="material-symbols-outlined">route</span>
                  </div>
                  <div className="review-modal__aspect-card-content">
                    <div className="review-modal__aspect-card-header">
                      <span className="review-modal__aspect-card-dot" aria-hidden="true" />
                      <span className="review-modal__aspect-card-name">Uso principal</span>
                    </div>
                  </div>
                  <div className="review-modal__aspect-card-actions">
                    <div className="review-modal__aspect-card-buttons" style={{ flexWrap: 'wrap' }}>
                      {ridingStyleOptions.map((option) => (
                        <button
                          aria-pressed={ridingStyle === option.value}
                          className={ridingStyle === option.value ? 'review-modal__usage-btn review-modal__usage-btn--active' : 'review-modal__usage-btn'}
                          key={option.value}
                          type="button"
                          onClick={() => setRidingStyle(option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {errors.ridingStyle ? <p className="review-modal__field-error">{errors.ridingStyle}</p> : null}

                <div className="review-modal__data-grid">
                  <div className="review-modal__data-section review-modal__data-section--metrics">
                    <div className="review-modal__metric">
                      <label className="review-modal__data-label" htmlFor="review-modal-ownership-months">Tiempo con la moto</label>
                      <input
                        id="review-modal-ownership-months"
                        name="ownership_months"
                        min="0"
                        placeholder="Ej. 15 meses"
                        type="number"
                      />
                      {errors.ownershipMonths ? <p className="review-modal__field-error">{errors.ownershipMonths}</p> : null}
                    </div>
                    <div className="review-modal__metric">
                      <label className="review-modal__data-label" htmlFor="review-modal-kilometers">Kilómetros</label>
                      <input
                        id="review-modal-kilometers"
                        name="kilometers"
                        min="0"
                        placeholder="Ej. 12500"
                        type="number"
                      />
                      {errors.kilometers ? <p className="review-modal__field-error">{errors.kilometers}</p> : null}
                    </div>
                  </div>

                  <div className="review-modal__proscons">
                    <div className="review-modal__proscons-field">
                      <label className="review-modal__data-label" htmlFor="review-modal-pros">Pros</label>
                      <textarea id="review-modal-pros" name="pros" placeholder="Puntos positivos, ergonomía, motor..." rows={2} />
                    </div>
                    <div className="review-modal__proscons-field">
                      <label className="review-modal__data-label" htmlFor="review-modal-cons">Contras</label>
                      <textarea id="review-modal-cons" name="cons" placeholder="Defectos, mantenimiento, consumo..." rows={2} />
                    </div>
                  </div>
                </div>

              <div className="review-modal__summary-notes">
                <div className="review-modal__summary-notes-header">
                  <span className="material-symbols-outlined review-modal__summary-notes-icon" aria-hidden="true">terminal</span>
                  <label className="review-modal__summary-notes-title" id="review-modal-comment-label">Tu experiencia</label>
                </div>
                <textarea
                  id="review-modal-comment"
                  name="comment"
                  aria-labelledby="review-modal-comment-label"
                  placeholder="Cuéntanos cómo se comporta la moto en uso real: sensaciones, fiabilidad, mantenimiento, viajes, ciudad o cualquier detalle útil para otros moteros..."
                  rows={4}
                />
                {errors.comment ? <p className="review-modal__field-error">{errors.comment}</p> : null}
              </div>

              <footer className="review-modal__footer">
                <button className="review-modal__submit-btn" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Registrar y continuar'}
                  {!isSubmitting && <span className="material-symbols-outlined review-modal__submit-icon" aria-hidden="true">arrow_right_alt</span>}
                </button>
                <button className="review-modal__cancel-btn" type="button" onClick={requestClose} disabled={isSubmitting}>
                  Cancelar
                </button>
              </footer>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
