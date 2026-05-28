import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getBikeDetailHash, getBikeDisplayName } from '../../../data/bikes';
import { useAuth } from '../../../features/auth';
import {
  getApprovedReviewsByMotorcycleId,
  getReviewAspectsByReviewIds,
  type MotorcycleReview,
  type MotorcycleReviewAspect,
  type MotorcycleReviewRidingStyle,
} from '../../../services/motorcycleReviewService';
import {
  clearMyReviewReaction,
  getReviewReactionSummary,
  toggleHelpfulReaction,
  toggleNotHelpfulReaction,
  type ReviewReactionSummary,
} from '../../../services/reviewReactionService';
import {
  createReviewReport,
  getMyReviewReports,
  type ReviewReportReason,
} from '../../../services/reviewReportService';
import { createReviewReply, getRepliesByReviewId, type ReviewReply } from '../../../services/reviewReplyService';
import { getBikeA2Badge, segmentLabels } from '../../../shared/motorcycles/motorcycleTaxonomy';
import { getComparatorHashFromBikes } from '../../../shared/routing/routeUtils';
import { formatReviewAggregate, formatReviewRating, getReviewAggregate, getReviewUserName, isReviewVerified } from '../../../shared/reviews/reviewUtils';
import { getTopCommunityItemsSafe, getMostCommonRidingStyleSafe } from '../../../shared/reviews/communityUtils';
import type { Bike } from '../../../types/bike';
import { ReviewModal } from '../../reviews/ReviewModal';
import { ReviewAspectSummary } from '../../reviews/ReviewAspectSummary';
import { AccountPagination } from '../AccountPage/AccountPagination';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import {
  HelpfulReviewAction,
  NotHelpfulReviewAction,
  ReportReviewAction,
  ReviewReportForm,
  ReviewReplySection,
} from '../../reviews/ReviewCommunityActions';
import './MotorcycleCommunityPage.scss';

type MotorcycleCommunityPageProps = Readonly<{
  bike?: Bike;
  motorcycleId?: string;
}>;

type CommunityMetric = Readonly<{
  label: string;
  value: string;
  detail?: string;
}>;

type OwnerReportsRatingFilter = 'all' | '5' | '4-plus' | '3-minus';
type OwnerReportsSortOption = 'recent' | 'rating-desc' | 'kilometers-desc' | 'ownership-desc';
type OwnerReportsFilters = Readonly<{
  rating: OwnerReportsRatingFilter;
  sort: OwnerReportsSortOption;
}>;
type ReactionSummaryMap = Record<string, ReviewReactionSummary>;
type ReactionNotice = Readonly<{
  message: string;
}>;
type ReviewReportMap = Record<string, boolean>;
type ReviewReportFormState = Readonly<{
  comment: string;
  isSubmitting: boolean;
  reason: ReviewReportReason;
  reviewId: string;
}>;
type HelpfulTooltipState = Readonly<{
  message: string;
  reviewId: string;
  ticket: number;
  visible: boolean;
}>;
type ReplyToastState = Readonly<{
  message: string;
  reviewId: string;
  visible: boolean;
  ticket: number;
}>;
type ReplyFormState = Readonly<{
  comment: string;
  isSubmitting: boolean;
  reviewId: string;
}>;
type ReviewAspectsMap = Record<string, readonly MotorcycleReviewAspect[]>;

const OWNER_REPORTS_PER_PAGE = 5;
const HELPFUL_TOOLTIP_VISIBLE_MS = 2000;
const HELPFUL_TOOLTIP_EXIT_MS = 220;
const defaultOwnerReportsFilters: OwnerReportsFilters = {
  rating: 'all',
  sort: 'recent',
};
const numberFormatter = new Intl.NumberFormat('es-ES');
const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const ridingStyleLabels: Record<MotorcycleReviewRidingStyle, string> = {
  ciudad: 'Ciudad',
  deportivo: 'Deportivo',
  diario: 'Diario',
  offroad: 'Off-road',
  pasajero: 'Pasajero',
  viaje: 'Viaje',
};

const ownerReportsRatingOptions = [
  { ariaLabel: 'Todas las valoraciones', filledStars: 0, label: 'Todas', value: 'all' },
  { ariaLabel: '5 estrellas', filledStars: 5, label: '5 estrellas', value: '5' },
  { ariaLabel: '4 estrellas o más', filledStars: 4, label: '4 o más', value: '4-plus' },
  { ariaLabel: '3 estrellas o menos', filledStars: 3, label: '3 o menos', value: '3-minus' },
] satisfies readonly { ariaLabel: string; filledStars: number; label: string; value: OwnerReportsRatingFilter }[];

const ownerReportsSortOptions = [
  { label: 'Más recientes', value: 'recent' },
  { label: 'Mejor valoradas', value: 'rating-desc' },
  { label: 'Más kilómetros', value: 'kilometers-desc' },
  { label: 'Más tiempo con la moto', value: 'ownership-desc' },
] satisfies readonly { label: string; value: OwnerReportsSortOption }[];

const reviewReportReasonOptions = [
  { label: 'Spam', value: 'spam' },
  { label: 'Ofensivo', value: 'offensive' },
  { label: 'Información falsa', value: 'false_information' },
  { label: 'Acoso', value: 'harassment' },
  { label: 'Otro', value: 'other' },
] satisfies readonly { label: string; value: ReviewReportReason }[];

function getApprovedReviews(reviews: readonly MotorcycleReview[]) {
  return (reviews ?? []).filter((review) => review?.status === 'approved');
}

function getAverage(values: readonly (number | null)[]) {
  const validValues = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (validValues.length === 0) {
    return null;
  }

  return Math.round(validValues.reduce((total, value) => total + value, 0) / validValues.length);
}

function getStarDistribution(reviews: readonly MotorcycleReview[]) {
  return [5, 4, 3, 2, 1].map((rating) => ({
    count: reviews.filter((review) => review.rating === rating).length,
    rating,
  }));
}

function getMostCommonRidingStyle(reviews: readonly MotorcycleReview[]) {
  return getMostCommonRidingStyleSafe(reviews);
}

function getTopCommunityItems(reviews: readonly MotorcycleReview[], field: 'pros' | 'cons') {
  return getTopCommunityItemsSafe(reviews, field);
}

