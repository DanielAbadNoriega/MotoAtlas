import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import communityHeroImage from '../../../assets/hero-community.png';
import { useAuth } from '../../../features/auth';
import { AccountPagination } from '../AccountPage/AccountPagination';
import { AccountReviewsEmptyState } from '../AccountReviewsPage/AccountReviewsEmptyState';
import { MotorcycleGarageCard } from '../../motorcycles/MotorcycleGarageCard';
import {
  accountReviewRidingStyleLabels,
  getAccountReviewMotorcycleDisplay,
} from '../../reviews/AccountReviewCard';
import { FeaturedReviewCard } from '../../reviews/FeaturedReviewCard';
import {
  HelpfulReviewAction,
  NotHelpfulReviewAction,
  ReportReviewAction,
  ReviewReplySection,
  ReviewReportForm,
  type ReplyFormState,
  type ReplyToastState,
} from '../../reviews/ReviewCommunityActions';
import {
  getApprovedCommunityReviews,
  getReviewAspectsByReviewIds,
  type MotorcycleReview,
  type MotorcycleReviewAspect,
  type MotorcycleReviewRidingStyle,
} from '../../../services/motorcycleReviewService';
import {
  clearMyReviewReaction,
  getReviewReactionSummary,
  type ReviewReactionSummary,
} from '../../../services/reviewReactionService';
import { type ReviewReportReason } from '../../../services/reviewReportService';
import {
  createReviewReply,
  getRepliesByReviewId,
  type ReviewReply,
} from '../../../services/reviewReplyService';
import {
  matchesMotorcycleSegmentFilter,
  motorcycleLicenseFilterOptions,
  motorcycleSegmentFilterOptions,
  type MotorcycleSegmentFilterValue,
} from '../../../shared/filters/motorcycleFilterOptions';
import { segmentLabels, type BikeA2Status } from '../../../shared/motorcycles/motorcycleTaxonomy';
import {
  buildReviewAuthContext,
  isOwnReview,
  upsertReactionSummaryInList,
} from '../../../shared/reviews/reviewCommunityActions';
import { useReviewReports, type ReviewReportFormState } from '../../../shared/reviews/useReviewReports';
import { useReviewReactions } from '../../../shared/reviews/useReviewReactions';
import { getReviewAggregate } from '../../../shared/reviews/reviewUtils';
import './CommunityReviewsPage.scss';

type ReviewsStatus = 'idle' | 'loading' | 'success' | 'error';
type LicenseFilter = 'all' | BikeA2Status;
type RatingFilter = 'all' | '5' | '4-plus' | '3-minus';
type RidingStyleFilter = 'all' | MotorcycleReviewRidingStyle;
type SortOption = 'recent' | 'rating-desc' | 'reviews-desc' | 'kilometers-desc';

type CommunityReviewFilters = Readonly<{
  license: LicenseFilter;
  rating: RatingFilter;
  ridingStyle: RidingStyleFilter;
  search: string;
  segment: MotorcycleSegmentFilterValue;
  sort: SortOption;
}>;

type CommunityInsights = Readonly<{
  mostHelpfulReview?: Readonly<{
    helpfulCount: number;
    motorcycleName: string;
  }>;
  mostReviewedMotorcycle?: Readonly<{
    count: number;
    name: string;
  }>;
  topSegment?: Readonly<{
    count: number;
    label: string;
  }>;
  topRidingStyle?: Readonly<{
    count: number;
    label: string;
  }>;
}>;

type CommunityGarageMotorcycle = Readonly<{
  averageRating: number;
  hasDeclaredKilometers: boolean;
  latestReviewAt: string;
  motorcycle: ReturnType<typeof getAccountReviewMotorcycleDisplay>;
  motorcycleId: string;
  reviewCount: number;
  reviews: readonly MotorcycleReview[];
  topRidingStyle?: Readonly<{
    count: number;
    label: string;
    value: MotorcycleReviewRidingStyle;
  }>;
  totalKilometers: number;
}>;

const REVIEWS_PER_PAGE = 9;
const EDITORIAL_REVIEWS_LIMIT = 2;
const defaultFilters: CommunityReviewFilters = {
  license: 'all',
  rating: 'all',
  ridingStyle: 'all',
  search: '',
  segment: 'all',
  sort: 'recent',
};

const numberFormatter = new Intl.NumberFormat('es-ES');

const ratingOptions = [
  { ariaLabel: 'Todas las valoraciones', filledStars: 0, label: 'Todos', value: 'all' },
  { ariaLabel: '5 estrellas', filledStars: 5, label: '5 estrellas', value: '5' },
  { ariaLabel: '4 estrellas o más', filledStars: 4, label: '4 o más', value: '4-plus' },
  { ariaLabel: '3 estrellas o menos', filledStars: 3, label: '3 o menos', value: '3-minus' },
] satisfies readonly { ariaLabel: string; filledStars: number; label: string; value: RatingFilter }[];

const ridingStyleOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Ciudad', value: 'ciudad' },
  { label: 'Viaje', value: 'viaje' },
  { label: 'Offroad', value: 'offroad' },
  { label: 'Deportivo', value: 'deportivo' },
  { label: 'Pasajero', value: 'pasajero' },
  { label: 'Diario', value: 'diario' },
] satisfies readonly { label: string; value: RidingStyleFilter }[];

const sortOptions = [
  { label: 'Más recientes', value: 'recent' },
  { label: 'Mejor valoradas', value: 'rating-desc' },
  { label: 'Más reviews', value: 'reviews-desc' },
  { label: 'Más kilómetros', value: 'kilometers-desc' },
] satisfies readonly { label: string; value: SortOption }[];

function getTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function matchesRatingValue(value: number, rating: RatingFilter) {
  if (rating === '5') {
    return value === 5;
  }

  if (rating === '4-plus') {
    return value >= 4;
  }

  if (rating === '3-minus') {
    return value <= 3;
  }

  return true;
}

function sortReviews(reviews: readonly MotorcycleReview[], sort: SortOption) {
  return [...reviews].sort((left, right) => {
    if (sort === 'rating-desc') {
      return right.rating - left.rating || getTimestamp(right.createdAt) - getTimestamp(left.createdAt);
    }

    if (sort === 'kilometers-desc') {
      return (right.kilometers ?? -1) - (left.kilometers ?? -1) || getTimestamp(right.createdAt) - getTimestamp(left.createdAt);
    }

    return getTimestamp(right.createdAt) - getTimestamp(left.createdAt);
  });
}

