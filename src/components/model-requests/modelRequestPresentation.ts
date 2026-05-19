import type { ModelRequest, ModelRequestStatus } from '../../services/modelRequestService';

export const modelRequestStatusLabels: Record<ModelRequestStatus, string> = {
  pending: 'Pendiente',
  reviewed: 'Revisada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

export function formatAccountDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function truncateAccountText(text: string, maxLength = 150) {
  const normalizedText = text.trim();
  return normalizedText.length > maxLength ? `${normalizedText.slice(0, maxLength - 3)}...` : normalizedText;
}

export function splitModelRequestComment(comment: string | null | undefined) {
  const normalizedComment = comment?.trim() ?? '';

  if (!normalizedComment) {
    return { body: '', market: '' };
  }

  const [firstLine = '', ...restLines] = normalizedComment.split(/\n+/);
  const marketMatch = firstLine.match(/^Mercado:\s*(.+)$/i);

  if (!marketMatch) {
    return { body: normalizedComment, market: '' };
  }

  return {
    body: restLines.join('\n').trim(),
    market: marketMatch[1].trim(),
  };
}

export function getModelRequestTitle(request: Pick<ModelRequest, 'brand' | 'model'>) {
  return `${request.brand} ${request.model}`.trim();
}