function CommunityRootState() {
  return (
    <main className="motorcycle-community motorcycle-community--state" aria-labelledby="community-root-title">
      <section>
        <span>Comunidad MotoAtlas</span>
        <h1 id="community-root-title">Elige una moto para ver su comunidad</h1>
        <p>Las reviews viven asociadas a cada ficha técnica para que el contexto sea claro.</p>
        <a className="button button--primary" href="#/buscador">
          Ir al buscador
        </a>
      </section>
    </main>
  );
}

function NotFoundState({ motorcycleId }: { motorcycleId?: string }) {
  return (
    <main className="motorcycle-community motorcycle-community--state" aria-labelledby="community-not-found-title">
      <section>
        <span>404</span>
        <h1 id="community-not-found-title">Moto no encontrada</h1>
        <p>No existe comunidad para el registro {motorcycleId ? `“${motorcycleId}”` : 'solicitado'}.</p>
        <a className="button button--primary" href="#/buscador">
          Volver al buscador
        </a>
      </section>
    </main>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="motorcycle-community__stars" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          className="material-symbols-outlined"
          data-filled={rating >= star ? 'true' : 'false'}
          key={star}
          aria-hidden="true"
        >
          star
        </span>
      ))}
    </span>
  );
}

function getTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha pendiente';
  }

  return dateFormatter.format(date);
}

function formatKilometers(value: number | null) {
  return value === null ? 'N/D' : `${numberFormatter.format(value)} km`;
}

function formatOwnershipMonths(value: number | null) {
  return value === null ? 'N/D' : `${numberFormatter.format(value)} meses`;
}

function formatCommunityAlias(userName: string) {
  const cleanName = getReviewUserName({ userName });
  return cleanName.startsWith('@') ? cleanName : `@${cleanName.replace(/\s+/g, '_')}`;
}

function normalizeReviewList(items: readonly unknown[] | string | null | undefined) {
  const list = Array.isArray(items) ? items : [items];

  return list
    .map((item) => (item === null || item === undefined ? '' : String(item).trim()))
    .filter((item) => item.length > 0 && item.toLowerCase() !== 'null' && item.toLowerCase() !== 'undefined');
}

function matchesOwnerReportRating(review: MotorcycleReview, rating: OwnerReportsRatingFilter) {
  if (rating === '5') {
    return review.rating === 5;
  }

  if (rating === '4-plus') {
    return review.rating >= 4;
  }

  if (rating === '3-minus') {
    return review.rating <= 3;
  }

  return true;
}

function sortOwnerReports(reviews: readonly MotorcycleReview[], sort: OwnerReportsSortOption) {
  return [...reviews].sort((left, right) => {
    if (sort === 'rating-desc') {
      return right.rating - left.rating || getTimestamp(right.createdAt) - getTimestamp(left.createdAt);
    }

    if (sort === 'kilometers-desc') {
      return (right.kilometers ?? -1) - (left.kilometers ?? -1) || getTimestamp(right.createdAt) - getTimestamp(left.createdAt);
    }

    if (sort === 'ownership-desc') {
      return (right.ownershipMonths ?? -1) - (left.ownershipMonths ?? -1) || getTimestamp(right.createdAt) - getTimestamp(left.createdAt);
    }

    return getTimestamp(right.createdAt) - getTimestamp(left.createdAt);
  });
}

function filterOwnerReports(reviews: readonly MotorcycleReview[], filters: OwnerReportsFilters) {
  return sortOwnerReports(reviews.filter((review) => matchesOwnerReportRating(review, filters.rating)), filters.sort);
}

function hasActiveOwnerReportFilters(filters: OwnerReportsFilters) {
  return filters.rating !== defaultOwnerReportsFilters.rating || filters.sort !== defaultOwnerReportsFilters.sort;
}

function FilterGroup({ children, title }: Readonly<{ children: ReactNode; title: string }>) {
  return (
    <details className="motorcycle-community__filter-group" open>
      <summary>
        <span>{title}</span>
        <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
      </summary>
      <div className="motorcycle-community__filter-group-body">{children}</div>
    </details>
  );
}

function FilterOptionButton({
  active,
  ariaLabel,
  children,
  className = '',
  label,
  onClick,
}: Readonly<{
  active: boolean;
  ariaLabel: string;
  children?: ReactNode;
  className?: string;
  label: string;
  onClick: () => void;
}>) {
  const buttonClasses = ['motorcycle-community__filter-option', active ? 'motorcycle-community__filter-option--active' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={buttonClasses} type="button" aria-label={ariaLabel} aria-pressed={active} onClick={onClick}>
      <span>{label}</span>
      {children}
    </button>
  );
}

function FilterRatingStars({ filledStars }: Readonly<{ filledStars: number }>) {
  return (
    <span className="motorcycle-community__filter-stars" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <span className={index < filledStars ? 'motorcycle-community__filter-star--filled' : undefined} key={index}>star</span>
      ))}
    </span>
  );
}

