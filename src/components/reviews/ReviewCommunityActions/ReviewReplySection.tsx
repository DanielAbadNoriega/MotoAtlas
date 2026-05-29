import type { ReviewReplySectionProps } from './ReviewCommunityActions.types';
import { ReplyConvivenceNotice } from './ReplyConvivenceNotice';

export function ReviewReplySection({
  onCancelReply,
  onChangeReplyComment,
  onSubmitReply,
  onOpenReply,
  replies,
  replyForm,
  replyToast,
  review,
  user,
  expanded,
  isExpanded,
  inline,
  visibleRepliesCount,
  onToggleReplyVisibility,
}: ReviewReplySectionProps) {
  const isReplyFormOpen = replyForm?.reviewId === review.id;
  const isOwnReview = user?.id === review.userId;
  const canReply = Boolean(user && !isOwnReview && onOpenReply);
  const visibleReplies = replies.filter(
    (r) => r.status === 'approved' || (r.status === 'pending' && user?.id === r.userId),
  );
  const repliesListId = `reply-list-${review.id}`;
  const count = visibleRepliesCount?.[review.id] ?? 0;

  const hasExpandedContent = (expanded && visibleReplies.length > 0) || isReplyFormOpen || (replyToast && replyToast.reviewId === review.id);

  if (!canReply && !isExpanded && !isReplyFormOpen && !replyToast) {
    return null;
  }

  const triggerButton = !isReplyFormOpen && user && !isOwnReview && onOpenReply ? (
    <button
      className="motorcycle-community__helpful-action motorcycle-community__reply-trigger"
      onClick={onOpenReply}
      type="button"
    >
      <span className="material-symbols-outlined" aria-hidden="true">reply</span>
      Responder
    </button>
  ) : null;

  const toggleRepliesButton = inline && visibleRepliesCount && onToggleReplyVisibility && count > 0 ? (
    <button
      className="motorcycle-community__helpful-action"
      onClick={() => onToggleReplyVisibility(review.id)}
      aria-expanded={expanded}
      aria-controls={repliesListId}
      type="button"
    >
      <span className="material-symbols-outlined" aria-hidden="true">forum</span>
      {expanded
        ? `Ocultar ${count} ${count === 1 ? 'respuesta' : 'respuestas'}`
        : `Ver ${count} ${count === 1 ? 'respuesta' : 'respuestas'}`}
    </button>
  ) : null;

  const replyList = expanded && visibleReplies.length > 0 ? (
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
  ) : null;

  const replyFormContent = isReplyFormOpen && replyForm ? (
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
  ) : null;

  const replyToastContent = replyToast && replyToast.reviewId === review.id ? (
    <p className={`motorcycle-community__reply-toast ${replyToast.visible ? 'motorcycle-community__reply-toast--visible' : ''}`} role="status">
      {replyToast.message}
    </p>
  ) : null;

  if (inline) {
    return (
      <>
        {triggerButton}
        {toggleRepliesButton}
        {hasExpandedContent ? (
          <div className="motorcycle-community__replies">
            {replyList}
            {replyFormContent}
            {replyToastContent}
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div className="motorcycle-community__replies">
      {triggerButton}
      {replyList}
      {replyFormContent}
      {replyToastContent}
    </div>
  );
}
