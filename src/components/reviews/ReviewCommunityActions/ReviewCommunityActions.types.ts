import type { User } from '@supabase/supabase-js';
import type { ReviewReportReason } from '../../../services/reviewReportService';
import type { ReviewReactionSummary } from '../../../services/reviewReactionService';
import type { ReviewReply } from '../../../services/reviewReplyService';
import type { MotorcycleReview } from '../../../services/motorcycleReviewService';

export type { ReviewReportReason, ReviewReactionSummary, ReviewReply, MotorcycleReview };

export interface HelpfulReviewActionProps {
  readonly disabled?: boolean;
  readonly isBlocked: boolean;
  readonly isOwnReview: boolean;
  readonly isPending: boolean;
  readonly onToggle: () => void;
  readonly summary: ReviewReactionSummary;
}

export interface NotHelpfulReviewActionProps {
  readonly isBlocked: boolean;
  readonly isOwnReview: boolean;
  readonly isPending: boolean;
  readonly onToggle: () => void;
  readonly summary: ReviewReactionSummary;
}

export interface ReportReviewActionProps {
  readonly hasReported: boolean;
  readonly isOwnReview: boolean;
  readonly isPending: boolean;
  readonly onOpen: () => void;
}

export interface ReviewReportFormProps {
  readonly comment: string;
  readonly isSubmitting: boolean;
  readonly onCancel: () => void;
  readonly onCommentChange: (comment: string) => void;
  readonly onReasonChange: (reason: ReviewReportReason) => void;
  readonly onSubmit: () => void;
  readonly reason: ReviewReportReason;
  readonly reviewId: string;
}

export interface ReplyFormState {
  readonly comment: string;
  readonly isSubmitting: boolean;
  readonly reviewId: string;
}

export interface ReplyToastState {
  readonly message: string;
  readonly reviewId: string;
  readonly visible: boolean;
  readonly ticket: number;
}

export interface ReviewReplySectionProps {
  readonly onCancelReply: () => void;
  readonly onChangeReplyComment: (comment: string) => void;
  readonly onSubmitReply: () => void;
  readonly onOpenReply?: () => void;
  readonly replies: readonly ReviewReply[];
  readonly replyForm: ReplyFormState | null;
  readonly replyToast: ReplyToastState | null;
  readonly review: MotorcycleReview;
  readonly user: User | null;
  readonly expanded: boolean;
  readonly isExpanded: boolean;
  readonly inline?: boolean;
  readonly visibleRepliesCount?: Record<string, number>;
  readonly onToggleReplyVisibility?: (reviewId: string) => void;
}
