import type { ReviewReplySectionProps } from './ReviewCommunityActions.types';
import { ReplyConvivenceNotice } from './ReplyConvivenceNotice';

export function ReviewReplySection({
  onCancelReply,
  onChangeReplyComment,
  onSubmitReply,
  replies,
  replyForm,
  replyToast,
  review,
  user,
  expanded,
}: ReviewReplySectionProps) {
  const isReplyFormOpen = replyForm?.reviewId === review.id;
  const visibleReplies = replies.filter(
    (r) => r.status === 'approved' || (r.status === 'pending' && user?.id === r.userId),
  );
  const repliesListId = `reply-list-${review.id}`;

  if (!expanded && !isReplyFormOpen && !replyToast) {
    return null;
  }

  return (
    <div className="motorcycle-community__replies">
      {expanded && visibleReplies.length > 0 ? (
        <ul id={repliesListId} className="motorcycle-community__replies-list" aria-label="Respuestas a esta review">
          {visibleReplies.map((reply) => (
            <li key={reply.id} className="motorcycle-community__reply-item">
              <div className="motorcycle-community__reply-header">
                <span className="material-symbols-outlined" aria-hidden="true">reply</span>
                <span className="motorcycle-community__reply-author">
                  {reply.userId === user?.id ? 'Tú' : reply.userName}
                </span>
                {reply.status === 'pending' ? (
                  <span className="motorcycle-community__reply-badge motorcycle-community__reply-badge--pending">
                    Pendiente
                  </span>
                ) : null}
              </div>
              <p className="motorcycle-community__reply-comment">{reply.comment}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {isReplyFormOpen && replyForm ? (
        <div className="motorcycle-community__reply-form">
          <ReplyConvivenceNotice />
          <textarea
            aria-label="Tu respuesta"
            className="motorcycle-community__reply-textarea"
            disabled={replyForm.isSubmitting}
            maxLength={500}
            onChange={(event) => onChangeReplyComment(event.target.value)}
            placeholder="Escribe tu respuesta..."
            rows={3}
            value={replyForm.comment}
          />
          <div className="motorcycle-community__reply-form-actions">
            <button
              className="motorcycle-community__reply-cancel"
              disabled={replyForm.isSubmitting}
              onClick={onCancelReply}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="motorcycle-community__reply-submit"
              disabled={replyForm.isSubmitting || replyForm.comment.trim().length === 0}
              onClick={onSubmitReply}
              type="button"
            >
              {replyForm.isSubmitting ? 'Enviando...' : 'Responder'}
            </button>
          </div>
        </div>
      ) : null}

      {replyToast && replyToast.reviewId === review.id ? (
        <p className={`motorcycle-community__reply-toast ${replyToast.visible ? 'motorcycle-community__reply-toast--visible' : ''}`} role="status">
          {replyToast.message}
        </p>
      ) : null}
    </div>
  );
}