function OwnerReportsFiltersPanel({
  filters,
  isOpen,
  onApply,
  onChange,
  onClose,
  onReset,
}: Readonly<{
  filters: OwnerReportsFilters;
  isOpen: boolean;
  onApply: () => void;
  onChange: (next: Partial<OwnerReportsFilters>) => void;
  onClose: () => void;
  onReset: () => void;
}>) {
  const panelClasses = ['motorcycle-community__filters', isOpen ? 'motorcycle-community__filters--open' : ''].filter(Boolean).join(' ');

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const applyFilters = () => {
    onApply();
    onClose();
  };

  return (
    <>
      {isOpen ? <button className="motorcycle-community__filters-backdrop" type="button" onClick={onClose} aria-label="Cerrar filtros" /> : null}
      <section
        className={panelClasses}
        aria-label="Filtros de reviews"
        aria-labelledby="motorcycle-community-filters-title"
        aria-modal={isOpen ? 'true' : undefined}
        role={isOpen ? 'dialog' : undefined}
      >
        <div className="motorcycle-community__sheet-handle" aria-hidden="true" />
        <div className="motorcycle-community__filters-header">
          <h2 id="motorcycle-community-filters-title">Filtros</h2>
          <button type="button" aria-label="Limpiar filtros de reviews" onClick={onReset}>Limpiar filtros</button>
          <button className="motorcycle-community__filters-close" type="button" onClick={onClose} aria-label="Cerrar filtros">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="motorcycle-community__filters-body">
          <FilterGroup title="Rating">
            <div className="motorcycle-community__rating-grid">
              {ownerReportsRatingOptions.map((option) => (
                <FilterOptionButton
                  active={filters.rating === option.value}
                  ariaLabel={option.ariaLabel}
                  className="motorcycle-community__filter-option--rating"
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ rating: option.value })}
                >
                  <FilterRatingStars filledStars={option.filledStars} />
                </FilterOptionButton>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Orden">
            <div className="motorcycle-community__sort-grid">
              {ownerReportsSortOptions.map((option) => (
                <FilterOptionButton
                  active={filters.sort === option.value}
                  ariaLabel={`Orden: ${option.label}`}
                  className="motorcycle-community__filter-option--sort"
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ sort: option.value })}
                />
              ))}
            </div>
          </FilterGroup>
        </div>

        <footer className="motorcycle-community__filters-footer">
          <button type="button" aria-label="Restablecer filtros de reviews" onClick={onReset}>Limpiar filtros</button>
          <button type="button" onClick={applyFilters}>Aplicar filtros</button>
        </footer>
      </section>
    </>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" className="motorcycle-review-card__user-icon motorcycle-community__owner-user-icon" viewBox="0 0 24 24" focusable="false">
      <path d="M12 12.25c2.42 0 4.38-1.96 4.38-4.38S14.42 3.5 12 3.5 7.62 5.46 7.62 7.87 9.58 12.25 12 12.25Zm0 2.1c-3.36 0-6.9 1.64-6.9 4.05v1.1h13.8v-1.1c0-2.41-3.54-4.05-6.9-4.05Z" />
    </svg>
  );
}

function OwnerReportListBlock({ items, title }: Readonly<{ items: readonly string[]; title: string }>) {
  if (items.length === 0) {
    return null;
  }

  return (
    <p className={`owner-report-${title.toLowerCase()}`}>
      <strong>{title}:</strong> {items.join(', ')}
    </p>
  );
}

function getDefaultReactionSummary(reviewId: string): ReviewReactionSummary {
  return {
    helpfulCount: 0,
    hasReactedHelpful: false,
    hasReactedNotHelpful: false,
    reviewId,
  };
}