function getApprovedReviews(reviews: readonly MotorcycleReview[]) {
  return reviews.filter((review) => review.status === 'approved');
}

function takeUniqueMotorcycleReviews<T extends { motorcycleId: string }>(
  reviews: readonly T[],
  limit: number,
): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const review of reviews) {
    if (!seen.has(review.motorcycleId)) {
      seen.add(review.motorcycleId);
      unique.push(review);
      if (unique.length === limit) return unique;
    }
  }

  if (unique.length < limit) {
    for (const review of reviews) {
      if (!unique.includes(review)) {
        unique.push(review);
        if (unique.length === limit) return unique;
      }
    }
  }

  return unique;
}

function getFeaturedReviews(
  reviews: readonly MotorcycleReview[],
  helpfulCountByReviewId: ReadonlyMap<string, number>,
) {
  const sorted = [...reviews].sort((left, right) => (
    (helpfulCountByReviewId.get(right.id) ?? 0) - (helpfulCountByReviewId.get(left.id) ?? 0) ||
    right.rating - left.rating ||
    right.comment.length - left.comment.length ||
    getTimestamp(right.createdAt) - getTimestamp(left.createdAt)
  ));
  return takeUniqueMotorcycleReviews(sorted, EDITORIAL_REVIEWS_LIMIT);
}

function getLatestReviews(reviews: readonly MotorcycleReview[]) {
  const sorted = sortReviews(reviews, 'recent');
  return takeUniqueMotorcycleReviews(sorted, EDITORIAL_REVIEWS_LIMIT);
}

function getTopRidingStyle(reviews: readonly MotorcycleReview[]) {
  const counts = new Map<MotorcycleReviewRidingStyle, number>();

  reviews.forEach((review) => {
    counts.set(review.ridingStyle, (counts.get(review.ridingStyle) ?? 0) + 1);
  });

  const topEntry = [...counts.entries()].sort((left, right) => (
    right[1] - left[1] ||
    accountReviewRidingStyleLabels[left[0]].localeCompare(accountReviewRidingStyleLabels[right[0]])
  ))[0];

  return topEntry
    ? {
        count: topEntry[1],
        label: accountReviewRidingStyleLabels[topEntry[0]],
        value: topEntry[0],
      }
    : undefined;
}

function buildCommunityGarage(reviews: readonly MotorcycleReview[]): readonly CommunityGarageMotorcycle[] {
  const reviewsByMotorcycle = new Map<string, MotorcycleReview[]>();

  reviews.forEach((review) => {
    const currentReviews = reviewsByMotorcycle.get(review.motorcycleId) ?? [];
    currentReviews.push(review);
    reviewsByMotorcycle.set(review.motorcycleId, currentReviews);
  });

  return [...reviewsByMotorcycle.entries()].map(([motorcycleId, motorcycleReviews]) => {
    const sortedByLatest = sortReviews(motorcycleReviews, 'recent');
    const referenceReview = sortedByLatest.find((review) => review.motorcycle) ?? sortedByLatest[0]!;
    const aggregate = getReviewAggregate(motorcycleReviews);
    const totalKilometers = motorcycleReviews.reduce((sum, review) => sum + (review.kilometers ?? 0), 0);
    const hasDeclaredKilometers = motorcycleReviews.some((review) => review.kilometers !== null);

    return {
      averageRating: aggregate.averageRating,
      hasDeclaredKilometers,
      latestReviewAt: sortedByLatest[0]?.createdAt ?? '',
      motorcycle: getAccountReviewMotorcycleDisplay(referenceReview),
      motorcycleId,
      reviewCount: aggregate.reviewCount,
      reviews: motorcycleReviews,
      topRidingStyle: getTopRidingStyle(motorcycleReviews),
      totalKilometers,
    };
  });
}

function getCommunityInsights(
  reviews: readonly MotorcycleReview[],
  helpfulCountByReviewId: ReadonlyMap<string, number>,
): CommunityInsights {
  if (reviews.length === 0) {
    return {};
  }

  const motorcycleCounts = new Map<string, { count: number; latestTimestamp: number; name: string }>();
  const ridingStyleCounts = new Map<MotorcycleReviewRidingStyle, number>();
  const segmentCounts = new Map<string, { count: number; label: string }>();

  reviews.forEach((review) => {
    const motorcycle = getAccountReviewMotorcycleDisplay(review);
    const currentMotorcycle = motorcycleCounts.get(review.motorcycleId);
    const currentTimestamp = getTimestamp(review.createdAt);

    motorcycleCounts.set(review.motorcycleId, {
      count: (currentMotorcycle?.count ?? 0) + 1,
      latestTimestamp: Math.max(currentMotorcycle?.latestTimestamp ?? 0, currentTimestamp),
      name: currentMotorcycle?.name ?? motorcycle.name,
    });

    ridingStyleCounts.set(review.ridingStyle, (ridingStyleCounts.get(review.ridingStyle) ?? 0) + 1);

    const motorcycleSegment = review.motorcycle?.segment;
    if (motorcycleSegment && Object.prototype.hasOwnProperty.call(segmentLabels, motorcycleSegment)) {
      const currentSegment = segmentCounts.get(motorcycleSegment);
      segmentCounts.set(motorcycleSegment, {
        count: (currentSegment?.count ?? 0) + 1,
        label: segmentLabels[motorcycleSegment],
      });
    }
  });

  const mostReviewedMotorcycle = [...motorcycleCounts.values()].sort((left, right) => (
    right.count - left.count ||
    right.latestTimestamp - left.latestTimestamp ||
    left.name.localeCompare(right.name)
  ))[0];
  const topRidingStyleEntry = [...ridingStyleCounts.entries()].sort((left, right) => (
    right[1] - left[1] ||
    accountReviewRidingStyleLabels[left[0]].localeCompare(accountReviewRidingStyleLabels[right[0]])
  ))[0];
  const mostHelpfulReviewEntry = [...reviews]
    .map((review) => ({
      helpfulCount: helpfulCountByReviewId.get(review.id) ?? 0,
      motorcycleName: getAccountReviewMotorcycleDisplay(review).name,
      rating: review.rating,
      timestamp: getTimestamp(review.createdAt),
    }))
    .filter((review) => review.helpfulCount > 0)
    .sort((left, right) => (
      right.helpfulCount - left.helpfulCount ||
      right.rating - left.rating ||
      right.timestamp - left.timestamp ||
      left.motorcycleName.localeCompare(right.motorcycleName)
    ))[0];
  const topSegmentEntry = [...segmentCounts.values()].sort((left, right) => (
    right.count - left.count ||
    left.label.localeCompare(right.label)
  ))[0];

  return {
    mostHelpfulReview: mostHelpfulReviewEntry
      ? { helpfulCount: mostHelpfulReviewEntry.helpfulCount, motorcycleName: mostHelpfulReviewEntry.motorcycleName }
      : undefined,
    mostReviewedMotorcycle: mostReviewedMotorcycle
      ? { count: mostReviewedMotorcycle.count, name: mostReviewedMotorcycle.name }
      : undefined,
    topSegment: topSegmentEntry
      ? { count: topSegmentEntry.count, label: topSegmentEntry.label }
      : undefined,
    topRidingStyle: topRidingStyleEntry
      ? { count: topRidingStyleEntry[1], label: accountReviewRidingStyleLabels[topRidingStyleEntry[0]] }
      : undefined,
  };
}

