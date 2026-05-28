import type { ReviewReportFormProps, ReviewReportReason } from './ReviewCommunityActions.types';

const reviewReportReasonOptions = [
  { label: 'Spam', value: 'spam' },
  { label: 'Ofensivo', value: 'offensive' },
  { label: 'Información falsa', value: 'false_information' },
  { label: 'Acoso', value: 'harassment' },
  { label: 'Otro', value: 'other' },
] as const;

export function ReviewReportForm({
  comment,
  isSubmitting,
  onCancel,
  onCommentChange,
  onReasonChange,
  onSubmit,
  reason,
  reviewId,
}: ReviewReportFormProps) {
  return (
    <form
      className="motorcycle-community__report-panel"
      aria-label="Reportar review"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <fieldset>
        <legend>Motivo</legend>
        <div className="motorcycle-community__report-reasons">
          {reviewReportReasonOptions.map((option) => (
            <label key={option.value}>
              <input
                type="radio"
                name={`review-report-reason-${reviewId}`}
                value={option.value}
                checked={reason === option.value}
                disabled={isSubmitting}
                onChange={() => onReasonChange(option.value as ReviewReportReason)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="motorcycle-community__report-comment">
        <span>Comentario opcional</span>
        <textarea
          value={comment}
          placeholder="Añade contexto si lo necesitas"
          rows={3}
          disabled={isSubmitting}
          onChange={(event) => onCommentChange(event.target.value)}
        />
      </label>

      <div className="motorcycle-community__report-actions">
        <button type="button" disabled={isSubmitting} onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando…' : 'Enviar reporte'}
        </button>
      </div>
    </form>
  );
}