function OwnerReportRow({
  aspects,
  feedbackTooltipMessage,
  feedbackTooltipVisible,
  hasReported,
  index,
  isOwnReview,
  isReportFormOpen,
  isReactionPending,
  onCancelReport,
  onChangeReportComment,
  onChangeReportReason,
  onOpenReport,
  onSubmitReport,
  onToggleHelpful,
  onToggleNotHelpful,
  replyForm,
  onCancelReply,
  onChangeReplyComment,
  onOpenReply,
  onSubmitReply,
  replies,
  replyToast,
  expandedReplyReviewIds,
  onToggleReplyVisibility,
  reportForm,
  reactionSummary,
  review,
  user,
}: Readonly<{
  aspects?: readonly MotorcycleReviewAspect[];
  feedbackTooltipMessage?: string;
  feedbackTooltipVisible?: boolean;
  hasReported: boolean;
  index: number;
  isOwnReview: boolean;
  isReportFormOpen: boolean;
  isReactionPending: boolean;
  onCancelReport: () => void;
  onChangeReportComment: (comment: string) => void;
  onChangeReportReason: (reason: ReviewReportReason) => void;
  onOpenReport: () => void;
  onSubmitReport: () => void;
  onToggleHelpful: () => void;
  onToggleNotHelpful: () => void;
  replyForm: ReplyFormState | null;
  onCancelReply: () => void;
  onChangeReplyComment: (comment: string) => void;
  onOpenReply: () => void;
  onSubmitReply: () => void;
  replies: readonly ReviewReply[];
  replyToast: ReplyToastState | null;
  expandedReplyReviewIds: Record<string, boolean>;
  onToggleReplyVisibility: (reviewId: string) => void;
  reportForm: ReviewReportFormState | null;
  reactionSummary: ReviewReactionSummary;
  review: MotorcycleReview;
  user: User | null;
}>) {
  const alias = formatCommunityAlias(review.userName);
  const pros = normalizeReviewList(review.pros as readonly unknown[]);
  const cons = normalizeReviewList(review.cons as readonly unknown[]);
  const hasReplied = Boolean(user && replies.some((r) => r.userId === user.id));
  const isReplyFormOpen = replyForm?.reviewId === review.id;
  const visibleReplies = replies.filter(
    (r) => r.status === 'approved' || (r.status === 'pending' && user?.id === r.userId),
  );
  const visibleRepliesCount = visibleReplies.length;
  const isExpanded = Boolean(expandedReplyReviewIds[review.id]);

  return (
    <article className="motorcycle-community__owner-report-row" data-testid="owner-report-row" data-row-tone={index % 2 === 0 ? 'even' : 'odd'} role="listitem">
      <div className="motorcycle-community__owner-report-identity">
          <div className="motorcycle-community__owner-report-owner">
            <span className="motorcycle-review-card__avatar motorcycle-community__owner-avatar" aria-hidden="true">
              <UserIcon />
            </span>
            <div>
              <div className="motorcycle-community__owner-report-name-row">
                <h3>{alias}</h3>
                {isReviewVerified(review) ? (
                  <span className="motorcycle-community__owner-verified-icon motorcycle-community__owner-verified-icon--verified" aria-label="Usuario verificado">
                    <span className="material-symbols-outlined" aria-hidden="true">workspace_premium</span>
                  </span>
                ) : (
                  <span className="motorcycle-community__owner-verified-icon motorcycle-community__owner-verified-icon--unverified" aria-label="Usuario no verificado">
                    <span className="material-symbols-outlined" aria-hidden="true">person</span>
                  </span>
                )}
                {hasReplied ? (
                  <span className="motorcycle-community__reply-badge motorcycle-community__reply-badge--respondido">Respondido</span>
                ) : null}
              </div>
              {isReviewVerified(review) ? (
                <span className="motorcycle-community__verified-badge">
                  <span className="material-symbols-outlined" aria-hidden="true">award_star</span>
                  Review verificada
                </span>
              ) : null}
            </div>
          </div>

        <div className="motorcycle-community__owner-report-rating">
          <RatingStars rating={review.rating} />
          <strong>{review.rating}/5</strong>
        </div>

        <ul className="motorcycle-community__owner-report-meta" aria-label="Metadatos de la review">
          <li>
            <span className="material-symbols-outlined" aria-hidden="true">route</span>
            {ridingStyleLabels[(review.ridingStyle ?? 'diario') as MotorcycleReviewRidingStyle]}
          </li>
          <li>
            <span className="material-symbols-outlined" aria-hidden="true">schedule</span>
            {formatOwnershipMonths(review.ownershipMonths)}
          </li>
          <li>
            <span className="material-symbols-outlined" aria-hidden="true">speed</span>
            {formatKilometers(review.kilometers)}
          </li>
          <li>
            <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
            {formatDate(review.createdAt)}
          </li>
        </ul>
      </div>

      <div className="motorcycle-community__owner-report-summary">
        <p>{(review.comment ?? '').toString().trim() || '—'}</p>
        <div className="motorcycle-community__owner-report-pros-cons">
          <OwnerReportListBlock title="Pros" items={pros} />
          <OwnerReportListBlock title="Contras" items={cons} />
        </div>
        {aspects && aspects.length > 0 ? (
          <ReviewAspectSummary aspects={aspects} />
        ) : null}
        <div className="motorcycle-community__owner-report-actions" aria-label="Acciones de la review">
          <HelpfulReviewAction
            isBlocked={hasReported}
            isOwnReview={isOwnReview}
            isPending={isReactionPending}
            onToggle={onToggleHelpful}
            summary={reactionSummary}
          />
          <NotHelpfulReviewAction
            isBlocked={hasReported}
            isOwnReview={isOwnReview}
            isPending={isReactionPending}
            onToggle={onToggleNotHelpful}
            summary={reactionSummary}
          />
          <ReportReviewAction
            hasReported={hasReported}
            isOwnReview={isOwnReview}
            isPending={isReportFormOpen && Boolean(reportForm?.isSubmitting)}
            onOpen={onOpenReport}
          />
          {user && !isReplyFormOpen && !isOwnReview ? (
            <button className="motorcycle-community__helpful-action" onClick={onOpenReply} type="button">
              <span className="material-symbols-outlined" aria-hidden="true">reply</span>
              Responder
            </button>
          ) : null}
          {user && !isReplyFormOpen && isOwnReview ? (
            <span className="motorcycle-community__helpful-action motorcycle-community__helpful-action--passive" aria-label="No puedes responder a tu propia review">
              <span className="material-symbols-outlined" aria-hidden="true">block</span>
              Propia
            </span>
          ) : null}
          {visibleRepliesCount > 0 ? (
            <button
              className="motorcycle-community__helpful-action"
              onClick={() => onToggleReplyVisibility(review.id)}
              aria-expanded={isExpanded}
              aria-controls={`reply-list-${review.id}`}
              type="button"
            >
              <span className="material-symbols-outlined" aria-hidden="true">forum</span>
              {isExpanded
                ? `Ocultar ${visibleRepliesCount} ${visibleRepliesCount === 1 ? 'respuesta' : 'respuestas'}`
                : `Ver ${visibleRepliesCount} ${visibleRepliesCount === 1 ? 'respuesta' : 'respuestas'}`}
            </button>
          ) : null}
          {feedbackTooltipMessage ? (
            <p
              className={`motorcycle-community__helpful-feedback ${feedbackTooltipVisible ? 'motorcycle-community__helpful-feedback--visible' : ''}`}
              role="status"
              aria-live="polite"
            >
              {feedbackTooltipMessage}
            </p>
          ) : null}
        </div>
        {isReportFormOpen && reportForm ? (
          <ReviewReportForm
            comment={reportForm.comment}
            isSubmitting={reportForm.isSubmitting}
            onCancel={onCancelReport}
            onCommentChange={onChangeReportComment}
            onReasonChange={onChangeReportReason}
            onSubmit={onSubmitReport}
            reason={reportForm.reason}
            reviewId={review.id}
          />
        ) : null}
        <ReviewReplySection
          onCancelReply={onCancelReply}
          onChangeReplyComment={onChangeReplyComment}
          onSubmitReply={onSubmitReply}
          replies={replies}
          replyForm={replyForm}
          replyToast={replyToast}
          review={review}
          user={user}
          expanded={isExpanded}
        />
        {/* {aspects && aspects.length > 0 ? (
          <ReviewAspectSummary aspects={aspects} />
        ) : null} */}
      </div>
    </article>
  );
}

