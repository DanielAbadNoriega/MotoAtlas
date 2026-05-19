import type { ModelRequest } from '../../../services/modelRequestService';
import {
  formatAccountDate,
  getModelRequestTitle,
  modelRequestStatusLabels,
  splitModelRequestComment,
  truncateAccountText,
} from '../modelRequestPresentation';
import './ModelRequestCard.scss';

type ModelRequestCardProps = Readonly<{
  request: ModelRequest;
  commentMaxLength?: number;
  headingLevel?: 2 | 3;
  testId?: string;
}>;

export function ModelRequestCard({ commentMaxLength = 220, headingLevel = 2, request, testId = 'model-request-card' }: ModelRequestCardProps) {
  const commentParts = splitModelRequestComment(request.comment);
  const Heading = `h${headingLevel}` as const;

  return (
    <article className="model-request-card" data-testid={testId}>
      <header className="model-request-card__header">
        <span className={`account-page__status account-page__status--${request.status}`}>
          {modelRequestStatusLabels[request.status]}
        </span>
        <Heading>{getModelRequestTitle(request)}</Heading>
        <p>Año {request.year}{request.segment ? ` · ${request.segment}` : ''}</p>
      </header>

      <dl className="model-request-card__meta">
        <div>
          <dt>Enviada</dt>
          <dd>{formatAccountDate(request.createdAt)}</dd>
        </div>
        {commentParts.market ? (
          <div>
            <dt>País/mercado</dt>
            <dd>{commentParts.market}</dd>
          </div>
        ) : null}
        {request.contactEmail ? (
          <div>
            <dt>Contacto</dt>
            <dd>{request.contactEmail}</dd>
          </div>
        ) : null}
        {request.officialUrl ? (
          <div>
            <dt>Fuente</dt>
            <dd>
              <a href={request.officialUrl} target="_blank" rel="noreferrer">Página oficial</a>
            </dd>
          </div>
        ) : null}
      </dl>

      {commentParts.body ? <p className="model-request-card__comment">{truncateAccountText(commentParts.body, commentMaxLength)}</p> : null}
    </article>
  );
}