function filterGarageMotorcycles(motorcycles: readonly CommunityGarageMotorcycle[], filters: CommunityReviewFilters) {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return motorcycles.filter((item) => {
    const matchesSearch = !normalizedSearch || item.motorcycle.searchText.includes(normalizedSearch);
    const matchesSegmentFilter = matchesMotorcycleSegmentFilter(item.motorcycle.segment, filters.segment);
    const matchesLicense = filters.license === 'all' || item.motorcycle.a2Status === filters.license;
    const matchesRidingStyle = filters.ridingStyle === 'all' || item.topRidingStyle?.value === filters.ridingStyle;

    return matchesSearch && matchesSegmentFilter && matchesLicense && matchesRatingValue(item.averageRating, filters.rating) && matchesRidingStyle;
  });
}

function sortGarageMotorcycles(motorcycles: readonly CommunityGarageMotorcycle[], sort: SortOption) {
  return [...motorcycles].sort((left, right) => {
    if (sort === 'rating-desc') {
      return right.averageRating - left.averageRating || right.reviewCount - left.reviewCount || getTimestamp(right.latestReviewAt) - getTimestamp(left.latestReviewAt);
    }

    if (sort === 'reviews-desc') {
      return right.reviewCount - left.reviewCount || right.averageRating - left.averageRating || getTimestamp(right.latestReviewAt) - getTimestamp(left.latestReviewAt);
    }

    if (sort === 'kilometers-desc') {
      return right.totalKilometers - left.totalKilometers || getTimestamp(right.latestReviewAt) - getTimestamp(left.latestReviewAt);
    }

    return getTimestamp(right.latestReviewAt) - getTimestamp(left.latestReviewAt) || right.reviewCount - left.reviewCount;
  });
}

function hasActiveFilters(filters: CommunityReviewFilters) {
  return (
    Boolean(filters.search.trim()) ||
    filters.segment !== defaultFilters.segment ||
    filters.license !== defaultFilters.license ||
    filters.rating !== defaultFilters.rating ||
    filters.ridingStyle !== defaultFilters.ridingStyle ||
    filters.sort !== defaultFilters.sort
  );
}