export function MotorcycleCommunityPage({ bike, motorcycleId }: MotorcycleCommunityPageProps) {
  const { isAuthenticated, session, user, profile } = useAuth();
  const [reviews, setReviews] = useState<readonly MotorcycleReview[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [hasReviewError, setHasReviewError] = useState(false);
  const [ownerReportFilters, setOwnerReportFilters] = useState<OwnerReportsFilters>(defaultOwnerReportsFilters);
  const [ownerReportsPage, setOwnerReportsPage] = useState(1);
  const [isOwnerReportFiltersOpen, setIsOwnerReportFiltersOpen] = useState(false);
  const [reactionSummaries, setReactionSummaries] = useState<ReactionSummaryMap>({});
  const [reactionPendingIds, setReactionPendingIds] = useState<readonly string[]>([]);
  const [reactionNotice, setReactionNotice] = useState<ReactionNotice | null>(null);
  const [replyToast, setReplyToast] = useState<ReplyToastState | null>(null);
  const [reportedReviewIds, setReportedReviewIds] = useState<ReviewReportMap>({});
  const [reportForm, setReportForm] = useState<ReviewReportFormState | null>(null);
  const [helpfulTooltip, setHelpfulTooltip] = useState<HelpfulTooltipState | null>(null);
  const [replies, setReplies] = useState<Record<string, readonly ReviewReply[]>>({});
  const [replyForm, setReplyForm] = useState<ReplyFormState | null>(null);
  const [expandedReplyReviewIds, setExpandedReplyReviewIds] = useState<Record<string, boolean>>({});
  const [reviewAspects, setReviewAspects] = useState<ReviewAspectsMap>({});
  const tooltipHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!bike) {
      return;
    }

    let isMounted = true;
    setHasReviewError(false);

    getApprovedReviewsByMotorcycleId(bike.id)
      .then((approvedReviews) => {
        if (isMounted) {
          setReviews(getApprovedReviews(approvedReviews));
        }
      })
      .catch(() => {
        if (isMounted) {
          setReviews([]);
          setHasReviewError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [bike?.id]);

  const metrics = useMemo<readonly CommunityMetric[]>(() => {
    const aggregate = getReviewAggregate(reviews);
    const averageKilometers = getAverage(reviews.map((review) => review.kilometers));
    const averageOwnershipMonths = getAverage(reviews.map((review) => review.ownershipMonths));

    return [
      { label: 'Rating medio', value: formatReviewAggregate(aggregate), detail: 'Solo reviews aprobadas' },
      { label: 'Reviews aprobadas', value: numberFormatter.format(aggregate.reviewCount), detail: 'Moderación activa' },
      {
        label: 'Kilómetros medios',
        value: averageKilometers === null ? 'N/D' : `${numberFormatter.format(averageKilometers)} km`,
        detail: averageKilometers === null ? 'Datos pendientes' : 'Reportados por propietarios',
      },
      {
        label: 'Propiedad media',
        value: averageOwnershipMonths === null ? 'N/D' : `${numberFormatter.format(averageOwnershipMonths)} meses`,
        detail: averageOwnershipMonths === null ? 'Datos pendientes' : 'Experiencia acumulada',
      },
      { label: 'Uso más habitual', value: getMostCommonRidingStyle(reviews), detail: 'Según reviews aprobadas' },
    ];
  }, [reviews]);
  const filteredOwnerReports = useMemo(
    () => filterOwnerReports(reviews, ownerReportFilters),
    [ownerReportFilters, reviews],
  );
  const ownerReportsTotalPages = Math.max(1, Math.ceil(filteredOwnerReports.length / OWNER_REPORTS_PER_PAGE));
  const paginatedOwnerReports = filteredOwnerReports.slice(
    (ownerReportsPage - 1) * OWNER_REPORTS_PER_PAGE,
    ownerReportsPage * OWNER_REPORTS_PER_PAGE,
  );
  const hasActiveOwnerFilters = hasActiveOwnerReportFilters(ownerReportFilters);
  const visibleOwnerReportIds = useMemo(() => paginatedOwnerReports.map((review) => review.id), [paginatedOwnerReports]);
  const reactionAuthContext = isAuthenticated && user?.id && session?.access_token
    ? { accessToken: session.access_token, userId: user.id }
    : null;

  useEffect(() => {
    if (ownerReportsPage > ownerReportsTotalPages) {
      setOwnerReportsPage(ownerReportsTotalPages);
    }
  }, [ownerReportsPage, ownerReportsTotalPages]);

  const clearHelpfulTooltipTimers = () => {
    if (tooltipHideTimeoutRef.current) {
      clearTimeout(tooltipHideTimeoutRef.current);
      tooltipHideTimeoutRef.current = null;
    }

    if (tooltipClearTimeoutRef.current) {
      clearTimeout(tooltipClearTimeoutRef.current);
      tooltipClearTimeoutRef.current = null;
    }
  };

  useEffect(() => () => {
    clearHelpfulTooltipTimers();
    if (replyToastTimeoutRef.current) {
      clearTimeout(replyToastTimeoutRef.current);
    }
  }, []);

  const updateOwnerReportFilters = (nextFilters: Partial<OwnerReportsFilters>) => {
    setOwnerReportFilters((currentFilters) => ({ ...currentFilters, ...nextFilters }));
    setOwnerReportsPage(1);
  };

  const clearOwnerReportFilters = () => {
    setOwnerReportFilters(defaultOwnerReportsFilters);
    setOwnerReportsPage(1);
  };

  const showHelpfulTooltip = (reviewId: string, message: string) => {
    clearHelpfulTooltipTimers();
    const ticket = Date.now();
    setHelpfulTooltip({
      message,
      reviewId,
      ticket,
      visible: true,
    });

    tooltipHideTimeoutRef.current = setTimeout(() => {
      setHelpfulTooltip((currentTooltip) => {
        if (!currentTooltip || currentTooltip.ticket !== ticket) {
          return currentTooltip;
        }

        return { ...currentTooltip, visible: false };
      });
    }, HELPFUL_TOOLTIP_VISIBLE_MS);

    tooltipClearTimeoutRef.current = setTimeout(() => {
      setHelpfulTooltip((currentTooltip) => (currentTooltip?.ticket === ticket ? null : currentTooltip));
    }, HELPFUL_TOOLTIP_VISIBLE_MS + HELPFUL_TOOLTIP_EXIT_MS);
  };

  useEffect(() => {
    if (visibleOwnerReportIds.length === 0) {
      return undefined;
    }

    let isMounted = true;

    getReviewReactionSummary(visibleOwnerReportIds, reactionAuthContext)
      .then((summaries) => {
        if (!isMounted) {
          return;
        }

        setReactionSummaries((currentSummaries) => ({
          ...currentSummaries,
          ...Object.fromEntries(summaries.map((summary) => [summary.reviewId, summary])),
        }));
      })
      .catch(() => {
        if (isMounted) {
          setReactionNotice({ message: 'No se pudieron cargar los útiles de estas reviews.' });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reactionAuthContext?.accessToken, reactionAuthContext?.userId, visibleOwnerReportIds.join('|')]);

  useEffect(() => {
    if (visibleOwnerReportIds.length === 0) {
      return undefined;
    }

    let isMounted = true;

    Promise.all(visibleOwnerReportIds.map((reviewId) =>
      getRepliesByReviewId(reviewId, reactionAuthContext)
        .then((reviewReplies) => ({ reviewId, reviewReplies }))
    ))
      .then((results) => {
        if (!isMounted) return;
        setReplies((currentReplies) => {
          const next = { ...currentReplies };
          for (const { reviewId, reviewReplies } of results) {
            next[reviewId] = reviewReplies;
          }
          return next;
        });
      })
      .catch(() => {
        // silently fail — replies are non-critical
      });

    return () => {
      isMounted = false;
    };
  }, [reactionAuthContext?.accessToken, reactionAuthContext?.userId, visibleOwnerReportIds.join('|')]);

  useEffect(() => {
    if (visibleOwnerReportIds.length === 0) {
      return undefined;
    }

    let isMounted = true;

    getReviewAspectsByReviewIds(visibleOwnerReportIds, reactionAuthContext)
      .then((aspects) => {
        if (!isMounted) {
          return;
        }
        const grouped: ReviewAspectsMap = {};
        for (const aspect of aspects) {
          if (!grouped[aspect.reviewId]) {
            grouped[aspect.reviewId] = [];
          }
          grouped[aspect.reviewId] = [...grouped[aspect.reviewId]!, aspect];
        }
        setReviewAspects((current) => ({ ...current, ...grouped }));
      })
      .catch(() => {
        if (isMounted) {
          setReviewAspects({});
        }
      });

    return () => {
      isMounted = false;
    };
  }, [visibleOwnerReportIds.join('|')]);

  useEffect(() => {
    if (!reactionAuthContext) {
      setReportedReviewIds({});
      setReportForm(null);
      return undefined;
    }

    if (visibleOwnerReportIds.length === 0) {
      return undefined;
    }

    let isMounted = true;

    getMyReviewReports(visibleOwnerReportIds, reactionAuthContext)
      .then((reports) => {
        if (!isMounted) {
          return;
        }

        setReportedReviewIds((currentReports) => ({
          ...currentReports,
          ...Object.fromEntries(reports.map((report) => [report.reviewId, true])),
        }));
      })
      .catch(() => {
        if (isMounted) {
          setReactionNotice({ message: 'No se pudo cargar el estado de reportes.' });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reactionAuthContext?.accessToken, reactionAuthContext?.userId, visibleOwnerReportIds.join('|')]);

  const toggleHelpful = async (review: MotorcycleReview) => {
    if (review.userId && user?.id && review.userId === user.id) {
      return;
    }

    if (reportedReviewIds[review.id]) {
      showHelpfulTooltip(review.id, 'Ya reportaste esta review.');
      return;
    }

    if (!reactionAuthContext) {
      showHelpfulTooltip(review.id, 'Inicia sesión para marcar esta review como útil.');
      return;
    }

    clearHelpfulTooltipTimers();
    setHelpfulTooltip(null);
    setReactionNotice(null);
    setReactionPendingIds((currentIds) => [...new Set([...currentIds, review.id])]);

    try {
      const summary = await toggleHelpfulReaction(review.id, reactionAuthContext);
      setReactionSummaries((currentSummaries) => ({
        ...currentSummaries,
        [review.id]: summary,
      }));
    } catch (error) {
      setReactionNotice({
        message: error instanceof Error ? error.message : 'No se pudo actualizar la reacción útil.',
      });
    } finally {
      setReactionPendingIds((currentIds) => currentIds.filter((id) => id !== review.id));
    }
  };

  const toggleNotHelpful = async (review: MotorcycleReview) => {
    if (review.userId && user?.id && review.userId === user.id) {
      return;
    }

    if (reportedReviewIds[review.id]) {
      showHelpfulTooltip(review.id, 'Ya reportaste esta review.');
      return;
    }

    if (!reactionAuthContext) {
      showHelpfulTooltip(review.id, 'Inicia sesión para valorar esta review.');
      return;
    }

    clearHelpfulTooltipTimers();
    setHelpfulTooltip(null);
    setReactionNotice(null);
    setReactionPendingIds((currentIds) => [...new Set([...currentIds, review.id])]);

    try {
      const summary = await toggleNotHelpfulReaction(review.id, reactionAuthContext);
      setReactionSummaries((currentSummaries) => ({
        ...currentSummaries,
        [review.id]: summary,
      }));
    } catch (error) {
      setReactionNotice({
        message: error instanceof Error ? error.message : 'No se pudo actualizar la reacción.',
      });
    } finally {
      setReactionPendingIds((currentIds) => currentIds.filter((id) => id !== review.id));
    }
  };

  const openReportForm = (review: MotorcycleReview) => {
    if (review.userId && user?.id && review.userId === user.id) {
      return;
    }

    if (!reactionAuthContext) {
      showHelpfulTooltip(review.id, 'Inicia sesión para reportar esta review.');
      return;
    }

    if (reportedReviewIds[review.id]) {
      showHelpfulTooltip(review.id, 'Ya has reportado esta review.');
      return;
    }

    clearHelpfulTooltipTimers();
    setHelpfulTooltip(null);
    setReactionNotice(null);
    setReportForm({
      comment: '',
      isSubmitting: false,
      reason: 'spam',
      reviewId: review.id,
    });
  };

  const updateReportFormReason = (reason: ReviewReportReason) => {
    setReportForm((currentForm) => (currentForm ? { ...currentForm, reason } : currentForm));
  };

  const updateReportFormComment = (comment: string) => {
    setReportForm((currentForm) => (currentForm ? { ...currentForm, comment } : currentForm));
  };

  const submitReport = async (review: MotorcycleReview) => {
    if (!reactionAuthContext || !reportForm || reportForm.reviewId !== review.id) {
      return;
    }

    setReportForm((currentForm) => (currentForm && currentForm.reviewId === review.id ? { ...currentForm, isSubmitting: true } : currentForm));
    setReactionNotice(null);
    setReactionPendingIds((currentIds) => [...new Set([...currentIds, review.id])]);

    const applyReactionCleanup = async (messageOnError?: string) => {
      try {
        const cleanedSummary = await clearMyReviewReaction(review.id, reactionAuthContext);
        setReactionSummaries((currentSummaries) => ({
          ...currentSummaries,
          [review.id]: cleanedSummary,
        }));
      } catch (cleanupError) {
        setReactionNotice({
          message: messageOnError ?? (cleanupError instanceof Error
            ? cleanupError.message
            : 'No se pudieron limpiar tus reacciones en esta review.'),
        });
      }
    };

    try {
      await createReviewReport(
        {
          comment: reportForm.comment,
          reason: reportForm.reason,
          reviewId: review.id,
        },
        reactionAuthContext,
      );
      await applyReactionCleanup('Reporte enviado, pero no se pudo actualizar tu reacción previa.');
      setReportedReviewIds((currentReports) => ({ ...currentReports, [review.id]: true }));
      setReportForm(null);
      showHelpfulTooltip(review.id, 'Gracias. Revisaremos esta review.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo enviar el reporte.';

      if (message === 'Ya has reportado esta review.') {
        await applyReactionCleanup();
        setReportedReviewIds((currentReports) => ({ ...currentReports, [review.id]: true }));
        setReportForm(null);
        showHelpfulTooltip(review.id, message);
        return;
      }

      setReportForm((currentForm) => (
        currentForm && currentForm.reviewId === review.id ? { ...currentForm, isSubmitting: false } : currentForm
      ));
      setReactionNotice({ message });
    } finally {
      setReactionPendingIds((currentIds) => currentIds.filter((id) => id !== review.id));
    }
  };

  const openReplyForm = (review: MotorcycleReview) => {
    if (!user) {
      showHelpfulTooltip(review.id, 'Inicia sesión para responder.');
      return;
    }
    setReplyForm({ comment: '', isSubmitting: false, reviewId: review.id });
    setReplyToast(null);
  };

  const cancelReplyForm = () => {
    setReplyForm(null);
  };

  const toggleReplyVisibility = (reviewId: string) => {
    setExpandedReplyReviewIds((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

  const updateReplyComment = (comment: string) => {
    setReplyForm((currentForm) => (currentForm ? { ...currentForm, comment } : currentForm));
  };

  const submitReply = async (review: MotorcycleReview) => {
    if (!user || !replyForm || replyForm.reviewId !== review.id || !reactionAuthContext) {
      return;
    }

    if (review.userId && user.id === review.userId) {
      showHelpfulTooltip(review.id, 'No puedes responder a tu propia review.');
      return;
    }

    setReplyForm((currentForm) => (currentForm && currentForm.reviewId === review.id ? { ...currentForm, isSubmitting: true } : currentForm));

    try {
      const newReply = await createReviewReply({ comment: replyForm.comment, reviewId: review.id, userName: profile?.displayName ?? undefined }, reactionAuthContext);
      setReplies((currentReplies) => ({
        ...currentReplies,
        [review.id]: [...(currentReplies[review.id] ?? []), newReply],
      }));
      setExpandedReplyReviewIds((prev) => ({ ...prev, [review.id]: true }));
      setReplyForm(null);

      const toastTicket = Date.now();
      setReplyToast({ message: 'Respuesta enviada. Quedará visible tras revisión.', reviewId: review.id, visible: true, ticket: toastTicket });
      replyToastTimeoutRef.current = setTimeout(() => {
        setReplyToast((current) => (current?.ticket === toastTicket ? { ...current, visible: false } : current));
        setTimeout(() => {
          setReplyToast((current) => (current?.ticket === toastTicket ? null : current));
        }, 300);
      }, 3000);
    } catch (error) {
      setReplyForm((currentForm) => (
        currentForm && currentForm.reviewId === review.id ? { ...currentForm, isSubmitting: false } : currentForm
      ));
      showHelpfulTooltip(review.id, error instanceof Error ? error.message : 'No se pudo enviar la respuesta.');
    }
  };

  if (!motorcycleId) {
    return <CommunityRootState />;
  }

  if (!bike) {
    return <NotFoundState motorcycleId={motorcycleId} />;
  }

  const bikeName = getBikeDisplayName(bike);
  const aggregate = getReviewAggregate(reviews);
  const a2Badge = getBikeA2Badge(bike);
  const starDistribution = getStarDistribution(reviews);
  const topPros = getTopCommunityItems(reviews, 'pros');
  const topCons = getTopCommunityItems(reviews, 'cons');
  const commonIssues = (bike.reliabilityReports?.commonIssues) ?? [];

  return (
    <main className="motorcycle-community" aria-labelledby="motorcycle-community-title">
      <header className="motorcycle-community__hero">
        <div className="motorcycle-community__hero-media" aria-hidden="true">
          <MotorcycleImage motorcycle={bike} decorative loading="eager" />
          <div aria-hidden="true" />
        </div>
        <div className="motorcycle-community__hero-content">
          <div>
            <div className="motorcycle-community__hero-badges">
              <span>{segmentLabels[bike.segment]}</span>
              <span>{a2Badge.label}</span>
              <span>{bike.year}</span>
            </div>
            <span className="motorcycle-community__eyebrow">Registro de propietarios</span>
            <h1 id="motorcycle-community-title">Reviews {bikeName}</h1>
            <p>Opiniones reales, problemas comunes y experiencia de propietarios de {bikeName}.</p>
          </div>
          <div className="motorcycle-community__hero-rating" aria-label="Resumen de rating">
            <strong>{aggregate.reviewCount > 0 ? formatReviewRating(aggregate.averageRating) : 'N/D'}</strong>
            <div>
              <RatingStars rating={Math.round(aggregate.averageRating)} />
              <span>{numberFormatter.format(aggregate.reviewCount)} reviews aprobadas</span>
            </div>
          </div>
        </div>
      </header>

      <section className="motorcycle-community__hero-actions" aria-label="Acciones de comunidad">
        <a className="button button--ghost" href={getBikeDetailHash(bike)}>
          Ver ficha
        </a>
        <a className="button button--ghost" href={getComparatorHashFromBikes([bike])}>
          Comparar esta moto
        </a>
        <button className="button button--ghost" type="button" onClick={() => setIsReviewModalOpen(true)}>
          Escribir review
        </button>
      </section>

      <section className="motorcycle-community__layout">
        <aside className="motorcycle-community__sidebar" aria-label="Resumen de comunidad">
          <OwnerReportsFiltersPanel
            filters={ownerReportFilters}
            isOpen={isOwnerReportFiltersOpen}
            onApply={() => setOwnerReportsPage(1)}
            onChange={updateOwnerReportFilters}
            onClose={() => setIsOwnerReportFiltersOpen(false)}
            onReset={clearOwnerReportFilters}
          />

          <section className="motorcycle-community__insights motorcycle-community__insights--sidebar" aria-labelledby="community-insights-title">
            <div>
              <span>ADN comunitario</span>
              <h2 id="community-insights-title">Problemas comunes e insights</h2>
            </div>
            {commonIssues.length > 0 || topPros.length > 0 || topCons.length > 0 ? (
              <div className="motorcycle-community__insight-grid">
                <article>
                  <h3>Problemas comunes</h3>
                  {commonIssues.length > 0 ? (
                    <ul>
                      {commonIssues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Datos comunitarios pendientes.</p>
                  )}
                </article>
                <article>
                  <h3>Pros agregados</h3>
                  {topPros.length > 0 ? (
                    <ul>
                      {topPros.map((item) => (
                        <li key={item.label}>{item.label}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{((bike.pros ?? []) as readonly string[]).length > 0 ? (bike.pros ?? []).join(' · ') : 'Datos comunitarios pendientes.'}</p>
                  )}
                </article>
                <article>
                  <h3>Contras agregados</h3>
                  {topCons.length > 0 ? (
                    <ul>
                      {topCons.map((item) => (
                        <li key={item.label}>{item.label}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{((bike.cons ?? []) as readonly string[]).length > 0 ? (bike.cons ?? []).join(' · ') : 'Datos comunitarios pendientes.'}</p>
                  )}
                </article>
              </div>
            ) : (
              <p className="motorcycle-community__pending">Datos comunitarios pendientes.</p>
            )}
          </section>

          <section className="motorcycle-community__panel motorcycle-community__panel--hud" aria-labelledby="community-score-title">
            <h2 id="community-score-title">Resumen comunidad</h2>
            <div className="motorcycle-community__metrics">
              {metrics.map((metric) => (
                <article key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  {metric.detail ? <small>{metric.detail}</small> : null}
                </article>
              ))}
            </div>
          </section>

          <section className="motorcycle-community__panel" aria-labelledby="community-distribution-title">
            <h2 id="community-distribution-title">Distribución rating</h2>
            <div className="motorcycle-community__distribution">
              {starDistribution.map(({ count, rating }) => (
                <div key={rating}>
                  <span>{rating}★</span>
                  <div aria-hidden="true">
                    <span style={{ width: reviews.length === 0 ? '0%' : `${(count / reviews.length) * 100}%` }} />
                  </div>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <div className="motorcycle-community__main">
          <section className="motorcycle-community__reviews" aria-labelledby="community-reviews-title">
            <div className="motorcycle-community__section-header">
              <div>
                <span>Reportes de propietarios</span>
                <h2 id="community-reviews-title">Experiencias de propietarios</h2>
              </div>
              <button className="motorcycle-community__mobile-filter-trigger" type="button" onClick={() => setIsOwnerReportFiltersOpen(true)}>
                <span className="material-symbols-outlined" aria-hidden="true">tune</span>
                Filtros
              </button>
            </div>

            {hasReviewError ? (
              <p className="motorcycle-community__notice" role="status">
                No se han podido cargar las reviews. Mostramos la comunidad vacía de forma segura.
              </p>
            ) : null}
            {reactionNotice ? (
              <p className="motorcycle-community__notice motorcycle-community__notice--reaction" role="status">
                {reactionNotice.message}
              </p>
            ) : null}

            {reviews.length > 0 ? (
              filteredOwnerReports.length > 0 ? (
                <>
                  <div className="motorcycle-community__owner-report-list" role="list" aria-label="Listado compacto de reviews">
                    {paginatedOwnerReports.map((review, index) => (
                      <OwnerReportRow
                        aspects={reviewAspects[review.id]}
                        feedbackTooltipMessage={helpfulTooltip?.reviewId === review.id ? helpfulTooltip.message : undefined}
                        feedbackTooltipVisible={helpfulTooltip?.reviewId === review.id ? helpfulTooltip.visible : false}
                        hasReported={Boolean(reportedReviewIds[review.id])}
                        index={(ownerReportsPage - 1) * OWNER_REPORTS_PER_PAGE + index}
                        isOwnReview={Boolean(user?.id && review.userId === user.id)}
                        isReportFormOpen={reportForm?.reviewId === review.id}
                        isReactionPending={reactionPendingIds.includes(review.id)}
                        key={review.id}
                        onCancelReport={() => setReportForm(null)}
                        onChangeReportComment={updateReportFormComment}
                        onChangeReportReason={updateReportFormReason}
                        onOpenReport={() => openReportForm(review)}
                        onSubmitReport={() => submitReport(review)}
                        onToggleHelpful={() => toggleHelpful(review)}
                        onToggleNotHelpful={() => toggleNotHelpful(review)}
                        replyForm={replyForm}
                        onCancelReply={cancelReplyForm}
                        onChangeReplyComment={updateReplyComment}
                        onOpenReply={() => openReplyForm(review)}
                        onSubmitReply={() => submitReply(review)}
                        replies={replies[review.id] ?? []}
                        replyToast={replyToast}
                        expandedReplyReviewIds={expandedReplyReviewIds}
                        onToggleReplyVisibility={toggleReplyVisibility}
                        reportForm={reportForm}
                        reactionSummary={reactionSummaries[review.id] ?? getDefaultReactionSummary(review.id)}
                        review={review}
                        user={user}
                      />
                    ))}
                  </div>
                  {ownerReportsTotalPages > 1 ? (
                    <AccountPagination
                      ariaLabel="Paginación de reviews"
                      className="motorcycle-community__pagination"
                      currentClassName="motorcycle-community__pagination-current"
                      currentPage={ownerReportsPage}
                      totalPages={ownerReportsTotalPages}
                      onPageChange={setOwnerReportsPage}
                    />
                  ) : null}
                </>
              ) : (
                <div className="motorcycle-community__empty motorcycle-community__empty--compact">
                  <span className="material-symbols-outlined" aria-hidden="true">filter_alt_off</span>
                  <h3>No hay reviews con esos filtros.</h3>
                  <p>Probá cambiar el rating o el orden para volver a ver experiencias de propietarios.</p>
                  {hasActiveOwnerFilters ? (
                    <button className="button button--primary" type="button" onClick={clearOwnerReportFilters}>
                      Limpiar filtros
                    </button>
                  ) : null}
                </div>
              )
            ) : (
              <div className="motorcycle-community__empty">
                <span className="material-symbols-outlined" aria-hidden="true">rate_review</span>
                <h3>Aún no hay reviews aprobadas para esta moto.</h3>
                <p>Sé el primero en escribir una review. Entrará en moderación antes de publicarse.</p>
                <button className="button button--primary" type="button" onClick={() => setIsReviewModalOpen(true)}>
                  Sé el primero en escribir una review
                </button>
              </div>
            )}
          </section>
        </div>
      </section>

      <ReviewModal isOpen={isReviewModalOpen} motorcycle={bike} onClose={() => setIsReviewModalOpen(false)} />
    </main>
  );
}
