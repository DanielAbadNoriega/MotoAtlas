import { MotoIcon } from '../../../shared/ui/icons/MotoIcon';

export function ReplyConvivenceNotice() {
  const tooltipId = 'reply-convivence-tooltip';

  return (
    <div
      className="motorcycle-community__convivence-notice"
      role="group"
      aria-label="Normas de convivencia"
    >
      <button
        type="button"
        className="motorcycle-community__convivence-trigger"
        aria-label="Normas rápidas de convivencia"
        aria-describedby={tooltipId}
      >
        <MotoIcon name="info" />
      </button>
      <span className="motorcycle-community__convivence-text">
        Disfrutemos de la comunidad con respeto.
      </span>
      <div
        id={tooltipId}
        className="motorcycle-community__convivence-tooltip"
        role="tooltip"
        aria-label="Normas rápidas"
      >
        <strong>Normas rápidas</strong>
        <ul>
          <li>Comparte tu experiencia con buen tono.</li>
          <li>Evita insultos, spam o ataques personales.</li>
          <li>Las respuestas inapropiadas podrán retirarse.</li>
        </ul>
      </div>
    </div>
  );
}