function ReviewSkeletonList() {
  return (
    <div className="community-reviews-page__garage-grid" aria-label="Cargando modelos de comunidad">
      {Array.from({ length: 3 }, (_, index) => (
        <article className="community-reviews-page__skeleton-card" key={index} role="status">
          <div />
          <div>
            <span />
            <span />
            <span />
          </div>
        </article>
      ))}
    </div>
  );
}
function EditorialReviewSection({
  emptyMessage,
  id,
  reactionSummaryByReviewId,
  reviews,
  title,
  tone,
  aspectsByReviewId,
  onToggleHelpful,
  onToggleNotHelpful,
  reactionPendingIds,
  userId,
  hasReactionAuth,
  reportedReviewIds,
  reportForm,
  reportPendingIds,
  onOpenReport,
  onCancelReport,
  onChangeReportReason,
  onChangeReportComment,
  onSubmitReport,
  replies,
  replyForm,
  replyToast,
  expandedReplyReviewIds,
  user,
  onOpenReply,
  onCancelReply,
  onChangeReplyComment,
  onSubmitReply,
  onToggleReplyVisibility,
}: Readonly<{
  emptyMessage: string;
  id: string;
  reactionSummaryByReviewId: ReadonlyMap<string, ReviewReactionSummary>;
  reviews: readonly MotorcycleReview[];
  title: string;
  tone: 'featured' | 'latest';
  aspectsByReviewId: ReadonlyMap<string, readonly MotorcycleReviewAspect[]>;
  onToggleHelpful: (review: MotorcycleReview) => void;
  onToggleNotHelpful: (review: MotorcycleReview) => void;
  reactionPendingIds: readonly string[];
  userId: string | null;
  hasReactionAuth: boolean;
  reportedReviewIds: Record<string, boolean>;
  reportForm: ReviewReportFormState | null;
  reportPendingIds: readonly string[];
  onOpenReport: (review: MotorcycleReview) => void;
  onCancelReport: () => void;
  onChangeReportReason: (reason: ReviewReportReason) => void;
  onChangeReportComment: (comment: string) => void;
  onSubmitReport: (review: MotorcycleReview) => void;
  replies: Record<string, readonly ReviewReply[]>;
  replyForm: ReplyFormState | null;
  replyToast: ReplyToastState | null;
  expandedReplyReviewIds: Record<string, boolean>;
  user: ReturnType<typeof useAuth>['user'];
  onOpenReply: (review: MotorcycleReview) => void;
  onCancelReply: () => void;
  onChangeReplyComment: (comment: string) => void;
  onSubmitReply: (review: MotorcycleReview) => void;
  onToggleReplyVisibility?: (reviewId: string) => void;
  visibleRepliesCount?: Record<string, number>;
}>)
{
  const sectionClasses = [
    'community-reviews-page__editorial-section',
    `community-reviews-page__editorial-section--${tone}`,
  ].join(' ');

  return (
    <section className={sectionClasses} aria-labelledby={id}>
      <header className="community-reviews-page__editorial-header">
        <h2 id={id}>{title}</h2>
      </header>

      {reviews.length === 0 ? (
        <p className="community-reviews-page__editorial-empty">{emptyMessage}</p>
      ) : (
        <div className="community-reviews-page__editorial-list">
          {reviews.map((review) => {
            const summary = reactionSummaryByReviewId.get(review.id);
            const isPending = reactionPendingIds.includes(review.id);
            const isOwn = isOwnReview(review, userId);
            const hasReported = Boolean(reportedReviewIds[review.id]);
            const isReplyFormOpen = replyForm?.reviewId === review.id;
            const reviewReplies = replies[review.id] ?? [];
            const visibleRepliesCount = reviewReplies.filter(
              (r) => r.status === 'approved' || (r.status === 'pending' && user?.id === r.userId),
            ).length;
            const isRepliesExpanded = Boolean(expandedReplyReviewIds[review.id]);
            const canInteractHelpful = hasReactionAuth && !isOwn && !hasReported;
            return (
              <FeaturedReviewCard
                headingLevel={3}
                isOwnReview={isOwn}
                key={review.id}
                review={review}
                aspects={aspectsByReviewId.get(review.id)}
                actionsSlot={(
                  <>
                    <HelpfulReviewAction
                      isBlocked={!canInteractHelpful}
                      isOwnReview={isOwn}
                      isPending={isPending}
                      onToggle={() => onToggleHelpful(review)}
                      summary={summary ?? { helpfulCount: 0, hasReactedHelpful: false, hasReactedNotHelpful: false, reviewId: review.id }}
                    />
                    {hasReactionAuth ? (
                      <NotHelpfulReviewAction
                        isBlocked={hasReported}
                        isOwnReview={isOwn}
                        isPending={isPending}
                        onToggle={() => onToggleNotHelpful(review)}
                        summary={summary ?? { helpfulCount: 0, hasReactedHelpful: false, hasReactedNotHelpful: false, reviewId: review.id }}
                      />
                    ) : null}
                    {hasReactionAuth ? (
                      <ReportReviewAction
                        hasReported={hasReported}
                        isOwnReview={isOwn}
                        isPending={reportPendingIds.includes(review.id)}
                        onOpen={() => onOpenReport(review)}
                      />
                    ) : null}
                    {hasReactionAuth && user && !isReplyFormOpen && !isOwn ? (
                      <button
                        className="motorcycle-community__helpful-action motorcycle-community__reply-trigger"
                        onClick={() => onOpenReply(review)}
                        type="button"
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">reply</span>
                        Responder
                      </button>
                    ) : null}
                    {visibleRepliesCount > 0 ? (
                      <button
                        className="motorcycle-community__helpful-action"
                        onClick={() => onToggleReplyVisibility?.(review.id)}
                        aria-expanded={isRepliesExpanded}
                        aria-controls={`reply-list-${review.id}`}
                        type="button"
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">forum</span>
                        {isRepliesExpanded
                          ? `Ocultar ${visibleRepliesCount} ${visibleRepliesCount === 1 ? 'respuesta' : 'respuestas'}`
                          : `Ver ${visibleRepliesCount} ${visibleRepliesCount === 1 ? 'respuesta' : 'respuestas'}`}
                      </button>
                    ) : null}
                  </>
                )}
                footerContentSlot={
                  <ReviewReplySection
                    onCancelReply={onCancelReply}
                    onChangeReplyComment={onChangeReplyComment}
                    onSubmitReply={() => onSubmitReply(review)}
                    replies={reviewReplies}
                    replyForm={replyForm}
                    replyToast={replyToast}
                    review={review}
                    user={user}
                    expanded={isRepliesExpanded}
                    isExpanded={true}
                    inline={true}
                    showActions={false}
                  />
                }
                reportContentSlot={
                  hasReactionAuth && reportForm?.reviewId === review.id ? (
                    <ReviewReportForm
                      comment={reportForm.comment}
                      isSubmitting={reportForm.isSubmitting}
                      onCancel={onCancelReport}
                      onCommentChange={onChangeReportComment}
                      onReasonChange={onChangeReportReason}
                      onSubmit={() => onSubmitReport(review)}
                      reason={reportForm.reason}
                      reviewId={reportForm.reviewId}
                    />
                  ) : null
                }
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function InsightValue({ children }: Readonly<{ children?: ReactNode }>) {
  return <strong className="community-reviews-page__insight-value">{children || 'Sin datos suficientes'}</strong>;
}

function CommunityInsightItem({
  icon,
  label,
  meta,
  value,
}: Readonly<{
  icon: string;
  label: string;
  meta: string;
  value?: ReactNode;
}>) {
  return (
    <article className="community-reviews-page__insight-item">
      <span className="community-reviews-page__insight-icon material-symbols-outlined" aria-hidden="true">{icon}</span>
      <div className="community-reviews-page__insight-content">
        <span className="community-reviews-page__insight-label">{label}</span>
        <InsightValue>{value}</InsightValue>
        <p>{meta}</p>
      </div>
    </article>
  );
}

function formatLastRefreshed(timestamp: number): string {
  if (!timestamp) {
    return '';
  }
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) {
    return 'Actualizado ahora';
  }
  if (seconds < 60) {
    return `Actualizado hace ${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  return `Actualizado hace ${minutes}min`;
}

function getMostReviewedInsightMeta(mostReviewedMotorcycle: CommunityInsights['mostReviewedMotorcycle']) {
  if (!mostReviewedMotorcycle) {
    return 'Sin datos suficientes';
  }

  return `${numberFormatter.format(mostReviewedMotorcycle.count)} reviews`;
}

function getMostHelpfulInsightMeta(mostHelpfulReview: CommunityInsights['mostHelpfulReview']) {
  if (!mostHelpfulReview) {
    return 'Sin votos útiles todavía';
  }

  return `${numberFormatter.format(mostHelpfulReview.helpfulCount)} votos útiles`;
}

function getTopSegmentInsightMeta(topSegment: CommunityInsights['topSegment']) {
  if (!topSegment) {
    return 'Sin datos suficientes';
  }

  return `${numberFormatter.format(topSegment.count)} reviews`;
}

function getTopRidingStyleInsightMeta(topRidingStyle: CommunityInsights['topRidingStyle']) {
  if (!topRidingStyle) {
    return 'Sin datos suficientes';
  }

  return `${numberFormatter.format(topRidingStyle.count)} reviews`;
}

function CommunityInsightsPanel({ insights, lastRefreshedAt }: Readonly<{ insights: CommunityInsights; lastRefreshedAt: number }>) {
  const refreshLabel = formatLastRefreshed(lastRefreshedAt);

  return (
    <aside className="community-reviews-page__insights" aria-labelledby="community-reviews-insights-title">
      <header className="community-reviews-page__insights-header">
        <span className="community-reviews-page__insights-kicker">Lectura rápida</span>
        <h2 id="community-reviews-insights-title">
          <span className="material-symbols-outlined" aria-hidden="true">monitoring</span>
          Insights en vivo
        </h2>
      </header>

      <div className="community-reviews-page__insight-list">
        <CommunityInsightItem
          icon="forum"
          label="Moto más comentada"
          value={insights.mostReviewedMotorcycle?.name}
          meta={getMostReviewedInsightMeta(insights.mostReviewedMotorcycle)}
        />

        <CommunityInsightItem
          icon="thumb_up"
          label="Review más útil"
          value={insights.mostHelpfulReview?.motorcycleName}
          meta={getMostHelpfulInsightMeta(insights.mostHelpfulReview)}
        />

        <CommunityInsightItem
          icon="category"
          label="Segmento más activo"
          value={insights.topSegment?.label}
          meta={getTopSegmentInsightMeta(insights.topSegment)}
        />

        <CommunityInsightItem
          icon="route"
          label="Uso más activo"
          value={insights.topRidingStyle?.label}
          meta={getTopRidingStyleInsightMeta(insights.topRidingStyle)}
        />
      </div>

      {refreshLabel ? (
        <footer className="community-reviews-page__insights-refresh">
          <span>{refreshLabel}</span>
        </footer>
      ) : null}
    </aside>
  );
}

function FilterGroup({ children, title }: Readonly<{ children: ReactNode; title: string }>) {
  return (
    <details className="community-reviews-page__filter-group" open>
      <summary>
        <span>{title}</span>
        <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
      </summary>
      <div className="community-reviews-page__filter-group-body">{children}</div>
    </details>
  );
}

function FilterOptionButton({
  active,
  ariaLabel,
  children,
  className = '',
  icon,
  label,
  onClick,
}: Readonly<{
  active: boolean;
  ariaLabel: string;
  children?: ReactNode;
  className?: string;
  icon?: string;
  label: string;
  onClick: () => void;
}>) {
  const buttonClasses = ['community-reviews-page__filter-option', active ? 'community-reviews-page__filter-option--active' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={buttonClasses} type="button" aria-label={ariaLabel} aria-pressed={active} onClick={onClick}>
      {icon ? <span className="material-symbols-outlined" aria-hidden="true">{icon}</span> : null}
      <span>{label}</span>
      {children}
    </button>
  );
}

function RatingStars({ filledStars }: Readonly<{ filledStars: number }>) {
  return (
    <span className="community-reviews-page__filter-stars" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <span className={index < filledStars ? 'community-reviews-page__filter-star--filled' : undefined} key={index}>star</span>
      ))}
    </span>
  );
}

function CommunityReviewFiltersPanel({
  filters,
  isOpen,
  onApply,
  onChange,
  onClose,
  onReset,
}: Readonly<{
  filters: CommunityReviewFilters;
  isOpen: boolean;
  onApply: () => void;
  onChange: (next: Partial<CommunityReviewFilters>) => void;
  onClose: () => void;
  onReset: () => void;
}>) {
  const panelClasses = ['community-reviews-page__filters', isOpen ? 'community-reviews-page__filters--open' : ''].filter(Boolean).join(' ');

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
      {isOpen ? <button className="community-reviews-page__filters-backdrop" type="button" onClick={onClose} aria-label="Cerrar filtros" /> : null}
      <aside
        className={panelClasses}
        aria-label="Filtros de reviews"
        aria-labelledby="community-reviews-filters-title"
        aria-modal={isOpen ? 'true' : undefined}
        role={isOpen ? 'dialog' : undefined}
      >
        <div className="community-reviews-page__sheet-handle" aria-hidden="true" />
        <div className="community-reviews-page__filters-header">
          <h2 id="community-reviews-filters-title">Filtros</h2>
          <button type="button" aria-label="Limpiar filtros de reviews" onClick={onReset}>Limpiar filtros</button>
          <button className="community-reviews-page__filters-close" type="button" onClick={onClose} aria-label="Cerrar filtros">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="community-reviews-page__filters-body">
          <label className="community-reviews-page__search" htmlFor="community-reviews-search">
            Buscar por marca o modelo
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
            <input
              id="community-reviews-search"
              type="search"
              value={filters.search}
              onChange={(event) => onChange({ search: event.target.value })}
              placeholder="BMW, Tuareg, MT-09..."
            />
          </label>

          <FilterGroup title="Segmento">
            <div className="community-reviews-page__segment-grid">
              {motorcycleSegmentFilterOptions.map((option) => (
                <FilterOptionButton
                  active={filters.segment === option.value}
                  ariaLabel={`Segmento: ${option.label}`}
                  icon={option.icon}
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ segment: option.value })}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Carnet">
            <div className="community-reviews-page__pill-list">
              {motorcycleLicenseFilterOptions.map((option) => (
                <FilterOptionButton
                  active={filters.license === option.value}
                  ariaLabel={option.label}
                  className="community-reviews-page__filter-option--pill"
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ license: filters.license === option.value ? 'all' : option.value })}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Rating">
            <div className="community-reviews-page__rating-grid">
              {ratingOptions.map((option) => (
                <FilterOptionButton
                  active={filters.rating === option.value}
                  ariaLabel={option.ariaLabel}
                  className="community-reviews-page__filter-option--rating"
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ rating: option.value })}
                >
                  <RatingStars filledStars={option.filledStars} />
                </FilterOptionButton>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Uso principal">
            <div className="community-reviews-page__pill-list">
              {ridingStyleOptions.map((option) => (
                <FilterOptionButton
                  active={filters.ridingStyle === option.value}
                  ariaLabel={`Uso principal: ${option.label}`}
                  className="community-reviews-page__filter-option--pill"
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ ridingStyle: option.value })}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Orden">
            <div className="community-reviews-page__sort-grid">
              {sortOptions.map((option) => (
                <FilterOptionButton
                  active={filters.sort === option.value}
                  ariaLabel={`Orden: ${option.label}`}
                  className="community-reviews-page__filter-option--sort"
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ sort: option.value })}
                />
              ))}
            </div>
          </FilterGroup>
        </div>

        <footer className="community-reviews-page__filters-footer">
          <button type="button" aria-label="Restablecer filtros de reviews" onClick={onReset}>Limpiar filtros</button>
          <button type="button" onClick={applyFilters}>Aplicar filtros</button>
        </footer>
      </aside>
    </>
  );
}

export function CommunityReviewsPage() {
  const { isAuthenticated, profile, session, user } = useAuth();
  const [reviews, setReviews] = useState<readonly MotorcycleReview[]>([]);
  const [status, setStatus] = useState<ReviewsStatus>('idle');
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<CommunityReviewFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number>(0);
  const [reactionSummaries, setReactionSummaries] = useState<readonly ReviewReactionSummary[]>([]);
  const [aspectSummaries, setAspectSummaries] = useState<readonly MotorcycleReviewAspect[]>([]);
  const [replies, setReplies] = useState<Record<string, readonly ReviewReply[]>>({});
  const [replyForm, setReplyForm] = useState<ReplyFormState | null>(null);
  const [replyPendingIds, setReplyPendingIds] = useState<readonly string[]>([]);
  const [expandedReplyReviewIds, setExpandedReplyReviewIds] = useState<Record<string, boolean>>({});
  const [replyToast, setReplyToast] = useState<ReplyToastState | null>(null);
  const replyToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loadedReplyReviewIds, setLoadedReplyReviewIds] = useState<ReadonlySet<string>>(new Set());

  const reactionAuthContext = buildReviewAuthContext({
    accessToken: session?.access_token,
    isAuthenticated,
    userId: user?.id,
  });

  const loadReviews = () => {
    setStatus('loading');
    setError('');

    getApprovedCommunityReviews()
      .then((nextReviews) => {
        const approved = nextReviews.filter((review) => review.status === 'approved');
        setReviews(approved);
        setStatus('success');
        setLastRefreshedAt(Date.now());
        return approved;
      })
      .then((approved) => {
        const reviewIds = approved.map((r) => r.id);
        return Promise.all([
          getReviewReactionSummary(reviewIds),
          getReviewAspectsByReviewIds(reviewIds),
        ]) as Promise<[readonly ReviewReactionSummary[], readonly MotorcycleReviewAspect[]]>;
      })
      .then(([reactions, aspects]) => {
        setReactionSummaries(reactions);
        setAspectSummaries(aspects);
      })
      .catch((reviewsError) => {
        setReviews([]);
        setError(reviewsError instanceof Error ? reviewsError.message : 'No se han podido cargar las reviews de comunidad.');
        setStatus('error');
      });
  };

  const silentLoadReviews = () => {
    getApprovedCommunityReviews()
      .then((nextReviews) => {
        const approved = nextReviews.filter((review) => review.status === 'approved');
        setReviews(approved);
        setLastRefreshedAt(Date.now());
        return approved;
      })
      .then((approved) => {
        const reviewIds = approved.map((r) => r.id);
        return Promise.all([
          getReviewReactionSummary(reviewIds),
          getReviewAspectsByReviewIds(reviewIds),
        ]) as Promise<[readonly ReviewReactionSummary[], readonly MotorcycleReviewAspect[]]>;
      })
      .then(([reactions, aspects]) => {
        setReactionSummaries(reactions);
        setAspectSummaries(aspects);
      })
      .catch(() => {
      });
  };

  useEffect(() => {
    let isMounted = true;
    setStatus('loading');
    setError('');

    getApprovedCommunityReviews()
      .then((nextReviews) => {
        if (!isMounted) return;
        const approved = nextReviews.filter((review) => review.status === 'approved');
        setReviews(approved);
        setStatus('success');
        setLastRefreshedAt(Date.now());
        return approved;
      })
      .then((approved) => {
        if (!isMounted || !approved) return undefined;
        const reviewIds = approved.map((r) => r.id);
        return Promise.all([
          getReviewReactionSummary(reviewIds),
          getReviewAspectsByReviewIds(reviewIds),
        ]) as Promise<[readonly ReviewReactionSummary[], readonly MotorcycleReviewAspect[]]>;
      })
      .then((result) => {
        if (!isMounted || !result) return;
        const [reactions, aspects] = result;
        setReactionSummaries(reactions);
        setAspectSummaries(aspects);
      })
      .catch((reviewsError) => {
        if (!isMounted) return;
        setReviews([]);
        setError(reviewsError instanceof Error ? reviewsError.message : 'No se han podido cargar las reviews de comunidad.');
        setStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(silentLoadReviews, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const approvedReviews = useMemo(() => getApprovedReviews(reviews), [reviews]);
  const helpfulCountByReviewId = useMemo(() => {
    const map = new Map<string, number>();
    reactionSummaries.forEach((s) => map.set(s.reviewId, s.helpfulCount));
    return map;
  }, [reactionSummaries]);
  const reactionSummaryByReviewId = useMemo(() => {
    const map = new Map<string, ReviewReactionSummary>();
    reactionSummaries.forEach((s) => map.set(s.reviewId, s));
    return map;
  }, [reactionSummaries]);
  const aspectByReviewId = useMemo(() => {
    const map = new Map<string, readonly MotorcycleReviewAspect[]>();
    aspectSummaries.forEach((a) => {
      const existing = map.get(a.reviewId) ?? [];
      map.set(a.reviewId, [...existing, a]);
    });
    return map as ReadonlyMap<string, readonly MotorcycleReviewAspect[]>;
  }, [aspectSummaries]);
  const visibleRepliesCountByReviewId = useMemo(() => {
    const map = new Map<string, number>();
    for (const [reviewId, reviewReplies] of Object.entries(replies)) {
      if (!reviewReplies) continue;
      const count = reviewReplies.filter(
        (r) => r.status === 'approved' || (r.status === 'pending' && user?.id === r.userId),
      ).length;
      map.set(reviewId, count);
    }
    return map;
  }, [replies, user?.id]);
  const featuredReviews = useMemo(
    () => getFeaturedReviews(approvedReviews, helpfulCountByReviewId),
    [approvedReviews, helpfulCountByReviewId],
  );
  const latestReviews = useMemo(() => getLatestReviews(approvedReviews), [approvedReviews]);
  const editorialReviewIds = useMemo(() => {
    return Array.from(new Set([...featuredReviews, ...latestReviews].map((review) => review.id)));
  }, [featuredReviews, latestReviews]);
  const communityInsights = useMemo(
    () => getCommunityInsights(approvedReviews, helpfulCountByReviewId),
    [approvedReviews, helpfulCountByReviewId],
  );
  const garageMotorcycles = useMemo(() => buildCommunityGarage(approvedReviews), [approvedReviews]);
  const filteredGarageMotorcycles = useMemo(
    () => sortGarageMotorcycles(filterGarageMotorcycles(garageMotorcycles, filters), filters.sort),
    [filters, garageMotorcycles],
  );
  const totalPages = Math.max(1, Math.ceil(filteredGarageMotorcycles.length / REVIEWS_PER_PAGE));
  const paginatedGarageMotorcycles = filteredGarageMotorcycles.slice((currentPage - 1) * REVIEWS_PER_PAGE, currentPage * REVIEWS_PER_PAGE);
  const activeFilters = hasActiveFilters(filters);

  const clearReactionAfterReport = async ({
    authContext,
    reviewId,
  }: Readonly<{
    authContext: NonNullable<typeof reactionAuthContext>;
    reviewId: string;
  }>) => {
    try {
      const cleanedSummary = await clearMyReviewReaction(reviewId, authContext);
      setReactionSummaries((currentSummaries) => upsertReactionSummaryInList(currentSummaries, cleanedSummary));
    } catch {
    }
  };

  const {
    reportedReviewIds,
    reportForm,
    reportPendingIds,
    openReportForm,
    cancelReportForm,
    updateReportReason: updateReportFormReason,
    updateReportComment: updateReportFormComment,
    submitReport,
  } = useReviewReports({
    authContext: reactionAuthContext,
    onClearReactionAfterReport: clearReactionAfterReport,
    reviewIds: editorialReviewIds,
    userId: user?.id,
  });

  const {
    reactionPendingIds,
    toggleHelpful: toggleHelpfulReactionForReview,
    toggleNotHelpful: toggleNotHelpfulReactionForReview,
  } = useReviewReactions({
    authContext: reactionAuthContext,
    isReported: (reviewId) => Boolean(reportedReviewIds[reviewId]),
    userId: user?.id,
  });

  const updateFilters = (next: Partial<CommunityReviewFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  const scrollToReviews = () => {
    document.getElementById('community-reviews-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToGarageHeader = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById('community-reviews-garage-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleHelpful = async (review: MotorcycleReview) => {
    const outcome = await toggleHelpfulReactionForReview(review);
    if (outcome.outcome === 'success') {
      setReactionSummaries((currentSummaries) => upsertReactionSummaryInList(currentSummaries, outcome.summary));
    }
  };

  const toggleNotHelpful = async (review: MotorcycleReview) => {
    const outcome = await toggleNotHelpfulReactionForReview(review);
    if (outcome.outcome === 'success') {
      setReactionSummaries((currentSummaries) => upsertReactionSummaryInList(currentSummaries, outcome.summary));
    }
  };

  const openReplyForm = (review: MotorcycleReview) => {
    if (!user) {
      return;
    }

    if (!reactionAuthContext) {
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
    }
  };

  useEffect(() => {
    const idsToLoad = editorialReviewIds.filter((id) => !loadedReplyReviewIds.has(id));

    if (idsToLoad.length === 0) {
      return undefined;
    }

    if (!reactionAuthContext) {
      return undefined;
    }

    let isMounted = true;

    void (async () => {
      const results = await Promise.allSettled(
        idsToLoad.map(async (reviewId) => ({
          reviewId,
          replies: await getRepliesByReviewId(reviewId, reactionAuthContext),
        })),
      );

      if (!isMounted) return;

      const succeeded: { reviewId: string; reviewReplies: readonly ReviewReply[] }[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          succeeded.push({ reviewId: result.value.reviewId, reviewReplies: result.value.replies });
        }
      }

      if (succeeded.length === 0) return;

      setReplies((prev) => {
        const next = { ...prev };
        for (const { reviewId, reviewReplies } of succeeded) {
          next[reviewId] = reviewReplies;
        }
        return next;
      });

      setLoadedReplyReviewIds((prev) => {
        const next = new Set(prev);
        for (const { reviewId } of succeeded) {
          next.add(reviewId);
        }
        return next;
      });
    })();

    return () => {
      isMounted = false;
    };
  }, [editorialReviewIds, loadedReplyReviewIds, reactionAuthContext]);

  useEffect(() => {
    const expandedReviewIds = Object.keys(expandedReplyReviewIds).filter((id) => expandedReplyReviewIds[id]);
    const reviewsNeedingLoad = expandedReviewIds.filter((id) => !loadedReplyReviewIds.has(id));

    if (reviewsNeedingLoad.length === 0) {
      return undefined;
    }

    let isMounted = true;

    (async () => {
      const results: { reviewId: string; reviewReplies: readonly ReviewReply[] }[] = [];
      for (const reviewId of reviewsNeedingLoad) {
        try {
          const reviewReplies = await getRepliesByReviewId(reviewId, reactionAuthContext);
          results.push({ reviewId, reviewReplies });
        } catch {
        }
      }
      if (!isMounted) return;
      if (results.length === 0) return;
      setReplies((currentReplies) => {
        const next = { ...currentReplies };
        for (const { reviewId, reviewReplies } of results) {
          next[reviewId] = reviewReplies;
        }
        return next;
      });
      setLoadedReplyReviewIds((current) => {
        const next = new Set(current);
        for (const { reviewId } of results) {
          next.add(reviewId);
        }
        return next;
      });
    })();

    return () => {
      isMounted = false;
    };
  }, [expandedReplyReviewIds, loadedReplyReviewIds, reactionAuthContext]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <main className="community-reviews-page" aria-labelledby="community-reviews-title">
      <section className="community-reviews-page__hero" aria-labelledby="community-reviews-title">
        <div className="community-reviews-page__hero-background" aria-hidden="true">
          <img data-testid="community-reviews-hero-image" src={communityHeroImage} alt="" />
          <span />
        </div>

        <div className="community-reviews-page__hero-content fade-in">
          <h1 id="community-reviews-title">Reviews de la comunidad</h1>
          <p>
            Opiniones reales de propietarios: kilómetros, uso, pros, contras y experiencias para elegir mejor tu próxima moto.
          </p>
          <div className="community-reviews-page__hero-actions" aria-label="Acciones del hero de reviews">
            <button type="button" onClick={scrollToReviews}>Explorar reviews</button>
            <a href="#community-reviews-garage-header" onClick={scrollToGarageHeader}>Buscar moto para opinar</a>
          </div>
        </div>
      </section>

      <section className="community-reviews-page__editorial" aria-label="Bloque editorial de reviews">
        <div className="community-reviews-page__editorial-grid">
          <div className="community-reviews-page__editorial-main">
            <EditorialReviewSection
              aspectsByReviewId={aspectByReviewId}
              emptyMessage="Todavía no hay reviews destacadas."
              hasReactionAuth={Boolean(reactionAuthContext)}
              id="community-featured-reviews-title"
              onToggleHelpful={toggleHelpful}
              onToggleNotHelpful={toggleNotHelpful}
              reactionPendingIds={reactionPendingIds}
              reactionSummaryByReviewId={reactionSummaryByReviewId}
              reportedReviewIds={reportedReviewIds}
              reportForm={reportForm}
              reportPendingIds={reportPendingIds}
              reviews={featuredReviews}
              title="Reviews destacadas"
              tone="featured"
              userId={user?.id ?? null}
              onOpenReport={openReportForm}
              onCancelReport={cancelReportForm}
              onChangeReportReason={updateReportFormReason}
              onChangeReportComment={updateReportFormComment}
              onSubmitReport={submitReport}
              replies={replies}
              replyForm={replyForm}
              replyToast={replyToast}
              expandedReplyReviewIds={expandedReplyReviewIds}
              user={user}
              onOpenReply={openReplyForm}
              onCancelReply={cancelReplyForm}
              onChangeReplyComment={updateReplyComment}
              onSubmitReply={submitReply}
              onToggleReplyVisibility={toggleReplyVisibility}
              visibleRepliesCount={Object.fromEntries(visibleRepliesCountByReviewId)}
            />
            <EditorialReviewSection
              aspectsByReviewId={aspectByReviewId}
              emptyMessage="Todavía no hay actividad reciente."
              hasReactionAuth={Boolean(reactionAuthContext)}
              id="community-latest-reviews-title"
              onToggleHelpful={toggleHelpful}
              onToggleNotHelpful={toggleNotHelpful}
              reactionPendingIds={reactionPendingIds}
              reactionSummaryByReviewId={reactionSummaryByReviewId}
              reportedReviewIds={reportedReviewIds}
              reportForm={reportForm}
              reportPendingIds={reportPendingIds}
              reviews={latestReviews}
              title="Últimos reportes"
              tone="latest"
              userId={user?.id ?? null}
              onOpenReport={openReportForm}
              onCancelReport={cancelReportForm}
              onChangeReportReason={updateReportFormReason}
              onChangeReportComment={updateReportFormComment}
              onSubmitReport={submitReport}
              replies={replies}
              replyForm={replyForm}
              replyToast={replyToast}
              expandedReplyReviewIds={expandedReplyReviewIds}
              user={user}
              onOpenReply={openReplyForm}
              onCancelReply={cancelReplyForm}
              onChangeReplyComment={updateReplyComment}
              onSubmitReply={submitReply}
              onToggleReplyVisibility={toggleReplyVisibility}
              visibleRepliesCount={Object.fromEntries(visibleRepliesCountByReviewId)}
            />
          </div>

          <CommunityInsightsPanel insights={communityInsights} lastRefreshedAt={lastRefreshedAt} />
        </div>
      </section>

      <div className="community-reviews-page__mobile-filter-trigger">
        <button type="button" onClick={() => setIsFilterPanelOpen(true)}>
          <span className="material-symbols-outlined" aria-hidden="true">tune</span>
          Filtros de reviews
        </button>
      </div>

      <section id="community-reviews-list" className="community-reviews-page__content" aria-label="Garaje de la comunidad">
        <CommunityReviewFiltersPanel
          filters={filters}
          isOpen={isFilterPanelOpen}
          onApply={/* filtros aplican en tiempo real via onChange */ () => setIsFilterPanelOpen(false)}
          onChange={updateFilters}
          onClose={() => setIsFilterPanelOpen(false)}
          onReset={clearFilters}
        />

        <div className="community-reviews-page__results">
          <header id="community-reviews-garage-header" className="community-reviews-page__garage-header">
            <div>
              <h2>Garaje de la comunidad</h2>
              <p>Explora los modelos con opiniones reales de propietarios y entra en cada comunidad para leer todas sus reviews.</p>
            </div>
            <dl aria-label="Resumen del garaje de la comunidad">
              <div>
                <dt>Modelos</dt>
                <dd>{numberFormatter.format(filteredGarageMotorcycles.length)}</dd>
              </div>
              <div>
                <dt>Reviews</dt>
                <dd>{numberFormatter.format(approvedReviews.length)}</dd>
              </div>
            </dl>
          </header>

          {status === 'loading' || status === 'idle' ? (
            <ReviewSkeletonList />
          ) : status === 'error' ? (
            <article className="community-reviews-page__error" role="alert">
              <span className="material-symbols-outlined" aria-hidden="true">warning</span>
              <h2>No se han podido cargar las reviews.</h2>
              <p>{error || 'Inténtalo de nuevo en unos minutos.'}</p>
              <button type="button" onClick={loadReviews}>Reintentar</button>
            </article>
          ) : filteredGarageMotorcycles.length === 0 ? (
            <AccountReviewsEmptyState
              title="No hay motos con reviews para estos filtros"
              description="Prueba a cambiar el segmento, el carnet o la búsqueda para encontrar modelos con opiniones de propietarios."
              onClearFilters={activeFilters ? clearFilters : undefined}
            />
          ) : (
            <>
              <section className="community-reviews-page__garage-grid" aria-label="Modelos con reviews de la comunidad">
                {paginatedGarageMotorcycles.map((item) => (
                  <MotorcycleGarageCard
                    detailHref={item.motorcycle.detailHref}
                    imageAlt={item.motorcycle.name}
                    imageSource={item.motorcycle.imageSource}
                    key={item.motorcycleId}
                    lastReviewDate={item.latestReviewAt}
                    primaryUseLabel={item.topRidingStyle?.label}
                    rating={item.averageRating}
                    reviewCount={item.reviewCount}
                    reviewsHref={item.motorcycle.communityHref}
                    title={item.motorcycle.name}
                  />
                ))}
              </section>
              <AccountPagination
                ariaLabel="Paginación del garaje de comunidad"
                className="community-reviews-page__pagination"
                currentClassName="community-reviews-page__pagination-current"
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </section>
    </main>
  );
}
